import React from 'react';
import { BookmarkPlus, Briefcase, ChevronDown, Download, Filter, PanelRight } from 'lucide-react';

import type { TimelineRange, TimelineTrack, Workspace } from '@/types';
import { OsintSelect } from '@/components/ui/OsintSelect';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import {
  CHROME_HEADER_CLASS,
  CHROME_HEADER_ICON_BUTTON_SIZE_CLASS,
  CHROME_HEADER_LEADING_GROUP_CLASS,
  CHROME_HEADER_SELECT_TRIGGER_CLASS,
  CHROME_HEADER_SELECT_WRAP_CLASS,
  getChromeMenuButtonClass,
  getChromeToggleButtonClass,
} from '@/components/ui/chrome';
import { CANONICAL_NOUNS, getWorkspaceDisplayTitle } from '@/domain';
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
  canSaveCurrentView: boolean;
  exportMenuRef: React.RefObject<HTMLDivElement | null>;
  filterMenuRef: React.RefObject<HTMLDivElement | null>;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onWorkspaceChange: (workspaceId: string | null) => void;
  onSearchChange: (value: string) => void;
  onToggleExportMenu: () => void;
  onToggleFilters: () => void;
  onSaveView: () => void;
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
  canSaveCurrentView,
  exportMenuRef,
  filterMenuRef,
  onToggleLeftPanel,
  onToggleRightPanel,
  onWorkspaceChange,
  onSearchChange,
  onToggleExportMenu,
  onToggleFilters,
  onSaveView,
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
      <div className={CHROME_HEADER_LEADING_GROUP_CLASS}>
        <button
          onClick={onToggleLeftPanel}
          className={`flex ${CHROME_HEADER_ICON_BUTTON_SIZE_CLASS} ${getChromeToggleButtonClass(leftPanelOpen)}`}
          title="Toggle timeline dossier"
        >
          <Briefcase className="h-4 w-4" />
        </button>

        <div className={CHROME_HEADER_SELECT_WRAP_CLASS}>
          <OsintSelect
            ariaLabel="Timeline workspace"
            value={activeWorkspace?.id || ''}
            onChange={(value) => onWorkspaceChange(value || null)}
            placeholder={`Select ${CANONICAL_NOUNS.workspace.toLowerCase()}`}
            chrome="toolbar"
            triggerClassName={CHROME_HEADER_SELECT_TRIGGER_CLASS}
            options={workspaces.map((workspace) => ({
              value: workspace.id,
              label: getWorkspaceDisplayTitle(workspace),
            }))}
          />
        </div>
      </div>

      <div className="flex min-w-[12rem] flex-[0.95_1_24rem] items-center justify-center">
        <GlobalSearch compact className="mx-auto w-full" />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
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
            aria-label="Timeline filters"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden lg:inline">Filters</span>
          </button>

          {showFilters ? (
            <TimelineFiltersPanel
              filters={filters}
              search={search}
              onClose={onCloseFilters}
              onClearFilters={onClearFilters}
              onRangeChange={onRangeChange}
              onSearchChange={onSearchChange}
              onToggleTrackFilter={onToggleTrackFilter}
            />
          ) : null}
        </div>

        <button
          onClick={onSaveView}
          disabled={!canSaveCurrentView}
          className={`inline-flex shrink-0 items-center px-3 py-1.5 osint-meta-label-strong transition ${
            canSaveCurrentView
              ? 'osint-button-chrome'
              : 'cursor-not-allowed border border-zinc-800 bg-zinc-950 text-zinc-600'
          }`}
          title={
            canSaveCurrentView
              ? 'Save the current timeline query as a durable omnibox view'
              : 'Change search, range, tracks, or focus before saving a timeline view'
          }
        >
          <BookmarkPlus className="mr-1 h-4 w-4" />
          <span className="hidden lg:inline">Save View</span>
        </button>

        <button
          onClick={onToggleRightPanel}
          className={`flex shrink-0 ${getChromeToggleButtonClass(rightPanelOpen)}`}
          title="Toggle event details"
        >
          <PanelRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  </header>
);
