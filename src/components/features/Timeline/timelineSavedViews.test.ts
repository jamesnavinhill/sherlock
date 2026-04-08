import { describe, expect, it, vi, beforeEach } from 'vitest';

import { SettingsRepository } from '@/services/db/repositories/SettingsRepository';
import {
  buildTimelineSavedViewSnippet,
  buildTimelineSavedViewTitle,
  getTimelineSavedViewSignature,
  isTimelineQuerySaveable,
  saveTimelineSavedView,
} from './timelineSavedViews';

describe('timelineSavedViews', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects saveable timeline queries and builds descriptive titles', () => {
    expect(
      isTimelineQuerySaveable({
        search: '',
        filters: {
          range: 'ALL',
          tracks: ['SIGNAL', 'RUN', 'ARTIFACT', 'ITEM'],
        },
        focusedTrack: 'ALL',
        focusedRefId: undefined,
      })
    ).toBe(false);

    expect(
      buildTimelineSavedViewTitle({
        search: 'atlas holdings',
        filters: {
          range: '30D',
          tracks: ['SIGNAL', 'ARTIFACT'],
        },
        focusedTrack: 'ALL',
        focusedRefId: undefined,
      })
    ).toBe('Timeline: atlas holdings');
  });

  it('saves and dedupes timeline views by canonical route signature', async () => {
    const getSetting = vi.spyOn(SettingsRepository, 'getSetting').mockResolvedValue([]);
    const setSetting = vi.spyOn(SettingsRepository, 'setSetting').mockResolvedValue();

    const query = {
      search: 'atlas',
      filters: {
        range: '30D' as const,
        tracks: ['SIGNAL', 'ARTIFACT'] as Array<'SIGNAL' | 'ARTIFACT'>,
      },
      focusedTrack: 'ALL' as const,
      focusedRefId: undefined,
    };

    const first = await saveTimelineSavedView({
      workspaceId: 'ws-1',
      query,
    });

    expect(getSetting).toHaveBeenCalledWith('timeline_saved_views:ws-1');
    expect(setSetting).toHaveBeenCalledWith(
      'timeline_saved_views:ws-1',
      expect.arrayContaining([
        expect.objectContaining({
          workspaceId: 'ws-1',
          title: 'Timeline: atlas',
        }),
      ])
    );

    getSetting.mockResolvedValue([first]);

    const second = await saveTimelineSavedView({
      workspaceId: 'ws-1',
      query: {
        search: ' atlas ',
        filters: {
          range: '30D',
          tracks: ['SIGNAL', 'ARTIFACT', 'SIGNAL'],
        },
        focusedTrack: 'ALL',
        focusedRefId: undefined,
      },
    });

    expect(second.id).toBe(first.id);
    expect(getTimelineSavedViewSignature(second.query)).toBe(
      getTimelineSavedViewSignature(first.query)
    );
  });

  it('builds omnibox-friendly snippets for saved views', () => {
    expect(
      buildTimelineSavedViewSnippet(
        {
          id: 'view-1',
          workspaceId: 'ws-1',
          title: 'Timeline: atlas',
          query: {
            search: 'atlas',
            filters: {
              range: '30D',
              tracks: ['SIGNAL', 'ARTIFACT'],
            },
            focusedTrack: 'ALL',
            focusedRefId: undefined,
          },
          createdAt: 100,
          updatedAt: 120,
        },
        {
          id: 'ws-1',
          title: 'Atlas Workspace',
          displayTitle: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-07',
        }
      )
    ).toContain('Atlas Workspace');
  });
});
