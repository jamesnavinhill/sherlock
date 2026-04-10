import React from 'react';
import { Bot, Clock3, FilePlus2, Shapes, Sparkles, Trash2 } from 'lucide-react';

import type { WorkspaceBoard, WorkspaceItem } from '@/types';
import { GlobalInspectorPanel } from '@/components/features/Inspector/GlobalInspectorPanel';
import type {
  GlobalInspectorSection,
  GlobalInspectorTab,
} from '@/components/features/Inspector/globalInspectorTypes';
import type { InspectorActionItem } from '@/components/ui/InspectorActionRow';
import { INSPECTOR_ACTION_SHORT_LABELS } from '@/components/ui/inspectorActionLabels';
import { AppIcon } from '@/lib/appIcons';
import { BOARD_AGENT_STARTER_INTENTS } from '@/services/workspace/agent';
import {
  CHROME_RAIL_SECTION_SCROLL_CLASS,
  CHROME_THIN_NESTED_ITEM_CLASS,
} from '@/components/ui/chrome';
import { boardRefKey, type WorkspaceLibraryEntry } from '@/services/workspace/library';
import type { RightPanelView } from './workspaceBoardUtils';

interface WorkspaceBoardInspectorPanelProps {
  isOpen: boolean;
  tabs: GlobalInspectorTab[];
  activeTabId: RightPanelView;
  onTabChange: (tabId: RightPanelView) => void;
  inspectorActions: InspectorActionItem[];
  inspectorSections: {
    selection: boolean;
    provenance: boolean;
  };
  selectedEntries: WorkspaceLibraryEntry[];
  selectedWorkspaceItem: WorkspaceItem | null;
  activeBoard: WorkspaceBoard | null;
  availableBoardsLength: number;
  aiBusy: boolean;
  onToggleSelection: () => void;
  onToggleProvenance: () => void;
  onShowAgentAndGenerateSummary: () => void;
  onShowAgentAndGenerateNote: () => void;
  onOpenAgentStarterIntent: (prompt: string) => void;
  onDeleteBoard: () => void;
}

export const WorkspaceBoardInspectorPanel: React.FC<WorkspaceBoardInspectorPanelProps> = ({
  isOpen,
  tabs,
  activeTabId,
  onTabChange,
  inspectorActions,
  inspectorSections,
  selectedEntries,
  selectedWorkspaceItem,
  activeBoard,
  availableBoardsLength,
  aiBusy,
  onToggleSelection,
  onToggleProvenance,
  onShowAgentAndGenerateSummary,
  onShowAgentAndGenerateNote,
  onOpenAgentStarterIntent,
  onDeleteBoard,
}) => {
  const shouldWrapSelectionDescription = (entry: WorkspaceLibraryEntry) =>
    entry.kind === 'SOURCE' || entry.kind === 'LINK' || typeof entry.url === 'string';

  const title =
    selectedEntries.length === 1
      ? selectedEntries[0].title
      : selectedEntries.length > 1
        ? `${selectedEntries.length} Items Selected`
        : activeBoard?.name || 'Board Selection';
  const starterIntents = BOARD_AGENT_STARTER_INTENTS.filter((intent) => intent.id !== 'draft-note');
  const actionItems: InspectorActionItem[] = [
    ...inspectorActions,
    {
      id: 'board-ai-summary',
      label: 'Generate Summary',
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.summary,
      icon: Sparkles,
      onClick: onShowAgentAndGenerateSummary,
      disabled: selectedEntries.length === 0 || aiBusy,
    },
    {
      id: 'board-ai-note',
      label: 'Draft Note',
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.note,
      icon: FilePlus2,
      onClick: onShowAgentAndGenerateNote,
      disabled: selectedEntries.length === 0 || aiBusy || !!activeBoard?.presentationMode,
    },
    ...starterIntents.map<InspectorActionItem>((intent) => ({
      id: `board-ai-${intent.id}`,
      label: intent.label,
      icon: Bot,
      onClick: () => onOpenAgentStarterIntent(intent.prompt),
      disabled: aiBusy,
      className: 'shrink-0',
    })),
  ];
  const sections: GlobalInspectorSection[] = [
    {
      id: 'selection',
      title: 'Selection',
      icon: Shapes,
      count: selectedEntries.length,
      isOpen: inspectorSections.selection,
      onToggle: onToggleSelection,
      contentClassName: CHROME_RAIL_SECTION_SCROLL_CLASS,
      content: (
        <div className="space-y-1">
          {selectedEntries.length === 0 ? (
            <p className="px-2 py-1 osint-body-quiet italic">
              Select one or more board items to inspect linked Sherlock records.
            </p>
          ) : (
            selectedEntries.map((entry) => (
              <div key={boardRefKey(entry)} className={CHROME_THIN_NESTED_ITEM_CLASS}>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-zinc-800 bg-zinc-950/60 text-zinc-300">
                    <AppIcon iconId={entry.iconId} size={11} strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate osint-body-quiet leading-5 text-zinc-300">
                      {entry.title}
                    </div>
                    {entry.description ? (
                      <div
                        className={`mt-1 osint-body-quiet ${
                          shouldWrapSelectionDescription(entry) ? 'break-all' : ''
                        }`}
                      >
                        {entry.description}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      id: 'provenance',
      title: 'Provenance',
      icon: Clock3,
      isOpen: inspectorSections.provenance,
      onToggle: onToggleProvenance,
      contentClassName: CHROME_RAIL_SECTION_SCROLL_CLASS,
      content: (
        <div className="space-y-3 px-1 py-1 osint-meta-value">
          {selectedWorkspaceItem ? (
            <div className={`${CHROME_THIN_NESTED_ITEM_CLASS} osint-raised-surface-subtle space-y-3`}>
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
      ),
    },
  ];

  return (
    <GlobalInspectorPanel
      isOpen={isOpen}
      eyebrow="Inspector"
      title={title}
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={(tabId) => onTabChange(tabId as RightPanelView)}
      tabsPlacement="header"
      headerActionsPlacement="top"
      actionItems={actionItems}
      actionRowLayout="wrap"
      actionRowDensity="thin"
      sections={sections}
      footer={
        activeBoard ? (
          <div className="border-t border-zinc-800 bg-black/20 p-3">
            <button
              type="button"
              onClick={onDeleteBoard}
              disabled={availableBoardsLength <= 1}
              className="osint-button-danger osint-meta-label-strong inline-flex w-full items-center justify-center gap-2 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              Delete Board
            </button>
          </div>
        ) : null
      }
    />
  );
};
