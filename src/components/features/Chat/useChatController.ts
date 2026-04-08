import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import type {
  AgentAction,
  Artifact,
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
import { useChatFeatureState } from '@/store/selectors/featureSelectors';
import {
  fetchArtifactSummaryForChat,
  fetchFullArtifactTextForChat,
  fetchRecentSignalsForChat,
} from '../../../services/chat/runtime';
import type { GuidedRunDraft } from '../../../services/chat/guidedMode';
import { exportChatSessionAsJson, exportChatSessionAsMarkdown } from '../../../utils/exportUtils';
import { getChatLaunchContextFromSession } from '../../../services/chat/launchContext';
import { sanitizeDisplayTitle } from '../../../domain';
import {
  buildManualSetupSeed,
  formatDateTime,
  formatMessageWithCitations,
  formatTimestamp,
  getDefaultLeftPanelOpen,
  getDefaultRightPanelOpen,
  getGuidedSessionState,
  getLaunchContextSummary,
  getSessionTitle,
  LEFT_PANEL_SECTION_SCROLL_CLASS,
  sectionLabelClassName,
  splitCollapsedFollowUpBlock,
  toggleExclusiveSection,
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
import { buildMentionCandidates, resolveDraftMentions } from '@/components/ui/omniboxModel';
import { ingestWorkspaceFiles } from '../WorkspaceBoard/workspaceBoardItemActions';
import { requestNetworkEntityFocus } from '@/services/workspace/workspaceSurfaceFocus';

export interface RenameSessionDialogState {
  session: ChatSession;
  title: string;
}

export interface AppendArtifactDialogState {
  message: ChatMessage;
  selectedReportId: string;
}

export interface FollowUpDialogState {
  action: AgentAction;
  request: InvestigationLaunchRequest;
  topic: string;
}

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
    archiveReport,
    appendSectionToReport,
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

  const [draft, setDraft] = useState('');
  const [leftPanelOpen, setLeftPanelOpen] = useState(getDefaultLeftPanelOpen);
  const [rightPanelOpen, setRightPanelOpen] = useState(getDefaultRightPanelOpen);
  const [workingSessionId, setWorkingSessionId] = useState<string | null>(null);
  const [workingAssistantMessageId, setWorkingAssistantMessageId] = useState<string | null>(null);
  const [manualSetupDraft, setManualSetupDraft] = useState<GuidedRunDraft | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [renameSessionDialog, setRenameSessionDialog] = useState<RenameSessionDialogState | null>(
    null
  );
  const [deleteSessionDialog, setDeleteSessionDialog] = useState<ChatSession | null>(null);
  const [appendArtifactDialog, setAppendArtifactDialog] = useState<AppendArtifactDialogState | null>(
    null
  );
  const [followUpDialog, setFollowUpDialog] = useState<FollowUpDialogState | null>(null);
  const [artifactCardState, setArtifactCardState] = useState<{
    expanded: Record<string, boolean>;
    workspaceId: string | null;
  }>({
    expanded: {},
    workspaceId: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamedAnswerRef = useRef('');
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const newMenuRef = useRef<HTMLDivElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [leftPanelSections, setLeftPanelSections] = useState({
    sessions: false,
    workspace: false,
  });
  const [rightPanelSections, setRightPanelSections] = useState({
    launchContext: false,
    recentArtifacts: false,
    recentSignals: false,
    latestRetrieval: false,
    actionLog: false,
  });

  const navigateToSession = (workspaceId: string, sessionId: string) => {
    navigateToChatSession(navigate, workspaceId, sessionId);
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
        setShowNewMenu(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setLeftPanelOpen(false);
        setRightPanelOpen(false);
      } else {
        setLeftPanelOpen(false);
        setRightPanelOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null,
    [activeWorkspaceId, workspaces]
  );

  const workspaceSessions = useMemo(
    () =>
      chatSessions
        .filter((session) => session.workspaceId === activeWorkspace?.id)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [activeWorkspace?.id, chatSessions]
  );

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

  const activeSession = useMemo(
    () => workspaceSessions.find((session) => session.id === activeChatSessionId) || null,
    [activeChatSessionId, workspaceSessions]
  );
  const launchContext = useMemo(() => getChatLaunchContextFromSession(activeSession), [activeSession]);

  const guidedState = useMemo(() => getGuidedSessionState(activeSession), [activeSession]);
  const messages = useMemo(
    () => (activeSession ? chatMessagesBySessionId[activeSession.id] || [] : []),
    [activeSession, chatMessagesBySessionId]
  );
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant' && message.content.trim().length > 0);
  const sessionActions = useMemo(
    () =>
      activeSession
        ? [...(chatActionsBySessionId[activeSession.id] || [])].sort(
            (a, b) => b.createdAt - a.createdAt
          )
        : [],
    [activeSession, chatActionsBySessionId]
  );
  const workspaceReports = useMemo(
    () => artifacts.filter((artifact) => artifact.caseId === activeWorkspace?.id),
    [activeWorkspace?.id, artifacts]
  );
  const appendableWorkspaceReports = useMemo(
    () =>
      workspaceReports.filter(
        (artifact): artifact is Artifact & { id: string } =>
          typeof artifact.id === 'string' && artifact.id.length > 0
      ),
    [workspaceReports]
  );
  const workspaceSignals = useMemo(
    () => headlines.filter((headline) => headline.caseId === activeWorkspace?.id),
    [activeWorkspace?.id, headlines]
  );
  const mentionCandidates = useMemo(
    () =>
      activeWorkspace
        ? buildMentionCandidates({
            workspaceId: activeWorkspace.id,
            artifacts: workspaceReports,
            signals: workspaceSignals,
            workspaceItems: workspaceItems || [],
          })
        : [],
    [activeWorkspace, workspaceItems, workspaceReports, workspaceSignals]
  );
  const launchContextSummary = useMemo(
    () =>
      getLaunchContextSummary({
        launchContext,
        reports: workspaceReports,
        signals: workspaceSignals,
      }),
    [launchContext, workspaceReports, workspaceSignals]
  );
  const messageBodyClassName = useMemo(
    () =>
      `prose max-w-none text-sm leading-7 text-zinc-200 prose-p:my-2 prose-ul:my-2 prose-headings:my-3 [&_h1]:text-inherit [&_h2]:text-inherit [&_h3]:text-inherit [&_h4]:text-inherit [&_h5]:text-inherit [&_h6]:text-inherit [&_p]:text-inherit [&_li]:text-inherit [&_ol]:text-inherit [&_ul]:text-inherit [&_strong]:text-inherit [&_em]:text-inherit [&_code]:text-inherit [&_blockquote]:text-inherit ${
        themeMode === 'dark' ? 'prose-invert' : ''
      }`.trim(),
    [themeMode]
  );

  const defaultExpandedArtifactIds = useMemo(
    () =>
      Object.fromEntries(
        workspaceReports.slice(0, 4).map((artifact) => [artifact.id || artifact.topic, true])
      ),
    [workspaceReports]
  );

  const expandedArtifactIds =
    artifactCardState.workspaceId === activeWorkspace?.id
      ? artifactCardState.expanded
      : defaultExpandedArtifactIds;

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, partialAssistantOutput, guidedState]);

  const toggleLeftPanelSection = (section: keyof typeof leftPanelSections) => {
    setLeftPanelSections((current) => toggleExclusiveSection(current, section));
  };

  const toggleRightPanelSection = (section: keyof typeof rightPanelSections) => {
    setRightPanelSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const toggleArtifactCard = (artifactId: string) => {
    setArtifactCardState((current) => {
      const baseExpanded =
        current.workspaceId === activeWorkspace?.id ? current.expanded : defaultExpandedArtifactIds;

      return {
        expanded: {
          ...baseExpanded,
          [artifactId]: !baseExpanded[artifactId],
        },
        workspaceId: activeWorkspace?.id || null,
      };
    });
  };

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

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!activeWorkspace) return;

    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    await ingestWorkspaceFiles({
      createWorkspaceItem,
      files,
      workspaceId: activeWorkspace.id,
    });

    addToast(
      files.length === 1
        ? 'Added file to the workspace library.'
        : `Added ${files.length} files to the workspace library.`,
      'SUCCESS'
    );
    event.target.value = '';
  };

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
      archiveReport,
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
      appendSectionToReport,
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
      archiveReport,
      customScopes,
      guidedState,
    });

  const handleOpenManualSetup = () => {
    if (!guidedState) return;
    setManualSetupDraft(guidedState.draft);
  };

  const handleFetchArtifactSummary = async (reportId: string) => {
    await addToolMessageResult((session) => fetchArtifactSummaryForChat({ session, reportId }));
  };

  const handleFetchFullArtifact = async (reportId: string) => {
    await addToolMessageResult((session) => fetchFullArtifactTextForChat({ session, reportId }));
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
    workspaces,
    workspaceReports,
    workspaceSessions,
    workspaceSignals,
    workingAssistantMessageId,
    workingSessionId,
    buildManualSetupSeed,
    getGuidedSessionState,
    sanitizeDisplayTitle,
  };
};
