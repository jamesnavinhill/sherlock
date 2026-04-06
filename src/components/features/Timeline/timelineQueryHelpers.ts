import type { TimelineTrack } from '@/types';
import { DEFAULT_FILTERS } from './timelineViewUtils';
import type { TimelineRouteQueryState } from './timelineRouteState';

export const ensureTimelineTrackVisible = (
  current: TimelineRouteQueryState,
  track: TimelineTrack
): TimelineRouteQueryState =>
  current.filters.tracks.includes(track)
    ? current
    : {
        ...current,
        filters: {
          ...current.filters,
          tracks: [...current.filters.tracks, track],
        },
      };

export const clearTimelineQuery = (): TimelineRouteQueryState => ({
  search: '',
  filters: DEFAULT_FILTERS,
  focusedTrack: 'ALL',
  focusedRefId: undefined,
});

export const setTimelineTrackFocus = (
  current: TimelineRouteQueryState,
  track: TimelineTrack | 'ALL'
): TimelineRouteQueryState => ({
  ...(track !== 'ALL' ? ensureTimelineTrackVisible(current, track) : current),
  focusedTrack: track,
  focusedRefId: undefined,
});

export const focusTimelineReference = (
  current: TimelineRouteQueryState,
  track: TimelineTrack,
  refId?: string
): TimelineRouteQueryState => {
  if (!refId) return current;

  const next = ensureTimelineTrackVisible(current, track);
  return {
    ...next,
    focusedTrack: track,
    focusedRefId: refId,
  };
};

export const toggleTimelineTrack = (
  current: TimelineRouteQueryState,
  track: TimelineTrack
): TimelineRouteQueryState => {
  const nextTracks = current.filters.tracks.includes(track)
    ? current.filters.tracks.filter((item) => item !== track)
    : [...current.filters.tracks, track];

  return {
    ...current,
    filters: {
      ...current.filters,
      tracks: nextTracks,
    },
  };
};
