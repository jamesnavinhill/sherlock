import type {
  Artifact,
  Entity,
  KeyFinding,
  Signal,
  Source,
  WorkspaceBoardItemReference,
  WorkspaceItem,
} from '@/types';
import { getDefaultWorkspaceLibraryIconId, type AppIconId } from '@/lib/appIcons';
import { cleanEntityName } from '../../utils/text';
import {
  buildWorkspaceItemContextText,
  buildWorkspaceItemSearchText,
  getWorkspaceItemPrimaryText,
} from './workspaceItemText';

export interface WorkspaceLibraryEntry extends WorkspaceBoardItemReference {
  kind:
    | 'ARTIFACT'
    | 'FINDING'
    | 'ENTITY'
    | 'SOURCE'
    | 'SIGNAL'
    | 'HEADLINE'
    | WorkspaceItem['kind'];
  description?: string;
  subtitle?: string;
  searchText: string;
  contextText?: string;
  url?: string;
  previewUrl?: string;
  iconId?: AppIconId;
}

const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const buildWorkspaceEntityRefId = (name: string) => `entity:${slugify(cleanEntityName(name))}`;

export const buildWorkspaceSourceRefId = (source: Pick<Source, 'title' | 'url'>) =>
  `source:${slugify(source.url || source.title)}`;

export const boardRefKey = (ref: WorkspaceBoardItemReference) => `${ref.refKind}:${ref.refId}`;

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

export const buildWorkspaceKeyFindingReference = (
  workspaceId: string,
  finding: KeyFinding
): WorkspaceBoardItemReference => ({
  workspaceId,
  refKind: 'KEY_FINDING',
  refId: finding.id,
  title: finding.title,
  metadata: {
    originArtifactId: finding.originArtifactId,
    originSectionId: finding.originSectionId,
    supportRefs: finding.supportRefs,
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
    iconId: entity.iconId,
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
      iconId: getDefaultWorkspaceLibraryIconId({ kind: 'ARTIFACT' }),
    }));

  const findingEntries = input.artifacts.flatMap((artifact) =>
    (artifact.keyFindings || [])
      .filter((finding) => typeof finding.id === 'string' && finding.id.length > 0)
      .map((finding) => ({
        ...buildWorkspaceKeyFindingReference(input.workspaceId, finding),
        kind: 'FINDING' as const,
        description: finding.summary,
        subtitle: 'Finding',
        contextText: [finding.summary, ...(finding.supportRefs || [])].filter(Boolean).join('\n'),
        searchText: [finding.title, finding.summary, ...(finding.supportRefs || [])]
          .filter(Boolean)
          .join(' '),
        iconId: getDefaultWorkspaceLibraryIconId({ kind: 'FINDING' }),
      }))
  );

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
    iconId:
      entity.iconId ||
      getDefaultWorkspaceLibraryIconId({ kind: 'ENTITY', entityType: entity.type }),
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
    iconId: getDefaultWorkspaceLibraryIconId({ kind: 'SOURCE' }),
  }));

  const signalEntries = (input.signals || input.headlines || []).map((signal) => ({
    ...buildWorkspaceSignalReference(input.workspaceId, signal),
    kind: 'SIGNAL' as const,
    description: signal.content,
    subtitle: signal.type,
    contextText: [signal.content, signal.source, signal.url || ''].filter(Boolean).join('\n'),
    searchText: [signal.source, signal.content, signal.type].filter(Boolean).join(' '),
    url: signal.url,
    iconId: getDefaultWorkspaceLibraryIconId({ kind: 'SIGNAL' }),
  }));

  const workspaceItemEntries = input.workspaceItems.map((item) => ({
    ...buildWorkspaceItemReference(item),
    kind: item.kind,
    description: getWorkspaceItemPrimaryText(item, undefined),
    subtitle: item.kind,
    contextText: buildWorkspaceItemContextText(item),
    searchText: buildWorkspaceItemSearchText(item),
    url: item.url,
    previewUrl: item.previewUrl,
    iconId: getDefaultWorkspaceLibraryIconId({
      kind: item.kind,
      workspaceItemKind: item.kind,
    }),
  }));

  return [
    ...workspaceItemEntries,
    ...artifactEntries,
    ...findingEntries,
    ...entityEntries,
    ...sourceEntries,
    ...signalEntries,
  ];
};

export const buildSingleWorkspaceItemEntry = (
  workspaceId: string,
  item: WorkspaceItem
): WorkspaceLibraryEntry | null =>
  buildWorkspaceLibraryEntries({
    workspaceId,
    artifacts: [],
    headlines: [],
    workspaceItems: [item],
  })[0] || null;
