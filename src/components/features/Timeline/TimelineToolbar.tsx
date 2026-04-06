import React from 'react';
import {
  Briefcase,
  ChevronDown,
  Download,
  FileJson,
  FileText,
  Filter,
  PanelRight,
  Save,
  Search,
} from 'lucide-react';

import type { LabelProfile, TimelineRange, Workspace } from '@/types';
import { OsintSelect } from '@/components/ui/OsintSelect';
import { sanitizeDisplayTitle } from '@/domain';
import { buildTimelineSearchPlaceholder, TRACK_OPTIONS } from './timelineViewUtils';

interface TimelineFiltersState {
  range: TimelineRange;
  tracks: string[];
}

interface TimelineToolbarProps {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  labelProfile: LabelProfile;
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
  onToggleTrackFilter: (track: typeof TRACK_OPTIONS[number]['track']) => void;
  onExportTimelineMarkdown: () => void;
  onExportTimelineJson: () => void;
  onSaveTimelineArtifact: () => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  activeWorkspace,
  workspaces,
  labelProfile,
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
  <header className="sticky top-0 z-30 h-20 border-b border-zinc-800 bg-black/95 px-6 backdrop-blur-md">
    <div className="flex h-full min-w-0 items-center gap-3">
      <button
        onClick={onToggleLeftPanel}
        className={`flex shrink-0 items-center justify-center border p-2 text-xs font-mono uppercase transition ${
          leftPanelOpen
            ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
            : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
        }`}
        title="Toggle timeline dossier"
      >
        <Briefcase className="h-4 w-4" />
      </button>

      <div className="w-full min-w-[220px] max-w-[320px] shrink-0">
        <OsintSelect
          ariaLabel={`${labelProfile.workspaceLabel} timeline workspace`}
          value={activeWorkspace?.id || ''}
          onChange={(value) => onWorkspaceChange(value || null)}
          placeholder={`Select ${labelProfile.workspaceLabel.toLowerCase()}`}
          triggerClassName="py-1.5 pl-3 pr-8 text-xs font-mono"
          options={workspaces.map((workspace) => ({
            value: workspace.id,
            label: sanitizeDisplayTitle(workspace.title),
          }))}
        />
      </div>

      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={buildTimelineSearchPlaceholder(labelProfile.artifactLabelPlural)}
          className="w-full border border-zinc-700 bg-black py-1.5 pl-9 pr-3 text-xs font-mono text-zinc-300 outline-none transition hover:border-osint-primary focus:border-osint-primary"
        />
      </div>

      <div className="relative shrink-0" ref={exportMenuRef}>
        <button
          onClick={onToggleExportMenu}
          disabled={!timelineSnapshotAvailable}
          className={`flex items-center px-3 py-1.5 font-mono text-xs font-bold uppercase ${
            showExportMenu ? 'osint-button-chrome-active' : 'osint-button-chrome'
          }`}
          title="Export or save the current timeline snapshot"
        >
          <Download className="mr-1 h-4 w-4" />
          <span className="hidden lg:inline">Export</span>
          <ChevronDown className="ml-1 h-3 w-3" />
        </button>
        {showExportMenu && timelineSnapshotAvailable ? (
          <div className="osint-menu-panel absolute right-0 top-full z-50 mt-1 min-w-[220px] border border-zinc-700 bg-zinc-900">
            <button
              onClick={onExportTimelineMarkdown}
              className="osint-menu-item flex w-full items-center border-b border-zinc-800 px-4 py-3 text-left text-xs font-mono text-zinc-300"
              title="Export the visible timeline snapshot as Markdown"
            >
              <FileText className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
              <div>
                <div className="font-bold">Timeline Markdown</div>
                <div className="text-[10px] text-zinc-500">Readable visible timeline export</div>
              </div>
            </button>
            <button
              onClick={onExportTimelineJson}
              className="osint-menu-item flex w-full items-center border-b border-zinc-800 px-4 py-3 text-left text-xs font-mono text-zinc-300"
              title="Export the visible timeline snapshot as JSON"
            >
              <FileJson className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
              <div>
                <div className="font-bold">Timeline JSON</div>
                <div className="text-[10px] text-zinc-500">Raw visible timeline data for backup</div>
              </div>
            </button>
            <button
              onClick={onSaveTimelineArtifact}
              className="osint-menu-item flex w-full items-center px-4 py-3 text-left text-xs font-mono text-zinc-300"
              title="Save the current timeline snapshot as a TIMELINE artifact"
            >
              <Save className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
              <div>
                <div className="font-bold">Save Snapshot</div>
                <div className="text-[10px] text-zinc-500">Store this view in the dossier</div>
              </div>
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative shrink-0" ref={filterMenuRef}>
        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-2 border px-3 py-1.5 text-xs font-mono uppercase transition ${
            showFilters ? 'osint-button-chrome-active' : 'osint-button-chrome'
          }`}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden lg:inline">Filters</span>
        </button>

        {showFilters ? (
          <div className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] border border-zinc-700 bg-osint-panel shadow-2xl">
            <div className="border-b border-zinc-800 bg-black px-4 py-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">
                Timeline Filters
              </h3>
            </div>
            <div className="space-y-5 p-4">
              <div>
                <label className="mb-2 block text-[10px] font-mono uppercase text-zinc-500">
                  Date Range
                </label>
                <OsintSelect
                  ariaLabel="Timeline date range"
                  value={filters.range}
                  onChange={(value) => onRangeChange(value as TimelineRange)}
                  triggerClassName="px-3 py-2 pr-8 text-xs font-mono"
                  options={[
                    { value: 'ALL', label: 'All Activity' },
                    { value: '7D', label: 'Last 7 Days' },
                    { value: '30D', label: 'Last 30 Days' },
                    { value: '90D', label: 'Last 90 Days' },
                  ]}
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-mono uppercase text-zinc-500">
                  Visible Tracks
                </label>
                <div className="space-y-2">
                  {TRACK_OPTIONS.map((option) => (
                    <label
                      key={option.track}
                      className="flex items-center justify-between border border-zinc-800 bg-black px-3 py-2 text-xs font-mono text-zinc-300"
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
                  className="text-xs font-mono uppercase text-zinc-500 hover:text-white"
                >
                  Reset
                </button>
                <button
                  onClick={onCloseFilters}
                  className="osint-button-primary px-4 py-1.5 text-xs font-mono font-bold uppercase"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <button
        onClick={onToggleRightPanel}
        className={`flex shrink-0 items-center justify-center border p-2 text-xs font-mono uppercase transition ${
          rightPanelOpen
            ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
            : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
        }`}
        title="Toggle event details"
      >
        <PanelRight className="h-4 w-4" />
      </button>
    </div>
  </header>
);
