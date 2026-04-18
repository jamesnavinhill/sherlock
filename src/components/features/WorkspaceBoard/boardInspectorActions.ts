import { FileText, Link2, MessageSquare } from 'lucide-react';

import type { Artifact, ChatOpenRequest, WorkspaceItem, WorkspaceBoardItemReference } from '@/types';
import type { InspectorActionItem } from '@/components/ui/InspectorActionRow';
import { INSPECTOR_ACTION_SHORT_LABELS } from '@/components/ui/inspectorActionLabels';

interface WorkspaceLibraryEntryLike {
  metadata?: Record<string, unknown>;
  refKind: WorkspaceBoardItemReference['refKind'];
  refId: string;
  title: string;
  url?: string;
}

interface BuildBoardInspectorActionsInput {
  onOpenChat: (request: ChatOpenRequest) => void;
  onOpenArtifact: (artifact: Artifact) => void;
  onOpenSelectedChat: () => void;
  selectedArtifact: Artifact | null;
  selectedEntries: WorkspaceLibraryEntryLike[];
  selectedPrimaryEntry?: WorkspaceLibraryEntryLike | null;
  selectedWorkspaceItem?: WorkspaceItem | null;
  workspaceArtifacts: Artifact[];
}

export const buildBoardInspectorActions = ({
  onOpenChat,
  onOpenArtifact,
  onOpenSelectedChat,
  selectedArtifact,
  selectedEntries,
  selectedPrimaryEntry,
  selectedWorkspaceItem,
  workspaceArtifacts,
}: BuildBoardInspectorActionsInput): InspectorActionItem[] => {
  const inspectorActions: InspectorActionItem[] = [];

  if (selectedArtifact) {
    inspectorActions.push({
      id: 'board-open-report',
      label: 'Open Report',
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.open,
      icon: FileText,
      onClick: () => onOpenArtifact(selectedArtifact),
    });
  }

  if (selectedEntries.length > 0) {
    inspectorActions.push({
      id: 'board-open-chat',
      label: 'Open Workspace Chat',
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.chat,
      icon: MessageSquare,
      onClick: onOpenSelectedChat,
    });
  }

  if (selectedWorkspaceItem?.provenance?.sourceSessionId) {
    inspectorActions.push({
      id: 'board-open-chat-session',
      label: 'Open Source Chat',
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.source,
      icon: MessageSquare,
      onClick: () =>
        onOpenChat({
          workspaceId: selectedWorkspaceItem.workspaceId,
          sessionId: selectedWorkspaceItem.provenance?.sourceSessionId,
        }),
    });
  }

  if (selectedWorkspaceItem?.provenance?.sourceArtifactId) {
    const sourceReport = workspaceArtifacts.find(
      (artifact) => artifact.id === selectedWorkspaceItem.provenance?.sourceArtifactId
    );
    if (sourceReport) {
      inspectorActions.push({
        id: 'board-open-source-report',
        label: 'Open Source Report',
        shortLabel: INSPECTOR_ACTION_SHORT_LABELS.source,
        icon: FileText,
        onClick: () => onOpenArtifact(sourceReport),
      });
    }
  }

  if (selectedPrimaryEntry?.url || typeof selectedPrimaryEntry?.metadata?.url === 'string') {
    inspectorActions.push({
      id: 'board-open-link',
      label: 'Open Link',
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.link,
      icon: Link2,
      href:
        selectedPrimaryEntry.url ||
        (typeof selectedPrimaryEntry.metadata?.url === 'string'
          ? selectedPrimaryEntry.metadata.url
          : undefined),
      target: '_blank',
      rel: 'noopener noreferrer',
    });
  }

  return inspectorActions;
};
