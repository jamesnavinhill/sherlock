import type { Artifact, Entity, Source, Workspace } from '@/types';
import { getArtifactFollowUps, getFollowUpText } from '@/domain';

interface OperationWorkspacePanelData {
  workspaceInfo: Workspace | null;
  entities: Entity[];
  leads: string[];
  reports: Artifact[];
  sources: Source[];
}

export const buildOperationWorkspacePanelData = ({
  activeWorkspace,
  reports,
}: {
  activeWorkspace: Workspace | null;
  reports: Artifact[];
}): OperationWorkspacePanelData => {
  if (!activeWorkspace || reports.length === 0) {
    return {
      workspaceInfo: activeWorkspace,
      reports: [],
      entities: [],
      leads: [],
      sources: [],
    };
  }

  const entityMap = new Map<string, Entity>();
  reports
    .flatMap((report) => report.entities || [])
    .forEach((entity) => {
      const name = typeof entity === 'string' ? entity : entity.name;
      const type = typeof entity === 'string' ? 'UNKNOWN' : entity.type;
      if (!entityMap.has(name) || (entityMap.get(name)?.type === 'UNKNOWN' && type !== 'UNKNOWN')) {
        entityMap.set(name, typeof entity === 'string' ? { name, type: 'UNKNOWN' } : entity);
      }
    });

  const leads = Array.from(
    new Set(
      reports.flatMap((artifact) =>
        getArtifactFollowUps(artifact).map((followUp) => getFollowUpText(followUp))
      )
    )
  );

  const sourceMap = new Map<string, Source>();
  reports
    .flatMap((report) => report.sources || [])
    .forEach((source) => {
      if (!sourceMap.has(source.url)) {
        sourceMap.set(source.url, source);
      }
    });

  return {
    workspaceInfo: activeWorkspace,
    reports,
    entities: Array.from(entityMap.values()),
    leads,
    sources: Array.from(sourceMap.values()),
  };
};
