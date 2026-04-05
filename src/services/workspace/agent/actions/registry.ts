import {
  createBindingId,
  createShapeId,
  type TLArrowShape,
} from 'tldraw';
import type {
  Artifact,
  ArtifactSection,
  BoardAgentAction,
  WorkspaceBoardItemReference,
  WorkspaceItem,
} from '@/types';
import {
  BOARD_REF_META_KEY,
  buildBoardCardSpec,
  parseBoardReference,
  placeEntryOnBoard,
} from '../../boardShapes';
import {
  buildWorkspaceArtifactReference,
  buildWorkspaceLibraryEntries,
} from '../../library';
import { createLocalId } from '../../../../utils/id';
import {
  normalizeBoardAgentTodoItems,
} from './todos';
import type {
  BoardAgentActionExecutionResult,
  BoardAgentExecutionContext,
  ExecuteBoardAgentStructuredActionInput,
} from './types';

const BOARD_MUTATING_ACTION_TYPES = new Set<BoardAgentAction['type']>([
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

const DEFAULT_NOTE_TITLE = 'Board Agent Note';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

const summarizeText = (value: string, max = 240) =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 3)).trimEnd()}...`;

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const boardRefKey = (ref: WorkspaceBoardItemReference) => `${ref.refKind}:${ref.refId}`;

const buildLibraryMap = (context: BoardAgentExecutionContext) =>
  new Map(
    buildWorkspaceLibraryEntries({
      workspaceId: context.workspace.id,
      artifacts: context.artifacts,
      headlines: context.headlines,
      workspaceItems: context.workspaceItems,
    }).map((entry) => [boardRefKey(entry), entry])
  );

const getSelectedShapeIds = (context: BoardAgentExecutionContext) =>
  context.editor.getSelectedShapeIds().map((id) => id as string);

const getLinkedRefFromShape = (
  context: BoardAgentExecutionContext,
  shapeId: string
): WorkspaceBoardItemReference | null => {
  const shape = context.editor.getShape(shapeId as never);
  if (!shape) return null;
  const meta = shape.meta as Record<string, unknown> | undefined;
  return parseBoardReference(meta?.[BOARD_REF_META_KEY]);
};

const getSelectedLinkedRefs = (context: BoardAgentExecutionContext) =>
  getSelectedShapeIds(context)
    .map((shapeId) => getLinkedRefFromShape(context, shapeId))
    .filter((ref): ref is WorkspaceBoardItemReference => !!ref);

const getWorkspaceItemById = (context: BoardAgentExecutionContext, itemId: string) =>
  context.workspaceItems.find((item) => item.id === itemId) || null;

const getArtifactById = (context: BoardAgentExecutionContext, artifactId: string) =>
  context.artifacts.find((artifact) => artifact.id === artifactId) || null;

const persistBoardMutation = async (context: BoardAgentExecutionContext) => {
  if (!context.persistBoardDocument) return;
  await context.persistBoardDocument();
};

const combineShapeBounds = (context: BoardAgentExecutionContext, shapeIds: string[]) => {
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

const resolveRequestedShapeIds = (
  context: BoardAgentExecutionContext,
  input: Record<string, unknown>,
  minimum = 1
) => {
  const requested = Array.isArray(input.shapeIds)
    ? input.shapeIds.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    : [];
  const fallback = requested.length > 0 ? requested : getSelectedShapeIds(context);
  const existing = fallback.filter((shapeId) => !!context.editor.getShape(shapeId as never));
  return existing.length >= minimum ? existing : [];
};

const resolvePlacementPosition = (
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

const buildBoardAgentNote = (context: BoardAgentExecutionContext, input: {
  title: string;
  content: string;
  kind?: WorkspaceItem['kind'];
}) => {
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

const buildArtifactFromInput = (context: BoardAgentExecutionContext, input: {
  title: string;
  content: string;
  artifactType?: Artifact['artifactType'];
}): Artifact => {
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
    caseId: context.workspace.id,
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

const resolveEntryFromInput = (
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

const resolveWorkspaceItemText = (
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

  const selectedRef = getSelectedLinkedRefs(context).find((ref) => ref.refKind === 'WORKSPACE_ITEM');
  if (selectedRef) {
    const item = getWorkspaceItemById(context, selectedRef.refId);
    if (item?.textContent || item?.description) {
      return item.textContent || item.description || '';
    }
  }

  return '';
};

const complete = (
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

const reject = (
  type: BoardAgentAction['type'],
  message: string,
  normalizedInput?: Record<string, unknown>
): BoardAgentActionExecutionResult => ({
  type,
  status: 'REJECTED',
  error: message,
  normalizedInput,
});

const executePlaceLinkedCard = async (
  context: BoardAgentExecutionContext,
  type: BoardAgentAction['type'],
  input: Record<string, unknown>
) => {
  const entry = resolveEntryFromInput(context, input);
  if (!entry) {
    return reject(type, 'Referenced workspace item was not found.', {
      refKind: normalizeText(input.refKind),
      refId: normalizeText(input.refId),
    });
  }

  const card = buildBoardCardSpec(entry);
  const position = resolvePlacementPosition(context, input, card.w, card.h);
  const { shapeId } = placeEntryOnBoard(
    context.editor,
    entry,
    position.x,
    position.y,
    context.themeMode
  );
  await persistBoardMutation(context);

  return complete(type, {
    normalizedInput: {
      refKind: entry.refKind,
      refId: entry.refId,
      x: position.x,
      y: position.y,
    },
    result: {
      title: entry.title,
      shapeId,
    },
    affectedCanonicalIds: [entry.refId],
    affectedBoardShapeIds: [shapeId as string],
  });
};

export const executeBoardAgentStructuredAction = async ({
  action,
  context,
}: ExecuteBoardAgentStructuredActionInput): Promise<BoardAgentActionExecutionResult> => {
  const input = isRecord(action.input) ? action.input : {};
  const type = action.type;

  switch (type) {
    case 'MESSAGE': {
      const text = normalizeText(input.text ?? input.message) || action.rationale || '';
      return complete(type, {
        normalizedInput: text ? { text } : {},
        result: text ? { text } : undefined,
      });
    }

    case 'THINK': {
      const text = normalizeText(input.text ?? input.thought) || action.rationale || '';
      return complete(type, {
        normalizedInput: text ? { text } : {},
        result: text ? { text } : undefined,
      });
    }

    case 'UPDATE_TODO': {
      const items = normalizeBoardAgentTodoItems(input.items ?? input.todo ?? input.todos);
      const fallbackText = normalizeText(input.text);
      const normalizedItems =
        items.length > 0
          ? items
          : fallbackText
            ? [{ id: 'todo-0', text: fallbackText, status: 'PENDING' as const }]
            : [];
      if (normalizedItems.length === 0) {
        return reject(type, 'Todo update did not include any valid items.');
      }
      return complete(type, {
        normalizedInput: {
          items: normalizedItems,
        },
        result: {
          count: normalizedItems.length,
        },
        todoItems: normalizedItems,
      });
    }

    case 'SET_VIEWPORT': {
      const shapeIds = resolveRequestedShapeIds(context, input);
      const bounds =
        shapeIds.length > 0
          ? combineShapeBounds(context, shapeIds)
          : {
              x: toNumber(input.x) ?? context.editor.getViewportPageBounds().x,
              y: toNumber(input.y) ?? context.editor.getViewportPageBounds().y,
              w: toNumber(input.w) ?? context.editor.getViewportPageBounds().w,
              h: toNumber(input.h) ?? context.editor.getViewportPageBounds().h,
            };
      if (!bounds || bounds.w <= 0 || bounds.h <= 0) {
        return reject(type, 'Viewport bounds were missing or invalid.');
      }
      context.editor.zoomToBounds(bounds, { targetZoom: 1, animation: { duration: 180 } });
      return complete(type, {
        normalizedInput: {
          ...bounds,
          shapeIds: shapeIds.length > 0 ? shapeIds : undefined,
        },
        result: bounds,
        affectedBoardShapeIds: shapeIds.length > 0 ? shapeIds : undefined,
      });
    }

    case 'PLACE_LINKED_CARD':
    case 'ATTACH_ARTIFACT_SUMMARY':
      return executePlaceLinkedCard(context, type, input);

    case 'MOVE_SHAPES': {
      const shapeIds = resolveRequestedShapeIds(context, input);
      const dx = toNumber(input.dx) ?? 0;
      const dy = toNumber(input.dy) ?? 0;
      if (shapeIds.length === 0) {
        return reject(type, 'No valid shapes were available to move.');
      }
      if (dx === 0 && dy === 0) {
        return reject(type, 'Move action requires a non-zero delta.', { shapeIds, dx, dy });
      }
      context.editor.updateShapes(
        shapeIds
          .map((shapeId) => context.editor.getShape(shapeId as never))
          .filter((shape): shape is NonNullable<typeof shape> => !!shape)
          .map((shape) => ({
            id: shape.id,
            type: shape.type,
            x: shape.x + dx,
            y: shape.y + dy,
          }))
      );
      await persistBoardMutation(context);
      return complete(type, {
        normalizedInput: { shapeIds, dx, dy },
        result: { movedCount: shapeIds.length },
        affectedBoardShapeIds: shapeIds,
      });
    }

    case 'ALIGN_SHAPES': {
      const shapeIds = resolveRequestedShapeIds(context, input, 2);
      const operation = normalizeText(input.operation || input.direction).toLowerCase();
      const normalizedOperation =
        operation === 'top' ||
        operation === 'bottom' ||
        operation === 'left' ||
        operation === 'right' ||
        operation === 'center-horizontal' ||
        operation === 'center-vertical'
          ? operation
          : null;
      if (shapeIds.length < 2 || !normalizedOperation) {
        return reject(type, 'Align action requires at least two shapes and a valid direction.');
      }
      context.editor.alignShapes(shapeIds as never[], normalizedOperation);
      await persistBoardMutation(context);
      return complete(type, {
        normalizedInput: { shapeIds, operation: normalizedOperation },
        result: { alignedCount: shapeIds.length },
        affectedBoardShapeIds: shapeIds,
      });
    }

    case 'DISTRIBUTE_SHAPES': {
      const shapeIds = resolveRequestedShapeIds(context, input, 3);
      const operation = normalizeText(input.operation || input.direction).toLowerCase();
      const normalizedOperation =
        operation === 'horizontal' || operation === 'vertical' ? operation : null;
      if (shapeIds.length < 3 || !normalizedOperation) {
        return reject(
          type,
          'Distribute action requires at least three shapes and a valid axis.'
        );
      }
      context.editor.distributeShapes(shapeIds as never[], normalizedOperation);
      await persistBoardMutation(context);
      return complete(type, {
        normalizedInput: { shapeIds, operation: normalizedOperation },
        result: { distributedCount: shapeIds.length },
        affectedBoardShapeIds: shapeIds,
      });
    }

    case 'GROUP_SELECTION': {
      const shapeIds = resolveRequestedShapeIds(context, input, 2);
      if (shapeIds.length < 2) {
        return reject(type, 'Group action requires at least two valid shapes.');
      }
      const groupId = createShapeId();
      context.editor.groupShapes(shapeIds as never[], { groupId });
      await persistBoardMutation(context);
      return complete(type, {
        normalizedInput: { shapeIds },
        result: { groupId: groupId as string },
        affectedBoardShapeIds: [groupId as string, ...shapeIds],
      });
    }

    case 'CREATE_CONNECTOR': {
      const fromShapeId = normalizeText(input.fromShapeId) || getSelectedShapeIds(context)[0] || '';
      const toShapeId = normalizeText(input.toShapeId) || getSelectedShapeIds(context)[1] || '';
      if (!fromShapeId || !toShapeId || fromShapeId === toShapeId) {
        return reject(type, 'Connector action requires two distinct shapes.');
      }
      const fromBounds = context.editor.getShapePageBounds(fromShapeId as never);
      const toBounds = context.editor.getShapePageBounds(toShapeId as never);
      if (!fromBounds || !toBounds) {
        return reject(type, 'Connector action referenced a missing shape.', {
          fromShapeId,
          toShapeId,
        });
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
          text: normalizeText(input.label),
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

      return complete(type, {
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
    }

    case 'CREATE_BOARD_NOTE':
    case 'CREATE_WORKSPACE_NOTE': {
      const content = resolveWorkspaceItemText(context, input) || normalizeText(input.content ?? input.text);
      if (!content) {
        return reject(type, 'Note action did not include any usable text.');
      }
      const title =
        normalizeText(input.title) ||
        summarizeText(content.split(/\r?\n/).find(Boolean) || DEFAULT_NOTE_TITLE, 72);
      const item = buildBoardAgentNote(context, { title, content, kind: 'NOTE' });
      await context.createWorkspaceItem(item);
      context.workspaceItems.unshift(item);

      const shouldPlaceOnBoard =
        type === 'CREATE_BOARD_NOTE' || input.placeOnBoard !== false;
      const affectedBoardShapeIds: string[] = [];
      if (shouldPlaceOnBoard) {
        const entry = buildWorkspaceLibraryEntries({
          workspaceId: context.workspace.id,
          artifacts: [],
          headlines: [],
          workspaceItems: [item],
        })[0];
        if (entry) {
          const card = buildBoardCardSpec(entry);
          const position = resolvePlacementPosition(context, input, card.w, card.h);
          const placed = placeEntryOnBoard(
            context.editor,
            entry,
            position.x,
            position.y,
            context.themeMode
          );
          affectedBoardShapeIds.push(placed.shapeId as string);
          await persistBoardMutation(context);
        }
      }

      return complete(type, {
        normalizedInput: {
          title,
          content,
          placeOnBoard: shouldPlaceOnBoard,
        },
        result: {
          workspaceItemId: item.id,
        },
        affectedCanonicalIds: [item.id],
        affectedBoardShapeIds: affectedBoardShapeIds.length > 0 ? affectedBoardShapeIds : undefined,
      });
    }

    case 'PROMOTE_EXCERPT': {
      const content =
        normalizeText(input.content ?? input.text) ||
        resolveWorkspaceItemText(context, input);
      if (!content) {
        return reject(type, 'Excerpt action did not include any usable text.');
      }
      const selectedRef = getSelectedLinkedRefs(context)[0];
      const title =
        normalizeText(input.title) ||
        (selectedRef ? `${selectedRef.title} Excerpt` : 'Board Agent Excerpt');
      const item = buildBoardAgentNote(context, { title, content, kind: 'EXCERPT' });
      item.provenance = {
        source: 'BOARD_AGENT',
        sourceBoardId: context.board.id,
        description: 'Promoted excerpt from a board-agent action.',
        metadata: {
          boardAgentSessionId: context.session.id,
          sourceRefKind: selectedRef?.refKind,
          sourceRefId: selectedRef?.refId,
        } as Record<string, unknown>,
      };
      await context.createWorkspaceItem(item);
      context.workspaceItems.unshift(item);
      return complete(type, {
        normalizedInput: {
          title,
          content,
          sourceRefKind: selectedRef?.refKind,
          sourceRefId: selectedRef?.refId,
        },
        result: {
          workspaceItemId: item.id,
        },
        affectedCanonicalIds: [item.id, ...(selectedRef?.refId ? [selectedRef.refId] : [])],
      });
    }

    case 'CREATE_ARTIFACT_DRAFT': {
      const content = resolveWorkspaceItemText(context, input) || normalizeText(input.content ?? input.text);
      if (!content) {
        return reject(type, 'Artifact draft action did not include any usable text.');
      }
      const title =
        normalizeText(input.title) ||
        summarizeText(content.split(/\r?\n/).find(Boolean) || 'Board Agent Draft', 96);
      const artifact = buildArtifactFromInput(context, {
        title,
        content,
        artifactType:
          typeof input.artifactType === 'string'
            ? (input.artifactType as Artifact['artifactType'])
            : undefined,
      });
      const savedArtifact = await context.saveArtifact(artifact, {
        topic: context.workspace.title,
        summary: context.workspace.description || `${context.workspace.title} workspace`,
      });
      context.artifacts.unshift(savedArtifact);

      const affectedBoardShapeIds: string[] = [];
      if (input.placeOnBoard === true && savedArtifact.id) {
        const artifactRef = buildWorkspaceArtifactReference(context.workspace.id, {
          ...savedArtifact,
          id: savedArtifact.id,
        });
        const entry = buildWorkspaceLibraryEntries({
          workspaceId: context.workspace.id,
          artifacts: [{ ...savedArtifact, id: savedArtifact.id }],
          headlines: [],
          workspaceItems: [],
        }).find((candidate) => candidate.refId === artifactRef.refId);
        if (entry) {
          const card = buildBoardCardSpec(entry);
          const position = resolvePlacementPosition(context, input, card.w, card.h);
          const placed = placeEntryOnBoard(
            context.editor,
            entry,
            position.x,
            position.y,
            context.themeMode
          );
          affectedBoardShapeIds.push(placed.shapeId as string);
          await persistBoardMutation(context);
        }
      }

      return complete(type, {
        normalizedInput: {
          title,
          artifactType: artifact.artifactType,
          placeOnBoard: input.placeOnBoard === true,
        },
        result: {
          artifactId: savedArtifact.id,
          topic: savedArtifact.topic,
        },
        affectedCanonicalIds: savedArtifact.id ? [savedArtifact.id] : undefined,
        affectedBoardShapeIds: affectedBoardShapeIds.length > 0 ? affectedBoardShapeIds : undefined,
      });
    }

    case 'APPEND_NOTE_TO_ARTIFACT': {
      const artifactId = normalizeText(input.artifactId);
      const content = resolveWorkspaceItemText(context, input) || normalizeText(input.content ?? input.text);
      if (!artifactId || !content) {
        return reject(type, 'Append action requires an artifact id and note content.', {
          artifactId,
        });
      }
      const artifact = getArtifactById(context, artifactId);
      if (!artifact) {
        return reject(type, 'Target artifact was not found.', { artifactId });
      }
      const now = Date.now();
      const section: ArtifactSection = {
        id: createLocalId('board-agent-section'),
        kind: 'CUSTOM',
        title:
          normalizeText(input.title) ||
          `Board Agent Note ${new Date(now).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}`,
        content,
        order: now,
      };
      await context.appendSectionToReport(artifactId, section);
      return complete(type, {
        normalizedInput: {
          artifactId,
          title: section.title,
        },
        result: {
          sectionId: section.id,
        },
        affectedCanonicalIds: [artifactId],
      });
    }

    case 'CREATE_FOLLOW_UP_RUN': {
      if (!context.launchInvestigation) {
        return reject(type, 'Follow-up run launch is not available in this view.');
      }
      const topic =
        normalizeText(input.topic) ||
        normalizeText(input.title) ||
        normalizeText(input.prompt) ||
        `Follow up on ${context.workspace.title}`;
      const request = {
        topic,
        parentContext: {
          topic: context.workspace.title,
          summary: context.workspace.description || `${context.workspace.title} workspace`,
        },
        configOverride: {
          provider: context.session.provider,
          modelId: context.session.modelId,
        },
        packId: context.workspace.packId,
        purposeId: context.workspace.purposeId,
        labelProfileId: context.workspace.labelProfileId,
        launchSource: 'BOARD_AGENT_FOLLOW_UP',
        parentArtifactId: normalizeText(input.parentArtifactId) || undefined,
      };
      await context.launchInvestigation(request);
      return complete(type, {
        normalizedInput: request,
        result: {
          topic,
        },
        affectedCanonicalIds: request.parentArtifactId ? [request.parentArtifactId] : undefined,
      });
    }

    case 'SCHEDULE_FOLLOW_UP': {
      const prompt =
        normalizeText(input.prompt) ||
        normalizeText(input.text) ||
        action.rationale ||
        '';
      if (!prompt) {
        return reject(type, 'Follow-up scheduling requires a prompt.');
      }
      return complete(type, {
        normalizedInput: {
          prompt,
        },
        result: {
          queued: true,
        },
        followUp: {
          prompt,
          sourceActionType: type,
        },
      });
    }

    case 'REVIEW_REGION': {
      const shapeIds = resolveRequestedShapeIds(context, input);
      const bounds =
        shapeIds.length > 0
          ? combineShapeBounds(context, shapeIds)
          : {
              x: toNumber(input.x),
              y: toNumber(input.y),
              w: toNumber(input.w),
              h: toNumber(input.h),
            };
      const prompt =
        normalizeText(input.prompt) ||
        action.rationale ||
        'Review the region you just worked on for unsupported claims, spacing issues, and missing evidence.';
      if (
        !bounds ||
        bounds.x === null ||
        bounds.y === null ||
        bounds.w === null ||
        bounds.h === null ||
        bounds.w <= 0 ||
        bounds.h <= 0
      ) {
        return reject(type, 'Review action requires a valid region or shape selection.');
      }
      const normalizedBounds = {
        x: bounds.x,
        y: bounds.y,
        w: bounds.w,
        h: bounds.h,
      };
      context.editor.zoomToBounds(normalizedBounds, {
        targetZoom: 1,
        animation: { duration: 180 },
      });
      return complete(type, {
        normalizedInput: {
          ...normalizedBounds,
          prompt,
          shapeIds: shapeIds.length > 0 ? shapeIds : undefined,
        },
        result: {
          queued: true,
        },
        affectedBoardShapeIds: shapeIds.length > 0 ? shapeIds : undefined,
        followUp: {
          prompt,
          sourceActionType: type,
        },
      });
    }

    default:
      return reject(type, `Unsupported board-agent action type: ${type}`);
  }
};

export const isBoardAgentActionFailureTerminal = (result: BoardAgentActionExecutionResult) =>
  result.status === 'FAILED' ||
  (result.status === 'REJECTED' &&
    result.type !== 'MESSAGE' &&
    result.type !== 'THINK' &&
    result.type !== 'UPDATE_TODO');

export const isBoardAgentMutationType = (type: BoardAgentAction['type']) =>
  BOARD_MUTATING_ACTION_TYPES.has(type);
