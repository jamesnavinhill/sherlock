import type {
  FeedItem,
  Artifact,
  MonitorEvent,
  ArtifactEvidence,
  ArtifactProvenance,
} from '../../types';
import { getEffectiveModelCapabilities } from '../../config/aiModels';
import { getApiKeyOrThrow } from './keys';
import type {
  ChatRequest,
  ChatStreamOptions,
  InvestigationRequest,
  LiveIntelRequest,
  ProviderAdapter,
  ProviderMessage,
  ScanAnomaliesRequest,
  StructuredArtifactPayload,
} from './types';
import { parseJsonWithFallback, toDisplayText } from './shared/jsonParsing';
import { normalizeFeedItems, normalizeLiveEvents } from './shared/normalizers';
import {
  buildAnomalyPrompt,
  buildInvestigationPrompt,
  buildLiveIntelPrompt,
  buildStructuredArtifactResponseInstruction,
} from './shared/prompts';
import { buildWorkspaceChatMessages, normalizeChatResponse } from './shared/chat';
import { withProviderRetry } from './shared/retry';
import { normalizeTopicText } from '../../utils/textNormalization';
import { createChatStreamAccumulator, readSseStream } from './shared/streaming';
import { buildArtifactFromPayload } from './shared/artifactContract';

const PROVIDER = 'OPENROUTER' as const;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterToolDefinition {
  type: 'openrouter:web_search';
  parameters?: Record<string, unknown>;
}

interface OpenRouterUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  server_tool_use?: {
    web_search_requests?: number;
  };
  [key: string]: unknown;
}

interface OpenRouterCompletionResult {
  rawText: string;
  requestId?: string;
  citations: ArtifactProvenance['citations'];
  usage?: OpenRouterUsage;
  warnings: string[];
}

const buildSystemPrompt = (task: string): string => {
  return `You are Sherlock's runtime research engine.\n\n${task}`;
};

const toMessageContent = (content: unknown): string => toDisplayText(content).trim();

const normalizeOpenRouterMessages = (messages: ProviderMessage[]): ProviderMessage[] => {
  return messages
    .map((message) => ({
      ...message,
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0);
};

const toSearchEvidence = (citations: ArtifactProvenance['citations']): ArtifactEvidence[] =>
  (citations || []).map((citation, index) => ({
    id: `openrouter-citation-${index}`,
    kind: citation.content ? 'QUOTE' : 'SOURCE',
    title: citation.title || citation.url,
    summary: citation.content || citation.title || citation.url,
    quote: citation.content,
    sourceTitle: citation.title,
    sourceUrl: citation.url,
    order: index,
  }));

const extractAnnotations = (message: {
  annotations?: Array<{
    type?: unknown;
    url_citation?: {
      url?: unknown;
      title?: unknown;
      content?: unknown;
      start_index?: unknown;
      end_index?: unknown;
    };
  }>;
}): ArtifactProvenance['citations'] => {
  if (!Array.isArray(message.annotations)) return [];

  return message.annotations
    .map((annotation) => {
      if (annotation?.type !== 'url_citation' || !annotation.url_citation) return null;
      const url = toDisplayText(annotation.url_citation.url).trim();
      if (!url) return null;

      return {
        url,
        title: toDisplayText(annotation.url_citation.title).trim() || undefined,
        content: toDisplayText(annotation.url_citation.content).trim() || undefined,
        startIndex:
          typeof annotation.url_citation.start_index === 'number'
            ? annotation.url_citation.start_index
            : undefined,
        endIndex:
          typeof annotation.url_citation.end_index === 'number'
            ? annotation.url_citation.end_index
            : undefined,
      };
    })
    .filter((citation): citation is NonNullable<typeof citation> => !!citation);
};

const buildOpenRouterSearchTool = (
  requestConfig: InvestigationRequest['config']
): { tool?: OpenRouterToolDefinition; warnings: string[] } => {
  const settings = requestConfig.openRouter;
  if (!settings?.webSearchEnabled) {
    return { warnings: [] };
  }

  const warnings: string[] = [];
  let allowedDomains = settings.allowedDomains.filter((entry) => entry.trim().length > 0);
  let excludedDomains = settings.excludedDomains.filter((entry) => entry.trim().length > 0);

  if (
    settings.engine === 'firecrawl' &&
    (allowedDomains.length > 0 || excludedDomains.length > 0)
  ) {
    warnings.push(
      'Firecrawl search does not support domain filters, so Sherlock dropped those filters for this request.'
    );
    allowedDomains = [];
    excludedDomains = [];
  }

  if (
    (settings.engine === 'parallel' || settings.engine === 'native') &&
    allowedDomains.length > 0 &&
    excludedDomains.length > 0
  ) {
    warnings.push(
      'The selected OpenRouter search engine cannot use allowed and excluded domains together, so Sherlock kept allowed domains and dropped excluded domains.'
    );
    excludedDomains = [];
  }

  const parameters: Record<string, unknown> = {
    engine: settings.engine,
    max_results: settings.maxResults,
    max_total_results: settings.maxTotalResults,
    search_context_size: settings.searchContextSize,
    user_location: {
      type: 'approximate',
      country: 'US',
      timezone: 'America/New_York',
    },
  };

  if (allowedDomains.length > 0) {
    parameters.allowed_domains = allowedDomains;
  }
  if (excludedDomains.length > 0) {
    parameters.excluded_domains = excludedDomains;
  }

  return {
    tool: {
      type: 'openrouter:web_search',
      parameters,
    },
    warnings,
  };
};

const queryOpenRouter = async (
  modelId: string,
  messages: ProviderMessage[],
  options?: {
    expectJson?: boolean;
    maxTokens?: number;
    signal?: AbortSignal;
    tools?: OpenRouterToolDefinition[];
    warnings?: string[];
  }
): Promise<OpenRouterCompletionResult> => {
  const key = getApiKeyOrThrow(PROVIDER);
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    signal: options?.signal,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
      'X-OpenRouter-Title': 'Sherlock AI',
    },
    body: JSON.stringify({
      model: modelId,
      messages: normalizeOpenRouterMessages(messages),
      ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
      ...(options?.expectJson ? { response_format: { type: 'json_object' } } : {}),
      ...(options?.tools?.length ? { tools: options.tools } : {}),
    }),
  });

  const rawBody = await response.text();
  let payload: {
    id?: string;
    error?: { message?: string };
    usage?: OpenRouterUsage;
    choices?: Array<{
      message?: {
        content?: unknown;
        reasoning?: unknown;
        refusal?: unknown;
        annotations?: Array<{
          type?: unknown;
          url_citation?: {
            url?: unknown;
            title?: unknown;
            content?: unknown;
            start_index?: unknown;
            end_index?: unknown;
          };
        }>;
      };
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
  const message = firstChoice?.message || {};
  const rawText =
    toMessageContent(message.content) ||
    toMessageContent(message.reasoning) ||
    toMessageContent(message.refusal) ||
    toMessageContent(firstChoice?.text);

  if (!rawText) {
    throw new Error(
      `UPSTREAM_ERROR: OpenRouter returned an empty response (finish_reason: ${firstChoice?.finish_reason || 'unknown'})`
    );
  }

  return {
    rawText,
    requestId: payload.id,
    citations: extractAnnotations(message),
    usage: payload.usage,
    warnings: options?.warnings || [],
  };
};

const streamOpenRouter = async (
  modelId: string,
  messages: ProviderMessage[],
  options?: ChatStreamOptions & {
    maxTokens?: number;
    tools?: OpenRouterToolDefinition[];
    warnings?: string[];
  }
): Promise<OpenRouterCompletionResult> => {
  const key = getApiKeyOrThrow(PROVIDER);
  const accumulator = createChatStreamAccumulator(options);
  accumulator.start();
  const warnings = options?.warnings || [];
  let requestId: string | undefined;
  let usage: OpenRouterUsage | undefined;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    signal: options?.signal,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
      'X-OpenRouter-Title': 'Sherlock AI',
    },
    body: JSON.stringify({
      model: modelId,
      messages: normalizeOpenRouterMessages(messages),
      ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
      ...(options?.tools?.length ? { tools: options.tools } : {}),
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
        id?: string;
        usage?: OpenRouterUsage;
        choices?: Array<{
          delta?: { content?: unknown };
          message?: { content?: unknown };
          text?: unknown;
        }>;
      };

      requestId = payload.id || requestId;
      if (payload.usage) {
        usage = payload.usage;
      }

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

  return {
    rawText: accumulator.complete(),
    requestId,
    citations: [],
    usage,
    warnings,
  };
};

const buildArtifactMessages = (prompt: string): ProviderMessage[] => [
  {
    role: 'system',
    content: buildSystemPrompt(
      'Follow the user task exactly and return valid JSON when instructed.'
    ),
  },
  { role: 'user', content: prompt },
];

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
  const capabilities = getEffectiveModelCapabilities(config.modelId);
  const generationMode = request.generationMode || config.generationMode || 'STAGED';

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
        request.labelProfileId,
        generationMode
      )}`;

      const search = buildOpenRouterSearchTool(config);
      const completion = await queryOpenRouter(config.modelId, buildArtifactMessages(prompt), {
        maxTokens: generationMode === 'STAGED' ? 5200 : 3600,
        expectJson: capabilities.supportsStructuredOutput,
        tools: search.tool ? [search.tool] : undefined,
        warnings: search.warnings,
      });

      const parsedData = parseJsonWithFallback(completion.rawText);
      const payload =
        parsedData && typeof parsedData === 'object'
          ? (parsedData as StructuredArtifactPayload)
          : {};

      return buildArtifactFromPayload(payload, JSON.stringify(payload, null, 2), {
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
        citations: completion.citations,
        extraEvidence: toSearchEvidence(completion.citations),
        usage: completion.usage,
        requestId: completion.requestId,
        warnings: completion.warnings,
        searchMetadata: {
          enabled: !!config.openRouter?.webSearchEnabled,
          provider: 'OPENROUTER',
          engine: config.openRouter?.engine,
          webSearchRequests: completion.usage?.server_tool_use?.web_search_requests,
          searchContextSize: config.openRouter?.searchContextSize,
          allowedDomains: config.openRouter?.allowedDomains,
          excludedDomains: config.openRouter?.excludedDomains,
        },
        extraMetadata: {
          persona: config.persona,
          searchDepth: config.searchDepth,
          thinkingBudget: config.thinkingBudget,
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
  const capabilities = getEffectiveModelCapabilities(config.modelId);

  return withProviderRetry(
    async () => {
      const search = buildOpenRouterSearchTool(config);
      const completion = await queryOpenRouter(
        config.modelId,
        buildWorkspaceChatMessages(request, 'json'),
        {
          maxTokens: 2200,
          expectJson: capabilities.supportsStructuredOutput,
          tools: search.tool ? [search.tool] : undefined,
          warnings: search.warnings,
        }
      );

      return {
        ...normalizeChatResponse(completion.rawText, PROVIDER, config.modelId),
        sourceCitations: completion.citations,
        warnings: completion.warnings,
        provenance: {
          provider: PROVIDER,
          modelId: config.modelId,
          generatedAt: new Date().toISOString(),
          requestId: completion.requestId,
          warnings: completion.warnings,
          citations: completion.citations,
          usage: completion.usage,
          search: {
            enabled: !!config.openRouter?.webSearchEnabled,
            provider: 'OPENROUTER' as const,
            engine: config.openRouter?.engine,
            webSearchRequests: completion.usage?.server_tool_use?.web_search_requests,
            searchContextSize: config.openRouter?.searchContextSize,
            allowedDomains: config.openRouter?.allowedDomains,
            excludedDomains: config.openRouter?.excludedDomains,
          },
        },
      };
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
      const search = buildOpenRouterSearchTool(config);
      const completion = await streamOpenRouter(
        config.modelId,
        buildWorkspaceChatMessages(request, 'tagged'),
        {
          ...options,
          maxTokens: 2200,
          tools: search.tool ? [search.tool] : undefined,
          warnings: search.warnings,
        }
      );

      return {
        ...normalizeChatResponse(completion.rawText, PROVIDER, config.modelId),
        warnings: completion.warnings,
        provenance: {
          provider: PROVIDER,
          modelId: config.modelId,
          generatedAt: new Date().toISOString(),
          requestId: completion.requestId,
          warnings: completion.warnings,
          usage: completion.usage,
          search: {
            enabled: !!config.openRouter?.webSearchEnabled,
            provider: 'OPENROUTER' as const,
            engine: config.openRouter?.engine,
            webSearchRequests: completion.usage?.server_tool_use?.web_search_requests,
            searchContextSize: config.openRouter?.searchContextSize,
            allowedDomains: config.openRouter?.allowedDomains,
            excludedDomains: config.openRouter?.excludedDomains,
          },
        },
      };
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
  const capabilities = getEffectiveModelCapabilities(config.modelId);

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
      const search = buildOpenRouterSearchTool(config);

      const completion = await queryOpenRouter(config.modelId, buildArtifactMessages(basePrompt), {
        maxTokens: 1800,
        expectJson: capabilities.supportsStructuredOutput,
        tools: search.tool ? [search.tool] : undefined,
        warnings: search.warnings,
      });
      const parsed = parseJsonWithFallback(completion.rawText);
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
        riskLevel: 'HIGH' as const,
      },
      {
        id: '2',
        title: 'Emerging pattern detected',
        category: scope.categories[2] || 'Analysis',
        timestamp: '09:15 AM',
        riskLevel: 'MEDIUM' as const,
      },
      {
        id: '3',
        title: 'New information surfaced',
        category: scope.categories[0] || 'General',
        timestamp: '08:30 AM',
        riskLevel: 'HIGH' as const,
      },
    ].slice(0, limit);
  });
};

const getLiveIntel = async (request: LiveIntelRequest): Promise<MonitorEvent[]> => {
  const { topic, config, scope, monitorConfig, existingContent } = request;
  const normalizedTopic = normalizeTopicText(topic);
  const capabilities = getEffectiveModelCapabilities(config.modelId);

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
      const search = buildOpenRouterSearchTool(config);

      const completion = await queryOpenRouter(config.modelId, buildArtifactMessages(basePrompt), {
        maxTokens: 2400,
        expectJson: capabilities.supportsStructuredOutput,
        tools: search.tool ? [search.tool] : undefined,
        warnings: search.warnings,
      });
      const parsed = parseJsonWithFallback(completion.rawText);
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
