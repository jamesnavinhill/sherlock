import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Clock3,
    FileText,
    Filter,
    MessageSquare,
    Radio,
    Search,
    Workflow,
} from 'lucide-react';
import type {
    ChatOpenRequest,
    InvestigationReport,
    TimelineEvent,
    TimelineFilters,
    TimelineRange,
    TimelineTrack,
} from '../../types';
import { useCaseStore } from '../../store/caseStore';
import { BackgroundMatrixRain } from '../ui/BackgroundMatrixRain';
import { Accordion } from '../ui/Accordion';
import { EmptyState } from '../ui/EmptyState';
import { getLabelProfileById, sanitizeDisplayTitle } from '../../domain';
import {
    buildWorkspaceTimelineEvents,
    filterTimelineEvents,
    getLatestTimelineActivity,
    getTrackCount,
    groupTimelineEventsByDay,
} from './Timeline/timelineEvents';

interface TimelineViewProps {
    onOpenReport: (report: InvestigationReport) => void;
    onOpenChat: (request: ChatOpenRequest) => void;
}

type DossierSections = {
    events: boolean;
    runs: boolean;
    artifacts: boolean;
    signals: boolean;
};

type DetailSections = {
    summary: boolean;
    context: boolean;
    actions: boolean;
};

const DEFAULT_FILTERS: TimelineFilters = {
    range: 'ALL',
    tracks: ['SIGNAL', 'RUN', 'ARTIFACT'],
};

const TRACK_OPTIONS: Array<{ track: TimelineTrack; label: string; icon: typeof Radio }> = [
    { track: 'SIGNAL', label: 'Signals', icon: Radio },
    { track: 'RUN', label: 'Runs', icon: Activity },
    { track: 'ARTIFACT', label: 'Artifacts', icon: FileText },
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

export const TimelineView: React.FC<TimelineViewProps> = ({ onOpenReport, onOpenChat }) => {
    const { activeCaseId, archives, cases, headlines, setActiveCaseId, tasks } = useCaseStore();
    const [leftPanelOpen, setLeftPanelOpen] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<TimelineFilters>(DEFAULT_FILTERS);
    const [focusedTrack, setFocusedTrack] = useState<TimelineTrack | 'ALL'>('ALL');
    const [focusedRefId, setFocusedRefId] = useState<string | undefined>();
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [dossierSections, setDossierSections] = useState<DossierSections>({
        events: true,
        runs: true,
        artifacts: true,
        signals: true,
    });
    const [detailSections, setDetailSections] = useState<DetailSections>({
        summary: true,
        context: true,
        actions: true,
    });
    const filterMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!activeCaseId && cases.length > 0) {
            setActiveCaseId(cases[0].id);
        }
    }, [activeCaseId, cases, setActiveCaseId]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) {
                setLeftPanelOpen(false);
                setRightPanelOpen(false);
            } else if (window.innerWidth <= 1440) {
                setLeftPanelOpen(true);
                setRightPanelOpen(false);
            } else {
                setLeftPanelOpen(true);
                setRightPanelOpen(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    const activeWorkspace = useMemo(
        () => cases.find((workspace) => workspace.id === activeCaseId) || null,
        [activeCaseId, cases]
    );

    const labelProfile = useMemo(
        () =>
            getLabelProfileById(
                activeWorkspace?.labelProfileId || archives.find((artifact) => artifact.caseId === activeWorkspace?.id)?.labelProfileId
            ),
        [activeWorkspace?.id, activeWorkspace?.labelProfileId, archives]
    );

    const allTimelineEvents = useMemo(() => {
        if (!activeWorkspace) return [];

        return buildWorkspaceTimelineEvents({
            workspaceId: activeWorkspace.id,
            artifacts: archives,
            runs: tasks,
            signals: headlines,
        });
    }, [activeWorkspace, archives, headlines, tasks]);

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
    const artifactItems = useMemo(() => toUniqueItems(allTimelineEvents, 'ARTIFACT'), [allTimelineEvents]);
    const signalItems = useMemo(() => toUniqueItems(allTimelineEvents, 'SIGNAL'), [allTimelineEvents]);
    const effectiveSelectedEventId = useMemo(
        () => (selectedEventId && visibleEvents.some((event) => event.id === selectedEventId) ? selectedEventId : null),
        [selectedEventId, visibleEvents]
    );
    const selectedEvent = useMemo(
        () => visibleEvents.find((event) => event.id === effectiveSelectedEventId) || null,
        [effectiveSelectedEventId, visibleEvents]
    );
    const selectedArtifact = useMemo(() => {
        if (!selectedEvent) return null;

        const artifactId =
            selectedEvent.refKind === 'ARTIFACT'
                ? selectedEvent.refId
                : getMetadataValue<string>(selectedEvent, 'relatedArtifactId')
                  || getMetadataValue<string>(selectedEvent, 'linkedArtifactId');

        return archives.find((artifact) => artifact.id === artifactId) || null;
    }, [archives, selectedEvent]);
    const selectedRun = useMemo(() => {
        if (!selectedEvent) return null;

        const runId = selectedEvent.refKind === 'RUN' ? selectedEvent.refId : getMetadataValue<string>(selectedEvent, 'sourceRunId');
        return tasks.find((task) => task.id === runId) || null;
    }, [selectedEvent, tasks]);
    const relatedSignal = useMemo(() => {
        if (!selectedEvent) return null;

        const signalId = selectedEvent.refKind === 'SIGNAL'
            ? selectedEvent.refId
            : getMetadataValue<string>(selectedEvent, 'sourceSignalId');
        return headlines.find((headline) => headline.id === signalId) || null;
    }, [headlines, selectedEvent]);
    const parentArtifact = useMemo(() => {
        const parentArtifactId = getMetadataValue<string>(selectedEvent, 'parentArtifactId') || selectedEvent?.parentRefId;
        return archives.find((artifact) => artifact.id === parentArtifactId) || null;
    }, [archives, selectedEvent]);

    const lastActivity = useMemo(() => getLatestTimelineActivity(visibleEvents), [visibleEvents]);

    const setTrackFocus = (track: TimelineTrack | 'ALL') => {
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
        const artifact = archives.find((entry) => entry.id === artifactId);
        if (!artifact) return;
        onOpenReport(artifact);
    };

    const openWorkspaceChat = (event?: TimelineEvent | null) => {
        if (!activeWorkspace) return;

        if (event?.refKind === 'ARTIFACT' && event.refId) {
            onOpenChat({
                workspaceId: activeWorkspace.id,
                launchContext: { sourceReportId: event.refId },
            });
            return;
        }

        if (event?.refKind === 'SIGNAL' && event.refId) {
            onOpenChat({
                workspaceId: activeWorkspace.id,
                launchContext: { headlineId: event.refId },
            });
            return;
        }

        onOpenChat({ workspaceId: activeWorkspace.id });
    };

    if (cases.length === 0) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-black">
                <EmptyState
                    icon={Clock3}
                    title="Timeline Unavailable"
                    description="Create or open a workspace first. Timeline becomes useful once Sherlock has saved signals, runs, or artifacts to a workspace."
                />
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-black text-zinc-100">
            <BackgroundMatrixRain />

            <header className="sticky top-0 z-30 h-20 border-b border-zinc-800 bg-black/95 px-4 backdrop-blur-md sm:px-6">
                <div className="flex h-full items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <button
                            onClick={() => setLeftPanelOpen((current) => !current)}
                            className={`flex items-center gap-2 border px-3 py-1.5 text-xs font-mono uppercase transition ${
                                leftPanelOpen
                                    ? 'border-white bg-zinc-800 text-white'
                                    : 'border-zinc-700 bg-black text-zinc-400 hover:border-zinc-500 hover:text-white'
                            }`}
                            title="Toggle timeline dossier"
                        >
                            <Workflow className="h-4 w-4" />
                            <span className="hidden lg:inline">Dossier</span>
                        </button>

                        <div className="hidden min-w-0 items-center gap-3 xl:flex">
                            <Clock3 className="h-5 w-5 text-osint-primary" />
                            <div className="min-w-0">
                                <div className="truncate text-sm font-bold uppercase tracking-[0.24em] text-white">
                                    {labelProfile.workspaceLabel} Timeline
                                </div>
                                <div className="truncate text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                                    {activeWorkspace ? sanitizeDisplayTitle(activeWorkspace.title) : 'Workspace chronology'}
                                </div>
                            </div>
                        </div>

                        <div className="relative hidden w-60 min-w-0 md:block lg:w-72">
                            <select
                                value={activeWorkspace?.id || ''}
                                onChange={(event) => setActiveCaseId(event.target.value || null)}
                                className="w-full appearance-none border border-zinc-700 bg-black py-1.5 pl-3 pr-8 text-xs font-mono text-zinc-300 outline-none transition hover:border-osint-primary focus:border-osint-primary"
                            >
                                {cases.map((workspace) => (
                                    <option key={workspace.id} value={workspace.id}>
                                        {sanitizeDisplayTitle(workspace.title)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative hidden min-w-0 flex-1 md:block lg:max-w-md xl:max-w-xl">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={`Search ${labelProfile.artifactLabelPlural.toLowerCase()}, runs, signals...`}
                                className="w-full border border-zinc-700 bg-black py-1.5 pl-9 pr-3 text-xs font-mono text-zinc-300 outline-none transition hover:border-osint-primary focus:border-osint-primary"
                            />
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <div className="relative" ref={filterMenuRef}>
                            <button
                                onClick={() => setShowFilters((current) => !current)}
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
                                <div className="absolute right-0 top-full z-50 mt-2 w-80 border border-zinc-700 bg-osint-panel shadow-2xl">
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
                                            <select
                                                value={filters.range}
                                                onChange={(event) =>
                                                    setFilters((current) => ({
                                                        ...current,
                                                        range: event.target.value as TimelineRange,
                                                    }))
                                                }
                                                className="w-full border border-zinc-700 bg-black px-3 py-2 text-xs font-mono text-zinc-300 outline-none transition hover:border-osint-primary focus:border-osint-primary"
                                            >
                                                <option value="ALL">All Activity</option>
                                                <option value="7D">Last 7 Days</option>
                                                <option value="30D">Last 30 Days</option>
                                                <option value="90D">Last 90 Days</option>
                                            </select>
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
                            className={`flex items-center gap-2 border px-3 py-1.5 text-xs font-mono uppercase transition ${
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
                            ? 'w-[20rem] translate-x-0 border-r border-zinc-800'
                            : 'w-[20rem] -translate-x-full border-r border-zinc-800 lg:w-0 lg:border-r-0'
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
                            onToggle={() => setDossierSections((current) => ({ ...current, runs: !current.runs }))}
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
                    </div>
                </aside>

                <main className="flex min-w-0 flex-1 flex-col overflow-hidden border-x border-zinc-800 bg-black/70">
                    <div className="border-b border-zinc-800 px-4 py-3">
                        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
                            <div className="border border-zinc-800 bg-zinc-900/80 px-3 py-2">
                                <div className="text-[10px] font-mono uppercase text-zinc-500">Visible Events</div>
                                <div className="mt-1 text-lg font-bold text-white">{visibleEvents.length}</div>
                            </div>
                            <div className="border border-zinc-800 bg-zinc-900/80 px-3 py-2">
                                <div className="text-[10px] font-mono uppercase text-zinc-500">Signals</div>
                                <div className="mt-1 text-lg font-bold text-white">{toUniqueItems(visibleEvents, 'SIGNAL').length}</div>
                            </div>
                            <div className="border border-zinc-800 bg-zinc-900/80 px-3 py-2">
                                <div className="text-[10px] font-mono uppercase text-zinc-500">Runs</div>
                                <div className="mt-1 text-lg font-bold text-white">{toUniqueItems(visibleEvents, 'RUN').length}</div>
                            </div>
                            <div className="border border-zinc-800 bg-zinc-900/80 px-3 py-2">
                                <div className="text-[10px] font-mono uppercase text-zinc-500">
                                    {labelProfile.artifactLabelPlural}
                                </div>
                                <div className="mt-1 text-lg font-bold text-white">{toUniqueItems(visibleEvents, 'ARTIFACT').length}</div>
                            </div>
                            <div className="border border-zinc-800 bg-zinc-900/80 px-3 py-2">
                                <div className="text-[10px] font-mono uppercase text-zinc-500">Last Activity</div>
                                <div className="mt-1 text-sm font-bold text-white">{lastActivity || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {visibleEvents.length === 0 ? (
                            <EmptyState
                                icon={Clock3}
                                title="No Timeline Events"
                                description="This workspace does not match the current search and filter selection yet."
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
                                                    event.refKind === 'ARTIFACT'
                                                        ? event.refId
                                                        : getMetadataValue<string>(event, 'relatedArtifactId')
                                                          || getMetadataValue<string>(event, 'linkedArtifactId');

                                                return (
                                                    <div
                                                        key={event.id}
                                                        onClick={() => {
                                                            setSelectedEventId(event.id);
                                                            setRightPanelOpen(true);
                                                        }}
                                                        onKeyDown={(keyboardEvent) => {
                                                            if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') return;
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
                                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                                                                        {formatEventTime(event.occurredAt)}
                                                                    </span>
                                                                    <span
                                                                        className={`inline-flex items-center gap-2 border px-2 py-1 text-[10px] font-mono uppercase tracking-wide ${getEventTone(event)}`}
                                                                    >
                                                                        <EventIcon className="h-3.5 w-3.5" />
                                                                        {event.track}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-3 text-sm font-bold uppercase tracking-wide text-white">
                                                                    {event.title}
                                                                </div>
                                                                {event.summary && (
                                                                    <p className="mt-2 text-sm font-mono leading-relaxed text-zinc-400">
                                                                        {event.summary}
                                                                    </p>
                                                                )}
                                                                {event.badges && event.badges.length > 0 && (
                                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                                        {event.badges.map((badge) => (
                                                                            <span
                                                                                key={`${event.id}-${badge}`}
                                                                                className="border border-zinc-700 bg-black px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-zinc-500"
                                                                            >
                                                                                {badge}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex shrink-0 flex-wrap gap-2">
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
                                                                    Workspace Chat
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
                    className={`absolute right-0 top-0 z-30 h-full overflow-hidden bg-black/95 transition-all duration-200 lg:relative lg:translate-x-0 ${
                        rightPanelOpen
                            ? 'w-[24rem] translate-x-0 border-l border-zinc-800'
                            : 'w-[24rem] translate-x-full border-l border-zinc-800 lg:w-0 lg:border-l-0'
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

                    <div className="h-[calc(100%-72px)] overflow-y-auto p-3 custom-scrollbar">
                        {!selectedEvent ? (
                            <EmptyState
                                icon={MessageSquare}
                                title="Select An Event"
                                description="Pick a signal, run, or artifact from the chronology to inspect its context and jump into related workspace views."
                                className="py-20"
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
                                        {getMetadataValue<string>(selectedEvent, 'source') && (
                                            <div>
                                                <div className="text-[10px] uppercase text-zinc-500">Source</div>
                                                <div className="mt-1">{getMetadataValue<string>(selectedEvent, 'source')}</div>
                                            </div>
                                        )}
                                        {getMetadataValue<string>(selectedEvent, 'launchSource') && (
                                            <div>
                                                <div className="text-[10px] uppercase text-zinc-500">Launch Source</div>
                                                <div className="mt-1">{getMetadataValue<string>(selectedEvent, 'launchSource')}</div>
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

                                <Accordion
                                    title="Actions"
                                    icon={MessageSquare}
                                    isOpen={detailSections.actions}
                                    onToggle={() =>
                                        setDetailSections((current) => ({
                                            ...current,
                                            actions: !current.actions,
                                        }))
                                    }
                                >
                                    <div className="space-y-2 px-1 py-1">
                                        {relatedSignal && (
                                            <button
                                                onClick={() => focusReference('SIGNAL', relatedSignal.id)}
                                                className="w-full border border-zinc-700 px-3 py-2 text-left text-xs font-mono uppercase text-zinc-300 transition hover:border-osint-primary hover:text-white"
                                            >
                                                Focus Origin Signal
                                            </button>
                                        )}
                                        {parentArtifact && (
                                            <button
                                                onClick={() => focusReference('ARTIFACT', parentArtifact.id)}
                                                className="w-full border border-zinc-700 px-3 py-2 text-left text-xs font-mono uppercase text-zinc-300 transition hover:border-osint-primary hover:text-white"
                                            >
                                                Focus Parent {labelProfile.artifactLabel}
                                            </button>
                                        )}
                                        {selectedRun && (
                                            <button
                                                onClick={() => focusReference('RUN', selectedRun.id)}
                                                className="w-full border border-zinc-700 px-3 py-2 text-left text-xs font-mono uppercase text-zinc-300 transition hover:border-osint-primary hover:text-white"
                                            >
                                                Focus Source Run
                                            </button>
                                        )}
                                        {selectedArtifact && (
                                            <button
                                                onClick={() => openArtifact(selectedArtifact.id)}
                                                className="w-full border border-zinc-700 px-3 py-2 text-left text-xs font-mono uppercase text-zinc-300 transition hover:border-osint-primary hover:text-white"
                                            >
                                                Open {labelProfile.artifactLabel}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openWorkspaceChat(selectedEvent)}
                                            className="w-full border border-zinc-700 px-3 py-2 text-left text-xs font-mono uppercase text-zinc-300 transition hover:border-osint-primary hover:text-white"
                                        >
                                            Open Workspace Chat
                                        </button>
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
