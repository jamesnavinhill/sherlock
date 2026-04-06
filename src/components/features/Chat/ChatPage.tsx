import React from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Briefcase,
  Bot,
  ChevronDown,
  ChevronRight,
  CircleStop,
  Clipboard,
  Download,
  FilePlus2,
  FileJson,
  FileSearch,
  FileText,
  Layout,
  MessageSquare,
  PanelRight,
  Pencil,
  PlayCircle,
  Plus,
  Send,
  Trash2,
  Workflow,
} from 'lucide-react';
import type { InvestigationLaunchRequest } from '@/types';
import { OsintSelect } from '../../ui/OsintSelect';
import { GuidedRunBuilder } from './GuidedRunBuilder';
import { TaskSetupModal } from '../Runs/TaskSetupModal';
import { Accordion } from '../../ui/Accordion';
import { EmptyState } from '../../ui/EmptyState';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { ModalShell } from '../../ui/ModalShell';
import { TextPromptDialog } from '../../ui/TextPromptDialog';
import { useChatController } from './useChatController';

interface ChatProps {
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
}

export const Chat: React.FC<ChatProps> = ({ onLaunchInvestigation }) => {
  const {
    activeSession,
    activeWorkspace,
    appendArtifactDialog,
    appendableWorkspaceReports,
    chatGenerationStatus,
    chatMessagesBySessionId,
    copyToClipboard,
    customScopes,
    deleteSessionDialog,
    draft,
    expandedArtifactIds,
    exportMenuRef,
    followUpDialog,
    formatDateTime,
    formatMessageWithCitations,
    formatTimestamp,
    getSessionTitle,
    getGuidedSessionState,
    guidedState,
    handleAdvanceGuided,
    handleComposerKeyDown,
    handleConfirmAppendMessageToArtifact,
    handleConfirmDeleteSession,
    handleConfirmLaunchFollowUp,
    handleConfirmRenameSession,
    handleCreateGuidedSession,
    handleCreateSession,
    handleDeleteSession,
    handleExportSessionJson,
    handleExportSessionMarkdown,
    handleFetchArtifactSummary,
    handleFetchFullArtifact,
    handleFetchRecentSignals,
    handleGuidedBack,
    handleGuidedLaunch,
    handleGuidedSaveDraft,
    handleLaunchFollowUp,
    handleOpenManualSetup,
    handlePromoteAttachment,
    handleRenameSession,
    handleAppendMessageToArtifact,
    handleSaveMessageAsArtifact,
    handleSend,
    handleStartNewProject,
    handleStopGeneration,
    latestAssistantMessage,
    launchContextSummary,
    leftPanelOpen,
    leftPanelSections,
    LEFT_PANEL_SECTION_SCROLL_CLASS,
    manualSetupDraft,
    messageBodyClassName,
    messages,
    navigateToSession,
    newMenuRef,
    partialAssistantOutput,
    renameSessionDialog,
    rightPanelOpen,
    rightPanelSections,
    sectionLabelClassName,
    sessionActions,
    setActiveChatSessionId,
    setActiveWorkspaceId,
    setAppendArtifactDialog,
    setDraft,
    setDeleteSessionDialog,
    setFollowUpDialog,
    setLeftPanelOpen,
    setManualSetupDraft,
    setRenameSessionDialog,
    setRightPanelOpen,
    setShowExportMenu,
    setShowNewMenu,
    setShowNewProjectModal,
    showExportMenu,
    showNewMenu,
    showNewProjectModal,
    splitCollapsedFollowUpBlock,
    toggleArtifactCard,
    toggleLeftPanelSection,
    toggleRightPanelSection,
    transcriptEndRef,
    workspaces,
    workspaceReports,
    workspaceSessions,
    workspaceSignals,
    workingAssistantMessageId,
    workingSessionId,
    buildManualSetupSeed,
    sanitizeDisplayTitle,
  } = useChatController({ onLaunchInvestigation });

  return (
    <div className="flex h-full min-h-0 flex-col bg-black text-zinc-100">
      <header className="sticky top-0 z-30 h-20 border-b border-zinc-800 bg-black/95 px-4 backdrop-blur-md sm:px-6">
        <div className="flex h-full items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              onClick={() => setLeftPanelOpen((current) => !current)}
              className={`hidden items-center justify-center border p-2 text-xs font-mono uppercase transition md:flex ${
                leftPanelOpen
                  ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                  : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
              }`}
              title="Toggle Sessions Panel"
            >
              <Briefcase className="h-4 w-4" />
            </button>
            <div className="relative" ref={newMenuRef}>
              <button
                onClick={() => {
                  setShowNewMenu((current) => !current);
                  setShowExportMenu(false);
                }}
                className="osint-button-primary flex items-center px-3 py-1.5 font-mono text-xs font-bold uppercase"
                title="Create a new chat item"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden lg:inline">New</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              {showNewMenu && (
                <div className="osint-menu-panel absolute left-0 top-full mt-1 bg-zinc-900 border border-zinc-700 z-50 min-w-[220px]">
                  <div className="px-3 py-1.5 text-[10px] text-zinc-500 font-mono uppercase border-b border-zinc-800 bg-zinc-900/50">
                    Chat
                  </div>
                  <button
                    onClick={() => void handleCreateSession()}
                    disabled={!activeWorkspace}
                    className="osint-menu-item w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 flex items-center border-b border-zinc-800 disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
                    title="Start a fresh chat session in the selected workspace"
                  >
                    <MessageSquare className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                    <div>
                      <div className="font-bold">New Session</div>
                      <div className="text-[10px] text-zinc-500">
                        Start a standard workspace chat
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => void handleCreateGuidedSession()}
                    disabled={!activeWorkspace}
                    className="osint-menu-item w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 flex items-center disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
                    title="Open a guided run builder in the selected workspace"
                  >
                    <PlayCircle className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                    <div>
                      <div className="font-bold">Guided Run</div>
                      <div className="text-[10px] text-zinc-500">
                        Use the step-by-step run builder
                      </div>
                    </div>
                  </button>
                  <div className="px-3 py-1.5 text-[10px] text-zinc-500 font-mono uppercase border-y border-zinc-800 bg-zinc-900/50">
                    Workspace
                  </div>
                  <button
                    onClick={handleStartNewProject}
                    className="osint-menu-item w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 flex items-center"
                    title="Create a new workspace"
                  >
                    <FilePlus2 className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                    <div>
                      <div className="font-bold">New Project</div>
                      <div className="text-[10px] text-zinc-500">
                        Create or launch a new workspace
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <div className="hidden w-72 min-w-0 flex-1 md:block lg:max-w-md xl:max-w-xl">
              <OsintSelect
                ariaLabel="Chat workspace"
                value={activeWorkspace?.id || ''}
                onChange={(value) => setActiveWorkspaceId(value || null)}
                placeholder="Select workspace"
                triggerClassName="py-1.5 pl-3 pr-8 text-xs font-mono"
                options={workspaces.map((workspace) => ({
                  value: workspace.id,
                  label: sanitizeDisplayTitle(workspace.title),
                }))}
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {activeSession && (
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => {
                    setShowExportMenu((current) => !current);
                    setShowNewMenu(false);
                  }}
                  className={`flex items-center px-3 py-1.5 font-mono text-xs font-bold uppercase ${
                    showExportMenu ? 'osint-button-chrome-active' : 'osint-button-chrome'
                  }`}
                  title="Export current chat session"
                >
                  <Download className="w-4 h-4 mr-1" />
                  <span className="hidden lg:inline">Export</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>
                {showExportMenu && (
                  <div className="osint-menu-panel absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 z-50 min-w-[220px]">
                    <div className="px-3 py-1.5 text-[10px] text-zinc-500 font-mono uppercase border-b border-zinc-800 bg-zinc-900/50">
                      Current Session
                    </div>
                    <button
                      onClick={handleExportSessionMarkdown}
                      className="osint-menu-item w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 flex items-center border-b border-zinc-800"
                      title="Export the current chat session as Markdown"
                    >
                      <FileText className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                      <div>
                        <div className="font-bold">Session Markdown</div>
                        <div className="text-[10px] text-zinc-500">Readable transcript export</div>
                      </div>
                    </button>
                    <button
                      onClick={handleExportSessionJson}
                      className="osint-menu-item w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 flex items-center"
                      title="Export the current chat session as JSON"
                    >
                      <FileJson className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                      <div>
                        <div className="font-bold">Session JSON</div>
                        <div className="text-[10px] text-zinc-500">Raw session data for backup</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setRightPanelOpen((current) => !current)}
              className={`hidden items-center justify-center border p-2 text-xs font-mono uppercase transition xl:flex ${
                rightPanelOpen
                  ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                  : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
              }`}
              title="Toggle Context Panel"
            >
              <PanelRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {(leftPanelOpen || rightPanelOpen) && (
          <div
            className="fixed inset-0 z-20 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => {
              setLeftPanelOpen(false);
              setRightPanelOpen(false);
            }}
          />
        )}

        <aside
          className={`${leftPanelOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:-translate-x-0 lg:border-r-0'} fixed inset-y-0 left-0 z-30 w-80 overflow-hidden border-r border-zinc-800 bg-black/95 shadow-2xl transition-all duration-300 lg:relative lg:z-0 lg:flex lg:flex-shrink-0 lg:flex-col lg:shadow-none ${leftPanelOpen ? 'lg:w-80' : 'lg:w-0'} backdrop-blur-md`}
        >
          <div className="border-b border-zinc-800 bg-zinc-900/30 p-4">
            <h2 className="text-base font-bold text-white">
              {activeWorkspace ? sanitizeDisplayTitle(activeWorkspace.title) : ''}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto bg-black/20 p-2 custom-scrollbar">
            <Accordion
              title="Sessions"
              count={workspaceSessions.length}
              icon={MessageSquare}
              isOpen={leftPanelSections.sessions}
              onToggle={() => toggleLeftPanelSection('sessions')}
              contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
            >
              <div className="space-y-1">
                {workspaceSessions.length === 0 ? (
                  <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
                    No chat history for this workspace yet.
                  </p>
                ) : (
                  workspaceSessions.map((session) => {
                    const sessionGuidedState = getGuidedSessionState(session);
                    const sessionMessageCount = chatMessagesBySessionId[session.id]?.length || 0;

                    return (
                      <div
                        key={session.id}
                        className={`border-l-2 ${
                          activeSession?.id === session.id
                            ? 'border-osint-primary bg-zinc-900/50'
                            : 'border-transparent bg-zinc-900/20 hover:border-zinc-600'
                        }`}
                      >
                        <button
                          onClick={() => {
                            setActiveChatSessionId(session.id);
                            navigateToSession(session.workspaceId, session.id);
                            if (window.innerWidth <= 1024) setLeftPanelOpen(false);
                          }}
                          className="w-full px-2 py-2 text-left"
                        >
                          <div className="line-clamp-2 text-sm text-zinc-200">
                            {getSessionTitle(session)}
                          </div>
                          <div className="mt-1 text-[10px] font-mono uppercase text-zinc-500">
                            {sessionGuidedState ? 'Guided' : 'Chat'} · {sessionMessageCount}{' '}
                            messages
                          </div>
                          <div className="mt-1 text-[10px] text-zinc-600">
                            {formatDateTime(session.updatedAt)}
                          </div>
                        </button>
                        <div className="flex gap-3 px-2 pb-2">
                          <button
                            onClick={() => handleRenameSession(session)}
                            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-zinc-500 transition hover:text-white"
                          >
                            <Pencil className="h-3 w-3" />
                            Rename
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session)}
                            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-zinc-500 osint-danger-inline"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Accordion>

            <Accordion
              title="Workspace Summary"
              icon={FileText}
              isOpen={leftPanelSections.workspace}
              onToggle={() => toggleLeftPanelSection('workspace')}
              contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
            >
              <p className="px-2 py-1 text-xs leading-6 text-zinc-400">
                {activeWorkspace?.description || 'No workspace summary saved yet.'}
              </p>
            </Accordion>
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-black">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 pb-4">
              {!activeWorkspace ? (
                <EmptyState
                  icon={MessageSquare}
                  title={
                    workspaces.length === 0
                      ? 'Workspace Chat Needs A Workspace'
                      : 'No Workspace Selected'
                  }
                  description={
                    workspaces.length === 0
                      ? 'Start a workspace first. Chat sessions are scoped to one workspace so every answer stays local, grounded, and auditable.'
                      : 'Select a workspace from the header to open sessions, context, and chat history.'
                  }
                  action={
                    workspaces.length === 0
                      ? {
                          label: 'Start New Project',
                          onClick: handleStartNewProject,
                        }
                      : undefined
                  }
                  className="px-0 py-6"
                  panelClassName="max-w-3xl px-6 py-8"
                />
              ) : (
                messages.length === 0 && (
                  <EmptyState
                    icon={MessageSquare}
                    title={activeSession ? 'Session Ready' : 'No Chat Session'}
                    description={
                      activeSession
                        ? 'Ask about this workspace to begin the transcript.'
                        : 'Start a workspace chat session or use the composer below to begin a grounded transcript.'
                    }
                    action={
                      activeSession
                        ? undefined
                        : {
                            label: 'Start New Session',
                            onClick: () => {
                              void handleCreateSession();
                            },
                          }
                    }
                    className="px-0 py-6"
                    panelClassName="max-w-3xl px-6 py-8"
                  />
                )
              )}

              {messages.map((message) => {
                const isStreamingMessage =
                  message.id === workingAssistantMessageId &&
                  message.sessionId === workingSessionId &&
                  (message.status === 'PENDING' || message.status === 'STREAMING');
                const body =
                  isStreamingMessage && partialAssistantOutput
                    ? partialAssistantOutput
                    : message.content;
                const isAssistant = message.role === 'assistant';
                const isUser = message.role === 'user';
                const isTool = message.role === 'tool';
                const { primaryBody, collapsedBody } = isAssistant
                  ? splitCollapsedFollowUpBlock(body)
                  : { primaryBody: body, collapsedBody: '' };

                return (
                  <article
                    key={message.id}
                    className={`${
                      isUser ? 'self-end' : 'self-start'
                    } ${isTool ? 'w-full' : 'w-full max-w-3xl'} border p-4 ${
                      isUser
                        ? 'border-zinc-700 bg-black'
                        : isTool
                          ? 'border-osint-primary/30 bg-osint-primary/5'
                          : 'border-zinc-800 bg-zinc-900/80'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className={`flex items-center gap-2 ${sectionLabelClassName}`}>
                        {isAssistant ? (
                          <Bot className="h-4 w-4 text-osint-primary" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-zinc-400" />
                        )}
                        {message.role}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-600">
                        <span>{formatTimestamp(message.createdAt)}</span>
                        <button
                          onClick={() =>
                            void copyToClipboard(
                              formatMessageWithCitations(message),
                              'Message copied to clipboard.'
                            )
                          }
                          className="inline-flex items-center gap-1 transition hover:text-white"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                          Copy
                        </button>
                      </div>
                    </div>

                    {isStreamingMessage && !body ? (
                      <div className="text-sm text-zinc-500">Generating response...</div>
                    ) : (
                      <>
                        <div className={messageBodyClassName}>
                          <ReactMarkdown>{primaryBody}</ReactMarkdown>
                        </div>
                        {collapsedBody && (
                          <div className="mt-4 border-t border-zinc-800 pt-3">
                            <details className="group">
                              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500 transition hover:text-white [&::-webkit-details-marker]:hidden">
                                Suggested Topics
                                <ChevronDown className="h-4 w-4 shrink-0" />
                              </summary>
                              <div className={`mt-3 ${messageBodyClassName}`}>
                                <ReactMarkdown>{collapsedBody}</ReactMarkdown>
                              </div>
                            </details>
                          </div>
                        )}
                      </>
                    )}

                    {!!message.attachments?.length && (
                      <div className="mt-4 border-t border-zinc-800 pt-3">
                        <details className="group">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500 transition hover:text-white [&::-webkit-details-marker]:hidden">
                            {`Related Context (${message.attachments.length})`}
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          </summary>
                          <div className="mt-3 space-y-2">
                            {message.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="border border-zinc-800 bg-zinc-900/20 p-3"
                              >
                                <div className="text-sm text-zinc-200">{attachment.title}</div>
                                {attachment.snippet && (
                                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                                    {attachment.snippet}
                                  </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    onClick={() =>
                                      void handlePromoteAttachment(message, attachment)
                                    }
                                    className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wide text-zinc-300 transition hover:border-osint-primary hover:text-white"
                                  >
                                    <FilePlus2 className="h-3.5 w-3.5" />
                                    Promote Excerpt
                                  </button>
                                  <button
                                    onClick={() =>
                                      void handlePromoteAttachment(message, attachment, true)
                                    }
                                    className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wide text-zinc-300 transition hover:border-osint-primary hover:text-white"
                                  >
                                    <Layout className="h-3.5 w-3.5" />
                                    Promote To Board
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}

                    {isAssistant &&
                    message.status === 'COMPLETED' &&
                    message.content.trim().length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
                        <button
                          onClick={() => void handleSaveMessageAsArtifact(message)}
                          className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-2 text-[11px] font-mono uppercase tracking-wide text-zinc-300 transition hover:border-osint-primary hover:text-white"
                        >
                          <FilePlus2 className="h-3.5 w-3.5" />
                          Save Draft
                        </button>
                        <button
                          onClick={() => void handleAppendMessageToArtifact(message)}
                          className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-2 text-[11px] font-mono uppercase tracking-wide text-zinc-300 transition hover:border-osint-primary hover:text-white"
                        >
                          <FileSearch className="h-3.5 w-3.5" />
                          Append To Artifact
                        </button>
                        <button
                          onClick={() => void handleLaunchFollowUp(message)}
                          className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-2 text-[11px] font-mono uppercase tracking-wide text-zinc-300 transition hover:border-osint-primary hover:text-white"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          Follow-up Run
                        </button>
                      </div>
                    ) : null}

                    {message.status === 'CANCELLED' && (
                      <div className="mt-3 border-t border-amber-950 pt-3 text-sm text-amber-300">
                        Generation was stopped before completion.
                      </div>
                    )}

                    {message.error && (
                      <div className="osint-danger-banner mt-3 border-t pt-3 text-sm">
                        {message.error}
                      </div>
                    )}
                  </article>
                );
              })}

              <div ref={transcriptEndRef} />
            </div>
          </div>

          {activeWorkspace && guidedState ? (
            <GuidedRunBuilder
              key={`${activeSession?.id || 'guided'}:${guidedState.step}`}
              state={guidedState}
              customScopes={customScopes}
              workspace={activeWorkspace}
              isBusy={
                chatGenerationStatus === 'GENERATING' || chatGenerationStatus === 'CANCELLING'
              }
              onAdvance={handleAdvanceGuided}
              onBack={handleGuidedBack}
              onLaunchRun={handleGuidedLaunch}
              onSaveDraft={handleGuidedSaveDraft}
              onOpenManualSetup={handleOpenManualSetup}
            />
          ) : (
            <form
              onSubmit={handleSend}
              className="h-[150px] border-t border-zinc-800 bg-black/95 px-4 sm:px-6"
            >
              <div className="mx-auto h-full max-w-4xl py-2">
                <div className="relative">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={
                      activeWorkspace
                        ? `Ask about ${sanitizeDisplayTitle(activeWorkspace.title)}...`
                        : 'Select a workspace to begin chatting...'
                    }
                    className="h-full min-h-0 w-full resize-none border border-zinc-700 bg-black px-4 py-4 pb-14 pr-24 text-sm text-white outline-none transition focus:border-osint-primary"
                  />

                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {chatGenerationStatus === 'GENERATING' ||
                    chatGenerationStatus === 'CANCELLING' ? (
                      <button
                        type="button"
                        onClick={handleStopGeneration}
                        className="osint-button-danger inline-flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wide"
                      >
                        <CircleStop className="h-4 w-4" />
                        Stop
                      </button>
                    ) : null}
                    <button
                      type="submit"
                      disabled={
                        !activeWorkspace ||
                        !draft.trim() ||
                        chatGenerationStatus === 'GENERATING' ||
                        chatGenerationStatus === 'CANCELLING'
                      }
                      aria-label="Send message"
                      title="Send message"
                      className="osint-button-primary inline-flex h-10 w-10 items-center justify-center p-0 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </section>

        <aside
          className={`${rightPanelOpen ? 'translate-x-0' : 'translate-x-full xl:w-0 xl:translate-x-0'} fixed inset-y-0 right-0 z-30 w-96 overflow-hidden border-l border-zinc-800 bg-black/95 shadow-2xl transition-all duration-300 xl:relative xl:z-0 xl:flex xl:flex-shrink-0 xl:flex-col xl:shadow-none ${rightPanelOpen ? 'xl:w-96' : 'xl:w-0'} backdrop-blur-md`}
        >
          <div className="border-b border-zinc-800 bg-zinc-900/30 p-4">
            <h2 className="text-base font-bold text-white">Context</h2>
          </div>
          <div className="flex-1 overflow-y-auto bg-black/20 p-2 custom-scrollbar">
            {launchContextSummary ? (
              <Accordion
                title={launchContextSummary.label}
                icon={FileText}
                isOpen={rightPanelSections.launchContext}
                onToggle={() => toggleRightPanelSection('launchContext')}
              >
                <div className="space-y-2 px-2 py-1 text-xs text-zinc-400">
                  <div className="text-sm text-white">{launchContextSummary.title}</div>
                  <p className="leading-5">{launchContextSummary.body}</p>
                </div>
              </Accordion>
            ) : null}

            <Accordion
              title="Recent Artifacts"
              count={Math.min(workspaceReports.length, 4)}
              icon={FileText}
              isOpen={rightPanelSections.recentArtifacts}
              onToggle={() => toggleRightPanelSection('recentArtifacts')}
            >
              <div className="space-y-2">
                {workspaceReports.slice(0, 4).length === 0 ? (
                  <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
                    No saved artifacts for this workspace yet.
                  </p>
                ) : (
                  workspaceReports.slice(0, 4).map((artifact) => {
                    const artifactKey = artifact.id || artifact.topic;
                    const isExpanded = !!expandedArtifactIds[artifactKey];

                    return (
                      <div key={artifactKey} className="border border-zinc-800 bg-zinc-900/20 p-2">
                        <button
                          type="button"
                          onClick={() => toggleArtifactCard(artifactKey)}
                          className="flex w-full items-start justify-between gap-3 text-left"
                        >
                          <div className="text-sm text-zinc-200">{artifact.topic}</div>
                          {isExpanded ? (
                            <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500" />
                          ) : (
                            <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500" />
                          )}
                        </button>
                        {isExpanded ? (
                          <>
                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                              {artifact.summary}
                            </p>
                            <div className="mt-2 flex gap-3">
                              <button
                                onClick={() =>
                                  artifact.id && void handleFetchArtifactSummary(artifact.id)
                                }
                                className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-zinc-500 transition hover:text-osint-primary"
                              >
                                <FileText className="h-3 w-3" />
                                Summary
                              </button>
                              <button
                                onClick={() =>
                                  artifact.id && void handleFetchFullArtifact(artifact.id)
                                }
                                className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-zinc-500 transition hover:text-osint-primary"
                              >
                                <FileSearch className="h-3 w-3" />
                                Full Text
                              </button>
                            </div>
                          </>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </Accordion>

              <Accordion
                title="Recent Signals"
                count={Math.min(workspaceSignals.length, 4)}
                icon={FileSearch}
                isOpen={rightPanelSections.recentSignals}
                onToggle={() => toggleRightPanelSection('recentSignals')}
            >
              <div className="space-y-2">
                <div className="flex justify-end">
                  <button
                    onClick={() => void handleFetchRecentSignals()}
                    className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-zinc-500 transition hover:text-osint-primary"
                  >
                    <FileSearch className="h-3 w-3" />
                    Pin To Chat
                  </button>
                </div>
                {workspaceSignals.slice(0, 4).length === 0 ? (
                  <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
                    No saved signals linked to this workspace.
                  </p>
                ) : (
                  workspaceSignals.slice(0, 4).map((signal) => (
                    <div key={signal.id} className="border border-zinc-800 bg-zinc-900/20 p-2">
                      <div className="text-sm text-zinc-200">
                        {signal.source || signal.type}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{signal.content}</p>
                    </div>
                  ))
                )}
              </div>
            </Accordion>

            {latestAssistantMessage?.attachments?.length ? (
              <Accordion
                title="Latest Retrieval"
                count={latestAssistantMessage.attachments.length}
                icon={FileSearch}
                isOpen={rightPanelSections.latestRetrieval}
                onToggle={() => toggleRightPanelSection('latestRetrieval')}
              >
                <div className="space-y-2">
                  {latestAssistantMessage.attachments.map((attachment) => (
                    <div key={attachment.id} className="border border-zinc-800 bg-zinc-900/20 p-2">
                      <div className="text-sm text-zinc-200">{attachment.title}</div>
                      {attachment.snippet && (
                        <p className="mt-1 text-xs leading-5 text-zinc-500">{attachment.snippet}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Accordion>
            ) : null}

            <Accordion
              title="Action Log"
              count={Math.min(sessionActions.length, 8)}
              icon={Workflow}
              isOpen={rightPanelSections.actionLog}
              onToggle={() => toggleRightPanelSection('actionLog')}
            >
              <div className="space-y-2">
                {sessionActions.length === 0 ? (
                  <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
                    No chat actions recorded yet.
                  </p>
                ) : (
                  sessionActions.slice(0, 8).map((action) => (
                    <div key={action.id} className="border border-zinc-800 bg-zinc-900/20 p-2">
                      <div className="text-[10px] font-mono uppercase text-zinc-400">
                        {action.type}
                      </div>
                      <div className="mt-1 text-[10px] text-zinc-600">
                        {formatDateTime(action.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Accordion>
          </div>
        </aside>
      </div>

      {manualSetupDraft && (
        <TaskSetupModal
          {...buildManualSetupSeed(manualSetupDraft)}
          initialContext={
            manualSetupDraft.workspaceIntent === 'CURRENT' && activeWorkspace
              ? {
                  topic: activeWorkspace.title,
                  summary: activeWorkspace.description || `${activeWorkspace.title} workspace`,
                }
              : undefined
          }
          inheritanceHint="The guided builder already populated these fields. Adjust anything you want before launch."
          onCancel={() => setManualSetupDraft(null)}
          onStart={(topic, configOverride, preseededEntities, scope, dateRange) => {
            onLaunchInvestigation({
              topic,
              configOverride,
              preseededEntities,
              scope,
              dateRangeOverride: dateRange,
              switchToView: true,
              launchSource: 'CHAT_GUIDED_MANUAL',
            });
            setManualSetupDraft(null);
          }}
        />
      )}

      {showNewProjectModal && (
        <TaskSetupModal
          initialTopic=""
          initialScopeId={activeWorkspace?.scopeId}
          onCancel={() => setShowNewProjectModal(false)}
          onStart={(topic, configOverride, preseededEntities, scope, dateRange) => {
            onLaunchInvestigation({
              topic,
              configOverride,
              preseededEntities,
              scope,
              dateRangeOverride: dateRange,
              switchToView: true,
              launchSource: 'CHAT_NEW_PROJECT',
            });
            setShowNewProjectModal(false);
          }}
        />
      )}

      {renameSessionDialog && (
        <TextPromptDialog
          title="Rename Chat Session"
          description="Choose a clearer session title for this workspace thread."
          label="Session Title"
          value={renameSessionDialog.title}
          onChange={(value) =>
            setRenameSessionDialog((current) => (current ? { ...current, title: value } : current))
          }
          onClose={() => setRenameSessionDialog(null)}
          onConfirm={() => void handleConfirmRenameSession()}
          confirmLabel="Save Title"
          placeholder="Session title"
        />
      )}

      {deleteSessionDialog && (
        <ConfirmDialog
          title="Delete Chat Session"
          description={`Delete "${deleteSessionDialog.title}" and its message history from this workspace?`}
          confirmLabel="Delete Session"
          tone="danger"
          onClose={() => setDeleteSessionDialog(null)}
          onConfirm={() => void handleConfirmDeleteSession()}
        />
      )}

      {appendArtifactDialog && (
        <ModalShell
          title="Append Chat Note"
          description="Choose which saved artifact should receive this chat note as a new custom section."
          onClose={() => setAppendArtifactDialog(null)}
          widthClassName="max-w-lg"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAppendArtifactDialog(null)}
                className="border border-zinc-700 px-4 py-2 text-xs font-mono uppercase text-zinc-400 transition hover:border-zinc-500 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleConfirmAppendMessageToArtifact()}
                className="osint-button-primary px-4 py-2 text-xs font-mono uppercase"
              >
                Append Note
              </button>
            </div>
          }
        >
          <label
            htmlFor="append-artifact-select"
            className="block text-xs font-mono uppercase text-zinc-400"
          >
            Target Artifact
          </label>
          <select
            id="append-artifact-select"
            value={appendArtifactDialog.selectedReportId}
            onChange={(event) =>
              setAppendArtifactDialog((current) =>
                current ? { ...current, selectedReportId: event.target.value } : current
              )
            }
            className="mt-3 w-full border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-osint-primary"
          >
            {appendableWorkspaceReports.map((artifact) => (
              <option key={artifact.id} value={artifact.id}>
                {artifact.topic}
              </option>
            ))}
          </select>
          {appendableWorkspaceReports.find(
            (artifact) => artifact.id === appendArtifactDialog.selectedReportId
          )?.summary ? (
            <p className="mt-4 text-xs leading-5 text-zinc-500">
              {
                appendableWorkspaceReports.find(
                  (artifact) => artifact.id === appendArtifactDialog.selectedReportId
                )?.summary
              }
            </p>
          ) : null}
        </ModalShell>
      )}

      {followUpDialog && (
        <TextPromptDialog
          title="Launch Follow-Up Run"
          description="Adjust the investigation topic before launching this follow-up from chat."
          label="Run Topic"
          value={followUpDialog.topic}
          onChange={(value) =>
            setFollowUpDialog((current) => (current ? { ...current, topic: value } : current))
          }
          onClose={() => setFollowUpDialog(null)}
          onConfirm={() => void handleConfirmLaunchFollowUp()}
          confirmLabel="Launch Run"
          placeholder="Follow-up topic"
        />
      )}
    </div>
  );
};
