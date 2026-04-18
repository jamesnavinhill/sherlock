import type { BoardAgentAction, BoardAgentContextPart } from '@/types/boardAgent';
import type { Artifact, Headline } from '@/types/core';
import type {
  WorkspaceBoardItemReference,
  WorkspaceItem,
} from '@/types/workspaceSurface';
import {
  boardRefKey,
  buildWorkspaceEntityRefId,
  buildWorkspaceLibraryEntries,
  buildWorkspaceSourceRefId,
} from '../../library';
import type {
  BoardAgentBoardShapeSummary,
  BuildBoardAgentContextInput,
  BuildBoardAgentContextResult,
} from '../types';
import { getWorkspaceDisplayTitle } from '@/domain';
import { extractBoardShapeSummaries, shapeIntersectsViewport } from './boardSnapshot';

const clipText = (value: string | undefined, maxLength: number) => {
  if (!value) return '';
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const summarizeShape = (shape: BoardAgentBoardShapeSummary) => {
  const linked = shape.linkedRef
    ? `[${shape.linkedRef.refKind}] ${shape.linkedRef.title}`
    : shape.text || 'Unlinked shape';
  const dimensions =
    shape.w && shape.h ? ` ${Math.round(shape.w)}x${Math.round(shape.h)}` : '';
  return `- ${linked} @ (${Math.round(shape.x)}, ${Math.round(shape.y)})${dimensions}`;
};

const summarizeActions = (actions: BoardAgentAction[]) =>
  actions
    .slice(0, 6)
    .map((action) => {
      const details = clipText(
        action.error || (action.result ? JSON.stringify(action.result) : ''),
        160
      );
      return `- ${action.type} [${action.status}]${details ? ` ${details}` : ''}`;
    })
    .join('\n');

const summarizePeripheralClusters = (shapes: BoardAgentBoardShapeSummary[]) => {
  const counts = shapes.reduce<Record<string, number>>((acc, shape) => {
    const key = shape.linkedRef?.refKind || 'UNLINKED';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .map(([kind, count]) => `- ${kind}: ${count}`)
    .join('\n');
};

const buildEntityHydration = (refId: string, artifacts: Artifact[]) => {
  const relatedArtifacts = artifacts.filter((artifact) =>
    artifact.entities.some((entity) => buildWorkspaceEntityRefId(entity.name) === refId)
  );
  if (!relatedArtifacts.length) return '';

  return relatedArtifacts
    .slice(0, 4)
    .map((artifact) => `- ${artifact.topic}: ${clipText(artifact.summary || artifact.rawText, 180)}`)
    .join('\n');
};

const buildSourceHydration = (refId: string, artifacts: Artifact[]) => {
  const relatedArtifacts = artifacts.filter((artifact) =>
    artifact.sources.some((source) => buildWorkspaceSourceRefId(source) === refId)
  );
  if (!relatedArtifacts.length) return '';

  return relatedArtifacts
    .slice(0, 4)
    .map((artifact) => `- ${artifact.topic}: cites this source`)
    .join('\n');
};

const buildWorkspaceItemHydration = (item: WorkspaceItem | undefined) => {
  if (!item) return '';

  const parts = [
    item.kind,
    item.description,
    item.textContent,
    item.url,
    item.provenance?.description,
  ].filter(Boolean);

  return clipText(parts.join(' | '), 280);
};

const buildHeadlineHydration = (headline: Headline | undefined) => {
  if (!headline) return '';
  return clipText(
    [headline.content, headline.source, headline.timestamp, headline.threatLevel]
      .filter(Boolean)
      .join(' | '),
    280
  );
};

const buildArtifactHydration = (artifact: Artifact | undefined) => {
  if (!artifact) return '';
  return clipText(
    [
      artifact.artifactType || 'Artifact',
      artifact.summary,
      artifact.rawText,
      artifact.entities.slice(0, 5).map((entity) => entity.name).join(', '),
    ]
      .filter(Boolean)
      .join(' | '),
    320
  );
};

const buildLinkedRecordSummary = (input: {
  refs: WorkspaceBoardItemReference[];
  artifacts: Artifact[];
  headlines: Headline[];
  workspaceItems: WorkspaceItem[];
}) => {
  const artifactById = new Map(
    input.artifacts.filter((artifact): artifact is Artifact & { id: string } => !!artifact.id).map(
      (artifact) => [artifact.id, artifact]
    )
  );
  const headlineById = new Map(input.headlines.map((headline) => [headline.id, headline]));
  const workspaceItemById = new Map(input.workspaceItems.map((item) => [item.id, item]));

  return input.refs
    .slice(0, 10)
    .map((ref) => {
      const header = `[${ref.refKind}] ${ref.title}`;
      let details = '';

      switch (ref.refKind) {
        case 'ARTIFACT':
          details = buildArtifactHydration(artifactById.get(ref.refId));
          break;
        case 'SIGNAL':
        case 'HEADLINE':
          details = buildHeadlineHydration(headlineById.get(ref.refId));
          break;
        case 'WORKSPACE_ITEM':
          details = buildWorkspaceItemHydration(workspaceItemById.get(ref.refId));
          break;
        case 'ENTITY':
          details = buildEntityHydration(ref.refId, input.artifacts);
          break;
        case 'SOURCE':
          details = buildSourceHydration(ref.refId, input.artifacts);
          break;
      }

      return details ? `${header}\n${details}` : header;
    })
    .join('\n\n');
};

const buildPart = (
  kind: BoardAgentContextPart['kind'],
  title: string,
  content: string,
  priority: number,
  metadata?: Record<string, unknown>
): BoardAgentContextPart | null => {
  const normalized = content.trim();
  if (!normalized) return null;

  return {
    id: `${kind.toLowerCase()}-${priority}`,
    kind,
    title,
    content: normalized,
    priority,
    metadata,
  };
};

export const buildBoardAgentContext = (
  input: BuildBoardAgentContextInput
): BuildBoardAgentContextResult => {
  const createdAt = Date.now();
  const shapes = extractBoardShapeSummaries(input.boardDocument?.snapshot ?? null);
  const selectedShapeIds = input.selectedShapeIds || [];
  const selectedIdSet = new Set(selectedShapeIds);
  const selectedShapes = shapes.filter((shape) => selectedIdSet.has(shape.id));
  const visibleCandidates = shapes.filter((shape) => shapeIntersectsViewport(shape, input.viewportBounds));
  const visibleShapes = visibleCandidates.slice(0, input.maxVisibleShapes ?? 12);
  const visibleIdSet = new Set(visibleShapes.map((shape) => shape.id));
  const peripheralShapes = shapes
    .filter((shape) => !selectedIdSet.has(shape.id) && !visibleIdSet.has(shape.id))
    .slice(0, input.maxPeripheralShapes ?? 12);

  const libraryEntries = buildWorkspaceLibraryEntries({
    workspaceId: input.workspace.id,
    artifacts: input.artifacts,
    headlines: input.headlines,
    workspaceItems: input.workspaceItems,
  });
  const libraryMap = new Map(libraryEntries.map((entry) => [boardRefKey(entry), entry]));

  const linkedRefs = Array.from(
    new Map(
      [...selectedShapes, ...visibleShapes, ...peripheralShapes]
        .flatMap((shape) => {
          if (!shape.linkedRef) return [];
          const libraryEntry = libraryMap.get(boardRefKey(shape.linkedRef));
          return [libraryEntry || shape.linkedRef];
        })
        .map((ref) => [boardRefKey(ref), ref])
    ).values()
  );

  const parts = [
    buildPart('USER_REQUEST', 'User Request', input.userRequest, 100, {
      selectedShapeCount: selectedShapes.length,
    }),
    buildPart(
      'VIEWPORT_BOUNDS',
      'Viewport',
      input.viewportBounds
        ? `Bounds: x=${Math.round(input.viewportBounds.x)}, y=${Math.round(
            input.viewportBounds.y
          )}, w=${Math.round(input.viewportBounds.w)}, h=${Math.round(input.viewportBounds.h)}`
        : '',
      90,
      input.viewportBounds ? { ...input.viewportBounds } : undefined
    ),
    buildPart(
      'SELECTION_SUMMARY',
      'Selection Summary',
      selectedShapes.map(summarizeShape).join('\n'),
      85,
      { count: selectedShapes.length }
    ),
    buildPart(
      'VISIBLE_SHAPE_SUMMARY',
      'Visible Shape Summary',
      visibleShapes.map(summarizeShape).join('\n'),
      70,
      { count: visibleShapes.length }
    ),
    buildPart(
      'PERIPHERAL_CLUSTER_SUMMARY',
      'Peripheral Clusters',
      summarizePeripheralClusters(peripheralShapes),
      55,
      { count: peripheralShapes.length }
    ),
    buildPart(
      'LINKED_RECORD_SUMMARY',
      'Linked Sherlock Records',
      buildLinkedRecordSummary({
        refs: linkedRefs,
        artifacts: input.artifacts,
        headlines: input.headlines,
        workspaceItems: input.workspaceItems,
      }),
      80,
      { count: linkedRefs.length }
    ),
    buildPart(
      'RECENT_AGENT_HISTORY',
      'Recent Board-Agent History',
      summarizeActions(input.recentActions || []),
      45,
      { count: input.recentActions?.length || 0 }
    ),
    buildPart(
      'SYSTEM_METADATA',
      'System Metadata',
      [
        `Workspace: ${getWorkspaceDisplayTitle(input.workspace)}`,
        `Board: ${input.board.name}`,
        `Total shapes: ${shapes.length}`,
        `Linked shapes: ${shapes.filter((shape) => !!shape.linkedRef).length}`,
        `Recent sessions: ${(input.recentSessions || []).length}`,
      ].join('\n'),
      30,
      {
        workspaceId: input.workspace.id,
        boardId: input.board.id,
      }
    ),
  ].filter((part): part is BoardAgentContextPart => !!part);

  return {
    snapshot: {
      id: `board-agent-context-${input.board.id}-${createdAt}`,
      workspaceId: input.workspace.id,
      boardId: input.board.id,
      request: input.userRequest,
      selectedShapeIds,
      visibleShapeIds: visibleShapes.map((shape) => shape.id),
      parts,
      metadata: {
        totalShapeCount: shapes.length,
        linkedShapeCount: shapes.filter((shape) => !!shape.linkedRef).length,
      },
      createdAt,
    },
    shapes,
    selectedShapes,
    visibleShapes,
    peripheralShapes,
  };
};
