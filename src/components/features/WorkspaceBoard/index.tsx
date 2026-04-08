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
import { EmptyState } from '@/components/ui/EmptyState';
import { sanitizeDisplayTitle } from '@/domain';
import { LEFT_PANEL_SECTION_SCROLL_CLASS } from './workspaceBoardUtils';
import { useWorkspaceBoardController } from './useWorkspaceBoardController';
import { BoardLibraryRail } from './BoardLibraryRail';
import { BoardInspectorRail } from './BoardInspectorRail';
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
    rightPanelTabButtonClass,
    rightPanelView,
    search,
    selectedEntries,
    selectedWorkspaceItem,
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
            className="absolute inset-0 z-20 bg-black/80 xl:hidden"
            onClick={() => {
              setLeftPanelOpen(false);
              setRightPanelOpen(false);
            }}
          />
        ) : null}

        <BoardLibraryRail
          isOpen={leftPanelOpen}
          workspaceTitle={sanitizeDisplayTitle(activeWorkspace.title)}
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

        <aside
          className={`absolute right-0 top-0 z-30 flex h-full flex-col overflow-hidden border-l border-zinc-800 bg-black transition-all duration-200 xl:relative xl:translate-x-0 ${
            rightPanelOpen
              ? 'w-[min(24rem,calc(100vw-1rem))] translate-x-0'
              : 'w-[min(24rem,calc(100vw-1rem))] translate-x-full xl:w-0 xl:border-l-0'
          }`}
        >
          <div className="border-b border-zinc-800 bg-zinc-900/30 px-4 py-3">
            <div className="flex w-full justify-start gap-2">
              {(
                [
                  ['AGENT', 'Agent'],
                  ['INSPECTOR', 'Inspector'],
                ] as const
              ).map(([view, label]) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setRightPanelView(view)}
                  className={rightPanelTabButtonClass(view)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {rightPanelView === 'INSPECTOR' ? (
            <BoardInspectorRail
              inspectorActions={inspectorActions}
              inspectorSections={inspectorSections}
              selectedEntries={selectedEntries}
              selectedWorkspaceItem={selectedWorkspaceItem}
              activeBoard={activeBoard}
              availableBoardsLength={availableBoards.length}
              aiBusy={aiBusy}
              aiSummary={aiSummary}
              onToggleSelection={() => toggleInspectorSection('selection')}
              onToggleAiActions={() => toggleInspectorSection('aiActions')}
              onToggleProvenance={() => toggleInspectorSection('provenance')}
              onShowAgentAndGenerateSummary={() => {
                setRightPanelView('AGENT');
                void handleGenerateSummary();
              }}
              onShowAgentAndGenerateNote={() => {
                setRightPanelView('AGENT');
                void handleGenerateNote();
              }}
              onDeleteBoard={handleDeleteBoard}
            />
          ) : (
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
          )}
        </aside>
      </div>

      <BoardDialogs
        createModal={createModal}
        boardPendingDeletion={boardPendingDeletion}
        libraryItemPendingDeletion={libraryItemPendingDeletion}
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
      />
    </div>
  );
};
