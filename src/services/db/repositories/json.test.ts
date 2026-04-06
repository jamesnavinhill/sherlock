import { describe, expect, it, vi } from 'vitest';

import { parseStoredJson, parseStoredJsonOrUndefined } from './json';

describe('json repository helpers', () => {
  it('returns the fallback and warns when stored JSON is malformed', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(parseStoredJson('{"broken"', { ok: false }, 'workspace metadata')).toEqual({
      ok: false,
    });
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to parse workspace metadata.',
      expect.any(SyntaxError)
    );
  });

  it('returns undefined for malformed optional JSON payloads', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(parseStoredJsonOrUndefined('not-json', 'optional field')).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to parse optional field.',
      expect.any(SyntaxError)
    );
  });
});
