import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardAgentRepository } from './BoardAgentRepository';
import { boardAgentActions, boardAgentSessions } from '../schema';

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
};

vi.mock('../client', () => ({
  getDB: () => mockDb,
}));

describe('BoardAgentRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates persisted sessions and actions', async () => {
    const sessionRows = [
      {
        id: 'board-agent-1',
        workspaceId: 'case-1',
        boardId: 'board-1',
        title: 'Initial clustering',
        status: 'RUNNING',
        request: 'Cluster the selected evidence',
        requestState: 'EXECUTING_ACTIONS',
        provider: 'OPENAI',
        modelId: 'gpt-test',
        contextSnapshotId: 'ctx-1',
        lastError: null,
        metadataJson: JSON.stringify({ lane: 'selection' }),
        createdAt: 1,
        updatedAt: 2,
        startedAt: 2,
        completedAt: null,
      },
    ];
    const actionRows = [
      {
        id: 'board-action-1',
        sessionId: 'board-agent-1',
        workspaceId: 'case-1',
        boardId: 'board-1',
        type: 'PLACE_LINKED_CARD',
        status: 'COMPLETED',
        inputJson: JSON.stringify({ refId: 'rep-1' }),
        normalizedInputJson: JSON.stringify({ refId: 'rep-1', x: 320 }),
        resultJson: JSON.stringify({ shapeId: 'shape:1' }),
        affectedCanonicalIdsJson: JSON.stringify(['rep-1']),
        affectedBoardShapeIdsJson: JSON.stringify(['shape:1']),
        error: null,
        createdAt: 5,
        updatedAt: 6,
      },
    ];

    mockDb.select.mockImplementation(() => ({
      from: (table: unknown) => {
        if (table === boardAgentSessions) {
          return {
            orderBy: vi.fn().mockResolvedValue(sessionRows),
          };
        }

        if (table === boardAgentActions) {
          return {
            where: vi.fn(() => ({
              orderBy: vi.fn().mockResolvedValue(actionRows),
            })),
          };
        }

        throw new Error('Unexpected table access.');
      },
    }));

    const sessions = await BoardAgentRepository.getAllSessions();
    const actions = await BoardAgentRepository.getActionsForSession('board-agent-1');

    expect(sessions[0]).toEqual(
      expect.objectContaining({
        id: 'board-agent-1',
        requestState: 'EXECUTING_ACTIONS',
        metadata: { lane: 'selection' },
      })
    );
    expect(actions[0]).toEqual(
      expect.objectContaining({
        id: 'board-action-1',
        normalizedInput: { refId: 'rep-1', x: 320 },
        affectedBoardShapeIds: ['shape:1'],
      })
    );
  });

  it('serializes audit payload fields when creating sessions and actions', async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values });

    await BoardAgentRepository.createSession({
      id: 'board-agent-2',
      workspaceId: 'case-1',
      boardId: 'board-1',
      title: 'Board session',
      status: 'PENDING',
      request: 'Summarize the cluster',
      requestState: 'QUEUED',
      provider: 'OPENAI',
      modelId: 'gpt-test',
      metadata: { source: 'manual' },
      createdAt: 1,
      updatedAt: 2,
    });

    expect(mockDb.insert).toHaveBeenCalledWith(boardAgentSessions);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'board-agent-2',
        metadataJson: JSON.stringify({ source: 'manual' }),
        contextSnapshotId: null,
      })
    );

    await BoardAgentRepository.createAction({
      id: 'board-action-2',
      sessionId: 'board-agent-2',
      workspaceId: 'case-1',
      boardId: 'board-1',
      type: 'MOVE_SHAPES',
      status: 'COMPLETED',
      input: { shapeIds: ['shape:1'] },
      normalizedInput: { shapeIds: ['shape:1'], x: 20 },
      result: { moved: 1 },
      affectedCanonicalIds: ['rep-1'],
      affectedBoardShapeIds: ['shape:1'],
      createdAt: 3,
      updatedAt: 4,
    });

    expect(mockDb.insert).toHaveBeenLastCalledWith(boardAgentActions);
    expect(values).toHaveBeenLastCalledWith(
      expect.objectContaining({
        normalizedInputJson: JSON.stringify({ shapeIds: ['shape:1'], x: 20 }),
        affectedCanonicalIdsJson: JSON.stringify(['rep-1']),
      })
    );
  });
});
