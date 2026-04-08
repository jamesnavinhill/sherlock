import {
  filterManualGraphForWorkspaceRemoval,
  getWorkspaceDataSignals,
  groupBoardAgentActionsBySessionId,
  groupChatActionsBySessionId,
  groupChatMessagesBySessionId,
} from '@/services/maintenance/workspaceData';

import type { WorkspaceDataBackup } from '@/types';
import type { WorkspaceState } from '../workspaceStore';

export const buildDeleteWorkspaceState = (
  state: WorkspaceState,
  workspaceId: string
): Partial<WorkspaceState> => {
  const boardAgentSessionIds = state.boardAgentSessions
    .filter((session) => session.workspaceId === workspaceId)
    .map((session) => session.id);
  const workspaces = state.workspaces.filter((item) => item.id !== workspaceId);
  const artifacts = state.artifacts.map((artifact) =>
    artifact.workspaceId === workspaceId ? { ...artifact, workspaceId: undefined } : artifact
  );
  const workspaceRuns = state.workspaceRuns.map((workspaceRun) => {
    if (workspaceRun.workspaceId !== workspaceId && workspaceRun.report?.workspaceId !== workspaceId) {
      return workspaceRun;
    }

    return {
      ...workspaceRun,
      workspaceId: undefined,
      report: workspaceRun.report
        ? { ...workspaceRun.report, workspaceId: undefined }
        : workspaceRun.report,
    };
  });
  const workspaceBoards = state.workspaceBoards.filter((board) => board.workspaceId !== workspaceId);
  const workspaceBoardDocuments = Object.fromEntries(
    Object.entries(state.workspaceBoardDocuments).filter(
      ([boardId]) =>
        !state.workspaceBoards.some(
          (board) => board.id === boardId && board.workspaceId === workspaceId
        )
    )
  );

  return {
    chatSessions: state.chatSessions.filter((session) => session.workspaceId !== workspaceId),
    chatMessagesBySessionId: Object.fromEntries(
      Object.entries(state.chatMessagesBySessionId).filter(
        ([sessionId]) =>
          !state.chatSessions.some(
            (session) => session.id === sessionId && session.workspaceId === workspaceId
          )
      )
    ),
    chatActionsBySessionId: Object.fromEntries(
      Object.entries(state.chatActionsBySessionId).filter(
        ([sessionId]) =>
          !state.chatSessions.some(
            (session) => session.id === sessionId && session.workspaceId === workspaceId
          )
      )
    ),
    boardAgentSessions: state.boardAgentSessions.filter((session) => session.workspaceId !== workspaceId),
    boardAgentActionsBySessionId: Object.fromEntries(
      Object.entries(state.boardAgentActionsBySessionId).filter(
        ([sessionId]) => !boardAgentSessionIds.includes(sessionId)
      )
    ),
    workspaces,
    artifacts,
    headlines: state.headlines.filter((headline) => headline.workspaceId !== workspaceId),
    workspaceItems: state.workspaceItems.filter((item) => item.workspaceId !== workspaceId),
    workspaceBoards,
    workspaceBoardDocuments,
    workspaceRuns,
    activeChatSessionId:
      state.activeChatSessionId &&
      state.chatSessions.some(
        (session) => session.id === state.activeChatSessionId && session.workspaceId === workspaceId
      )
        ? null
        : state.activeChatSessionId,
    activeWorkspaceId: state.activeWorkspaceId === workspaceId ? null : state.activeWorkspaceId,
    activeWorkspaceBoardId:
      state.activeWorkspaceId === workspaceId ? null : state.activeWorkspaceBoardId,
  };
};

export const buildPurgeWorkspaceState = (
  state: WorkspaceState,
  workspaceId: string
): Partial<WorkspaceState> => {
  const artifactIds = state.artifacts
    .filter((artifact) => artifact.workspaceId === workspaceId && !!artifact.id)
    .map((artifact) => artifact.id as string);
  const chatSessionIds = state.chatSessions
    .filter((session) => session.workspaceId === workspaceId)
    .map((session) => session.id);
  const boardAgentSessionIds = state.boardAgentSessions
    .filter((session) => session.workspaceId === workspaceId)
    .map((session) => session.id);
  const workspaceRuns = state.workspaceRuns.filter(
    (workspaceRun) =>
      workspaceRun.workspaceId !== workspaceId && workspaceRun.report?.workspaceId !== workspaceId
  );
  const activeTaskId =
    !state.activeTaskId || workspaceRuns.some((workspaceRun) => workspaceRun.id === state.activeTaskId)
      ? state.activeTaskId
      : null;
  const nextGraph = filterManualGraphForWorkspaceRemoval({
    manualNodes: state.manualNodes,
    manualLinks: state.manualLinks,
    hiddenNodeIds: state.hiddenNodeIds,
    flaggedNodeIds: state.flaggedNodeIds,
    workspaceId,
    artifactIds,
  });
  const activeChatSessionId =
    !state.activeChatSessionId || !chatSessionIds.includes(state.activeChatSessionId)
      ? state.activeChatSessionId
      : null;
  const removedBoardIds = new Set(
    state.workspaceBoards
      .filter((board) => board.workspaceId === workspaceId)
      .map((board) => board.id)
  );

  return {
    chatSessions: state.chatSessions.filter((session) => session.workspaceId !== workspaceId),
    chatMessagesBySessionId: Object.fromEntries(
      Object.entries(state.chatMessagesBySessionId).filter(
        ([sessionId]) => !chatSessionIds.includes(sessionId)
      )
    ),
    chatActionsBySessionId: Object.fromEntries(
      Object.entries(state.chatActionsBySessionId).filter(
        ([sessionId]) => !chatSessionIds.includes(sessionId)
      )
    ),
    boardAgentSessions: state.boardAgentSessions.filter((session) => session.workspaceId !== workspaceId),
    boardAgentActionsBySessionId: Object.fromEntries(
      Object.entries(state.boardAgentActionsBySessionId).filter(
        ([sessionId]) => !boardAgentSessionIds.includes(sessionId)
      )
    ),
    workspaces: state.workspaces.filter((item) => item.id !== workspaceId),
    artifacts: state.artifacts.filter((artifact) => artifact.workspaceId !== workspaceId),
    headlines: state.headlines.filter((headline) => headline.workspaceId !== workspaceId),
    workspaceItems: state.workspaceItems.filter((item) => item.workspaceId !== workspaceId),
    workspaceBoards: state.workspaceBoards.filter((board) => board.workspaceId !== workspaceId),
    workspaceBoardDocuments: Object.fromEntries(
      Object.entries(state.workspaceBoardDocuments).filter(([boardId]) => !removedBoardIds.has(boardId))
    ),
    workspaceRuns,
    manualNodes: nextGraph.manualNodes,
    manualLinks: nextGraph.manualLinks,
    hiddenNodeIds: nextGraph.hiddenNodeIds,
    flaggedNodeIds: nextGraph.flaggedNodeIds,
    activeTaskId,
    activeChatSessionId,
    activeWorkspaceId: state.activeWorkspaceId === workspaceId ? null : state.activeWorkspaceId,
    activeWorkspaceBoardId:
      state.activeWorkspaceId === workspaceId ? null : state.activeWorkspaceBoardId,
  };
};

export const buildImportedWorkspaceDataState = (
  payload: WorkspaceDataBackup
): Partial<WorkspaceState> => ({
  workspaces: payload.workspaces,
  artifacts: payload.artifacts,
  workspaceRuns: payload.runs,
  chatSessions: payload.chat.sessions,
  chatMessagesBySessionId: groupChatMessagesBySessionId(payload.chat.messages),
  chatActionsBySessionId: groupChatActionsBySessionId(payload.chat.actions),
  boardAgentSessions: payload.boardAgent.sessions,
  boardAgentActionsBySessionId: groupBoardAgentActionsBySessionId(payload.boardAgent.actions),
  headlines: getWorkspaceDataSignals(payload.signals),
  templates: payload.templates,
  workspaceItems: payload.workspaceSurface.items,
  workspaceBoards: payload.workspaceSurface.boards,
  workspaceBoardDocuments: Object.fromEntries(
    payload.workspaceSurface.boardDocuments.map((document) => [document.boardId, document])
  ),
  manualNodes: payload.graph.manualNodes,
  manualLinks: payload.graph.manualLinks,
  hiddenNodeIds: [],
  flaggedNodeIds: [],
  activeTaskId: null,
  activeChatSessionId: null,
  activeWorkspaceId: null,
  activeWorkspaceBoardId: null,
  queuedBoardPlacement: null,
});

export const buildClearedWorkspaceDataState = (): Partial<WorkspaceState> => ({
  workspaces: [],
  artifacts: [],
  workspaceRuns: [],
  chatSessions: [],
  chatMessagesBySessionId: {},
  chatActionsBySessionId: {},
  boardAgentSessions: [],
  boardAgentActionsBySessionId: {},
  headlines: [],
  templates: [],
  workspaceItems: [],
  workspaceBoards: [],
  workspaceBoardDocuments: {},
  manualNodes: [],
  manualLinks: [],
  hiddenNodeIds: [],
  flaggedNodeIds: [],
  activeTaskId: null,
  activeChatSessionId: null,
  activeWorkspaceId: null,
  activeWorkspaceBoardId: null,
  queuedBoardPlacement: null,
});
