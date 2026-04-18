import React from 'react';
import { FileJson, FileText, Save } from 'lucide-react';

interface TimelineExportMenuProps {
  onExportJson: () => void;
  onExportMarkdown: () => void;
  onSaveSnapshot: () => void;
}

export const TimelineExportMenu: React.FC<TimelineExportMenuProps> = ({
  onExportJson,
  onExportMarkdown,
  onSaveSnapshot,
}) => (
  <div className="osint-menu-panel absolute right-0 top-full z-50 mt-1 min-w-[220px] border border-[color:var(--osint-shell-border)] bg-[color:var(--osint-shell-panel-bg)]">
    <button
      onClick={onExportMarkdown}
      className="osint-menu-item flex w-full items-center border-b border-[color:var(--osint-shell-border)] px-4 py-3 text-left"
      title="Export the visible timeline snapshot as Markdown"
    >
      <FileText className="osint-menu-item-icon mr-3 h-4 w-4 text-[color:var(--osint-text-meta)]" />
      <div>
        <div className="osint-menu-item-title">Timeline Markdown</div>
        <div className="osint-menu-item-description">Readable visible timeline export</div>
      </div>
    </button>
    <button
      onClick={onExportJson}
      className="osint-menu-item flex w-full items-center border-b border-[color:var(--osint-shell-border)] px-4 py-3 text-left"
      title="Export the visible timeline snapshot as JSON"
    >
      <FileJson className="osint-menu-item-icon mr-3 h-4 w-4 text-[color:var(--osint-text-meta)]" />
      <div>
        <div className="osint-menu-item-title">Timeline JSON</div>
        <div className="osint-menu-item-description">Raw visible timeline data for backup</div>
      </div>
    </button>
    <button
      onClick={onSaveSnapshot}
      className="osint-menu-item flex w-full items-center px-4 py-3 text-left"
      title="Save the current timeline snapshot as a TIMELINE artifact"
    >
      <Save className="osint-menu-item-icon mr-3 h-4 w-4 text-[color:var(--osint-text-meta)]" />
      <div>
        <div className="osint-menu-item-title">Save Snapshot</div>
        <div className="osint-menu-item-description">Store this view in the dossier</div>
      </div>
    </button>
  </div>
);
