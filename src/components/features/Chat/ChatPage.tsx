import React from 'react';

import type { InvestigationLaunchRequest } from '@/types';
import { getWorkspaceDisplayTitle } from '@/domain';
import { useChatController } from './useChatController';
import { ChatLibraryRail } from './ChatLibraryRail';
import { ChatTranscript } from './ChatTranscript';
import { ChatComposer } from './ChatComposer';
import { ChatInspectorPanel } from './ChatInspectorPanel';
import { ChatDialogs } from './ChatDialogs';
import { ChatHeader } from './ChatHeader';
import { MainContentDotGrid } from '@/components/ui/MainContentDotGrid';
import { PageShell } from '@/components/system/layout/PageShell';

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
    closeUploadDialog,
    confirmUploadDialog,
    copyToClipboard,
    customScopes,
    deleteSessionDialog,
    draft,
    expandedArtifactIds,
    exportMenuRef,
    fileInputRef,
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
    handleFileUpload,
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
    RIGHT_PANEL_SECTION_SCROLL_CLASS,
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
    setUploadArtifactType,
    setUploadRoute,
    setUploadTargetWorkspaceId,
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
    uploadDialogState,
    uploadInFlight,
    workspaces,
    workspaceReports,
    workspaceSessions,
    workspaceSignals,
    workingAssistantMessageId,
    workingSessionId,
  } = useChatController({ onLaunchInvestigation });

  return (
    <PageShell
      className="osint-shell-stage h-full w-full"
      toolbar={
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
      }
      leftRail={
        <ChatLibraryRail
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
      }
      rightRail={
        <ChatInspectorPanel
          rightPanelOpen={rightPanelOpen}
          workspaceTitle={activeWorkspace ? getWorkspaceDisplayTitle(activeWorkspace) : undefined}
          rightPanelSections={rightPanelSections}
          launchContextSummary={launchContextSummary}
          workspaceReports={workspaceReports}
          workspaceSignals={workspaceSignals}
          latestAssistantMessage={latestAssistantMessage}
          sessionActions={sessionActions}
          expandedArtifactIds={expandedArtifactIds}
          sectionScrollClassName={RIGHT_PANEL_SECTION_SCROLL_CLASS}
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
      }
    >
      {leftPanelOpen || rightPanelOpen ? (
        <div
          className="osint-shell-backdrop absolute inset-0 z-20 lg:hidden"
          onClick={() => {
            setLeftPanelOpen(false);
            setRightPanelOpen(false);
          }}
        />
      ) : null}

      <main className="osint-shell-content-surface relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <MainContentDotGrid testId="chat-dot-grid-background" />
        <ChatTranscript
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
        />

        <ChatComposer
          key={`${activeSession?.id || 'guided'}:${guidedState?.step || 'chat'}`}
          activeWorkspace={activeWorkspace}
          customScopes={customScopes}
          draft={draft}
          guidedState={guidedState}
          isBusy={chatGenerationStatus === 'GENERATING' || chatGenerationStatus === 'CANCELLING'}
          chatGenerationStatus={chatGenerationStatus}
          fileInputRef={fileInputRef}
          mentionCandidates={mentionCandidates}
          onSubmit={handleSend}
          onDraftChange={setDraft}
          onFileUpload={handleFileUpload}
          onKeyDown={handleComposerKeyDown}
          onStopGeneration={handleStopGeneration}
          onAdvanceGuided={handleAdvanceGuided}
          onGuidedBack={handleGuidedBack}
          onGuidedLaunch={handleGuidedLaunch}
          onGuidedSaveDraft={handleGuidedSaveDraft}
          onOpenManualSetup={handleOpenManualSetup}
        />
      </main>

      <ChatDialogs
        activeWorkspace={activeWorkspace}
        workspaces={workspaces}
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
        onCloseUploadDialog={closeUploadDialog}
        onConfirmUploadDialog={confirmUploadDialog}
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
        onUploadArtifactTypeChange={setUploadArtifactType}
        onUploadRouteChange={setUploadRoute}
        onUploadTargetWorkspaceChange={setUploadTargetWorkspaceId}
        uploadDialogState={uploadDialogState}
        uploadInFlight={uploadInFlight}
      />
    </PageShell>
  );
};
