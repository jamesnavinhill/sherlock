import React, { useEffect, useState, useRef } from 'react';
import { scanForAnomalies } from '../../services/gemini';
import { FeedItem } from '../../types';
import { AlertTriangle, RefreshCw, Search, ArrowRight, Filter, MapPin, Tag, Calendar, X, Globe, Plus, LayoutDashboard, Settings2 } from 'lucide-react';
import { BackgroundMatrixRain } from '../ui/BackgroundMatrixRain';
import { TaskSetupModal } from '../ui/TaskSetupModal';

const STORAGE_KEY_FINDER_RESULTS = 'sherlock_finder_results';

interface FeedProps {
  onInvestigate: (topic: string, context?: { topic: string, summary: string }) => void;
}

const CATEGORIES = ['All', 'Defense', 'Healthcare', 'Infrastructure', 'Technology', 'Education', 'Environment'];

import { MatrixCardLoader } from '../ui/MatrixCardLoader';

export const Feed: React.FC<FeedProps> = ({ onInvestigate }) => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

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

  // Load persisted results on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FINDER_RESULTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted finder results', e);
    }
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    // Slight artificial delay to show off the matrix effect if data loads too fast
    const minTime = new Promise(resolve => setTimeout(resolve, 1500));

    const dateRange = filterStartDate || filterEndDate ? { start: filterStartDate, end: filterEndDate } : undefined;
    const dataPromise = scanForAnomalies(filterRegion, filterCategory, dateRange, config);

    const [_, data] = await Promise.all([minTime, dataPromise]);

    setItems(data);
    // Persist results to localStorage
    try {
      localStorage.setItem(STORAGE_KEY_FINDER_RESULTS, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to persist finder results', e);
    }
    setLoading(false);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuery.trim()) {
      onInvestigate(customQuery);
    }
  };

  const handleApplyFilters = () => {
    loadFeed();
    setShowDatePicker(false);
    setShowFilters(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-osint-danger border-osint-danger/30 bg-osint-danger/10';
      case 'MEDIUM': return 'text-osint-warn border-osint-warn/30 bg-osint-warn/10';
      default: return 'text-zinc-400 border-zinc-700 bg-zinc-900';
    }
  };

  // --- SETTINGS PANEL ---
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState({
    limit: 8,
    prioritySources: '',
    autoRefresh: false,
    refreshInterval: 60000 // default 1 minute
  });

  // Background Polling Effect
  useEffect(() => {
    let intervalId: any;
    if (config.autoRefresh && !loading) {
      intervalId = setInterval(() => {
        loadFeed();
      }, config.refreshInterval);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [config.autoRefresh, config.refreshInterval, loading]);

  const renderSettingsPanel = () => (
    <div className="absolute top-20 right-6 z-50 w-96 bg-osint-panel border border-zinc-700 shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-black">
        <h3 className="text-white font-mono font-bold uppercase text-sm flex items-center">
          <Settings2 className="w-4 h-4 mr-2 text-osint-primary" />
          Scanner Config
        </h3>
        <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Counts */}
        <div>
          <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-3">Result Limit Configuration</label>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-zinc-300 font-mono">
              <LayoutDashboard className="w-3 h-3 mr-2" /> Items to Find
            </div>
            <div className="flex gap-2">
              {[4, 8, 12, 16].map(num => (
                <button
                  key={num}
                  onClick={() => setConfig({ ...config, limit: num })}
                  className={`w-8 h-6 flex items-center justify-center text-[10px] font-mono border transition-all ${config.limit === num ? 'bg-osint-primary text-black border-osint-primary font-bold' : 'bg-transparent text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Sources */}
        <div>
          <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-2">Priority Sources</label>
          <textarea
            value={config.prioritySources}
            onChange={(e) => setConfig({ ...config, prioritySources: e.target.value })}
            placeholder="nytimes.com, @elonmusk, dod.gov..."
            className="w-full h-20 bg-black border border-zinc-700 text-xs text-zinc-300 p-2 font-mono focus:border-osint-primary outline-none resize-none placeholder-zinc-700"
          />
          <p className="text-[9px] text-zinc-600 mt-1 font-mono">Sources to prioritize during anomaly detection.</p>
        </div>

        {/* Polling Toggle */}
        <div className="pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] text-zinc-500 font-mono uppercase">Background Surveillance</label>
            <button
              onClick={() => setConfig({ ...config, autoRefresh: !config.autoRefresh })}
              className={`w-12 h-6 rounded-full relative transition-colors ${config.autoRefresh ? 'bg-osint-primary' : 'bg-zinc-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.autoRefresh ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          {config.autoRefresh && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600 font-mono">Interval</span>
              <select
                value={config.refreshInterval}
                onChange={(e) => setConfig({ ...config, refreshInterval: parseInt(e.target.value) })}
                className="bg-black border border-zinc-800 text-zinc-400 text-[10px] font-mono px-2 py-1 outline-none"
              >
                <option value={30000}>30 SECONDS</option>
                <option value={60000}>1 MINUTE</option>
                <option value={300000}>5 MINUTES</option>
              </select>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={() => setConfig({ limit: 8, prioritySources: '' })}
            className="text-xs font-mono text-zinc-500 hover:text-white flex items-center uppercase"
          >
            Reset Defaults
          </button>
          <button
            onClick={() => { setShowSettings(false); loadFeed(); }}
            className="px-4 py-1.5 bg-white text-black text-xs font-mono font-bold uppercase hover:bg-zinc-200"
          >
            Apply & Scan
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-black relative overflow-hidden">
      <BackgroundMatrixRain />

      {/* Investigation Wizard Modal */}
      {selectedItem && (
        <TaskSetupModal
          initialTopic={selectedItem.title}
          onCancel={() => setSelectedItem(null)}
          onStart={(topic, config) => {
            onInvestigate(topic);
            setSelectedItem(null);
          }}
        />
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 h-20 px-6 bg-black/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between shadow-lg flex-shrink-0 gap-4">

        {/* Search & Filters Group */}
        <div className="flex-1 flex items-center space-x-2 min-w-0">
          {/* Category Filter */}
          <div className="relative hidden md:block w-40">
            <Tag className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-black border border-zinc-700 text-zinc-300 text-xs pl-7 py-1.5 pr-2 font-mono focus:border-osint-primary outline-none appearance-none cursor-pointer hover:border-zinc-500"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Region Filter */}
          <div className="relative hidden md:block w-32">
            <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
            <input
              type="text"
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              placeholder="Region"
              className="w-full bg-black border border-zinc-700 text-zinc-300 text-xs pl-7 py-1.5 font-mono focus:border-osint-primary outline-none hover:border-zinc-500"
            />
          </div>

          {/* Date Filter */}
          <div className="relative hidden md:block w-40">
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full flex items-center bg-black border border-zinc-700 text-zinc-300 text-xs px-2 py-1.5 font-mono focus:border-osint-primary outline-none hover:border-zinc-500 truncate"
            >
              <Calendar className="w-3 h-3 mr-2 text-zinc-300" />
              <span className="truncate">{filterStartDate || filterEndDate ? `${filterStartDate} > ${filterEndDate}` : 'Time Range'}</span>
            </button>

            {/* Date Picker Popover */}
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-black border border-zinc-600 p-4 shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 p-1.5 text-xs font-mono focus:border-osint-primary outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">End Date</label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 p-1.5 text-xs font-mono focus:border-osint-primary outline-none cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={() => { setShowDatePicker(false); loadFeed(); }} className="px-3 py-1 bg-osint-primary text-black text-[10px] font-bold uppercase font-mono">Apply</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-zinc-800 mx-2 hidden md:block"></div>

          {/* Search */}
          <div className="relative group max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-osint-primary transition-colors" />
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Search targets..."
              className="w-full bg-black border border-zinc-700 text-white pl-10 pr-4 py-1.5 text-xs font-mono focus:outline-none focus:border-osint-primary transition-all"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3">
          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 border transition-all ${showSettings ? 'bg-zinc-800 border-white text-white' : 'bg-black border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'}`}
            title="Configure Scanner"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          <button
            onClick={loadFeed}
            disabled={loading}
            className="flex items-center px-4 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white text-xs font-mono font-bold uppercase transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {showSettings && renderSettingsPanel()}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative z-10 custom-scrollbar">

        {/* Mobile Search (visible only on small screens) */}
        <div className="md:hidden mb-6">
          <form onSubmit={handleCustomSearch} className="flex gap-2">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-zinc-900 border border-zinc-700 text-white px-4 py-3 text-sm font-mono focus:border-osint-primary outline-none"
            />
            <button type="submit" className="bg-osint-primary text-black px-4"><Search className="w-5 h-5" /></button>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className="bg-zinc-800 text-white px-4 border border-zinc-700"><Filter className="w-5 h-5" /></button>
          </form>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-20">
          {items.length === 0 ? (
            // Placeholder / Empty State or Loading State
            Array.from({ length: 8 }).map((_, i) => (
              <MatrixCardLoader key={i} active={loading} />
            ))
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="h-full bg-osint-panel border border-zinc-800 p-6 hover:border-osint-primary transition-all cursor-pointer group flex flex-col hover:bg-zinc-900/80 animate-in fade-in slide-in-from-bottom-2 duration-500 backdrop-blur-sm"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 border ${getRiskColor(item.riskLevel)} font-mono`}>
                    {item.riskLevel}
                  </span>
                  <span className="text-xs text-zinc-600 font-mono">{item.timestamp}</span>
                </div>

                <h3 className="text-lg font-bold text-zinc-200 mb-2 group-hover:text-white transition-colors line-clamp-2 h-14 overflow-hidden">
                  {item.title}
                </h3>

                <div className="mt-auto pt-4 flex items-center justify-between text-sm text-zinc-500 border-t border-zinc-800">
                  <span className="font-mono text-xs uppercase">{item.category}</span>
                  <span className="flex items-center text-osint-primary opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono uppercase tracking-wider">
                    Analyze <ArrowRight className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};