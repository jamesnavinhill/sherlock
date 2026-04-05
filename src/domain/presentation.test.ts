import { describe, expect, it } from 'vitest';
import { sanitizeDisplayTitle, stripLegacyWorkspacePrefix } from './presentation';

describe('presentation helpers', () => {
  it('removes control tags from display titles', () => {
    expect(
      sanitizeDisplayTitle(
        '[Artificial Super Intelligence] [RUN_ANGLE]: Focus on strong evidence. [PRIORITY_SOURCES]: arXiv'
      )
    ).toBe('Artificial Super Intelligence');
  });

  it('keeps legacy workspace prefix stripping aligned with display sanitization', () => {
    expect(
      stripLegacyWorkspacePrefix(
        'Operation: Atlas Holdings\n\n[RUN_ANGLE]: Compare recent findings\n\n[PRIORITY_SOURCES]: sec.gov'
      )
    ).toBe('Atlas Holdings');
  });
});
