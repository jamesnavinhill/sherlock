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
  <div className="osint-menu-panel absolute right-0 top-full z-50 mt-1 min-w-[220px] border border-zinc-700 bg-zinc-900">
    <button
      onClick={onExportMarkdown}
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
      onClick={onExportJson}
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
      onClick={onSaveSnapshot}
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
);
