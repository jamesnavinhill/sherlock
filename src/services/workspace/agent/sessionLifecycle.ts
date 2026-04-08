import type { BoardAgentAction, BoardAgentSession } from '@/types';
import type { BoardAgentStructuredAction } from '@/services/providers/types';
import { createLocalId } from '@/utils/id';
import { getBoardAgentReviewDefaultSelection } from './actions/review';

type BoardAgentSessionPatch = Partial<
  Omit<BoardAgentSession, 'id' | 'workspaceId' | 'boardId' | 'createdAt'>
>;

type BoardAgentActionPatch = Partial<
  Omit<BoardAgentAction, 'id' | 'sessionId' | 'workspaceId' | 'boardId' | 'createdAt'>
>;

interface ApplyBoardAgentSessionPatchInput {
  metadataPatch?: Record<string, unknown>;
  patch: BoardAgentSessionPatch;
  session: BoardAgentSession;
  updateBoardAgentSession: (
    sessionId: string,
    patch: BoardAgentSessionPatch
  ) => Promise<void>;
}

interface ApplyBoardAgentActionPatchInput {
  action: BoardAgentAction;
  patch: BoardAgentActionPatch;
  sessionId: string;
  updateBoardAgentAction: (
    actionId: string,
    sessionId: string,
    patch: BoardAgentActionPatch
  ) => Promise<void>;
}

interface CreatePendingBoardAgentActionsInput {
  actions: BoardAgentStructuredAction[];
  addBoardAgentAction: (action: BoardAgentAction) => Promise<void>;
  boardId: string;
  session: BoardAgentSession;
  workspaceId: string;
}

export interface PendingBoardAgentAction {
  persistedAction: BoardAgentAction;
  structuredAction: BoardAgentStructuredAction;
}

export const mergeBoardAgentSessionMetadata = (
  session: BoardAgentSession,
  patch: Record<string, unknown>
): Record<string, unknown> => ({
  ...(session.metadata || {}),
  ...patch,
});

export const applyBoardAgentSessionPatch = async ({
  metadataPatch,
  patch,
  session,
  updateBoardAgentSession,
}: ApplyBoardAgentSessionPatchInput): Promise<BoardAgentSession> => {
  const nextPatch = {
    ...patch,
    ...(metadataPatch
      ? {
          metadata: mergeBoardAgentSessionMetadata(session, metadataPatch),
        }
      : {}),
  };

  await updateBoardAgentSession(session.id, nextPatch);
  return {
    ...session,
    ...nextPatch,
  };
};

export const applyBoardAgentActionPatch = async ({
  action,
  patch,
  sessionId,
  updateBoardAgentAction,
}: ApplyBoardAgentActionPatchInput): Promise<BoardAgentAction> => {
  await updateBoardAgentAction(action.id, sessionId, patch);
  return {
    ...action,
    ...patch,
  };
};

export const createPendingBoardAgentActions = async ({
  actions,
  addBoardAgentAction,
  boardId,
  session,
  workspaceId,
}: CreatePendingBoardAgentActionsInput): Promise<PendingBoardAgentAction[]> => {
  const pendingActions: PendingBoardAgentAction[] = [];

  for (const structuredAction of actions) {
    const now = Date.now();
    const action: BoardAgentAction = {
      id: createLocalId('board-agent-action'),
      sessionId: session.id,
      workspaceId,
      boardId,
      type: structuredAction.type,
      status: 'AWAITING_APPROVAL',
      input: structuredAction.input,
      createdAt: now,
      updatedAt: now,
    };

    await addBoardAgentAction(action);
    pendingActions.push({ persistedAction: action, structuredAction });
  }

  return pendingActions;
};

export const getDefaultSelectedBoardActionIds = ({
  autoApproveOrganizationActions,
  pendingActions,
}: {
  autoApproveOrganizationActions: boolean;
  pendingActions: PendingBoardAgentAction[];
}) =>
  pendingActions
    .filter(({ persistedAction }) =>
      getBoardAgentReviewDefaultSelection(
        persistedAction.type,
        autoApproveOrganizationActions
      )
    )
    .map(({ persistedAction }) => persistedAction.id);
