import type {
  Artifact,
  Entity,
  Signal,
  Source,
  WorkspaceBoardItemReference,
  WorkspaceItem,
} from '@/types';
import { cleanEntityName } from '../../utils/text';

export interface WorkspaceLibraryEntry extends WorkspaceBoardItemReference {
  kind: 'ARTIFACT' | 'ENTITY' | 'SOURCE' | 'SIGNAL' | 'HEADLINE' | WorkspaceItem['kind'];
  description?: string;
  subtitle?: string;
  searchText: string;
  contextText?: string;
  url?: string;
  previewUrl?: string;
}

const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const buildWorkspaceEntityRefId = (name: string) => `entity:${slugify(cleanEntityName(name))}`;

export const buildWorkspaceSourceRefId = (source: Pick<Source, 'title' | 'url'>) =>
  `source:${slugify(source.url || source.title)}`;

export const buildWorkspaceArtifactReference = (
  workspaceId: string,
  artifact: Artifact & { id: string }
): WorkspaceBoardItemReference => ({
  workspaceId,
  refKind: 'ARTIFACT',
  refId: artifact.id,
  title: artifact.topic,
  metadata: {
    artifactType: artifact.artifactType,
  },
});

export const buildWorkspaceSignalReference = (
  workspaceId: string,
  signal: Signal
): WorkspaceBoardItemReference => ({
  workspaceId,
  refKind: 'SIGNAL',
  refId: signal.id,
  title: signal.source || signal.type,
  metadata: {
    threatLevel: signal.threatLevel,
  },
});

export const buildWorkspaceHeadlineReference = buildWorkspaceSignalReference;

export const buildWorkspaceEntityReference = (
  workspaceId: string,
  entity: Entity
): WorkspaceBoardItemReference => ({
  workspaceId,
  refKind: 'ENTITY',
  refId: buildWorkspaceEntityRefId(entity.name),
  title: entity.name,
  metadata: {
    entityType: entity.type,
    role: entity.role,
  },
});

export const buildWorkspaceSourceReference = (
  workspaceId: string,
  source: Source
): WorkspaceBoardItemReference => ({
  workspaceId,
  refKind: 'SOURCE',
  refId: buildWorkspaceSourceRefId(source),
  title: source.title,
  metadata: {
    url: source.url,
  },
});

export const buildWorkspaceItemReference = (item: WorkspaceItem): WorkspaceBoardItemReference => ({
  workspaceId: item.workspaceId,
  refKind: 'WORKSPACE_ITEM',
  refId: item.id,
  title: item.title,
  workspaceItemKind: item.kind,
  metadata: {
    kind: item.kind,
    url: item.url,
    mimeType: item.mimeType,
  },
});

export const buildWorkspaceLibraryEntries = (input: {
  workspaceId: string;
  artifacts: Artifact[];
  headlines?: Signal[];
  signals?: Signal[];
  workspaceItems: WorkspaceItem[];
}): WorkspaceLibraryEntry[] => {
  const artifactEntries = input.artifacts
    .filter((artifact): artifact is Artifact & { id: string } => !!artifact.id)
    .map((artifact) => ({
      ...buildWorkspaceArtifactReference(input.workspaceId, artifact),
      kind: 'ARTIFACT' as const,
      description: artifact.summary,
      subtitle: artifact.artifactType || 'Artifact',
      contextText: [artifact.summary, artifact.rawText].filter(Boolean).join('\n\n') || artifact.topic,
      searchText: [artifact.topic, artifact.summary, artifact.rawText].filter(Boolean).join(' '),
    }));

  const entityMap = new Map<string, Entity>();
  input.artifacts.forEach((artifact) => {
    artifact.entities.forEach((entity) => {
      const normalized =
        typeof entity === 'string' ? cleanEntityName(entity) : cleanEntityName(entity.name);
      if (!normalized) return;

      const resolved =
        typeof entity === 'string'
          ? { name: entity, type: 'UNKNOWN' as const }
          : entity;
      const existing = entityMap.get(normalized);

      if (!existing || (existing.type === 'UNKNOWN' && resolved.type !== 'UNKNOWN')) {
        entityMap.set(normalized, resolved);
      }
    });
  });

  const entityEntries = Array.from(entityMap.values()).map((entity) => ({
    ...buildWorkspaceEntityReference(input.workspaceId, entity),
    kind: 'ENTITY' as const,
    description: entity.role || undefined,
    subtitle: entity.type,
    contextText: [entity.name, entity.type, entity.role || ''].filter(Boolean).join(' | '),
    searchText: [entity.name, entity.type, entity.role || ''].filter(Boolean).join(' '),
  }));

  const sourceMap = new Map<string, Source>();
  input.artifacts.forEach((artifact) => {
    artifact.sources.forEach((source) => {
      const key = buildWorkspaceSourceRefId(source);
      if (!sourceMap.has(key)) {
        sourceMap.set(key, source);
      }
    });
  });

  const sourceEntries = Array.from(sourceMap.values()).map((source) => ({
    ...buildWorkspaceSourceReference(input.workspaceId, source),
    kind: 'SOURCE' as const,
    description: source.url,
    subtitle: 'Source',
    contextText: [source.title, source.url].filter(Boolean).join('\n'),
    searchText: [source.title, source.url].join(' '),
    url: source.url,
  }));

  const signalEntries = (input.signals || input.headlines || []).map((signal) => ({
    ...buildWorkspaceSignalReference(input.workspaceId, signal),
    kind: 'SIGNAL' as const,
    description: signal.content,
    subtitle: signal.type,
    contextText: [signal.content, signal.source, signal.url || ''].filter(Boolean).join('\n'),
    searchText: [signal.source, signal.content, signal.type].filter(Boolean).join(' '),
    url: signal.url,
  }));

  const workspaceItemEntries = input.workspaceItems.map((item) => ({
    ...buildWorkspaceItemReference(item),
    kind: item.kind,
    description: item.description || item.textContent || item.url || undefined,
    subtitle: item.kind,
    contextText: [
      item.title,
      item.textContent || '',
      item.description || '',
      item.url || '',
      item.fileName || '',
      ...(item.tags || []),
    ]
      .filter(Boolean)
      .join('\n'),
    searchText: [
      item.title,
      item.description || '',
      item.textContent || '',
      item.url || '',
      item.fileName || '',
      ...(item.tags || []),
    ]
      .filter(Boolean)
      .join(' '),
    url: item.url,
    previewUrl: item.previewUrl,
  }));

  return [
    ...workspaceItemEntries,
    ...artifactEntries,
    ...entityEntries,
    ...sourceEntries,
    ...signalEntries,
  ];
};
