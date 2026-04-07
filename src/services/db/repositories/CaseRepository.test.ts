import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CaseRepository } from './CaseRepository';
import { BoardAgentRepository } from './BoardAgentRepository';
import { ChatRepository } from './ChatRepository';
import { ManualDataRepository } from './ManualDataRepository';
import { SettingsRepository } from './SettingsRepository';
import { TaskRepository } from './TaskRepository';
import { TemplateRepository } from './TemplateRepository';
import { WorkspaceBoardRepository } from './WorkspaceBoardRepository';
import { WorkspaceItemRepository } from './WorkspaceItemRepository';
import { followUps, leads, reports } from '../schema';

const { transactionEvents, mockTx, runWriteTransaction } = vi.hoisted(() => {
  const transactionEvents: string[] = [];
  const mockTx = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const runWriteTransaction = vi.fn(
    async (operation: (tx: typeof mockTx) => Promise<unknown>) => {
      transactionEvents.push('begin');
      try {
        const result = await operation(mockTx);
        transactionEvents.push('commit');
        return result;
      } catch (error) {
        transactionEvents.push('rollback');
        throw error;
      }
    }
  );

  return { transactionEvents, mockTx, runWriteTransaction };
});

vi.mock('../client', () => ({
  getDB: () => mockTx,
  runWriteTransaction,
}));

describe('CaseRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionEvents.length = 0;
  });

  it('persists artifact bundles inside one transaction and updates source lineage', async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn(() => ({ where }));

    mockTx.insert.mockReturnValue({ values });
    mockTx.update.mockReturnValue({ set });

    await CaseRepository.createReport({
      id: 'rep-1',
      caseId: 'case-1',
      topic: 'Atlas',
      summary: 'Summary',
      agendas: [],
      leads: [],
      followUps: [
        {
          id: 'fu-1',
          kind: 'QUESTION',
          title: 'Verify the supplier',
          actionText: 'Verify the supplier relationship',
          status: 'OPEN',
        },
      ],
      entities: [],
      sources: [],
      rawText: 'raw artifact body',
      config: {
        sourceSignalId: 'sig-1',
        sourceFollowUpId: 'fu-origin',
      },
    });

    expect(runWriteTransaction).toHaveBeenCalledTimes(1);
    expect(transactionEvents).toEqual(['begin', 'commit']);
    expect(mockTx.insert).toHaveBeenCalledWith(reports);
    expect(mockTx.insert).toHaveBeenCalledWith(followUps);
    expect(mockTx.update).toHaveBeenCalledWith(leads);
    expect(mockTx.update).toHaveBeenCalledWith(followUps);
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ linkedReportId: 'rep-1' }));
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'RESOLVED',
        resolvedByArtifactId: 'rep-1',
      })
    );
    expect(where).toHaveBeenCalledTimes(3);
  });

  it('bubbles insert failures so the outer transaction can roll back', async () => {
    const failure = new Error('follow-up insert failed');
    const values = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(failure);

    mockTx.insert.mockReturnValue({ values });
    mockTx.update.mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
    });

    await expect(
      CaseRepository.createReport({
        id: 'rep-2',
        caseId: 'case-1',
        topic: 'Atlas',
        summary: 'Summary',
        agendas: [],
        leads: [],
        followUps: [
          {
            id: 'fu-2',
            kind: 'TASK',
            title: 'Check shipment',
            actionText: 'Check the shipment manifest',
            status: 'OPEN',
          },
        ],
        entities: [],
        sources: [],
        rawText: 'raw artifact body',
      })
    ).rejects.toThrow('follow-up insert failed');

    expect(runWriteTransaction).toHaveBeenCalledTimes(1);
    expect(transactionEvents).toEqual(['begin', 'rollback']);
  });

  it('reuses the outer transaction across workspace backup restore writes', async () => {
    vi.spyOn(CaseRepository, 'createCase').mockResolvedValue(undefined);
    vi.spyOn(CaseRepository, 'createReport').mockResolvedValue(undefined);
    vi.spyOn(TaskRepository, 'create').mockResolvedValue(undefined);
    vi.spyOn(ChatRepository, 'createSession').mockResolvedValue(undefined);
    vi.spyOn(ChatRepository, 'createMessage').mockResolvedValue(undefined);
    vi.spyOn(ChatRepository, 'createAction').mockResolvedValue(undefined);
    vi.spyOn(BoardAgentRepository, 'createSession').mockResolvedValue(undefined);
    vi.spyOn(BoardAgentRepository, 'createAction').mockResolvedValue(undefined);
    vi.spyOn(TemplateRepository, 'create').mockResolvedValue(undefined);
    vi.spyOn(WorkspaceItemRepository, 'create').mockResolvedValue(undefined);
    vi.spyOn(WorkspaceBoardRepository, 'createBoard').mockResolvedValue(undefined);
    vi.spyOn(WorkspaceBoardRepository, 'upsertDocument').mockResolvedValue(undefined);
    vi.spyOn(ManualDataRepository, 'saveAllNodes').mockResolvedValue(undefined);
    vi.spyOn(ManualDataRepository, 'saveAllLinks').mockResolvedValue(undefined);
    vi.spyOn(SettingsRepository, 'setSetting').mockResolvedValue(undefined);
    vi.spyOn(CaseRepository, 'clearCaseData').mockResolvedValue(undefined);

    await CaseRepository.replaceWorkspaceDataBackup({
      workspaces: [
        {
          id: 'ws-1',
          title: 'Legacy Workspace [RUN_ANGLE]: trace suppliers',
          status: 'ACTIVE',
          dateOpened: '2026-04-07',
        },
      ],
      artifacts: [
        {
          id: 'rep-1',
          caseId: 'ws-1',
          topic: 'Atlas',
          summary: 'Summary',
          agendas: [],
          leads: [],
          followUps: [],
          entities: [],
          sources: [],
          rawText: 'raw artifact body',
        },
      ],
      runs: [{ id: 'run-1', topic: 'Atlas', status: 'RUNNING', startTime: 1 }],
      chat: { sessions: [], messages: [], actions: [] },
      boardAgent: { sessions: [], actions: [] },
      signals: { signals: [] },
      templates: [],
      workspaceSurface: { items: [], boards: [], boardDocuments: [] },
      graph: { manualNodes: [], manualLinks: [] },
      metadata: {
        kind: 'SHERLOCK_WORKSPACE_DATA',
        formatVersion: 1,
        exportedAt: '2026-04-07T00:00:00.000Z',
      },
    });

    expect(runWriteTransaction).toHaveBeenCalledTimes(1);
    expect(transactionEvents).toEqual(['begin', 'commit']);
    expect(CaseRepository.clearCaseData).toHaveBeenCalledWith(mockTx);
    expect(CaseRepository.createCase).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ws-1' }),
      mockTx
    );
    expect(CaseRepository.createReport).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'rep-1' }),
      mockTx
    );
    expect(TaskRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'run-1' }),
      mockTx
    );
    expect(SettingsRepository.setSetting).toHaveBeenCalledWith('hidden_nodes', [], mockTx);
    expect(SettingsRepository.setSetting).toHaveBeenCalledWith('flagged_nodes', [], mockTx);
  });
});
