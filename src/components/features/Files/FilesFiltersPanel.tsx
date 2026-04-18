import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

import type { FilesViewMode, RecordFilter } from './filesViewModel';
import {
  CompactMenuBody,
  CompactMenuFooter,
  CompactMenuHeader,
  CompactMenuPanel,
} from '@/components/ui/CompactMenu';
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
  <CompactMenuPanel className="absolute right-0 top-full z-50 mt-1 w-[min(20rem,calc(100vw-2rem))]">
    <CompactMenuHeader>Files Filters</CompactMenuHeader>
    <CompactMenuBody className="space-y-5">
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
    </CompactMenuBody>
    <CompactMenuFooter>
      <button onClick={onClearFilters} className="osint-meta-label text-zinc-500 hover:text-white">
        Reset
      </button>
      <button onClick={onClose} className="osint-button-primary px-4 py-1.5 osint-meta-label-strong">
        Apply
      </button>
    </CompactMenuFooter>
  </CompactMenuPanel>
);
