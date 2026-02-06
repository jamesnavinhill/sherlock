import type { FeedItem, InvestigationReport, MonitorEvent } from '../../types';
import { getApiKeyOrThrow } from './keys';
import type {
    InvestigationRequest,
    LiveIntelRequest,
    ProviderAdapter,
    ScanAnomaliesRequest,
} from './types';
import { parseJsonWithFallback, toDisplayText } from './shared/jsonParsing';
import {
    dedupeSources,
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

const PROVIDER = 'OPENROUTER' as const;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const normalizeOpenRouterContent = (content: unknown): string => toDisplayText(content).trim();

const queryOpenRouter = async (
    modelId: string,
    prompt: string,
    options?: { expectJson?: boolean; maxTokens?: number }
): Promise<string> => {
    const key = getApiKeyOrThrow(PROVIDER);

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer':
                typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
            'X-Title': 'Sherlock AI',
        },
        body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: prompt }],
            ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
            ...(options?.expectJson ? { response_format: { type: 'json_object' } } : {}),
        }),
    });

    const rawBody = await response.text();
    let payload: {
        error?: { message?: string };
        choices?: Array<{
            message?: { content?: unknown; reasoning?: unknown; refusal?: unknown };
            text?: unknown;
            finish_reason?: string;
        }>;
    } = {};

    try {
        payload = JSON.parse(rawBody) as typeof payload;
    } catch {
        if (!response.ok) {
            throw new Error(`UPSTREAM_ERROR: OpenRouter request failed with status ${response.status}`);
        }
    }

    if (!response.ok) {
        throw new Error(
            payload.error?.message ||
                `UPSTREAM_ERROR: OpenRouter request failed with status ${response.status}`
        );
    }

    const firstChoice = payload.choices?.[0];
    const content =
        normalizeOpenRouterContent(firstChoice?.message?.content) ||
        normalizeOpenRouterContent(firstChoice?.message?.reasoning) ||
        normalizeOpenRouterContent(firstChoice?.message?.refusal) ||
        normalizeOpenRouterContent(firstChoice?.text) ||
        normalizeOpenRouterContent(payload);

    if (!content) {
        throw new Error(
            `UPSTREAM_ERROR: OpenRouter returned an empty response (finish_reason: ${firstChoice?.finish_reason || 'unknown'})`
        );
    }

    return content;
};

const investigate = async (request: InvestigationRequest): Promise<InvestigationReport> => {
    const { topic, parentContext, config, scope, dateOverride } = request;

    return withProviderRetry(
        async () => {
            let prompt = buildInvestigationPrompt(topic, scope, config, parentContext, dateOverride);
            prompt +=
                '\nCRITICAL: Respond with a JSON object only containing summary (string), entities (array), agendas (array), leads (array), and sources (array of {title, url}).';
            prompt +=
                ' Extract at least 4 actionable leads. For each entity, specify: name, type (PERSON/ORGANIZATION/UNKNOWN), role, and sentiment. Include 3-8 unique sources and provide each source as { "title": "...", "url": "https://..." }.';

            const rawText = await queryOpenRouter(config.modelId, prompt, {
                maxTokens: 3200,
            });
            const parsedData = parseJsonWithFallback(rawText);
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

            const sources = dedupeSources([...modelSources, ...textFallbackSources]);

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
    const limit = options?.limit || 8;

    return withProviderRetry(
        async () => {
            const basePrompt = buildAnomalyPrompt({
                region,
                category,
                limit,
                prioritySources: options?.prioritySources || '',
                scope,
                dateRange,
            });

            const rawText = await queryOpenRouter(config.modelId, basePrompt, {
                maxTokens: 1800,
            });
            const parsed = parseJsonWithFallback(rawText);
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

    return withProviderRetry(
        async () => {
            const basePrompt = buildLiveIntelPrompt({
                topic,
                scope,
                monitorConfig,
                existingContent,
            });

            const rawText = await queryOpenRouter(config.modelId, basePrompt, {
                maxTokens: 2200,
            });
            const parsed = parseJsonWithFallback(rawText);
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

export const openRouterProvider: ProviderAdapter = {
    provider: PROVIDER,
    investigate,
    scanAnomalies,
    getLiveIntel,
};
