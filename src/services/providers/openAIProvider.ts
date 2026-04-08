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

const PROVIDER = 'OPENAI' as const;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface OpenAICompletionPayload {
  error?: { message?: string };
  choices?: Array<{
    message?: { content?: unknown };
    delta?: { content?: unknown };
    text?: unknown;
    finish_reason?: string;
  }>;
}

const extractOpenAIErrorMessage = (payload: OpenAICompletionPayload | null): string | undefined =>
  payload?.error?.message;

const buildOpenAIHeaders = (key: string) => ({
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
});

const queryOpenAI = async (
  modelId: string,
  messages: ProviderMessage[],
  options?: { maxTokens?: number; expectJson?: boolean; signal?: AbortSignal }
): Promise<string> => {
  const key = getApiKeyOrThrow(PROVIDER);
  const { payload } = await postJsonProviderRequest<OpenAICompletionPayload>({
    providerLabel: 'OpenAI',
    url: OPENAI_API_URL,
    signal: options?.signal,
    headers: buildOpenAIHeaders(key),
    body: {
      model: modelId,
      messages,
      ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
      ...(options?.expectJson ? { response_format: { type: 'json_object' } } : {}),
      temperature: 0.2,
    },
    extractErrorMessage: extractOpenAIErrorMessage,
  });

  const content = toDisplayText(payload?.choices?.[0]?.message?.content).trim();
  if (!content) {
    throw new Error(
      `UPSTREAM_ERROR: OpenAI returned an empty response (finish_reason: ${payload?.choices?.[0]?.finish_reason || 'unknown'})`
    );
  }

  return content;
};

const streamOpenAI = async (
  modelId: string,
  messages: ProviderMessage[],
  options?: ChatStreamOptions & { maxTokens?: number }
): Promise<string> => {
  const key = getApiKeyOrThrow(PROVIDER);
  const accumulator = createChatStreamAccumulator(options);
  return streamSseProviderRequest<OpenAICompletionPayload, string>({
    providerLabel: 'OpenAI',
    url: OPENAI_API_URL,
    signal: options?.signal,
    headers: buildOpenAIHeaders(key),
    body: {
      model: modelId,
      messages,
      ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
      temperature: 0.2,
      stream: true,
    },
    accumulator,
    extractErrorMessage: extractOpenAIErrorMessage,
    ignoreEvent: (event) => event.data === '[DONE]',
    parseEventPayload: (event) => JSON.parse(event.data) as OpenAICompletionPayload,
    resolveDelta: (payload) =>
      toDisplayText(payload.choices?.[0]?.delta?.content ?? payload.choices?.[0]?.text),
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

      const rawText = await queryOpenAI(config.modelId, [{ role: 'user', content: prompt }], {
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
      const rawText = await queryOpenAI(
        config.modelId,
        buildWorkspaceChatMessages(request, 'json'),
        {
          maxTokens: 2200,
          expectJson: true,
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
      const rawText = await streamOpenAI(
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
      const rawText = await queryOpenAI(
        config.modelId,
        buildBoardAgentMessages(request, 'json'),
        {
          maxTokens: 2200,
          expectJson: true,
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
      const key = getApiKeyOrThrow(PROVIDER);
      const accumulator = createBoardAgentStreamAccumulator(PROVIDER, config.modelId, options);

      return streamSseProviderRequest<OpenAICompletionPayload, ReturnType<typeof accumulator.complete>>({
        providerLabel: 'OpenAI',
        url: OPENAI_API_URL,
        signal: options?.signal,
        headers: buildOpenAIHeaders(key),
        body: {
          model: config.modelId,
          messages: buildBoardAgentMessages(request, 'tagged'),
          max_tokens: 2200,
          temperature: 0.2,
          stream: true,
        },
        accumulator,
        extractErrorMessage: extractOpenAIErrorMessage,
        ignoreEvent: (event) => event.data === '[DONE]',
        parseEventPayload: (event) => JSON.parse(event.data) as OpenAICompletionPayload,
        resolveDelta: (payload) =>
          toDisplayText(payload.choices?.[0]?.delta?.content ?? payload.choices?.[0]?.text),
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

          const rawText = await queryOpenAI(config.modelId, [{ role: 'user', content: prompt }], {
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
          const prompt = buildLiveIntelPrompt({
            topic: normalizedTopic,
            scope,
            pack: request.pack,
            purpose: request.purpose,
            monitorConfig,
            existingContent,
          });

          const rawText = await queryOpenAI(config.modelId, [{ role: 'user', content: prompt }], {
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

export const openAIProvider: ProviderAdapter = {
  provider: PROVIDER,
  investigate,
  chat,
  streamChat,
  boardAgent,
  streamBoardAgent,
  scanAnomalies,
  getLiveIntel,
};
