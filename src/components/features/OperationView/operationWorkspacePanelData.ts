import type { Artifact, Entity, KeyFinding, Source, Workspace } from '@/types';
import { getArtifactFollowUps, getFollowUpText } from '@/domain';

export interface OperationWorkspaceFindingEntry {
  finding: KeyFinding;
  artifactId?: string;
  artifactTitle: string;
}

interface OperationWorkspacePanelData {
  workspaceInfo: Workspace | null;
  entities: Entity[];
  findings: OperationWorkspaceFindingEntry[];
  followUps: string[];
  artifacts: Artifact[];
  sources: Source[];
}

export const buildOperationWorkspacePanelData = ({
  activeWorkspace,
  artifacts,
}: {
  activeWorkspace: Workspace | null;
  artifacts: Artifact[];
}): OperationWorkspacePanelData => {
  if (!activeWorkspace || artifacts.length === 0) {
    return {
      workspaceInfo: activeWorkspace,
      artifacts: [],
      entities: [],
      findings: [],
      followUps: [],
      sources: [],
    };
  }

  const entityMap = new Map<string, Entity>();
  artifacts
    .flatMap((artifact) => artifact.entities || [])
    .forEach((entity) => {
      const name = typeof entity === 'string' ? entity : entity.name;
      const type = typeof entity === 'string' ? 'UNKNOWN' : entity.type;
      if (!entityMap.has(name) || (entityMap.get(name)?.type === 'UNKNOWN' && type !== 'UNKNOWN')) {
        entityMap.set(name, typeof entity === 'string' ? { name, type: 'UNKNOWN' } : entity);
      }
    });

  const followUps = Array.from(
    new Set(
      artifacts.flatMap((artifact) =>
        getArtifactFollowUps(artifact).map((followUp) => getFollowUpText(followUp))
      )
    )
  );

  const findings = artifacts.flatMap((artifact) =>
    (artifact.keyFindings || []).map((finding) => ({
      finding,
      artifactId: artifact.id,
      artifactTitle: artifact.topic,
    }))
  );

  const sourceMap = new Map<string, Source>();
  artifacts
    .flatMap((artifact) => artifact.sources || [])
    .forEach((source) => {
      if (!sourceMap.has(source.url)) {
        sourceMap.set(source.url, source);
      }
    });

  return {
    workspaceInfo: activeWorkspace,
    artifacts,
    entities: Array.from(entityMap.values()),
    findings,
    followUps,
    sources: Array.from(sourceMap.values()),
  };
};
