import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { scanForDiscoveries } from '../../services/runtime';
import type { FeedItem, InvestigationLaunchRequest } from '../../types';
import {
  RefreshCw,
  ArrowRight,
  Filter,
  MapPin,
  Tag,
  Calendar,
  X,
  LayoutDashboard,
  Settings2,
} from 'lucide-react';
import { BackgroundMatrixRain } from '../ui/BackgroundMatrixRain';
import { RunSetupModal } from './Runs/RunSetupModal';
import { MatrixCardLoader } from '../ui/MatrixCardLoader';
import { OsintSelect } from '../ui/OsintSelect';
import { GlobalSearch } from '../ui/GlobalSearch';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { getScopeById, getAllScopes, BUILTIN_SCOPES } from '../../data/presets';
import { CHROME_HEADER_CLASS, getChromeMenuButtonClass } from '../ui/chrome';

interface FeedProps {
  onInvestigate: (request: InvestigationLaunchRequest) => void;
}

const DEFAULT_CATEGORIES = [
  'All',
  'Cybersecurity',
  'Geopolitics',
  'Finance',
  'Infrastructure',
  'Military',
  'Social Unrest',
  'Other',
];

export const Feed: React.FC<FeedProps> = ({ onInvestigate }) => {
  const {
    feedItems,
    feedConfig,
    setFeedItems,
    setFeedConfig,
    activeScope: activeScopeId,
    customScopes,
  } = useWorkspaceStore();
  const [loading, setLoading] = useState(false);

  // Resolve active scope
  const activeScope = useMemo(() => {
    return (
      getScopeById(activeScopeId || '') ||
      getAllScopes(customScopes).find((s) => s.id === activeScopeId) ||
      BUILTIN_SCOPES[0]
    );
  }, [activeScopeId, customScopes]);
  // Dynamic categories from scope
  const categories = useMemo(() => {
    if (activeScope?.categories && activeScope.categories.length > 0) {
      return ['All', ...activeScope.categories];
    }
    return DEFAULT_CATEGORIES;
  }, [activeScope]);

  // Selected item for investigation wizard
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);

  // Filter state
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Date Range State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    // Slight artificial delay to show off the matrix effect if data loads too fast
    const minTime = new Promise((resolve) => setTimeout(resolve, 1500));

    const dateRange =
      filterStartDate || filterEndDate ? { start: filterStartDate, end: filterEndDate } : undefined;
    const dataPromise = scanForDiscoveries(
      filterRegion,
      filterCategory,
      dateRange,
      feedConfig,
      activeScope,
      {
        packId: activeScope?.id,
        purposeId: activeScope?.defaultPurposeId,
      }
    );

    const [_, data] = await Promise.all([minTime, dataPromise]);

    setFeedItems(data);
    setLoading(false);
  }, [
    feedConfig,
    filterCategory,
    filterEndDate,
    filterRegion,
    filterStartDate,
    setFeedItems,
    activeScope,
  ]);

  const handleApplyFilters = () => {
    loadFeed();
    setShowDatePicker(false);
    setShowFilters(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'text-osint-danger border-osint-danger/30 bg-osint-danger/10';
      case 'MEDIUM':
        return 'text-osint-warn border-osint-warn/30 bg-osint-warn/10';
      default:
        return 'text-zinc-400 border-zinc-700 bg-zinc-900';
    }
  };

  // --- SETTINGS PANEL ---
  const [showSettings, setShowSettings] = useState(false);

  // Background Polling Effect
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (feedConfig.autoRefresh && !loading) {
      intervalId = setInterval(() => {
        loadFeed();
      }, feedConfig.refreshInterval);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [feedConfig.autoRefresh, feedConfig.refreshInterval, loading, loadFeed]);

  const renderSettingsPanel = () => (
    <div className="absolute top-20 right-6 z-50 w-96 bg-osint-panel border border-zinc-700 shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-black">
        <h3 className="text-white font-mono font-bold uppercase text-sm flex items-center">
          <Settings2 className="w-4 h-4 mr-2 text-osint-primary" />
          Discovery Config
        </h3>
        <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Counts */}
        <div>
          <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-3">
            Result Limit Configuration
          </label>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-zinc-300 font-mono">
              <LayoutDashboard className="w-3 h-3 mr-2" /> Items to Find
            </div>
            <div className="flex gap-2">
              {[4, 8, 12, 16].map((num) => (
                <button
                  key={num}
                  onClick={() => setFeedConfig({ ...feedConfig, limit: num })}
                  className={`w-8 h-6 flex items-center justify-center text-[10px] font-mono border transition-all ${feedConfig.limit === num ? 'osint-button-soft font-bold' : 'bg-transparent text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Sources */}
        <div>
          <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-2">
            Priority Sources
          </label>
          <textarea
            value={feedConfig.prioritySources}
            onChange={(e) => setFeedConfig({ ...feedConfig, prioritySources: e.target.value })}
            placeholder="nytimes.com, @elonmusk, dod.gov..."
            className="w-full h-20 bg-black border border-zinc-700 text-xs text-zinc-300 p-2 font-mono focus:border-osint-primary outline-none resize-none placeholder-zinc-700"
          />
          <p className="text-[9px] text-zinc-600 mt-1 font-mono">
            Sources to prioritize during discovery for this pack.
          </p>
        </div>

        {/* Polling Toggle */}
        <div className="pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] text-zinc-500 font-mono uppercase">
              Background Watch
            </label>
            <button
              type="button"
              onClick={() => setFeedConfig({ ...feedConfig, autoRefresh: !feedConfig.autoRefresh })}
              aria-pressed={feedConfig.autoRefresh}
              data-state={feedConfig.autoRefresh ? 'on' : 'off'}
              className="osint-toggle"
            >
              <div className="osint-toggle-thumb" />
            </button>
          </div>
          {feedConfig.autoRefresh && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600 font-mono">Interval</span>
              <div className="w-28">
                <OsintSelect
                  ariaLabel="Auto-refresh interval"
                  value={String(feedConfig.refreshInterval)}
                  onChange={(value) =>
                    setFeedConfig({ ...feedConfig, refreshInterval: parseInt(value, 10) })
                  }
                  triggerClassName="px-2 py-1 pr-8 font-mono text-[10px] text-zinc-400"
                  options={[
                    { value: '30000', label: '30 SECONDS' },
                    { value: '60000', label: '1 MINUTE' },
                    { value: '300000', label: '5 MINUTES' },
                  ]}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={() =>
              setFeedConfig({
                limit: 8,
                prioritySources: '',
                autoRefresh: false,
                refreshInterval: 60000,
              })
            }
            className="text-xs font-mono text-zinc-500 hover:text-white flex items-center uppercase"
          >
            Reset Defaults
          </button>
          <button
            onClick={() => {
              setShowSettings(false);
              loadFeed();
            }}
            className="osint-button-primary px-4 py-1.5 text-xs font-mono font-bold uppercase"
          >
            Apply & Scan
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-black relative overflow-hidden">
      {loading ? <BackgroundMatrixRain /> : null}

      {/* Investigation Wizard Modal */}
      {selectedItem && (
        <RunSetupModal
          initialTopic={selectedItem.title}
          initialScopeId={activeScope?.id}
          onCancel={() => setSelectedItem(null)}
          onStart={(topic, configOverride, preseededEntities, scope, dateRange) => {
            onInvestigate({
              topic,
              configOverride,
              preseededEntities,
              scope: scope || activeScope,
              dateRangeOverride: dateRange,
              launchSource: 'FEED_WIZARD',
            });
            setSelectedItem(null);
          }}
        />
      )}

      {/* Sticky Header */}
      <div className={`${CHROME_HEADER_CLASS} px-6`}>
        <div className="flex h-full min-w-0 items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {/* Category Filter */}
            <div className="relative hidden w-36 md:block">
              <Tag className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
              <OsintSelect
                ariaLabel="Feed category"
                value={filterCategory}
                onChange={setFilterCategory}
                triggerClassName="py-1.5 pl-7 pr-8 text-xs font-mono"
                options={categories.map((category) => ({
                  value: category,
                  label: category,
                }))}
              />
            </div>

            {/* Region Filter */}
            <div className="relative hidden w-28 md:block">
              <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
              <input
                type="text"
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                placeholder="Region"
                className="w-full bg-black border border-zinc-700 text-zinc-300 text-xs pl-7 py-1.5 font-mono focus:border-osint-primary outline-none hover:border-osint-primary"
              />
            </div>

            {/* Date Filter */}
            <div className="relative hidden w-36 md:block">
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="osint-button-chrome w-full flex items-center text-xs px-2 py-1.5 font-mono truncate"
              >
                <Calendar className="w-3 h-3 mr-2 text-zinc-300" />
                <span className="truncate">
                  {filterStartDate || filterEndDate
                    ? `${filterStartDate} > ${filterEndDate}`
                    : 'Time Range'}
                </span>
              </button>

              {/* Date Picker Popover */}
              {showDatePicker && (
                <div className="osint-menu-panel absolute top-full left-0 mt-2 w-64 bg-black border border-zinc-600 p-4 z-50 animate-in fade-in zoom-in duration-200">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                        className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 p-1.5 text-xs font-mono focus:border-osint-primary outline-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                        className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 p-1.5 text-xs font-mono focus:border-osint-primary outline-none cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          setShowDatePicker(false);
                          loadFeed();
                        }}
                        className="osint-button-primary px-3 py-1 text-[10px] font-bold uppercase font-mono"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex min-w-[12rem] flex-[0.95_1_24rem] items-center justify-center">
            <GlobalSearch compact className="mx-auto w-full" />
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <button
              onClick={() => setShowFilters((current) => !current)}
              className={`md:hidden ${getChromeMenuButtonClass(showFilters)}`}
              title="Open discovery filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={getChromeMenuButtonClass(showSettings)}
              title="Configure Scanner"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden lg:inline ml-1">Config</span>
            </button>

            <button
              onClick={loadFeed}
              disabled={loading}
              className="osint-button-chrome flex items-center px-4 py-1.5 text-xs font-mono font-bold uppercase"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {showSettings && renderSettingsPanel()}

          {/* Mobile Filter Panel Overlay */}
          {showFilters && (
            <div className="absolute top-20 left-0 right-0 z-40 bg-osint-panel border-b border-zinc-700 p-4 md:hidden shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-mono font-bold uppercase text-sm flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-osint-primary" />
                  Active Filters
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Mobile Category */}
                <div>
                  <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">
                    Category
                  </label>
                  <OsintSelect
                    ariaLabel="Feed category mobile"
                    value={filterCategory}
                    onChange={setFilterCategory}
                    triggerClassName="px-2 py-2 pr-8 text-xs font-mono"
                    options={categories.map((category) => ({
                      value: category,
                      label: category,
                    }))}
                  />
                </div>

                {/* Mobile Region */}
                <div>
                  <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">
                    Region
                  </label>
                  <input
                    type="text"
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    placeholder="e.g. Asia-Pacific"
                    className="w-full bg-black border border-zinc-700 text-zinc-300 text-xs px-2 py-2 font-mono focus:border-osint-primary outline-none"
                  />
                </div>

                {/* Mobile Date Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full bg-black border border-zinc-700 text-zinc-300 text-xs px-2 py-2 font-mono focus:border-osint-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full bg-black border border-zinc-700 text-zinc-300 text-xs px-2 py-2 font-mono focus:border-osint-primary outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleApplyFilters}
                    className="osint-button-primary w-full py-2 font-bold font-mono text-xs uppercase"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative z-10 custom-scrollbar">
        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-20">
          {feedItems.length === 0
            ? // Placeholder / Empty State or Loading State
              Array.from({ length: 8 }).map((_, i) => <MatrixCardLoader key={i} active={loading} />)
            : feedItems.map((item) => (
                <div
                  key={item.id}
                  className="h-full bg-osint-panel border border-zinc-800 p-5 hover:border-osint-primary transition-all cursor-pointer group flex flex-col hover:bg-zinc-900/80 animate-in fade-in slide-in-from-bottom-2 duration-500 backdrop-blur-sm"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 border ${getRiskColor(item.riskLevel)} font-mono`}
                    >
                      {item.riskLevel}
                    </span>
                    <span className="text-xs text-zinc-600 font-mono">{item.timestamp}</span>
                  </div>

                  <h3 className="text-lg font-semibold text-zinc-200 mb-3 group-hover:text-white transition-colors line-clamp-2 min-h-[3.5rem]">
                    {item.title}
                  </h3>

                  <p className="line-clamp-3 text-sm leading-6 text-zinc-500">
                    {`${item.category} discovery ready for workspace triage and follow-up synthesis.`}
                  </p>

                  <div className="mt-auto pt-4 flex items-center justify-between text-sm text-zinc-500 border-t border-zinc-800">
                    <span className="font-mono text-xs uppercase">{item.category}</span>
                    <span className="flex items-center text-osint-primary opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono uppercase tracking-wider">
                      Open In Synthesis <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};
