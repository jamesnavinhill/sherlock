import type {
  Artifact,
  ArtifactSection,
  BoardAgentAction,
  WorkspaceBoardItemReference,
  WorkspaceItem,
} from '@/types';
import type { BoardAgentStructuredAction } from '@/services/providers/types';
import {
  createBindingId,
  createShapeId,
  toRichText,
  type TLArrowShape,
} from 'tldraw';

import {
  BOARD_REF_META_KEY,
  parseBoardReference,
} from '../../boardShapes';
import {
  boardRefKey,
  buildWorkspaceArtifactReference,
  buildWorkspaceLibraryEntries,
} from '../../library';
import { createLocalId } from '../../../../utils/id';
import { getWorkspaceDisplayTitle } from '@/domain';
import type {
  BoardAgentActionExecutionResult,
  BoardAgentExecutionContext,
} from './types';

export const BOARD_MUTATING_ACTION_TYPES = new Set<BoardAgentAction['type']>([
  'SET_VIEWPORT',
  'PLACE_LINKED_CARD',
  'MOVE_SHAPES',
  'ALIGN_SHAPES',
  'DISTRIBUTE_SHAPES',
  'GROUP_SELECTION',
  'CREATE_CONNECTOR',
  'CREATE_BOARD_NOTE',
  'ATTACH_ARTIFACT_SUMMARY',
]);

export const DEFAULT_NOTE_TITLE = 'Board Agent Note';

export interface BoardAgentActionExecutorInput {
  action: BoardAgentStructuredAction;
  context: BoardAgentExecutionContext;
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export const getStructuredActionInput = (action: BoardAgentStructuredAction) =>
  isRecord(action.input) ? action.input : {};

export const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

export const summarizeText = (value: string, max = 240) =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 3)).trimEnd()}...`;

export const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const buildLibraryMap = (context: BoardAgentExecutionContext) =>
  new Map(
    buildWorkspaceLibraryEntries({
      workspaceId: context.workspace.id,
      artifacts: context.artifacts,
      headlines: context.headlines,
      workspaceItems: context.workspaceItems,
    }).map((entry) => [boardRefKey(entry), entry])
  );

export const getSelectedShapeIds = (context: BoardAgentExecutionContext) =>
  context.editor.getSelectedShapeIds().map((id) => id as string);

export const getLinkedRefFromShape = (
  context: BoardAgentExecutionContext,
  shapeId: string
): WorkspaceBoardItemReference | null => {
  const shape = context.editor.getShape(shapeId as never);
  if (!shape) return null;
  const meta = shape.meta as Record<string, unknown> | undefined;
  return parseBoardReference(meta?.[BOARD_REF_META_KEY]);
};

export const getSelectedLinkedRefs = (context: BoardAgentExecutionContext) =>
  getSelectedShapeIds(context)
    .map((shapeId) => getLinkedRefFromShape(context, shapeId))
    .filter((ref): ref is WorkspaceBoardItemReference => !!ref);

export const getWorkspaceItemById = (context: BoardAgentExecutionContext, itemId: string) =>
  context.workspaceItems.find((item) => item.id === itemId) || null;

export const getArtifactById = (context: BoardAgentExecutionContext, artifactId: string) =>
  context.artifacts.find((artifact) => artifact.id === artifactId) || null;

export const persistBoardMutation = async (context: BoardAgentExecutionContext) => {
  if (!context.persistBoardDocument) return;
  await context.persistBoardDocument();
};

export const combineShapeBounds = (context: BoardAgentExecutionContext, shapeIds: string[]) => {
  const bounds = shapeIds
    .map((shapeId) => context.editor.getShapePageBounds(shapeId as never))
    .filter((entry): entry is NonNullable<typeof entry> => !!entry);

  if (bounds.length === 0) return null;

  const minX = Math.min(...bounds.map((entry) => entry.x));
  const minY = Math.min(...bounds.map((entry) => entry.y));
  const maxX = Math.max(...bounds.map((entry) => entry.x + entry.w));
  const maxY = Math.max(...bounds.map((entry) => entry.y + entry.h));

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
  };
};

export const resolveRequestedShapeIds = (
  context: BoardAgentExecutionContext,
  input: Record<string, unknown>,
  minimum = 1
) => {
  const requested = Array.isArray(input.shapeIds)
    ? input.shapeIds.filter(
        (value): value is string => typeof value === 'string' && value.trim().length > 0
      )
    : [];
  const fallback = requested.length > 0 ? requested : getSelectedShapeIds(context);
  const existing = fallback.filter((shapeId) => !!context.editor.getShape(shapeId as never));
  return existing.length >= minimum ? existing : [];
};

export const resolvePlacementPosition = (
  context: BoardAgentExecutionContext,
  input: Record<string, unknown>,
  width: number,
  height: number
) => {
  const x = toNumber(input.x);
  const y = toNumber(input.y);

  if (x !== null && y !== null) {
    return { x, y };
  }

  const viewport = context.editor.getViewportPageBounds();
  return {
    x: viewport.x + viewport.w / 2 - width / 2,
    y: viewport.y + viewport.h / 2 - height / 2,
  };
};

export const buildBoardAgentNote = (
  context: BoardAgentExecutionContext,
  input: {
    title: string;
    content: string;
    kind?: WorkspaceItem['kind'];
  }
) => {
  const now = Date.now();

  return {
    id: createLocalId('workspace-item'),
    workspaceId: context.workspace.id,
    kind: input.kind || 'NOTE',
    title: input.title,
    description: summarizeText(input.content),
    textContent: input.content,
    provenance: {
      source: 'BOARD_AGENT' as const,
      sourceBoardId: context.board.id,
      description: 'Created by the Sherlock board agent.',
      metadata: {
        boardAgentSessionId: context.session.id,
      } as Record<string, unknown>,
    },
    metadata: {
      boardAgentSessionId: context.session.id,
      boardAgentBoardId: context.board.id,
    },
    createdAt: now,
    updatedAt: now,
  } satisfies WorkspaceItem;
};

export const buildArtifactFromInput = (
  context: BoardAgentExecutionContext,
  input: {
    title: string;
    content: string;
    artifactType?: Artifact['artifactType'];
  }
): Artifact => {
  const now = Date.now();
  const section: ArtifactSection = {
    id: createLocalId('artifact-section'),
    kind: 'EXECUTIVE_SUMMARY',
    title: 'Board Agent Draft',
    content: input.content,
    order: 0,
  };

  return {
    id: createLocalId('rep'),
    workspaceId: context.workspace.id,
    topic: input.title,
    dateStr: new Date(now).toLocaleDateString(),
    createdAt: now,
    summary: summarizeText(input.content, 320),
    agendas: [],
    leads: [],
    followUps: [],
    sections: [section],
    artifactType: input.artifactType,
    entities: [],
    sources: [],
    evidence: [],
    rawText: input.content,
    packId: context.session.metadata?.packId as string | undefined,
    purposeId: context.session.metadata?.purposeId as string | undefined,
    labelProfileId: context.workspace.labelProfileId,
    provenance: {
      provider: context.session.provider || 'OPENAI',
      modelId: context.session.modelId || 'unknown',
      generatedAt: new Date(now).toISOString(),
      metadata: {
        source: 'BOARD_AGENT',
        boardId: context.board.id,
        boardAgentSessionId: context.session.id,
      },
    },
    metadata: {
      source: 'BOARD_AGENT',
      boardId: context.board.id,
      boardAgentSessionId: context.session.id,
    },
    config: {
      provider: context.session.provider,
      modelId: context.session.modelId,
      packId: context.workspace.packId,
      purposeId: context.workspace.purposeId,
      labelProfileId: context.workspace.labelProfileId,
      artifactType: input.artifactType,
    },
  };
};

export const resolveEntryFromInput = (
  context: BoardAgentExecutionContext,
  input: Record<string, unknown>
) => {
  const libraryMap = buildLibraryMap(context);
  const refKind = normalizeText(input.refKind);
  const refId = normalizeText(input.refId);

  if (refKind && refId) {
    return libraryMap.get(`${refKind}:${refId}`) || null;
  }

  const selectedRef = getSelectedLinkedRefs(context)[0];
  if (!selectedRef) return null;
  return libraryMap.get(boardRefKey(selectedRef)) || null;
};

export const resolveWorkspaceItemText = (
  context: BoardAgentExecutionContext,
  input: Record<string, unknown>
) => {
  const directText = normalizeText(input.content ?? input.text);
  if (directText) return directText;

  const workspaceItemId = normalizeText(input.workspaceItemId);
  if (workspaceItemId) {
    const item = getWorkspaceItemById(context, workspaceItemId);
    if (item?.textContent || item?.description) {
      return item.textContent || item.description || '';
    }
  }

  const shapeId = normalizeText(input.shapeId);
  if (shapeId) {
    const ref = getLinkedRefFromShape(context, shapeId);
    if (ref?.refKind === 'WORKSPACE_ITEM') {
      const item = getWorkspaceItemById(context, ref.refId);
      if (item?.textContent || item?.description) {
        return item.textContent || item.description || '';
      }
    }
  }

  const selectedRef = getSelectedLinkedRefs(context).find(
    (ref) => ref.refKind === 'WORKSPACE_ITEM'
  );
  if (selectedRef) {
    const item = getWorkspaceItemById(context, selectedRef.refId);
    if (item?.textContent || item?.description) {
      return item.textContent || item.description || '';
    }
  }

  return '';
};

export const complete = (
  type: BoardAgentAction['type'],
  patch: Omit<BoardAgentActionExecutionResult, 'type' | 'status'> & {
    status?: BoardAgentActionExecutionResult['status'];
  } = {}
): BoardAgentActionExecutionResult => ({
  type,
  status: patch.status || 'COMPLETED',
  normalizedInput: patch.normalizedInput,
  result: patch.result,
  affectedCanonicalIds: patch.affectedCanonicalIds,
  affectedBoardShapeIds: patch.affectedBoardShapeIds,
  error: patch.error,
  followUp: patch.followUp,
  todoItems: patch.todoItems,
});

export const reject = (
  type: BoardAgentAction['type'],
  message: string,
  normalizedInput?: Record<string, unknown>
): BoardAgentActionExecutionResult => ({
  type,
  status: 'REJECTED',
  error: message,
  normalizedInput,
});

export const executeCreateConnector = async (
  context: BoardAgentExecutionContext,
  input: Record<string, unknown>
) => {
  const fromShapeId = normalizeText(input.fromShapeId) || getSelectedShapeIds(context)[0] || '';
  const toShapeId = normalizeText(input.toShapeId) || getSelectedShapeIds(context)[1] || '';
  if (!fromShapeId || !toShapeId || fromShapeId === toShapeId) {
    return null;
  }
  const fromBounds = context.editor.getShapePageBounds(fromShapeId as never);
  const toBounds = context.editor.getShapePageBounds(toShapeId as never);
  if (!fromBounds || !toBounds) {
    return null;
  }

  const start = {
    x: fromBounds.x + fromBounds.w / 2,
    y: fromBounds.y + fromBounds.h / 2,
  };
  const end = {
    x: toBounds.x + toBounds.w / 2,
    y: toBounds.y + toBounds.h / 2,
  };
  const arrowId = createShapeId();
  context.editor.createShape<TLArrowShape>({
    id: arrowId,
    type: 'arrow',
    x: start.x,
    y: start.y,
    props: {
      start: { x: 0, y: 0 },
      end: { x: end.x - start.x, y: end.y - start.y },
      bend: 0,
      richText: toRichText(normalizeText(input.label) || ''),
      labelPosition: 0.5,
      scale: 1,
      elbowMidPoint: 0.5,
      dash: 'draw',
      size: 'm',
      color: 'blue',
      fill: 'none',
      labelColor: context.themeMode === 'light' ? 'black' : 'white',
      arrowheadStart: 'none',
      arrowheadEnd: 'arrow',
      font: 'sans',
    },
  });
  context.editor.createBindings([
    {
      id: createBindingId(),
      type: 'arrow',
      fromId: arrowId,
      toId: fromShapeId as never,
      props: {
        terminal: 'start',
        normalizedAnchor: { x: 0.5, y: 0.5 },
        isExact: false,
        isPrecise: false,
        snap: 'none',
      },
    },
    {
      id: createBindingId(),
      type: 'arrow',
      fromId: arrowId,
      toId: toShapeId as never,
      props: {
        terminal: 'end',
        normalizedAnchor: { x: 0.5, y: 0.5 },
        isExact: false,
        isPrecise: false,
        snap: 'none',
      },
    },
  ]);
  await persistBoardMutation(context);

  return complete('CREATE_CONNECTOR', {
    normalizedInput: {
      fromShapeId,
      toShapeId,
      label: normalizeText(input.label) || undefined,
    },
    result: {
      connectorShapeId: arrowId,
    },
    affectedBoardShapeIds: [fromShapeId, toShapeId, arrowId as string],
  });
};

export const buildArtifactPlacementEntry = (
  context: BoardAgentExecutionContext,
  artifact: Artifact & { id: string }
) => {
  const artifactRef = buildWorkspaceArtifactReference(context.workspace.id, {
    ...artifact,
    id: artifact.id,
  });
  return buildWorkspaceLibraryEntries({
    workspaceId: context.workspace.id,
    artifacts: [{ ...artifact, id: artifact.id }],
    headlines: [],
    workspaceItems: [],
  }).find((candidate) => candidate.refId === artifactRef.refId);
};

export const buildFollowUpLaunchRequest = (
  context: BoardAgentExecutionContext,
  input: Record<string, unknown>,
  fallbackPrompt: string
) => {
  const topic =
    normalizeText(input.topic) ||
    normalizeText(input.title) ||
    normalizeText(input.prompt) ||
    fallbackPrompt;

  return {
    topic,
    parentContext: {
      topic: getWorkspaceDisplayTitle(context.workspace),
      summary:
        context.workspace.description ||
        `${getWorkspaceDisplayTitle(context.workspace)} workspace`,
    },
    configOverride: {
      provider: context.session.provider,
      modelId: context.session.modelId,
    },
    packId: context.workspace.packId,
    purposeId: context.workspace.purposeId,
    labelProfileId: context.workspace.labelProfileId,
    launchSource: 'BOARD_AGENT_FOLLOW_UP' as const,
    parentArtifactId: normalizeText(input.parentArtifactId) || undefined,
  };
};
