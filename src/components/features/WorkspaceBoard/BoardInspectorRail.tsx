import React from 'react';
import { Bot, Clock3, Shapes, Sparkles, Trash2 } from 'lucide-react';

import type { WorkspaceBoard, WorkspaceItem } from '@/types';
import { Accordion } from '@/components/ui/Accordion';
import { InspectorActionRow, type InspectorActionItem } from '@/components/ui/InspectorActionRow';
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
}) => (
  <>
    {inspectorActions.length > 0 ? (
      <div className="border-b border-zinc-800 bg-zinc-900/10 px-4 py-3">
        <InspectorActionRow actions={inspectorActions} layout="wrap" />
      </div>
    ) : null}

    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
      <Accordion
        title="Selection"
        icon={Shapes}
        count={selectedEntries.length}
        isOpen={inspectorSections.selection}
        onToggle={onToggleSelection}
      >
        <div className="space-y-2">
          {selectedEntries.length === 0 ? (
            <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
              Select one or more board items to inspect linked Sherlock records.
            </p>
          ) : (
            selectedEntries.map((entry) => (
              <div
                key={boardRefKey(entry)}
                className="border border-zinc-800 bg-zinc-900/40 p-3 text-zinc-200"
              >
                <div className="text-xs font-bold uppercase tracking-wide text-osint-ink">
                  {entry.title}
                </div>
                {entry.description ? (
                  <div className="mt-2 text-xs leading-5 text-zinc-400">{entry.description}</div>
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
      >
        <div className="space-y-3">
          <button
            onClick={onShowAgentAndGenerateSummary}
            disabled={selectedEntries.length === 0 || aiBusy}
            className="osint-button-primary inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            Summarize Selection
          </button>
          <button
            onClick={onShowAgentAndGenerateNote}
            disabled={selectedEntries.length === 0 || aiBusy || !!activeBoard?.presentationMode}
            className="osint-button-primary inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Bot className="h-4 w-4" />
            Draft Note Card
          </button>
          {aiSummary ? <div className="bg-black/40 p-3 text-xs leading-6 text-zinc-300">{aiSummary}</div> : null}
        </div>
      </Accordion>

      <Accordion
        title="Provenance"
        icon={Clock3}
        isOpen={inspectorSections.provenance}
        onToggle={onToggleProvenance}
      >
        <div className="space-y-3 px-1 py-1 text-xs font-mono text-zinc-300">
          {selectedWorkspaceItem ? (
            <>
              <div>
                <div className="text-[10px] uppercase text-zinc-500">Source</div>
                <div className="mt-1">{selectedWorkspaceItem.provenance?.source || 'USER'}</div>
              </div>
              {selectedWorkspaceItem.provenance?.description ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Notes</div>
                  <div className="mt-1 leading-relaxed text-zinc-400">
                    {selectedWorkspaceItem.provenance.description}
                  </div>
                </div>
              ) : null}
              {selectedWorkspaceItem.provenance?.sourceSessionId ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Chat Session</div>
                  <div className="mt-1">{selectedWorkspaceItem.provenance.sourceSessionId}</div>
                </div>
              ) : null}
              {selectedWorkspaceItem.provenance?.sourceMessageId ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Message</div>
                  <div className="mt-1">{selectedWorkspaceItem.provenance.sourceMessageId}</div>
                </div>
              ) : null}
              {selectedWorkspaceItem.provenance?.sourceReportId ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Source Report</div>
                  <div className="mt-1">{selectedWorkspaceItem.provenance.sourceReportId}</div>
                </div>
              ) : null}
              {selectedWorkspaceItem.provenance?.sourceHeadlineId ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Source Signal</div>
                  <div className="mt-1">{selectedWorkspaceItem.provenance.sourceHeadlineId}</div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
              Select a promoted excerpt, note, link, file, or media item to inspect its origin.
            </p>
          )}
        </div>
      </Accordion>

      {activeBoard ? (
        <div className="mt-3 border border-zinc-800 bg-zinc-900/20 p-3">
          <button
            onClick={onDeleteBoard}
            disabled={availableBoardsLength <= 1}
            className="osint-button-danger inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Delete Board
          </button>
        </div>
      ) : null}
    </div>
  </>
);
