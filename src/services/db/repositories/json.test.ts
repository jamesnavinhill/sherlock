import { describe, expect, it, vi } from 'vitest';

import {
  mapRowsSafely,
  parseStoredJson,
  parseStoredJsonOrUndefined,
  serializeStoredJson,
  serializeStoredJsonOrNull,
  serializeStoredJsonOrUndefined,
} from './json';

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

  it('serializes optional JSON payloads consistently', () => {
    expect(serializeStoredJson({ ok: true })).toBe('{"ok":true}');
    expect(serializeStoredJsonOrNull(undefined)).toBeNull();
    expect(serializeStoredJsonOrNull({ ok: true })).toBe('{"ok":true}');
    expect(serializeStoredJsonOrUndefined(undefined)).toBeUndefined();
    expect(serializeStoredJsonOrUndefined(null)).toBeNull();
    expect(serializeStoredJsonOrUndefined(['x'])).toBe('["x"]');
  });

  it('skips corrupted rows while hydrating repository results', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = mapRowsSafely(
      [
        { id: 'good', value: 'ok' },
        { id: 'bad', value: 'explode' },
      ],
      {
        label: 'workspace row',
        getRowId: (row) => row.id,
        mapRow: (row) => {
          if (row.value === 'explode') {
            throw new Error('broken row');
          }
          return row.value;
        },
      }
    );

    expect(result).toEqual(['ok']);
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to hydrate workspace row bad.',
      expect.any(Error)
    );
  });
});
