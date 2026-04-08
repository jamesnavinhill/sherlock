import { getWorkspaceDisplayTitle } from '@/domain';
import {
  boardRefKey,
  buildWorkspaceLibraryEntries,
  type WorkspaceLibraryEntry,
} from '@/services/workspace/library';
import { deriveBoardAgentTodoItems } from '@/services/workspace/agent/actions/todos';
import type {
  Artifact,
  BoardAgentAction,
  BoardAgentSession,
  Headline,
  Workspace,
  WorkspaceBoard,
  WorkspaceBoardDocument,
  WorkspaceItem,
} from '@/types';

interface WorkspaceBoardViewModelInput {
  activeWorkspaceBoardId: string | null;
  activeWorkspaceId: string | null;
  artifacts: Artifact[];
  boardAgentActionsBySessionId: Record<string, BoardAgentAction[]>;
  boardAgentActiveSessionId: string | null;
  boardAgentSessions: BoardAgentSession[];
  headlines: Headline[];
  search: string;
  selectedEntries: WorkspaceLibraryEntry[];
  workspaceBoardDocuments: Record<string, WorkspaceBoardDocument>;
  workspaceBoards: WorkspaceBoard[];
  workspaceItems: WorkspaceItem[];
  workspaces: Workspace[];
}

export const buildWorkspaceBoardViewModel = ({
  activeWorkspaceBoardId,
  activeWorkspaceId,
  artifacts,
  boardAgentActionsBySessionId,
  boardAgentActiveSessionId,
  boardAgentSessions,
  headlines,
  search,
  selectedEntries,
  workspaceBoardDocuments,
  workspaceBoards,
  workspaceItems,
  workspaces,
}: WorkspaceBoardViewModelInput) => {
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null;
  const workspaceArtifacts = artifacts.filter((artifact) => artifact.caseId === activeWorkspace?.id);
  const workspaceHeadlines = headlines.filter((headline) => headline.caseId === activeWorkspace?.id);
  const createdWorkspaceItems = workspaceItems.filter(
    (item) => item.workspaceId === activeWorkspace?.id
  );
  const availableBoards = workspaceBoards
    .filter((board) => board.workspaceId === activeWorkspace?.id)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const activeBoard =
    availableBoards.find((board) => board.id === activeWorkspaceBoardId) ||
    availableBoards[0] ||
    null;
  const activeBoardDocument = activeBoard ? workspaceBoardDocuments[activeBoard.id] : undefined;
  const boardSessionsForBoard = boardAgentSessions
    .filter(
      (session) => session.workspaceId === activeWorkspace?.id && session.boardId === activeBoard?.id
    )
    .sort((left, right) => right.updatedAt - left.updatedAt);
  const visibleBoardAgentSession =
    boardSessionsForBoard.find((session) => session.id === boardAgentActiveSessionId) ||
    boardSessionsForBoard[0] ||
    null;
  const visibleBoardAgentActions = visibleBoardAgentSession
    ? [...(boardAgentActionsBySessionId[visibleBoardAgentSession.id] || [])].sort(
        (left, right) => right.createdAt - left.createdAt
      )
    : [];
  const boardAgentTodoItems = deriveBoardAgentTodoItems(visibleBoardAgentActions);

  const libraryEntries = activeWorkspace
    ? buildWorkspaceLibraryEntries({
        workspaceId: activeWorkspace.id,
        artifacts: workspaceArtifacts,
        signals: workspaceHeadlines,
        workspaceItems: createdWorkspaceItems,
      })
    : [];

  const libraryMap = new Map(libraryEntries.map((entry) => [boardRefKey(entry), entry]));
  const lowerSearch = search.trim().toLowerCase();
  const filteredEntries = libraryEntries.filter((entry) => {
    if (!lowerSearch) return true;
    return (
      entry.title.toLowerCase().includes(lowerSearch) ||
      entry.searchText.toLowerCase().includes(lowerSearch)
    );
  });

  const groupedEntries = {
    created: filteredEntries.filter((entry) =>
      ['NOTE', 'LINK', 'FILE', 'MEDIA', 'EXCERPT'].includes(entry.kind)
    ),
    artifacts: filteredEntries.filter((entry) => entry.kind === 'ARTIFACT'),
    entities: filteredEntries.filter((entry) => entry.kind === 'ENTITY'),
    sources: filteredEntries.filter((entry) => entry.kind === 'SOURCE'),
    signals: filteredEntries.filter(
      (entry) => entry.kind === 'SIGNAL' || entry.kind === 'HEADLINE'
    ),
  };

  const selectedArtifactRef =
    selectedEntries.find((entry) => entry.refKind === 'ARTIFACT')?.refId || null;
  const selectedArtifact =
    workspaceArtifacts.find((artifact) => artifact.id === selectedArtifactRef) || null;

  const selectedHeadlineRef =
    selectedEntries.find(
      (entry) => entry.refKind === 'SIGNAL' || entry.refKind === 'HEADLINE'
    )?.refId || null;
  const selectedHeadline =
    workspaceHeadlines.find((headline) => headline.id === selectedHeadlineRef) || null;

  const selectedWorkspaceItemRef =
    selectedEntries.find((entry) => entry.refKind === 'WORKSPACE_ITEM')?.refId || null;
  const selectedWorkspaceItem =
    createdWorkspaceItems.find((item) => item.id === selectedWorkspaceItemRef) || null;

  return {
    activeBoard,
    activeBoardDocument,
    activeWorkspace,
    availableBoards,
    boardAgentTodoItems,
    boardSessionsForBoard,
    createdWorkspaceItems,
    filteredEntries,
    groupedEntries,
    libraryEntries,
    libraryMap,
    selectedArtifact,
    selectedHeadline,
    selectedPrimaryEntry: selectedEntries[0] || null,
    selectedWorkspaceItem,
    visibleBoardAgentActions,
    visibleBoardAgentSession,
    workspaceArtifacts,
    workspaceHeadlines,
    workspaceTitle:
      activeWorkspace ? getWorkspaceDisplayTitle(activeWorkspace) : 'Workspace Board',
  };
};
