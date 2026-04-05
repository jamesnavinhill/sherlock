import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ChevronDown,
  Clock3,
  Download,
  FileJson,
  FileText,
  Filter,
  Fingerprint,
  FolderOpen,
  MessageSquare,
  Radio,
  Save,
  Search,
  Workflow,
} from 'lucide-react';
import type {
  Artifact,
  ChatOpenRequest,
  TimelineEvent,
  TimelineFilters,
  TimelineRange,
  TimelineTrack,
} from '../../types';
import { AppView } from '../../types';
import { useWorkspaceStore } from '../../store/caseStore';
import { BackgroundMatrixRain } from '../ui/BackgroundMatrixRain';
import { Accordion } from '../ui/Accordion';
import { EmptyState } from '../ui/EmptyState';
import { InspectorActionRow, type InspectorActionItem } from '../ui/InspectorActionRow';
import { OsintSelect } from '../ui/OsintSelect';
import { getLabelProfileById, sanitizeDisplayTitle } from '../../domain';
import { getChatLaunchContextFromSession } from '../../services/chat/launchContext';
import {
  buildWorkspaceArtifactReference,
  buildWorkspaceEntityReference,
  buildWorkspaceHeadlineReference,
} from '../../services/workspace/library';
import {
  buildWorkspaceTimelineEvents,
  filterTimelineEvents,
  getTrackCount,
  groupTimelineEventsByDay,
} from './Timeline/timelineEvents';
import {
  buildTimelineSnapshot,
  buildTimelineSnapshotArtifact,
  downloadTimelineSnapshotJson,
  downloadTimelineSnapshotMarkdown,
} from './Timeline/timelineSnapshot';

interface TimelineViewProps {
  onOpenReport: (report: Artifact) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
}

type DossierSections = {
  events: boolean;
  runs: boolean;
  artifacts: boolean;
  signals: boolean;
  entities: boolean;
  chats: boolean;
};

type DetailSections = {
  summary: boolean;
  context: boolean;
};

const DEFAULT_FILTERS: TimelineFilters = {
  range: 'ALL',
  tracks: ['SIGNAL', 'RUN', 'ARTIFACT'],
};

const TRACK_OPTIONS: Array<{ track: TimelineTrack; label: string; icon: typeof Radio }> = [
  { track: 'SIGNAL', label: 'Signals', icon: Radio },
  { track: 'RUN', label: 'Runs', icon: Activity },
  { track: 'ARTIFACT', label: 'Artifacts', icon: FileText },
  { track: 'ENTITY', label: 'Entities', icon: Fingerprint },
  { track: 'CHAT', label: 'Chats', icon: MessageSquare },
];

const formatEventTime = (value: number) =>
  value > 0
    ? new Date(value).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Time N/A';

const getEventIcon = (event: TimelineEvent) => {
  switch (event.track) {
    case 'SIGNAL':
      return Radio;
    case 'RUN':
      return Activity;
    case 'ARTIFACT':
      return FileText;
    case 'ENTITY':
      return Fingerprint;
    case 'CHAT':
      return MessageSquare;
    default:
      return Clock3;
  }
};

const getEventTone = (event: TimelineEvent) => {
  switch (event.type) {
    case 'RUN_FAILED':
      return 'border-osint-danger/40 bg-osint-danger/10 text-osint-danger';
    case 'RUN_COMPLETED':
      return 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary';
    case 'CHAT_ARTIFACT_SAVED':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
    case 'CHAT_FOLLOW_UP_LAUNCHED':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
    case 'ENTITY_FIRST_SEEN':
      return 'border-violet-500/40 bg-violet-500/10 text-violet-200';
    case 'ENTITY_MENTION_THRESHOLD':
      return 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-200';
    case 'ENTITY_REAPPEARED':
      return 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200';
    case 'CHAT_SESSION_STARTED':
    case 'CHAT_SEARCHED_WORKSPACE':
    case 'CHAT_ARTIFACT_NOTED':
      return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300';
    default:
      return 'border-zinc-700 bg-zinc-900 text-zinc-300';
  }
};

const getFocusedButtonClass = (isActive: boolean) =>
  `w-full text-left px-3 py-2 text-xs font-mono transition-colors ${
    isActive
      ? 'bg-zinc-800 text-white border border-osint-primary/40'
      : 'text-zinc-400 border border-transparent hover:border-zinc-700 hover:bg-zinc-900 hover:text-white'
  }`;

const toUniqueItems = (events: TimelineEvent[], track: TimelineTrack) => {
  const unique = new Map<string, TimelineEvent>();

  events.forEach((event) => {
    if (event.track !== track || !event.refId) return;
    if (!unique.has(event.refId)) {
      unique.set(event.refId, event);
    }
  });

  return Array.from(unique.values());
};

const getMetadataValue = <T,>(event: TimelineEvent | null, key: string): T | undefined => {
  if (!event?.metadata) return undefined;
  const value = event.metadata[key];
  return value as T | undefined;
};

const getPrimaryRefId = (event: TimelineEvent | null, refKind: TimelineEvent['refKind']) => {
  if (!event || event.refKind !== refKind) return undefined;
  return event.refId;
};

const buildTimelineSearchPlaceholder = (artifactLabelPlural: string) =>
  `Search ${artifactLabelPlural.toLowerCase()}, runs, signals, entities, chats...`;

export const TimelineView: React.FC<TimelineViewProps> = ({ onOpenReport, onOpenChat }) => {
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
    setCurrentView,
    workspaceRuns,
    workspaces,
  } = useWorkspaceStore();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<TimelineFilters>(DEFAULT_FILTERS);
  const [focusedTrack, setFocusedTrack] = useState<TimelineTrack | 'ALL'>('ALL');
  const [focusedRefId, setFocusedRefId] = useState<string | undefined>();
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

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null,
    [activeWorkspaceId, workspaces]
  );

  const labelProfile = useMemo(
    () =>
      getLabelProfileById(
        activeWorkspace?.labelProfileId ||
          artifacts.find((artifact) => artifact.caseId === activeWorkspace?.id)?.labelProfileId
      ),
    [activeWorkspace?.id, activeWorkspace?.labelProfileId, artifacts]
  );

  const allTimelineEvents = useMemo(() => {
    if (!activeWorkspace) return [];

    return buildWorkspaceTimelineEvents({
      workspaceId: activeWorkspace.id,
      artifacts,
      runs: workspaceRuns,
      signals: headlines,
      chatSessions,
      chatActionsBySessionId,
    });
  }, [activeWorkspace, artifacts, chatActionsBySessionId, chatSessions, headlines, workspaceRuns]);

  const visibleEvents = useMemo(
    () =>
      filterTimelineEvents(allTimelineEvents, {
        workspaceId: activeWorkspace?.id,
        search,
        filters,
        focusedTrack,
        focusedRefId,
      }),
    [activeWorkspace?.id, allTimelineEvents, filters, focusedRefId, focusedTrack, search]
  );

  const groupedEvents = useMemo(() => groupTimelineEventsByDay(visibleEvents), [visibleEvents]);
  const runItems = useMemo(() => toUniqueItems(allTimelineEvents, 'RUN'), [allTimelineEvents]);
  const artifactItems = useMemo(
    () => toUniqueItems(allTimelineEvents, 'ARTIFACT'),
    [allTimelineEvents]
  );
  const signalItems = useMemo(
    () => toUniqueItems(allTimelineEvents, 'SIGNAL'),
    [allTimelineEvents]
  );
  const entityItems = useMemo(
    () => toUniqueItems(allTimelineEvents, 'ENTITY'),
    [allTimelineEvents]
  );
  const chatSessionItems = useMemo(
    () => allTimelineEvents.filter((event) => event.type === 'CHAT_SESSION_STARTED'),
    [allTimelineEvents]
  );
  const artifactTitleById = useMemo(
    () =>
      new Map(
        artifacts
          .filter((artifact): artifact is Artifact & { id: string } => !!artifact.id)
          .map((artifact) => [artifact.id, sanitizeDisplayTitle(artifact.topic)])
      ),
    [artifacts]
  );
  const signalTitleById = useMemo(
    () => new Map(headlines.map((headline) => [headline.id, headline.source || headline.type])),
    [headlines]
  );
  const chatTitleById = useMemo(
    () => new Map(chatSessions.map((session) => [session.id, session.title || 'Workspace Chat'])),
    [chatSessions]
  );
  const effectiveSelectedEventId = useMemo(
    () =>
      selectedEventId && visibleEvents.some((event) => event.id === selectedEventId)
        ? selectedEventId
        : null,
    [selectedEventId, visibleEvents]
  );
  const selectedEvent = useMemo(
    () => visibleEvents.find((event) => event.id === effectiveSelectedEventId) || null,
    [effectiveSelectedEventId, visibleEvents]
  );
  const selectedArtifact = useMemo(() => {
    if (!selectedEvent) return null;

    const artifactId =
      getPrimaryRefId(selectedEvent, 'ARTIFACT') ||
      getMetadataValue<string>(selectedEvent, 'relatedArtifactId') ||
      getMetadataValue<string>(selectedEvent, 'linkedArtifactId');

    return artifacts.find((artifact) => artifact.id === artifactId) || null;
  }, [artifacts, selectedEvent]);
  const selectedRun = useMemo(() => {
    if (!selectedEvent) return null;

    const runId =
      getPrimaryRefId(selectedEvent, 'RUN') ||
      getMetadataValue<string>(selectedEvent, 'sourceRunId');
    return workspaceRuns.find((workspaceRun) => workspaceRun.id === runId) || null;
  }, [selectedEvent, workspaceRuns]);
  const relatedSignal = useMemo(() => {
    if (!selectedEvent) return null;

    const signalId =
      getPrimaryRefId(selectedEvent, 'SIGNAL') ||
      getMetadataValue<string>(selectedEvent, 'sourceSignalId');
    return headlines.find((headline) => headline.id === signalId) || null;
  }, [headlines, selectedEvent]);
  const parentArtifact = useMemo(() => {
    const parentArtifactId =
      getMetadataValue<string>(selectedEvent, 'parentArtifactId') || selectedEvent?.parentRefId;
    return artifacts.find((artifact) => artifact.id === parentArtifactId) || null;
  }, [artifacts, selectedEvent]);
  const selectedChatSession = useMemo(() => {
    if (!selectedEvent) return null;

    const sessionId =
      getPrimaryRefId(selectedEvent, 'CHAT_SESSION') ||
      getMetadataValue<string>(selectedEvent, 'sessionId');
    return chatSessions.find((session) => session.id === sessionId) || null;
  }, [chatSessions, selectedEvent]);
  const selectedChatAction = useMemo(() => {
    const actionId = getPrimaryRefId(selectedEvent, 'CHAT_ACTION');
    if (!actionId) return null;

    return (
      Object.values(chatActionsBySessionId)
        .flat()
        .find((action) => action.id === actionId) || null
    );
  }, [chatActionsBySessionId, selectedEvent]);
  const selectedChatLaunchContext = useMemo(
    () => getChatLaunchContextFromSession(selectedChatSession),
    [selectedChatSession]
  );
  const selectedEntityName = useMemo(
    () =>
      getPrimaryRefId(selectedEvent, 'ENTITY') ||
      getMetadataValue<string>(selectedEvent, 'entityName') ||
      null,
    [selectedEvent]
  );
  const previousArtifactId = useMemo(
    () => getMetadataValue<string>(selectedEvent, 'previousArtifactId'),
    [selectedEvent]
  );

  const timelineSnapshot = useMemo(() => {
    if (!activeWorkspace) return null;

    return buildTimelineSnapshot({
      workspace: activeWorkspace,
      events: visibleEvents,
      filters,
      search,
      focusedTrack,
      focusedRefId,
    });
  }, [activeWorkspace, filters, focusedRefId, focusedTrack, search, visibleEvents]);

  const ensureTrackVisible = (track: TimelineTrack) => {
    setFilters((current) =>
      current.tracks.includes(track)
        ? current
        : {
            ...current,
            tracks: [...current.tracks, track],
          }
    );
  };

  const setTrackFocus = (track: TimelineTrack | 'ALL') => {
    if (track !== 'ALL') ensureTrackVisible(track);
    setFocusedTrack(track);
    setFocusedRefId(undefined);
  };

  const clearFilters = () => {
    setSearch('');
    setFilters(DEFAULT_FILTERS);
    setFocusedTrack('ALL');
    setFocusedRefId(undefined);
  };

  const focusReference = (track: TimelineTrack, refId?: string) => {
    if (!refId) return;
    ensureTrackVisible(track);
    setFocusedTrack(track);
    setFocusedRefId(refId);
  };

  const toggleTrackFilter = (track: TimelineTrack) => {
    setFilters((current) => {
      const nextTracks = current.tracks.includes(track)
        ? current.tracks.filter((item) => item !== track)
        : [...current.tracks, track];

      return {
        ...current,
        tracks: nextTracks,
      };
    });
  };

  const openArtifact = (artifactId?: string) => {
    if (!artifactId) return;
    const artifact = artifacts.find((entry) => entry.id === artifactId);
    if (!artifact) return;
    onOpenReport(artifact);
  };

  const handleExportTimelineJson = () => {
    if (!timelineSnapshot) return;
    downloadTimelineSnapshotJson(timelineSnapshot);
    setShowExportMenu(false);
    addToast('Timeline snapshot exported as JSON.', 'SUCCESS');
  };

  const handleExportTimelineMarkdown = () => {
    if (!timelineSnapshot) return;
    downloadTimelineSnapshotMarkdown(timelineSnapshot);
    setShowExportMenu(false);
    addToast('Timeline snapshot exported as Markdown.', 'SUCCESS');
  };

  const handleSaveTimelineArtifact = async () => {
    if (!timelineSnapshot) return;

    const saved = await saveArtifact(buildTimelineSnapshotArtifact(timelineSnapshot));
    setShowExportMenu(false);
    addToast(`Saved timeline snapshot to ${saved.topic}.`, 'SUCCESS');
  };

  const openWorkspaceChat = (event?: TimelineEvent | null) => {
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
        launchContext: { headlineId: getPrimaryRefId(event || null, 'SIGNAL') },
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
  };

  const openWorkspaceBoard = async () => {
    if (!activeWorkspace) return;
    await ensureWorkspaceBoard(activeWorkspace.id);
    setCurrentView(AppView.WORKSPACE);
  };

  const placeReferenceOnBoard = async () => {
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
    setCurrentView(AppView.WORKSPACE);
  };

  const detailActions: InspectorActionItem[] = (() => {
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
        icon: FolderOpen,
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
  })();

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black">
        <EmptyState
          icon={Clock3}
          title="Loading Timeline"
          description="Sherlock is assembling saved workspace chronology from artifacts, runs, signals, and chat activity."
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-black text-zinc-100">
      <BackgroundMatrixRain />

      <header className="sticky top-0 z-30 h-20 border-b border-zinc-800 bg-black/95 px-6 backdrop-blur-md shadow-lg">
        <div className="flex h-full min-w-0 items-center gap-3">
          <button
            onClick={() => setLeftPanelOpen((current) => !current)}
            className={`flex shrink-0 items-center gap-2 border px-3 py-1.5 text-xs font-mono uppercase transition ${
              leftPanelOpen
                ? 'border-white bg-zinc-800 text-white'
                : 'border-zinc-700 bg-black text-zinc-400 hover:border-zinc-500 hover:text-white'
            }`}
            title="Toggle timeline dossier"
          >
            <Workflow className="h-4 w-4" />
            <span className="hidden lg:inline">Dossier</span>
          </button>

          <div className="w-full max-w-[320px] min-w-[220px] shrink-0">
            <OsintSelect
              ariaLabel={`${labelProfile.workspaceLabel} timeline workspace`}
              value={activeWorkspace?.id || ''}
              onChange={(value) => setActiveWorkspaceId(value || null)}
              placeholder={`Select ${labelProfile.workspaceLabel.toLowerCase()}`}
              triggerClassName="py-1.5 pl-3 pr-8 text-xs font-mono"
              options={workspaces.map((workspace) => ({
                value: workspace.id,
                label: sanitizeDisplayTitle(workspace.title),
              }))}
            />
          </div>

          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={buildTimelineSearchPlaceholder(labelProfile.artifactLabelPlural)}
              className="w-full border border-zinc-700 bg-black py-1.5 pl-9 pr-3 text-xs font-mono text-zinc-300 outline-none transition hover:border-osint-primary focus:border-osint-primary"
            />
          </div>

          <div className="relative shrink-0" ref={exportMenuRef}>
            <button
              onClick={() => {
                setShowExportMenu((current) => !current);
                setShowFilters(false);
              }}
              disabled={!timelineSnapshot}
              className="flex items-center px-3 py-1.5 bg-black border border-zinc-700 text-zinc-400 font-mono text-xs font-bold uppercase hover:border-zinc-500 hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              title="Export or save the current timeline snapshot"
            >
              <Download className="w-4 h-4 mr-1" />
              <span className="hidden lg:inline">Export</span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            {showExportMenu && timelineSnapshot && (
              <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 shadow-xl z-50 min-w-[220px]">
                <button
                  onClick={handleExportTimelineMarkdown}
                  className="w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center border-b border-zinc-800"
                  title="Export the visible timeline snapshot as Markdown"
                >
                  <FileText className="w-4 h-4 mr-3 text-zinc-500" />
                  <div>
                    <div className="font-bold">Timeline Markdown</div>
                    <div className="text-[10px] text-zinc-500">
                      Readable visible timeline export
                    </div>
                  </div>
                </button>
                <button
                  onClick={handleExportTimelineJson}
                  className="w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center border-b border-zinc-800"
                  title="Export the visible timeline snapshot as JSON"
                >
                  <FileJson className="w-4 h-4 mr-3 text-zinc-500" />
                  <div>
                    <div className="font-bold">Timeline JSON</div>
                    <div className="text-[10px] text-zinc-500">
                      Raw visible timeline data for backup
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => void handleSaveTimelineArtifact()}
                  className="w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center"
                  title="Save the current timeline snapshot as a TIMELINE artifact"
                >
                  <Save className="w-4 h-4 mr-3 text-zinc-500" />
                  <div>
                    <div className="font-bold">Save Snapshot</div>
                    <div className="text-[10px] text-zinc-500">Store this view in the dossier</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="relative shrink-0" ref={filterMenuRef}>
            <button
              onClick={() => {
                setShowFilters((current) => !current);
                setShowExportMenu(false);
              }}
              className={`flex items-center gap-2 border px-3 py-1.5 text-xs font-mono uppercase transition ${
                showFilters
                  ? 'border-white bg-zinc-800 text-white'
                  : 'border-zinc-700 bg-black text-zinc-400 hover:border-zinc-500 hover:text-white'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden lg:inline">Filters</span>
            </button>

            {showFilters && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] border border-zinc-700 bg-osint-panel shadow-2xl">
                <div className="border-b border-zinc-800 bg-black px-4 py-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white">
                    Timeline Filters
                  </h3>
                </div>
                <div className="space-y-5 p-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-mono uppercase text-zinc-500">
                      Date Range
                    </label>
                    <OsintSelect
                      ariaLabel="Timeline date range"
                      value={filters.range}
                      onChange={(value) =>
                        setFilters((current) => ({
                          ...current,
                          range: value as TimelineRange,
                        }))
                      }
                      triggerClassName="px-3 py-2 pr-8 text-xs font-mono"
                      options={[
                        { value: 'ALL', label: 'All Activity' },
                        { value: '7D', label: 'Last 7 Days' },
                        { value: '30D', label: 'Last 30 Days' },
                        { value: '90D', label: 'Last 90 Days' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-mono uppercase text-zinc-500">
                      Visible Tracks
                    </label>
                    <div className="space-y-2">
                      {TRACK_OPTIONS.map((option) => (
                        <label
                          key={option.track}
                          className="flex items-center justify-between border border-zinc-800 bg-black px-3 py-2 text-xs font-mono text-zinc-300"
                        >
                          <span className="flex items-center gap-2">
                            <option.icon className="h-4 w-4 text-zinc-500" />
                            {option.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={filters.tracks.includes(option.track)}
                            onChange={() => toggleTrackFilter(option.track)}
                            className="h-4 w-4 accent-[var(--osint-primary)]"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                    <button
                      onClick={clearFilters}
                      className="text-xs font-mono uppercase text-zinc-500 hover:text-white"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="osint-button-primary px-4 py-1.5 text-xs font-mono font-bold uppercase"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setRightPanelOpen((current) => !current)}
            className={`flex shrink-0 items-center gap-2 border px-3 py-1.5 text-xs font-mono uppercase transition ${
              rightPanelOpen
                ? 'border-white bg-zinc-800 text-white'
                : 'border-zinc-700 bg-black text-zinc-400 hover:border-zinc-500 hover:text-white'
            }`}
            title="Toggle event details"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden lg:inline">Details</span>
          </button>
        </div>
      </header>

      {(leftPanelOpen || rightPanelOpen) && (
        <div
          className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => {
            setLeftPanelOpen(false);
            setRightPanelOpen(false);
          }}
        />
      )}

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={`absolute left-0 top-0 z-30 h-full overflow-hidden bg-black/95 transition-all duration-200 lg:relative lg:translate-x-0 ${
            leftPanelOpen
              ? 'w-[min(20rem,calc(100vw-1rem))] translate-x-0 border-r border-zinc-800'
              : 'w-[min(20rem,calc(100vw-1rem))] -translate-x-full border-r border-zinc-800 lg:w-0 lg:border-r-0'
          }`}
        >
          <div className="border-b border-zinc-800 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
              Timeline Dossier
            </div>
            <div className="mt-1 text-sm font-bold uppercase tracking-widest text-white">
              {activeWorkspace ? sanitizeDisplayTitle(activeWorkspace.title) : 'Workspace'}
            </div>
          </div>

          <div className="h-[calc(100%-72px)] overflow-y-auto p-3 custom-scrollbar">
            <Accordion
              title="Events"
              icon={Clock3}
              count={allTimelineEvents.length}
              isOpen={dossierSections.events}
              onToggle={() =>
                setDossierSections((current) => ({ ...current, events: !current.events }))
              }
            >
              <div className="space-y-2">
                <button
                  onClick={() => setTrackFocus('ALL')}
                  className={getFocusedButtonClass(focusedTrack === 'ALL' && !focusedRefId)}
                >
                  All Activity
                </button>
                {TRACK_OPTIONS.map((option) => (
                  <button
                    key={option.track}
                    onClick={() => setTrackFocus(option.track)}
                    className={getFocusedButtonClass(
                      focusedTrack === option.track && !focusedRefId
                    )}
                  >
                    {option.label} ({getTrackCount(allTimelineEvents, option.track)})
                  </button>
                ))}
              </div>
            </Accordion>

            <Accordion
              title="Runs"
              icon={Activity}
              count={runItems.length}
              isOpen={dossierSections.runs}
              onToggle={() =>
                setDossierSections((current) => ({ ...current, runs: !current.runs }))
              }
            >
              <div className="space-y-2">
                {runItems.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
                    No workspace runs available yet.
                  </div>
                ) : (
                  runItems.map((item) => (
                    <button
                      key={item.refId}
                      onClick={() => {
                        setFocusedTrack('RUN');
                        setFocusedRefId(item.refId);
                      }}
                      className={getFocusedButtonClass(focusedRefId === item.refId)}
                    >
                      <div className="truncate font-bold text-zinc-200">{item.title}</div>
                      <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                        {item.badges?.[0] || 'RUN'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Accordion>

            <Accordion
              title={labelProfile.artifactLabelPlural}
              icon={FileText}
              count={artifactItems.length}
              isOpen={dossierSections.artifacts}
              onToggle={() =>
                setDossierSections((current) => ({ ...current, artifacts: !current.artifacts }))
              }
            >
              <div className="space-y-2">
                {artifactItems.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
                    No saved {labelProfile.artifactLabelPlural.toLowerCase()} yet.
                  </div>
                ) : (
                  artifactItems.map((item) => (
                    <button
                      key={item.refId}
                      onClick={() => {
                        setFocusedTrack('ARTIFACT');
                        setFocusedRefId(item.refId);
                      }}
                      className={getFocusedButtonClass(focusedRefId === item.refId)}
                    >
                      <div className="truncate font-bold text-zinc-200">{item.title}</div>
                      <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                        {item.badges?.join(' / ') || labelProfile.artifactLabel}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Accordion>

            <Accordion
              title="Signals"
              icon={Radio}
              count={signalItems.length}
              isOpen={dossierSections.signals}
              onToggle={() =>
                setDossierSections((current) => ({ ...current, signals: !current.signals }))
              }
            >
              <div className="space-y-2">
                {signalItems.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
                    No saved signals in this workspace yet.
                  </div>
                ) : (
                  signalItems.map((item) => (
                    <button
                      key={item.refId}
                      onClick={() => {
                        setFocusedTrack('SIGNAL');
                        setFocusedRefId(item.refId);
                      }}
                      className={getFocusedButtonClass(focusedRefId === item.refId)}
                    >
                      <div className="truncate font-bold text-zinc-200">{item.title}</div>
                      <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                        {item.badges?.join(' / ') || 'Signal'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Accordion>

            <Accordion
              title="Entities"
              icon={Fingerprint}
              count={entityItems.length}
              isOpen={dossierSections.entities}
              onToggle={() =>
                setDossierSections((current) => ({ ...current, entities: !current.entities }))
              }
            >
              <div className="space-y-2">
                {entityItems.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
                    No entity milestones in this workspace yet.
                  </div>
                ) : (
                  entityItems.map((item) => (
                    <button
                      key={item.refId}
                      onClick={() => focusReference('ENTITY', item.refId)}
                      className={getFocusedButtonClass(focusedRefId === item.refId)}
                    >
                      <div className="truncate font-bold text-zinc-200">{item.title}</div>
                      <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                        {item.badges?.join(' / ') || 'ENTITY'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Accordion>

            <Accordion
              title="Chats"
              icon={MessageSquare}
              count={chatSessionItems.length}
              isOpen={dossierSections.chats}
              onToggle={() =>
                setDossierSections((current) => ({ ...current, chats: !current.chats }))
              }
            >
              <div className="space-y-2">
                {chatSessionItems.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
                    No workspace chats available yet.
                  </div>
                ) : (
                  chatSessionItems.map((item) => (
                    <button
                      key={item.refId}
                      onClick={() => focusReference('CHAT', item.refId)}
                      className={getFocusedButtonClass(focusedRefId === item.refId)}
                    >
                      <div className="truncate font-bold text-zinc-200">{item.title}</div>
                      <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                        {item.badges?.join(' / ') || 'CHAT'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Accordion>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden border-x border-zinc-800 bg-black/70">
          <div className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!activeWorkspace ? (
              <EmptyState
                icon={Clock3}
                title={workspaces.length === 0 ? 'Timeline Unavailable' : 'No Workspace Selected'}
                description={
                  workspaces.length === 0
                    ? 'Create a workspace first. Timeline becomes useful once Sherlock has saved signals, runs, artifacts, or chat activity.'
                    : 'Select a workspace from the header to inspect its chronology.'
                }
              />
            ) : visibleEvents.length === 0 ? (
              <EmptyState
                icon={Clock3}
                title="No Timeline Events"
                description="This workspace does not match the current search and filter selection yet, including any optional entity or chat chronology tracks."
                action={{
                  label: 'Reset Timeline Filters',
                  onClick: clearFilters,
                }}
              />
            ) : (
              <div className="space-y-8">
                {groupedEvents.map((group) => (
                  <section key={group.label}>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="h-px flex-1 bg-zinc-800" />
                      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500">
                        {group.label}
                      </div>
                      <div className="h-px flex-1 bg-zinc-800" />
                    </div>

                    <div className="space-y-3">
                      {group.events.map((event) => {
                        const EventIcon = getEventIcon(event);
                        const relatedArtifactId =
                          getPrimaryRefId(event, 'ARTIFACT') ||
                          getMetadataValue<string>(event, 'relatedArtifactId') ||
                          getMetadataValue<string>(event, 'linkedArtifactId');
                        const sourceSignalId = getMetadataValue<string>(event, 'sourceSignalId');
                        const previousArtifactId = getMetadataValue<string>(
                          event,
                          'previousArtifactId'
                        );
                        const sessionId =
                          getPrimaryRefId(event, 'CHAT_SESSION') ||
                          getMetadataValue<string>(event, 'sessionId');

                        return (
                          <div
                            key={event.id}
                            onClick={() => {
                              setSelectedEventId(event.id);
                              setRightPanelOpen(true);
                            }}
                            onKeyDown={(keyboardEvent) => {
                              if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') {
                                return;
                              }
                              keyboardEvent.preventDefault();
                              setSelectedEventId(event.id);
                              setRightPanelOpen(true);
                            }}
                            role="button"
                            tabIndex={0}
                            className={`w-full border p-4 text-left transition ${
                              effectiveSelectedEventId === event.id
                                ? 'border-osint-primary bg-zinc-900/90'
                                : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-600 hover:bg-zinc-900/80'
                            }`}
                          >
                            <div className="flex flex-col gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                  <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                                    {formatEventTime(event.occurredAt)}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-2 border px-2 py-1 text-[10px] font-mono uppercase tracking-wide ${getEventTone(event)}`}
                                  >
                                    <EventIcon className="h-3.5 w-3.5" />
                                    {event.track}
                                  </span>
                                  {event.badges?.map((badge) => (
                                    <span
                                      key={`${event.id}-${badge}`}
                                      className="border border-zinc-700 bg-black px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-zinc-500"
                                    >
                                      {badge}
                                    </span>
                                  ))}
                                </div>
                                <div className="mt-3 text-sm font-bold uppercase tracking-wide text-white">
                                  {event.title}
                                </div>
                                {event.summary && (
                                  <p className="mt-2 text-sm font-mono leading-relaxed text-zinc-400">
                                    {event.summary}
                                  </p>
                                )}
                                {(relatedArtifactId ||
                                  sourceSignalId ||
                                  previousArtifactId ||
                                  sessionId) && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {relatedArtifactId && event.track === 'ENTITY' && (
                                      <button
                                        onClick={(clickEvent) => {
                                          clickEvent.stopPropagation();
                                          focusReference('ARTIFACT', relatedArtifactId);
                                        }}
                                        className="border border-violet-500/30 bg-violet-500/5 px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-violet-200 transition hover:border-violet-400 hover:text-white"
                                      >
                                        In{' '}
                                        {artifactTitleById.get(relatedArtifactId) ||
                                          labelProfile.artifactLabel}
                                      </button>
                                    )}
                                    {sourceSignalId && (
                                      <button
                                        onClick={(clickEvent) => {
                                          clickEvent.stopPropagation();
                                          focusReference('SIGNAL', sourceSignalId);
                                        }}
                                        className="border border-cyan-500/30 bg-cyan-500/5 px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-cyan-200 transition hover:border-cyan-400 hover:text-white"
                                      >
                                        From {signalTitleById.get(sourceSignalId) || 'Signal'}
                                      </button>
                                    )}
                                    {previousArtifactId && (
                                      <button
                                        onClick={(clickEvent) => {
                                          clickEvent.stopPropagation();
                                          focusReference('ARTIFACT', previousArtifactId);
                                        }}
                                        className="border border-indigo-500/30 bg-indigo-500/5 px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-indigo-200 transition hover:border-indigo-400 hover:text-white"
                                      >
                                        Previous{' '}
                                        {artifactTitleById.get(previousArtifactId) ||
                                          labelProfile.artifactLabel}
                                      </button>
                                    )}
                                    {sessionId && event.track !== 'CHAT' && (
                                      <button
                                        onClick={(clickEvent) => {
                                          clickEvent.stopPropagation();
                                          focusReference('CHAT', sessionId);
                                        }}
                                        className="border border-emerald-500/30 bg-emerald-500/5 px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-emerald-200 transition hover:border-emerald-400 hover:text-white"
                                      >
                                        Chat {chatTitleById.get(sessionId) || 'Session'}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {relatedArtifactId && (
                                  <button
                                    onClick={(clickEvent) => {
                                      clickEvent.stopPropagation();
                                      openArtifact(relatedArtifactId);
                                    }}
                                    className="border border-zinc-700 px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-300 transition hover:border-osint-primary hover:text-white"
                                  >
                                    Open {labelProfile.artifactLabel}
                                  </button>
                                )}
                                <button
                                  onClick={(clickEvent) => {
                                    clickEvent.stopPropagation();
                                    openWorkspaceChat(event);
                                  }}
                                  className="border border-zinc-700 px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-300 transition hover:border-osint-primary hover:text-white"
                                >
                                  {sessionId ? 'Open Chat Session' : 'Workspace Chat'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </main>

        <aside
          className={`absolute right-0 top-0 z-30 flex h-full flex-col overflow-hidden bg-black/95 transition-all duration-200 lg:relative lg:translate-x-0 ${
            rightPanelOpen
              ? 'w-[min(24rem,calc(100vw-1rem))] translate-x-0 border-l border-zinc-800'
              : 'w-[min(24rem,calc(100vw-1rem))] translate-x-full border-l border-zinc-800 lg:w-0 lg:border-l-0'
          }`}
        >
          <div className="border-b border-zinc-800 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
              Event Details
            </div>
            <div className="mt-1 text-sm font-bold uppercase tracking-widest text-white">
              {selectedEvent ? selectedEvent.title : 'No event selected'}
            </div>
          </div>
          {selectedEvent && detailActions.length > 0 && (
            <div className="border-b border-zinc-800 bg-zinc-900/10 px-4 py-3">
              <InspectorActionRow actions={detailActions} />
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {!selectedEvent ? (
              <EmptyState
                icon={MessageSquare}
                title="Select An Event"
                description="Pick a signal, run, artifact, entity milestone, or chat event from the chronology to inspect its context and jump into related workspace views."
                className="px-0 py-10"
                panelClassName="max-w-none px-6 py-8"
              />
            ) : (
              <>
                <Accordion
                  title="Summary"
                  icon={Clock3}
                  isOpen={detailSections.summary}
                  onToggle={() =>
                    setDetailSections((current) => ({
                      ...current,
                      summary: !current.summary,
                    }))
                  }
                >
                  <div className="space-y-3 px-1 py-1 text-xs font-mono text-zinc-300">
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500">Type</div>
                      <div className="mt-1">{selectedEvent.type}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500">Occurred</div>
                      <div className="mt-1">
                        {selectedEvent.occurredAt > 0
                          ? new Date(selectedEvent.occurredAt).toLocaleString()
                          : 'No canonical timestamp available'}
                      </div>
                    </div>
                    {selectedEvent.summary && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Summary</div>
                        <div className="mt-1 leading-relaxed text-zinc-400">
                          {selectedEvent.summary}
                        </div>
                      </div>
                    )}
                  </div>
                </Accordion>

                <Accordion
                  title="Context"
                  icon={Workflow}
                  isOpen={detailSections.context}
                  onToggle={() =>
                    setDetailSections((current) => ({
                      ...current,
                      context: !current.context,
                    }))
                  }
                >
                  <div className="space-y-3 px-1 py-1 text-xs font-mono text-zinc-300">
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500">Workspace</div>
                      <div className="mt-1">
                        {activeWorkspace ? sanitizeDisplayTitle(activeWorkspace.title) : 'Unknown'}
                      </div>
                    </div>
                    {selectedChatSession && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Chat Session</div>
                        <div className="mt-1">{selectedChatSession.title || 'Workspace Chat'}</div>
                      </div>
                    )}
                    {selectedEntityName && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Entity</div>
                        <div className="mt-1">{selectedEntityName}</div>
                      </div>
                    )}
                    {selectedArtifact && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">
                          Related {labelProfile.artifactLabel}
                        </div>
                        <div className="mt-1">{sanitizeDisplayTitle(selectedArtifact.topic)}</div>
                      </div>
                    )}
                    {parentArtifact && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">
                          Parent {labelProfile.artifactLabel}
                        </div>
                        <div className="mt-1">{sanitizeDisplayTitle(parentArtifact.topic)}</div>
                      </div>
                    )}
                    {relatedSignal && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Origin Signal</div>
                        <div className="mt-1">{relatedSignal.content}</div>
                      </div>
                    )}
                    {selectedRun && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Source Run</div>
                        <div className="mt-1">{sanitizeDisplayTitle(selectedRun.topic)}</div>
                      </div>
                    )}
                    {selectedChatLaunchContext?.entityName && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Pinned Entity</div>
                        <div className="mt-1">{selectedChatLaunchContext.entityName}</div>
                      </div>
                    )}
                    {typeof getMetadataValue<number>(selectedEvent, 'mentionCount') ===
                      'number' && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Artifact Mentions</div>
                        <div className="mt-1">
                          {getMetadataValue<number>(selectedEvent, 'mentionCount')}
                        </div>
                      </div>
                    )}
                    {typeof getMetadataValue<number>(selectedEvent, 'threshold') === 'number' && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">
                          Milestone Threshold
                        </div>
                        <div className="mt-1">
                          {getMetadataValue<number>(selectedEvent, 'threshold')} mentions
                        </div>
                      </div>
                    )}
                    {getMetadataValue<string>(selectedEvent, 'daysSincePrevious') && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">
                          Gap Since Previous
                        </div>
                        <div className="mt-1">
                          {getMetadataValue<string>(selectedEvent, 'daysSincePrevious')}
                        </div>
                      </div>
                    )}
                    {typeof selectedChatAction?.input?.query === 'string' && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Workspace Query</div>
                        <div className="mt-1">{selectedChatAction.input.query}</div>
                      </div>
                    )}
                    {typeof selectedChatAction?.input?.topic === 'string' && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Requested Topic</div>
                        <div className="mt-1">{selectedChatAction.input.topic}</div>
                      </div>
                    )}
                    {typeof getMetadataValue<number>(selectedEvent, 'citedSnippetCount') ===
                      'number' && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Citations Used</div>
                        <div className="mt-1">
                          {getMetadataValue<number>(selectedEvent, 'citedSnippetCount')}
                        </div>
                      </div>
                    )}
                    {getMetadataValue<string>(selectedEvent, 'source') && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Source</div>
                        <div className="mt-1">
                          {getMetadataValue<string>(selectedEvent, 'source')}
                        </div>
                      </div>
                    )}
                    {getMetadataValue<string>(selectedEvent, 'launchSource') && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Launch Source</div>
                        <div className="mt-1">
                          {getMetadataValue<string>(selectedEvent, 'launchSource')}
                        </div>
                      </div>
                    )}
                    {selectedEvent.badges && selectedEvent.badges.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Tags</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedEvent.badges.map((badge) => (
                            <span
                              key={`${selectedEvent.id}-detail-${badge}`}
                              className="border border-zinc-700 bg-black px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-400"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Accordion>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
