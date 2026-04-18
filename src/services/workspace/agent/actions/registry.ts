import type { BoardAgentAction } from '@/types';
import type {
  BoardAgentActionExecutionResult,
  ExecuteBoardAgentStructuredActionInput,
} from './types';
import { executeBoardAgentBoardMutationAction } from './boardMutationActions';
import { executeBoardAgentMetaAction } from './metaActions';
import { executeBoardAgentWorkspaceWriteAction } from './workspaceWriteActions';
import { BOARD_MUTATING_ACTION_TYPES, reject } from './shared';

export const executeBoardAgentStructuredAction = async ({
  action,
  context,
}: ExecuteBoardAgentStructuredActionInput): Promise<BoardAgentActionExecutionResult> => {
  for (const executor of [
    executeBoardAgentMetaAction,
    executeBoardAgentBoardMutationAction,
    executeBoardAgentWorkspaceWriteAction,
  ]) {
    const result = await executor({ action, context });
    if (result) {
      return result;
    }
  }

  return reject(action.type, `Unsupported board-agent action type: ${action.type}`);
};

export const isBoardAgentActionFailureTerminal = (result: BoardAgentActionExecutionResult) =>
  result.status === 'FAILED' ||
  (result.status === 'REJECTED' &&
    result.type !== 'MESSAGE' &&
    result.type !== 'THINK' &&
    result.type !== 'UPDATE_TODO');

export const isBoardAgentMutationType = (type: BoardAgentAction['type']) =>
  BOARD_MUTATING_ACTION_TYPES.has(type);
