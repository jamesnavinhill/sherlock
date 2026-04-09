import React from 'react';
import { Bot, Clock3, Shapes, Sparkles, Trash2 } from 'lucide-react';

import type { WorkspaceBoard, WorkspaceItem } from '@/types';
import { Accordion } from '@/components/ui/Accordion';
import { InspectorActionRow, type InspectorActionItem } from '@/components/ui/InspectorActionRow';
import {
  CHROME_ACTION_BUTTON_CLASS,
  CHROME_PANEL_ACTION_ROW_CLASS,
  CHROME_PANEL_HEADER_CLASS,
  CHROME_RAIL_BODY_CLASS,
  CHROME_RAIL_SECTION_SCROLL_CLASS,
  getRailAccordionClassName,
} from '@/components/ui/chrome';
import { boardRefKey, type WorkspaceLibraryEntry } from '@/services/workspace/library';

interface BoardInspectorRailProps {
  inspectorActions: InspectorActionItem[];
  inspectorSections: {
    selection: boolean;
    aiActions: boolean;
    provenance: boolean;
  };
  selectedEntries: WorkspaceLibraryEntry[];
  selectedWorkspaceItem: WorkspaceItem | null;
  activeBoard: WorkspaceBoard | null;
  availableBoardsLength: number;
  aiBusy: boolean;
  aiSummary: string | null;
  onToggleSelection: () => void;
  onToggleAiActions: () => void;
  onToggleProvenance: () => void;
  onShowAgentAndGenerateSummary: () => void;
  onShowAgentAndGenerateNote: () => void;
  onDeleteBoard: () => void;
}

export const BoardInspectorRail: React.FC<BoardInspectorRailProps> = ({
  inspectorActions,
  inspectorSections,
  selectedEntries,
  selectedWorkspaceItem,
  activeBoard,
  availableBoardsLength,
  aiBusy,
  aiSummary,
  onToggleSelection,
  onToggleAiActions,
  onToggleProvenance,
  onShowAgentAndGenerateSummary,
  onShowAgentAndGenerateNote,
  onDeleteBoard,
}) => {
  const title =
    selectedEntries.length === 1
      ? selectedEntries[0].title
      : selectedEntries.length > 1
        ? `${selectedEntries.length} Items Selected`
        : activeBoard?.name || 'Board Selection';

  return (
    <>
      <div className={CHROME_PANEL_HEADER_CLASS}>
        <div className="osint-eyebrow">Inspector</div>
        <div className="mt-1 osint-panel-title">{title}</div>
      </div>
      {inspectorActions.length > 0 ? (
        <div className={CHROME_PANEL_ACTION_ROW_CLASS}>
          <InspectorActionRow actions={inspectorActions} />
        </div>
      ) : null}

      <div className={CHROME_RAIL_BODY_CLASS}>
      <Accordion
        title="Selection"
        icon={Shapes}
        count={selectedEntries.length}
        isOpen={inspectorSections.selection}
        onToggle={onToggleSelection}
        className={getRailAccordionClassName(inspectorSections.selection)}
        contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
      >
        <div className="space-y-2">
          {selectedEntries.length === 0 ? (
            <p className="px-2 py-1 osint-body-quiet italic">
              Select one or more board items to inspect linked Sherlock records.
            </p>
          ) : (
            selectedEntries.map((entry) => (
              <div
                key={boardRefKey(entry)}
                className="osint-panel-item p-3 text-zinc-200"
              >
                <div className="osint-title-inline">{entry.title}</div>
                {entry.description ? (
                  <div className="mt-2 osint-body-quiet">{entry.description}</div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Accordion>

      <Accordion
        title="AI Actions"
        icon={Bot}
        isOpen={inspectorSections.aiActions}
        onToggle={onToggleAiActions}
        className={getRailAccordionClassName(inspectorSections.aiActions)}
        contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
      >
        <div className="space-y-3">
          <button
            onClick={onShowAgentAndGenerateSummary}
            disabled={selectedEntries.length === 0 || aiBusy}
            className={`${CHROME_ACTION_BUTTON_CLASS} w-full disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <Sparkles className="h-4 w-4" />
            Summarize Selection
          </button>
          <button
            onClick={onShowAgentAndGenerateNote}
            disabled={selectedEntries.length === 0 || aiBusy || !!activeBoard?.presentationMode}
            className={`${CHROME_ACTION_BUTTON_CLASS} w-full disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <Bot className="h-4 w-4" />
            Draft Note Card
          </button>
          {aiSummary ? (
            <div className="osint-raised-surface-subtle p-3 osint-body-small">{aiSummary}</div>
          ) : null}
        </div>
      </Accordion>

      <Accordion
        title="Provenance"
        icon={Clock3}
        isOpen={inspectorSections.provenance}
        onToggle={onToggleProvenance}
        className={getRailAccordionClassName(inspectorSections.provenance)}
        contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
      >
        <div className="space-y-3 px-1 py-1 osint-meta-value">
          {selectedWorkspaceItem ? (
            <div className="osint-raised-surface-subtle space-y-3 p-3">
              <div>
                <div className="osint-meta-label">Source</div>
                <div className="mt-1">{selectedWorkspaceItem.provenance?.source || 'USER'}</div>
              </div>
              {selectedWorkspaceItem.provenance?.description ? (
                <div>
                  <div className="osint-meta-label">Notes</div>
                  <div className="mt-1 osint-body-quiet">
                    {selectedWorkspaceItem.provenance.description}
                  </div>
                </div>
              ) : null}
              {selectedWorkspaceItem.provenance?.sourceSessionId ? (
                <div>
                  <div className="osint-meta-label">Chat Session</div>
                  <div className="mt-1">{selectedWorkspaceItem.provenance.sourceSessionId}</div>
                </div>
              ) : null}
              {selectedWorkspaceItem.provenance?.sourceMessageId ? (
                <div>
                  <div className="osint-meta-label">Message</div>
                  <div className="mt-1">{selectedWorkspaceItem.provenance.sourceMessageId}</div>
                </div>
              ) : null}
              {selectedWorkspaceItem.provenance?.sourceArtifactId ? (
                <div>
                  <div className="osint-meta-label">Source Report</div>
                  <div className="mt-1">{selectedWorkspaceItem.provenance.sourceArtifactId}</div>
                </div>
              ) : null}
              {selectedWorkspaceItem.provenance?.sourceHeadlineId ? (
                <div>
                  <div className="osint-meta-label">Source Signal</div>
                  <div className="mt-1">{selectedWorkspaceItem.provenance.sourceHeadlineId}</div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="px-2 py-1 osint-body-quiet italic">
              Select a promoted excerpt, note, link, file, or media item to inspect its origin.
            </p>
          )}
        </div>
      </Accordion>
      </div>

      {activeBoard ? (
        <div className="border-t border-zinc-800 bg-black/20 p-3">
          <button
            onClick={onDeleteBoard}
            disabled={availableBoardsLength <= 1}
            className="osint-button-danger osint-meta-label-strong inline-flex w-full items-center justify-center gap-2 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Delete Board
          </button>
        </div>
      ) : null}
    </>
  );
};
