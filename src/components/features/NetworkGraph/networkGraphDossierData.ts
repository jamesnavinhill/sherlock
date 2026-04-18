import type { Artifact, Entity, Headline, KeyFinding, Source } from '@/types';

interface NetworkGraphDossierData {
  entities: Entity[];
  findings: Array<{
    finding: KeyFinding;
    artifactId?: string;
    artifactTitle: string;
  }>;
  headlines: Headline[];
  followUps: string[];
  artifacts: Artifact[];
  sources: Source[];
}

export const buildNetworkGraphDossierData = ({
  filterWorkspaceId,
  headlines,
  artifacts,
}: {
  filterWorkspaceId?: string | null;
  headlines: Headline[];
  artifacts: Artifact[];
}): NetworkGraphDossierData => {
  if (!filterWorkspaceId) {
    return {
      artifacts: [],
      headlines: [],
      followUps: [],
      sources: [],
      entities: [],
      findings: [],
    };
  }

  const activeArtifacts =
    filterWorkspaceId === 'ALL'
      ? artifacts
      : artifacts.filter((artifact) => artifact.workspaceId === filterWorkspaceId);
  const activeHeadlines =
    filterWorkspaceId === 'ALL'
      ? headlines
      : headlines.filter((headline) => headline.workspaceId === filterWorkspaceId);

  const allFollowUps = Array.from(new Set(activeArtifacts.flatMap((artifact) => artifact.leads || [])));

  const sourceMap = new Map<string, Source>();
  activeArtifacts
    .flatMap((artifact) => artifact.sources || [])
    .forEach((source) => {
      if (!sourceMap.has(source.url)) {
        sourceMap.set(source.url, source);
      }
    });

  const entityMap = new Map<string, Entity>();
  activeArtifacts
    .flatMap((artifact) => artifact.entities || [])
    .forEach((entity) => {
      const name = typeof entity === 'string' ? entity : entity.name;
      const type = typeof entity === 'string' ? 'UNKNOWN' : entity.type;
      if (!entityMap.has(name) || (entityMap.get(name)?.type === 'UNKNOWN' && type !== 'UNKNOWN')) {
        entityMap.set(name, typeof entity === 'string' ? { name, type: 'UNKNOWN' } : entity);
      }
    });

  const findings = activeArtifacts.flatMap((artifact) =>
    (artifact.keyFindings || []).map((finding) => ({
      finding,
      artifactId: artifact.id,
      artifactTitle: artifact.topic,
    }))
  );

  return {
    artifacts: activeArtifacts,
    headlines: activeHeadlines,
    followUps: allFollowUps,
    sources: Array.from(sourceMap.values()),
    entities: Array.from(entityMap.values()),
    findings,
  };
};
