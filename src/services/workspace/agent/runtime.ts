import type { BoardAgentAction, BoardAgentSession, WorkspaceBoardDocument } from '@/types';
import {
  boardAgentWithProviderRouter,
  streamBoardAgentWithProviderRouter,
} from '@/services/providers';
import type {
  BoardAgentResponse,
  BoardAgentStreamOptions,
  RouterBoardAgentRequest,
} from '@/services/providers/types';
import { buildBoardAgentContext } from './context/buildBoardAgentContext';
import type { BuildBoardAgentContextInput } from './types';

export interface RunBoardAgentPassInput
  extends Omit<BuildBoardAgentContextInput, 'recentSessions' | 'recentActions'> {
  configOverride?: RouterBoardAgentRequest['configOverride'];
  packId?: string;
  purposeId?: string;
  recentSessions?: BoardAgentSession[];
  recentActions?: BoardAgentAction[];
}

export interface RunBoardAgentPassResult {
  contextSnapshot: ReturnType<typeof buildBoardAgentContext>['snapshot'];
  response: BoardAgentResponse;
}

export const buildBoardAgentRouterRequest = (
  input: RunBoardAgentPassInput & { boardDocument?: WorkspaceBoardDocument | null }
): RouterBoardAgentRequest & {
  contextSnapshot: ReturnType<typeof buildBoardAgentContext>['snapshot'];
} => {
  const context = buildBoardAgentContext({
    workspace: input.workspace,
    board: input.board,
    boardDocument: input.boardDocument,
    userRequest: input.userRequest,
    selectedShapeIds: input.selectedShapeIds,
    viewportBounds: input.viewportBounds,
    artifacts: input.artifacts,
    headlines: input.headlines,
    workspaceItems: input.workspaceItems,
    recentSessions: input.recentSessions,
    recentActions: input.recentActions,
    maxVisibleShapes: input.maxVisibleShapes,
    maxPeripheralShapes: input.maxPeripheralShapes,
  });

  return {
    workspace: input.workspace,
    board: {
      id: input.board.id,
      workspaceId: input.board.workspaceId,
      name: input.board.name,
      presentationMode: input.board.presentationMode,
    },
    configOverride: input.configOverride,
    packId: input.packId,
    purposeId: input.purposeId,
    userRequest: input.userRequest,
    contextSnapshot: context.snapshot,
  };
};

export const runBoardAgentPass = async (
  input: RunBoardAgentPassInput
): Promise<RunBoardAgentPassResult> => {
  const request = buildBoardAgentRouterRequest(input);
  const response = await boardAgentWithProviderRouter(request);
  return {
    contextSnapshot: request.contextSnapshot,
    response,
  };
};

export const streamBoardAgentPass = async (
  input: RunBoardAgentPassInput,
  options?: BoardAgentStreamOptions
): Promise<RunBoardAgentPassResult> => {
  const request = buildBoardAgentRouterRequest(input);
  const response = await streamBoardAgentWithProviderRouter(request, options);
  return {
    contextSnapshot: request.contextSnapshot,
    response,
  };
};
