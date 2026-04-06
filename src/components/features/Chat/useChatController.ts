import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import type {
  AgentAction,
  Artifact,
  ChatMessage,
  ChatSession,
  InvestigationLaunchRequest,
} from '@/types';
import {
  buildWorkspaceBoardDocumentPath,
  buildWorkspaceChatPath,
  buildWorkspaceChatSessionPath,
} from '@/app/routes';
import { useWorkspaceStore } from '../../../store/caseStore';
import {
  buildArtifactAppendFromChatMessage,
  buildArtifactDraftFromChatMessage,
  buildFollowUpRunFromChatMessage,
  fetchArtifactSummaryForChat,
  fetchFullArtifactTextForChat,
  fetchRecentSignalsForChat,
  streamWorkspaceChatTurn,
} from '../../../services/chat/runtime';
import {
  buildArtifactDraftFromGuidedDraft,
  buildLaunchRequestFromGuidedDraft,
  createDefaultGuidedSessionState,
  getGuidedAssistantPrompt,
  getNextGuidedStep,
  getPreviousGuidedStep,
  summarizeGuidedStep,
  type GuidedRunDraft,
  type GuidedSessionState,
} from '../../../services/chat/guidedMode';
import { exportChatSessionAsJson, exportChatSessionAsMarkdown } from '../../../utils/exportUtils';
import { createLocalId } from '../../../utils/id';
import { extractStreamingAnswerText } from '../../../services/providers/shared/chat';
import { getChatLaunchContextFromSession } from '../../../services/chat/launchContext';
import { sanitizeDisplayTitle } from '../../../domain';
import { buildWorkspaceItemReference } from '../../../services/workspace/library';
import { buildWorkspaceExcerptItemFromAttachment } from '../../../services/workspace/promotions';
import {
  buildGuidedSessionMetadata,
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
  } = useWorkspaceStore();

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
  const [expandedArtifactIds, setExpandedArtifactIds] = useState<Record<string, boolean>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamedAnswerRef = useRef('');
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const newMenuRef = useRef<HTMLDivElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const previousWorkspaceIdRef = useRef<string | null>(null);
  const [leftPanelSections, setLeftPanelSections] = useState({
    sessions: true,
    workspace: false,
  });
  const [rightPanelSections, setRightPanelSections] = useState({
    launchContext: true,
    recentArtifacts: true,
    recentSignals: false,
    latestRetrieval: false,
    actionLog: false,
  });

  const navigateToSession = (workspaceId: string, sessionId: string) => {
    navigate(buildWorkspaceChatSessionPath(workspaceId, sessionId));
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

  useEffect(() => {
    if (previousWorkspaceIdRef.current === activeWorkspace?.id) return;
    previousWorkspaceIdRef.current = activeWorkspace?.id || null;
    setExpandedArtifactIds(
      Object.fromEntries(
        workspaceReports.slice(0, 4).map((artifact) => [artifact.id || artifact.topic, true])
      )
    );
  }, [activeWorkspace?.id, workspaceReports]);

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
    setExpandedArtifactIds((current) => ({ ...current, [artifactId]: !current[artifactId] }));
  };

  const copyToClipboard = async (value: string, successMessage: string) => {
    await navigator.clipboard.writeText(value);
    addToast(successMessage, 'SUCCESS');
  };

  const ensureSession = async (options?: {
    metadata?: Record<string, unknown>;
    title?: string;
  }): Promise<ChatSession | null> => {
    if (!activeWorkspace) {
      addToast('Select or create a workspace before chatting.', 'ERROR');
      return null;
    }

    if (activeSession) return activeSession;

    const session = await createChatSession({
      workspaceId: activeWorkspace.id,
      title: options?.title,
      packId: activeWorkspace.packId,
      purposeId: activeWorkspace.purposeId,
      metadata: options?.metadata,
    });
    setActiveChatSessionId(session.id);
    navigateToSession(activeWorkspace.id, session.id);
    return session;
  };

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
  ) => {
    if (!activeWorkspace || !activeSession) {
      addToast('Open a workspace chat before promoting excerpts.', 'ERROR');
      return;
    }

    const item = buildWorkspaceExcerptItemFromAttachment({
      workspaceId: activeWorkspace.id,
      sessionId: activeSession.id,
      message,
      attachment,
    });
    await createWorkspaceItem(item);

    if (openInBoard) {
      const board = await ensureWorkspaceBoard(activeWorkspace.id);
      queueBoardPlacement({
        workspaceId: activeWorkspace.id,
        boardId: board.id,
        item: buildWorkspaceItemReference(item),
        openInBoard: true,
      });
      navigate(buildWorkspaceBoardDocumentPath(activeWorkspace.id, board.id));
      addToast('Promoted excerpt and placed it on the research board.', 'SUCCESS');
      return;
    }

    addToast('Promoted excerpt to the workspace library.', 'SUCCESS');
  };

  const handleCreateSession = async () => {
    setShowNewMenu(false);
    if (!activeWorkspace) {
      addToast('Select or create a workspace before starting chat.', 'ERROR');
      return;
    }

    const session = await createChatSession({
      workspaceId: activeWorkspace.id,
      packId: activeWorkspace.packId,
      purposeId: activeWorkspace.purposeId,
    });
    setActiveChatSessionId(session.id);
    navigateToSession(activeWorkspace.id, session.id);
  };

  const handleCreateGuidedSession = async () => {
    setShowNewMenu(false);
    if (!activeWorkspace) {
      addToast('Select or create a workspace before starting guided mode.', 'ERROR');
      return;
    }

    const guidedSessionState = createDefaultGuidedSessionState(activeWorkspace, customScopes);
    const session = await createChatSession({
      workspaceId: activeWorkspace.id,
      title: 'Guided Run Builder',
      packId: activeWorkspace.packId,
      purposeId: activeWorkspace.purposeId,
      metadata: {
        sessionMode: 'GUIDED',
        guidedState: guidedSessionState,
      },
    });
    const now = Date.now();
    await addChatMessage({
      id: createLocalId('chat-message'),
      sessionId: session.id,
      role: 'assistant',
      content: getGuidedAssistantPrompt(guidedSessionState, customScopes, activeWorkspace),
      status: 'COMPLETED',
      createdAt: now,
      updatedAt: now,
    });
    setActiveChatSessionId(session.id);
    navigateToSession(activeWorkspace.id, session.id);
  };

  const handleRenameSession = async (session: ChatSession) => {
    setRenameSessionDialog({ session, title: session.title });
  };

  const handleDeleteSession = async (session: ChatSession) => {
    setDeleteSessionDialog(session);
  };

  const handleConfirmRenameSession = async () => {
    if (!renameSessionDialog) return;

    const nextTitle = renameSessionDialog.title.trim();
    if (!nextTitle) {
      addToast('Enter a session title before saving.', 'ERROR');
      return;
    }

    await renameChatSession(renameSessionDialog.session.id, nextTitle);
    setRenameSessionDialog(null);
    addToast('Renamed chat session.', 'SUCCESS');
  };

  const handleConfirmDeleteSession = async () => {
    if (!deleteSessionDialog) return;

    const deletedSession = deleteSessionDialog;
    await deleteChatSession(deletedSession.id);
    setDeleteSessionDialog(null);

    if (activeWorkspace?.id && activeChatSessionId === deletedSession.id) {
      navigate(buildWorkspaceChatPath(activeWorkspace.id));
    }

    addToast('Deleted chat session.', 'SUCCESS');
  };

  const handleStopGeneration = () => {
    if (!abortControllerRef.current) return;
    setChatGenerationStatus('CANCELLING');
    abortControllerRef.current.abort();
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const query = draft.trim();
    if (!query || chatGenerationStatus === 'GENERATING' || chatGenerationStatus === 'CANCELLING') {
      return;
    }

    const session = await ensureSession();
    if (!session) return;

    const now = Date.now();
    const userMessage: ChatMessage = {
      id: createLocalId('chat-message'),
      sessionId: session.id,
      role: 'user',
      content: query,
      status: 'COMPLETED',
      createdAt: now,
      updatedAt: now,
    };
    const assistantMessageId = createLocalId('chat-message');
    const pendingAssistant: ChatMessage = {
      id: assistantMessageId,
      sessionId: session.id,
      role: 'assistant',
      content: '',
      status: 'PENDING',
      createdAt: now + 1,
      updatedAt: now + 1,
      metadata: {
        provider: session.provider,
        modelId: session.modelId,
      },
    };

    const controller = new AbortController();
    abortControllerRef.current = controller;
    streamedAnswerRef.current = '';
    setDraft('');
    setWorkingSessionId(session.id);
    setWorkingAssistantMessageId(assistantMessageId);
    setChatGenerationStatus('GENERATING');
    setPartialAssistantOutput('');

    await addChatMessage(userMessage);
    await addChatMessage(pendingAssistant);

    try {
      const result = await streamWorkspaceChatTurn({
        session,
        messages: [...messages, userMessage],
        query,
        assistantMessageId,
        signal: controller.signal,
        onStreamEvent: (streamEvent) => {
          if (streamEvent.type !== 'DELTA') return;
          const answerText = extractStreamingAnswerText(streamEvent.snapshot);
          streamedAnswerRef.current = answerText;
          setPartialAssistantOutput(answerText);
        },
      });

      await updateChatMessage(assistantMessageId, session.id, {
        content: result.assistantMessage.content,
        citations: result.assistantMessage.citations,
        attachments: result.attachments,
        metadata: result.assistantMessage.metadata,
        status: 'COMPLETED',
        updatedAt: Date.now(),
      });
      await addChatAction({ ...result.action, messageId: assistantMessageId });

      if (session.title === 'Untitled Chat' && result.suggestedTitle) {
        await renameChatSession(session.id, result.suggestedTitle);
      }

      setChatGenerationStatus('IDLE');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        await updateChatMessage(assistantMessageId, session.id, {
          content:
            streamedAnswerRef.current || 'Generation stopped before a full answer was produced.',
          status: 'CANCELLED',
          updatedAt: Date.now(),
        });
        addToast('Generation stopped.', 'INFO');
        setChatGenerationStatus('IDLE');
      } else {
        const message = error instanceof Error ? error.message : 'Chat failed.';
        await updateChatMessage(assistantMessageId, session.id, {
          content: 'Unable to generate a response for this workspace query.',
          error: message,
          status: 'FAILED',
          updatedAt: Date.now(),
        });
        setChatGenerationStatus('FAILED');
        addToast(message, 'ERROR');
      }
    } finally {
      abortControllerRef.current = null;
      streamedAnswerRef.current = '';
      setWorkingSessionId(null);
      setWorkingAssistantMessageId(null);
      setPartialAssistantOutput('');
    }
  };

  const handleSaveMessageAsArtifact = async (message: ChatMessage) => {
    if (!activeSession || !activeWorkspace) return;
    const { report, action } = buildArtifactDraftFromChatMessage({
      session: activeSession,
      workspace: activeWorkspace,
      message,
    });
    const saved = await archiveReport(report, {
      topic: activeWorkspace.title,
      summary: activeWorkspace.description || `${activeWorkspace.title} workspace`,
    });
    await addChatAction({
      ...action,
      result: {
        ...(action.result || {}),
        artifactId: saved.id,
      },
    });
    addToast(`Saved chat draft to ${saved.topic}.`, 'SUCCESS');
  };

  const handleAppendMessageToArtifact = async (message: ChatMessage) => {
    if (!activeSession || appendableWorkspaceReports.length === 0) {
      addToast('Save an artifact in this workspace before appending chat notes.', 'ERROR');
      return;
    }

    setAppendArtifactDialog({
      message,
      selectedReportId: appendableWorkspaceReports[0]?.id || '',
    });
  };

  const handleConfirmAppendMessageToArtifact = async () => {
    if (!appendArtifactDialog || !activeSession) return;

    const targetReport = appendableWorkspaceReports.find(
      (artifact) => artifact.id === appendArtifactDialog.selectedReportId
    );
    if (!targetReport) {
      addToast('Select a valid artifact before appending this note.', 'ERROR');
      return;
    }

    const { section, action } = buildArtifactAppendFromChatMessage({
      session: activeSession,
      report: targetReport,
      message: appendArtifactDialog.message,
    });

    await appendSectionToReport(targetReport.id, section);
    await addChatAction(action);
    setAppendArtifactDialog(null);
    addToast(`Added this chat note to ${targetReport.topic}.`, 'SUCCESS');
  };

  const handleLaunchFollowUp = async (message: ChatMessage) => {
    if (!activeSession || !activeWorkspace) return;
    const { request, action, suggestedTopic } = buildFollowUpRunFromChatMessage({
      session: activeSession,
      workspace: activeWorkspace,
      message,
      workspaceIntent: 'CURRENT',
    });
    setFollowUpDialog({
      request,
      action,
      topic: suggestedTopic,
    });
  };

  const handleConfirmLaunchFollowUp = async () => {
    if (!followUpDialog) return;

    const nextTopic = followUpDialog.topic.trim();
    if (!nextTopic) {
      addToast('Enter a follow-up topic before launching the run.', 'ERROR');
      return;
    }

    onLaunchInvestigation({
      ...followUpDialog.request,
      topic: nextTopic,
    });
    await addChatAction({
      ...followUpDialog.action,
      input: {
        ...(followUpDialog.action.input || {}),
        topic: nextTopic,
      },
    });
    setFollowUpDialog(null);
  };

  const handleAdvanceGuided = async (nextDraft: GuidedRunDraft) => {
    if (!activeSession || !guidedState || !activeWorkspace) return;
    const completedStep = guidedState.step;
    const nextStep = getNextGuidedStep(completedStep);
    const nextState: GuidedSessionState = {
      mode: 'GUIDED',
      step: nextStep,
      draft: nextDraft,
      completedAt: nextStep === 'REVIEW' ? Date.now() : undefined,
    };
    const now = Date.now();

    await addChatMessage({
      id: createLocalId('chat-message'),
      sessionId: activeSession.id,
      role: 'user',
      content: summarizeGuidedStep(completedStep, nextDraft, customScopes),
      status: 'COMPLETED',
      createdAt: now,
      updatedAt: now,
    });
    await updateChatSession(activeSession.id, {
      metadata: buildGuidedSessionMetadata(activeSession, nextState),
    });
    await addChatMessage({
      id: createLocalId('chat-message'),
      sessionId: activeSession.id,
      role: 'assistant',
      content: getGuidedAssistantPrompt(nextState, customScopes, activeWorkspace),
      status: 'COMPLETED',
      createdAt: now + 1,
      updatedAt: now + 1,
    });
  };

  const handleGuidedBack = async () => {
    if (!activeSession || !guidedState) return;
    const previousStep = getPreviousGuidedStep(guidedState.step);
    await updateChatSession(activeSession.id, {
      metadata: buildGuidedSessionMetadata(activeSession, {
        ...guidedState,
        step: previousStep,
        completedAt: undefined,
      }),
    });
  };

  const handleGuidedLaunch = async () => {
    if (!guidedState) return;
    onLaunchInvestigation(
      buildLaunchRequestFromGuidedDraft(guidedState.draft, customScopes, activeWorkspace)
    );
    if (activeSession) {
      await addChatAction({
        id: createLocalId('chat-action'),
        sessionId: activeSession.id,
        type: 'CREATE_FOLLOW_UP_RUN',
        status: 'COMPLETED',
        input: {
          topic: guidedState.draft.topic,
          mode: 'GUIDED',
        },
        result: {
          launchSource: 'CHAT_GUIDED_RUN',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  };

  const handleGuidedSaveDraft = async () => {
    if (!guidedState) return;
    const { report } = buildArtifactDraftFromGuidedDraft(
      guidedState.draft,
      customScopes,
      activeWorkspace
    );
    const saved = await archiveReport(
      guidedState.draft.workspaceIntent === 'CURRENT'
        ? report
        : {
            ...report,
            caseId: undefined,
          },
      guidedState.draft.workspaceIntent === 'CURRENT' && activeWorkspace
        ? {
            topic: activeWorkspace.title,
            summary: activeWorkspace.description || `${activeWorkspace.title} workspace`,
          }
        : undefined
    );

    if (activeSession) {
      await addChatAction({
        id: createLocalId('chat-action'),
        sessionId: activeSession.id,
        type: 'CREATE_ARTIFACT_DRAFT',
        status: 'COMPLETED',
        input: {
          topic: guidedState.draft.topic,
          mode: 'GUIDED',
        },
        result: {
          artifactId: saved.id,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    addToast(`Saved guided brief to ${saved.topic}.`, 'SUCCESS');
  };

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
