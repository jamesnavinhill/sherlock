import { getLabelProfileById, sanitizeDisplayTitle } from '@/domain';
import { getChatLaunchContextFromSession } from '@/services/chat/launchContext';
import type {
  AgentAction,
  Artifact,
  ChatSession,
  Headline,
  Workspace,
  WorkspaceItem,
  WorkspaceRun,
} from '@/types';

import {
  buildWorkspaceTimelineEvents,
  filterTimelineEvents,
  groupTimelineEventsByDay,
} from './timelineEvents';
import { buildTimelineSnapshot } from './timelineSnapshot';
import type { TimelineRouteQueryState } from './timelineRouteState';
import { getMetadataValue, getPrimaryRefId, toUniqueItems } from './timelineViewUtils';

interface TimelineViewModelInput {
  activeWorkspaceId: string | null;
  artifacts: Artifact[];
  chatActionsBySessionId: Record<string, AgentAction[]>;
  chatSessions: ChatSession[];
  headlines: Headline[];
  selectedEventId: string | null;
  timelineQuery: TimelineRouteQueryState;
  workspaceItems: WorkspaceItem[];
  workspaceRuns: WorkspaceRun[];
  workspaces: Workspace[];
}

export const buildTimelineViewModel = ({
  activeWorkspaceId,
  artifacts,
  chatActionsBySessionId,
  chatSessions,
  headlines,
  selectedEventId,
  timelineQuery,
  workspaceItems,
  workspaceRuns,
  workspaces,
}: TimelineViewModelInput) => {
  const { search, filters, focusedTrack, focusedRefId } = timelineQuery;
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null;
  const labelProfile = getLabelProfileById(
    activeWorkspace?.labelProfileId ||
      artifacts.find((artifact) => artifact.caseId === activeWorkspace?.id)?.labelProfileId
  );

  const allTimelineEvents = activeWorkspace
    ? buildWorkspaceTimelineEvents({
        workspaceId: activeWorkspace.id,
        artifacts,
        runs: workspaceRuns,
        signals: headlines,
        chatSessions,
        chatActionsBySessionId,
        workspaceItems,
      })
    : [];

  const visibleEvents = filterTimelineEvents(allTimelineEvents, {
    workspaceId: activeWorkspace?.id,
    search,
    filters,
    focusedTrack,
    focusedRefId,
  });

  const groupedEvents = groupTimelineEventsByDay(visibleEvents);
  const runItems = toUniqueItems(allTimelineEvents, 'RUN');
  const artifactItems = toUniqueItems(allTimelineEvents, 'ARTIFACT');
  const signalItems = toUniqueItems(allTimelineEvents, 'SIGNAL');
  const workspaceItemItems = toUniqueItems(allTimelineEvents, 'ITEM');
  const entityItems = toUniqueItems(allTimelineEvents, 'ENTITY');
  const chatSessionItems = allTimelineEvents.filter(
    (event) => event.type === 'CHAT_SESSION_STARTED'
  );
  const artifactTitleById = new Map(
    artifacts
      .filter((artifact): artifact is Artifact & { id: string } => !!artifact.id)
      .map((artifact) => [artifact.id, sanitizeDisplayTitle(artifact.topic)])
  );
  const signalTitleById = new Map(
    headlines.map((headline) => [headline.id, headline.source || headline.type])
  );
  const chatTitleById = new Map(
    chatSessions.map((session) => [session.id, session.title || 'Workspace Chat'])
  );
  const effectiveSelectedEventId =
    selectedEventId && visibleEvents.some((event) => event.id === selectedEventId)
      ? selectedEventId
      : null;
  const selectedEvent =
    visibleEvents.find((event) => event.id === effectiveSelectedEventId) || null;

  const selectedArtifactId =
    getPrimaryRefId(selectedEvent, 'ARTIFACT') ||
    getMetadataValue<string>(selectedEvent, 'relatedArtifactId') ||
    getMetadataValue<string>(selectedEvent, 'linkedArtifactId');
  const selectedArtifact =
    artifacts.find((artifact) => artifact.id === selectedArtifactId) || null;

  const selectedRunId =
    getPrimaryRefId(selectedEvent, 'RUN') ||
    getMetadataValue<string>(selectedEvent, 'sourceRunId');
  const selectedRun =
    workspaceRuns.find((workspaceRun) => workspaceRun.id === selectedRunId) || null;

  const relatedSignalId =
    getPrimaryRefId(selectedEvent, 'SIGNAL') ||
    getMetadataValue<string>(selectedEvent, 'sourceSignalId');
  const relatedSignal = headlines.find((headline) => headline.id === relatedSignalId) || null;

  const parentArtifactId =
    getMetadataValue<string>(selectedEvent, 'parentArtifactId') || selectedEvent?.parentRefId;
  const parentArtifact = artifacts.find((artifact) => artifact.id === parentArtifactId) || null;

  const selectedChatSessionId =
    getPrimaryRefId(selectedEvent, 'CHAT_SESSION') ||
    getMetadataValue<string>(selectedEvent, 'sessionId');
  const selectedChatSession =
    chatSessions.find((session) => session.id === selectedChatSessionId) || null;

  const selectedChatActionId = getPrimaryRefId(selectedEvent, 'CHAT_ACTION');
  const selectedChatAction =
    Object.values(chatActionsBySessionId)
      .flat()
      .find((action) => action.id === selectedChatActionId) || null;

  const selectedChatLaunchContext = getChatLaunchContextFromSession(selectedChatSession);
  const selectedEntityName =
    getPrimaryRefId(selectedEvent, 'ENTITY') ||
    getMetadataValue<string>(selectedEvent, 'entityName') ||
    null;
  const selectedWorkspaceItemId =
    getPrimaryRefId(selectedEvent, 'WORKSPACE_ITEM') ||
    getMetadataValue<string>(selectedEvent, 'workspaceItemId');
  const selectedWorkspaceItem =
    workspaceItems.find((item) => item.id === selectedWorkspaceItemId) || null;
  const previousArtifactId = getMetadataValue<string>(selectedEvent, 'previousArtifactId');

  const timelineSnapshot = activeWorkspace
    ? buildTimelineSnapshot({
        workspace: activeWorkspace,
        events: visibleEvents,
        filters,
        search,
        focusedTrack,
        focusedRefId,
      })
    : null;

  return {
    activeWorkspace,
    allTimelineEvents,
    artifactItems,
    artifactTitleById,
    chatSessionItems,
    chatTitleById,
    effectiveSelectedEventId,
    entityItems,
    groupedEvents,
    labelProfile,
    parentArtifact,
    previousArtifactId,
    relatedSignal,
    runItems,
    selectedArtifact,
    selectedChatAction,
    selectedChatLaunchContext,
    selectedChatSession,
    selectedEntityName,
    selectedEvent,
    selectedRun,
    selectedWorkspaceItem,
    signalItems,
    signalTitleById,
    timelineSnapshot,
    visibleEvents,
    workspaceItemItems,
  };
};
