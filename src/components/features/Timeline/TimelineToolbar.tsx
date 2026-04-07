import React from 'react';
import {
  Briefcase,
  ChevronDown,
  Download,
  Filter,
  PanelRight,
  Search,
} from 'lucide-react';

import type { TimelineRange, TimelineTrack, Workspace } from '@/types';
import { OsintSelect } from '@/components/ui/OsintSelect';
import {
  CHROME_HEADER_CLASS,
  getChromeMenuButtonClass,
  getChromeToggleButtonClass,
} from '@/components/ui/chrome';
import { CANONICAL_NOUNS, getWorkspaceDisplayTitle } from '@/domain';
import { buildTimelineSearchPlaceholder } from './timelineViewUtils';
import { TimelineExportMenu } from './TimelineExportMenu';
import { TimelineFiltersPanel } from './TimelineFiltersPanel';

interface TimelineFiltersState {
  range: TimelineRange;
  tracks: string[];
}

interface TimelineToolbarProps {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  search: string;
  filters: TimelineFiltersState;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  showExportMenu: boolean;
  showFilters: boolean;
  timelineSnapshotAvailable: boolean;
  exportMenuRef: React.RefObject<HTMLDivElement | null>;
  filterMenuRef: React.RefObject<HTMLDivElement | null>;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onWorkspaceChange: (workspaceId: string | null) => void;
  onSearchChange: (value: string) => void;
  onToggleExportMenu: () => void;
  onToggleFilters: () => void;
  onCloseFilters: () => void;
  onClearFilters: () => void;
  onRangeChange: (range: TimelineRange) => void;
  onToggleTrackFilter: (track: TimelineTrack) => void;
  onExportTimelineMarkdown: () => void;
  onExportTimelineJson: () => void;
  onSaveTimelineArtifact: () => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  activeWorkspace,
  workspaces,
  search,
  filters,
  leftPanelOpen,
  rightPanelOpen,
  showExportMenu,
  showFilters,
  timelineSnapshotAvailable,
  exportMenuRef,
  filterMenuRef,
  onToggleLeftPanel,
  onToggleRightPanel,
  onWorkspaceChange,
  onSearchChange,
  onToggleExportMenu,
  onToggleFilters,
  onCloseFilters,
  onClearFilters,
  onRangeChange,
  onToggleTrackFilter,
  onExportTimelineMarkdown,
  onExportTimelineJson,
  onSaveTimelineArtifact,
}) => (
  <header className={`${CHROME_HEADER_CLASS} px-6`}>
    <div className="flex h-full min-w-0 items-center gap-3">
      <button
        onClick={onToggleLeftPanel}
        className={`flex shrink-0 ${getChromeToggleButtonClass(leftPanelOpen)}`}
        title="Toggle timeline dossier"
      >
        <Briefcase className="h-4 w-4" />
      </button>

      <div className="w-full min-w-[220px] max-w-[320px] shrink-0">
        <OsintSelect
          ariaLabel="Timeline workspace"
          value={activeWorkspace?.id || ''}
          onChange={(value) => onWorkspaceChange(value || null)}
          placeholder={`Select ${CANONICAL_NOUNS.workspace.toLowerCase()}`}
          triggerClassName="py-1.5 pl-3 pr-8 text-xs font-mono"
          options={workspaces.map((workspace) => ({
            value: workspace.id,
            label: getWorkspaceDisplayTitle(workspace),
          }))}
        />
      </div>

      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={buildTimelineSearchPlaceholder(CANONICAL_NOUNS.artifactPlural)}
          className="w-full border border-zinc-700 bg-black py-1.5 pl-9 pr-3 text-xs font-mono text-zinc-300 outline-none transition hover:border-osint-primary focus:border-osint-primary"
        />
      </div>

      <div className="relative shrink-0" ref={exportMenuRef}>
        <button
          onClick={onToggleExportMenu}
          disabled={!timelineSnapshotAvailable}
          className={getChromeMenuButtonClass(showExportMenu)}
          title="Export or save the current timeline snapshot"
        >
          <Download className="mr-1 h-4 w-4" />
          <span className="hidden lg:inline">Export</span>
          <ChevronDown className="ml-1 h-3 w-3" />
        </button>
        {showExportMenu && timelineSnapshotAvailable ? (
          <TimelineExportMenu
            onExportMarkdown={onExportTimelineMarkdown}
            onExportJson={onExportTimelineJson}
            onSaveSnapshot={onSaveTimelineArtifact}
          />
        ) : null}
      </div>

      <div className="relative shrink-0" ref={filterMenuRef}>
        <button
          onClick={onToggleFilters}
          className={getChromeMenuButtonClass(showFilters)}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden lg:inline">Filters</span>
        </button>

        {showFilters ? (
          <TimelineFiltersPanel
            filters={filters}
            onClose={onCloseFilters}
            onClearFilters={onClearFilters}
            onRangeChange={onRangeChange}
            onToggleTrackFilter={onToggleTrackFilter}
          />
        ) : null}
      </div>

      <button
        onClick={onToggleRightPanel}
        className={`flex shrink-0 ${getChromeToggleButtonClass(rightPanelOpen)}`}
        title="Toggle event details"
      >
        <PanelRight className="h-4 w-4" />
      </button>
    </div>
  </header>
);
