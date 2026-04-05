import {
  AI_PROVIDERS,
  getEffectiveModelCapabilities,
  getModelProvider,
  getProviderOptionById,
  type AIProvider,
} from '../../config/aiModels';
import { loadSystemConfig, migrateSystemConfig } from '../../config/systemConfig';
import { BUILTIN_SCOPES, getScopeById } from '../../data/presets';
import { getDomainPackById, getDomainPackForScope, getPurposeProfileById } from '../../domain';
import type {
  DomainPack,
  FeedItem,
  Artifact,
  InvestigationScope,
  MonitorEvent,
  PurposeProfile,
  SystemConfig,
} from '../../types';
import { ProviderError } from './shared/errors';
import { logProviderDebug } from './shared/logging';
import type {
  BoardAgentResponse,
  BoardAgentStreamOptions,
  LiveIntelConfig,
  ProviderAdapter,
  ProviderOperation,
  RouterBoardAgentRequest,
  RouterChatRequest,
  RouterInvestigationRequest,
  RouterLiveIntelRequest,
  RouterScanRequest,
  RouterTtsRequest,
  ChatResponse,
  ChatStreamOptions,
} from './types';

const ADAPTER_LOADERS: Record<AIProvider, () => Promise<ProviderAdapter>> = {
  GEMINI: async () => (await import('./geminiProvider')).geminiProvider,
  OPENROUTER: async () => (await import('./openRouterProvider')).openRouterProvider,
  OPENAI: async () => (await import('./openAIProvider')).openAIProvider,
  ANTHROPIC: async () => (await import('./anthropicProvider')).anthropicProvider,
};

const adapterCache = new Map<AIProvider, Promise<ProviderAdapter>>();

const DEFAULT_MONITOR_CONFIG: LiveIntelConfig = {
  socialCount: 2,
  newsCount: 2,
  officialCount: 2,
  prioritySources: '',
};

const OPERATION_CAPABILITY_REQUIREMENTS: Record<
  ProviderOperation,
  {
    requiresProviderRuntime: boolean;
    requiresModelRuntime: boolean;
    requiresTts?: boolean;
  }
> = {
  INVESTIGATE: {
    requiresProviderRuntime: true,
    requiresModelRuntime: true,
  },
  CHAT: {
    requiresProviderRuntime: true,
    requiresModelRuntime: true,
  },
  BOARD_AGENT: {
    requiresProviderRuntime: true,
    requiresModelRuntime: true,
  },
  SCAN_ANOMALIES: {
    requiresProviderRuntime: true,
    requiresModelRuntime: true,
  },
  LIVE_INTEL: {
    requiresProviderRuntime: true,
    requiresModelRuntime: true,
  },
  TTS: {
    requiresProviderRuntime: true,
    requiresModelRuntime: true,
    requiresTts: true,
  },
};

const resolveScope = (scope?: InvestigationScope): InvestigationScope => {
  return scope || getScopeById('open-investigation') || BUILTIN_SCOPES[BUILTIN_SCOPES.length - 1];
};

const resolveWorkspaceScope = (scopeId?: string): InvestigationScope => {
  return resolveScope(getScopeById(scopeId || ''));
};

const resolvePack = (scope: InvestigationScope, packId?: string): DomainPack => {
  return getDomainPackById(packId || scope.id) || getDomainPackForScope(scope);
};

const resolvePurpose = (pack: DomainPack, purposeId?: string): PurposeProfile => {
  return getPurposeProfileById(purposeId || pack.defaultPurposeId);
};

const resolveEffectiveConfig = (configOverride?: Partial<SystemConfig>): SystemConfig => {
  const baseConfig = loadSystemConfig();
  return migrateSystemConfig({ ...baseConfig, ...(configOverride || {}) });
};

const resolveAdapter = async (config: SystemConfig): Promise<ProviderAdapter> => {
  const modelProvider = getModelProvider(config.modelId);
  const provider = config.provider === modelProvider ? config.provider : modelProvider;
  const loader = ADAPTER_LOADERS[provider];

  if (!loader) {
    throw new ProviderError({
      code: 'UPSTREAM_ERROR',
      provider,
      operation: 'INVESTIGATE',
      message: `No adapter is registered for provider ${provider}.`,
    });
  }

  const cached = adapterCache.get(provider);
  if (cached) {
    return cached;
  }

  const adapterPromise = loader().catch((error) => {
    adapterCache.delete(provider);
    throw error;
  });
  adapterCache.set(provider, adapterPromise);

  const adapter = await adapterPromise;
  return adapter;
};

const assertCapability = (
  adapter: ProviderAdapter,
  operation: ProviderOperation,
  modelId: string
): void => {
  const providerMeta = getProviderOptionById(adapter.provider);
  const modelCapabilities = getEffectiveModelCapabilities(modelId);
  const requirements = OPERATION_CAPABILITY_REQUIREMENTS[operation];

  if (!providerMeta) {
    throw new ProviderError({
      code: 'UPSTREAM_ERROR',
      provider: adapter.provider,
      operation,
      message: `Provider metadata missing for ${adapter.provider}.`,
    });
  }

  const providerRuntimeSupported =
    !requirements.requiresProviderRuntime || providerMeta.capabilities.runtimeStatus === 'ACTIVE';
  const modelRuntimeSupported =
    !requirements.requiresModelRuntime || modelCapabilities.runtimeStatus === 'ACTIVE';
  const ttsSupported = !requirements.requiresTts || providerMeta.capabilities.supportsTts;

  if (!providerRuntimeSupported || !modelRuntimeSupported || !ttsSupported) {
    const reasons = [
      !providerRuntimeSupported ? `${providerMeta.label} is not runtime-enabled` : null,
      !modelRuntimeSupported ? `model ${modelId} is not runtime-enabled` : null,
      !ttsSupported ? `${providerMeta.label} does not support TTS` : null,
    ].filter((reason): reason is string => !!reason);

    throw new ProviderError({
      code: 'UNSUPPORTED_OPERATION',
      provider: adapter.provider,
      operation,
      message: `${operation} is unavailable for ${modelId}: ${reasons.join('; ')}.`,
    });
  }
};

export const investigateWithProviderRouter = async (
  request: RouterInvestigationRequest
): Promise<Artifact> => {
  const config = resolveEffectiveConfig(request.configOverride);
  const adapter = await resolveAdapter(config);
  const scope = resolveScope(request.scope);
  const pack = resolvePack(scope, request.packId);
  const purpose = resolvePurpose(pack, request.purposeId);
  assertCapability(adapter, 'INVESTIGATE', config.modelId);

  logProviderDebug({
    provider: adapter.provider,
    modelId: config.modelId,
    operation: 'INVESTIGATE',
    retryCount: 0,
  });

  return adapter.investigate({
    topic: request.topic,
    parentContext: request.parentContext,
    config,
    scope,
    pack,
    purpose,
    artifactType: request.artifactType || purpose.recommendedArtifactType,
    labelProfileId: request.labelProfileId || pack.labelProfileId,
    dateOverride: request.dateOverride,
    generationMode: request.configOverride?.generationMode || config.generationMode,
  });
};

export const chatWithProviderRouter = async (request: RouterChatRequest): Promise<ChatResponse> => {
  const config = resolveEffectiveConfig(request.configOverride);
  const adapter = await resolveAdapter(config);
  const scope = resolveWorkspaceScope(request.workspace.scopeId);
  const pack = resolvePack(scope, request.packId || request.workspace.packId);
  const purpose = resolvePurpose(pack, request.purposeId || request.workspace.purposeId);
  assertCapability(adapter, 'CHAT', config.modelId);

  logProviderDebug({
    provider: adapter.provider,
    modelId: config.modelId,
    operation: 'CHAT',
    retryCount: 0,
  });

  return adapter.chat({
    workspace: request.workspace,
    config,
    pack,
    purpose,
    messages: request.messages,
    workspaceSummary: request.workspaceSummary,
    recentArtifacts: request.recentArtifacts,
    recentHeadlines: request.recentHeadlines,
    retrievedContext: request.retrievedContext,
  });
};

export const streamChatWithProviderRouter = async (
  request: RouterChatRequest,
  options?: ChatStreamOptions
): Promise<ChatResponse> => {
  const config = resolveEffectiveConfig(request.configOverride);
  const adapter = await resolveAdapter(config);
  const scope = resolveWorkspaceScope(request.workspace.scopeId);
  const pack = resolvePack(scope, request.packId || request.workspace.packId);
  const purpose = resolvePurpose(pack, request.purposeId || request.workspace.purposeId);
  assertCapability(adapter, 'CHAT', config.modelId);

  logProviderDebug({
    provider: adapter.provider,
    modelId: config.modelId,
    operation: 'CHAT',
    retryCount: 0,
  });

  return adapter.streamChat(
    {
      workspace: request.workspace,
      config,
      pack,
      purpose,
      messages: request.messages,
      workspaceSummary: request.workspaceSummary,
      recentArtifacts: request.recentArtifacts,
      recentHeadlines: request.recentHeadlines,
      retrievedContext: request.retrievedContext,
    },
    options
  );
};

export const boardAgentWithProviderRouter = async (
  request: RouterBoardAgentRequest
): Promise<BoardAgentResponse> => {
  const config = resolveEffectiveConfig(request.configOverride);
  const adapter = await resolveAdapter(config);
  const scope = resolveWorkspaceScope(request.workspace.scopeId);
  const pack = resolvePack(scope, request.packId || request.workspace.packId);
  const purpose = resolvePurpose(pack, request.purposeId || request.workspace.purposeId);
  assertCapability(adapter, 'BOARD_AGENT', config.modelId);

  logProviderDebug({
    provider: adapter.provider,
    modelId: config.modelId,
    operation: 'BOARD_AGENT',
    retryCount: 0,
  });

  return adapter.boardAgent({
    workspace: request.workspace,
    board: request.board,
    config,
    pack,
    purpose,
    userRequest: request.userRequest,
    contextSnapshot: request.contextSnapshot,
  });
};

export const streamBoardAgentWithProviderRouter = async (
  request: RouterBoardAgentRequest,
  options?: BoardAgentStreamOptions
): Promise<BoardAgentResponse> => {
  const config = resolveEffectiveConfig(request.configOverride);
  const adapter = await resolveAdapter(config);
  const scope = resolveWorkspaceScope(request.workspace.scopeId);
  const pack = resolvePack(scope, request.packId || request.workspace.packId);
  const purpose = resolvePurpose(pack, request.purposeId || request.workspace.purposeId);
  assertCapability(adapter, 'BOARD_AGENT', config.modelId);

  logProviderDebug({
    provider: adapter.provider,
    modelId: config.modelId,
    operation: 'BOARD_AGENT',
    retryCount: 0,
  });

  return adapter.streamBoardAgent(
    {
      workspace: request.workspace,
      board: request.board,
      config,
      pack,
      purpose,
      userRequest: request.userRequest,
      contextSnapshot: request.contextSnapshot,
    },
    options
  );
};

export const scanAnomaliesWithProviderRouter = async (
  request: RouterScanRequest
): Promise<FeedItem[]> => {
  const config = resolveEffectiveConfig();
  const adapter = await resolveAdapter(config);
  const scope = resolveScope(request.scope);
  const pack = resolvePack(scope, request.packId);
  const purpose = resolvePurpose(pack, request.purposeId || pack.defaultPurposeId);
  assertCapability(adapter, 'SCAN_ANOMALIES', config.modelId);

  logProviderDebug({
    provider: adapter.provider,
    modelId: config.modelId,
    operation: 'SCAN_ANOMALIES',
    retryCount: 0,
  });

  return adapter.scanAnomalies({
    region: request.region || '',
    category: request.category || 'All',
    dateRange: request.dateRange,
    config,
    scope,
    pack,
    purpose,
    options: request.options,
  });
};

export const getLiveIntelWithProviderRouter = async (
  request: RouterLiveIntelRequest
): Promise<MonitorEvent[]> => {
  const config = resolveEffectiveConfig();
  const adapter = await resolveAdapter(config);
  const scope = resolveScope(request.scope);
  const pack = resolvePack(scope, request.packId);
  const purpose = resolvePurpose(pack, request.purposeId || pack.defaultPurposeId);
  assertCapability(adapter, 'LIVE_INTEL', config.modelId);

  logProviderDebug({
    provider: adapter.provider,
    modelId: config.modelId,
    operation: 'LIVE_INTEL',
    retryCount: 0,
  });

  return adapter.getLiveIntel({
    topic: request.topic,
    config,
    scope,
    pack,
    purpose,
    monitorConfig: request.monitorConfig || DEFAULT_MONITOR_CONFIG,
    existingContent: request.existingContent || [],
  });
};

export const generateAudioBriefingWithProviderRouter = async (
  request: RouterTtsRequest
): Promise<string> => {
  const config = resolveEffectiveConfig();
  const adapter = await resolveAdapter(config);
  assertCapability(adapter, 'TTS', config.modelId);

  if (!adapter.generateAudioBriefing) {
    throw new ProviderError({
      code: 'UPSTREAM_ERROR',
      provider: adapter.provider,
      operation: 'TTS',
      message: `${adapter.provider} adapter is missing a TTS implementation.`,
    });
  }

  logProviderDebug({
    provider: adapter.provider,
    modelId: config.modelId,
    operation: 'TTS',
    retryCount: 0,
  });

  return adapter.generateAudioBriefing({
    text: request.text,
    config,
  });
};

export const getRegisteredProviders = (): string[] => {
  return AI_PROVIDERS.map((provider) => provider.id).filter(
    (provider) => !!ADAPTER_LOADERS[provider]
  );
};
