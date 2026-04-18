import { getWorkspaceDisplayTitle } from '@/domain';

import type { BoardAgentActionExecutionResult } from './types';
import type { BoardAgentActionExecutorInput } from './shared';
import {
  buildArtifactFromInput,
  buildArtifactPlacementEntry,
  buildBoardAgentNote,
  combineShapeBounds,
  complete,
  getSelectedLinkedRefs,
  getStructuredActionInput,
  getArtifactById,
  normalizeText,
  reject,
  resolvePlacementPosition,
  resolveRequestedShapeIds,
  resolveWorkspaceItemText,
  summarizeText,
  toNumber,
  persistBoardMutation,
  buildFollowUpLaunchRequest,
} from './shared';
import { buildBoardCardSpec, placeEntryOnBoard } from '../../boardShapes';
import { createLocalId } from '../../../../utils/id';
import type { Artifact, ArtifactSection } from '@/types';
import { buildWorkspaceLibraryEntries } from '../../library';

export const executeBoardAgentWorkspaceWriteAction = async ({
  action,
  context,
}: BoardAgentActionExecutorInput): Promise<BoardAgentActionExecutionResult | null> => {
  const input = getStructuredActionInput(action);

  switch (action.type) {
    case 'CREATE_BOARD_NOTE':
    case 'CREATE_WORKSPACE_NOTE': {
      const content =
        resolveWorkspaceItemText(context, input) || normalizeText(input.content ?? input.text);
      if (!content) {
        return reject(action.type, 'Note action did not include any usable text.');
      }
      const title =
        normalizeText(input.title) ||
        summarizeText(content.split(/\r?\n/).find(Boolean) || 'Board Agent Note', 72);
      const item = buildBoardAgentNote(context, { title, content, kind: 'NOTE' });
      await context.createWorkspaceItem(item);
      context.workspaceItems.unshift(item);

      const shouldPlaceOnBoard = action.type === 'CREATE_BOARD_NOTE' || input.placeOnBoard !== false;
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

      return complete(action.type, {
        normalizedInput: {
          title,
          content,
          placeOnBoard: shouldPlaceOnBoard,
        },
        result: {
          workspaceItemId: item.id,
        },
        affectedCanonicalIds: [item.id],
        affectedBoardShapeIds:
          affectedBoardShapeIds.length > 0 ? affectedBoardShapeIds : undefined,
      });
    }

    case 'PROMOTE_EXCERPT': {
      const content =
        normalizeText(input.content ?? input.text) || resolveWorkspaceItemText(context, input);
      if (!content) {
        return reject(action.type, 'Excerpt action did not include any usable text.');
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
      return complete(action.type, {
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
      const content =
        resolveWorkspaceItemText(context, input) || normalizeText(input.content ?? input.text);
      if (!content) {
        return reject(action.type, 'Artifact draft action did not include any usable text.');
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
        topic: getWorkspaceDisplayTitle(context.workspace),
        summary:
          context.workspace.description ||
          `${getWorkspaceDisplayTitle(context.workspace)} workspace`,
      });
      context.artifacts.unshift(savedArtifact);

      const affectedBoardShapeIds: string[] = [];
      if (input.placeOnBoard === true && savedArtifact.id) {
        const entry = buildArtifactPlacementEntry(context, {
          ...savedArtifact,
          id: savedArtifact.id,
        });
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

      return complete(action.type, {
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
        affectedBoardShapeIds:
          affectedBoardShapeIds.length > 0 ? affectedBoardShapeIds : undefined,
      });
    }

    case 'APPEND_NOTE_TO_ARTIFACT': {
      const artifactId = normalizeText(input.artifactId);
      const content =
        resolveWorkspaceItemText(context, input) || normalizeText(input.content ?? input.text);
      if (!artifactId || !content) {
        return reject(action.type, 'Append action requires an artifact id and note content.', {
          artifactId,
        });
      }
      const artifact = getArtifactById(context, artifactId);
      if (!artifact) {
        return reject(action.type, 'Target artifact was not found.', { artifactId });
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
      await context.appendSectionToArtifact(artifactId, section);
      return complete(action.type, {
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
        return reject(action.type, 'Follow-up run launch is not available in this view.');
      }
      const request = buildFollowUpLaunchRequest(
        context,
        input,
        `Follow up on ${getWorkspaceDisplayTitle(context.workspace)}`
      );
      await context.launchInvestigation(request);
      return complete(action.type, {
        normalizedInput: request,
        result: {
          topic: request.topic,
        },
        affectedCanonicalIds: request.parentArtifactId ? [request.parentArtifactId] : undefined,
      });
    }

    case 'SCHEDULE_FOLLOW_UP': {
      const prompt =
        normalizeText(input.prompt) || normalizeText(input.text) || action.rationale || '';
      if (!prompt) {
        return reject(action.type, 'Follow-up scheduling requires a prompt.');
      }
      return complete(action.type, {
        normalizedInput: {
          prompt,
        },
        result: {
          queued: true,
        },
        followUp: {
          prompt,
          sourceActionType: action.type,
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
        return reject(action.type, 'Review action requires a valid region or shape selection.');
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
      return complete(action.type, {
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
          sourceActionType: action.type,
        },
      });
    }

    default:
      return null;
  }
};
