import React from 'react';

import type { TimelineRange } from '@/types';
import { OsintSelect } from '@/components/ui/OsintSelect';
import { TRACK_OPTIONS } from './timelineViewUtils';

interface TimelineFiltersPanelProps {
  filters: {
    range: TimelineRange;
    tracks: string[];
  };
  onClearFilters: () => void;
  onClose: () => void;
  onRangeChange: (range: TimelineRange) => void;
  onToggleTrackFilter: (track: (typeof TRACK_OPTIONS)[number]['track']) => void;
}

export const TimelineFiltersPanel: React.FC<TimelineFiltersPanelProps> = ({
  filters,
  onClearFilters,
  onClose,
  onRangeChange,
  onToggleTrackFilter,
}) => (
  <div className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] border border-zinc-700 bg-osint-panel shadow-2xl">
    <div className="border-b border-zinc-800 bg-black px-4 py-3">
      <h3 className="osint-meta-label-strong text-white">Timeline Filters</h3>
    </div>
    <div className="space-y-5 p-4">
      <div>
        <label className="mb-2 block osint-meta-label">Date Range</label>
        <OsintSelect
          ariaLabel="Timeline date range"
          value={filters.range}
          onChange={(value) => onRangeChange(value as TimelineRange)}
          triggerClassName="px-3 py-2 pr-8 osint-meta-value"
          options={[
            { value: 'ALL', label: 'All Activity' },
            { value: '7D', label: 'Last 7 Days' },
            { value: '30D', label: 'Last 30 Days' },
            { value: '90D', label: 'Last 90 Days' },
          ]}
        />
      </div>

      <div>
        <label className="mb-2 block osint-meta-label">Visible Tracks</label>
        <div className="space-y-2">
          {TRACK_OPTIONS.map((option) => (
            <label
              key={option.track}
              className="flex items-center justify-between border border-zinc-800 bg-black px-3 py-2 osint-meta-value text-zinc-300"
            >
              <span className="flex items-center gap-2">
                <option.icon className="h-4 w-4 text-zinc-500" />
                {option.label}
              </span>
              <input
                type="checkbox"
                checked={filters.tracks.includes(option.track)}
                onChange={() => onToggleTrackFilter(option.track)}
                className="h-4 w-4 accent-[var(--osint-primary)]"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
        <button
          onClick={onClearFilters}
          className="osint-meta-label text-zinc-500 hover:text-white"
        >
          Reset
        </button>
        <button
          onClick={onClose}
          className="osint-button-primary px-4 py-1.5 osint-meta-label-strong"
        >
          Apply
        </button>
      </div>
    </div>
  </div>
);
