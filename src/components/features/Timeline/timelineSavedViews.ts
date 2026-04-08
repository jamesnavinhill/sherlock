import { createLocalId } from '@/utils/id';
import type { Workspace } from '@/types';
import { getWorkspaceDisplayTitle } from '@/domain';
import { SettingsRepository } from '@/services/db/repositories/SettingsRepository';
import { buildTimelineRouteQuery, type TimelineRouteQueryState } from './timelineRouteState';
import { DEFAULT_FILTERS } from './timelineViewUtils';

export interface TimelineSavedView {
  id: string;
  workspaceId: string;
  title: string;
  query: TimelineRouteQueryState;
  createdAt: number;
  updatedAt: number;
}

const MAX_SAVED_TIMELINE_VIEWS = 12;

const getTimelineSavedViewsKey = (workspaceId: string) => `timeline_saved_views:${workspaceId}`;

const normalizeTimelineSavedViewQuery = (
  query: TimelineRouteQueryState
): TimelineRouteQueryState => {
  const tracks = query.filters.tracks.filter(
    (track, index, current) => current.indexOf(track) === index
  );

  return {
    search: query.search.trim(),
    filters: {
      range: query.filters.range,
      tracks,
    },
    focusedTrack: query.focusedTrack || 'ALL',
    focusedRefId: query.focusedRefId?.trim() || undefined,
  };
};

export const isTimelineQuerySaveable = (query: TimelineRouteQueryState) => {
  const normalized = normalizeTimelineSavedViewQuery(query);
  const defaultTracks = DEFAULT_FILTERS.tracks;
  const hasTrackDifference =
    normalized.filters.tracks.length !== defaultTracks.length ||
    normalized.filters.tracks.some((track, index) => track !== defaultTracks[index]);

  return (
    normalized.search.length > 0 ||
    normalized.filters.range !== DEFAULT_FILTERS.range ||
    hasTrackDifference ||
    normalized.focusedTrack !== 'ALL' ||
    !!normalized.focusedRefId
  );
};

export const getTimelineSavedViewSignature = (query: TimelineRouteQueryState) =>
  buildTimelineRouteQuery(normalizeTimelineSavedViewQuery(query)).toString();

const getTracksSummary = (query: TimelineRouteQueryState) => {
  const tracks = query.filters.tracks;
  if (tracks.length === 0) return 'No tracks';
  if (tracks.length === DEFAULT_FILTERS.tracks.length) return 'Core tracks';
  if (tracks.length <= 2) return tracks.join(' + ');
  return `${tracks.length} tracks`;
};

export const buildTimelineSavedViewTitle = (query: TimelineRouteQueryState) => {
  const normalized = normalizeTimelineSavedViewQuery(query);
  if (normalized.search) {
    return `Timeline: ${normalized.search}`;
  }
  if (normalized.focusedTrack && normalized.focusedTrack !== 'ALL') {
    return normalized.focusedRefId
      ? `Timeline focus: ${normalized.focusedTrack.toLowerCase()}`
      : `Timeline: ${normalized.focusedTrack.toLowerCase()}`;
  }
  if (normalized.filters.range !== DEFAULT_FILTERS.range) {
    return `Timeline: ${normalized.filters.range}`;
  }
  return `Timeline: ${getTracksSummary(normalized)}`;
};

export const buildTimelineSavedViewSnippet = (
  view: TimelineSavedView,
  workspace?: Workspace | null
) => {
  const parts = [
    workspace ? getWorkspaceDisplayTitle(workspace) : undefined,
    view.query.filters.range !== DEFAULT_FILTERS.range ? view.query.filters.range : 'All time',
    getTracksSummary(view.query),
    view.query.search ? `Search: ${view.query.search}` : undefined,
    view.query.focusedTrack && view.query.focusedTrack !== 'ALL'
      ? `Focus: ${view.query.focusedTrack}`
      : undefined,
  ].filter(Boolean);

  return parts.join(' | ');
};

export const getWorkspaceTimelineSavedViews = async (
  workspaceId: string
): Promise<TimelineSavedView[]> => {
  const views =
    (await SettingsRepository.getSetting<TimelineSavedView[]>(getTimelineSavedViewsKey(workspaceId))) ||
    [];

  return views
    .filter(
      (view): view is TimelineSavedView =>
        !!view &&
        typeof view.id === 'string' &&
        typeof view.workspaceId === 'string' &&
        typeof view.title === 'string' &&
        typeof view.createdAt === 'number' &&
        typeof view.updatedAt === 'number' &&
        !!view.query
    )
    .sort((left, right) => right.updatedAt - left.updatedAt);
};

export const getAllTimelineSavedViews = async (
  workspaceIds: string[]
): Promise<TimelineSavedView[]> => {
  const viewsByWorkspace = await Promise.all(
    workspaceIds.map((workspaceId) => getWorkspaceTimelineSavedViews(workspaceId))
  );

  return viewsByWorkspace
    .flat()
    .sort((left, right) => right.updatedAt - left.updatedAt);
};

export const saveTimelineSavedView = async (input: {
  query: TimelineRouteQueryState;
  title?: string;
  workspaceId: string;
}): Promise<TimelineSavedView> => {
  const query = normalizeTimelineSavedViewQuery(input.query);
  const signature = getTimelineSavedViewSignature(query);
  const existing = await getWorkspaceTimelineSavedViews(input.workspaceId);
  const now = Date.now();
  const matched = existing.find((view) => getTimelineSavedViewSignature(view.query) === signature);

  const savedView: TimelineSavedView = matched
    ? {
        ...matched,
        title: input.title?.trim() || matched.title || buildTimelineSavedViewTitle(query),
        query,
        updatedAt: now,
      }
    : {
        id: createLocalId('timeline-view'),
        workspaceId: input.workspaceId,
        title: input.title?.trim() || buildTimelineSavedViewTitle(query),
        query,
        createdAt: now,
        updatedAt: now,
      };

  const next = [savedView, ...existing.filter((view) => view.id !== savedView.id)]
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, MAX_SAVED_TIMELINE_VIEWS);

  await SettingsRepository.setSetting(getTimelineSavedViewsKey(input.workspaceId), next);
  return savedView;
};
