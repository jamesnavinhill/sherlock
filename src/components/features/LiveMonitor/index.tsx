import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useWorkspaceStore } from '../../../store/caseStore';
import type { MonitorEvent, InvestigationLaunchRequest, Headline, SystemConfig } from '../../../types';
import type { MonitorConfig } from '../../../services/runtime';
import { getLiveWorkspaceIntel } from '../../../services/runtime';
import { getAllScopes, getScopeById } from '../../../data/presets';
import {
    Radio, Play, Pause, Activity, Settings2, Radar
} from 'lucide-react';
import { TaskSetupModal } from '../../ui/TaskSetupModal';
import { BackgroundMatrixRain } from '../../ui/BackgroundMatrixRain';
import { EmptyState } from '../../ui/EmptyState';
import { OsintSelect } from '../../ui/OsintSelect';
import { getDomainPackForScope, getLabelProfileById, stripLegacyWorkspacePrefix } from '../../../domain';

// Sub-components
import { SettingsPanel } from './SettingsPanel';
import { EventCard } from './EventCard';

interface LiveMonitorProps {
    events: MonitorEvent[];
    setEvents: React.Dispatch<React.SetStateAction<MonitorEvent[]>>;
    onInvestigate: (request: InvestigationLaunchRequest) => void;
}

/**
 * Live Monitor component for real-time OSINT surveillance.
 * Streams events from various sources (news, social, official) and allows investigation.
 */
export const LiveMonitor: React.FC<LiveMonitorProps> = ({ events = [], setEvents, onInvestigate }) => {
    // Ensure events is always an array to prevent .map errors
    const safeEvents = Array.isArray(events) ? events : [];

    const {
        headlines,
        addHeadline,
        workspaces,
        activeWorkspaceId: selectedCaseId,
        setActiveWorkspaceId: setSelectedCaseId,
        activeScope: activeScopeId,
        customScopes,
    } = useWorkspaceStore();

    type FilterType = 'ALL' | 'SOCIAL' | 'NEWS' | 'OFFICIAL';
    type ThreatFilter = 'ALL' | 'INFO' | 'CAUTION' | 'CRITICAL';

    // Monitoring State
    const [isMonitoring, setIsMonitoring] = useState(false);
    const isMonitoringRef = useRef(false);
    const [streamStatus, setStreamStatus] = useState<'IDLE' | 'SCANNING' | 'RECEIVING'>('IDLE');

    // Filter & UI State
    const [filterType, setFilterType] = useState<FilterType>('ALL');
    const [filterThreat, setFilterThreat] = useState<ThreatFilter>('ALL');
    const [showSettings, setShowSettings] = useState(false);

    // Configuration State
    const [feedConfig, setFeedConfig] = useState<MonitorConfig>({
        newsCount: 3,
        socialCount: 3,
        officialCount: 2,
        prioritySources: '',
        dateRange: { start: '', end: '' }
    });

    // Auto-Save State
    const [autoSave, setAutoSave] = useState(() => {
        return localStorage.getItem('sherlock_livestream_autosave') !== 'false';
    });

    // Event Expansion State
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

    // Memoized saved headlines IDs for quick check
    const savedHeadlineIds = useMemo(() => new Set(headlines.map(h => h.id.replace('headline-', ''))), [headlines]);

    // Task Selection State
    const [selectedEventForAnalysis, setSelectedEventForAnalysis] = useState<MonitorEvent | null>(null);
    const selectedCase = useMemo(() => workspaces.find(c => c.id === selectedCaseId) ?? null, [workspaces, selectedCaseId]);
    const activeScope = useMemo(() => {
        return getScopeById(activeScopeId || '') || getAllScopes(customScopes).find((scope) => scope.id === activeScopeId);
    }, [activeScopeId, customScopes]);
    const activePack = useMemo(() => getDomainPackForScope(activeScope, customScopes), [activeScope, customScopes]);
    const labelProfile = useMemo(() => getLabelProfileById(activePack.labelProfileId), [activePack]);

    // --- EFFECTS ---

    useEffect(() => {
        return () => {
            isMonitoringRef.current = false;
        };
    }, []);

    // --- HANDLERS ---

    const runBatchScan = async () => {
        if (!selectedCaseId) return;
        if (isMonitoringRef.current) return;

        setIsMonitoring(true);
        isMonitoringRef.current = true;
        setStreamStatus('SCANNING');

        const activeCase = workspaces.find(c => c.id === selectedCaseId);
        if (!activeCase) {
            resetState();
            return;
        }

        try {
            const existingContent = safeEvents.map(e => e.content);
            const newIntel = await getLiveWorkspaceIntel(
                stripLegacyWorkspacePrefix(activeCase.title),
                feedConfig,
                existingContent,
                activeScope,
                {
                    packId: activeScope?.id,
                    purposeId: activeScope?.defaultPurposeId,
                }
            );

            if (!isMonitoringRef.current) {
                resetState();
                return;
            }

            setStreamStatus('RECEIVING');

            if (!Array.isArray(newIntel)) {
                console.error("Invalid intel format received", newIntel);
                setStreamStatus('IDLE');
                setIsMonitoring(false);
                isMonitoringRef.current = false;
                return;
            }

            const uniqueNewIntel = newIntel.filter(item =>
                !safeEvents.some(existing => existing.content === item.content || existing.id === item.id)
            );

            if (uniqueNewIntel.length === 0) {
                setTimeout(() => resetState(), 1000);
                return;
            }

            let maxDelay = 0;
            uniqueNewIntel.forEach((item, i) => {
                const delay = (i * 800) + Math.random() * 400;
                maxDelay = Math.max(maxDelay, delay);

                setTimeout(() => {
                    if (isMonitoringRef.current) {
                        setEvents(prev => [item, ...prev]);
                        if (autoSave) {
                            saveAsHeadline(item);
                        }
                    }
                }, delay);
            });

            setTimeout(() => {
                if (isMonitoringRef.current) {
                    resetState();
                }
            }, maxDelay + 1500);

        } catch (e) {
            console.error("Scan error", e);
            resetState();
        }
    };

    const resetState = () => {
        setIsMonitoring(false);
        isMonitoringRef.current = false;
        setStreamStatus('IDLE');
    };

    const stopMonitoring = () => {
        resetState();
    };

    const handleEventClick = (event: MonitorEvent) => {
        if (expandedEventId === event.id) {
            setExpandedEventId(null);
        } else {
            setExpandedEventId(event.id);
            saveAsHeadline(event);
        }
    };

    const handleInvestigateFromExpanded = (event: MonitorEvent) => {
        setSelectedEventForAnalysis(event);
    };

    const saveAsHeadline = async (event: MonitorEvent) => {
        if (!selectedCaseId || savedHeadlineIds.has(event.id)) return;

        try {
            const newHeadline: Headline = {
                id: `headline-${event.id}`,
                caseId: selectedCaseId,
                content: event.content,
                source: event.sourceName,
                url: event.url,
                timestamp: event.timestamp,
                type: event.type,
                threatLevel: event.threatLevel,
                status: 'PENDING'
            };

            await addHeadline(newHeadline);
        } catch (e) {
            console.error('Failed to save headline', e);
        }
    };

    const executeAnalysis = (
        topic: string,
        configOverride: Partial<SystemConfig>,
        preseededEntities?: InvestigationLaunchRequest['preseededEntities'],
        scope?: InvestigationLaunchRequest['scope'],
        dateRange?: InvestigationLaunchRequest['dateRangeOverride']
    ) => {
        const context = selectedCase
            ? { topic: selectedCase.title, summary: selectedCase.description || "Live monitoring operation" }
            : undefined;

        onInvestigate({
            topic,
            parentContext: context,
            configOverride,
            preseededEntities,
            scope,
            dateRangeOverride: dateRange,
            launchSource: 'LIVE_MONITOR_EVENT',
            sourceSignalId: selectedEventForAnalysis ? `headline-${selectedEventForAnalysis.id}` : undefined,
        });
        setSelectedEventForAnalysis(null);
    };

    const handleClearFeed = () => {
        setEvents([]);
    };

    const handleAutoSaveChange = (value: boolean) => {
        setAutoSave(value);
        localStorage.setItem('sherlock_livestream_autosave', String(value));
    };

    const getFilteredEvents = () => {
        let filtered = safeEvents;
        if (filterType !== 'ALL') filtered = filtered.filter(e => e.type === filterType);
        if (filterThreat !== 'ALL') filtered = filtered.filter(e => e.threatLevel === filterThreat);
        return filtered;
    };

    // --- RENDER ---

    return (
        <div className="h-screen w-full flex flex-col bg-black text-zinc-200 overflow-hidden relative">

            {/* Unified Top Toolbar */}
            <div className="h-20 px-6 bg-black/90 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between shadow-lg z-20 flex-shrink-0 relative">

                {/* Left: Selectors */}
                <div className="flex items-center space-x-6">
                    {/* Workspace Selector */}
                    <div className="hidden md:block min-w-[100px] max-w-[250px]">
                        <OsintSelect
                            ariaLabel={`${labelProfile.workspaceLabel} selector`}
                            value={selectedCaseId || ''}
                            onChange={setSelectedCaseId}
                            disabled={isMonitoring}
                            triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono truncate hover:border-white focus-visible:border-white"
                            options={[
                                { value: '', label: `${labelProfile.workspaceLabel.toUpperCase()}: NONE SELECTED` },
                                ...workspaces.map((workspace) => ({
                                    value: workspace.id,
                                    label: `${labelProfile.workspaceLabel.toUpperCase()}: ${stripLegacyWorkspacePrefix(workspace.title)}`,
                                })),
                            ]}
                        />
                    </div>

                    {/* Filter Selector */}
                    <div className="min-w-[150px]">
                        <OsintSelect
                            ariaLabel="Signal filter"
                            value={filterType}
                            onChange={(value) => {
                                if (value === 'ALL' || value === 'SOCIAL' || value === 'NEWS' || value === 'OFFICIAL') {
                                    setFilterType(value);
                                }
                            }}
                            triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono hover:border-white focus-visible:border-white"
                            options={[
                                { value: 'ALL', label: 'FILTER: ALL SIGNALS' },
                                { value: 'SOCIAL', label: 'FILTER: SOCIAL ONLY' },
                                { value: 'NEWS', label: 'FILTER: NEWS ONLY' },
                                { value: 'OFFICIAL', label: 'FILTER: OFFICIAL DOCS' },
                            ]}
                        />
                    </div>

                    {/* Threat Filter */}
                    <div className="min-w-[150px]">
                        <OsintSelect
                            ariaLabel="Threat filter"
                            value={filterThreat}
                            onChange={(value) => {
                                if (value === 'ALL' || value === 'INFO' || value === 'CAUTION' || value === 'CRITICAL') {
                                    setFilterThreat(value);
                                }
                            }}
                            triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono hover:border-white focus-visible:border-white"
                            options={[
                                { value: 'ALL', label: 'THREAT: ALL LEVELS' },
                                { value: 'INFO', label: 'THREAT: INFO ONLY' },
                                { value: 'CAUTION', label: 'THREAT: CAUTION ONLY' },
                                { value: 'CRITICAL', label: 'THREAT: CRITICAL ONLY' },
                            ]}
                        />
                    </div>
                </div>

                {/* Right: Controls & Status */}
                <div className="flex items-center space-x-6">
                    {/* Compact Stats */}
                    <div className="hidden lg:flex space-x-4 text-xs font-mono text-zinc-500 border-r border-zinc-800 pr-6">
                        <div className="flex items-center space-x-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isMonitoring ? 'bg-osint-primary animate-pulse' : 'bg-zinc-600'}`}></span>
                            <span>STATUS: <span className={isMonitoring ? "text-osint-primary font-bold" : "text-zinc-400"}>{streamStatus}</span></span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></span>
                            <span>EVENTS: <span className="text-white font-bold">{safeEvents.length}</span></span>
                        </div>
                    </div>

                    {/* Settings Toggle */}
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-1.5 border transition-all ${showSettings ? 'bg-zinc-800 border-white text-white' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}
                        title="Configure Feed Parameters"
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>

                    {selectedCaseId && (
                        <button
                            onClick={isMonitoring ? stopMonitoring : runBatchScan}
                            className={`flex items-center px-4 py-1.5 text-xs font-bold font-mono transition-all border uppercase ${isMonitoring
                                ? 'osint-button-danger'
                                : 'osint-button-primary'
                                }`}
                        >
                            {isMonitoring ? <Pause className="w-3 h-3 mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                            {isMonitoring ? 'STOP SCAN' : 'SCAN'}
                        </button>
                    )}
                </div>

                {/* Settings Panel */}
                <SettingsPanel
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    config={feedConfig}
                    onConfigChange={setFeedConfig}
                    onClearFeed={handleClearFeed}
                    autoSave={autoSave}
                    onAutoSaveChange={handleAutoSaveChange}
                />
            </div>

            {/* Main Monitor Area */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Background Layer */}
                <div className="absolute inset-0 z-0 bg-black">
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(#52525b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    </div>
                    <BackgroundMatrixRain />
                </div>

                {/* Center: The Stream */}
                <div className="flex-1 relative z-10 flex flex-col overflow-hidden">

                    {/* Empty State */}
                    {!selectedCaseId && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
                            <EmptyState
                                icon={Radio}
                                title={workspaces.length === 0 ? 'Monitor Awaiting Workspace' : 'Awaiting Target Selection'}
                                description={
                                    workspaces.length === 0
                                        ? 'Create or reopen a workspace first. Live Monitor needs an active workspace so incoming signals stay local, searchable, and auditable.'
                                        : 'Select a workspace to begin surveillance and route incoming signals into the active operation.'
                                }
                                action={
                                    workspaces.length > 0
                                        ? {
                                              label: 'Use First Workspace',
                                              onClick: () => setSelectedCaseId(workspaces[0].id),
                                          }
                                        : undefined
                                }
                                panelClassName="max-w-xl"
                            />
                        </div>
                    )}

                    {/* Scanning State */}
                    {streamStatus === 'SCANNING' && (
                        <div className="flex items-center justify-center mb-6 pt-6 animate-in fade-in zoom-in duration-300">
                            <div className="px-4 py-2 bg-black/60 border border-osint-primary/50 text-osint-primary font-mono text-xs uppercase flex items-center rounded-full backdrop-blur-sm">
                                <Radar className="w-3 h-3 mr-2 animate-spin" />
                                Scanning Frequencies...
                            </div>
                        </div>
                    )}

                    {/* Receiving State */}
                    {streamStatus === 'RECEIVING' && (
                        <div className="flex items-center justify-center mb-6 pt-6 animate-in fade-in zoom-in duration-300">
                            <div className="px-4 py-2 bg-black/60 border border-green-500/50 text-green-400 font-mono text-xs uppercase flex items-center rounded-full backdrop-blur-sm">
                                <Activity className="w-3 h-3 mr-2 animate-pulse" />
                                Receiving Data Stream...
                            </div>
                        </div>
                    )}

                    {/* Feed Content Grid */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                            {getFilteredEvents().map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    isExpanded={expandedEventId === event.id}
                                    isSaved={savedHeadlineIds.has(event.id)}
                                    onToggle={() => handleEventClick(event)}
                                    onInvestigate={() => handleInvestigateFromExpanded(event)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* Task Setup Modal */}
            {selectedEventForAnalysis && (
                <TaskSetupModal
                    initialTopic={selectedEventForAnalysis.content}
                    initialContext={selectedCase ? { topic: selectedCase.title, summary: selectedCase.description || '' } : undefined}
                    initialScopeId={activeScopeId || undefined}
                    onCancel={() => setSelectedEventForAnalysis(null)}
                    onStart={executeAnalysis}
                />
            )}

        </div>
    );
};
