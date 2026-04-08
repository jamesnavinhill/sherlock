import { getSnapshot } from 'tldraw';
import type {
  BoardAgentAction,
  BoardAgentSession,
  InvestigationLaunchRequest,
  Workspace,
  WorkspaceBoard,
  WorkspaceBoardDocument,
  WorkspaceItem,
  Artifact,
  ArtifactSection,
  Headline,
} from '@/types';
import type { BoardAgentStreamEvent, RouterBoardAgentRequest } from '@/services/providers/types';
import {
  streamBoardAgentPass,
  type RunBoardAgentPassInput,
} from './runtime';
import {
  executeBoardAgentStructuredAction,
  isBoardAgentActionFailureTerminal,
} from './actions/registry';
import type { BoardAgentTodoItem } from './actions/types';
import type { BoardThemeMode } from '../boardShapes';
import type { Editor } from 'tldraw';
import {
  applyBoardAgentActionPatch,
  applyBoardAgentSessionPatch,
  createPendingBoardAgentActions,
  getDefaultSelectedBoardActionIds,
} from './sessionLifecycle';

interface BoardAgentSessionStore {
  createBoardAgentSession: (input: {
    workspaceId: string;
    boardId: string;
    title?: string;
    request: string;
    provider?: BoardAgentSession['provider'];
    modelId?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<BoardAgentSession>;
  updateBoardAgentSession: (
    sessionId: string,
    patch: Partial<Omit<BoardAgentSession, 'id' | 'workspaceId' | 'boardId' | 'createdAt'>>
  ) => Promise<void>;
  addBoardAgentAction: (action: BoardAgentAction) => Promise<void>;
  updateBoardAgentAction: (
    actionId: string,
    sessionId: string,
    patch: Partial<Omit<BoardAgentAction, 'id' | 'sessionId' | 'workspaceId' | 'boardId' | 'createdAt'>>
  ) => Promise<void>;
}

export interface BoardAgentReviewRequest {
  session: BoardAgentSession;
  passIndex: number;
  message: string;
  actions: BoardAgentAction[];
  defaultSelectedActionIds: string[];
}

export interface BoardAgentReviewDecision {
  approvedActionIds: string[];
  skippedActionIds?: string[];
  cancelled?: boolean;
}

export interface RunBoardAgentSessionInput extends BoardAgentSessionStore {
  workspace: Workspace;
  board: WorkspaceBoard;
  boardDocument?: WorkspaceBoardDocument | null;
  editor: Editor;
  themeMode: BoardThemeMode;
  artifacts: Artifact[];
  headlines: Headline[];
  workspaceItems: WorkspaceItem[];
  userRequest: string;
  selectedShapeIds?: string[];
  viewportBounds?: RunBoardAgentPassInput['viewportBounds'];
  configOverride?: RouterBoardAgentRequest['configOverride'];
  packId?: string;
  purposeId?: string;
  recentSessions?: BoardAgentSession[];
  recentActions?: BoardAgentAction[];
  signal?: AbortSignal;
  maxPasses?: number;
  autoApproveOrganizationActions?: boolean;
  persistBoardDocument?: () => Promise<void>;
  createWorkspaceItem: (item: WorkspaceItem) => Promise<void>;
  saveArtifact: (
    artifact: Artifact,
    parentContext?: { topic: string; summary: string }
  ) => Promise<Artifact>;
  appendSectionToArtifact: (reportId: string, section: ArtifactSection) => Promise<void>;
  launchInvestigation?: (request: InvestigationLaunchRequest) => Promise<void> | void;
  requestReview?: (
    request: BoardAgentReviewRequest
  ) => Promise<BoardAgentReviewDecision>;
  onEvent?: (event: {
    type: 'SESSION_CREATED' | 'PASS_START' | 'MESSAGE' | 'ACTION' | 'SESSION_COMPLETE' | 'SESSION_FAILED';
    session: BoardAgentSession;
    passIndex?: number;
    message?: string;
    action?: BoardAgentAction;
    error?: string;
  }) => void;
}

export interface RunBoardAgentSessionResult {
  session: BoardAgentSession;
  message: string;
  actions: BoardAgentAction[];
  todoItems: BoardAgentTodoItem[];
  passCount: number;
}

const buildBoardDocumentSnapshot = (
  board: WorkspaceBoard,
  editor: Editor
): WorkspaceBoardDocument => ({
  boardId: board.id,
  snapshot: getSnapshot(editor.store) as unknown,
  updatedAt: Date.now(),
});

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw new DOMException('The board-agent run was cancelled.', 'AbortError');
  }
};

const isAbortError = (error: unknown) =>
  error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error
      ? error.name === 'AbortError'
      : false;

export const runBoardAgentSession = async (
  input: RunBoardAgentSessionInput
): Promise<RunBoardAgentSessionResult> => {
  const maxPasses = Math.max(1, Math.min(input.maxPasses || 3, 6));
  const provider = input.configOverride?.provider;
  const modelId = input.configOverride?.modelId;
  const recentActions = [...(input.recentActions || [])];
  const recentSessions = [...(input.recentSessions || [])];
  const persistedActions: BoardAgentAction[] = [];
  let latestMessage = '';
  let todoItems: BoardAgentTodoItem[] = [];
  let passIndex = 0;
  let currentRequest = input.userRequest.trim();
  const autoApproveOrganizationActions = !!input.autoApproveOrganizationActions;

  let session = await input.createBoardAgentSession({
    workspaceId: input.workspace.id,
    boardId: input.board.id,
    title: input.userRequest.trim() || 'Board Agent Session',
    request: currentRequest,
    provider,
    modelId,
    metadata: {
      packId: input.packId || input.workspace.packId,
      purposeId: input.purposeId || input.workspace.purposeId,
      passCount: 0,
    },
  });

  input.onEvent?.({ type: 'SESSION_CREATED', session });

  try {
    session = await applyBoardAgentSessionPatch({
      session,
      updateBoardAgentSession: input.updateBoardAgentSession,
      patch: {
        status: 'RUNNING',
        requestState: 'ASSEMBLING_CONTEXT',
        startedAt: Date.now(),
      },
      metadataPatch: {
        packId: input.packId || input.workspace.packId,
        purposeId: input.purposeId || input.workspace.purposeId,
      },
    });

    while (passIndex < maxPasses) {
      throwIfAborted(input.signal);
      passIndex += 1;
      let streamingMessage = '';
      input.onEvent?.({ type: 'PASS_START', session, passIndex });

      const passInput: RunBoardAgentPassInput = {
        workspace: input.workspace,
        board: input.board,
        boardDocument: buildBoardDocumentSnapshot(input.board, input.editor),
        userRequest: currentRequest,
        selectedShapeIds: input.selectedShapeIds,
        viewportBounds: input.viewportBounds,
        artifacts: input.artifacts,
        headlines: input.headlines,
        workspaceItems: input.workspaceItems,
        configOverride: input.configOverride,
        packId: input.packId || input.workspace.packId,
        purposeId: input.purposeId || input.workspace.purposeId,
        recentSessions: recentSessions,
        recentActions: recentActions,
      };

      session = await applyBoardAgentSessionPatch({
        session,
        updateBoardAgentSession: input.updateBoardAgentSession,
        patch: {
          request: currentRequest,
          requestState: 'STREAMING',
          updatedAt: Date.now(),
        },
        metadataPatch: {
          passCount: passIndex - 1,
          todoItems,
          latestMessage,
        },
      });

      const pass = await streamBoardAgentPass(passInput, {
        signal: input.signal,
        onEvent: (event: BoardAgentStreamEvent) => {
          if (event.type === 'MESSAGE_DELTA' || event.type === 'COMPLETE') {
            streamingMessage =
              event.type === 'COMPLETE' ? event.response.message : `${streamingMessage}${event.delta}`;
            input.onEvent?.({
              type: 'MESSAGE',
              session,
              passIndex,
              message: streamingMessage,
            });
          }
        },
      });

      session = await applyBoardAgentSessionPatch({
        session,
        updateBoardAgentSession: input.updateBoardAgentSession,
        patch: {
          requestState: 'EXECUTING_ACTIONS',
          contextSnapshotId: pass.contextSnapshot.id,
          provider: pass.response.provider,
          modelId: pass.response.modelId,
          title: pass.response.suggestedTitle || session.title,
          updatedAt: Date.now(),
        },
        metadataPatch: {
          latestMessage: pass.response.message,
          passCount: passIndex,
          todoItems,
        },
      });
      latestMessage = pass.response.message;

      const nextPrompts: string[] = [];
      const pendingActions = await createPendingBoardAgentActions({
        actions: pass.response.actions,
        addBoardAgentAction: input.addBoardAgentAction,
        boardId: input.board.id,
        session,
        workspaceId: input.workspace.id,
      });

      if (pendingActions.length > 0) {
        const defaultSelectedActionIds = getDefaultSelectedBoardActionIds({
          autoApproveOrganizationActions,
          pendingActions,
        });

        if (input.requestReview) {
          session = await applyBoardAgentSessionPatch({
            session,
            updateBoardAgentSession: input.updateBoardAgentSession,
            patch: {
              requestState: 'AWAITING_APPROVAL',
              updatedAt: Date.now(),
            },
            metadataPatch: {
              latestMessage,
              passCount: passIndex,
              todoItems,
              awaitingApprovalActionIds: pendingActions.map(
                ({ persistedAction }) => persistedAction.id
              ),
            },
          });
        }

        const reviewDecision = input.requestReview
          ? await input.requestReview({
              session,
              passIndex,
              message: latestMessage,
              actions: pendingActions.map(({ persistedAction }) => persistedAction),
              defaultSelectedActionIds,
            })
          : {
              approvedActionIds:
                defaultSelectedActionIds.length > 0
                  ? defaultSelectedActionIds
                  : pendingActions.map(({ persistedAction }) => persistedAction.id),
            };

        if (reviewDecision.cancelled) {
          for (const { persistedAction } of pendingActions) {
            await applyBoardAgentActionPatch({
              action: persistedAction,
              sessionId: session.id,
              updateBoardAgentAction: input.updateBoardAgentAction,
              patch: {
                status: 'CANCELLED',
                updatedAt: Date.now(),
              },
            });
          }

          session = await applyBoardAgentSessionPatch({
            session,
            updateBoardAgentSession: input.updateBoardAgentSession,
            patch: {
              status: 'CANCELLED',
              requestState: 'CANCELLED',
              completedAt: Date.now(),
            },
            metadataPatch: {
              latestMessage,
              passCount: passIndex,
              todoItems,
            },
          });

          return {
            session,
            message: latestMessage,
            actions: persistedActions,
            todoItems,
            passCount: passIndex,
          };
        }

        const approvedActionIds = new Set(reviewDecision.approvedActionIds);
        const skippedActionIds = new Set(reviewDecision.skippedActionIds || []);

        session = await applyBoardAgentSessionPatch({
          session,
          updateBoardAgentSession: input.updateBoardAgentSession,
          patch: {
            requestState: 'EXECUTING_ACTIONS',
            updatedAt: Date.now(),
          },
          metadataPatch: {
            latestMessage,
            passCount: passIndex,
            todoItems,
            awaitingApprovalActionIds: [],
          },
        });

        for (const { persistedAction, structuredAction } of pendingActions) {
          throwIfAborted(input.signal);

          if (!approvedActionIds.has(persistedAction.id) || skippedActionIds.has(persistedAction.id)) {
            const skippedAction = await applyBoardAgentActionPatch({
              action: persistedAction,
              sessionId: session.id,
              updateBoardAgentAction: input.updateBoardAgentAction,
              patch: {
                status: 'SKIPPED',
                result: {
                  reviewDecision: 'SKIPPED',
                },
                updatedAt: Date.now(),
              },
            });

            persistedActions.push(skippedAction);
            recentActions.push(skippedAction);

            input.onEvent?.({
              type: 'ACTION',
              session,
              passIndex,
              action: skippedAction,
            });
            continue;
          }

          await applyBoardAgentActionPatch({
            action: persistedAction,
            sessionId: session.id,
            updateBoardAgentAction: input.updateBoardAgentAction,
            patch: {
              status: 'RUNNING',
              updatedAt: Date.now(),
            },
          });

          const execution = await executeBoardAgentStructuredAction({
            action: structuredAction,
            context: {
              session,
              workspace: input.workspace,
              board: input.board,
              editor: input.editor,
              themeMode: input.themeMode,
              artifacts: input.artifacts,
              headlines: input.headlines,
              workspaceItems: input.workspaceItems,
              persistBoardDocument: input.persistBoardDocument,
              createWorkspaceItem: input.createWorkspaceItem,
              saveArtifact: input.saveArtifact,
              appendSectionToArtifact: input.appendSectionToArtifact,
              launchInvestigation: input.launchInvestigation,
            },
          });

          const mergedResult = {
            ...(execution.result || {}),
            ...(execution.followUp?.prompt
              ? { queuedFollowUpPrompt: execution.followUp.prompt }
              : {}),
          };

          const finalizedAction = await applyBoardAgentActionPatch({
            action: persistedAction,
            sessionId: session.id,
            updateBoardAgentAction: input.updateBoardAgentAction,
            patch: {
              status: execution.status,
              normalizedInput: execution.normalizedInput,
              result: Object.keys(mergedResult).length > 0 ? mergedResult : undefined,
              affectedCanonicalIds: execution.affectedCanonicalIds,
              affectedBoardShapeIds: execution.affectedBoardShapeIds,
              error: execution.error,
              updatedAt: Date.now(),
            },
          });

          persistedActions.push(finalizedAction);
          recentActions.push(finalizedAction);
          if (execution.todoItems) {
            todoItems = execution.todoItems;
          }
          if (execution.followUp?.prompt) {
            nextPrompts.push(execution.followUp.prompt);
          }

          input.onEvent?.({
            type: 'ACTION',
            session,
            passIndex,
            action: finalizedAction,
          });

          if (isBoardAgentActionFailureTerminal(execution)) {
            const errorMessage = execution.error || 'Board-agent execution failed.';
            session = await applyBoardAgentSessionPatch({
              session,
              updateBoardAgentSession: input.updateBoardAgentSession,
              patch: {
                status: 'FAILED',
                requestState: 'FAILED',
                lastError: errorMessage,
                completedAt: Date.now(),
              },
              metadataPatch: {
                latestMessage,
                passCount: passIndex,
                todoItems,
              },
            });
            input.onEvent?.({
              type: 'SESSION_FAILED',
              session,
              passIndex,
              error: errorMessage,
            });
            return {
              session,
              message: latestMessage,
              actions: persistedActions,
              todoItems,
              passCount: passIndex,
            };
          }
        }
      }

      if (nextPrompts.length === 0) {
        break;
      }

      currentRequest = Array.from(new Set(nextPrompts)).join('\n\n');
    }

    session = await applyBoardAgentSessionPatch({
      session,
      updateBoardAgentSession: input.updateBoardAgentSession,
      patch: {
        status: 'COMPLETED',
        requestState: 'COMPLETED',
        completedAt: Date.now(),
      },
      metadataPatch: {
        latestMessage,
        passCount: passIndex,
        todoItems,
      },
    });
    input.onEvent?.({
      type: 'SESSION_COMPLETE',
      session,
      passIndex,
      message: latestMessage,
    });

    return {
      session,
      message: latestMessage,
      actions: persistedActions,
      todoItems,
      passCount: passIndex,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Board-agent execution failed unexpectedly.';
    const nextStatus = isAbortError(error) ? 'CANCELLED' : 'FAILED';
    const nextState = isAbortError(error) ? 'CANCELLED' : 'FAILED';

    session = await applyBoardAgentSessionPatch({
      session,
      updateBoardAgentSession: input.updateBoardAgentSession,
      patch: {
        status: nextStatus,
        requestState: nextState,
        lastError: isAbortError(error) ? undefined : message,
        completedAt: Date.now(),
      },
      metadataPatch: {
        latestMessage,
        passCount: passIndex,
        todoItems,
      },
    });

    if (!isAbortError(error)) {
      input.onEvent?.({
        type: 'SESSION_FAILED',
        session,
        passIndex,
        error: message,
      });
    }

    return {
      session,
      message: latestMessage,
      actions: persistedActions,
      todoItems,
      passCount: passIndex,
    };
  }
};
