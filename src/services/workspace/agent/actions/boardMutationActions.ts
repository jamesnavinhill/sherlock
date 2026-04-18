import { createShapeId } from 'tldraw';

import type { BoardAgentActionExecutionResult } from './types';
import type { BoardAgentActionExecutorInput } from './shared';
import {
  combineShapeBounds,
  complete,
  executeCreateConnector,
  getStructuredActionInput,
  normalizeText,
  persistBoardMutation,
  reject,
  resolveEntryFromInput,
  resolvePlacementPosition,
  resolveRequestedShapeIds,
  toNumber,
} from './shared';
import { buildBoardCardSpec, placeEntryOnBoard } from '../../boardShapes';

const executePlaceLinkedCard = async ({
  action,
  context,
}: BoardAgentActionExecutorInput): Promise<BoardAgentActionExecutionResult> => {
  const input = getStructuredActionInput(action);
  const entry = resolveEntryFromInput(context, input);
  if (!entry) {
    return reject(action.type, 'Referenced workspace item was not found.', {
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

  return complete(action.type, {
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

export const executeBoardAgentBoardMutationAction = async ({
  action,
  context,
}: BoardAgentActionExecutorInput): Promise<BoardAgentActionExecutionResult | null> => {
  const input = getStructuredActionInput(action);

  switch (action.type) {
    case 'SET_VIEWPORT': {
      const shapeIds = resolveRequestedShapeIds(context, input);
      const viewport = context.editor.getViewportPageBounds();
      const bounds =
        shapeIds.length > 0
          ? combineShapeBounds(context, shapeIds)
          : {
              x: toNumber(input.x) ?? viewport.x,
              y: toNumber(input.y) ?? viewport.y,
              w: toNumber(input.w) ?? viewport.w,
              h: toNumber(input.h) ?? viewport.h,
            };
      if (!bounds || bounds.w <= 0 || bounds.h <= 0) {
        return reject(action.type, 'Viewport bounds were missing or invalid.');
      }
      context.editor.zoomToBounds(bounds, { targetZoom: 1, animation: { duration: 180 } });
      return complete(action.type, {
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
      return await executePlaceLinkedCard({ action, context });

    case 'MOVE_SHAPES': {
      const shapeIds = resolveRequestedShapeIds(context, input);
      const dx = toNumber(input.dx) ?? 0;
      const dy = toNumber(input.dy) ?? 0;
      if (shapeIds.length === 0) {
        return reject(action.type, 'No valid shapes were available to move.');
      }
      if (dx === 0 && dy === 0) {
        return reject(action.type, 'Move action requires a non-zero delta.', {
          shapeIds,
          dx,
          dy,
        });
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
      return complete(action.type, {
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
        return reject(
          action.type,
          'Align action requires at least two shapes and a valid direction.'
        );
      }
      context.editor.alignShapes(shapeIds as never[], normalizedOperation);
      await persistBoardMutation(context);
      return complete(action.type, {
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
          action.type,
          'Distribute action requires at least three shapes and a valid axis.'
        );
      }
      context.editor.distributeShapes(shapeIds as never[], normalizedOperation);
      await persistBoardMutation(context);
      return complete(action.type, {
        normalizedInput: { shapeIds, operation: normalizedOperation },
        result: { distributedCount: shapeIds.length },
        affectedBoardShapeIds: shapeIds,
      });
    }

    case 'GROUP_SELECTION': {
      const shapeIds = resolveRequestedShapeIds(context, input, 2);
      if (shapeIds.length < 2) {
        return reject(action.type, 'Group action requires at least two valid shapes.');
      }
      const groupId = createShapeId();
      context.editor.groupShapes(shapeIds as never[], { groupId });
      await persistBoardMutation(context);
      return complete(action.type, {
        normalizedInput: { shapeIds },
        result: { groupId: groupId as string },
        affectedBoardShapeIds: [groupId as string, ...shapeIds],
      });
    }

    case 'CREATE_CONNECTOR': {
      const result = await executeCreateConnector(context, input);
      if (result) return result;
      return reject(action.type, 'Connector action requires two valid connected shapes.', {
        fromShapeId: normalizeText(input.fromShapeId) || undefined,
        toShapeId: normalizeText(input.toShapeId) || undefined,
      });
    }

    default:
      return null;
  }
};
