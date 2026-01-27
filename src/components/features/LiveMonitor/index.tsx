import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useCaseStore } from '../../../store/caseStore';
import { Case, MonitorEvent, SystemConfig, Headline } from '../../../types';
import { getLiveIntel, MonitorConfig } from '../../../services/gemini';
import {
    Radio, Play, Pause, ChevronDown, Activity, Settings2, Radar
} from 'lucide-react';
import { TaskSetupModal } from '../../ui/TaskSetupModal';
import { BackgroundMatrixRain } from '../../ui/BackgroundMatrixRain';

// Sub-components
import { SettingsPanel } from './SettingsPanel';
import { EventCard } from './EventCard';

interface LiveMonitorProps {
    events: MonitorEvent[];
    setEvents: React.Dispatch<React.SetStateAction<MonitorEvent[]>>;
    onInvestigate: (topic: string, context?: { topic: string, summary: string }, configOverride?: Partial<SystemConfig>) => void;
}

/**
 * Live Monitor component for real-time OSINT surveillance.
 * Streams events from various sources (news, social, official) and allows investigation.
 */
export const LiveMonitor: React.FC<LiveMonitorProps> = ({ events, setEvents, onInvestigate }) => {
    const { headlines, addHeadline } = useCaseStore();
    // Case State
    const [cases, setCases] = useState<Case[]>([]);
    const [selectedCaseId, setSelectedCaseId] = useState<string>('');

    // Monitoring State
    const [isMonitoring, setIsMonitoring] = useState(false);
    const isMonitoringRef = useRef(false);
    const [streamStatus, setStreamStatus] = useState<'IDLE' | 'SCANNING' | 'RECEIVING'>('IDLE');

    // Filter & UI State
    const [filterType, setFilterType] = useState<'ALL' | 'SOCIAL' | 'NEWS' | 'OFFICIAL'>('ALL');
    const [filterThreat, setFilterThreat] = useState<'ALL' | 'INFO' | 'CAUTION' | 'CRITICAL'>('ALL');
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

    // --- EFFECTS ---

    useEffect(() => {
        const casesData = localStorage.getItem('sherlock_cases');
        if (casesData) {
            try {
                const parsed: Case[] = JSON.parse(casesData);
                setCases(parsed);

                // Load Active Case
                const activeCaseId = localStorage.getItem('sherlock_active_case_id');
                if (activeCaseId && parsed.some(c => c.id === activeCaseId)) {
                    setSelectedCaseId(activeCaseId);
                }
            } catch (e) {
                console.error(e);
            }
        }
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

        const activeCase = cases.find(c => c.id === selectedCaseId);
        if (!activeCase) {
            resetState();
            return;
        }

        try {
            const existingContent = events.map(e => e.content);
            const newIntel = await getLiveIntel(activeCase.title.replace('Operation: ', ''), feedConfig, existingContent);

            if (!isMonitoringRef.current) {
                resetState();
                return;
            }

            setStreamStatus('RECEIVING');

            const uniqueNewIntel = newIntel.filter(item =>
                !events.some(existing => existing.content === item.content || existing.id === item.id)
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

    const saveAsHeadline = (event: MonitorEvent) => {
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

            addHeadline(newHeadline);
        } catch (e) {
            console.error('Failed to save headline', e);
        }
    };

    const executeAnalysis = (topic: string, config: Partial<SystemConfig>) => {
        const activeCase = cases.find(c => c.id === selectedCaseId);
        const context = activeCase
            ? { topic: activeCase.title, summary: activeCase.description || "Live monitoring operation" }
            : undefined;

        onInvestigate(topic, context, config);
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
        let filtered = events;
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
                    {/* Case Selector */}
                    <div className="relative group hidden md:block">
                        <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        <select
                            value={selectedCaseId}
                            onChange={(e) => {
                                setSelectedCaseId(e.target.value);
                                localStorage.setItem('sherlock_active_case_id', e.target.value);
                            }}
                            disabled={isMonitoring}
                            className="bg-black border border-zinc-700 text-zinc-300 text-xs font-mono py-1.5 pl-3 pr-8 rounded-none outline-none appearance-none cursor-pointer hover:border-white min-w-[100px] max-w-[250px] truncate"
                        >
                            <option value="">TARGET: NONE SELECTED</option>
                            {cases.map(c => (
                                <option key={c.id} value={c.id} className="truncate">OP: {c.title.replace('Operation: ', '')}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Selector */}
                    <div className="relative group">
                        <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="bg-black border border-zinc-700 text-zinc-300 text-xs font-mono py-1.5 pl-3 pr-8 rounded-none outline-none appearance-none cursor-pointer hover:border-white min-w-[150px]"
                        >
                            <option value="ALL">FILTER: ALL SIGNALS</option>
                            <option value="SOCIAL">FILTER: SOCIAL ONLY</option>
                            <option value="NEWS">FILTER: NEWS ONLY</option>
                            <option value="OFFICIAL">FILTER: OFFICIAL DOCS</option>
                        </select>
                    </div>

                    {/* Threat Filter */}
                    <div className="relative group">
                        <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        <select
                            value={filterThreat}
                            onChange={(e) => setFilterThreat(e.target.value as any)}
                            className="bg-black border border-zinc-700 text-zinc-300 text-xs font-mono py-1.5 pl-3 pr-8 rounded-none outline-none appearance-none cursor-pointer hover:border-white min-w-[150px]"
                        >
                            <option value="ALL">THREAT: ALL LEVELS</option>
                            <option value="INFO">THREAT: INFO ONLY</option>
                            <option value="CAUTION">THREAT: CAUTION ONLY</option>
                            <option value="CRITICAL">THREAT: CRITICAL ONLY</option>
                        </select>
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
                            <span>EVENTS: <span className="text-white font-bold">{events.length}</span></span>
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
                                ? 'bg-red-900/10 text-red-500 border-red-900 hover:bg-red-900/20'
                                : 'bg-white text-black border-white hover:bg-zinc-200'
                                }`}
                        >
                            {isMonitoring ? <Pause className="w-3 h-3 mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                            {isMonitoring ? 'STOP SCAN' : 'INITIATE SCAN'}
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
                        <div className="absolute inset-0 flex items-center justify-center flex-col text-zinc-500 pointer-events-none">
                            <Radio className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-mono text-lg uppercase tracking-widest text-zinc-400">Awaiting Target Selection</p>
                            <p className="text-sm font-mono mt-2">Select an operation to begin surveillance.</p>
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
                    initialContext={cases.find(c => c.id === selectedCaseId) ? { topic: cases.find(c => c.id === selectedCaseId)!.title, summary: cases.find(c => c.id === selectedCaseId)!.description || '' } : undefined}
                    onCancel={() => setSelectedEventForAnalysis(null)}
                    onStart={executeAnalysis}
                />
            )}

        </div>
    );
};
