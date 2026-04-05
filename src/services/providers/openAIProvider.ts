import type { FeedItem, Artifact, MonitorEvent } from '../../types';
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
import {
  dedupeSources,
  extractSourcesFromText,
  normalizeFeedItems,
  normalizeLiveEvents,
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
import { createChatStreamAccumulator, readSseStream } from './shared/streaming';
import { buildArtifactFromPayload } from './shared/artifactContract';

const PROVIDER = 'OPENAI' as const;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const queryOpenAI = async (
  modelId: string,
  messages: ProviderMessage[],
  options?: { maxTokens?: number; expectJson?: boolean; signal?: AbortSignal }
): Promise<string> => {
  const key = getApiKeyOrThrow(PROVIDER);

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    signal: options?.signal,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
      ...(options?.expectJson ? { response_format: { type: 'json_object' } } : {}),
      temperature: 0.2,
    }),
  });

  const rawBody = await response.text();
  let payload: {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: unknown }; finish_reason?: string }>;
  } = {};

  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    if (!response.ok) {
      throw new Error(`UPSTREAM_ERROR: OpenAI request failed with status ${response.status}`);
    }
  }

  if (!response.ok) {
    throw new Error(
      payload.error?.message ||
        `UPSTREAM_ERROR: OpenAI request failed with status ${response.status}`
    );
  }

  const content = toDisplayText(payload.choices?.[0]?.message?.content).trim();
  if (!content) {
    throw new Error(
      `UPSTREAM_ERROR: OpenAI returned an empty response (finish_reason: ${payload.choices?.[0]?.finish_reason || 'unknown'})`
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
  accumulator.start();

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    signal: options?.signal,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
      temperature: 0.2,
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
        `UPSTREAM_ERROR: OpenAI request failed with status ${response.status}`
    );
  }

  await readSseStream(response, (event) => {
    if (event.data === '[DONE]') return;

    try {
      const payload = JSON.parse(event.data) as {
        choices?: Array<{ delta?: { content?: unknown }; text?: unknown }>;
      };
      const delta = toDisplayText(
        payload.choices?.[0]?.delta?.content ?? payload.choices?.[0]?.text
      );
      accumulator.push(delta);
    } catch {
      // Ignore malformed partial events and rely on the final response parse.
    }
  });

  return accumulator.complete();
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

const scanAnomalies = async (request: ScanAnomaliesRequest): Promise<FeedItem[]> => {
  const { region, category, dateRange, config, scope, options } = request;
  const limit = options?.limit || 8;

  return withProviderRetry(
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

  return withProviderRetry(
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

export const openAIProvider: ProviderAdapter = {
  provider: PROVIDER,
  investigate,
  chat,
  streamChat,
  scanAnomalies,
  getLiveIntel,
};
