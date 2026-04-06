import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TemplateRepository } from './TemplateRepository';
import { templates } from '../schema';

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
};

vi.mock('../client', () => ({
  getDB: () => mockDb,
}));

describe('TemplateRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to an empty config when persisted template JSON is malformed', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mockDb.select.mockImplementation(() => ({
      from: (table: unknown) => {
        if (table === templates) {
          return {
            orderBy: vi.fn().mockResolvedValue([
              {
                id: 'tpl-1',
                name: 'Atlas Follow-Up',
                description: null,
                topic: 'Investigate Atlas',
                configJson: '{bad-json',
                createdAt: 1,
                scopeId: null,
              },
            ]),
          };
        }

        throw new Error('Unexpected table access.');
      },
    }));

    const allTemplates = await TemplateRepository.getAll();

    expect(allTemplates).toEqual([
      {
        id: 'tpl-1',
        name: 'Atlas Follow-Up',
        topic: 'Investigate Atlas',
        config: {},
        createdAt: 1,
        description: undefined,
        scopeId: undefined,
      },
    ]);
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to parse template config tpl-1.',
      expect.any(SyntaxError)
    );
  });

  it('serializes template config values through the shared mapper', async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values });

    await TemplateRepository.create({
      id: 'tpl-2',
      name: 'Atlas Snapshot',
      topic: 'Atlas',
      config: { modelId: 'gpt-test' },
      createdAt: 2,
      scopeId: 'open-investigation',
    });

    expect(mockDb.insert).toHaveBeenCalledWith(templates);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tpl-2',
        configJson: JSON.stringify({ modelId: 'gpt-test' }),
      })
    );
  });
});
