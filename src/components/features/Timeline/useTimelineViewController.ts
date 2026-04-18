import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  Artifact,
  ChatOpenRequest,
  TimelineTrack,
} from '@/types';
import { useTimelineFeatureState } from '@/store/selectors/timelineSelectors';

import {
  buildTimelineSnapshotArtifact,
  downloadTimelineSnapshotJson,
  downloadTimelineSnapshotMarkdown,
} from './timelineSnapshot';
import {
  buildTimelineRouteQuery,
  parseTimelineRouteQuery,
  type TimelineRouteQueryState,
} from './timelineRouteState';
import { buildTimelineViewModel } from './timelineViewModel';
import {
  TIMELINE_DETAIL_SECTION_KEYS,
  TIMELINE_DOSSIER_SECTION_KEYS,
} from './timelineViewUtils';
import {
  clearTimelineQuery,
  focusTimelineReference,
  setTimelineTrackFocus,
  toggleTimelineTrack,
} from './timelineQueryHelpers';
import { isTimelineQuerySaveable, saveTimelineSavedView } from './timelineSavedViews';
import { useTimelinePanelState } from './useTimelinePanelState';
import { useTimelineWorkspaceActions } from './useTimelineWorkspaceActions';
import { useExclusivePanelSections } from '../shared/useExclusivePanelSections';

interface TimelineViewControllerOptions {
  onOpenChat: (request: ChatOpenRequest) => void;
  onOpenArtifact: (artifact: Artifact) => void;
}

export function useTimelineViewController({
  onOpenChat,
  onOpenArtifact,
}: TimelineViewControllerOptions) {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    activeWorkspaceId,
    artifacts,
    chatActionsBySessionId,
    chatSessions,
    headlines,
    isLoading,
    addToast,
    ensureWorkspaceBoard,
    queueBoardPlacement,
    saveArtifact,
    setActiveWorkspaceId,
    workspaceItems,
    workspaceRuns,
    workspaces,
  } = useTimelineFeatureState();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const dossierSectionState = useExclusivePanelSections(TIMELINE_DOSSIER_SECTION_KEYS);
  const detailSectionState = useExclusivePanelSections(TIMELINE_DETAIL_SECTION_KEYS);
  const {
    exportMenuRef,
    filterMenuRef,
    leftPanelOpen,
    rightPanelOpen,
    setLeftPanelOpen,
    setRightPanelOpen,
    setShowExportMenu,
    setShowFilters,
    showExportMenu,
    showFilters,
  } = useTimelinePanelState();

  const timelineQuery = useMemo(() => parseTimelineRouteQuery(searchParams), [searchParams]);
  const { search, filters, focusedTrack, focusedRefId } = timelineQuery;

  const updateTimelineQuery = useCallback(
    (updater: (current: TimelineRouteQueryState) => TimelineRouteQueryState) => {
      setSearchParams(buildTimelineRouteQuery(updater(timelineQuery)), { replace: true });
    },
    [setSearchParams, timelineQuery]
  );

  const {
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
  } = useMemo(
    () =>
      buildTimelineViewModel({
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
      }),
    [
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
    ]
  );

  const setTrackFocus = useCallback(
    (track: TimelineTrack | 'ALL') => {
      updateTimelineQuery((current) => setTimelineTrackFocus(current, track));
    },
    [updateTimelineQuery]
  );

  const clearFilters = useCallback(() => {
    updateTimelineQuery(() => clearTimelineQuery());
  }, [updateTimelineQuery]);

  const canSaveCurrentView = useMemo(
    () => isTimelineQuerySaveable(timelineQuery),
    [timelineQuery]
  );

  const focusReference = useCallback(
    (track: TimelineTrack, refId?: string) => {
      updateTimelineQuery((current) => focusTimelineReference(current, track, refId));
    },
    [updateTimelineQuery]
  );

  const toggleTrackFilter = useCallback(
    (track: TimelineTrack) => {
      updateTimelineQuery((current) => toggleTimelineTrack(current, track));
    },
    [updateTimelineQuery]
  );

  const openArtifact = useCallback(
    (artifactId?: string) => {
      if (!artifactId) return;
      const artifact = artifacts.find((entry) => entry.id === artifactId);
      if (!artifact) return;
      onOpenArtifact(artifact);
    },
    [artifacts, onOpenArtifact]
  );

  const handleExportTimelineJson = useCallback(() => {
    if (!timelineSnapshot) return;
    downloadTimelineSnapshotJson(timelineSnapshot);
    setShowExportMenu(false);
    addToast('Timeline snapshot exported as JSON.', 'SUCCESS');
  }, [addToast, setShowExportMenu, timelineSnapshot]);

  const handleExportTimelineMarkdown = useCallback(() => {
    if (!timelineSnapshot) return;
    downloadTimelineSnapshotMarkdown(timelineSnapshot);
    setShowExportMenu(false);
    addToast('Timeline snapshot exported as Markdown.', 'SUCCESS');
  }, [addToast, setShowExportMenu, timelineSnapshot]);

  const handleSaveTimelineArtifact = useCallback(async () => {
    if (!timelineSnapshot) return;

    const saved = await saveArtifact(buildTimelineSnapshotArtifact(timelineSnapshot));
    setShowExportMenu(false);
    addToast(`Saved timeline snapshot to ${saved.topic}.`, 'SUCCESS');
  }, [addToast, saveArtifact, setShowExportMenu, timelineSnapshot]);

  const handleSaveTimelineView = useCallback(async () => {
    if (!activeWorkspace) return;
    if (!isTimelineQuerySaveable(timelineQuery)) return;

    const savedView = await saveTimelineSavedView({
      workspaceId: activeWorkspace.id,
      query: timelineQuery,
    });
    addToast(`Saved timeline view: ${savedView.title}.`, 'SUCCESS');
  }, [activeWorkspace, addToast, timelineQuery]);

  const { detailActions, openWorkspaceBoard, openWorkspaceChat, placeReferenceOnBoard } =
    useTimelineWorkspaceActions({
      activeWorkspaceId: activeWorkspace?.id,
      detailEvent: selectedEvent,
      ensureWorkspaceBoard,
      focusReference,
      labelArtifactLabel: labelProfile.artifactLabel,
      onOpenChat,
      onOpenArtifact: openArtifact,
      parentArtifactId: parentArtifact?.id,
      placeBoardItem: queueBoardPlacement,
      previousArtifactId,
      relatedSignal,
      selectedArtifact,
      selectedChatSessionId: selectedChatSession?.id,
      selectedEntityName,
      selectedRunId: selectedRun?.id,
      selectedWorkspaceItem,
    });

  return {
    activeWorkspace,
    allTimelineEvents,
    artifactItems,
    artifactTitleById,
    chatSessionItems,
    chatTitleById,
    clearFilters,
    detailActions,
    detailSections: detailSectionState.state,
    dossierSections: dossierSectionState.state,
    effectiveSelectedEventId,
    entityItems,
    exportMenuRef,
    filterMenuRef,
    filters,
    canSaveCurrentView,
    focusReference,
    focusedRefId,
    focusedTrack,
    groupedEvents,
    handleExportTimelineJson,
    handleExportTimelineMarkdown,
    handleSaveTimelineArtifact,
    handleSaveTimelineView,
    isLoading,
    labelProfile,
    leftPanelOpen,
    openArtifact,
    openWorkspaceBoard,
    openWorkspaceChat,
    parentArtifact,
    placeReferenceOnBoard,
    previousArtifactId,
    relatedSignal,
    rightPanelOpen,
    runItems,
    search,
    searchParams,
    selectedArtifact,
    selectedChatAction,
    selectedChatLaunchContext,
    selectedChatSession,
    selectedEntityName,
    selectedEvent,
    selectedEventId,
    selectedRun,
    selectedWorkspaceItem,
    setLeftPanelOpen,
    setRightPanelOpen,
    setSelectedEventId,
    setShowExportMenu,
    setShowFilters,
    setTrackFocus,
    setActiveWorkspaceId,
    showExportMenu,
    showFilters,
    signalItems,
    signalTitleById,
    timelineSnapshot,
    toggleDetailSection: detailSectionState.toggleSection,
    toggleDossierSection: dossierSectionState.toggleSection,
    toggleTrackFilter,
    updateTimelineQuery,
    visibleEvents,
    workspaces,
  };
}
