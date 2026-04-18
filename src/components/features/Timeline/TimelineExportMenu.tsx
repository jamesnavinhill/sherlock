import React from 'react';
import { FileJson, FileText, Save } from 'lucide-react';
import {
  CompactMenuHeader,
  CompactMenuPanel,
  COMPACT_MENU_ICON_CLASS,
  COMPACT_MENU_ITEM_CLASS,
  COMPACT_MENU_ITEM_DIVIDER_CLASS,
} from '@/components/ui/CompactMenu';

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
  <CompactMenuPanel className="absolute right-0 top-full z-50 mt-1 min-w-[220px]">
    <CompactMenuHeader>Timeline Snapshot</CompactMenuHeader>
    <button
      onClick={onExportMarkdown}
      className={`${COMPACT_MENU_ITEM_CLASS} ${COMPACT_MENU_ITEM_DIVIDER_CLASS}`}
      title="Export the visible timeline snapshot as Markdown"
    >
      <FileText className={COMPACT_MENU_ICON_CLASS} />
      <div>
        <div className="osint-menu-item-title">Timeline Markdown</div>
        <div className="osint-menu-item-description">Readable visible timeline export</div>
      </div>
    </button>
    <button
      onClick={onExportJson}
      className={`${COMPACT_MENU_ITEM_CLASS} ${COMPACT_MENU_ITEM_DIVIDER_CLASS}`}
      title="Export the visible timeline snapshot as JSON"
    >
      <FileJson className={COMPACT_MENU_ICON_CLASS} />
      <div>
        <div className="osint-menu-item-title">Timeline JSON</div>
        <div className="osint-menu-item-description">Raw visible timeline data for backup</div>
      </div>
    </button>
    <button
      onClick={onSaveSnapshot}
      className={COMPACT_MENU_ITEM_CLASS}
      title="Save the current timeline snapshot as a TIMELINE artifact"
    >
      <Save className={COMPACT_MENU_ICON_CLASS} />
      <div>
        <div className="osint-menu-item-title">Save Snapshot</div>
        <div className="osint-menu-item-description">Store this view in the dossier</div>
      </div>
    </button>
  </CompactMenuPanel>
);
