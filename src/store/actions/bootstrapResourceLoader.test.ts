import { describe, expect, it, vi } from 'vitest';

import { loadBootstrapResource } from './bootstrapResourceLoader';

describe('bootstrapResourceLoader', () => {
  it('returns fallback and logs a skip warning for recoverable reads', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await loadBootstrapResource(
      'artifacts',
      async () => {
        throw new Error('bad row');
      },
      [] as string[]
    );

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      '[bootstrap][skip] Failed to load artifacts. Using fallback.',
      expect.any(Error)
    );
  });

  it('throws on fail-fast reads when the failure mode is FAIL', async () => {
    await expect(
      loadBootstrapResource(
        'critical settings',
        async () => {
          throw new Error('unrecoverable');
        },
        null,
        'FAIL'
      )
    ).rejects.toThrow('[bootstrap][fail] Failed to load critical settings.');
  });
});
