import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import type {
  MonitorEvent,
  InvestigationLaunchRequest,
  Headline,
  SystemConfig,
} from '../../../types';
import type { MonitorConfig } from '../../../services/runtime';
import { getLiveWorkspaceIntel } from '../../../services/runtime';
import { getAllScopes, getScopeById } from '../../../data/presets';
import { Play, Pause, Activity, Settings2, Radar } from 'lucide-react';
import { RunSetupModal } from '../Runs/RunSetupModal';
import { BackgroundMatrixRain } from '../../ui/BackgroundMatrixRain';
import { MainContentDotGrid } from '../../ui/MainContentDotGrid';
import { OsintSelect } from '../../ui/OsintSelect';
import { GlobalSearch } from '../../ui/GlobalSearch';
import { SkeletonPulse } from '../../ui/SkeletonLoaders';
import { SystemStatusBeacon } from '../../ui/SystemStatusBeacon';
import { PageShell } from '@/components/system/layout/PageShell';
import {
  CHROME_CARD_SURFACE_CLASS,
  CHROME_CARD_SECTION_SUBTLE_CLASS,
  CHROME_HEADER_CONTROL_HEIGHT_CLASS,
  CHROME_HEADER_CLASS,
  CHROME_HEADER_LEADING_GROUP_CLASS,
  CHROME_HEADER_SELECT_TRIGGER_CLASS,
  CHROME_HEADER_SELECT_WRAP_CLASS,
  getChromeHeaderIconButtonClass,
} from '../../ui/chrome';
import {
  getDomainPackForScope,
  getLabelProfileById,
  getWorkspaceDisplayTitle,
} from '../../../domain';
import {
  getStoredLiveMonitorAutosave,
  setStoredLiveMonitorAutosave,
} from '../../../utils/localStorage';

// Sub-components
import { SettingsPanel } from './SettingsPanel';
import { EventCard } from './EventCard';

interface LiveMonitorProps {
  events: MonitorEvent[];
  setEvents: React.Dispatch<React.SetStateAction<MonitorEvent[]>>;
  onInvestigate: (request: InvestigationLaunchRequest) => void;
}

const MonitorEventCardSkeleton: React.FC<{ active: boolean }> = ({ active }) => (
  <div className={`${CHROME_CARD_SURFACE_CLASS} flex min-h-[17rem] flex-col gap-3 p-5`}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <SkeletonPulse className="h-4 w-4 rounded-none" />
        <SkeletonPulse className="h-3 w-16 rounded-none" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonPulse className="h-6 w-20 rounded-none" />
        <SkeletonPulse className="h-6 w-16 rounded-none" />
      </div>
    </div>
    <div className="space-y-3">
      <SkeletonPulse className="h-5 w-32 rounded-none" />
      <SkeletonPulse className="h-3 w-full rounded-none" />
      <SkeletonPulse className="h-3 w-11/12 rounded-none" />
      <SkeletonPulse className="h-3 w-3/4 rounded-none" />
    </div>
    <div className={`${CHROME_CARD_SECTION_SUBTLE_CLASS} mt-auto flex items-center justify-center px-4 py-6`}>
      <SystemStatusBeacon active={active} dotTestId="monitor-skeleton-status-dot" />
    </div>
    <div className={`${CHROME_CARD_SECTION_SUBTLE_CLASS} mt-auto flex items-center justify-between px-3 py-3`}>
      <SkeletonPulse className="h-3 w-16 rounded-none" />
      <SkeletonPulse className="h-3 w-24 rounded-none" />
    </div>
  </div>
);

/**
 * Live Monitor component for real-time OSINT surveillance.
 * Streams events from various sources (news, social, official) and allows investigation.
 */
export const LiveMonitor: React.FC<LiveMonitorProps> = ({
  events = [],
  setEvents,
  onInvestigate,
}) => {
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

  type ThreatFilter = 'ALL' | 'INFO' | 'CAUTION' | 'CRITICAL';

  // Monitoring State
  const [isMonitoring, setIsMonitoring] = useState(false);
  const isMonitoringRef = useRef(false);
  const [streamStatus, setStreamStatus] = useState<'IDLE' | 'SCANNING' | 'RECEIVING'>('IDLE');

  // Filter & UI State
  const [selectedLevels, setSelectedLevels] = useState<ThreatFilter[]>(['ALL']);
  const [showSettings, setShowSettings] = useState(false);

  // Configuration State
  const [feedConfig, setFeedConfig] = useState<MonitorConfig>({
    newsCount: 3,
    socialCount: 3,
    officialCount: 2,
    prioritySources: '',
    dateRange: { start: '', end: '' },
  });

  // Auto-Save State
  const [autoSave, setAutoSave] = useState(() => getStoredLiveMonitorAutosave());

  // Event Expansion State
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Memoized saved headlines IDs for quick check
  const savedHeadlineIds = useMemo(
    () => new Set(headlines.map((h) => h.id.replace('headline-', ''))),
    [headlines]
  );

  // Task Selection State
  const [selectedEventForAnalysis, setSelectedEventForAnalysis] = useState<MonitorEvent | null>(
    null
  );
  const selectedCase = useMemo(
    () => workspaces.find((c) => c.id === selectedCaseId) ?? null,
    [workspaces, selectedCaseId]
  );
  const activeScope = useMemo(() => {
    return (
      getScopeById(activeScopeId || '') ||
      getAllScopes(customScopes).find((scope) => scope.id === activeScopeId)
    );
  }, [activeScopeId, customScopes]);
  const activePack = useMemo(
    () => getDomainPackForScope(activeScope, customScopes),
    [activeScope, customScopes]
  );
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

    const activeCase = workspaces.find((c) => c.id === selectedCaseId);
    if (!activeCase) {
      resetState();
      return;
    }

    try {
      const existingContent = safeEvents.map((e) => e.content);
      const newIntel = await getLiveWorkspaceIntel(
        getWorkspaceDisplayTitle(activeCase),
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
        console.error('Invalid intel format received', newIntel);
        setStreamStatus('IDLE');
        setIsMonitoring(false);
        isMonitoringRef.current = false;
        return;
      }

      const uniqueNewIntel = newIntel.filter(
        (item) =>
          !safeEvents.some(
            (existing) => existing.content === item.content || existing.id === item.id
          )
      );

      if (uniqueNewIntel.length === 0) {
        setTimeout(() => resetState(), 1000);
        return;
      }

      let maxDelay = 0;
      uniqueNewIntel.forEach((item, i) => {
        const delay = i * 800 + Math.random() * 400;
        maxDelay = Math.max(maxDelay, delay);

        setTimeout(() => {
          if (isMonitoringRef.current) {
            setEvents((prev) => [item, ...prev]);
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
      console.error('Scan error', e);
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
        workspaceId: selectedCaseId,
        content: event.content,
        source: event.sourceName,
        url: event.url,
        timestamp: event.timestamp,
        type: event.type,
        threatLevel: event.threatLevel,
        status: 'PENDING',
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
      ? {
          topic: selectedCase.title,
          summary: selectedCase.description || 'Live monitoring operation',
        }
      : undefined;

    onInvestigate({
      topic,
      parentContext: context,
      configOverride,
      preseededEntities,
      scope,
      dateRangeOverride: dateRange,
      launchSource: 'LIVE_MONITOR_EVENT',
      sourceSignalId: selectedEventForAnalysis
        ? `headline-${selectedEventForAnalysis.id}`
        : undefined,
    });
    setSelectedEventForAnalysis(null);
  };

  const handleClearFeed = () => {
    setEvents([]);
  };

  const handleAutoSaveChange = (value: boolean) => {
    setAutoSave(value);
    setStoredLiveMonitorAutosave(value);
  };

  const getFilteredEvents = () => {
    if (selectedLevels.includes('ALL') || selectedLevels.length === 0) {
      return safeEvents;
    }

    return safeEvents.filter((event) =>
      selectedLevels.includes(event.threatLevel as Exclude<ThreatFilter, 'ALL'>)
    );
  };
  const filteredEvents = getFilteredEvents();
  const showSkeletonGrid = filteredEvents.length === 0;
  const skeletonActive = isMonitoring || streamStatus !== 'IDLE';

  // --- RENDER ---

  return (
    <PageShell
      className="osint-shell-stage h-screen w-full overflow-hidden relative"
      toolbar={
        <div className={`${CHROME_HEADER_CLASS} relative px-6`}>
          <div className="flex h-full min-w-0 items-center gap-3">
            <div className={CHROME_HEADER_LEADING_GROUP_CLASS}>
              <div className={CHROME_HEADER_SELECT_WRAP_CLASS}>
                <OsintSelect
                  ariaLabel={`${labelProfile.workspaceLabel} selector`}
                  menuTitle={labelProfile.workspaceLabel}
                  value={selectedCaseId || ''}
                  onChange={setSelectedCaseId}
                  disabled={isMonitoring}
                  chrome="toolbar"
                  triggerClassName={CHROME_HEADER_SELECT_TRIGGER_CLASS}
                  options={[
                    { value: '', label: 'None Selected' },
                    ...workspaces.map((workspace) => ({
                      value: workspace.id,
                      label: getWorkspaceDisplayTitle(workspace),
                    })),
                  ]}
                />
              </div>
            </div>

            <div className="flex min-w-[12rem] flex-[0.95_1_24rem] items-center justify-center">
              <GlobalSearch compact className="mx-auto w-full" />
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={getChromeHeaderIconButtonClass(showSettings)}
                title="Configure Feed Parameters"
                aria-label="Configure Feed Parameters"
              >
                <Settings2 className="w-4 h-4" />
              </button>

              {selectedCaseId && (
                <button
                  onClick={isMonitoring ? stopMonitoring : runBatchScan}
                  className={`flex ${CHROME_HEADER_CONTROL_HEIGHT_CLASS} w-[30px] items-center justify-center p-0 text-xs font-bold font-mono transition-all border uppercase ${
                    isMonitoring ? 'osint-button-danger' : 'osint-button-primary'
                  }`}
                  title={isMonitoring ? 'Stop scan' : 'Scan'}
                  aria-label={isMonitoring ? 'Stop scan' : 'Scan'}
                >
                  {isMonitoring ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            <SettingsPanel
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              config={feedConfig}
              onConfigChange={setFeedConfig}
              selectedLevels={selectedLevels}
              onLevelsChange={setSelectedLevels}
              onClearFeed={handleClearFeed}
              autoSave={autoSave}
              onAutoSaveChange={handleAutoSaveChange}
            />
          </div>
        </div>
      }
    >
      <div className="flex-1 flex overflow-hidden relative">
        <div className="osint-shell-content-surface absolute inset-0 z-0">
          <MainContentDotGrid testId="monitor-dot-grid-background" />
          {isMonitoring || streamStatus !== 'IDLE' ? <BackgroundMatrixRain /> : null}
        </div>

        <div className="flex-1 relative z-10 flex flex-col overflow-hidden">
          {streamStatus === 'SCANNING' && (
            <div className="flex items-center justify-center mb-6 pt-6 animate-in fade-in zoom-in duration-300">
              <div className="px-4 py-2 bg-black/60 border border-osint-primary/50 text-osint-primary font-mono text-xs uppercase flex items-center rounded-full backdrop-blur-sm">
                <Radar className="w-3 h-3 mr-2 animate-spin" />
                Scanning Frequencies...
              </div>
            </div>
          )}

          {streamStatus === 'RECEIVING' && (
            <div className="flex items-center justify-center mb-6 pt-6 animate-in fade-in zoom-in duration-300">
              <div className="px-4 py-2 bg-black/60 border border-green-500/50 text-green-400 font-mono text-xs uppercase flex items-center rounded-full backdrop-blur-sm">
                <Activity className="w-3 h-3 mr-2 animate-pulse" />
                Receiving Data Stream...
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-8" data-app-scroll-region>
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {showSkeletonGrid
                ? Array.from({ length: 6 }).map((_, index) => (
                    <MonitorEventCardSkeleton key={`monitor-skeleton-${index}`} active={skeletonActive} />
                  ))
                : filteredEvents.map((event) => (
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

      {selectedEventForAnalysis && (
        <RunSetupModal
          initialTopic={selectedEventForAnalysis.content}
          initialContext={
            selectedCase
              ? { topic: selectedCase.title, summary: selectedCase.description || '' }
              : undefined
          }
          initialScopeId={activeScopeId || undefined}
          onCancel={() => setSelectedEventForAnalysis(null)}
          onStart={executeAnalysis}
        />
      )}
    </PageShell>
  );
};
