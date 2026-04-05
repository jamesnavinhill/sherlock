import type { TimelineQueryState, TimelineRange, TimelineTrack } from '@/types';

import { DEFAULT_FILTERS, TRACK_OPTIONS } from './timelineViewUtils';

const VALID_TRACKS = new Set<TimelineTrack>(TRACK_OPTIONS.map((option) => option.track));
const VALID_RANGES = new Set<TimelineRange>(['ALL', '7D', '30D', '90D']);

const isTimelineTrack = (value: string): value is TimelineTrack =>
  VALID_TRACKS.has(value as TimelineTrack);

const isTimelineRange = (value: string): value is TimelineRange =>
  VALID_RANGES.has(value as TimelineRange);

export type TimelineRouteQueryState = Pick<
  TimelineQueryState,
  'search' | 'filters' | 'focusedTrack' | 'focusedRefId'
>;

export const DEFAULT_TIMELINE_ROUTE_QUERY: TimelineRouteQueryState = {
  search: '',
  filters: DEFAULT_FILTERS,
  focusedTrack: 'ALL',
  focusedRefId: undefined,
};

export const parseTimelineRouteQuery = (
  searchParams: URLSearchParams
): TimelineRouteQueryState => {
  const search = searchParams.get('search') || '';
  const rangeParam = searchParams.get('range');
  const tracksParam = searchParams.get('tracks');
  const focusTrackParam = searchParams.get('focusTrack');
  const focusRefId = searchParams.get('focusRefId') || undefined;

  const range = rangeParam && isTimelineRange(rangeParam) ? rangeParam : DEFAULT_FILTERS.range;

  const parsedTracks =
    tracksParam === null
      ? DEFAULT_FILTERS.tracks
      : tracksParam
          .split(',')
          .map((value) => value.trim())
          .filter((value, index, values): value is TimelineTrack =>
            value.length > 0 && isTimelineTrack(value) && values.indexOf(value) === index
          );
  const tracks =
    tracksParam === null || tracksParam === '' || parsedTracks.length > 0
      ? parsedTracks
      : DEFAULT_FILTERS.tracks;

  const focusedTrack =
    focusTrackParam && (focusTrackParam === 'ALL' || isTimelineTrack(focusTrackParam))
      ? (focusTrackParam as TimelineTrack | 'ALL')
      : 'ALL';

  return {
    search,
    filters: {
      range,
      tracks,
    },
    focusedTrack,
    focusedRefId: focusRefId,
  };
};

export const buildTimelineRouteQuery = (
  query: TimelineRouteQueryState
): URLSearchParams => {
  const params = new URLSearchParams();
  const trimmedSearch = query.search.trim();
  const normalizedTracks = query.filters.tracks.filter(
    (track, index, tracks) => isTimelineTrack(track) && tracks.indexOf(track) === index
  );

  if (trimmedSearch.length > 0) {
    params.set('search', trimmedSearch);
  }

  if (query.filters.range !== DEFAULT_FILTERS.range) {
    params.set('range', query.filters.range);
  }

  if (normalizedTracks.length === 0) {
    params.set('tracks', '');
  } else if (
    normalizedTracks.length !== DEFAULT_FILTERS.tracks.length ||
    normalizedTracks.some((track, index) => track !== DEFAULT_FILTERS.tracks[index])
  ) {
    params.set('tracks', normalizedTracks.join(','));
  }

  if (query.focusedTrack && query.focusedTrack !== 'ALL') {
    params.set('focusTrack', query.focusedTrack);
  }

  if (query.focusedRefId) {
    params.set('focusRefId', query.focusedRefId);
  }

  return params;
};
