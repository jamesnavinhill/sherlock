import React from 'react';
import {
  Briefcase,
  ChevronDown,
  Download,
  FileJson,
  FilePlus2,
  FileText,
  MessageSquare,
  PanelRight,
  PlayCircle,
  Plus,
} from 'lucide-react';

import type { InvestigationLaunchRequest } from '@/types';
import { sanitizeDisplayTitle } from '@/domain';
import { OsintSelect } from '@/components/ui/OsintSelect';
import { useChatController } from './useChatController';
import { ChatSessionRail } from './ChatSessionRail';
import { ChatTranscript } from './ChatTranscript';
import { ChatComposer } from './ChatComposer';
import { ChatContextRail } from './ChatContextRail';
import { ChatDialogs } from './ChatDialogs';

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
    sanitizeDisplayTitle: sanitizeWorkspaceTitle,
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
                <Plus className="mr-1 h-4 w-4" />
                <span className="hidden lg:inline">New</span>
                <ChevronDown className="ml-1 h-3 w-3" />
              </button>
              {showNewMenu ? (
                <div className="osint-menu-panel absolute left-0 top-full z-50 mt-1 min-w-[220px] border border-zinc-700 bg-zinc-900">
                  <div className="border-b border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-500">
                    Chat
                  </div>
                  <button
                    onClick={() => void handleCreateSession()}
                    disabled={!activeWorkspace}
                    className="osint-menu-item flex w-full items-center border-b border-zinc-800 px-4 py-3 text-left text-xs font-mono text-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
                    title="Start a fresh chat session in the selected workspace"
                  >
                    <MessageSquare className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                    <div>
                      <div className="font-bold">New Session</div>
                      <div className="text-[10px] text-zinc-500">Start a standard workspace chat</div>
                    </div>
                  </button>
                  <button
                    onClick={() => void handleCreateGuidedSession()}
                    disabled={!activeWorkspace}
                    className="osint-menu-item flex w-full items-center px-4 py-3 text-left text-xs font-mono text-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
                    title="Open a guided run builder in the selected workspace"
                  >
                    <PlayCircle className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                    <div>
                      <div className="font-bold">Guided Run</div>
                      <div className="text-[10px] text-zinc-500">Use the step-by-step run builder</div>
                    </div>
                  </button>
                  <div className="border-y border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-500">
                    Workspace
                  </div>
                  <button
                    onClick={handleStartNewProject}
                    className="osint-menu-item flex w-full items-center px-4 py-3 text-left text-xs font-mono text-zinc-300"
                    title="Create a new workspace"
                  >
                    <FilePlus2 className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                    <div>
                      <div className="font-bold">New Project</div>
                      <div className="text-[10px] text-zinc-500">Create or launch a new workspace</div>
                    </div>
                  </button>
                </div>
              ) : null}
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
                  label: sanitizeWorkspaceTitle(workspace.title),
                }))}
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {activeSession ? (
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
                  <Download className="mr-1 h-4 w-4" />
                  <span className="hidden lg:inline">Export</span>
                  <ChevronDown className="ml-1 h-3 w-3" />
                </button>
                {showExportMenu ? (
                  <div className="osint-menu-panel absolute right-0 top-full z-50 mt-1 min-w-[220px] border border-zinc-700 bg-zinc-900">
                    <div className="border-b border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-500">
                      Current Session
                    </div>
                    <button
                      onClick={handleExportSessionMarkdown}
                      className="osint-menu-item flex w-full items-center border-b border-zinc-800 px-4 py-3 text-left text-xs font-mono text-zinc-300"
                      title="Export the current chat session as Markdown"
                    >
                      <FileText className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                      <div>
                        <div className="font-bold">Session Markdown</div>
                        <div className="text-[10px] text-zinc-500">Readable transcript export</div>
                      </div>
                    </button>
                    <button
                      onClick={handleExportSessionJson}
                      className="osint-menu-item flex w-full items-center px-4 py-3 text-left text-xs font-mono text-zinc-300"
                      title="Export the current chat session as JSON"
                    >
                      <FileJson className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                      <div>
                        <div className="font-bold">Session JSON</div>
                        <div className="text-[10px] text-zinc-500">Raw session data for backup</div>
                      </div>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
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
        {leftPanelOpen || rightPanelOpen ? (
          <div
            className="fixed inset-0 z-20 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => {
              setLeftPanelOpen(false);
              setRightPanelOpen(false);
            }}
          />
        ) : null}

        <ChatSessionRail
          activeSessionId={activeSession?.id || null}
          leftPanelOpen={leftPanelOpen}
          leftPanelSections={leftPanelSections}
          workspaceDescription={activeWorkspace?.description}
          workspaceSessions={workspaceSessions}
          chatMessagesBySessionId={chatMessagesBySessionId}
          workspaceTitle={activeWorkspace ? sanitizeDisplayTitle(activeWorkspace.title) : ''}
          sectionScrollClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
          getGuidedSessionState={getGuidedSessionState}
          getSessionTitle={getSessionTitle}
          formatDateTime={formatDateTime}
          onToggleSessions={() => toggleLeftPanelSection('sessions')}
          onToggleWorkspace={() => toggleLeftPanelSection('workspace')}
          onSelectSession={(session) => {
            setActiveChatSessionId(session.id);
            navigateToSession(session.workspaceId, session.id);
            if (window.innerWidth <= 1024) {
              setLeftPanelOpen(false);
            }
          }}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-black">
          <ChatTranscript
            activeSession={activeSession}
            activeWorkspace={activeWorkspace}
            messages={messages}
            workspaces={workspaces}
            workingAssistantMessageId={workingAssistantMessageId}
            workingSessionId={workingSessionId}
            partialAssistantOutput={partialAssistantOutput}
            messageBodyClassName={messageBodyClassName}
            sectionLabelClassName={sectionLabelClassName}
            transcriptEndRef={transcriptEndRef}
            splitCollapsedFollowUpBlock={splitCollapsedFollowUpBlock}
            formatTimestamp={formatTimestamp}
            copyToClipboard={copyToClipboard}
            formatMessageWithCitations={formatMessageWithCitations}
            handlePromoteAttachment={handlePromoteAttachment}
            handleSaveMessageAsArtifact={handleSaveMessageAsArtifact}
            handleAppendMessageToArtifact={handleAppendMessageToArtifact}
            handleLaunchFollowUp={handleLaunchFollowUp}
            handleStartNewProject={handleStartNewProject}
            handleCreateSession={handleCreateSession}
          />

          <ChatComposer
            key={`${activeSession?.id || 'guided'}:${guidedState?.step || 'chat'}`}
            activeWorkspace={activeWorkspace}
            customScopes={customScopes}
            draft={draft}
            guidedState={guidedState}
            isBusy={chatGenerationStatus === 'GENERATING' || chatGenerationStatus === 'CANCELLING'}
            chatGenerationStatus={chatGenerationStatus}
            onSubmit={handleSend}
            onDraftChange={setDraft}
            onKeyDown={handleComposerKeyDown}
            onStopGeneration={handleStopGeneration}
            onAdvanceGuided={handleAdvanceGuided}
            onGuidedBack={handleGuidedBack}
            onGuidedLaunch={handleGuidedLaunch}
            onGuidedSaveDraft={handleGuidedSaveDraft}
            onOpenManualSetup={handleOpenManualSetup}
          />
        </div>

        <ChatContextRail
          rightPanelOpen={rightPanelOpen}
          rightPanelSections={rightPanelSections}
          launchContextSummary={launchContextSummary}
          workspaceReports={workspaceReports}
          workspaceSignals={workspaceSignals}
          latestAssistantMessage={latestAssistantMessage}
          sessionActions={sessionActions}
          expandedArtifactIds={expandedArtifactIds}
          formatDateTime={formatDateTime}
          onToggleSection={toggleRightPanelSection}
          onToggleArtifactCard={toggleArtifactCard}
          onFetchArtifactSummary={(artifactId) => {
            void handleFetchArtifactSummary(artifactId);
          }}
          onFetchFullArtifact={(artifactId) => {
            void handleFetchFullArtifact(artifactId);
          }}
          onFetchRecentSignals={() => {
            void handleFetchRecentSignals();
          }}
        />
      </div>

      <ChatDialogs
        activeWorkspace={activeWorkspace}
        manualSetupDraft={manualSetupDraft}
        showNewProjectModal={showNewProjectModal}
        renameSessionDialog={renameSessionDialog}
        deleteSessionDialog={deleteSessionDialog}
        appendArtifactDialog={appendArtifactDialog}
        followUpDialog={followUpDialog}
        appendableWorkspaceReports={appendableWorkspaceReports}
        onLaunchInvestigation={onLaunchInvestigation}
        onCloseManualSetup={() => setManualSetupDraft(null)}
        onCloseNewProjectModal={() => setShowNewProjectModal(false)}
        onCloseRenameSession={() => setRenameSessionDialog(null)}
        onCloseDeleteSession={() => setDeleteSessionDialog(null)}
        onCloseAppendArtifact={() => setAppendArtifactDialog(null)}
        onCloseFollowUp={() => setFollowUpDialog(null)}
        onConfirmRenameSession={handleConfirmRenameSession}
        onConfirmDeleteSession={handleConfirmDeleteSession}
        onConfirmAppendMessageToArtifact={handleConfirmAppendMessageToArtifact}
        onConfirmLaunchFollowUp={handleConfirmLaunchFollowUp}
        onRenameTitleChange={(value) =>
          setRenameSessionDialog((current) => (current ? { ...current, title: value } : current))
        }
        onAppendArtifactChange={(selectedReportId) =>
          setAppendArtifactDialog((current) =>
            current ? { ...current, selectedReportId } : current
          )
        }
        onFollowUpTopicChange={(topic) =>
          setFollowUpDialog((current) => (current ? { ...current, topic } : current))
        }
      />
    </div>
  );
};
