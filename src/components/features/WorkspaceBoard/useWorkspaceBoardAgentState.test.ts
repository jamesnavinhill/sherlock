import { act, renderHook } from '@testing-library/react';
import type { MutableRefObject } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type {
  Artifact,
  BoardAgentAction,
  BoardAgentSession,
  Workspace,
  WorkspaceBoard,
  WorkspaceBoardDocument,
  WorkspaceItem,
} from '@/types';

const { runWorkspaceBoardAgentTurn } = vi.hoisted(() => ({
  runWorkspaceBoardAgentTurn: vi.fn(),
}));

vi.mock('./workspaceBoardAgent', () => ({
  runWorkspaceBoardAgentTurn,
}));

import { useWorkspaceBoardAgentState } from './useWorkspaceBoardAgentState';

const workspace: Workspace = {
  id: 'ws-1',
  title: 'Atlas Workspace',
  status: 'ACTIVE',
  dateOpened: '2026-04-18',
};

const board: WorkspaceBoard = {
  id: 'board-1',
  workspaceId: 'ws-1',
  name: 'Primary Board',
  sortOrder: 0,
  presentationMode: false,
  createdAt: 1,
  updatedAt: 1,
};

const boardDocument: WorkspaceBoardDocument = {
  boardId: 'board-1',
  snapshot: {},
  updatedAt: 1,
};

const visibleSession: BoardAgentSession = {
  id: 'session-1',
  workspaceId: 'ws-1',
  boardId: 'board-1',
  title: 'Board Agent',
  status: 'COMPLETED',
  request: 'Organize the board',
  requestState: 'COMPLETED',
  createdAt: 1,
  updatedAt: 1,
  metadata: {
    latestMessage: 'Latest session message',
  },
};

const createEditorRef = (): MutableRefObject<{
  getSelectedShapeIds: () => string[];
  getViewportPageBounds: () => { x: number; y: number; w: number; h: number };
} | null> =>
  ({
    current: {
      getSelectedShapeIds: () => [],
      getViewportPageBounds: () => ({ x: 0, y: 0, w: 1200, h: 800 }),
    },
  }) as unknown as MutableRefObject<{
    getSelectedShapeIds: () => string[];
    getViewportPageBounds: () => { x: number; y: number; w: number; h: number };
  } | null>;

const createAction = (id: string, type: BoardAgentAction['type']): BoardAgentAction => ({
  id,
  sessionId: 'session-1',
  workspaceId: 'ws-1',
  boardId: 'board-1',
  type,
  status: 'AWAITING_APPROVAL',
  createdAt: 1,
  updatedAt: 1,
});

const createHook = (overrides: Partial<Parameters<typeof useWorkspaceBoardAgentState>[0]> = {}) =>
  renderHook(() =>
    useWorkspaceBoardAgentState({
      activeBoard: board,
      activeBoardDocument: boardDocument,
      activeWorkspace: workspace,
      addBoardAgentAction: vi.fn(async () => undefined),
      addToast: vi.fn(),
      appendSectionToArtifact: vi.fn(async () => undefined),
      boardAgentActiveSessionId: null,
      boardAgentActionsBySessionId: {
        'session-1': [
          createAction('action-1', 'ALIGN_SHAPES'),
          createAction('action-2', 'CREATE_BOARD_NOTE'),
        ],
      },
      boardSessionsForBoard: [visibleSession],
      createBoardAgentSession: vi.fn(async () => visibleSession),
      createWorkspaceItem: vi.fn(async (_item: WorkspaceItem) => undefined),
      createdWorkspaceItems: [],
      editorRef: createEditorRef() as never,
      onLaunchInvestigation: vi.fn(),
      openAgentPanel: vi.fn(),
      persistCurrentBoardDocument: vi.fn(async () => undefined),
      saveArtifact: vi.fn(async (artifact: Artifact) => artifact),
      setBoardAgentActiveSessionId: vi.fn(),
      themeMode: 'dark',
      updateBoardAgentAction: vi.fn(async () => undefined),
      updateBoardAgentSession: vi.fn(async () => undefined),
      visibleBoardAgentSession: visibleSession,
      workspaceArtifacts: [],
      workspaceHeadlines: [],
      ...overrides,
    })
  );

describe('useWorkspaceBoardAgentState', () => {
  it('mirrors the latest persisted session message when idle', () => {
    const { result } = createHook();

    expect(result.current.boardAgentMessage).toBe('Latest session message');
  });

  it('reopens review selections and auto-approves low-risk organization actions only', async () => {
    runWorkspaceBoardAgentTurn.mockImplementationOnce(async (input) => {
      await input.requestReview({
        session: visibleSession,
        passIndex: 1,
        message: 'Review this plan',
        actions: [
          createAction('action-1', 'ALIGN_SHAPES'),
          createAction('action-2', 'CREATE_BOARD_NOTE'),
        ],
        defaultSelectedActionIds: [],
      });

      return {
        status: 'COMPLETED',
        session: visibleSession,
        message: 'Review this plan',
      };
    });

    const { result } = createHook({
      createBoardAgentSession: vi.fn(async () => visibleSession),
    });

    act(() => {
      result.current.setBoardAgentPrompt('Tidy the cluster');
    });

    await act(async () => {
      void result.current.handleRunBoardAgent();
      await Promise.resolve();
    });

    expect(result.current.boardAgentReviewSelections).toEqual({
      'action-1': false,
      'action-2': false,
    });

    act(() => {
      result.current.setBoardAgentAutoApproveOrganizationActions(true);
    });

    expect(result.current.boardAgentReviewSelections).toEqual({
      'action-1': true,
      'action-2': false,
    });

    await act(async () => {
      result.current.handleSkipBoardAgentPlan();
      await Promise.resolve();
    });
  });
});
