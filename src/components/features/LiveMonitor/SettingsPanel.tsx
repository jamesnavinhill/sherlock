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
import { DateRangePicker, RangeField } from '@/components/system/controls';
import {
  CompactMenuFooter,
  CompactMenuPanel,
} from '@/components/ui/CompactMenu';

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
    'w-full bg-black p-2 text-zinc-300';

  return (
    <CompactMenuPanel className="absolute top-20 right-6 z-50 w-96 animate-in slide-in-from-top-2 fade-in duration-200">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--osint-shell-border)] bg-[color:var(--osint-shell-panel-action-bg)] px-4 py-3">
        <span className="inline-flex items-center gap-2 osint-meta-label-strong text-[color:var(--osint-text-heading)]">
          <Settings2 className="h-4 w-4 text-osint-primary" />
          Scanner Config
        </span>
        <button onClick={onClose} className="text-zinc-500 transition hover:text-white">
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
            <RangeField
              label="News"
              value={config.newsCount}
              min={0}
              max={10}
              step={1}
              onChange={(nextValue) => updateConfig({ newsCount: nextValue })}
              icon={Newspaper}
              formatValue={(nextValue) => nextValue}
            />
            <RangeField
              label="Social"
              value={config.socialCount}
              min={0}
              max={10}
              step={1}
              onChange={(nextValue) => updateConfig({ socialCount: nextValue })}
              icon={MessageSquare}
              formatValue={(nextValue) => nextValue}
            />
            <RangeField
              label="Official"
              value={config.officialCount}
              min={0}
              max={10}
              step={1}
              onChange={(nextValue) => updateConfig({ officialCount: nextValue })}
              icon={Landmark}
              formatValue={(nextValue) => nextValue}
            />
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
          <DateRangePicker
            value={config.dateRange || {}}
            onChange={(nextValue) =>
              updateConfig({ dateRange: nextValue.start || nextValue.end ? nextValue : undefined })
            }
            label={
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Temporal Constraints
              </span>
            }
            inputClassName={inputClassName}
          />
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
        <CompactMenuFooter className="-mx-5 -mb-5 mt-5">
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
        </CompactMenuFooter>
      </div>
    </CompactMenuPanel>
  );
};
