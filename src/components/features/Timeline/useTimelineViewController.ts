import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  FileText,
  Fingerprint,
  MessageSquare,
  Radio,
  Save,
  Workflow,
} from 'lucide-react';

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

import { buildTimelineSnapshotArtifact, downloadTimelineSnapshotJson, downloadTimelineSnapshotMarkdown } from './timelineSnapshot';
import { buildTimelineRouteQuery, parseTimelineRouteQuery, type TimelineRouteQueryState } from './timelineRouteState';
import { buildTimelineViewModel } from './timelineViewModel';
import { DEFAULT_FILTERS, getMetadataValue, getPrimaryRefId, type DetailSections, type DossierSections } from './timelineViewUtils';

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
    workspaceRuns,
    workspaces,
  } = useTimelineFeatureState();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [dossierSections, setDossierSections] = useState<DossierSections>({
    events: true,
    runs: false,
    artifacts: false,
    signals: false,
    entities: false,
    chats: false,
  });
  const [detailSections, setDetailSections] = useState<DetailSections>({
    summary: true,
    context: true,
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
      workspaceRuns,
      workspaces,
    ]
  );

  const ensureTrackVisible = useCallback(
    (track: TimelineTrack) => {
      updateTimelineQuery((current) =>
        current.filters.tracks.includes(track)
          ? current
          : {
              ...current,
              filters: {
                ...current.filters,
                tracks: [...current.filters.tracks, track],
              },
            }
      );
    },
    [updateTimelineQuery]
  );

  const setTrackFocus = useCallback(
    (track: TimelineTrack | 'ALL') => {
      if (track !== 'ALL') ensureTrackVisible(track);
      updateTimelineQuery((current) => ({
        ...current,
        focusedTrack: track,
        focusedRefId: undefined,
      }));
    },
    [ensureTrackVisible, updateTimelineQuery]
  );

  const clearFilters = useCallback(() => {
    updateTimelineQuery(() => ({
      search: '',
      filters: DEFAULT_FILTERS,
      focusedTrack: 'ALL',
      focusedRefId: undefined,
    }));
  }, [updateTimelineQuery]);

  const focusReference = useCallback(
    (track: TimelineTrack, refId?: string) => {
      if (!refId) return;
      ensureTrackVisible(track);
      updateTimelineQuery((current) => ({
        ...current,
        focusedTrack: track,
        focusedRefId: refId,
      }));
    },
    [ensureTrackVisible, updateTimelineQuery]
  );

  const toggleTrackFilter = useCallback(
    (track: TimelineTrack) => {
      updateTimelineQuery((current) => {
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
      });
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

  const detailActions: InspectorActionItem[] = useMemo(() => {
    if (!selectedEvent) return [];

    const actions: InspectorActionItem[] = [
      {
        id: 'timeline-chat',
        label: selectedChatSession ? 'Open Chat Session' : 'Open Workspace Chat',
        icon: MessageSquare,
        onClick: () => openWorkspaceChat(selectedEvent),
      },
      {
        id: 'timeline-board-open',
        label: 'Open Board',
        icon: Workflow,
        onClick: () => void openWorkspaceBoard(),
      },
    ];

    if (selectedArtifact?.id || relatedSignal || selectedEntityName) {
      actions.push({
        id: 'timeline-board-place',
        label: 'Place On Board',
        icon: Save,
        onClick: () => void placeReferenceOnBoard(),
      });
    }

    if (selectedArtifact?.id) {
      actions.push({
        id: 'timeline-report',
        label: `Open ${labelProfile.artifactLabel}`,
        icon: FileText,
        onClick: () => openArtifact(selectedArtifact.id),
      });
    }

    if (selectedRun) {
      actions.push({
        id: 'timeline-run',
        label: 'Focus Source Run',
        icon: Activity,
        onClick: () => focusReference('RUN', selectedRun.id),
      });
    }

    if (relatedSignal) {
      actions.push({
        id: 'timeline-signal',
        label: 'Focus Origin Signal',
        icon: Radio,
        onClick: () => focusReference('SIGNAL', relatedSignal.id),
      });
    }

    if (selectedEntityName && selectedEvent.refKind !== 'ENTITY') {
      actions.push({
        id: 'timeline-entity',
        label: 'Focus Entity Milestones',
        icon: Fingerprint,
        onClick: () => focusReference('ENTITY', selectedEntityName),
      });
    }

    if (selectedChatSession && selectedEvent.refKind !== 'CHAT_SESSION') {
      actions.push({
        id: 'timeline-chat-focus',
        label: 'Focus Chat Session',
        icon: MessageSquare,
        onClick: () => focusReference('CHAT', selectedChatSession.id),
      });
    }

    if (parentArtifact?.id) {
      actions.push({
        id: 'timeline-parent',
        label: `Focus Parent ${labelProfile.artifactLabel}`,
        icon: FileText,
        onClick: () => focusReference('ARTIFACT', parentArtifact.id),
      });
    }

    if (previousArtifactId) {
      actions.push({
        id: 'timeline-previous',
        label: `Focus Previous ${labelProfile.artifactLabel}`,
        icon: FileText,
        onClick: () => focusReference('ARTIFACT', previousArtifactId),
      });
    }

    return actions.slice(0, 6);
  }, [
    focusReference,
    labelProfile.artifactLabel,
    openArtifact,
    openWorkspaceBoard,
    openWorkspaceChat,
    parentArtifact,
    placeReferenceOnBoard,
    previousArtifactId,
    relatedSignal,
    selectedArtifact,
    selectedChatSession,
    selectedEntityName,
    selectedEvent,
    selectedRun,
  ]);

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
    focusReference,
    focusedRefId,
    focusedTrack,
    groupedEvents,
    handleExportTimelineJson,
    handleExportTimelineMarkdown,
    handleSaveTimelineArtifact,
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
