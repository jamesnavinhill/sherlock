import {
    GoogleGenAI,
    HarmBlockThreshold,
    HarmCategory,
    Modality,
    Type,
} from '@google/genai';
import type { FeedItem, InvestigationReport, MonitorEvent, Source } from '../../types';
import { getApiKeyOrThrow } from './keys';
import type {
    InvestigationRequest,
    LiveIntelRequest,
    ProviderAdapter,
    ScanAnomaliesRequest,
    TtsRequest,
} from './types';
import { parseJsonWithFallback, toDisplayText } from './shared/jsonParsing';
import {
    dedupeSources,
    extractSourcesFromGrounding,
    extractSourcesFromText,
    normalizeEntities,
    normalizeFeedItems,
    normalizeLiveEvents,
    normalizeStringList,
} from './shared/normalizers';
import {
    buildAnomalyPrompt,
    buildInvestigationPrompt,
    buildLiveIntelPrompt,
} from './shared/prompts';
import { withProviderRetry } from './shared/retry';

const PROVIDER = 'GEMINI' as const;

let aiInstance: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
    if (aiInstance) return aiInstance;

    const key = getApiKeyOrThrow(PROVIDER);
    aiInstance = new GoogleGenAI({ apiKey: key });
    return aiInstance;
};

const SAFETY_SETTINGS = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
];

const supportsStructuredOutput = (modelId: string): boolean => {
    return !modelId.includes('2.5') && !modelId.includes('2-5');
};

const investigate = async (request: InvestigationRequest): Promise<InvestigationReport> => {
    const { topic, parentContext, config, scope, dateOverride } = request;
    const useStructuredOutput = supportsStructuredOutput(config.modelId);

    return withProviderRetry(
        async () => {
            const ai = getAI();
            let basePrompt = buildInvestigationPrompt(topic, scope, config, parentContext, dateOverride);

            if (!useStructuredOutput) {
                basePrompt +=
                    ' CRITICAL: Respond with a JSON object only containing: summary (string), entities (array), agendas (array), leads (array), sources (array of {title, url}).';
            }

            basePrompt +=
                ' Extract at least 4 actionable leads. For each entity, specify: name, type (PERSON/ORGANIZATION/UNKNOWN), role, and sentiment. Include 3-8 unique sources and provide each source as { "title": "...", "url": "https://..." }.';

            const response = await ai.models.generateContent({
                model: config.modelId,
                contents: basePrompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    thinkingConfig:
                        config.thinkingBudget > 0
                            ? { thinkingBudget: config.thinkingBudget }
                            : undefined,
                    ...(useStructuredOutput
                        ? {
                              responseMimeType: 'application/json',
                              responseSchema: {
                                  type: Type.OBJECT,
                                  properties: {
                                      summary: { type: Type.STRING },
                                      entities: {
                                          type: Type.ARRAY,
                                          items: {
                                              type: Type.OBJECT,
                                              properties: {
                                                  name: { type: Type.STRING },
                                                  type: {
                                                      type: Type.STRING,
                                                      enum: ['PERSON', 'ORGANIZATION', 'UNKNOWN'],
                                                  },
                                                  role: { type: Type.STRING },
                                                  sentiment: {
                                                      type: Type.STRING,
                                                      enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'],
                                                  },
                                              },
                                              required: ['name', 'type', 'role', 'sentiment'],
                                          },
                                      },
                                      agendas: {
                                          type: Type.ARRAY,
                                          items: { type: Type.STRING },
                                      },
                                      leads: {
                                          type: Type.ARRAY,
                                          items: { type: Type.STRING },
                                      },
                                      sources: {
                                          type: Type.ARRAY,
                                          items: {
                                              type: Type.OBJECT,
                                              properties: {
                                                  title: { type: Type.STRING },
                                                  url: { type: Type.STRING },
                                              },
                                              required: ['title', 'url'],
                                          },
                                      },
                                  },
                                  required: ['summary', 'entities', 'agendas', 'leads', 'sources'],
                              },
                          }
                        : {}),
                    safetySettings: SAFETY_SETTINGS,
                },
            });

            const rawText = response.text || '{}';
            const parsedData = useStructuredOutput
                ? JSON.parse(rawText)
                : parseJsonWithFallback(rawText);

            const data =
                parsedData && typeof parsedData === 'object'
                    ? (parsedData as {
                          summary?: unknown;
                          entities?: unknown;
                          agendas?: unknown;
                          leads?: unknown;
                          sources?: Array<{ title?: unknown; url?: unknown; uri?: unknown }>;
                      })
                    : {};

            const modelSources = Array.isArray(data.sources)
                ? dedupeSources(
                      data.sources.map((source) => ({
                          title: source.title,
                          url: source.url,
                          uri: source.uri,
                      }))
                  )
                : [];

            const textFallbackSources = extractSourcesFromText(
                [rawText, toDisplayText(data.summary), ...normalizeStringList(data.leads)].join('\n')
            );

            const sources = dedupeSources([
                ...extractSourcesFromGrounding(response),
                ...modelSources,
                ...textFallbackSources,
            ]);

            return {
                topic,
                parentTopic: parentContext?.topic,
                dateStr: new Date().toLocaleDateString(),
                summary: toDisplayText(data.summary).trim() || 'Analysis pending...',
                entities: normalizeEntities(data.entities),
                agendas: normalizeStringList(data.agendas),
                leads: normalizeStringList(data.leads),
                sources,
                rawText: JSON.stringify(data, null, 2),
                config: {
                    provider: config.provider,
                    modelId: config.modelId,
                    persona: config.persona,
                    searchDepth: config.searchDepth,
                    thinkingBudget: config.thinkingBudget,
                },
            };
        },
        {
            provider: PROVIDER,
            modelId: config.modelId,
            operation: 'INVESTIGATE',
        }
    );
};

const scanAnomalies = async (request: ScanAnomaliesRequest): Promise<FeedItem[]> => {
    const { region, category, dateRange, config, scope, options } = request;
    const useStructuredOutput = supportsStructuredOutput(config.modelId);
    const limit = options?.limit || 8;

    return withProviderRetry(
        async () => {
            const ai = getAI();
            const basePrompt = buildAnomalyPrompt({
                region,
                category,
                limit,
                prioritySources: options?.prioritySources || '',
                scope,
                dateRange,
            });

            const jsonInstruction = useStructuredOutput
                ? ''
                : `
CRITICAL: You MUST respond with ONLY a valid JSON array. No other text.
Each item must have: id (string), title (string), category (string), riskLevel ("LOW" | "MEDIUM" | "HIGH")`;

            const response = await ai.models.generateContent({
                model: config.modelId,
                contents: `${basePrompt}\n${jsonInstruction}`,
                config: {
                    ...(useStructuredOutput
                        ? {
                              responseMimeType: 'application/json',
                              responseSchema: {
                                  type: Type.ARRAY,
                                  items: {
                                      type: Type.OBJECT,
                                      properties: {
                                          id: { type: Type.STRING },
                                          title: { type: Type.STRING },
                                          category: { type: Type.STRING },
                                          riskLevel: {
                                              type: Type.STRING,
                                              enum: ['LOW', 'MEDIUM', 'HIGH'],
                                          },
                                      },
                                      required: ['id', 'title', 'category', 'riskLevel'],
                                  },
                              },
                          }
                        : {}),
                    tools: [{ googleSearch: {} }],
                    thinkingConfig:
                        config.thinkingBudget > 0
                            ? { thinkingBudget: config.thinkingBudget }
                            : undefined,
                    safetySettings: SAFETY_SETTINGS,
                },
            });

            const rawText = response.text || '[]';
            const parsed = useStructuredOutput ? JSON.parse(rawText) : parseJsonWithFallback(rawText);

            return normalizeFeedItems(
                parsed,
                scope.categories[0] || 'General',
                new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                'feed'
            );
        },
        {
            provider: PROVIDER,
            modelId: config.modelId,
            operation: 'SCAN_ANOMALIES',
        }
    ).catch((error) => {
        if (error instanceof Error && error.message.includes('MISSING_API_KEY')) throw error;

        const fallbackCategory = scope.categories[1] || 'General';
        return [
            {
                id: '1',
                title: `Notable development in ${fallbackCategory}`,
                category: fallbackCategory,
                timestamp: '10:42 AM',
                riskLevel: 'HIGH',
            },
            {
                id: '2',
                title: 'Emerging pattern detected',
                category: scope.categories[2] || 'Analysis',
                timestamp: '09:15 AM',
                riskLevel: 'MEDIUM',
            },
            {
                id: '3',
                title: 'New information surfaced',
                category: scope.categories[0] || 'General',
                timestamp: '08:30 AM',
                riskLevel: 'HIGH',
            },
        ].slice(0, limit);
    });
};

const getLiveIntel = async (request: LiveIntelRequest): Promise<MonitorEvent[]> => {
    const { topic, config, scope, monitorConfig, existingContent } = request;
    const useStructuredOutput = supportsStructuredOutput(config.modelId);

    return withProviderRetry(
        async () => {
            const ai = getAI();
            const basePrompt = buildLiveIntelPrompt({
                topic,
                monitorConfig,
                scope,
                existingContent,
            });

            const jsonInstruction = useStructuredOutput
                ? ''
                : 'CRITICAL: Respond with ONLY a valid JSON array. Items: id, type, sourceName, content, timestamp, sentiment, threatLevel ("INFO" | "CAUTION" | "CRITICAL"), url (opt)';

            const response = await ai.models.generateContent({
                model: config.modelId,
                contents: `${basePrompt}\n${jsonInstruction}`,
                config: {
                    ...(useStructuredOutput
                        ? {
                              responseMimeType: 'application/json',
                              responseSchema: {
                                  type: Type.ARRAY,
                                  items: {
                                      type: Type.OBJECT,
                                      properties: {
                                          id: { type: Type.STRING },
                                          type: {
                                              type: Type.STRING,
                                              enum: ['SOCIAL', 'NEWS', 'OFFICIAL'],
                                          },
                                          sourceName: { type: Type.STRING },
                                          content: { type: Type.STRING },
                                          timestamp: { type: Type.STRING },
                                          sentiment: {
                                              type: Type.STRING,
                                              enum: ['NEGATIVE', 'NEUTRAL', 'POSITIVE'],
                                          },
                                          threatLevel: {
                                              type: Type.STRING,
                                              enum: ['INFO', 'CAUTION', 'CRITICAL'],
                                          },
                                          url: { type: Type.STRING },
                                      },
                                      required: [
                                          'id',
                                          'type',
                                          'sourceName',
                                          'content',
                                          'timestamp',
                                          'sentiment',
                                          'threatLevel',
                                      ],
                                  },
                              },
                          }
                        : {}),
                    tools: [{ googleSearch: {} }],
                    safetySettings: SAFETY_SETTINGS,
                },
            });

            const rawText = response.text || '[]';
            const parsed = useStructuredOutput ? JSON.parse(rawText) : parseJsonWithFallback(rawText);
            return normalizeLiveEvents(parsed, 'sim');
        },
        {
            provider: PROVIDER,
            modelId: config.modelId,
            operation: 'LIVE_INTEL',
        }
    ).catch((error) => {
        if (error instanceof Error && error.message.includes('MISSING_API_KEY')) throw error;

        const now = Date.now();
        return [
            {
                id: `sim-${now}-1`,
                type: 'NEWS',
                sourceName: 'News Source',
                content: `New developments regarding ${topic}.`,
                timestamp: '5m ago',
                sentiment: 'NEGATIVE',
                threatLevel: 'CAUTION',
            },
            {
                id: `sim-${now}-2`,
                type: 'SOCIAL',
                sourceName: 'Social Media',
                content: `Discussion emerging about ${topic}.`,
                timestamp: '12m ago',
                sentiment: 'NEGATIVE',
                threatLevel: 'CRITICAL',
            },
            {
                id: `sim-${now}-3`,
                type: 'OFFICIAL',
                sourceName: 'Official Source',
                content: 'Related announcement published.',
                timestamp: '1h ago',
                sentiment: 'NEUTRAL',
                threatLevel: 'INFO',
            },
        ];
    });
};

const generateAudioBriefing = async (request: TtsRequest): Promise<string> => {
    const { text } = request;
    const briefingText = text.length > 800 ? `${text.substring(0, 800)}...` : text;

    return withProviderRetry(
        async () => {
            const ai = getAI();
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: `Read this investigative summary clearly and professionally: ${briefingText}`,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
            });

            const base64Audio =
                response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) throw new Error('UPSTREAM_ERROR: No audio data returned');
            return base64Audio;
        },
        {
            provider: PROVIDER,
            modelId: request.config.modelId,
            operation: 'TTS',
        }
    );
};

export const geminiProvider: ProviderAdapter = {
    provider: PROVIDER,
    investigate,
    scanAnomalies,
    getLiveIntel,
    generateAudioBriefing,
};

export const resetGeminiProviderClient = (): void => {
    aiInstance = null;
};

export const collectSourcesFromGeminiResponse = (
    response: unknown,
    rawText: string,
    data: {
        summary?: unknown;
        leads?: unknown;
        sources?: Array<{ title?: unknown; url?: unknown; uri?: unknown }>;
    }
): Source[] => {
    const modelSources = Array.isArray(data.sources)
        ? dedupeSources(
              data.sources.map((source) => ({
                  title: source.title,
                  url: source.url,
                  uri: source.uri,
              }))
          )
        : [];

    const textFallbackSources = extractSourcesFromText(
        [rawText, toDisplayText(data.summary), ...normalizeStringList(data.leads)].join('\n')
    );

    return dedupeSources([
        ...extractSourcesFromGrounding(response),
        ...modelSources,
        ...textFallbackSources,
    ]);
};
