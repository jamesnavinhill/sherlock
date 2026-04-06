import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  FolderPlus,
  PanelRight,
  Presentation,
  Shapes,
} from 'lucide-react';
import { Tldraw } from 'tldraw';
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
import { OsintSelect } from '@/components/ui/OsintSelect';
import { sanitizeDisplayTitle } from '@/domain';
import {
  boardTldrawComponents,
  LEFT_PANEL_SECTION_SCROLL_CLASS,
} from './workspaceBoardUtils';
import { useWorkspaceBoardController } from './useWorkspaceBoardController';
import { BoardLibraryRail } from './BoardLibraryRail';
import { BoardInspectorRail } from './BoardInspectorRail';
import { BoardAgentRail } from './BoardAgentRail';
import { BoardDialogs } from './BoardDialogs';

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
    boardAgentBusy,
    boardAgentMessage,
    boardAgentPrompt,
    boardAgentTodoItems,
    boardPendingDeletion,
    confirmDeleteCreatedItem,
    createModal,
    deleteWorkspaceBoard,
    fileInputRef,
    groupedEntries,
    handleBoardAgentComposerKeyDown,
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
            label: 'Open Case Files',
            onClick: () => navigate(buildFilesPath()),
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-black text-zinc-100">
      <header className="osint-header-shadow sticky top-0 z-[12000] flex h-20 items-center justify-between border-b border-zinc-800 bg-black/95 px-6 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setLeftPanelOpen((current) => !current)}
            className={`hidden items-center justify-center border p-2 text-xs font-mono uppercase transition md:inline-flex ${
              leftPanelOpen
                ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
            }`}
          >
            <Briefcase className="h-4 w-4" />
          </button>
          <button
            onClick={handleCreateBoard}
            className="osint-button-primary inline-flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase"
          >
            <FolderPlus className="h-4 w-4" />
            New Board
          </button>
          <div className="relative z-[12010] hidden min-w-[220px] max-w-[280px] md:block">
            <OsintSelect
              ariaLabel="Select workspace"
              value={activeWorkspace.id}
              onChange={handleWorkspaceChange}
              triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono truncate"
              menuClassName="z-[12020]"
              options={workspaces.map((workspace) => ({
                value: workspace.id,
                label: sanitizeDisplayTitle(workspace.title),
              }))}
            />
          </div>
          <div className="relative z-[12010] hidden min-w-[220px] max-w-[260px] md:block">
            <OsintSelect
              ariaLabel="Select board"
              value={activeBoard?.id || ''}
              onChange={(value) => {
                if (!activeWorkspace || !value) return;
                void (async () => {
                  await persistCurrentBoardDocument();
                  navigate(buildWorkspaceBoardDocumentPath(activeWorkspace.id, value));
                })();
              }}
              triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono truncate"
              menuClassName="z-[12020]"
              options={availableBoards.map((board) => ({
                value: board.id,
                label: board.name,
              }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeBoard ? (
            <button
              onClick={() =>
                void updateWorkspaceBoard(activeBoard.id, {
                  presentationMode: !activeBoard.presentationMode,
                })
              }
              className={`inline-flex items-center gap-2 border px-3 py-2 text-xs font-mono uppercase transition ${
                activeBoard.presentationMode
                  ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                  : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
              }`}
            >
              <Presentation className="h-4 w-4" />
              {activeBoard.presentationMode ? 'Presentation' : 'Edit Mode'}
            </button>
          ) : null}
          <button
            onClick={() => setRightPanelOpen((current) => !current)}
            className={`hidden items-center justify-center border p-2 text-xs font-mono uppercase transition xl:inline-flex ${
              rightPanelOpen
                ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
            }`}
            title="Toggle Inspector Panel"
          >
            <PanelRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
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

        <main className="relative flex-1 overflow-hidden bg-osint-dark">
          <div
            className="sherlock-board-canvas absolute inset-0"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleCanvasDrop}
          >
            {activeBoard ? (
              <Tldraw
                key={activeBoard.id}
                className="h-full w-full"
                components={boardTldrawComponents}
                snapshot={hydratedSnapshot}
                onMount={handleEditorMount}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  icon={Shapes}
                  title="Preparing Board"
                  description="Sherlock is preparing the primary board for this workspace."
                />
              </div>
            )}
          </div>
        </main>

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
              boardAgentMessage={boardAgentMessage}
              boardAgentTodoItems={boardAgentTodoItems}
              boardAgentBusy={boardAgentBusy}
              boardAgentPrompt={boardAgentPrompt}
              visibleBoardAgentActions={visibleBoardAgentActions}
              visibleBoardAgentSession={visibleBoardAgentSession}
              onPromptChange={setBoardAgentPrompt}
              onToggleContext={() => toggleAgentSection('context')}
              onToggleSession={() => toggleAgentSection('session')}
              onToggleActions={() => toggleAgentSection('actions')}
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
