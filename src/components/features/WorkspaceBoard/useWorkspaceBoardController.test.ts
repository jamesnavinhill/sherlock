import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.fn();
const { useWorkspaceBoardFeatureState } = vi.hoisted(() => ({
  useWorkspaceBoardFeatureState: vi.fn(),
}));
const { buildWorkspaceBoardViewModel } = vi.hoisted(() => ({
  buildWorkspaceBoardViewModel: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/store/selectors/featureSelectors', () => ({
  useWorkspaceBoardFeatureState,
}));

vi.mock('./workspaceBoardViewModel', () => ({
  buildWorkspaceBoardViewModel,
}));

vi.mock('./useBoardCanvasPersistence', () => ({
  useBoardCanvasPersistence: () => ({
    editorRef: { current: null },
    handleEditorMount: vi.fn(),
    hydratedSnapshot: null,
    persistCurrentBoardDocument: vi.fn(async () => undefined),
  }),
}));

vi.mock('./boardInspectorActions', () => ({
  buildBoardInspectorActions: () => [],
}));

import { useWorkspaceBoardController } from './useWorkspaceBoardController';

describe('useWorkspaceBoardController', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useWorkspaceBoardFeatureState.mockReturnValue({
      activeWorkspaceBoardId: 'board-1',
      activeWorkspaceId: 'ws-1',
      artifacts: [],
      boardAgentActionsBySessionId: {},
      boardAgentSessions: [],
      createBoardAgentSession: vi.fn(),
      createWorkspaceBoard: vi.fn(),
      createWorkspaceItem: vi.fn(),
      deleteWorkspaceItem: vi.fn(async () => undefined),
      ensureWorkspaceBoard: vi.fn(async () => ({ id: 'board-1' })),
      headlines: [],
      queuedBoardPlacement: null,
      saveArtifact: vi.fn(),
      saveWorkspaceBoardDocument: vi.fn(),
      setActiveWorkspaceId: vi.fn(),
      appendSectionToReport: vi.fn(),
      addBoardAgentAction: vi.fn(),
      updateWorkspaceBoard: vi.fn(),
      updateBoardAgentAction: vi.fn(),
      updateBoardAgentSession: vi.fn(),
      workspaceBoardDocuments: {},
      workspaceBoards: [],
      workspaceItems: [],
      workspaces: [],
      clearQueuedBoardPlacement: vi.fn(),
      deleteWorkspaceBoard: vi.fn(),
      addToast: vi.fn(),
      themeMode: 'dark',
    });

    buildWorkspaceBoardViewModel.mockReturnValue({
      activeBoard: {
        id: 'board-1',
        workspaceId: 'ws-1',
        name: 'Primary Board',
        sortOrder: 0,
        presentationMode: false,
        createdAt: 1,
        updatedAt: 1,
      },
      activeBoardDocument: null,
      activeWorkspace: {
        id: 'ws-1',
        title: 'Atlas Workspace',
        status: 'ACTIVE',
        dateOpened: '2026-04-06',
      },
      availableBoards: [
        { id: 'board-1', workspaceId: 'ws-1', name: 'Primary Board', sortOrder: 0, presentationMode: false, createdAt: 1, updatedAt: 1 },
        { id: 'board-2', workspaceId: 'ws-1', name: 'Secondary Board', sortOrder: 1, presentationMode: false, createdAt: 1, updatedAt: 1 },
      ],
      boardAgentTodoItems: [],
      boardSessionsForBoard: [],
      createdWorkspaceItems: [],
      groupedEntries: {},
      libraryMap: new Map(),
      selectedArtifact: null,
      selectedHeadline: null,
      selectedPrimaryEntry: null,
      selectedWorkspaceItem: null,
      visibleBoardAgentActions: [],
      visibleBoardAgentSession: null,
      workspaceArtifacts: [],
      workspaceHeadlines: [],
    });
  });

  it('opens board deletion confirmation state through controller-owned dialog boundaries', async () => {
    const { result } = renderHook(() =>
      useWorkspaceBoardController({
        onLaunchInvestigation: vi.fn(),
        onOpenChat: vi.fn(),
        onOpenReport: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleDeleteBoard();
    });

    expect(result.current.boardPendingDeletion).toEqual(
      expect.objectContaining({
        id: 'board-1',
      })
    );
  });
});
