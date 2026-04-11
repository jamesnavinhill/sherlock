import { GoogleGenAI, HarmBlockThreshold, HarmCategory, Modality, Type } from '@google/genai';
import type { FeedItem, Artifact, MonitorEvent, Source } from '../../types';
import { getApiKeyOrThrow } from './keys';
import type {
  BoardAgentProviderRequest,
  BoardAgentStreamOptions,
  ChatRequest,
  ChatStreamOptions,
  InvestigationRequest,
  LiveIntelRequest,
  ProviderAdapter,
  ScanAnomaliesRequest,
  StructuredArtifactPayload,
  TtsRequest,
} from './types';
import { parseJsonWithFallback, toDisplayText } from './shared/jsonParsing';
import {
  dedupeSources,
  extractSourcesFromGrounding,
  extractSourcesFromText,
  normalizeStringList,
} from './shared/normalizers';
import { normalizeTopicText } from '../../utils/textNormalization';
import {
  buildAnomalyPrompt,
  buildInvestigationPrompt,
  buildLiveIntelPrompt,
  buildStructuredArtifactResponseInstruction,
} from './shared/prompts';
import {
  buildWorkspaceChatPrompt,
  buildWorkspaceChatPromptWithFormat,
  normalizeChatResponse,
} from './shared/chat';
import { withProviderRetry } from './shared/retry';
import { createChatStreamAccumulator } from './shared/streaming';
import { getCachedGeminiClient, setCachedGeminiClient } from './geminiClientState';
import { buildArtifactFromPayload } from './shared/artifactContract';
import {
  buildBoardAgentPromptWithFormat,
  createBoardAgentStreamAccumulator,
  normalizeBoardAgentResponse,
} from './shared/boardAgent';
import { buildFallbackFeedItems, buildFallbackLiveEvents } from './shared/fallbacks';
import {
  normalizeLiveIntelPayload,
  normalizeScanResultPayload,
  withSimulatedProviderFallback,
} from './shared/situationalIntel';

const PROVIDER = 'GEMINI' as const;

const getAI = (): GoogleGenAI => {
  const cached = getCachedGeminiClient<GoogleGenAI>();
  if (cached) return cached;

  const key = getApiKeyOrThrow(PROVIDER);
  const ai = new GoogleGenAI({ apiKey: key });
  setCachedGeminiClient(ai);
  return ai;
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

const supportsStructuredOutput = (_modelId: string): boolean => true;

const investigate = async (request: InvestigationRequest): Promise<Artifact> => {
  const { topic, parentContext, config, scope, dateOverride } = request;
  const normalizedTopic = normalizeTopicText(topic);
  const normalizedParentTopic = parentContext?.topic
    ? normalizeTopicText(parentContext.topic, '')
    : undefined;
  const normalizedParentContext = parentContext
    ? {
        ...parentContext,
        topic: normalizedParentTopic || parentContext.topic,
      }
    : undefined;
  const useStructuredOutput = supportsStructuredOutput(config.modelId);
  const generationMode = request.generationMode || config.generationMode || 'STAGED';

  return withProviderRetry(
    async () => {
      const ai = getAI();
      let basePrompt = buildInvestigationPrompt(
        normalizedTopic,
        scope,
        config,
        normalizedParentContext,
        dateOverride,
        request.purpose,
        request.pack
      );

      basePrompt += ` ${buildStructuredArtifactResponseInstruction(
        request.purpose,
        request.labelProfileId,
        generationMode
      )}`;
      if (!useStructuredOutput) {
        basePrompt +=
          '\nFINAL OUTPUT RULE: Return ONLY the JSON object. Do not wrap it in markdown fences. Do not add commentary before or after the JSON.';
      }

      const response = await ai.models.generateContent({
        model: config.modelId,
        contents: basePrompt,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig:
            config.thinkingBudget > 0 ? { thinkingBudget: config.thinkingBudget } : undefined,
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
                    keyFindings: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          summary: { type: Type.STRING },
                          supportRefs: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                        },
                        required: ['title', 'summary'],
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
                    sections: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          kind: { type: Type.STRING },
                          title: { type: Type.STRING },
                          content: { type: Type.STRING },
                          items: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                        },
                        required: ['kind', 'title'],
                      },
                    },
                  },
                  required: ['summary', 'entities', 'keyFindings', 'agendas', 'leads', 'sources'],
                },
              }
            : {}),
          safetySettings: SAFETY_SETTINGS,
        },
      });

      const rawText = response.text || '{}';
      const parsedData = parseJsonWithFallback(rawText);

      const data =
        parsedData && typeof parsedData === 'object'
          ? (parsedData as StructuredArtifactPayload)
          : {};
      const sources = collectSourcesFromGeminiResponse(response, rawText, data);

      return buildArtifactFromPayload(data, JSON.stringify(data, null, 2), {
        provider: PROVIDER,
        modelId: config.modelId,
        topic: normalizedTopic,
        scopeId: scope.id,
        scopeName: scope.name,
        pack: request.pack,
        purpose: request.purpose,
        artifactType: request.artifactType,
        labelProfileId: request.labelProfileId,
        generationMode,
        extraSources: sources,
        extraMetadata: {
          persona: config.persona,
          searchDepth: config.searchDepth,
          thinkingBudget: config.thinkingBudget,
        },
        searchMetadata: {
          enabled: true,
          provider: 'GOOGLE',
        },
      });
    },
    {
      provider: PROVIDER,
      modelId: config.modelId,
      operation: 'INVESTIGATE',
    }
  );
};

const chat = async (request: ChatRequest) => {
  const { config } = request;
  const useStructuredOutput = supportsStructuredOutput(config.modelId);

  return withProviderRetry(
    async () => {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: config.modelId,
        contents: buildWorkspaceChatPrompt(request),
        config: {
          ...(useStructuredOutput
            ? {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    content: { type: Type.STRING },
                    citations: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    suggestedTitle: { type: Type.STRING },
                  },
                  required: ['content', 'citations'],
                },
              }
            : {}),
          thinkingConfig:
            config.thinkingBudget > 0 ? { thinkingBudget: config.thinkingBudget } : undefined,
          safetySettings: SAFETY_SETTINGS,
        },
      });

      return normalizeChatResponse(response.text || '', PROVIDER, config.modelId);
    },
    {
      provider: PROVIDER,
      modelId: config.modelId,
      operation: 'CHAT',
    }
  );
};

const streamChat = async (request: ChatRequest, options?: ChatStreamOptions) => {
  const { config } = request;

  return withProviderRetry(
    async () => {
      const ai = getAI();
      const accumulator = createChatStreamAccumulator(options);
      accumulator.start();
      const stream = await ai.models.generateContentStream({
        model: config.modelId,
        contents: buildWorkspaceChatPromptWithFormat(request, 'tagged'),
        config: {
          thinkingConfig:
            config.thinkingBudget > 0 ? { thinkingBudget: config.thinkingBudget } : undefined,
          safetySettings: SAFETY_SETTINGS,
        },
      });

      for await (const chunk of stream) {
        accumulator.push(chunk.text || '');
      }

      return normalizeChatResponse(accumulator.complete(), PROVIDER, config.modelId);
    },
    {
      provider: PROVIDER,
      modelId: config.modelId,
      operation: 'CHAT',
    }
  );
};

const boardAgent = async (request: BoardAgentProviderRequest) => {
  const { config } = request;
  const useStructuredOutput = supportsStructuredOutput(config.modelId);

  return withProviderRetry(
    async () => {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: config.modelId,
        contents: buildBoardAgentPromptWithFormat(request, 'json'),
        config: {
          ...(useStructuredOutput
            ? {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    message: { type: Type.STRING },
                    actions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING },
                          rationale: { type: Type.STRING },
                        },
                        required: ['type'],
                      },
                    },
                    suggestedTitle: { type: Type.STRING },
                  },
                  required: ['message', 'actions'],
                },
              }
            : {}),
          thinkingConfig:
            config.thinkingBudget > 0 ? { thinkingBudget: config.thinkingBudget } : undefined,
          safetySettings: SAFETY_SETTINGS,
        },
      });

      return normalizeBoardAgentResponse(response.text || '', PROVIDER, config.modelId);
    },
    {
      provider: PROVIDER,
      modelId: config.modelId,
      operation: 'BOARD_AGENT',
    }
  );
};

const streamBoardAgent = async (
  request: BoardAgentProviderRequest,
  options?: BoardAgentStreamOptions
) => {
  const { config } = request;

  return withProviderRetry(
    async () => {
      const ai = getAI();
      const accumulator = createBoardAgentStreamAccumulator(PROVIDER, config.modelId, options);
      accumulator.start();
      const stream = await ai.models.generateContentStream({
        model: config.modelId,
        contents: buildBoardAgentPromptWithFormat(request, 'tagged'),
        config: {
          thinkingConfig:
            config.thinkingBudget > 0 ? { thinkingBudget: config.thinkingBudget } : undefined,
          safetySettings: SAFETY_SETTINGS,
        },
      });

      for await (const chunk of stream) {
        accumulator.push(chunk.text || '');
      }

      return accumulator.complete();
    },
    {
      provider: PROVIDER,
      modelId: config.modelId,
      operation: 'BOARD_AGENT',
    }
  );
};

const scanAnomalies = async (request: ScanAnomaliesRequest): Promise<FeedItem[]> => {
  const { region, category, dateRange, config, scope, options } = request;
  const useStructuredOutput = supportsStructuredOutput(config.modelId);
  const limit = options?.limit || 8;

  return withSimulatedProviderFallback(
    () =>
      withProviderRetry(
        async () => {
          const ai = getAI();
          const basePrompt = buildAnomalyPrompt({
            region,
            category,
            limit,
            prioritySources: options?.prioritySources || '',
            scope,
            pack: request.pack,
            purpose: request.purpose,
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
                config.thinkingBudget > 0 ? { thinkingBudget: config.thinkingBudget } : undefined,
              safetySettings: SAFETY_SETTINGS,
            },
          });

          const rawText = response.text || '[]';
          const parsed = parseJsonWithFallback(rawText);

          return normalizeScanResultPayload(parsed, scope);
        },
        {
          provider: PROVIDER,
          modelId: config.modelId,
          operation: 'SCAN_ANOMALIES',
        }
      ),
    () => buildFallbackFeedItems(scope, limit)
  );
};

const getLiveIntel = async (request: LiveIntelRequest): Promise<MonitorEvent[]> => {
  const { topic, config, scope, monitorConfig, existingContent } = request;
  const normalizedTopic = normalizeTopicText(topic);
  const useStructuredOutput = supportsStructuredOutput(config.modelId);

  return withSimulatedProviderFallback(
    () =>
      withProviderRetry(
        async () => {
          const ai = getAI();
          const basePrompt = buildLiveIntelPrompt({
            topic: normalizedTopic,
            monitorConfig,
            scope,
            pack: request.pack,
            purpose: request.purpose,
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
          const parsed = parseJsonWithFallback(rawText);
          return normalizeLiveIntelPayload(parsed);
        },
        {
          provider: PROVIDER,
          modelId: config.modelId,
          operation: 'LIVE_INTEL',
        }
      ),
    () => buildFallbackLiveEvents(normalizedTopic)
  );
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

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
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
  chat,
  streamChat,
  boardAgent,
  streamBoardAgent,
  scanAnomalies,
  getLiveIntel,
  generateAudioBriefing,
};

export { resetGeminiProviderClient } from './geminiClientState';

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
