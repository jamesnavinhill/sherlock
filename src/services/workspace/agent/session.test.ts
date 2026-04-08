import { describe, expect, it, vi } from 'vitest';

vi.mock('tldraw', () => ({
  getSnapshot: () => ({}),
}));

const { streamBoardAgentPass, executeBoardAgentStructuredAction } = vi.hoisted(() => ({
  streamBoardAgentPass: vi.fn(),
  executeBoardAgentStructuredAction: vi.fn(),
}));

vi.mock('./runtime', () => ({
  streamBoardAgentPass,
}));

vi.mock('./actions/registry', () => ({
  executeBoardAgentStructuredAction,
  isBoardAgentActionFailureTerminal: () => false,
}));

import type {
  BoardAgentAction,
  BoardAgentSession,
  Workspace,
  WorkspaceBoard,
} from '@/types';
import { runBoardAgentSession } from './session';

const workspace: Workspace = {
  id: 'ws-1',
  title: 'Workspace Alpha',
  status: 'ACTIVE',
  dateOpened: '2026-04-08',
};

const board: WorkspaceBoard = {
  id: 'board-1',
  workspaceId: 'ws-1',
  name: 'Primary Board',
  sortOrder: 0,
  createdAt: 1,
  updatedAt: 1,
};

const createSession = (): BoardAgentSession => ({
  id: 'session-1',
  workspaceId: 'ws-1',
  boardId: 'board-1',
  title: 'Board Agent',
  status: 'PENDING',
  request: 'Organize the board',
  requestState: 'QUEUED',
  createdAt: 1,
  updatedAt: 1,
  metadata: {},
});

describe('runBoardAgentSession', () => {
  it('persists planned actions for review and records skipped vs approved results', async () => {
    vi.clearAllMocks();
    const session = createSession();
    const createBoardAgentSession = vi.fn(async () => session);
    const updateBoardAgentSession = vi.fn(async () => undefined);
    const addBoardAgentAction = vi.fn(async () => undefined);
    const updateBoardAgentAction = vi.fn(async () => undefined);
    const requestReview = vi.fn(async ({ actions }) => ({
      approvedActionIds: [actions[1].id],
      skippedActionIds: [actions[0].id],
    }));

    streamBoardAgentPass.mockResolvedValue({
      contextSnapshot: { id: 'snapshot-1' },
      response: {
        message: 'Plan ready for review.',
        actions: [
          {
            type: 'MOVE_SHAPES',
            input: { shapeIds: ['shape-1'], dx: 12, dy: 0 },
          },
          {
            type: 'CREATE_BOARD_NOTE',
            input: { title: 'Cluster summary', text: 'Summarize the board cluster.' },
          },
        ],
        provider: 'OPENAI',
        modelId: 'gpt-test',
        rawText: '',
      },
    });

    executeBoardAgentStructuredAction.mockResolvedValueOnce({
      type: 'CREATE_BOARD_NOTE',
      status: 'COMPLETED',
      result: {
        workspaceItemId: 'item-2',
      },
    });

    const result = await runBoardAgentSession({
      workspace,
      board,
      editor: {} as never,
      themeMode: 'dark',
      artifacts: [],
      headlines: [],
      workspaceItems: [],
      userRequest: 'Organize the board',
      createBoardAgentSession,
      updateBoardAgentSession,
      addBoardAgentAction,
      updateBoardAgentAction,
      createWorkspaceItem: vi.fn(async () => undefined),
      saveArtifact: vi.fn(async (artifact) => artifact),
      appendSectionToArtifact: vi.fn(async () => undefined),
      requestReview,
      maxPasses: 1,
    });

    expect(addBoardAgentAction).toHaveBeenCalledTimes(2);
    expect(addBoardAgentAction).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: 'MOVE_SHAPES',
        status: 'AWAITING_APPROVAL',
      })
    );
    expect(addBoardAgentAction).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'CREATE_BOARD_NOTE',
        status: 'AWAITING_APPROVAL',
      })
    );

    expect(requestReview).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultSelectedActionIds: [],
      })
    );

    expect(updateBoardAgentAction).toHaveBeenCalledWith(
      expect.any(String),
      'session-1',
      expect.objectContaining({
        status: 'SKIPPED',
      })
    );

    expect(result.actions).toEqual([
      expect.objectContaining({
        type: 'MOVE_SHAPES',
        status: 'SKIPPED',
      }),
      expect.objectContaining({
        type: 'CREATE_BOARD_NOTE',
        status: 'COMPLETED',
        result: expect.objectContaining({
          workspaceItemId: 'item-2',
        }),
      }),
    ]);
  });

  it('preselects low-risk organization actions when auto-approve is enabled', async () => {
    vi.clearAllMocks();
    const session = createSession();
    const requestReview = vi.fn(async ({ actions }) => ({
      approvedActionIds: actions.map((action: BoardAgentAction) => action.id),
    }));

    streamBoardAgentPass.mockResolvedValue({
      contextSnapshot: { id: 'snapshot-2' },
      response: {
        message: 'Layout plan ready.',
        actions: [
          {
            type: 'MOVE_SHAPES',
            input: { shapeIds: ['shape-1'], dx: 20, dy: 8 },
          },
        ],
        provider: 'OPENAI',
        modelId: 'gpt-test',
        rawText: '',
      },
    });

    executeBoardAgentStructuredAction.mockResolvedValueOnce({
      type: 'MOVE_SHAPES',
      status: 'COMPLETED',
      result: {
        movedCount: 1,
      },
    });

    await runBoardAgentSession({
      workspace,
      board,
      editor: {} as never,
      themeMode: 'dark',
      artifacts: [],
      headlines: [],
      workspaceItems: [],
      userRequest: 'Tidy the board',
      createBoardAgentSession: vi.fn(async () => session),
      updateBoardAgentSession: vi.fn(async () => undefined),
      addBoardAgentAction: vi.fn(async () => undefined),
      updateBoardAgentAction: vi.fn(async () => undefined),
      createWorkspaceItem: vi.fn(async () => undefined),
      saveArtifact: vi.fn(async (artifact) => artifact),
      appendSectionToArtifact: vi.fn(async () => undefined),
      requestReview,
      autoApproveOrganizationActions: true,
      maxPasses: 1,
    });

    expect(requestReview).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultSelectedActionIds: [expect.any(String)],
      })
    );
  });
});
