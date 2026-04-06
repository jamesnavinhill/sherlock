import { getAllScopes, getScopeById } from '@/data/presets';
import { getDomainPackForScope, getPurposeProfileById } from '@/domain';
import { getModelProvider } from '@/config/aiModels';
import { migrateSystemConfig } from '@/config/systemConfig';
import type {
  ArtifactType,
  CaseTemplate,
  InvestigationLaunchRequest,
  InvestigationRunConfig,
  InvestigationScope,
  SystemConfig,
} from '@/types';

interface ResolveRuntimeLaunchFieldsInput {
  artifactType?: ArtifactType;
  baseConfig?: Partial<SystemConfig>;
  configOverride?: Partial<SystemConfig> & Partial<InvestigationRunConfig>;
  customScopes?: InvestigationScope[];
  labelProfileId?: string;
  purposeId?: string;
  scope?: InvestigationScope;
  scopeId?: string;
}

interface ResolvedRuntimeLaunchFields {
  artifactType: ArtifactType;
  effectiveConfig: SystemConfig;
  labelProfileId: string;
  pack: ReturnType<typeof getDomainPackForScope>;
  purpose: ReturnType<typeof getPurposeProfileById>;
  scope?: InvestigationScope;
}

export const resolveRuntimeScope = (
  scopeId?: string,
  customScopes: InvestigationScope[] = []
): InvestigationScope | undefined => {
  if (!scopeId) return undefined;

  return (
    getScopeById(scopeId) || getAllScopes(customScopes).find((scope) => scope.id === scopeId)
  );
};

export const resolveRuntimeLaunchFields = ({
  artifactType,
  baseConfig,
  configOverride,
  customScopes = [],
  labelProfileId,
  purposeId,
  scope,
  scopeId,
}: ResolveRuntimeLaunchFieldsInput): ResolvedRuntimeLaunchFields => {
  const resolvedScope =
    scope ||
    resolveRuntimeScope(scopeId || configOverride?.scopeId, customScopes);
  const pack = getDomainPackForScope(resolvedScope, customScopes);
  const providerFromModel =
    configOverride?.modelId && !configOverride.provider
      ? getModelProvider(configOverride.modelId)
      : undefined;
  const effectiveConfig = migrateSystemConfig({
    ...(baseConfig || {}),
    ...(configOverride || {}),
    ...(providerFromModel ? { provider: providerFromModel } : {}),
  });
  const purpose = getPurposeProfileById(
    purposeId || configOverride?.purposeId || pack.defaultPurposeId
  );

  return {
    artifactType:
      artifactType ||
      configOverride?.artifactType ||
      purpose.recommendedArtifactType,
    effectiveConfig,
    labelProfileId:
      labelProfileId ||
      configOverride?.labelProfileId ||
      pack.labelProfileId,
    pack,
    purpose,
    scope: resolvedScope,
  };
};

export const buildTemplateRuntimeConfig = (
  input: ResolveRuntimeLaunchFieldsInput
): Partial<SystemConfig> & Partial<InvestigationRunConfig> => {
  const resolved = resolveRuntimeLaunchFields(input);

  return {
    ...resolved.effectiveConfig,
    artifactType: resolved.artifactType,
    labelProfileId: resolved.labelProfileId,
    packId: resolved.pack.id,
    purposeId: resolved.purpose.id,
  };
};

interface BuildLaunchRequestFromTemplateInput {
  customScopes?: InvestigationScope[];
  fallbackConfig?: Partial<SystemConfig>;
  template: CaseTemplate;
}

export const buildLaunchRequestFromTemplate = ({
  customScopes = [],
  fallbackConfig,
  template,
}: BuildLaunchRequestFromTemplateInput): InvestigationLaunchRequest => {
  const resolved = resolveRuntimeLaunchFields({
    baseConfig: fallbackConfig,
    configOverride: template.config,
    customScopes,
    labelProfileId: template.labelProfileId,
    purposeId: template.purposeId,
    scopeId: template.scopeId,
    artifactType: template.artifactType,
  });

  return {
    artifactType: resolved.artifactType,
    configOverride: resolved.effectiveConfig,
    labelProfileId: resolved.labelProfileId,
    packId: resolved.pack.id,
    purposeId: resolved.purpose.id,
    scope: resolved.scope,
    topic: template.topic,
  };
};
