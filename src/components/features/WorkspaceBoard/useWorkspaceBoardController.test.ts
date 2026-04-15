import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildWorkspaceEntityRefId, buildWorkspaceSourceRefId } from '@/services/workspace/library';

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
const { buildBoardInspectorActions } = vi.hoisted(() => ({
  buildBoardInspectorActions: vi.fn(
    (_args: {
      onOpenSelectedChat: () => void;
    }) => []
  ),
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
  buildBoardInspectorActions,
}));

import { useWorkspaceBoardController } from './useWorkspaceBoardController';

describe('useWorkspaceBoardController', () => {
  let baseFeatureState: Record<string, unknown>;
  let baseViewModel: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    (window as Window & { innerWidth: number }).innerWidth = 1280;

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

  it('defaults the board rail and shared sections collapsed', () => {
    const { result } = renderHook(() =>
      useWorkspaceBoardController({
        onLaunchInvestigation: vi.fn(),
        onOpenChat: vi.fn(),
        onOpenReport: vi.fn(),
      })
    );

    expect(result.current.leftPanelOpen).toBe(false);
    expect(result.current.rightPanelOpen).toBe(false);
    expect(result.current.librarySections).toEqual({
      created: false,
      artifacts: false,
      findings: false,
      entities: false,
      sources: false,
      signals: false,
    });
    expect(result.current.inspectorSections).toEqual({
      quickActions: false,
      selection: false,
      provenance: false,
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

  it('places a standalone icon on the active board from the action row picker', () => {
    const createAssets = vi.fn();
    const createShape = vi.fn();
    const setSelectedShapes = vi.fn();

    useBoardCanvasPersistence.mockReturnValue({
      editorRef: {
        current: {
          createAssets,
          createShape,
          getViewportPageBounds: () => ({ x: 0, y: 0, w: 1200, h: 800 }),
          setSelectedShapes,
        },
      },
      handleEditorMount: vi.fn(),
      hydratedSnapshot: null,
      persistCurrentBoardDocument: vi.fn(async () => undefined),
    });

    const { result } = renderHook(() =>
      useWorkspaceBoardController({
        onLaunchInvestigation: vi.fn(),
        onOpenChat: vi.fn(),
        onOpenReport: vi.fn(),
      })
    );

    act(() => {
      result.current.handleAddBoardIcon('tabler:world');
    });

    expect(createAssets).toHaveBeenCalledTimes(1);
    expect(createShape).toHaveBeenCalled();
    expect(setSelectedShapes).toHaveBeenCalledTimes(1);
  });

  it('routes selected workspace items into item-aware chat handoffs from the board inspector', () => {
    const onOpenChat = vi.fn();
    buildWorkspaceBoardViewModel.mockReturnValue({
      ...baseViewModel,
      selectedEntries: [
        {
          workspaceId: 'ws-1',
          refKind: 'WORKSPACE_ITEM',
          refId: 'item-1',
          title: 'Atlas note',
          kind: 'NOTE',
          searchText: 'atlas note',
        },
      ],
      selectedPrimaryEntry: {
        workspaceId: 'ws-1',
        refKind: 'WORKSPACE_ITEM',
        refId: 'item-1',
        title: 'Atlas note',
        kind: 'NOTE',
        searchText: 'atlas note',
      },
      selectedWorkspaceItem: {
        id: 'item-1',
        workspaceId: 'ws-1',
        kind: 'NOTE',
        title: 'Atlas note',
        createdAt: 1,
        updatedAt: 1,
        provenance: {
          source: 'CHAT',
          sourceArtifactId: 'rep-1',
        },
      },
    });

    renderHook(() =>
      useWorkspaceBoardController({
        onLaunchInvestigation: vi.fn(),
        onOpenChat,
        onOpenReport: vi.fn(),
      })
    );

    const inspectorArgs = buildBoardInspectorActions.mock.calls.at(-1)?.[0];
    expect(inspectorArgs).toBeTruthy();
    if (!inspectorArgs) {
      throw new Error('Expected board inspector actions to be built.');
    }

    act(() => {
      inspectorArgs.onOpenSelectedChat();
    });

    expect(onOpenChat).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      launchContext: {
        workspaceItemId: 'item-1',
        sourceArtifactId: 'rep-1',
        signalId: undefined,
        headlineId: undefined,
      },
    });
  });

  it('adds an artifact package as a neat ungrouped cluster on the current board', () => {
    const createShape = vi.fn();
    const groupShapes = vi.fn();
    const setSelectedShapes = vi.fn();

    useBoardCanvasPersistence.mockReturnValue({
      editorRef: {
        current: {
          createAssets: vi.fn(),
          createShape,
          getCurrentPageShapes: () => [],
          getShapePageBounds: vi.fn(),
          getViewportPageBounds: () => ({ x: 0, y: 0, w: 1400, h: 900 }),
          groupShapes,
          setSelectedShapes,
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
          'ARTIFACT:artifact-1',
          {
            workspaceId: 'ws-1',
            refKind: 'ARTIFACT',
            refId: 'artifact-1',
            title: 'Atlas Brief',
            kind: 'ARTIFACT',
            description: 'Summary',
            contextText: 'Executive Summary\nSummary',
            searchText: 'Atlas Brief Summary',
          },
        ],
        [
          'KEY_FINDING:finding-1',
          {
            workspaceId: 'ws-1',
            refKind: 'KEY_FINDING',
            refId: 'finding-1',
            title: 'One core finding',
            kind: 'FINDING',
            description: 'Finding summary',
            searchText: 'One core finding',
          },
        ],
        [
          `ENTITY:${buildWorkspaceEntityRefId('Atlas Holdings')}`,
          {
            workspaceId: 'ws-1',
            refKind: 'ENTITY',
            refId: buildWorkspaceEntityRefId('Atlas Holdings'),
            title: 'Atlas Holdings',
            kind: 'ENTITY',
            searchText: 'Atlas Holdings',
          },
        ],
        [
          `SOURCE:${buildWorkspaceSourceRefId({
            title: 'Registry',
            url: 'https://example.com/registry',
          })}`,
          {
            workspaceId: 'ws-1',
            refKind: 'SOURCE',
            refId: buildWorkspaceSourceRefId({
              title: 'Registry',
              url: 'https://example.com/registry',
            }),
            title: 'Registry',
            kind: 'SOURCE',
            searchText: 'Registry https://example.com/registry',
          },
        ],
        [
          'SIGNAL:signal-1',
          {
            workspaceId: 'ws-1',
            refKind: 'SIGNAL',
            refId: 'signal-1',
            title: 'Monitor',
            kind: 'SIGNAL',
            description: 'Signal content',
            searchText: 'Monitor Signal content',
          },
        ],
      ]),
      workspaceArtifacts: [
        {
          id: 'artifact-1',
          workspaceId: 'ws-1',
          topic: 'Atlas Brief',
          summary: 'Summary',
          agendas: [],
          leads: [],
          keyFindings: [
            {
              id: 'finding-1',
              title: 'One core finding',
              summary: 'Finding summary',
            },
          ],
          entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
          sources: [{ title: 'Registry', url: 'https://example.com/registry' }],
          rawText: 'Summary',
        },
      ],
      workspaceHeadlines: [
        {
          id: 'signal-1',
          workspaceId: 'ws-1',
          content: 'Signal content',
          source: 'Monitor',
          timestamp: '2026-04-12T12:00:00Z',
          type: 'NEWS',
          status: 'PENDING',
          threatLevel: 'INFO',
          linkedArtifactId: 'artifact-1',
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
      result.current.handleAddArtifactPackage({
        workspaceId: 'ws-1',
        refKind: 'ARTIFACT',
        refId: 'artifact-1',
        title: 'Atlas Brief',
        kind: 'ARTIFACT',
        description: 'Summary',
        searchText: 'Atlas Brief Summary',
      });
    });

    expect(createShape).toHaveBeenCalled();
    expect(groupShapes).not.toHaveBeenCalled();
    expect(setSelectedShapes).toHaveBeenCalledWith([expect.any(String)]);
  });
});
