import { useCallback, useMemo } from 'react';

import type {
  Artifact,
  ChatOpenRequest,
  Headline,
  Workspace,
  WorkspaceBoard,
  WorkspaceItem,
} from '@/types';
import {
  buildWorkspaceNetworkPath,
  buildWorkspaceTimelinePath,
} from '@/app/routes';
import {
  buildSingleWorkspaceItemEntry,
  type WorkspaceLibraryEntry,
} from '@/services/workspace/library';
import {
  buildArtifactChatOpenRequest,
  buildEntityChatOpenRequest,
  buildKeyFindingChatOpenRequest,
  buildSignalChatOpenRequest,
  buildWorkspaceItemChatOpenRequest,
} from '@/services/workspace/workspaceHandoffs';
import { useExclusivePanelSections } from '@/components/features/shared/useExclusivePanelSections';
import { buildBoardInspectorActions } from './boardInspectorActions';
import {
  createWorkspaceSelectionNote,
  generateWorkspaceSelectionSummary,
} from './workspaceBoardItemActions';

interface UseWorkspaceBoardInspectorStateInput {
  activeBoard: WorkspaceBoard | null;
  activeWorkspace: Workspace | null;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  createWorkspaceItem: (item: WorkspaceItem) => Promise<unknown>;
  handleDropEntry: (entry: WorkspaceLibraryEntry, clientX?: number, clientY?: number) => void;
  navigate: (path: string) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
  onOpenReport: (report: Artifact) => void;
  persistCurrentBoardDocument: () => Promise<void>;
  setAiBusy: (value: boolean) => void;
  setAiSummary: (value: string | null) => void;
  selectedArtifact: Artifact | null;
  selectedEntries: WorkspaceLibraryEntry[];
  selectedHeadline: Headline | null;
  selectedPrimaryEntry: WorkspaceLibraryEntry | null;
  selectedWorkspaceItem: WorkspaceItem | null;
  workspaceArtifacts: Artifact[];
  workspaceHeadlines: Headline[];
}

export const useWorkspaceBoardInspectorState = ({
  activeBoard,
  activeWorkspace,
  addToast,
  createWorkspaceItem,
  handleDropEntry,
  navigate,
  onOpenChat,
  onOpenReport,
  persistCurrentBoardDocument,
  setAiBusy,
  setAiSummary,
  selectedArtifact,
  selectedEntries,
  selectedHeadline,
  selectedPrimaryEntry,
  selectedWorkspaceItem,
  workspaceArtifacts,
  workspaceHeadlines,
}: UseWorkspaceBoardInspectorStateInput) => {
  const inspectorSectionState = useExclusivePanelSections(['selection', 'provenance'] as const);

  const handleGenerateSummary = useCallback(async () => {
    if (!activeWorkspace || selectedEntries.length === 0) return;
    setAiBusy(true);

    try {
      const result = await generateWorkspaceSelectionSummary({
        workspace: activeWorkspace,
        artifacts: workspaceArtifacts,
        headlines: workspaceHeadlines,
        selectedEntries,
      });
      setAiSummary(result.content);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Unable to summarize this selection.',
        'ERROR'
      );
    } finally {
      setAiBusy(false);
    }
  }, [
    activeWorkspace,
    addToast,
    selectedEntries,
    setAiBusy,
    setAiSummary,
    workspaceArtifacts,
    workspaceHeadlines,
  ]);

  const handleGenerateNote = useCallback(async () => {
    if (!activeWorkspace || !activeBoard || selectedEntries.length === 0) return;
    if (activeBoard.presentationMode) {
      addToast('Disable presentation mode before drafting a note card onto the board.', 'INFO');
      return;
    }
    setAiBusy(true);

    try {
      const noteItem = await createWorkspaceSelectionNote({
        activeBoard,
        createWorkspaceItem,
        selectedEntries,
        workspace: activeWorkspace,
        workspaceArtifacts,
        workspaceHeadlines,
      });
      const entry = buildSingleWorkspaceItemEntry(activeWorkspace.id, noteItem);
      if (entry) {
        handleDropEntry(entry);
      }
      addToast('Created a new AI-assisted board note.', 'SUCCESS');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to draft a board note.', 'ERROR');
    } finally {
      setAiBusy(false);
    }
  }, [
    activeBoard,
    activeWorkspace,
    addToast,
    createWorkspaceItem,
    handleDropEntry,
    selectedEntries,
    setAiBusy,
    workspaceArtifacts,
    workspaceHeadlines,
  ]);

  const handleOpenSelectedChat = useCallback(() => {
    if (!activeWorkspace) return;

    if (selectedWorkspaceItem) {
      onOpenChat(buildWorkspaceItemChatOpenRequest(selectedWorkspaceItem));
      return;
    }

    if (selectedArtifact?.id) {
      const request = buildArtifactChatOpenRequest(selectedArtifact);
      if (!request) return;
      onOpenChat(request);
      return;
    }

    const selectedFinding = selectedEntries.find((entry) => entry.refKind === 'KEY_FINDING');
    if (selectedFinding) {
      const request = buildKeyFindingChatOpenRequest({
        id: selectedFinding.refId,
        workspaceId: activeWorkspace.id,
        originArtifactId:
          typeof selectedFinding.metadata?.originArtifactId === 'string'
            ? selectedFinding.metadata.originArtifactId
            : undefined,
        originSectionId:
          typeof selectedFinding.metadata?.originSectionId === 'string'
            ? selectedFinding.metadata.originSectionId
            : undefined,
        title: selectedFinding.title,
        summary: selectedFinding.description || selectedFinding.contextText || selectedFinding.title,
        supportRefs:
          Array.isArray(selectedFinding.metadata?.supportRefs) &&
          selectedFinding.metadata.supportRefs.every((entry) => typeof entry === 'string')
            ? (selectedFinding.metadata.supportRefs as string[])
            : undefined,
      });
      if (!request) return;
      onOpenChat(request);
      return;
    }

    if (selectedHeadline) {
      const request = buildSignalChatOpenRequest(selectedHeadline);
      if (!request) return;
      onOpenChat(request);
      return;
    }

    const selectedEntity = selectedEntries.find((entry) => entry.refKind === 'ENTITY');
    if (selectedEntity) {
      const request = buildEntityChatOpenRequest({
        entityName: selectedEntity.title,
        workspaceId: activeWorkspace.id,
      });
      if (!request) return;
      onOpenChat(request);
      return;
    }

    onOpenChat({ workspaceId: activeWorkspace.id });
  }, [
    activeWorkspace,
    onOpenChat,
    selectedArtifact,
    selectedEntries,
    selectedHeadline,
    selectedWorkspaceItem,
  ]);

  const inspectorActions = useMemo(
    () =>
      buildBoardInspectorActions({
        activeWorkspaceId: activeWorkspace?.id,
        onNavigateNetwork: async () => {
          if (!activeWorkspace) return;
          await persistCurrentBoardDocument();
          navigate(buildWorkspaceNetworkPath(activeWorkspace.id));
        },
        onNavigateTimeline: async () => {
          if (!activeWorkspace) return;
          await persistCurrentBoardDocument();
          navigate(buildWorkspaceTimelinePath(activeWorkspace.id));
        },
        onOpenChat,
        onOpenReport,
        onOpenSelectedChat: handleOpenSelectedChat,
        selectedArtifact,
        selectedEntries,
        selectedPrimaryEntry,
        selectedWorkspaceItem,
        workspaceArtifacts,
      }),
    [
      activeWorkspace,
      handleOpenSelectedChat,
      navigate,
      onOpenChat,
      onOpenReport,
      persistCurrentBoardDocument,
      selectedArtifact,
      selectedEntries,
      selectedPrimaryEntry,
      selectedWorkspaceItem,
      workspaceArtifacts,
    ]
  );

  return {
    handleGenerateNote,
    handleGenerateSummary,
    handleOpenSelectedChat,
    inspectorActions,
    inspectorSections: inspectorSectionState.state,
    toggleInspectorSection: inspectorSectionState.toggleSection,
  };
};
