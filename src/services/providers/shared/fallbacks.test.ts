import { describe, expect, it, vi } from 'vitest';
import { buildFallbackFeedItems, buildFallbackLiveEvents } from './fallbacks';

describe('provider fallback helpers', () => {
  it('builds deterministic fallback feed items from scope categories', () => {
    const items = buildFallbackFeedItems(
      {
        id: 'open-investigation',
        name: 'Open Investigation',
        description: 'Fallback scope',
        domainContext: 'General',
        investigationObjective: 'Investigate',
        categories: ['General', 'Finance', 'Analysis'],
        personas: [],
        suggestedSources: [],
      },
      2
    );

    expect(items).toEqual([
      expect.objectContaining({
        title: 'Notable development in Finance',
        category: 'Finance',
      }),
      expect.objectContaining({
        title: 'Emerging pattern detected',
        category: 'Analysis',
      }),
    ]);
  });

  it('builds fallback live events around the normalized topic', () => {
    vi.spyOn(Date, 'now').mockReturnValue(123456);

    const events = buildFallbackLiveEvents('Atlas Holdings');

    expect(events).toEqual([
      expect.objectContaining({
        id: 'sim-123456-1',
        content: 'New developments regarding Atlas Holdings.',
      }),
      expect.objectContaining({
        id: 'sim-123456-2',
        content: 'Discussion emerging about Atlas Holdings.',
      }),
      expect.objectContaining({
        id: 'sim-123456-3',
        content: 'Related announcement published.',
      }),
    ]);
  });
});
