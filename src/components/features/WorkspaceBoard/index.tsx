import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shapes } from 'lucide-react';
import 'tldraw/tldraw.css';

import type {
  Artifact,
  ChatOpenRequest,
  InvestigationLaunchRequest,
} from '@/types';
import {
  buildFilesPath,
  buildWorkspaceBoardDocumentPath,
} from '@/app/routes';
import { GlobalInspectorPanel } from '@/components/features/Inspector/GlobalInspectorPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { getWorkspaceDisplayTitle } from '@/domain';
import type { GlobalInspectorTab } from '@/components/features/Inspector/globalInspectorTypes';
import { LEFT_PANEL_SECTION_SCROLL_CLASS, type RightPanelView } from './workspaceBoardUtils';
import { useWorkspaceBoardController } from './useWorkspaceBoardController';
import { WorkspaceBoardLibraryRail } from './WorkspaceBoardLibraryRail';
import { WorkspaceBoardInspectorPanel } from './WorkspaceBoardInspectorPanel';
import { BoardAgentRail } from './BoardAgentRail';
import { BoardDialogs } from './BoardDialogs';
import { BoardTopBar } from './BoardTopBar';
import { BoardCanvasPane } from './BoardCanvasPane';

interface WorkspaceBoardProps {
  onOpenReport: (report: Artifact) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
}

export const WorkspaceBoard: React.FC<WorkspaceBoardProps> = ({
  onOpenReport,
  onOpenChat,
  onLaunchInvestigation,
}) => {
  const navigate = useNavigate();
  const {
    activeBoard,
    activeWorkspace,
    aiBusy,
    aiSummary,
    agentSections,
    availableBoards,
    boardAgentAutoApproveOrganizationActions,
    boardAgentBusy,
    boardAgentMessage,
    boardAgentPrompt,
    boardAgentReviewActions,
    boardAgentReviewSelections,
    boardAgentReviewState,
    boardAgentTodoItems,
    boardPendingDeletion,
    closeUploadDialog,
    confirmUploadDialog,
    confirmDeleteCreatedItem,
    createModal,
    deleteWorkspaceBoard,
    fileInputRef,
    groupedEntries,
    handleBoardAgentComposerKeyDown,
    handleBoardAgentReviewSelectionChange,
    handleApproveBoardAgentPlan,
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
    hydratedSnapshot,
    inspectorActions,
    inspectorSections,
    leftPanelOpen,
    libraryItemPendingDeletion,
    libraryItemSections,
    librarySections,
    persistCurrentBoardDocument,
    rightPanelOpen,
    rightPanelView,
    search,
    selectedEntries,
    selectedWorkspaceItem,
    setUploadArtifactType,
    setUploadRoute,
    setUploadTargetWorkspaceId,
    setBoardAgentAutoApproveOrganizationActions,
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
    workspaces,
  } = useWorkspaceBoardController({
    onLaunchInvestigation,
    onOpenChat,
    onOpenReport,
  });

  if (!activeWorkspace) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <EmptyState
          icon={Shapes}
          title="No Active Workspace"
          description="Open or create a workspace first. The research board mirrors the active workspace and keeps board composition tied to canonical Sherlock records."
          action={{
            label: 'Open Files',
            onClick: () => navigate(buildFilesPath()),
          }}
        />
      </div>
    );
  }

  const rightPanelTabs: GlobalInspectorTab[] = [
    { id: 'AGENT', label: 'Agent' },
    { id: 'INSPECTOR', label: 'Inspector' },
  ];
  const handleRightPanelTabChange = (tabId: RightPanelView) => {
    setRightPanelView(tabId);
  };

  return (
    <div className="workspace-board-page flex h-screen w-full flex-col overflow-hidden bg-black text-zinc-100 isolate">
      <BoardTopBar
        activeBoard={activeBoard}
        activeWorkspaceId={activeWorkspace.id}
        availableBoards={availableBoards}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        workspaces={workspaces}
        onCreateBoard={() => {
          void handleCreateBoard();
        }}
        onSelectWorkspace={(workspaceId) => {
          void handleWorkspaceChange(workspaceId);
        }}
        onSelectBoard={(boardId) => {
          if (!activeWorkspace || !boardId) return;
          void (async () => {
            await persistCurrentBoardDocument();
            navigate(buildWorkspaceBoardDocumentPath(activeWorkspace.id, boardId));
          })();
        }}
        onToggleLeftPanel={() => setLeftPanelOpen((current) => !current)}
        onTogglePresentationMode={() => {
          if (!activeBoard) return;
          void updateWorkspaceBoard(activeBoard.id, {
            presentationMode: !activeBoard.presentationMode,
          });
        }}
        onToggleRightPanel={() => setRightPanelOpen((current) => !current)}
      />

      <div className="relative z-0 flex flex-1 overflow-hidden">
        {leftPanelOpen || rightPanelOpen ? (
          <div
            className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => {
              setLeftPanelOpen(false);
              setRightPanelOpen(false);
            }}
          />
        ) : null}

        <WorkspaceBoardLibraryRail
          isOpen={leftPanelOpen}
          workspaceTitle={getWorkspaceDisplayTitle(activeWorkspace)}
          search={search}
          groupedEntries={groupedEntries}
          librarySections={librarySections}
          libraryItemSections={libraryItemSections}
          fileInputRef={fileInputRef}
          sectionScrollClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
          onSearchChange={setSearch}
          onCreateNote={() => setCreateModal({ type: 'NOTE', title: '', content: '' })}
          onCreateLink={() => setCreateModal({ type: 'LINK', title: '', url: '', description: '' })}
          onTriggerFileUpload={() => fileInputRef.current?.click()}
          onFileUpload={handleFileUpload}
          onToggleLibrarySection={toggleLibrarySection}
          onToggleLibraryEntrySection={toggleLibraryEntrySection}
          onDeleteCreatedItem={(entry) => void handleDeleteCreatedItem(entry)}
          onAddToBoard={handleDropEntry}
        />

        <BoardCanvasPane
          activeBoard={activeBoard}
          hydratedSnapshot={hydratedSnapshot}
          onCanvasDrop={handleCanvasDrop}
          onEditorMount={handleEditorMount}
        />

        {rightPanelView === 'INSPECTOR' ? (
          <WorkspaceBoardInspectorPanel
            isOpen={rightPanelOpen}
            tabs={rightPanelTabs}
            activeTabId={rightPanelView}
            onTabChange={handleRightPanelTabChange}
            inspectorActions={inspectorActions}
            inspectorSections={inspectorSections}
            selectedEntries={selectedEntries}
            selectedWorkspaceItem={selectedWorkspaceItem}
            activeBoard={activeBoard}
            availableBoardsLength={availableBoards.length}
            aiBusy={aiBusy}
            onToggleQuickActions={() => toggleInspectorSection('quickActions')}
            onToggleSelection={() => toggleInspectorSection('selection')}
            onToggleProvenance={() => toggleInspectorSection('provenance')}
            onShowAgentAndGenerateSummary={() => {
              setRightPanelView('AGENT');
              void handleGenerateSummary();
            }}
            onShowAgentAndGenerateNote={() => {
              setRightPanelView('AGENT');
              void handleGenerateNote();
            }}
            onOpenAgentStarterIntent={(prompt) => {
              setBoardAgentPrompt(prompt);
              setRightPanelView('AGENT');
            }}
            onDeleteBoard={handleDeleteBoard}
          />
        ) : (
          <GlobalInspectorPanel
            isOpen={rightPanelOpen}
            eyebrow={null}
            title={null}
            tabs={rightPanelTabs}
            activeTabId={rightPanelView}
            onTabChange={(tabId) => handleRightPanelTabChange(tabId as RightPanelView)}
            tabsPlacement="header"
            headerActionsPlacement="top"
          >
            <BoardAgentRail
              agentSections={agentSections}
              selectedEntries={selectedEntries}
              aiSummary={aiSummary}
              boardAgentAutoApproveOrganizationActions={
                boardAgentAutoApproveOrganizationActions
              }
              boardAgentMessage={boardAgentMessage}
              boardAgentReviewActions={boardAgentReviewActions}
              boardAgentReviewSelections={boardAgentReviewSelections}
              boardAgentReviewState={boardAgentReviewState}
              boardAgentTodoItems={boardAgentTodoItems}
              boardAgentBusy={boardAgentBusy}
              boardAgentPrompt={boardAgentPrompt}
              visibleBoardAgentActions={visibleBoardAgentActions}
              visibleBoardAgentSession={visibleBoardAgentSession}
              onApprovePlan={handleApproveBoardAgentPlan}
              onPromptChange={setBoardAgentPrompt}
              onReviewSelectionChange={handleBoardAgentReviewSelectionChange}
              onSelectStarterIntent={setBoardAgentPrompt}
              onSkipPlan={handleSkipBoardAgentPlan}
              onToggleContext={() => toggleAgentSection('context')}
              onToggleSession={() => toggleAgentSection('session')}
              onToggleActions={() => toggleAgentSection('actions')}
              onToggleAutoApproveOrganizationActions={
                setBoardAgentAutoApproveOrganizationActions
              }
              onAttachFiles={() => fileInputRef.current?.click()}
              onRunAgent={() => {
                void handleRunBoardAgent();
              }}
              onCancelAgent={handleCancelBoardAgent}
              onKeyDown={handleBoardAgentComposerKeyDown}
            />
          </GlobalInspectorPanel>
        )}
      </div>

      <BoardDialogs
        createModal={createModal}
        boardPendingDeletion={boardPendingDeletion}
        libraryItemPendingDeletion={libraryItemPendingDeletion}
        uploadDialogState={uploadDialogState}
        uploadInFlight={uploadInFlight}
        onCloseCreateModal={() => setCreateModal(null)}
        onCreateModalChange={setCreateModal}
        onSubmitCreateModal={handleSubmitCreateModal}
        onCloseBoardDeletion={() => setBoardPendingDeletion(null)}
        onConfirmBoardDeletion={async () => {
          if (!boardPendingDeletion) {
            return;
          }

          await deleteWorkspaceBoard(boardPendingDeletion.id);
          setBoardPendingDeletion(null);
        }}
        onCloseLibraryItemDeletion={() => setLibraryItemPendingDeletion(null)}
        onConfirmLibraryItemDeletion={async () => {
          if (!libraryItemPendingDeletion) {
            return;
          }

          await confirmDeleteCreatedItem(libraryItemPendingDeletion);
          setLibraryItemPendingDeletion(null);
        }}
        onCloseUploadDialog={closeUploadDialog}
        onConfirmUploadDialog={confirmUploadDialog}
        onUploadArtifactTypeChange={setUploadArtifactType}
        onUploadRouteChange={setUploadRoute}
        onUploadTargetWorkspaceChange={setUploadTargetWorkspaceId}
        workspaces={workspaces}
      />
    </div>
  );
};
