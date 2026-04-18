import React from 'react';

import type { TimelineRange } from '@/types';
import { OsintSelect } from '@/components/ui/OsintSelect';
import {
  CompactMenuBody,
  CompactMenuFooter,
  CompactMenuHeader,
  CompactMenuPanel,
} from '@/components/ui/CompactMenu';
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
  <CompactMenuPanel className="absolute right-0 top-full z-50 mt-1 w-[min(20rem,calc(100vw-2rem))]">
    <CompactMenuHeader>Timeline Filters</CompactMenuHeader>
    <CompactMenuBody className="space-y-5">
      <div>
        <label className="mb-2 block osint-meta-label">Date Range</label>
        <OsintSelect
          ariaLabel="Timeline date range"
          menuTitle="Date Range"
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
          {TRACK_OPTIONS.map((option) => {
            const isActive = filters.tracks.includes(option.track);

            return (
              <label
                key={option.track}
                data-active={isActive ? 'true' : 'false'}
                className="osint-filter-option flex items-center justify-between px-3 py-2 osint-meta-value"
              >
                <span className="flex items-center gap-2">
                  <option.icon className="osint-filter-option-icon h-4 w-4" />
                  {option.label}
                </span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => onToggleTrackFilter(option.track)}
                  className="h-4 w-4 accent-[var(--osint-primary)]"
                />
              </label>
            );
          })}
        </div>
      </div>
    </CompactMenuBody>
    <CompactMenuFooter>
      <button
        onClick={onClearFilters}
        className="osint-meta-label text-[color:var(--osint-text-meta)] hover:text-[color:var(--osint-text-heading)]"
      >
        Reset
      </button>
      <button
        onClick={onClose}
        className="osint-button-primary px-4 py-1.5 osint-meta-label-strong"
      >
        Apply
      </button>
    </CompactMenuFooter>
  </CompactMenuPanel>
);
