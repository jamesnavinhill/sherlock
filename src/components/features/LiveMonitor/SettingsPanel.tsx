import React from 'react';
import type { MonitorConfig } from '../../../services/runtime';
import {
  Check,
  Settings2,
  X,
  Trash2,
  Newspaper,
  MessageSquare,
  Landmark,
  Calendar,
  Save,
} from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: MonitorConfig;
  onConfigChange: (config: MonitorConfig) => void;
  selectedLevels: Array<'ALL' | 'INFO' | 'CAUTION' | 'CRITICAL'>;
  onLevelsChange: (levels: Array<'ALL' | 'INFO' | 'CAUTION' | 'CRITICAL'>) => void;
  onClearFeed: () => void;
  autoSave: boolean;
  onAutoSaveChange: (value: boolean) => void;
}

/**
 * Configuration panel for the Live Monitor scanner settings.
 * Controls batch sizes, date ranges, priority sources, and auto-save.
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  config,
  onConfigChange,
  selectedLevels,
  onLevelsChange,
  onClearFeed,
  autoSave,
  onAutoSaveChange,
}) => {
  if (!isOpen) return null;

  const updateConfig = (updates: Partial<MonitorConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const levelOptions = [
    { value: 'ALL', label: 'All' },
    { value: 'INFO', label: 'Info' },
    { value: 'CAUTION', label: 'Caution' },
    { value: 'CRITICAL', label: 'Critical' },
  ] as const;
  const inputClassName =
    'osint-meta-value w-full border border-zinc-700 bg-black p-2 outline-none focus:border-osint-primary';

  return (
    <div className="absolute top-20 right-6 z-50 w-96 bg-osint-panel border border-zinc-700 shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-black">
        <h3 className="osint-panel-title flex items-center">
          <Settings2 className="w-4 h-4 mr-2 text-osint-primary" />
          Scanner Config
        </h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Counts */}
        <div>
          <label className="osint-meta-label mb-3 block">
            Batch Size Configuration
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="osint-meta-value flex items-center">
                <Newspaper className="w-3 h-3 mr-2" /> News
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={config.newsCount}
                onChange={(e) => updateConfig({ newsCount: parseInt(e.target.value) })}
                className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-osint-primary"
              />
              <span className="osint-meta-value w-4 text-right">{config.newsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="osint-meta-value flex items-center">
                <MessageSquare className="w-3 h-3 mr-2" /> Social
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={config.socialCount}
                onChange={(e) => updateConfig({ socialCount: parseInt(e.target.value) })}
                className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-osint-primary"
              />
              <span className="osint-meta-value w-4 text-right">{config.socialCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="osint-meta-value flex items-center">
                <Landmark className="w-3 h-3 mr-2" /> Official
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={config.officialCount}
                onChange={(e) => updateConfig({ officialCount: parseInt(e.target.value) })}
                className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-osint-primary"
              />
              <span className="osint-meta-value w-4 text-right">{config.officialCount}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="osint-meta-label mb-3 block">Levels</label>
          <div className="flex flex-wrap gap-3">
            {levelOptions.map((option) => {
              const checked = selectedLevels.includes(option.value);

              return (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
                  <button
                    type="button"
                    onClick={() => {
                      if (option.value === 'ALL') {
                        onLevelsChange(['ALL']);
                        return;
                      }

                      const withoutAll = selectedLevels.filter((value) => value !== 'ALL');
                      const nextLevels = withoutAll.includes(option.value)
                        ? withoutAll.filter((value) => value !== option.value)
                        : [...withoutAll, option.value];

                      onLevelsChange(
                        nextLevels.length > 0
                          ? (nextLevels as Array<'INFO' | 'CAUTION' | 'CRITICAL'>)
                          : ['ALL']
                      );
                    }}
                    aria-pressed={checked}
                    data-state={checked ? 'on' : 'off'}
                    className="osint-check-toggle h-4 w-4 group-hover:border-zinc-500"
                  >
                    {checked ? <Check className="h-3 w-3" /> : null}
                  </button>
                  <span className="osint-meta-label text-zinc-300">{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="osint-meta-label mb-2 flex items-center">
            <Calendar className="w-3 h-3 mr-1" /> Temporal Constraints
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="date"
                value={config.dateRange?.start || ''}
                onChange={(e) =>
                  updateConfig({ dateRange: { ...config.dateRange, start: e.target.value } })
                }
                className={inputClassName}
                placeholder="Start Date"
              />
            </div>
            <div className="flex-1">
              <input
                type="date"
                value={config.dateRange?.end || ''}
                onChange={(e) =>
                  updateConfig({ dateRange: { ...config.dateRange, end: e.target.value } })
                }
                className={inputClassName}
                placeholder="End Date"
              />
            </div>
          </div>
        </div>

        {/* Priority Sources */}
        <div>
          <label className="osint-meta-label mb-2 block">
            Priority Sources / Handles
          </label>
          <textarea
            value={config.prioritySources}
            onChange={(e) => updateConfig({ prioritySources: e.target.value })}
            placeholder="@elonmusk, nytimes.com, dod.gov"
            className={`${inputClassName} h-20 resize-none placeholder:text-zinc-700`}
          />
          <p className="osint-body-quiet mt-1">
            Comma separated list of domains or handles to prioritize.
          </p>
        </div>

        {/* Auto-Save Toggle */}
        <div className="flex items-center justify-between">
          <label className="osint-meta-label flex items-center">
            <Save className="w-3 h-3 mr-2" /> Auto-Save Headlines
          </label>
          <button
            type="button"
            onClick={() => onAutoSaveChange(!autoSave)}
            aria-pressed={autoSave}
            data-state={autoSave ? 'on' : 'off'}
            className="osint-toggle"
          >
            <div className="osint-toggle-thumb" />
          </button>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={onClearFeed}
            className="osint-meta-label osint-danger-inline flex items-center"
          >
            <Trash2 className="w-3 h-3 mr-1" /> Clear Feed
          </button>
          <button
            onClick={onClose}
            className="osint-button-primary osint-meta-label-strong px-4 py-1.5"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
