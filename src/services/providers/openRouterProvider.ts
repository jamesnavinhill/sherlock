import type { FeedItem, InvestigationReport, MonitorEvent } from '../../types';
import { buildArtifactSections } from '../../domain';
import { getApiKeyOrThrow } from './keys';
import type {
    ChatRequest,
    ChatStreamOptions,
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
    buildStructuredArtifactResponseInstruction,
} from './shared/prompts';
import { buildWorkspaceChatPrompt, buildWorkspaceChatPromptWithFormat, normalizeChatResponse } from './shared/chat';
import { withProviderRetry } from './shared/retry';
import { normalizeTopicText } from '../../utils/textNormalization';
import { createChatStreamAccumulator, readSseStream } from './shared/streaming';

const PROVIDER = 'OPENROUTER' as const;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const normalizeOpenRouterContent = (content: unknown): string => toDisplayText(content).trim();

const queryOpenRouter = async (
    modelId: string,
    prompt: string,
    options?: { expectJson?: boolean; maxTokens?: number; signal?: AbortSignal }
): Promise<string> => {
    const key = getApiKeyOrThrow(PROVIDER);

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        signal: options?.signal,
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

const streamOpenRouter = async (
    modelId: string,
    prompt: string,
    options?: ChatStreamOptions & { maxTokens?: number }
): Promise<string> => {
    const key = getApiKeyOrThrow(PROVIDER);
    const accumulator = createChatStreamAccumulator(options);
    accumulator.start();

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        signal: options?.signal,
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
            stream: true,
        }),
    });

    if (!response.ok) {
        const rawBody = await response.text();
        let payload: { error?: { message?: string } } = {};

        try {
            payload = JSON.parse(rawBody) as typeof payload;
        } catch {
            // Fall through to generic error.
        }

        throw new Error(
            payload.error?.message ||
                `UPSTREAM_ERROR: OpenRouter request failed with status ${response.status}`
        );
    }

    await readSseStream(response, (event) => {
        if (event.data === '[DONE]') return;

        try {
            const payload = JSON.parse(event.data) as {
                choices?: Array<{
                    delta?: { content?: unknown };
                    message?: { content?: unknown };
                    text?: unknown;
                }>;
            };
            const delta = toDisplayText(
                payload.choices?.[0]?.delta?.content ??
                    payload.choices?.[0]?.message?.content ??
                    payload.choices?.[0]?.text
            );
            accumulator.push(delta);
        } catch {
            // Ignore malformed partial events and rely on the final response parse.
        }
    });

    return accumulator.complete();
};

const investigate = async (request: InvestigationRequest): Promise<InvestigationReport> => {
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

    return withProviderRetry(
        async () => {
            let prompt = buildInvestigationPrompt(
                normalizedTopic,
                scope,
                config,
                normalizedParentContext,
                dateOverride,
                request.purpose,
                request.pack
            );
            prompt += `\n${buildStructuredArtifactResponseInstruction(
                request.purpose,
                request.labelProfileId
            )}`;

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
                          sections?: unknown;
                      })
                    : {};

            const agendas = normalizeStringList(data.agendas);
            const leads = normalizeStringList(data.leads);
            const summary = toDisplayText(data.summary).trim() || 'Analysis pending...';
            const sections = buildArtifactSections({
                sections: data.sections,
                summary,
                agendas,
                leads,
                artifactType: request.artifactType,
            });

            const modelSources = Array.isArray(data.sources)
                ? dedupeSources(
                      data.sources.map((source) => ({
                          title: source.title,
                          url: source.url,
                          uri: source.uri,
                      }))
                  )
                : [];

            const textFallbackSources = extractSourcesFromText([rawText, summary, ...leads].join('\n'));

            const sources = dedupeSources([...modelSources, ...textFallbackSources]);

            return {
                topic: normalizedTopic,
                parentTopic: normalizedParentTopic || undefined,
                dateStr: new Date().toLocaleDateString(),
                summary,
                entities: normalizeEntities(data.entities),
                agendas,
                leads,
                followUps: leads,
                sections,
                artifactType: request.artifactType,
                sources,
                rawText: JSON.stringify(data, null, 2),
                packId: request.pack.id,
                purposeId: request.purpose.id,
                labelProfileId: request.labelProfileId,
                metadata: {
                    packName: request.pack.name,
                    purposeName: request.purpose.name,
                    scopeId: scope.id,
                    workspaceMode: request.pack.workspaceMode,
                },
                config: {
                    provider: config.provider,
                    modelId: config.modelId,
                    persona: config.persona,
                    searchDepth: config.searchDepth,
                    thinkingBudget: config.thinkingBudget,
                    scopeId: scope.id,
                    scopeName: scope.name,
                    packId: request.pack.id,
                    packName: request.pack.name,
                    purposeId: request.purpose.id,
                    purposeName: request.purpose.name,
                    artifactType: request.artifactType,
                    labelProfileId: request.labelProfileId,
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

const chat = async (request: ChatRequest) => {
    const { config } = request;

    return withProviderRetry(
        async () => {
            const rawText = await queryOpenRouter(config.modelId, buildWorkspaceChatPrompt(request), {
                maxTokens: 2200,
            });

            return normalizeChatResponse(rawText, PROVIDER, config.modelId);
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
            const rawText = await streamOpenRouter(
                config.modelId,
                buildWorkspaceChatPromptWithFormat(request, 'tagged'),
                {
                    ...options,
                    maxTokens: 2200,
                }
            );

            return normalizeChatResponse(rawText, PROVIDER, config.modelId);
        },
        {
            provider: PROVIDER,
            modelId: config.modelId,
            operation: 'CHAT',
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
                pack: request.pack,
                purpose: request.purpose,
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
    const normalizedTopic = normalizeTopicText(topic);

    return withProviderRetry(
        async () => {
            const basePrompt = buildLiveIntelPrompt({
                topic: normalizedTopic,
                scope,
                pack: request.pack,
                purpose: request.purpose,
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
                content: `New developments regarding ${normalizedTopic}.`,
                timestamp: '5m ago',
                sentiment: 'NEGATIVE',
                threatLevel: 'CAUTION',
            },
            {
                id: `sim-${now}-2`,
                type: 'SOCIAL',
                sourceName: 'Social Media',
                content: `Discussion emerging about ${normalizedTopic}.`,
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
    chat,
    streamChat,
    scanAnomalies,
    getLiveIntel,
};
