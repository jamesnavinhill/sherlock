import React from 'react';

import type { TimelineRange } from '@/types';

interface TimelineWorkbenchPanelProps {
  activeTracks: string[];
  canSaveCurrentView: boolean;
  onClearFilters: () => void;
  onExportTimelineJson: () => void;
  onExportTimelineMarkdown: () => void;
  onSaveTimelineArtifact: () => void;
  onSaveView: () => void;
  range: TimelineRange;
  timelineSnapshotAvailable: boolean;
  totalEventCount: number;
  visibleEventCount: number;
  workspaceTitle: string;
}

export const TimelineWorkbenchPanel: React.FC<TimelineWorkbenchPanelProps> = ({
  activeTracks,
  canSaveCurrentView,
  onClearFilters,
  onExportTimelineJson,
  onExportTimelineMarkdown,
  onSaveTimelineArtifact,
  onSaveView,
  range,
  timelineSnapshotAvailable,
  totalEventCount,
  visibleEventCount,
  workspaceTitle,
}) => (
  <>
    <section className="osint-card-section rounded p-4">
      <div className="osint-meta-label">Timeline Workspace</div>
      <div className="mt-2 osint-title-inline">{workspaceTitle}</div>
      <div className="mt-3 grid gap-2">
        <div className="osint-card-section-subtle rounded px-3 py-2">
          <div className="osint-meta-label">Visible Events</div>
          <div className="mt-1 osint-body-quiet">
            {visibleEventCount} of {totalEventCount}
          </div>
        </div>
        <div className="osint-card-section-subtle rounded px-3 py-2">
          <div className="osint-meta-label">Range</div>
          <div className="mt-1 osint-body-quiet">{range}</div>
        </div>
        <div className="osint-card-section-subtle rounded px-3 py-2">
          <div className="osint-meta-label">Tracks</div>
          <div className="mt-1 osint-body-quiet">{activeTracks.join(', ')}</div>
        </div>
      </div>
    </section>

    <section className="osint-card-section rounded p-4">
      <div className="osint-meta-label">Saved Views</div>
      <div className="mt-2 osint-title-inline">Durable Query Actions</div>
      <div className="mt-3 grid gap-2">
        <button
          type="button"
          onClick={onSaveView}
          disabled={!canSaveCurrentView}
          className="osint-settings-surface-button px-3 py-2 text-left osint-meta-label disabled:opacity-50"
        >
          Save Current View
        </button>
        <button
          type="button"
          onClick={onClearFilters}
          className="osint-settings-surface-button px-3 py-2 text-left osint-meta-label"
        >
          Clear Filters
        </button>
      </div>
    </section>

    <section className="osint-card-section rounded p-4">
      <div className="osint-meta-label">Snapshot Export</div>
      <div className="mt-2 osint-title-inline">Timeline Snapshot</div>
      <div className="mt-3 grid gap-2">
        <button
          type="button"
          onClick={onExportTimelineMarkdown}
          disabled={!timelineSnapshotAvailable}
          className="osint-settings-surface-button px-3 py-2 text-left osint-meta-label disabled:opacity-50"
        >
          Export Markdown
        </button>
        <button
          type="button"
          onClick={onExportTimelineJson}
          disabled={!timelineSnapshotAvailable}
          className="osint-settings-surface-button px-3 py-2 text-left osint-meta-label disabled:opacity-50"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={onSaveTimelineArtifact}
          disabled={!timelineSnapshotAvailable}
          className="osint-settings-surface-button px-3 py-2 text-left osint-meta-label disabled:opacity-50"
        >
          Save Snapshot Artifact
        </button>
      </div>
    </section>
  </>
);
