import type {
  AgentAction,
  Artifact,
  ChatSession,
  Headline,
  TimelineEvent,
  TimelineQueryState,
  TimelineTrack,
  WorkspaceItem,
  WorkspaceRun,
} from '@/types';
import {
  buildArtifactTimelineEvents,
  buildChatActionTimelineEvents,
  buildChatSessionTimelineEvents,
  buildEntityTimelineEvents,
  buildRunTimelineEvents,
  buildSignalTimelineEvents,
  buildWorkspaceItemReuseTimelineEvents,
  buildWorkspaceItemTimelineEvents,
} from './timelineEventBuilders';
import {
  DEFAULT_TRACKS,
  eventReferencesFocus,
  resolveRangeCutoff,
} from './timelineEventUtils';

export const buildWorkspaceTimelineEvents = (input: {
  workspaceId: string;
  artifacts: Artifact[];
  runs: WorkspaceRun[];
  signals: Headline[];
  chatSessions: ChatSession[];
  chatActionsBySessionId: Record<string, AgentAction[]>;
  workspaceItems?: WorkspaceItem[];
}): TimelineEvent[] => {
  const scopedArtifacts = input.artifacts.filter(
    (artifact) => artifact.workspaceId === input.workspaceId
  );
  const artifactById = new Map(
    scopedArtifacts
      .filter((artifact): artifact is Artifact & { id: string } => !!artifact.id)
      .map((artifact) => [artifact.id, artifact])
  );
  const scopedWorkspaceItems = (input.workspaceItems || []).filter(
    (item) => item.workspaceId === input.workspaceId
  );
  const workspaceItemById = new Map(scopedWorkspaceItems.map((item) => [item.id, item]));
  const sessionById = new Map(
    input.chatSessions
      .filter((session) => session.workspaceId === input.workspaceId)
      .map((session) => [session.id, session])
  );
  const context = {
    artifactById,
    artifacts: input.artifacts,
    chatActionsBySessionId: input.chatActionsBySessionId,
    chatSessions: input.chatSessions,
    runs: input.runs,
    scopedArtifacts,
    scopedWorkspaceItems,
    sessionById,
    signals: input.signals,
    workspaceId: input.workspaceId,
    workspaceItemById,
  };

  return [
    ...buildSignalTimelineEvents(context),
    ...buildRunTimelineEvents(context),
    ...buildArtifactTimelineEvents(context),
    ...buildWorkspaceItemTimelineEvents(context),
    ...buildWorkspaceItemReuseTimelineEvents(context),
    ...buildEntityTimelineEvents(context),
    ...buildChatSessionTimelineEvents(context),
    ...buildChatActionTimelineEvents(context),
  ].sort((left, right) => {
    if (right.occurredAt !== left.occurredAt) return right.occurredAt - left.occurredAt;
    return left.title.localeCompare(right.title);
  });
};

export const filterTimelineEvents = (
  events: TimelineEvent[],
  query: TimelineQueryState
): TimelineEvent[] => {
  const activeTracks = query.filters.tracks.length > 0 ? query.filters.tracks : DEFAULT_TRACKS;
  const trackSet = new Set(activeTracks);
  const cutoff = resolveRangeCutoff(query.filters.range);
  const search = query.search.trim().toLowerCase();

  return events.filter((event) => {
    if (query.workspaceId && event.workspaceId !== query.workspaceId) return false;
    if (!trackSet.has(event.track)) return false;
    if (cutoff && event.occurredAt < cutoff) return false;
    if (query.focusedTrack && query.focusedTrack !== 'ALL' && event.track !== query.focusedTrack) {
      return false;
    }
    if (query.focusedRefId && !eventReferencesFocus(event, query.focusedRefId)) {
      return false;
    }
    if (!search) return true;

    const haystack = [event.title, event.summary, event.searchText, ...(event.badges || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(search);
  });
};

export const groupTimelineEventsByDay = (events: TimelineEvent[]) => {
  const groups = new Map<string, TimelineEvent[]>();

  events.forEach((event) => {
    const key =
      event.occurredAt > 0
        ? new Date(event.occurredAt).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Undated';
    const next = groups.get(key) || [];
    next.push(event);
    groups.set(key, next);
  });

  return Array.from(groups.entries()).map(([label, groupedEvents]) => ({
    label,
    events: groupedEvents,
  }));
};

export const getTrackCount = (events: TimelineEvent[], track: TimelineTrack) =>
  events.filter((event) => event.track === track).length;

export const getLatestTimelineActivity = (events: TimelineEvent[]) => {
  const latest = events.find((event) => event.occurredAt > 0);
  if (!latest) return null;

  const delta = Date.now() - latest.occurredAt;
  const hours = Math.floor(delta / (60 * 60 * 1000));
  if (hours < 1) return 'Less than 1h ago';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(latest.occurredAt).toLocaleDateString();
};
