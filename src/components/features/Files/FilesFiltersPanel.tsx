import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

import type { FilesViewMode, RecordFilter } from './filesViewModel';
import {
  CHROME_TOOLBAR_GROUP_CLASS,
  getChromeSegmentButtonClass,
} from '@/components/ui/chrome';

interface FilesFiltersPanelProps {
  recordFilter: RecordFilter;
  showRecordTypeFilters: boolean;
  viewMode: FilesViewMode;
  onClearFilters: () => void;
  onClose: () => void;
  onRecordFilterChange: (value: RecordFilter) => void;
  onViewModeChange: (value: FilesViewMode) => void;
}

export const FilesFiltersPanel: React.FC<FilesFiltersPanelProps> = ({
  recordFilter,
  showRecordTypeFilters,
  viewMode,
  onClearFilters,
  onClose,
  onRecordFilterChange,
  onViewModeChange,
}) => (
  <div className="osint-panel-shell absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] border border-zinc-700 bg-osint-panel shadow-2xl">
    <div className="border-b border-zinc-800 bg-black px-4 py-3">
      <h3 className="osint-meta-label-strong text-white">Files Filters</h3>
    </div>
    <div className="space-y-5 p-4">
      <div>
        <label className="mb-2 block osint-meta-label">Layout</label>
        <div
          role="group"
          aria-label="Files layout"
          className={`${CHROME_TOOLBAR_GROUP_CLASS} flex items-stretch overflow-hidden`}
        >
          <button
            type="button"
            onClick={() => onViewModeChange('LIST')}
            aria-pressed={viewMode === 'LIST'}
            className={`${getChromeSegmentButtonClass(viewMode === 'LIST')} flex-1 basis-0 items-center justify-center border-r border-zinc-800 px-2.5 py-1.5`}
            title="Show dense list view"
            aria-label="Show dense list view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('GRID')}
            aria-pressed={viewMode === 'GRID'}
            className={`${getChromeSegmentButtonClass(viewMode === 'GRID')} flex-1 basis-0 items-center justify-center px-2.5 py-1.5`}
            title="Show grid view"
            aria-label="Show grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showRecordTypeFilters ? (
        <div>
          <label className="mb-2 block osint-meta-label">Record Type</label>
          <div className="space-y-2">
            {(['ALL', 'ARTIFACT', 'ITEM'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onRecordFilterChange(value)}
                data-active={recordFilter === value ? 'true' : 'false'}
                className="osint-filter-option osint-meta-label flex w-full items-center justify-between px-3 py-2"
              >
                <span>
                  {value === 'ALL' ? 'All' : value === 'ARTIFACT' ? 'Artifacts' : 'Items'}
                </span>
                {recordFilter === value ? <span>Active</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
        <button onClick={onClearFilters} className="osint-meta-label text-zinc-500 hover:text-white">
          Reset
        </button>
        <button onClick={onClose} className="osint-button-primary px-4 py-1.5 osint-meta-label-strong">
          Apply
        </button>
      </div>
    </div>
  </div>
);
