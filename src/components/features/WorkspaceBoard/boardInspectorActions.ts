import { Clock3, FileText, Link2, MessageSquare, Network } from 'lucide-react';

import type { Artifact, ChatOpenRequest, WorkspaceItem, WorkspaceBoardItemReference } from '@/types';
import type { InspectorActionItem } from '@/components/ui/InspectorActionRow';

interface WorkspaceLibraryEntryLike {
  metadata?: Record<string, unknown>;
  refKind: WorkspaceBoardItemReference['refKind'];
  refId: string;
  title: string;
  url?: string;
}

interface BuildBoardInspectorActionsInput {
  activeWorkspaceId?: string;
  onNavigateNetwork: () => Promise<void>;
  onNavigateTimeline: () => Promise<void>;
  onOpenChat: (request: ChatOpenRequest) => void;
  onOpenReport: (report: Artifact) => void;
  onOpenSelectedChat: () => void;
  selectedArtifact: Artifact | null;
  selectedEntries: WorkspaceLibraryEntryLike[];
  selectedPrimaryEntry?: WorkspaceLibraryEntryLike | null;
  selectedWorkspaceItem?: WorkspaceItem | null;
  workspaceArtifacts: Artifact[];
}

export const buildBoardInspectorActions = ({
  activeWorkspaceId,
  onNavigateNetwork,
  onNavigateTimeline,
  onOpenChat,
  onOpenReport,
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
      label: 'Open Artifact',
      icon: FileText,
      onClick: () => onOpenReport(selectedArtifact),
    });
  }

  if (selectedEntries.length > 0) {
    inspectorActions.push({
      id: 'board-open-chat',
      label: 'Open In Chat',
      icon: MessageSquare,
      onClick: onOpenSelectedChat,
    });
  }

  if (selectedWorkspaceItem?.provenance?.sourceSessionId) {
    inspectorActions.push({
      id: 'board-open-chat-session',
      label: 'Source Chat',
      icon: MessageSquare,
      onClick: () =>
        onOpenChat({
          workspaceId: selectedWorkspaceItem.workspaceId,
          sessionId: selectedWorkspaceItem.provenance?.sourceSessionId,
        }),
    });
  }

  if (selectedWorkspaceItem?.provenance?.sourceReportId) {
    const sourceReport = workspaceArtifacts.find(
      (artifact) => artifact.id === selectedWorkspaceItem.provenance?.sourceReportId
    );
    if (sourceReport) {
      inspectorActions.push({
        id: 'board-open-source-report',
        label: 'Source Report',
        icon: FileText,
        onClick: () => onOpenReport(sourceReport),
      });
    }
  }

  if (selectedPrimaryEntry?.url || typeof selectedPrimaryEntry?.metadata?.url === 'string') {
    inspectorActions.push({
      id: 'board-open-link',
      label: 'Open Link',
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

  if (activeWorkspaceId) {
    inspectorActions.push({
      id: 'board-open-timeline',
      label: 'Timeline',
      icon: Clock3,
      onClick: () => void onNavigateTimeline(),
    });
    inspectorActions.push({
      id: 'board-open-network',
      label: 'Network Graph',
      icon: Network,
      onClick: () => void onNavigateNetwork(),
    });
  }

  return inspectorActions;
};
