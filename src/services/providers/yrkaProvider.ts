import type { FeedItem, Artifact, MonitorEvent, SystemConfig, ArtifactEvidence, ArtifactProvenance } from '../../types';
import { getApiKeyOrThrow, getMcpGatewayToken } from './keys';
import { getEffectiveModelCapabilities } from '../../config/aiModels';
import type {
  BoardAgentProviderRequest,
  BoardAgentStreamOptions,
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
import {
  dedupeSources,
  extractSourcesFromText,
} from './shared/normalizers';
import {
  buildAnomalyPrompt,
  buildInvestigationPrompt,
  buildLiveIntelPrompt,
  buildStructuredArtifactResponseInstruction,
} from './shared/prompts';
import { buildWorkspaceChatMessages, normalizeChatResponse } from './shared/chat';
import { withProviderRetry } from './shared/retry';
import { normalizeTopicText } from '../../utils/textNormalization';
import { createChatStreamAccumulator } from './shared/streaming';
import { buildArtifactFromPayload } from './shared/artifactContract';
import {
  buildBoardAgentMessages,
  createBoardAgentStreamAccumulator,
  normalizeBoardAgentResponse,
} from './shared/boardAgent';
import { postJsonProviderRequest, streamSseProviderRequest } from './shared/directTransport';
import { buildFallbackFeedItems, buildFallbackLiveEvents } from './shared/fallbacks';
import {
  normalizeLiveIntelPayload,
  normalizeScanResultPayload,
  withSimulatedProviderFallback,
} from './shared/situationalIntel';
import {
  searchWebViaMcp,
  type McpSearchResult,
} from './shared/mcpTransport';

const PROVIDER = 'YRKA' as const;
const YRKA_API_URL = 'https://gateway.yrka.io/v1/chat/completions';

interface YrkaCompletionPayload {
  error?: { message?: string };
  choices?: Array<{
    message?: { content?: unknown };
    delta?: { content?: unknown };
    text?: unknown;
    finish_reason?: string;
  }>;
}

const extractYrkaErrorMessage = (payload: YrkaCompletionPayload | null): string | undefined =>
  payload?.error?.message;

const buildYrkaHeaders = (key: string) => ({
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extra exponential backoff for gateway rate limits (429). The shared
 * withProviderRetry already retries transient errors with a fixed delay;
 * the free-tier lanes rate-limit aggressively, so 429s get their own
 * lengthening backoff here.
 */
const withYrkaRateLimitBackoff = async <T>(fn: () => Promise<T>): Promise<T> => {
  const delaysMs = [2000, 4000, 8000, 16000];
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const isRateLimited = /429|rate.?limit/i.test(message);
      if (!isRateLimited || attempt >= delaysMs.length) throw error;
      await wait(delaysMs[attempt]);
    }
  }
};

const queryYrka = async (
  modelId: string,
  messages: ProviderMessage[],
  options?: { maxTokens?: number; expectJson?: boolean; signal?: AbortSignal }
): Promise<string> => {
  const key = getApiKeyOrThrow(PROVIDER);
  const { payload } = await withYrkaRateLimitBackoff(() =>
    postJsonProviderRequest<YrkaCompletionPayload>({
      providerLabel: 'Yrka',
      url: YRKA_API_URL,
      signal: options?.signal,
      headers: buildYrkaHeaders(key),
      body: {
        model: modelId,
        messages,
        ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
        ...(options?.expectJson ? { response_format: { type: 'json_object' } } : {}),
        temperature: 0.2,
      },
      extractErrorMessage: extractYrkaErrorMessage,
    })
  );

  const content = toDisplayText(payload?.choices?.[0]?.message?.content).trim();
  if (!content) {
    throw new Error(
      `UPSTREAM_ERROR: Yrka returned an empty response (finish_reason: ${payload?.choices?.[0]?.finish_reason || 'unknown'})`
    );
  }

  return content;
};

const streamYrka = async (
  modelId: string,
  messages: ProviderMessage[],
  options?: ChatStreamOptions & { maxTokens?: number }
): Promise<string> => {
  const key = getApiKeyOrThrow(PROVIDER);
  const accumulator = createChatStreamAccumulator(options);
  return withYrkaRateLimitBackoff(() =>
    streamSseProviderRequest<YrkaCompletionPayload, string>({
      providerLabel: 'Yrka',
      url: YRKA_API_URL,
      signal: options?.signal,
      headers: buildYrkaHeaders(key),
      body: {
        model: modelId,
        messages,
        ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
        temperature: 0.2,
        stream: true,
      },
      accumulator,
      extractErrorMessage: extractYrkaErrorMessage,
      ignoreEvent: (event) => event.data === '[DONE]',
      parseEventPayload: (event) => JSON.parse(event.data) as YrkaCompletionPayload,
      resolveDelta: (payload) =>
        toDisplayText(payload.choices?.[0]?.delta?.content ?? payload.choices?.[0]?.text),
    })
  );
};

/**
 * MCP web search for the Yrka lane. Reuses the existing webSearchEnabled
 * toggle and maxResults settings (SystemConfig.openRouter block). The search
 * query is derived per operation since the MCP gateway — unlike OpenRouter's
 * server-side tool — needs an explicit query string.
 *
 * Mapping notes vs OpenRouter's web_search:
 * - engine: you_search is primary, tavily_search is the fallback (same
 *   backend, separate credit pool). The exa/firecrawl engines have no working
 *   MCP tool yet (missing worker API keys) and fall back to you_search.
 * - maxResults/maxTotalResults: honored via the search `count` parameter.
 * - allowedDomains/excludedDomains: rewritten into site:/-site: query
 *   operators (allowed wins when both are set, mirroring the OpenRouter adapter).
 * - searchContextSize: no MCP equivalent; ignored.
 */
interface YrkaSearchOutcome {
  results: McpSearchResult[];
  citations: Array<{ url: string; title?: string; content?: string }>;
  warnings: string[];
}

/**
 * Rewrite the search query with domain filters as site: operators, since the
 * MCP search tools accept no domain parameters. Allowed domains win when both
 * lists are set (mirrors the OpenRouter adapter's conflict rule).
 */
const applyDomainFiltersToQuery = (
  query: string,
  allowedDomains: string[],
  excludedDomains: string[],
  warnings: string[]
): string => {
  const allowed = allowedDomains.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  const excluded = excludedDomains.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  if (allowed.length === 0 && excluded.length === 0) return query;
  if (allowed.length > 0 && excluded.length > 0) {
    warnings.push(
      'Allowed and excluded domains cannot be combined; kept allowed domains and dropped excluded domains.'
    );
  }
  if (allowed.length > 0) {
    return `${query} (${allowed.map((domain) => `site:${domain}`).join(' OR ')})`;
  }
  return `${query} ${excluded.map((domain) => `-site:${domain}`).join(' ')}`;
};

const runYrkaWebSearch = async (
  query: string,
  config: SystemConfig,
  options?: { signal?: AbortSignal }
): Promise<YrkaSearchOutcome> => {
  const settings = config.openRouter;
  if (!settings?.webSearchEnabled) {
    return { results: [], citations: [], warnings: [] };
  }

  const warnings: string[] = [];
  const mcpToken = getMcpGatewayToken();
  if (!mcpToken) {
    warnings.push(
      'Yrka web search is enabled but no MCP gateway token is stored; continuing without search results.'
    );
    return { results: [], citations: [], warnings };
  }

  if (settings.engine === 'exa' || settings.engine === 'firecrawl') {
    warnings.push(
      `The "${settings.engine}" search engine has no working MCP tool yet; fell back to the default backend.`
    );
  }

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return { results: [], citations: [], warnings };
  }

  const filteredQuery = applyDomainFiltersToQuery(
    trimmedQuery,
    settings.allowedDomains,
    settings.excludedDomains,
    warnings
  );

  try {
    const results = await searchWebViaMcp(filteredQuery, {
      token: mcpToken,
      maxResults: settings.maxResults,
      signal: options?.signal,
    });
    return {
      results,
      citations: results.map((result) => ({
        url: result.url,
        title: result.title,
        content: result.content,
      })),
      warnings,
    };
  } catch (error) {
    warnings.push(
      `MCP web search failed (${error instanceof Error ? error.message : 'unknown error'}); continuing without search results.`
    );
    return { results: [], citations: [], warnings };
  }
};

const buildSearchContextBlock = (results: McpSearchResult[]): string => {
  const lines = results.map((result, index) => {
    const header = `[${index + 1}] ${result.title || result.url} — ${result.url}`;
    return result.content ? `${header}\n${result.content}` : header;
  });
  return `<web_search_results>\nThe following web search results were retrieved for grounding. Cite them by URL where relevant.\n${lines.join('\n\n')}\n</web_search_results>`;
};

/**
 * Appends the search context block to the last user message so the model
 * grounds its answer. Keeps system-prompt ordering untouched.
 */
const withSearchContext = (
  messages: ProviderMessage[],
  results: McpSearchResult[]
): ProviderMessage[] => {
  if (results.length === 0) return messages;
  const block = buildSearchContextBlock(results);
  const next = [...messages];
  for (let index = next.length - 1; index >= 0; index -= 1) {
    if (next[index].role === 'user') {
      next[index] = {
        ...next[index],
        content: `${next[index].content}\n\n${block}`,
      };
      return next;
    }
  }
  next.push({ role: 'user', content: block });
  return next;
};

const toYrkaSearchEvidence = (
  citations: YrkaSearchOutcome['citations']
): ArtifactEvidence[] =>
  (citations || []).map((citation, index) => ({
    id: `yrka-citation-${index}`,
    kind: citation.content ? 'QUOTE' : 'SOURCE',
    title: citation.title || citation.url,
    summary: citation.content || citation.title || citation.url,
    quote: citation.content,
    sourceTitle: citation.title,
    sourceUrl: citation.url,
    order: index,
  }));

const buildYrkaSearchMetadata = (
  config: SystemConfig,
  resultCount: number
): NonNullable<ArtifactProvenance['search']> => ({
  enabled: !!config.openRouter?.webSearchEnabled,
  provider: 'YRKA',
  engine: config.openRouter?.engine,
  backend: 'mcp-you_search',
  resultCount,
});

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

  return withProviderRetry(
    async () => {
      const search = await runYrkaWebSearch(normalizedTopic, config);

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
        request.generationMode || config.generationMode || 'STAGED'
      )}`;

      const messages = withSearchContext(
        [{ role: 'user', content: prompt }],
        search.results
      );

      const rawText = await queryYrka(config.modelId, messages, {
        maxTokens: 3200,
        expectJson: true,
      });
      const parsedData = parseJsonWithFallback(rawText);

      const data =
        parsedData && typeof parsedData === 'object'
          ? (parsedData as StructuredArtifactPayload)
          : {};

      const modelSources = Array.isArray(data.sources)
        ? dedupeSources(
            data.sources.map((source: { title?: unknown; url?: unknown; uri?: unknown }) => ({
              title: source.title,
              url: source.url,
              uri: source.uri,
            }))
          )
        : [];

      const textFallbackSources = extractSourcesFromText(rawText);

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
        generationMode: request.generationMode || config.generationMode,
        citations: search.citations,
        extraEvidence: toYrkaSearchEvidence(search.citations),
        warnings: search.warnings,
        searchMetadata: buildYrkaSearchMetadata(config, search.results.length),
        extraSources: dedupeSources([...modelSources, ...textFallbackSources]),
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

const lastUserMessageText = (messages: ProviderMessage[]): string => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'user' && messages[index].content.trim()) {
      return messages[index].content;
    }
  }
  return '';
};

const chat = async (request: ChatRequest) => {
  const { config } = request;
  const capabilities = getEffectiveModelCapabilities(config.modelId);

  return withProviderRetry(
    async () => {
      const baseMessages = buildWorkspaceChatMessages(request, 'json');
      const search = await runYrkaWebSearch(lastUserMessageText(baseMessages), config);
      const messages = withSearchContext(baseMessages, search.results);

      const rawText = await queryYrka(config.modelId, messages, {
        maxTokens: 2200,
        expectJson: capabilities.supportsStructuredOutput,
      });

      return {
        ...normalizeChatResponse(rawText, PROVIDER, config.modelId),
        sourceCitations: search.citations,
        warnings: search.warnings,
        provenance: {
          provider: PROVIDER,
          modelId: config.modelId,
          generatedAt: new Date().toISOString(),
          warnings: search.warnings,
          citations: search.citations,
          search: buildYrkaSearchMetadata(config, search.results.length),
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
      // Pre-search before the stream starts: the MCP gateway needs an explicit
      // query, so there is no mid-stream tool loop to handle here.
      const baseMessages = buildWorkspaceChatMessages(request, 'tagged');
      const search = await runYrkaWebSearch(
        lastUserMessageText(baseMessages),
        config,
        { signal: options?.signal }
      );
      const messages = withSearchContext(baseMessages, search.results);

      const rawText = await streamYrka(config.modelId, messages, {
        ...options,
        maxTokens: 2200,
      });

      return {
        ...normalizeChatResponse(rawText, PROVIDER, config.modelId),
        sourceCitations: search.citations,
        warnings: search.warnings,
        provenance: {
          provider: PROVIDER,
          modelId: config.modelId,
          generatedAt: new Date().toISOString(),
          warnings: search.warnings,
          citations: search.citations,
          search: buildYrkaSearchMetadata(config, search.results.length),
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

const boardAgent = async (request: BoardAgentProviderRequest) => {
  const { config } = request;

  return withProviderRetry(
    async () => {
      const baseMessages = buildBoardAgentMessages(request, 'json');
      const search = await runYrkaWebSearch(lastUserMessageText(baseMessages), config);
      const messages = withSearchContext(baseMessages, search.results);

      const rawText = await queryYrka(config.modelId, messages, {
        maxTokens: 2200,
        expectJson: true,
      });

      return {
        ...normalizeBoardAgentResponse(rawText, PROVIDER, config.modelId),
        warnings: search.warnings,
      };
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
      const key = getApiKeyOrThrow(PROVIDER);
      const baseMessages = buildBoardAgentMessages(request, 'tagged');
      const search = await runYrkaWebSearch(
        lastUserMessageText(baseMessages),
        config,
        { signal: options?.signal }
      );
      const messages = withSearchContext(baseMessages, search.results);
      const accumulator = createBoardAgentStreamAccumulator(PROVIDER, config.modelId, options);

      const streamed = await withYrkaRateLimitBackoff(() =>
        streamSseProviderRequest<YrkaCompletionPayload, ReturnType<typeof accumulator.complete>>({
          providerLabel: 'Yrka',
          url: YRKA_API_URL,
          signal: options?.signal,
          headers: buildYrkaHeaders(key),
          body: {
            model: config.modelId,
            messages,
            max_tokens: 2200,
            temperature: 0.2,
            stream: true,
          },
          accumulator,
          extractErrorMessage: extractYrkaErrorMessage,
          ignoreEvent: (event) => event.data === '[DONE]',
          parseEventPayload: (event) => JSON.parse(event.data) as YrkaCompletionPayload,
          resolveDelta: (payload) =>
            toDisplayText(payload.choices?.[0]?.delta?.content ?? payload.choices?.[0]?.text),
        })
      );

      return {
        ...streamed,
        warnings: [...(streamed.warnings || []), ...search.warnings],
      };
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
  const limit = options?.limit || 8;

  return withSimulatedProviderFallback(
    () =>
      withProviderRetry(
        async () => {
          const search = await runYrkaWebSearch(`${category} ${region} latest`, config);
          const prompt = buildAnomalyPrompt({
            region,
            category,
            limit,
            prioritySources: options?.prioritySources || '',
            scope,
            pack: request.pack,
            purpose: request.purpose,
            dateRange,
          });

          const messages = withSearchContext(
            [{ role: 'user', content: prompt }],
            search.results
          );

          const rawText = await queryYrka(config.modelId, messages, {
            maxTokens: 1800,
            expectJson: false,
          });
          return normalizeScanResultPayload(parseJsonWithFallback(rawText), scope);
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

  return withSimulatedProviderFallback(
    () =>
      withProviderRetry(
        async () => {
          const search = await runYrkaWebSearch(normalizedTopic, config);
          const prompt = buildLiveIntelPrompt({
            topic: normalizedTopic,
            scope,
            pack: request.pack,
            purpose: request.purpose,
            monitorConfig,
            existingContent,
          });

          const messages = withSearchContext(
            [{ role: 'user', content: prompt }],
            search.results
          );

          const rawText = await queryYrka(config.modelId, messages, {
            maxTokens: 2200,
            expectJson: false,
          });
          return normalizeLiveIntelPayload(parseJsonWithFallback(rawText));
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

export const yrkaProvider: ProviderAdapter = {
  provider: PROVIDER,
  investigate,
  chat,
  streamChat,
  boardAgent,
  streamBoardAgent,
  scanAnomalies,
  getLiveIntel,
};
