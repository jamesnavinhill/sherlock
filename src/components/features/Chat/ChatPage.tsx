import React from 'react';

import type { InvestigationLaunchRequest } from '@/types';
import { getWorkspaceDisplayTitle } from '@/domain';
import { useChatController } from './useChatController';
import { ChatSessionRail } from './ChatSessionRail';
import { ChatTranscript } from './ChatTranscript';
import { ChatComposer } from './ChatComposer';
import { ChatContextRail } from './ChatContextRail';
import { ChatDialogs } from './ChatDialogs';
import { ChatHeader } from './ChatHeader';

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
    handleOpenMention,
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
    mentionCandidates,
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
  } = useChatController({ onLaunchInvestigation });

  return (
    <div className="flex h-full min-h-0 flex-col bg-black text-zinc-100">
      <ChatHeader
        activeSessionId={activeSession?.id || null}
        activeWorkspaceId={activeWorkspace?.id || null}
        exportMenuRef={exportMenuRef}
        leftPanelOpen={leftPanelOpen}
        newMenuRef={newMenuRef}
        rightPanelOpen={rightPanelOpen}
        setShowExportMenu={setShowExportMenu}
        setShowNewMenu={setShowNewMenu}
        showExportMenu={showExportMenu}
        showNewMenu={showNewMenu}
        workspaceDisabled={!activeWorkspace}
        workspaces={workspaces.map((workspace) => ({
          ...workspace,
          title: getWorkspaceDisplayTitle(workspace),
        }))}
        onCreateGuidedSession={handleCreateGuidedSession}
        onCreateSession={handleCreateSession}
        onExportJson={handleExportSessionJson}
        onExportMarkdown={handleExportSessionMarkdown}
        onSelectWorkspace={setActiveWorkspaceId}
        onStartNewWorkspace={handleStartNewProject}
        onToggleExportMenu={() => {
          setShowExportMenu((current) => !current);
          setShowNewMenu(false);
        }}
        onToggleLeftPanel={() => setLeftPanelOpen((current) => !current)}
        onToggleNewMenu={() => {
          setShowNewMenu((current) => !current);
          setShowExportMenu(false);
        }}
        onToggleRightPanel={() => setRightPanelOpen((current) => !current)}
      />

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
          workspaceTitle={activeWorkspace ? getWorkspaceDisplayTitle(activeWorkspace) : ''}
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
            handleOpenMention={handleOpenMention}
            handlePromoteAttachment={handlePromoteAttachment}
            handleSaveMessageAsArtifact={handleSaveMessageAsArtifact}
            handleAppendMessageToArtifact={handleAppendMessageToArtifact}
            handleLaunchFollowUp={handleLaunchFollowUp}
            handleStartNewWorkspace={handleStartNewProject}
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
            mentionCandidates={mentionCandidates}
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
