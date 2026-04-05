import { describe, expect, it } from 'vitest';
import { buildWorkspaceLibraryEntries } from './library';

describe('workspace library entries', () => {
  it('preserves full canonical workspace item content for AI/manual reuse', () => {
    const entries = buildWorkspaceLibraryEntries({
      workspaceId: 'case-1',
      artifacts: [],
      headlines: [],
      workspaceItems: [
        {
          id: 'item-1',
          workspaceId: 'case-1',
          kind: 'NOTE',
          title: 'Theory Note',
          description: 'Short card summary',
          textContent:
            'Full note body with the detailed reasoning that should be reused by board AI actions.',
          tags: ['theory'],
          createdAt: 1,
          updatedAt: 2,
        },
      ],
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual(
      expect.objectContaining({
        kind: 'NOTE',
        description: 'Short card summary',
      })
    );
    expect(entries[0].contextText).toContain('Full note body with the detailed reasoning');
    expect(entries[0].searchText).toContain('theory');
  });
});
