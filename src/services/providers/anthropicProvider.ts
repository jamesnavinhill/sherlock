import type { FeedItem, Artifact, MonitorEvent } from '../../types';
import { getApiKeyOrThrow } from './keys';
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

const PROVIDER = 'ANTHROPIC' as const;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface AnthropicCompletionPayload {
  error?: { message?: string };
  content?: Array<{ type?: string; text?: string }>;
  delta?: { type?: string; text?: string };
  stop_reason?: string;
  type?: string;
}

const extractAnthropicErrorMessage = (
  payload: AnthropicCompletionPayload | null
): string | undefined => payload?.error?.message;

const buildAnthropicHeaders = (key: string) => ({
  'x-api-key': key,
  'anthropic-version': '2023-06-01',
  'content-type': 'application/json',
});

const splitAnthropicMessages = (
  messages: ProviderMessage[]
): { system?: string; messages: Array<{ role: 'user' | 'assistant'; content: string }> } => {
  const [first, ...rest] = messages;
  const system = first?.role === 'system' ? first.content : undefined;
  const body = (system ? rest : messages)
    .filter(
      (message): message is ProviderMessage & { role: 'user' | 'assistant' } =>
        message.role === 'user' || message.role === 'assistant'
    )
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  return { system, messages: body };
};

const queryAnthropic = async (
  modelId: string,
  providerMessages: ProviderMessage[],
  options?: { maxTokens?: number; signal?: AbortSignal }
): Promise<string> => {
  const key = getApiKeyOrThrow(PROVIDER);
  const { system, messages } = splitAnthropicMessages(providerMessages);
  const { payload } = await postJsonProviderRequest<AnthropicCompletionPayload>({
    providerLabel: 'Anthropic',
    url: ANTHROPIC_API_URL,
    signal: options?.signal,
    headers: buildAnthropicHeaders(key),
    body: {
      model: modelId,
      max_tokens: options?.maxTokens ?? 2048,
      temperature: 0.2,
      ...(system ? { system } : {}),
      messages,
    },
    extractErrorMessage: extractAnthropicErrorMessage,
  });

  const content = toDisplayText(
    (payload?.content || []).map((item) => (item.type === 'text' ? item.text : ''))
  ).trim();

  if (!content) {
    throw new Error(
      `UPSTREAM_ERROR: Anthropic returned an empty response (stop_reason: ${payload?.stop_reason || 'unknown'})`
    );
  }

  return content;
};

const streamAnthropic = async (
  modelId: string,
  providerMessages: ProviderMessage[],
  options?: ChatStreamOptions & { maxTokens?: number }
): Promise<string> => {
  const key = getApiKeyOrThrow(PROVIDER);
  const accumulator = createChatStreamAccumulator(options);
  const { system, messages } = splitAnthropicMessages(providerMessages);

  return streamSseProviderRequest<AnthropicCompletionPayload, string>({
    providerLabel: 'Anthropic',
    url: ANTHROPIC_API_URL,
    signal: options?.signal,
    headers: buildAnthropicHeaders(key),
    body: {
      model: modelId,
      max_tokens: options?.maxTokens ?? 2048,
      temperature: 0.2,
      stream: true,
      ...(system ? { system } : {}),
      messages,
    },
    accumulator,
    extractErrorMessage: extractAnthropicErrorMessage,
    ignoreEvent: (event) => event.data === '[DONE]',
    parseEventPayload: (event) => JSON.parse(event.data) as AnthropicCompletionPayload,
    resolveDelta: (payload, event) => {
      const isDeltaEvent =
        event.event === 'content_block_delta' || payload.type === 'content_block_delta';
      return isDeltaEvent && payload.delta?.type === 'text_delta' ? payload.delta.text || '' : '';
    },
  });
};

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

      const rawText = await queryAnthropic(config.modelId, [{ role: 'user', content: prompt }], {
        maxTokens: 3200,
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

const chat = async (request: ChatRequest) => {
  const { config } = request;

  return withProviderRetry(
    async () => {
      const rawText = await queryAnthropic(
        config.modelId,
        buildWorkspaceChatMessages(request, 'json'),
        {
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

const streamChat = async (request: ChatRequest, options?: ChatStreamOptions) => {
  const { config } = request;

  return withProviderRetry(
    async () => {
      const rawText = await streamAnthropic(
        config.modelId,
        buildWorkspaceChatMessages(request, 'tagged'),
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

const boardAgent = async (request: BoardAgentProviderRequest) => {
  const { config } = request;

  return withProviderRetry(
    async () => {
      const rawText = await queryAnthropic(
        config.modelId,
        buildBoardAgentMessages(request, 'json'),
        {
          maxTokens: 2200,
        }
      );

      return normalizeBoardAgentResponse(rawText, PROVIDER, config.modelId);
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
      const accumulator = createBoardAgentStreamAccumulator(PROVIDER, config.modelId, options);
      const key = getApiKeyOrThrow(PROVIDER);
      const { system, messages } = splitAnthropicMessages(buildBoardAgentMessages(request, 'tagged'));

      return streamSseProviderRequest<
        AnthropicCompletionPayload,
        ReturnType<typeof accumulator.complete>
      >({
        providerLabel: 'Anthropic',
        url: ANTHROPIC_API_URL,
        signal: options?.signal,
        headers: buildAnthropicHeaders(key),
        body: {
          model: config.modelId,
          max_tokens: 2200,
          temperature: 0.2,
          stream: true,
          ...(system ? { system } : {}),
          messages,
        },
        accumulator,
        extractErrorMessage: extractAnthropicErrorMessage,
        ignoreEvent: (event) => event.data === '[DONE]',
        parseEventPayload: (event) => JSON.parse(event.data) as AnthropicCompletionPayload,
        resolveDelta: (payload, event) => {
          const isDeltaEvent =
            event.event === 'content_block_delta' || payload.type === 'content_block_delta';
          return isDeltaEvent && payload.delta?.type === 'text_delta'
            ? payload.delta.text || ''
            : '';
        },
      });
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

          const rawText = await queryAnthropic(config.modelId, [{ role: 'user', content: prompt }], {
            maxTokens: 1800,
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
          const prompt = buildLiveIntelPrompt({
            topic: normalizedTopic,
            scope,
            pack: request.pack,
            purpose: request.purpose,
            monitorConfig,
            existingContent,
          });

          const rawText = await queryAnthropic(config.modelId, [{ role: 'user', content: prompt }], {
            maxTokens: 2200,
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

export const anthropicProvider: ProviderAdapter = {
  provider: PROVIDER,
  investigate,
  chat,
  streamChat,
  boardAgent,
  streamBoardAgent,
  scanAnomalies,
  getLiveIntel,
};
