import { useEffect } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import type {
  AgentAction,
  ChatMentionReference,
  ChatMessage,
  ChatSession,
  InvestigationLaunchRequest,
} from '@/types';
import {
  buildFilesPath,
  buildWorkspaceArtifactPath,
  buildWorkspaceNetworkPath,
  buildWorkspaceTimelinePath,
} from '@/app/routes';
import { buildTimelineRouteQuery } from '@/components/features/Timeline/timelineRouteState';
import { useChatFeatureState } from '@/store/selectors/chatSelectors';
import {
  fetchArtifactSummaryForChat,
  fetchFullArtifactTextForChat,
  fetchRecentSignalsForChat,
} from '../../../services/chat/runtime';
import type { GuidedRunDraft } from '../../../services/chat/guidedMode';
import { exportChatSessionAsJson, exportChatSessionAsMarkdown } from '../../../utils/exportUtils';
import { sanitizeDisplayTitle } from '../../../domain';
import {
  buildManualSetupSeed,
  formatDateTime,
  formatMessageWithCitations,
  formatTimestamp,
  getGuidedSessionState,
  getSessionTitle,
  LEFT_PANEL_SECTION_SCROLL_CLASS,
  RIGHT_PANEL_SECTION_SCROLL_CLASS,
  sectionLabelClassName,
  splitCollapsedFollowUpBlock,
} from './chatPageUtils';
import {
  advanceGuidedChatSession,
  launchGuidedChatRun,
  rewindGuidedChatSession,
  saveGuidedChatDraft,
} from './chatGuidedActions';
import {
  confirmDeleteChatSession,
  confirmRenameChatSession,
  createGuidedChatSession,
  createStandardChatSession,
  ensureChatSession,
  navigateToChatSession,
} from './chatSessionLifecycle';
import { sendChatTurn, stopChatGeneration } from './chatStreaming';
import {
  appendChatMessageToArtifact,
  buildAppendArtifactDialogState,
  buildFollowUpDialogState,
  launchChatFollowUp,
  promoteChatAttachmentToWorkspace,
  saveChatMessageAsArtifact,
} from './chatTranscriptActions';
import { resolveDraftMentions } from '@/components/ui/omniboxModel';
import { requestNetworkEntityFocus } from '@/services/workspace/workspaceSurfaceFocus';
import { useWorkspaceDocumentUpload } from '@/components/features/shared/useWorkspaceDocumentUpload';
import { useChatViewState } from './useChatViewState';
import { useChatWorkspaceState } from './useChatWorkspaceState';

export type {
  AppendArtifactDialogState,
  FollowUpDialogState,
  RenameSessionDialogState,
} from './useChatViewState';

interface UseChatControllerInput {
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
}

export const useChatController = ({ onLaunchInvestigation }: UseChatControllerInput) => {
  const navigate = useNavigate();
  const {
    artifacts,
    workspaces,
    chatActionsBySessionId,
    chatGenerationStatus,
    chatMessagesBySessionId,
    chatSessions,
    createChatSession,
    createWorkspaceItem,
    updateChatSession,
    activeWorkspaceId,
    activeChatSessionId,
    addChatAction,
    addChatMessage,
    addToast,
    saveArtifact,
    appendSectionToArtifact,
    customScopes,
    deleteChatSession,
    ensureWorkspaceBoard,
    headlines,
    partialAssistantOutput,
    queueBoardPlacement,
    renameChatSession,
    setActiveWorkspaceId,
    setActiveChatSessionId,
    setChatGenerationStatus,
    setPartialAssistantOutput,
    themeMode,
    updateChatMessage,
    workspaceItems,
  } = useChatFeatureState();
  const {
    abortControllerRef,
    appendArtifactDialog,
    artifactCardState,
    deleteSessionDialog,
    draft,
    exportMenuRef,
    followUpDialog,
    leftPanelOpen,
    leftPanelSections,
    manualSetupDraft,
    newMenuRef,
    renameSessionDialog,
    rightPanelOpen,
    rightPanelSections,
    setAppendArtifactDialog,
    setDeleteSessionDialog,
    setDraft,
    setFollowUpDialog,
    setLeftPanelOpen,
    setManualSetupDraft,
    setRenameSessionDialog,
    setRightPanelOpen,
    setShowExportMenu,
    setShowNewMenu,
    setShowNewProjectModal,
    setWorkingAssistantMessageId,
    setWorkingSessionId,
    showExportMenu,
    showNewMenu,
    showNewProjectModal,
    streamedAnswerRef,
    toggleArtifactCard,
    toggleLeftPanelSection,
    toggleRightPanelSection,
    transcriptEndRef,
    workingAssistantMessageId,
    workingSessionId,
  } = useChatViewState({
    activeWorkspaceId,
  });
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
    source: 'CHAT',
    workspaces,
  });

  const navigateToSession = (workspaceId: string, sessionId: string) => {
    navigateToChatSession(navigate, workspaceId, sessionId);
  };

  const {
    activeSession,
    activeWorkspace,
    appendableWorkspaceReports,
    expandedArtifactIds,
    guidedState,
    launchContextSummary,
    latestAssistantMessage,
    mentionCandidates,
    messageBodyClassName,
    messages,
    sessionActions,
    workspaceReports,
    workspaceSessions,
    workspaceSignals,
  } = useChatWorkspaceState({
    activeChatSessionId,
    activeWorkspaceId,
    artifacts,
    artifactCardState,
    chatActionsBySessionId,
    chatMessagesBySessionId,
    chatSessions,
    headlines,
    themeMode,
    workspaceItems: workspaceItems || [],
    workspaces,
  });

  useEffect(() => {
    if (!activeWorkspace) {
      if (activeChatSessionId) {
        setActiveChatSessionId(null);
      }
      return;
    }

    if (
      activeChatSessionId &&
      !workspaceSessions.some((session) => session.id === activeChatSessionId)
    ) {
      setActiveChatSessionId(null);
    }
  }, [activeWorkspace, activeChatSessionId, setActiveChatSessionId, workspaceSessions]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ block: 'end' });
  }, [guidedState, messages, partialAssistantOutput, transcriptEndRef]);

  const copyToClipboard = async (value: string, successMessage: string) => {
    await navigator.clipboard.writeText(value);
    addToast(successMessage, 'SUCCESS');
  };

  const ensureSession = async (options?: {
    metadata?: Record<string, unknown>;
    title?: string;
  }): Promise<ChatSession | null> =>
    ensureChatSession({
      activeSession,
      activeWorkspace,
      addToast,
      createChatSession,
      navigate,
      options,
      setActiveChatSessionId,
    });

  const addToolMessageResult = async (
    factory: (session: ChatSession) => Promise<{ action: AgentAction; message: ChatMessage }>
  ) => {
    const session = await ensureSession();
    if (!session) return;

    const result = await factory(session);
    await addChatMessage(result.message);
    await addChatAction(result.action);
  };

  const handlePromoteAttachment = async (
    message: ChatMessage,
    attachment: NonNullable<ChatMessage['attachments']>[number],
    openInBoard = false
  ) =>
    promoteChatAttachmentToWorkspace({
      activeSession,
      activeWorkspace,
      addToast,
      attachment,
      createWorkspaceItem,
      ensureWorkspaceBoard,
      message,
      navigate,
      openInBoard,
      queueBoardPlacement,
    });

  const handleCreateSession = async () =>
    createStandardChatSession({
      activeWorkspace,
      addToast,
      createChatSession,
      navigate,
      setActiveChatSessionId,
      setShowNewMenu,
    });

  const handleCreateGuidedSession = async () =>
    createGuidedChatSession({
      activeWorkspace,
      addChatMessage,
      addToast,
      createChatSession,
      customScopes,
      navigate,
      setActiveChatSessionId,
      setShowNewMenu,
    });

  const handleRenameSession = async (session: ChatSession) => {
    setRenameSessionDialog({ session, title: session.title });
  };

  const handleDeleteSession = async (session: ChatSession) => {
    setDeleteSessionDialog(session);
  };

  const handleConfirmRenameSession = async () =>
    confirmRenameChatSession({
      addToast,
      renameChatSession,
      renameSessionDialog,
      setRenameSessionDialog,
    });

  const handleConfirmDeleteSession = async () =>
    confirmDeleteChatSession({
      activeChatSessionId,
      activeWorkspace,
      addToast,
      deleteChatSession,
      deleteSessionDialog,
      navigate,
      setDeleteSessionDialog,
    });

  const handleStopGeneration = () =>
    stopChatGeneration({
      abortControllerRef,
      setChatGenerationStatus,
    });

  const handleOpenMention = (mention: ChatMentionReference) => {
    setActiveWorkspaceId(mention.workspaceId);

    if (mention.kind === 'ARTIFACT') {
      navigate(
        buildWorkspaceArtifactPath(mention.workspaceId, mention.refId, {
          focusSectionId:
            typeof mention.metadata?.sectionId === 'string' ? mention.metadata.sectionId : undefined,
          focusEvidenceId:
            typeof mention.metadata?.evidenceId === 'string'
              ? mention.metadata.evidenceId
              : undefined,
          inspector:
            typeof mention.metadata?.sectionId === 'string' ||
            typeof mention.metadata?.evidenceId === 'string'
              ? 'REPORT'
              : undefined,
        })
      );
      return;
    }

    if (mention.kind === 'ENTITY') {
      const entityName =
        typeof mention.metadata?.entityName === 'string' ? mention.metadata.entityName : mention.title;
      navigate(
        buildWorkspaceNetworkPath(mention.workspaceId, {
          focusEntity: entityName,
        })
      );
      window.setTimeout(() => {
        requestNetworkEntityFocus({
          workspaceId: mention.workspaceId,
          entityName,
        });
      }, 0);
      return;
    }

    if (mention.kind === 'SIGNAL') {
      const query = buildTimelineRouteQuery({
        search: '',
        filters: {
          range: 'ALL',
          tracks: ['SIGNAL', 'RUN', 'ARTIFACT', 'ITEM'],
        },
        focusedTrack: 'SIGNAL',
        focusedRefId: mention.refId,
      }).toString();
      navigate(
        `${buildWorkspaceTimelinePath(mention.workspaceId)}${query ? `?${query}` : ''}`
      );
      return;
    }

    navigate(
      buildFilesPath({
        workspaceId: mention.workspaceId,
        focusItemId: mention.kind === 'WORKSPACE_ITEM' ? mention.refId : undefined,
      })
    );
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const query = draft.trim();
    if (!query || chatGenerationStatus === 'GENERATING' || chatGenerationStatus === 'CANCELLING') {
      return;
    }

    const session = await ensureSession();
    if (!session) return;

    const resolvedMentions = resolveDraftMentions(query, mentionCandidates);

    await sendChatTurn({
      draft: query,
      mentions: resolvedMentions,
      messages,
      session,
      abortControllerRef,
      streamedAnswerRef,
      addChatAction,
      addChatMessage,
      addToast,
      onDraftSubmitted: () => setDraft(''),
      renameChatSession,
      setChatGenerationStatus,
      setPartialAssistantOutput,
      setWorkingAssistantMessageId,
      setWorkingSessionId,
      updateChatMessage,
    });
  };

  const handleSaveMessageAsArtifact = async (message: ChatMessage) =>
    saveChatMessageAsArtifact({
      activeSession,
      activeWorkspace,
      addChatAction,
      addToast,
      saveArtifact,
      message,
    });

  const handleAppendMessageToArtifact = async (message: ChatMessage) =>
    setAppendArtifactDialog(
      buildAppendArtifactDialogState({
        activeSession,
        addToast,
        appendableWorkspaceReports,
        message,
      })
    );

  const handleConfirmAppendMessageToArtifact = async () =>
    appendChatMessageToArtifact({
      activeSession,
      addChatAction,
      addToast,
      appendArtifactDialog,
      appendSectionToArtifact,
      appendableWorkspaceReports,
      setAppendArtifactDialog,
    });

  const handleLaunchFollowUp = async (message: ChatMessage) => {
    setFollowUpDialog(
      buildFollowUpDialogState({
        activeSession,
        activeWorkspace,
        message,
      })
    );
  };

  const handleConfirmLaunchFollowUp = async () =>
    launchChatFollowUp({
      addChatAction,
      addToast,
      followUpDialog,
      onLaunchInvestigation,
      setFollowUpDialog,
    });

  const handleAdvanceGuided = async (nextDraft: GuidedRunDraft) =>
    advanceGuidedChatSession({
      activeSession,
      activeWorkspace,
      addChatMessage,
      customScopes,
      guidedState,
      nextDraft,
      updateChatSession,
    });

  const handleGuidedBack = async () =>
    rewindGuidedChatSession({
      activeSession,
      guidedState,
      updateChatSession,
    });

  const handleGuidedLaunch = async () =>
    launchGuidedChatRun({
      activeSession,
      activeWorkspace,
      addChatAction,
      customScopes,
      guidedState,
      onLaunchInvestigation,
    });

  const handleGuidedSaveDraft = async () =>
    saveGuidedChatDraft({
      activeSession,
      activeWorkspace,
      addChatAction,
      addToast,
      saveArtifact,
      customScopes,
      guidedState,
    });

  const handleOpenManualSetup = () => {
    if (!guidedState) return;
    setManualSetupDraft(guidedState.draft);
  };

  const handleFetchArtifactSummary = async (artifactId: string) => {
    await addToolMessageResult((session) => fetchArtifactSummaryForChat({ session, artifactId }));
  };

  const handleFetchFullArtifact = async (artifactId: string) => {
    await addToolMessageResult((session) => fetchFullArtifactTextForChat({ session, artifactId }));
  };

  const handleFetchRecentSignals = async () => {
    await addToolMessageResult((session) => fetchRecentSignalsForChat({ session }));
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleStartNewProject = () => {
    setShowNewMenu(false);
    setShowNewProjectModal(true);
  };

  const handleExportSessionMarkdown = () => {
    if (!activeSession) return;
    exportChatSessionAsMarkdown(activeSession, messages, activeWorkspace || undefined);
    setShowExportMenu(false);
  };

  const handleExportSessionJson = () => {
    if (!activeSession) return;
    exportChatSessionAsJson(activeSession, messages, activeWorkspace || undefined);
    setShowExportMenu(false);
  };

  return {
    activeChatSessionId,
    activeSession,
    activeWorkspace,
    activeWorkspaceId,
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
    fileInputRef,
    followUpDialog,
    formatDateTime,
    formatMessageWithCitations,
    formatTimestamp,
    getSessionTitle,
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
    setActiveWorkspaceId,
    setAppendArtifactDialog,
    setDeleteSessionDialog,
    setDraft,
    setFollowUpDialog,
    setLeftPanelOpen,
    setManualSetupDraft,
    setRenameSessionDialog,
    setRightPanelOpen,
    setShowExportMenu,
    setShowNewMenu,
    setShowNewProjectModal,
    setActiveChatSessionId,
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
    buildManualSetupSeed,
    closeUploadDialog,
    confirmUploadDialog,
    getGuidedSessionState,
    sanitizeDisplayTitle,
  };
};
