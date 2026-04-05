import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CaseRepository } from './CaseRepository';
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
});
