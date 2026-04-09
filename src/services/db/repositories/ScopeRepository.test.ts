import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScopeRepository } from './ScopeRepository';
import { scopes } from '../schema';
import { BUILTIN_SCOPES } from '@/data/presets';

const { mockTx } = vi.hoisted(() => {
  const mockTx = {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  return { mockTx };
});

vi.mock('../client', () => ({
  getDB: () => mockTx,
}));

describe('ScopeRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('upserts built-in scopes so workspace scope foreign keys stay valid', async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn(() => ({ onConflictDoUpdate }));

    mockTx.insert.mockReturnValue({ values });

    await ScopeRepository.ensureBuiltinScopes();

    expect(mockTx.insert).toHaveBeenCalledTimes(BUILTIN_SCOPES.length);
    expect(mockTx.insert).toHaveBeenNthCalledWith(1, scopes);
    expect(values).toHaveBeenCalledTimes(BUILTIN_SCOPES.length);
    expect(onConflictDoUpdate).toHaveBeenCalledTimes(BUILTIN_SCOPES.length);

    const storedRows = values.mock.calls.map(
      (call) =>
        (call as unknown as unknown[])[0] as {
          id: string;
          name: string;
          type: string;
          configJson: string;
          createdAt: number;
          updatedAt: number;
        }
    );
    expect(storedRows.map((row) => row.id)).toEqual(BUILTIN_SCOPES.map((scope) => scope.id));

    const aiLandscapeScope = storedRows.find((row) => row.id === 'ai-technology-landscape');
    expect(aiLandscapeScope).toBeDefined();
    if (!aiLandscapeScope) {
      throw new Error('Expected AI landscape built-in scope to be persisted.');
    }
    expect(aiLandscapeScope).toMatchObject({
      id: 'ai-technology-landscape',
      name: 'AI & Technology Landscape',
      type: 'built-in',
    });
    expect(aiLandscapeScope.createdAt).toEqual(expect.any(Number));
    expect(aiLandscapeScope.updatedAt).toEqual(expect.any(Number));
    expect(JSON.parse(aiLandscapeScope.configJson)).toMatchObject({
      workspaceMode: 'RESEARCH',
      defaultPurposeId: 'trend-scan',
      labelProfileId: 'research',
    });

    expect(onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        target: scopes.id,
        set: expect.objectContaining({
          type: 'built-in',
          updatedAt: expect.any(Number),
        }),
      })
    );
  });
});
