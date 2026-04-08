import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.fn();
const { useWorkspaceBoardFeatureState } = vi.hoisted(() => ({
  useWorkspaceBoardFeatureState: vi.fn(),
}));
const { buildWorkspaceBoardViewModel } = vi.hoisted(() => ({
  buildWorkspaceBoardViewModel: vi.fn(),
}));
const { useBoardCanvasPersistence } = vi.hoisted(() => ({
  useBoardCanvasPersistence: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/store/selectors/workspaceBoardSelectors', () => ({
  useWorkspaceBoardFeatureState,
}));

vi.mock('./workspaceBoardViewModel', () => ({
  buildWorkspaceBoardViewModel,
}));

vi.mock('./useBoardCanvasPersistence', () => ({
  useBoardCanvasPersistence,
}));

vi.mock('./boardInspectorActions', () => ({
  buildBoardInspectorActions: () => [],
}));

import { useWorkspaceBoardController } from './useWorkspaceBoardController';

describe('useWorkspaceBoardController', () => {
  let baseFeatureState: Record<string, unknown>;
  let baseViewModel: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    baseFeatureState = {
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
      appendSectionToArtifact: vi.fn(),
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
    };
    useWorkspaceBoardFeatureState.mockReturnValue(baseFeatureState);

    useBoardCanvasPersistence.mockReturnValue({
      editorRef: { current: null },
      handleEditorMount: vi.fn(),
      hydratedSnapshot: null,
      persistCurrentBoardDocument: vi.fn(async () => undefined),
    });

    baseViewModel = {
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
    };
    buildWorkspaceBoardViewModel.mockReturnValue(baseViewModel);
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

  it('focuses an existing matching card instead of placing a duplicate when requested', () => {
    const clearQueuedBoardPlacement = vi.fn();
    const setSelectedShapes = vi.fn();
    const zoomToBounds = vi.fn();
    const getShapePageBounds = vi.fn(() => ({ x: 10, y: 20, w: 120, h: 80 }));

    useWorkspaceBoardFeatureState.mockReturnValue({
      ...baseFeatureState,
      queuedBoardPlacement: {
        workspaceId: 'ws-1',
        boardId: 'board-1',
        item: {
          workspaceId: 'ws-1',
          refKind: 'WORKSPACE_ITEM',
          refId: 'item-1',
          title: 'Atlas Note',
        },
        mode: 'FOCUS_OR_PLACE',
      },
      clearQueuedBoardPlacement,
    });

    useBoardCanvasPersistence.mockReturnValue({
      editorRef: {
        current: {
          getCurrentPageShapes: () => [
            {
              id: 'shape-1',
              meta: {
                sherlockRefJson: JSON.stringify({
                  workspaceId: 'ws-1',
                  refKind: 'WORKSPACE_ITEM',
                  refId: 'item-1',
                  title: 'Atlas Note',
                }),
              },
            },
          ],
          getShapePageBounds,
          setSelectedShapes,
          zoomToBounds,
        },
      },
      handleEditorMount: vi.fn(),
      hydratedSnapshot: null,
      persistCurrentBoardDocument: vi.fn(async () => undefined),
    });

    buildWorkspaceBoardViewModel.mockReturnValue({
      ...baseViewModel,
      libraryMap: new Map([
        [
          'WORKSPACE_ITEM:item-1',
          {
            workspaceId: 'ws-1',
            refKind: 'WORKSPACE_ITEM',
            refId: 'item-1',
            title: 'Atlas Note',
            kind: 'NOTE',
            searchText: 'atlas note',
          },
        ],
      ]),
    });

    renderHook(() =>
      useWorkspaceBoardController({
        onLaunchInvestigation: vi.fn(),
        onOpenChat: vi.fn(),
        onOpenReport: vi.fn(),
      })
    );

    expect(setSelectedShapes).toHaveBeenCalledWith(['shape-1']);
    expect(zoomToBounds).toHaveBeenCalledWith(
      { x: 10, y: 20, w: 120, h: 80 },
      { targetZoom: 1, animation: { duration: 180 } }
    );
    expect(clearQueuedBoardPlacement).toHaveBeenCalledTimes(1);
  });

  it('opens shared upload routing state before committing board uploads', () => {
    const createWorkspaceItem = vi.fn();
    useWorkspaceBoardFeatureState.mockReturnValue({
      ...baseFeatureState,
      createWorkspaceItem,
      workspaces: [
        {
          id: 'ws-1',
          title: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-06',
        },
      ],
    });

    const { result } = renderHook(() =>
      useWorkspaceBoardController({
        onLaunchInvestigation: vi.fn(),
        onOpenChat: vi.fn(),
        onOpenReport: vi.fn(),
      })
    );

    act(() => {
      result.current.handleFileUpload({
        target: {
          files: [new File(['Atlas findings'], 'atlas-note.md', { type: 'text/markdown' })],
          value: 'atlas-note.md',
        },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.uploadDialogState).toEqual(
      expect.objectContaining({
        route: 'WORKSPACE_ITEM',
        targetWorkspaceId: 'ws-1',
      })
    );
    expect(createWorkspaceItem).not.toHaveBeenCalled();
  });
});
