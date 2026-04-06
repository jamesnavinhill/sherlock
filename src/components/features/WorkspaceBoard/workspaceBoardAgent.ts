import { runBoardAgentSession } from '@/services/workspace/agent';

export const runWorkspaceBoardAgentTurn = async (
  input: Parameters<typeof runBoardAgentSession>[0]
) => {
  const request = input.userRequest.trim();
  if (!request) {
    return {
      status: 'BLOCKED' as const,
      message: 'Enter a board-agent request first.',
    };
  }

  if (input.board.presentationMode) {
    return {
      status: 'BLOCKED' as const,
      message: 'Disable presentation mode before running the board agent.',
    };
  }

  const recentBoardActions = (input.recentSessions || [])
    .flatMap((session) => (input.recentActions || []).filter((action) => action.sessionId === session.id))
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, 24);

  const result = await runBoardAgentSession({
    ...input,
    userRequest: request,
    recentActions: recentBoardActions,
  });

  return {
    status: result.session.status,
    session: result.session,
    message: result.message || null,
  };
};
