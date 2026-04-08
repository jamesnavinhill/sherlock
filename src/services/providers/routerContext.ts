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
  InvestigationScope,
  PurposeProfile,
  SystemConfig,
  Workspace,
} from '../../types';
import { ProviderError } from './shared/errors';
import { logProviderDebug } from './shared/logging';
import type { ProviderAdapter, ProviderOperation } from './types';

const ADAPTER_LOADERS: Record<AIProvider, () => Promise<ProviderAdapter>> = {
  GEMINI: async () => (await import('./geminiProvider')).geminiProvider,
  OPENROUTER: async () => (await import('./openRouterProvider')).openRouterProvider,
  OPENAI: async () => (await import('./openAIProvider')).openAIProvider,
  ANTHROPIC: async () => (await import('./anthropicProvider')).anthropicProvider,
};

const adapterCache = new Map<AIProvider, Promise<ProviderAdapter>>();

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

interface RunProfileContext {
  pack: DomainPack;
  purpose: PurposeProfile;
  scope: InvestigationScope;
}

export interface ProviderExecutionContext {
  adapter: ProviderAdapter;
  config: SystemConfig;
}

export interface ScopedProviderRequestContext extends ProviderExecutionContext, RunProfileContext {}

export interface WorkspaceProviderRequestContext extends ProviderExecutionContext, RunProfileContext {
  workspace: Pick<Workspace, 'id' | 'packId' | 'purposeId' | 'scopeId'>;
}

const resolveScope = (scope?: InvestigationScope): InvestigationScope => {
  return scope || getScopeById('open-investigation') || BUILTIN_SCOPES[BUILTIN_SCOPES.length - 1];
};

const resolvePack = (scope: InvestigationScope, packId?: string): DomainPack => {
  return getDomainPackById(packId || scope.id) || getDomainPackForScope(scope);
};

const resolvePurpose = (pack: DomainPack, purposeId?: string): PurposeProfile => {
  return getPurposeProfileById(purposeId || pack.defaultPurposeId);
};

const resolveRunProfile = (
  scope: InvestigationScope | undefined,
  packId?: string,
  purposeId?: string
): RunProfileContext => {
  const resolvedScope = resolveScope(scope);
  const pack = resolvePack(resolvedScope, packId);
  const purpose = resolvePurpose(pack, purposeId);

  return {
    pack,
    purpose,
    scope: resolvedScope,
  };
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

  return adapterPromise;
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

export const resolveProviderExecutionContext = async (
  operation: ProviderOperation,
  configOverride?: Partial<SystemConfig>
): Promise<ProviderExecutionContext> => {
  const config = resolveEffectiveConfig(configOverride);
  const adapter = await resolveAdapter(config);
  assertCapability(adapter, operation, config.modelId);

  logProviderDebug({
    provider: adapter.provider,
    modelId: config.modelId,
    operation,
    retryCount: 0,
  });

  return {
    adapter,
    config,
  };
};

export const resolveScopedProviderRequestContext = async (input: {
  configOverride?: Partial<SystemConfig>;
  operation: ProviderOperation;
  packId?: string;
  purposeId?: string;
  scope?: InvestigationScope;
}): Promise<ScopedProviderRequestContext> => {
  const execution = await resolveProviderExecutionContext(input.operation, input.configOverride);
  const profile = resolveRunProfile(input.scope, input.packId, input.purposeId);

  return {
    ...execution,
    ...profile,
  };
};

export const resolveWorkspaceProviderRequestContext = async (input: {
  configOverride?: Partial<SystemConfig>;
  operation: ProviderOperation;
  packId?: string;
  purposeId?: string;
  workspace: Pick<Workspace, 'id' | 'packId' | 'purposeId' | 'scopeId'>;
}): Promise<WorkspaceProviderRequestContext> => {
  const execution = await resolveProviderExecutionContext(input.operation, input.configOverride);
  const profile = resolveRunProfile(
    getScopeById(input.workspace.scopeId || ''),
    input.packId || input.workspace.packId,
    input.purposeId || input.workspace.purposeId
  );

  return {
    ...execution,
    ...profile,
    workspace: input.workspace,
  };
};

export const getRegisteredProviderIds = (): string[] => {
  return AI_PROVIDERS.map((provider) => provider.id).filter(
    (provider) => !!ADAPTER_LOADERS[provider]
  );
};
