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
import { createLocalId } from '@/utils/id';
import {
  streamBoardAgentPass,
  type RunBoardAgentPassInput,
} from './runtime';
import {
  executeBoardAgentStructuredAction,
  isBoardAgentActionFailureTerminal,
} from './actions/registry';
import type { BoardAgentTodoItem } from './actions/types';
import { getBoardAgentReviewDefaultSelection } from './actions/review';
import type { BoardThemeMode } from '../boardShapes';
import type { Editor } from 'tldraw';

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
  appendSectionToReport: (reportId: string, section: ArtifactSection) => Promise<void>;
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

const mergeSessionMetadata = (
  session: BoardAgentSession,
  patch: Record<string, unknown>
): Record<string, unknown> => ({
  ...(session.metadata || {}),
  ...patch,
});

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
    await input.updateBoardAgentSession(session.id, {
      status: 'RUNNING',
      requestState: 'ASSEMBLING_CONTEXT',
      startedAt: Date.now(),
      metadata: mergeSessionMetadata(session, {
        packId: input.packId || input.workspace.packId,
        purposeId: input.purposeId || input.workspace.purposeId,
      }),
    });
    session = {
      ...session,
      status: 'RUNNING',
      requestState: 'ASSEMBLING_CONTEXT',
      startedAt: Date.now(),
      metadata: mergeSessionMetadata(session, {
        packId: input.packId || input.workspace.packId,
        purposeId: input.purposeId || input.workspace.purposeId,
      }),
    };

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

      await input.updateBoardAgentSession(session.id, {
        request: currentRequest,
        requestState: 'STREAMING',
        updatedAt: Date.now(),
        metadata: mergeSessionMetadata(session, {
          passCount: passIndex - 1,
          todoItems,
          latestMessage,
        }),
      });
      session = {
        ...session,
        request: currentRequest,
        requestState: 'STREAMING',
        updatedAt: Date.now(),
        metadata: mergeSessionMetadata(session, {
          passCount: passIndex - 1,
          todoItems,
          latestMessage,
        }),
      };

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

      const sessionPatch: Partial<Omit<BoardAgentSession, 'id' | 'workspaceId' | 'boardId' | 'createdAt'>> =
        {
          requestState: 'EXECUTING_ACTIONS',
          contextSnapshotId: pass.contextSnapshot.id,
          provider: pass.response.provider,
          modelId: pass.response.modelId,
          title: pass.response.suggestedTitle || session.title,
          metadata: mergeSessionMetadata(session, {
            latestMessage: pass.response.message,
            passCount: passIndex,
            todoItems,
          }),
          updatedAt: Date.now(),
        };
      await input.updateBoardAgentSession(session.id, sessionPatch);
      session = {
        ...session,
        ...sessionPatch,
      };
      latestMessage = pass.response.message;

      const nextPrompts: string[] = [];
      const pendingActions: Array<{
        persistedAction: BoardAgentAction;
        structuredAction: typeof pass.response.actions[number];
      }> = [];

      for (const structuredAction of pass.response.actions) {
        throwIfAborted(input.signal);
        const now = Date.now();
        const action: BoardAgentAction = {
          id: createLocalId('board-agent-action'),
          sessionId: session.id,
          workspaceId: input.workspace.id,
          boardId: input.board.id,
          type: structuredAction.type,
          status: 'AWAITING_APPROVAL',
          input: structuredAction.input,
          createdAt: now,
          updatedAt: now,
        };

        await input.addBoardAgentAction(action);
        pendingActions.push({ persistedAction: action, structuredAction });
      }

      if (pendingActions.length > 0) {
        const defaultSelectedActionIds = pendingActions
          .filter(({ persistedAction }) =>
            getBoardAgentReviewDefaultSelection(
              persistedAction.type,
              autoApproveOrganizationActions
            )
          )
          .map(({ persistedAction }) => persistedAction.id);

        if (input.requestReview) {
          await input.updateBoardAgentSession(session.id, {
            requestState: 'AWAITING_APPROVAL',
            updatedAt: Date.now(),
            metadata: mergeSessionMetadata(session, {
              latestMessage,
              passCount: passIndex,
              todoItems,
              awaitingApprovalActionIds: pendingActions.map(
                ({ persistedAction }) => persistedAction.id
              ),
            }),
          });
          session = {
            ...session,
            requestState: 'AWAITING_APPROVAL',
            updatedAt: Date.now(),
            metadata: mergeSessionMetadata(session, {
              latestMessage,
              passCount: passIndex,
              todoItems,
              awaitingApprovalActionIds: pendingActions.map(
                ({ persistedAction }) => persistedAction.id
              ),
            }),
          };
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
            await input.updateBoardAgentAction(persistedAction.id, session.id, {
              status: 'CANCELLED',
              updatedAt: Date.now(),
            });
          }

          await input.updateBoardAgentSession(session.id, {
            status: 'CANCELLED',
            requestState: 'CANCELLED',
            completedAt: Date.now(),
            metadata: mergeSessionMetadata(session, {
              latestMessage,
              passCount: passIndex,
              todoItems,
            }),
          });
          session = {
            ...session,
            status: 'CANCELLED',
            requestState: 'CANCELLED',
            completedAt: Date.now(),
            metadata: mergeSessionMetadata(session, {
              latestMessage,
              passCount: passIndex,
              todoItems,
            }),
          };

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

        await input.updateBoardAgentSession(session.id, {
          requestState: 'EXECUTING_ACTIONS',
          updatedAt: Date.now(),
          metadata: mergeSessionMetadata(session, {
            latestMessage,
            passCount: passIndex,
            todoItems,
            awaitingApprovalActionIds: [],
          }),
        });
        session = {
          ...session,
          requestState: 'EXECUTING_ACTIONS',
          updatedAt: Date.now(),
          metadata: mergeSessionMetadata(session, {
            latestMessage,
            passCount: passIndex,
            todoItems,
            awaitingApprovalActionIds: [],
          }),
        };

        for (const { persistedAction, structuredAction } of pendingActions) {
          throwIfAborted(input.signal);

          if (!approvedActionIds.has(persistedAction.id) || skippedActionIds.has(persistedAction.id)) {
            const skippedAction: BoardAgentAction = {
              ...persistedAction,
              status: 'SKIPPED',
              result: {
                reviewDecision: 'SKIPPED',
              },
              updatedAt: Date.now(),
            };

            await input.updateBoardAgentAction(skippedAction.id, session.id, {
              status: skippedAction.status,
              result: skippedAction.result,
              updatedAt: skippedAction.updatedAt,
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

          await input.updateBoardAgentAction(persistedAction.id, session.id, {
            status: 'RUNNING',
            updatedAt: Date.now(),
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
              appendSectionToReport: input.appendSectionToReport,
              launchInvestigation: input.launchInvestigation,
            },
          });

          const mergedResult = {
            ...(execution.result || {}),
            ...(execution.followUp?.prompt
              ? { queuedFollowUpPrompt: execution.followUp.prompt }
              : {}),
          };

          const finalizedAction: BoardAgentAction = {
            ...persistedAction,
            status: execution.status,
            normalizedInput: execution.normalizedInput,
            result: Object.keys(mergedResult).length > 0 ? mergedResult : undefined,
            affectedCanonicalIds: execution.affectedCanonicalIds,
            affectedBoardShapeIds: execution.affectedBoardShapeIds,
            error: execution.error,
            updatedAt: Date.now(),
          };

          await input.updateBoardAgentAction(persistedAction.id, session.id, {
            status: finalizedAction.status,
            normalizedInput: finalizedAction.normalizedInput,
            result: finalizedAction.result,
            affectedCanonicalIds: finalizedAction.affectedCanonicalIds,
            affectedBoardShapeIds: finalizedAction.affectedBoardShapeIds,
            error: finalizedAction.error,
            updatedAt: finalizedAction.updatedAt,
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
            await input.updateBoardAgentSession(session.id, {
              status: 'FAILED',
              requestState: 'FAILED',
              lastError: errorMessage,
              completedAt: Date.now(),
              metadata: mergeSessionMetadata(session, {
                latestMessage,
                passCount: passIndex,
                todoItems,
              }),
            });
            session = {
              ...session,
              status: 'FAILED',
              requestState: 'FAILED',
              lastError: errorMessage,
              completedAt: Date.now(),
              metadata: mergeSessionMetadata(session, {
                latestMessage,
                passCount: passIndex,
                todoItems,
              }),
            };
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

    await input.updateBoardAgentSession(session.id, {
      status: 'COMPLETED',
      requestState: 'COMPLETED',
      completedAt: Date.now(),
      metadata: mergeSessionMetadata(session, {
        latestMessage,
        passCount: passIndex,
        todoItems,
      }),
    });
    session = {
      ...session,
      status: 'COMPLETED',
      requestState: 'COMPLETED',
      completedAt: Date.now(),
      metadata: mergeSessionMetadata(session, {
        latestMessage,
        passCount: passIndex,
        todoItems,
      }),
    };
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

    await input.updateBoardAgentSession(session.id, {
      status: nextStatus,
      requestState: nextState,
      lastError: isAbortError(error) ? undefined : message,
      completedAt: Date.now(),
      metadata: mergeSessionMetadata(session, {
        latestMessage,
        passCount: passIndex,
        todoItems,
      }),
    });
    session = {
      ...session,
      status: nextStatus,
      requestState: nextState,
      lastError: isAbortError(error) ? undefined : message,
      completedAt: Date.now(),
      metadata: mergeSessionMetadata(session, {
        latestMessage,
        passCount: passIndex,
        todoItems,
      }),
    };

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
