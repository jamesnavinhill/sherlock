import { BUILTIN_SCOPES } from '../data/presets';
import type { DomainPack, InvestigationScope } from '../types';

const DEFAULT_SUPPORTED_PURPOSES = ['deep-dive', 'synthesis'];

export const toDomainPack = (scope: InvestigationScope): DomainPack => ({
  ...scope,
  workspaceMode: scope.workspaceMode || 'INVESTIGATION',
  labelProfileId: scope.labelProfileId || 'investigation',
  supportedPurposeIds: scope.supportedPurposeIds?.length
    ? scope.supportedPurposeIds
    : DEFAULT_SUPPORTED_PURPOSES,
  defaultPurposeId: scope.defaultPurposeId || 'deep-dive',
  defaultArtifactType: scope.defaultArtifactType || 'REPORT',
});

export const BUILTIN_DOMAIN_PACKS: DomainPack[] = BUILTIN_SCOPES.map(toDomainPack);

export const getDomainPackById = (
  id?: string,
  customScopes: InvestigationScope[] = []
): DomainPack | undefined => {
  if (!id) return undefined;

  const customMatch = customScopes.find((scope) => scope.id === id);
  if (customMatch) return toDomainPack(customMatch);

  return BUILTIN_DOMAIN_PACKS.find((pack) => pack.id === id);
};

export const getDomainPackForScope = (
  scope?: InvestigationScope,
  customScopes: InvestigationScope[] = []
): DomainPack => {
  if (!scope) {
    return (
      BUILTIN_DOMAIN_PACKS.find((pack) => pack.id === 'open-investigation') ||
      BUILTIN_DOMAIN_PACKS[0]
    );
  }

  return getDomainPackById(scope.id, customScopes) || toDomainPack(scope);
};
