import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type {
  Artifact,
  ChatOpenRequest,
  TimelineEvent,
  TimelineTrack,
} from '@/types';
import { useTimelineFeatureState } from '@/store/selectors/featureSelectors';
import {
  buildWorkspaceBoardDocumentPath,
} from '@/app/routes';
import {
  buildWorkspaceArtifactReference,
  buildWorkspaceEntityReference,
  buildWorkspaceHeadlineReference,
} from '@/services/workspace/library';
import type { InspectorActionItem } from '@/components/ui/InspectorActionRow';

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
import { getMetadataValue, getPrimaryRefId, type DetailSections, type DossierSections } from './timelineViewUtils';
import {
  clearTimelineQuery,
  focusTimelineReference,
  setTimelineTrackFocus,
  toggleTimelineTrack,
} from './timelineQueryHelpers';
import { buildTimelineDetailActions } from './timelineDetailActions';
import { isTimelineQuerySaveable, saveTimelineSavedView } from './timelineSavedViews';

interface TimelineViewControllerOptions {
  onOpenChat: (request: ChatOpenRequest) => void;
  onOpenReport: (report: Artifact) => void;
}

export function useTimelineViewController({
  onOpenChat,
  onOpenReport,
}: TimelineViewControllerOptions) {
  const navigate = useNavigate();
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
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [dossierSections, setDossierSections] = useState<DossierSections>({
    events: false,
    runs: false,
    artifacts: false,
    signals: false,
    entities: false,
    chats: false,
  });
  const [detailSections, setDetailSections] = useState<DetailSections>({
    summary: false,
    context: false,
  });
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  const timelineQuery = useMemo(() => parseTimelineRouteQuery(searchParams), [searchParams]);
  const { search, filters, focusedTrack, focusedRefId } = timelineQuery;

  const updateTimelineQuery = useCallback(
    (updater: (current: TimelineRouteQueryState) => TimelineRouteQueryState) => {
      setSearchParams(buildTimelineRouteQuery(updater(timelineQuery)), { replace: true });
    },
    [setSearchParams, timelineQuery]
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setLeftPanelOpen(false);
        setRightPanelOpen(false);
      } else {
        setLeftPanelOpen(true);
        setRightPanelOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

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
      onOpenReport(artifact);
    },
    [artifacts, onOpenReport]
  );

  const handleExportTimelineJson = useCallback(() => {
    if (!timelineSnapshot) return;
    downloadTimelineSnapshotJson(timelineSnapshot);
    setShowExportMenu(false);
    addToast('Timeline snapshot exported as JSON.', 'SUCCESS');
  }, [addToast, timelineSnapshot]);

  const handleExportTimelineMarkdown = useCallback(() => {
    if (!timelineSnapshot) return;
    downloadTimelineSnapshotMarkdown(timelineSnapshot);
    setShowExportMenu(false);
    addToast('Timeline snapshot exported as Markdown.', 'SUCCESS');
  }, [addToast, timelineSnapshot]);

  const handleSaveTimelineArtifact = useCallback(async () => {
    if (!timelineSnapshot) return;

    const saved = await saveArtifact(buildTimelineSnapshotArtifact(timelineSnapshot));
    setShowExportMenu(false);
    addToast(`Saved timeline snapshot to ${saved.topic}.`, 'SUCCESS');
  }, [addToast, saveArtifact, timelineSnapshot]);

  const handleSaveTimelineView = useCallback(async () => {
    if (!activeWorkspace) return;
    if (!isTimelineQuerySaveable(timelineQuery)) return;

    const savedView = await saveTimelineSavedView({
      workspaceId: activeWorkspace.id,
      query: timelineQuery,
    });
    addToast(`Saved timeline view: ${savedView.title}.`, 'SUCCESS');
  }, [activeWorkspace, addToast, timelineQuery]);

  const openWorkspaceChat = useCallback(
    (event?: TimelineEvent | null) => {
      if (!activeWorkspace) return;

      const sessionId =
        getPrimaryRefId(event || null, 'CHAT_SESSION') ||
        getMetadataValue<string>(event || null, 'sessionId');
      if (sessionId) {
        onOpenChat({
          workspaceId: activeWorkspace.id,
          sessionId,
        });
        return;
      }

      if (getPrimaryRefId(event || null, 'ARTIFACT')) {
        onOpenChat({
          workspaceId: activeWorkspace.id,
          launchContext: { sourceReportId: getPrimaryRefId(event || null, 'ARTIFACT') },
        });
        return;
      }

      if (getPrimaryRefId(event || null, 'SIGNAL')) {
        onOpenChat({
          workspaceId: activeWorkspace.id,
          launchContext: {
            signalId: getPrimaryRefId(event || null, 'SIGNAL'),
            headlineId: getPrimaryRefId(event || null, 'SIGNAL'),
          },
        });
        return;
      }

      const entityName =
        getPrimaryRefId(event || null, 'ENTITY') ||
        getMetadataValue<string>(event || null, 'entityName');
      if (entityName) {
        onOpenChat({
          workspaceId: activeWorkspace.id,
          launchContext: {
            entityName,
            sourceReportId: getMetadataValue<string>(event || null, 'relatedArtifactId'),
          },
        });
        return;
      }

      onOpenChat({ workspaceId: activeWorkspace.id });
    },
    [activeWorkspace, onOpenChat]
  );

  const openWorkspaceBoard = useCallback(async () => {
    if (!activeWorkspace) return;
    const board = await ensureWorkspaceBoard(activeWorkspace.id);
    navigate(buildWorkspaceBoardDocumentPath(activeWorkspace.id, board.id));
  }, [activeWorkspace, ensureWorkspaceBoard, navigate]);

  const placeReferenceOnBoard = useCallback(async () => {
    if (!activeWorkspace) return;

    let reference = null;

    if (selectedArtifact?.id) {
      reference = buildWorkspaceArtifactReference(activeWorkspace.id, {
        ...selectedArtifact,
        id: selectedArtifact.id,
      });
    } else if (relatedSignal) {
      reference = buildWorkspaceHeadlineReference(activeWorkspace.id, relatedSignal);
    } else if (selectedEntityName) {
      reference = buildWorkspaceEntityReference(activeWorkspace.id, {
        name: selectedEntityName,
        type: 'UNKNOWN',
      });
    }

    if (!reference) return;

    const board = await ensureWorkspaceBoard(activeWorkspace.id);
    queueBoardPlacement({
      workspaceId: activeWorkspace.id,
      boardId: board.id,
      item: reference,
      openInBoard: true,
    });
    navigate(buildWorkspaceBoardDocumentPath(activeWorkspace.id, board.id));
  }, [
    activeWorkspace,
    ensureWorkspaceBoard,
    navigate,
    queueBoardPlacement,
    relatedSignal,
    selectedArtifact,
    selectedEntityName,
  ]);

  const detailActions: InspectorActionItem[] = useMemo(
    () =>
      buildTimelineDetailActions({
        focusReference,
        labelArtifactLabel: labelProfile.artifactLabel,
        onOpenArtifact: openArtifact,
        onOpenWorkspaceBoard: openWorkspaceBoard,
        onOpenWorkspaceChat: openWorkspaceChat,
        onPlaceReferenceOnBoard: placeReferenceOnBoard,
        parentArtifactId: parentArtifact?.id,
        previousArtifactId,
        relatedSignalId: relatedSignal?.id,
        selectedArtifact,
        selectedChatSessionId: selectedChatSession?.id,
        selectedEntityName,
        selectedEvent,
        selectedRunId: selectedRun?.id,
      }),
    [
      focusReference,
      labelProfile.artifactLabel,
      openArtifact,
      openWorkspaceBoard,
      openWorkspaceChat,
      parentArtifact?.id,
      placeReferenceOnBoard,
      previousArtifactId,
      relatedSignal?.id,
      selectedArtifact,
      selectedChatSession?.id,
      selectedEntityName,
      selectedEvent,
      selectedRun?.id,
    ]
  );

  return {
    activeWorkspace,
    allTimelineEvents,
    artifactItems,
    artifactTitleById,
    chatSessionItems,
    chatTitleById,
    clearFilters,
    detailActions,
    detailSections,
    dossierSections,
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
    setDetailSections,
    setDossierSections,
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
    toggleTrackFilter,
    updateTimelineQuery,
    visibleEvents,
    workspaces,
  };
}
