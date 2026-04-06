import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Bot,
  Clock3,
  FilePlus2,
  FileText,
  FolderPlus,
  Link2,
  Network,
  Paperclip,
  PanelRight,
  Presentation,
  Radio,
  Search,
  Send,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
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
import { Accordion } from '@/components/ui/Accordion';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InspectorActionRow } from '@/components/ui/InspectorActionRow';
import { serializeBoardReference } from '../../../services/workspace/boardShapes';
import { sanitizeDisplayTitle } from '@/domain';
import {
  boardRefKey,
  boardTldrawComponents,
  LEFT_PANEL_SECTION_SCROLL_CLASS,
} from './workspaceBoardUtils';
import { useWorkspaceBoardController } from './useWorkspaceBoardController';

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

  const inspectorPanelBody = (
    <>
      {inspectorActions.length > 0 && (
        <div className="border-b border-zinc-800 bg-zinc-900/10 px-4 py-3">
          <InspectorActionRow actions={inspectorActions} layout="wrap" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        <Accordion
          title="Selection"
          icon={Shapes}
          count={selectedEntries.length}
          isOpen={inspectorSections.selection}
          onToggle={() => toggleInspectorSection('selection')}
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
                  {entry.description && (
                    <div className="mt-2 text-xs leading-5 text-zinc-400">{entry.description}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </Accordion>

        <Accordion
          title="AI Actions"
          icon={Bot}
          isOpen={inspectorSections.aiActions}
          onToggle={() => toggleInspectorSection('aiActions')}
        >
          <div className="space-y-3">
            <button
              onClick={() => {
                setRightPanelView('AGENT');
                void handleGenerateSummary();
              }}
              disabled={selectedEntries.length === 0 || aiBusy}
              className="osint-button-primary inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              Summarize Selection
            </button>
            <button
              onClick={() => {
                setRightPanelView('AGENT');
                void handleGenerateNote();
              }}
              disabled={selectedEntries.length === 0 || aiBusy || !!activeBoard?.presentationMode}
              className="osint-button-primary inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Bot className="h-4 w-4" />
              Draft Note Card
            </button>
            {aiSummary && (
              <div className="bg-black/40 p-3 text-xs leading-6 text-zinc-300">{aiSummary}</div>
            )}
          </div>
        </Accordion>

        <Accordion
          title="Provenance"
          icon={Clock3}
          isOpen={inspectorSections.provenance}
          onToggle={() => toggleInspectorSection('provenance')}
        >
          <div className="space-y-3 px-1 py-1 text-xs font-mono text-zinc-300">
            {selectedWorkspaceItem ? (
              <>
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Source</div>
                  <div className="mt-1">{selectedWorkspaceItem.provenance?.source || 'USER'}</div>
                </div>
                {selectedWorkspaceItem.provenance?.description && (
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500">Notes</div>
                    <div className="mt-1 leading-relaxed text-zinc-400">
                      {selectedWorkspaceItem.provenance.description}
                    </div>
                  </div>
                )}
                {selectedWorkspaceItem.provenance?.sourceSessionId && (
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500">Chat Session</div>
                    <div className="mt-1">{selectedWorkspaceItem.provenance.sourceSessionId}</div>
                  </div>
                )}
                {selectedWorkspaceItem.provenance?.sourceMessageId && (
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500">Message</div>
                    <div className="mt-1">{selectedWorkspaceItem.provenance.sourceMessageId}</div>
                  </div>
                )}
                {selectedWorkspaceItem.provenance?.sourceReportId && (
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500">Source Report</div>
                    <div className="mt-1">{selectedWorkspaceItem.provenance.sourceReportId}</div>
                  </div>
                )}
                {selectedWorkspaceItem.provenance?.sourceHeadlineId && (
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500">Source Signal</div>
                    <div className="mt-1">{selectedWorkspaceItem.provenance.sourceHeadlineId}</div>
                  </div>
                )}
              </>
            ) : (
              <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
                Select a promoted excerpt, note, link, file, or media item to inspect its origin.
              </p>
            )}
          </div>
        </Accordion>

        {activeBoard && (
          <div className="mt-3 border border-zinc-800 bg-zinc-900/20 p-3">
            <button
              onClick={handleDeleteBoard}
              disabled={availableBoards.length <= 1}
              className="osint-button-danger inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              Delete Board
            </button>
          </div>
        )}
      </div>
    </>
  );

  const agentPanelBody = (
    <div className="flex min-h-0 flex-1 flex-col bg-black">
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="space-y-4">
          <Accordion
            title="Agent Context"
            icon={Shapes}
            count={selectedEntries.length || undefined}
            isOpen={agentSections.context}
            onToggle={() => toggleAgentSection('context')}
          >
            <div className="space-y-3 bg-black/20 p-3 text-sm text-zinc-300">
              <div>
                {selectedEntries.length > 0
                  ? `${selectedEntries.length} selected item${selectedEntries.length === 1 ? '' : 's'}`
                  : 'Entire board in view'}
              </div>
              {selectedEntries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedEntries.slice(0, 4).map((entry) => (
                    <span
                      key={boardRefKey(entry)}
                      className="rounded-none border border-zinc-800 bg-black/80 px-2.5 py-1 text-[11px] text-zinc-300"
                    >
                      {entry.title}
                    </span>
                  ))}
                  {selectedEntries.length > 4 && (
                    <span className="rounded-none border border-zinc-800 bg-black/80 px-2.5 py-1 text-[11px] text-zinc-500">
                      +{selectedEntries.length - 4} more
                    </span>
                  )}
                </div>
              )}
              {aiSummary && (
                <div className="border border-zinc-800 bg-black/30 p-3 text-xs leading-6 text-zinc-300">
                  {aiSummary}
                </div>
              )}
            </div>
          </Accordion>

          {boardAgentMessage ? (
            <div className="border border-zinc-800 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                <Bot className="h-3.5 w-3.5 text-osint-primary" />
                Agent Response
              </div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                {boardAgentMessage}
              </div>
            </div>
          ) : null}

          {(visibleBoardAgentSession || boardAgentTodoItems.length > 0) && (
            <Accordion
              title="Session"
              icon={Clock3}
              isOpen={agentSections.session}
              onToggle={() => toggleAgentSection('session')}
            >
              <div className="space-y-3 border border-t-0 border-zinc-800 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-zinc-300">
                    {visibleBoardAgentSession?.title || 'Board agent'}
                  </div>
                  {visibleBoardAgentSession && (
                    <div className="rounded-none border border-zinc-800 bg-black/60 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400">
                      {visibleBoardAgentSession.status}
                    </div>
                  )}
                </div>
                {visibleBoardAgentSession && (
                  <div className="text-xs text-zinc-500">
                    {visibleBoardAgentSession.provider || 'Provider pending'}
                    {visibleBoardAgentSession.modelId
                      ? ` - ${visibleBoardAgentSession.modelId}`
                      : ''}
                  </div>
                )}
                {boardAgentBusy ? (
                  <div>
                    <button
                      type="button"
                      onClick={handleCancelBoardAgent}
                      className="inline-flex items-center gap-1 rounded-none border border-red-400/40 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-200 transition hover:bg-red-500/20 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </div>
                ) : null}
                {boardAgentTodoItems.length > 0 && (
                  <div className="space-y-2">
                    {boardAgentTodoItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-zinc-300"
                      >
                        <div>{item.text}</div>
                        <div className="shrink-0 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Accordion>
          )}

          {visibleBoardAgentActions.length > 0 && (
            <Accordion
              title="Recent Actions"
              icon={SlidersHorizontal}
              isOpen={agentSections.actions}
              onToggle={() => toggleAgentSection('actions')}
            >
              <div className="space-y-2 border border-t-0 border-zinc-800 bg-black/20 p-4">
                {visibleBoardAgentActions.slice(0, 8).map((action) => (
                  <div
                    key={action.id}
                    className="border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-zinc-300"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono uppercase tracking-[0.14em] text-zinc-200">
                        {action.type}
                      </div>
                      <div className="font-mono uppercase tracking-[0.14em] text-zinc-500">
                        {action.status}
                      </div>
                    </div>
                    {action.error && (
                      <div className="mt-2 text-[11px] leading-5 text-red-300">{action.error}</div>
                    )}
                    {!action.error && action.result && (
                      <div className="mt-2 overflow-x-auto text-[11px] leading-5 text-zinc-500">
                        {JSON.stringify(action.result)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Accordion>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="border border-zinc-800 bg-black/20">
          <textarea
            value={boardAgentPrompt}
            onChange={(event) => setBoardAgentPrompt(event.target.value)}
            onKeyDown={handleBoardAgentComposerKeyDown}
            placeholder="Ask the board agent to organize evidence, flag contradictions, or draft a note."
            className="min-h-28 w-full resize-none bg-transparent px-4 py-4 text-sm leading-6 text-zinc-300 outline-none placeholder:text-zinc-600"
          />
          <div className="flex items-center justify-between border-t border-zinc-800/80 px-3 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-none border border-zinc-800 bg-zinc-900/80 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                aria-label="Attach files"
                title="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => toggleAgentSection('actions')}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-none border transition ${
                  agentSections.actions
                    ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
                aria-label="Toggle agent details"
                title="Toggle agent details"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => void handleRunBoardAgent()}
              disabled={boardAgentBusy || !boardAgentPrompt.trim()}
              className="osint-button-primary inline-flex items-center gap-2 rounded-none px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              {boardAgentBusy ? 'Running' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
          {activeBoard && (
            <>
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
            </>
          )}
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
        {(leftPanelOpen || rightPanelOpen) && (
          <div
            className="absolute inset-0 z-20 bg-black/80 xl:hidden"
            onClick={() => {
              setLeftPanelOpen(false);
              setRightPanelOpen(false);
            }}
          />
        )}

        <aside
          className={`absolute left-0 top-0 z-30 flex h-full flex-col overflow-hidden border-r border-zinc-800 bg-black/95 transition-all duration-200 xl:relative xl:translate-x-0 ${
            leftPanelOpen
              ? 'w-[min(23rem,calc(100vw-1rem))] translate-x-0'
              : 'w-[min(23rem,calc(100vw-1rem))] -translate-x-full xl:w-0 xl:border-r-0'
          }`}
        >
          <div className="border-b border-zinc-800 px-4 py-4">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
              <Shapes className="h-4 w-4 text-osint-primary" />
              Canonical Library
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setCreateModal({ type: 'NOTE', title: '', content: '' })}
                className="osint-button-primary inline-flex items-center gap-2 px-3 py-2 text-[11px] font-mono uppercase"
              >
                <FilePlus2 className="h-4 w-4" />
                Note
              </button>
              <button
                onClick={() =>
                  setCreateModal({ type: 'LINK', title: '', url: '', description: '' })
                }
                className="osint-button-primary inline-flex items-center gap-2 px-3 py-2 text-[11px] font-mono uppercase"
              >
                <Link2 className="h-4 w-4" />
                Link
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="osint-button-primary inline-flex items-center gap-2 px-3 py-2 text-[11px] font-mono uppercase"
              >
                <Radio className="h-4 w-4" />
                File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search library..."
                className="w-full border border-zinc-700 bg-black px-10 py-2 text-sm text-white outline-none transition focus:border-osint-primary"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden p-3">
            {(
              [
                ['created', 'Created Items', groupedEntries.created, FilePlus2],
                ['artifacts', 'Artifacts', groupedEntries.artifacts, FileText],
                ['entities', 'Entities', groupedEntries.entities, Network],
                ['sources', 'Sources', groupedEntries.sources, Link2],
                ['signals', 'Signals', groupedEntries.signals, Radio],
              ] as const
            ).map(([key, title, entries, icon]) => (
              <Accordion
                key={key}
                title={title}
                count={entries.length}
                icon={icon}
                isOpen={librarySections[key]}
                onToggle={() => toggleLibrarySection(key)}
                contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
              >
                <div className="space-y-2">
                  {entries.length === 0 ? (
                    <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
                      No matching items in this section.
                    </p>
                  ) : (
                    entries.map((entry) => (
                      <div
                        key={boardRefKey(entry)}
                        draggable
                        onDragStart={(event) =>
                          event.dataTransfer.setData(
                            'application/json+sherlock-entry',
                            serializeBoardReference(entry)
                          )
                        }
                      >
                        <Accordion
                          title={entry.title}
                          isOpen={!!libraryItemSections[boardRefKey(entry)]}
                          onToggle={() => toggleLibraryEntrySection(boardRefKey(entry))}
                          className="border-zinc-800 bg-zinc-900/40 text-zinc-200"
                          headerClassName="bg-black/10 px-2.5 py-2 text-left text-[10px] font-normal leading-5 tracking-[0.04em] text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-200"
                          chevronClassName="h-[15px] w-[15px] shrink-0 text-zinc-500"
                        >
                          <div className="space-y-3">
                            <div
                              className={`text-xs leading-5 text-zinc-500 ${
                                key === 'sources' ? 'line-clamp-2 break-all' : ''
                              }`}
                            >
                              {entry.description ||
                                'Open this item from the library to place it on the board.'}
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                                {entry.kind}
                              </div>
                              <div className="flex items-center gap-2">
                                {key === 'created' && entry.refKind === 'WORKSPACE_ITEM' && (
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteCreatedItem(entry)}
                                    className="inline-flex items-center gap-1 border border-zinc-700 px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-400 transition hover:border-red-400/50 hover:text-red-300"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDropEntry(entry)}
                                  className="osint-button-primary px-3 py-1.5 text-[10px] font-mono uppercase"
                                >
                                  Add To Board
                                </button>
                              </div>
                            </div>
                          </div>
                        </Accordion>
                      </div>
                    ))
                  )}
                </div>
              </Accordion>
            ))}
          </div>
        </aside>

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

          {rightPanelView === 'INSPECTOR' ? inspectorPanelBody : agentPanelBody}
        </aside>
      </div>

      {createModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
            <div className="border-b border-zinc-800 px-6 py-4 text-sm font-bold uppercase tracking-widest text-white">
              {createModal.type === 'NOTE' ? 'Create Workspace Note' : 'Capture Workspace Link'}
            </div>
            <div className="space-y-4 p-6">
              <input
                value={createModal.title}
                onChange={(event) =>
                  setCreateModal((current) =>
                    current ? { ...current, title: event.target.value } : current
                  )
                }
                placeholder="Title"
                className="w-full border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none focus:border-osint-primary"
              />
              {createModal.type === 'NOTE' ? (
                <textarea
                  value={createModal.content}
                  onChange={(event) =>
                    setCreateModal((current) =>
                      current && current.type === 'NOTE'
                        ? { ...current, content: event.target.value }
                        : current
                    )
                  }
                  placeholder="Write the note..."
                  className="h-40 w-full resize-none border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none focus:border-osint-primary"
                />
              ) : (
                <>
                  <input
                    value={createModal.url}
                    onChange={(event) =>
                      setCreateModal((current) =>
                        current && current.type === 'LINK'
                          ? { ...current, url: event.target.value }
                          : current
                      )
                    }
                    placeholder="https://..."
                    className="w-full border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none focus:border-osint-primary"
                  />
                  <textarea
                    value={createModal.description}
                    onChange={(event) =>
                      setCreateModal((current) =>
                        current && current.type === 'LINK'
                          ? { ...current, description: event.target.value }
                          : current
                      )
                    }
                    placeholder="Why this link matters..."
                    className="h-28 w-full resize-none border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none focus:border-osint-primary"
                  />
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-4">
              <button
                onClick={() => setCreateModal(null)}
                className="border border-zinc-700 px-4 py-2 text-xs font-mono uppercase text-zinc-400 transition hover:border-zinc-500 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSubmitCreateModal()}
                className="osint-button-primary px-4 py-2 text-xs font-mono uppercase"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}

      {boardPendingDeletion && (
        <ConfirmDialog
          title="Delete Board"
          description={`Delete "${boardPendingDeletion.name}" and its saved board document? This removes this board and its board-agent session history, but keeps the rest of the workspace intact.`}
          confirmLabel="Delete Board"
          tone="danger"
          onClose={() => setBoardPendingDeletion(null)}
          onConfirm={() => {
            void (async () => {
              await deleteWorkspaceBoard(boardPendingDeletion.id);
              setBoardPendingDeletion(null);
            })();
          }}
        />
      )}

      {libraryItemPendingDeletion && (
        <ConfirmDialog
          title="Delete Library Item"
          description={`Delete "${libraryItemPendingDeletion.title}" from the workspace library and remove matching cards from the active board?`}
          confirmLabel="Delete Item"
          tone="danger"
          onClose={() => setLibraryItemPendingDeletion(null)}
          onConfirm={() => {
            void (async () => {
              await confirmDeleteCreatedItem(libraryItemPendingDeletion);
              setLibraryItemPendingDeletion(null);
            })();
          }}
        />
      )}
    </div>
  );
};
