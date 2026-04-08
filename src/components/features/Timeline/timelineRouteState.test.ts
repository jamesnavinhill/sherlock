import { describe, expect, it } from 'vitest';

import {
  buildTimelineRouteQuery,
  parseTimelineRouteQuery,
  DEFAULT_TIMELINE_ROUTE_QUERY,
} from './timelineRouteState';

describe('timeline route state', () => {
  it('parses all supported query params into timeline query state', () => {
    const query = parseTimelineRouteQuery(
      new URLSearchParams(
        'search=alpha+signal&range=30D&tracks=SIGNAL,CHAT&focusTrack=CHAT&focusRefId=session-1'
      )
    );

    expect(query).toEqual({
      search: 'alpha signal',
      filters: {
        range: '30D',
        tracks: ['SIGNAL', 'CHAT'],
      },
      focusedTrack: 'CHAT',
      focusedRefId: 'session-1',
    });
  });

  it('falls back to defaults for invalid query params', () => {
    const query = parseTimelineRouteQuery(
      new URLSearchParams('range=YEAR&tracks=INVALID&focusTrack=NOPE')
    );

    expect(query).toEqual(DEFAULT_TIMELINE_ROUTE_QUERY);
  });

  it('builds compact search params and preserves explicit empty track selections', () => {
    expect(
      buildTimelineRouteQuery({
        search: '',
        filters: {
          range: 'ALL',
          tracks: ['SIGNAL', 'RUN', 'ARTIFACT', 'ITEM'],
        },
        focusedTrack: 'ALL',
        focusedRefId: undefined,
      }).toString()
    ).toBe('');

    expect(
      buildTimelineRouteQuery({
        search: 'beta',
        filters: {
          range: '7D',
          tracks: [],
        },
        focusedTrack: 'ENTITY',
        focusedRefId: 'entity-2',
      }).toString()
    ).toBe('search=beta&range=7D&tracks=&focusTrack=ENTITY&focusRefId=entity-2');
  });
});
