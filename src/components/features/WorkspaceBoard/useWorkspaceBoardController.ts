import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type {
  Artifact,
  ChatOpenRequest,
  InvestigationLaunchRequest,
} from '@/types';
import {
  buildFilesPath,
  buildWorkspaceBoardDocumentPath,
  buildWorkspaceBoardPath,
} from '@/app/routes';
import { useWorkspaceBoardFeatureState } from '@/store/selectors/workspaceBoardSelectors';
import type { WorkspaceLibraryEntry } from '@/services/workspace/library';
import { LEFT_PANEL_SECTION_SCROLL_CLASS, type RightPanelView } from './workspaceBoardUtils';
import { buildWorkspaceBoardViewModel } from './workspaceBoardViewModel';
import { useBoardCanvasPersistence } from './useBoardCanvasPersistence';
import { useWorkspaceDocumentUpload } from '@/components/features/shared/useWorkspaceDocumentUpload';
import { useWorkspaceBoardLibraryState } from './useWorkspaceBoardLibraryState';
import { useWorkspaceBoardInspectorState } from './useWorkspaceBoardInspectorState';
import { useWorkspaceBoardPlacement } from './useWorkspaceBoardPlacement';
import { useWorkspaceBoardAgentState } from './useWorkspaceBoardAgentState';

interface UseWorkspaceBoardControllerInput {
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
  onOpenArtifact: (artifact: Artifact) => void;
}

export const useWorkspaceBoardController = ({
  onLaunchInvestigation,
  onOpenChat,
  onOpenArtifact,
}: UseWorkspaceBoardControllerInput) => {
  const navigate = useNavigate();
  const {
    activeWorkspaceBoardId,
    activeWorkspaceId,
    artifacts,
    boardAgentActionsBySessionId,
    boardAgentSessions,
    createBoardAgentSession,
    createWorkspaceBoard,
    createWorkspaceItem,
    deleteWorkspaceItem,
    ensureWorkspaceBoard,
    headlines,
    queuedBoardPlacement,
    saveArtifact,
    saveWorkspaceBoardDocument,
    setActiveWorkspaceId,
    appendSectionToArtifact,
    addBoardAgentAction,
    updateWorkspaceBoard,
    updateBoardAgentAction,
    updateBoardAgentSession,
    workspaceBoardDocuments,
    workspaceBoards,
    workspaceItems,
    workspaces,
    clearQueuedBoardPlacement,
    deleteWorkspaceBoard,
    addToast,
    themeMode,
  } = useWorkspaceBoardFeatureState();

  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [boardAgentActiveSessionId, setBoardAgentActiveSessionId] = useState<string | null>(null);
  const [boardPendingDeletion, setBoardPendingDeletion] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<WorkspaceLibraryEntry[]>([]);
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>('AGENT');
  const {
    closeUploadDialog,
    confirmUploadDialog,
    fileInputRef,
    handleFileUpload,
    setUploadArtifactType,
    setUploadRoute,
    setUploadTargetWorkspaceId,
    uploadDialogState,
    uploadInFlight,
  } = useWorkspaceDocumentUpload({
    addToast,
    createWorkspaceItem,
    initialWorkspaceId: activeWorkspaceId,
    saveArtifact,
    source: 'BOARD',
    workspaces,
  });
  const {
    activeBoard,
    activeBoardDocument,
    activeWorkspace,
    availableBoards,
    boardAgentTodoItems,
    boardSessionsForBoard,
    createdWorkspaceItems,
    groupedEntries,
    libraryMap,
    selectedArtifact,
    selectedHeadline,
    selectedPrimaryEntry,
    selectedWorkspaceItem,
    visibleBoardAgentActions,
    visibleBoardAgentSession,
    workspaceArtifacts,
    workspaceHeadlines,
  } = useMemo(
    () =>
      buildWorkspaceBoardViewModel({
        activeWorkspaceBoardId,
        activeWorkspaceId,
        artifacts,
        boardAgentActionsBySessionId,
        boardAgentActiveSessionId,
        boardAgentSessions,
        headlines,
        search,
        selectedEntries,
        workspaceBoardDocuments,
        workspaceBoards,
        workspaceItems,
        workspaces,
      }),
    [
      activeWorkspaceBoardId,
      activeWorkspaceId,
      artifacts,
      boardAgentActionsBySessionId,
      boardAgentActiveSessionId,
      boardAgentSessions,
      headlines,
      search,
      selectedEntries,
      workspaceBoardDocuments,
      workspaceBoards,
      workspaceItems,
      workspaces,
    ]
  );

  const { editorRef, handleEditorMount, hydratedSnapshot, persistCurrentBoardDocument } =
    useBoardCanvasPersistence({
      activeBoard,
      activeBoardDocument,
      addToast,
      libraryMap,
      saveWorkspaceBoardDocument,
      setAiSummary,
      setSelectedEntries,
      themeMode,
    });

  const {
    handleAddArtifactPackage,
    handleAddBoardIcon,
    handleCanvasDrop,
    handleDropEntry,
  } = useWorkspaceBoardPlacement({
    activeBoard,
    activeWorkspace,
    addToast,
    clearQueuedBoardPlacement,
    editorRef,
    libraryMap,
    navigate,
    queuedBoardPlacement,
    themeMode,
    workspaceArtifacts,
    workspaceHeadlines,
  });

  useEffect(() => {
    if (!activeWorkspace) return;
    if (availableBoards.length > 0) return;
    void ensureWorkspaceBoard(activeWorkspace.id);
  }, [activeWorkspace, availableBoards.length, ensureWorkspaceBoard]);

  const {
    agentSections,
    boardAgentAutoApproveOrganizationActions,
    boardAgentBusy,
    boardAgentMessage,
    boardAgentPrompt,
    boardAgentReviewActions,
    boardAgentReviewSelections,
    boardAgentReviewState,
    handleApproveBoardAgentPlan,
    handleBoardAgentComposerKeyDown,
    handleBoardAgentReviewSelectionChange,
    handleCancelBoardAgent,
    handleRunBoardAgent,
    handleSkipBoardAgentPlan,
    setBoardAgentAutoApproveOrganizationActions,
    setBoardAgentPrompt,
    toggleAgentSection,
  } = useWorkspaceBoardAgentState({
    activeBoard,
    activeBoardDocument: activeBoardDocument ?? null,
    activeWorkspace,
    addBoardAgentAction,
    addToast,
    appendSectionToArtifact,
    boardAgentActiveSessionId,
    boardAgentActionsBySessionId,
    boardSessionsForBoard,
    createBoardAgentSession,
    createWorkspaceItem,
    createdWorkspaceItems,
    editorRef,
    onLaunchInvestigation,
    openAgentPanel: () => {
      setRightPanelOpen(true);
      setRightPanelView('AGENT');
    },
    persistCurrentBoardDocument,
    saveArtifact,
    themeMode,
    updateBoardAgentAction,
    updateBoardAgentSession,
    visibleBoardAgentSession,
    workspaceArtifacts,
    workspaceHeadlines,
    setBoardAgentActiveSessionId,
  });

  const copyToClipboard = useCallback(
    async (value: string, successMessage: string) => {
      await navigator.clipboard.writeText(value);
      addToast(successMessage, 'SUCCESS');
    },
    [addToast]
  );

  useEffect(
    () => () => {
      void persistCurrentBoardDocument();
    },
    [persistCurrentBoardDocument]
  );

  const handleCreateBoard = async () => {
    if (!activeWorkspace) return;
    await persistCurrentBoardDocument();
    const board = await createWorkspaceBoard({ workspaceId: activeWorkspace.id });
    navigate(buildWorkspaceBoardDocumentPath(activeWorkspace.id, board.id));
  };

  const handleDeleteBoard = async () => {
    if (!activeBoard || availableBoards.length <= 1) return;
    setBoardPendingDeletion({ id: activeBoard.id, name: activeBoard.name });
  };

  const handleWorkspaceChange = async (workspaceId: string) => {
    await persistCurrentBoardDocument();
    setActiveWorkspaceId(workspaceId || null);
    if (workspaceId) {
      navigate(buildWorkspaceBoardPath(workspaceId));
    } else {
      navigate(buildFilesPath());
    }
  };

  const {
    confirmDeleteCreatedItem,
    createModal,
    handleDeleteCreatedItem,
    handleSubmitCreateModal,
    libraryItemPendingDeletion,
    libraryItemSections,
    librarySections,
    setCreateModal,
    setLibraryItemPendingDeletion,
    toggleLibraryEntrySection,
    toggleLibrarySection,
  } = useWorkspaceBoardLibraryState({
    activeWorkspace,
    addToast,
    createWorkspaceItem,
    deleteWorkspaceItem,
    editorRef,
    handleDropEntry,
  });

  const {
    handleGenerateNote,
    handleGenerateSummary,
    inspectorActions,
    inspectorSections,
    toggleInspectorSection,
  } = useWorkspaceBoardInspectorState({
    activeBoard,
    activeWorkspace,
    addToast,
    createWorkspaceItem,
    handleDropEntry,
    onOpenChat,
    onOpenArtifact,
    setAiBusy,
    setAiSummary,
    selectedArtifact,
    selectedEntries,
    selectedHeadline,
    selectedPrimaryEntry,
    selectedWorkspaceItem,
    workspaceArtifacts,
    workspaceHeadlines,
  });

  return {
    activeBoard,
    activeBoardDocument,
    activeWorkspace,
    aiBusy,
    aiSummary,
    agentSections,
    availableBoards,
    boardAgentActiveSessionId,
    boardAgentAutoApproveOrganizationActions,
    boardAgentBusy,
    boardAgentMessage,
    boardAgentPrompt,
    boardAgentReviewActions,
    boardAgentReviewSelections,
    boardAgentReviewState,
    boardAgentTodoItems,
    boardSessionsForBoard,
    boardPendingDeletion,
    confirmDeleteCreatedItem,
    createModal,
    createdWorkspaceItems,
    deleteWorkspaceBoard,
    editorRef,
    fileInputRef,
    groupedEntries,
    handleBoardAgentComposerKeyDown,
    handleBoardAgentReviewSelectionChange,
    handleApproveBoardAgentPlan,
    handleAddArtifactPackage,
    handleCanvasDrop,
    handleCancelBoardAgent,
    handleCreateBoard,
    handleDeleteBoard,
    handleDeleteCreatedItem,
    handleDropEntry,
    handleEditorMount,
    handleFileUpload,
    handleGenerateNote,
    handleGenerateSummary,
    handleRunBoardAgent,
    handleSkipBoardAgentPlan,
    handleSubmitCreateModal,
    handleWorkspaceChange,
    handleAddBoardIcon,
    hydratedSnapshot,
    inspectorActions,
    inspectorSections,
    leftPanelOpen,
    libraryItemPendingDeletion,
    libraryItemSections,
    libraryMap,
    librarySections,
    persistCurrentBoardDocument,
    rightPanelOpen,
    rightPanelView,
    search,
    selectedArtifact,
    selectedEntries,
    selectedHeadline,
    selectedPrimaryEntry,
    selectedWorkspaceItem,
    setUploadArtifactType,
    setUploadRoute,
    setUploadTargetWorkspaceId,
    setBoardAgentAutoApproveOrganizationActions,
    setBoardAgentActiveSessionId,
    setBoardAgentPrompt,
    setBoardPendingDeletion,
    setCreateModal,
    setLeftPanelOpen,
    setLibraryItemPendingDeletion,
    setRightPanelOpen,
    setRightPanelView,
    setSearch,
    toggleAgentSection,
    toggleInspectorSection,
    toggleLibraryEntrySection,
    toggleLibrarySection,
    uploadDialogState,
    uploadInFlight,
    updateWorkspaceBoard,
    visibleBoardAgentActions,
    visibleBoardAgentSession,
    workspaceArtifacts,
    workspaceHeadlines,
    workspaceBoards,
    workspaceItems,
    workspaces,
    closeUploadDialog,
    confirmUploadDialog,
    copyToClipboard,
    LEFT_PANEL_SECTION_SCROLL_CLASS,
  };
};
