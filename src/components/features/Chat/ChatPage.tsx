import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    Bot,
    CircleStop,
    Clipboard,
    FileJson,
    FilePlus2,
    FileSearch,
    FileText,
    MessageSquare,
    Pencil,
    PlayCircle,
    Plus,
    Send,
    Sparkles,
    Trash2,
    Workflow,
} from 'lucide-react';
import type { AgentAction, ChatMessage, ChatSession, InvestigationLaunchRequest } from '@/types';
import { useCaseStore } from '../../../store/caseStore';
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
    isGuidedSessionState,
    summarizeGuidedStep,
    type GuidedRunDraft,
    type GuidedSessionState,
} from '../../../services/chat/guidedMode';
import { exportChatSessionAsJson, exportChatSessionAsMarkdown } from '../../../utils/exportUtils';
import { createLocalId } from '../../../utils/id';
import { extractStreamingAnswerText } from '../../../services/providers/shared/chat';
import { GuidedRunBuilder } from './GuidedRunBuilder';
import { TaskSetupModal } from '../../ui/TaskSetupModal';

const formatTimestamp = (value: number): string =>
    new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatMessageWithCitations = (message: ChatMessage): string => {
    const citations = message.attachments?.length
        ? `\n\nCitations:\n${message.attachments
              .map((attachment) => `- ${attachment.title}${attachment.snippet ? `: ${attachment.snippet}` : ''}`)
              .join('\n')}`
        : message.citations?.length
          ? `\n\nCitations: ${message.citations.join(', ')}`
          : '';

    return `${message.content}${citations}`;
};

const getSessionTitle = (session: ChatSession): string => session.title.trim() || 'Untitled Chat';

const getGuidedSessionState = (session: ChatSession | null): GuidedSessionState | null => {
    const metadata = session?.metadata as { guidedState?: unknown } | undefined;
    return isGuidedSessionState(metadata?.guidedState) ? metadata.guidedState : null;
};

const buildGuidedSessionMetadata = (
    session: ChatSession,
    guidedState: GuidedSessionState
): Record<string, unknown> => ({
    ...(session.metadata || {}),
    sessionMode: 'GUIDED',
    guidedState,
});

const buildManualSetupSeed = (draft: GuidedRunDraft) => ({
    initialTopic: draft.topic,
    initialScopeId: draft.scopeId,
    initialConfigOverride: {
        provider: draft.provider,
        modelId: draft.modelId,
        persona: draft.persona,
        searchDepth: draft.searchDepth,
        thinkingBudget: draft.thinkingBudget,
        purposeId: draft.purposeId,
        artifactType: draft.artifactType,
    },
    initialDateRangeOverride:
        draft.dateRange?.start || draft.dateRange?.end
            ? {
                  start: draft.dateRange.start || undefined,
                  end: draft.dateRange.end || undefined,
              }
            : undefined,
});

interface ChatProps {
    onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
}

export const Chat: React.FC<ChatProps> = ({ onLaunchInvestigation }) => {
    const {
        archives,
        cases,
        chatActionsBySessionId,
        chatGenerationStatus,
        chatMessagesBySessionId,
        chatSessions,
        createChatSession,
        updateChatSession,
        activeCaseId,
        activeChatSessionId,
        addChatAction,
        addChatMessage,
        addToast,
        archiveReport,
        appendSectionToReport,
        customScopes,
        deleteChatSession,
        headlines,
        partialAssistantOutput,
        renameChatSession,
        setActiveCaseId,
        setActiveChatSessionId,
        setChatGenerationStatus,
        setPartialAssistantOutput,
        updateChatMessage,
    } = useCaseStore();

    const [draft, setDraft] = useState('');
    const [workingSessionId, setWorkingSessionId] = useState<string | null>(null);
    const [workingAssistantMessageId, setWorkingAssistantMessageId] = useState<string | null>(null);
    const [manualSetupDraft, setManualSetupDraft] = useState<GuidedRunDraft | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const streamedAnswerRef = useRef('');

    useEffect(() => {
        if (!activeCaseId && cases.length > 0) {
            setActiveCaseId(cases[0].id);
        }
    }, [activeCaseId, cases, setActiveCaseId]);

    const activeWorkspace = useMemo(
        () => cases.find((workspace) => workspace.id === activeCaseId) || null,
        [activeCaseId, cases]
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

        const isCurrentSessionInWorkspace = workspaceSessions.some(
            (session) => session.id === activeChatSessionId
        );

        if (!isCurrentSessionInWorkspace) {
            setActiveChatSessionId(workspaceSessions[0]?.id || null);
        }
    }, [activeWorkspace, activeChatSessionId, setActiveChatSessionId, workspaceSessions]);

    const activeSession = useMemo(
        () => workspaceSessions.find((session) => session.id === activeChatSessionId) || null,
        [activeChatSessionId, workspaceSessions]
    );

    const guidedState = useMemo(() => getGuidedSessionState(activeSession), [activeSession]);
    const messages = activeSession ? chatMessagesBySessionId[activeSession.id] || [] : [];
    const latestAssistantMessage = [...messages]
        .reverse()
        .find((message) => message.role === 'assistant' && message.content.trim().length > 0);
    const sessionActions = useMemo(
        () =>
            activeSession
                ? [...(chatActionsBySessionId[activeSession.id] || [])].sort((a, b) => b.createdAt - a.createdAt)
                : [],
        [activeSession, chatActionsBySessionId]
    );
    const workspaceReports = useMemo(
        () => archives.filter((artifact) => artifact.caseId === activeWorkspace?.id),
        [activeWorkspace?.id, archives]
    );

    const copyToClipboard = async (value: string, successMessage: string) => {
        await navigator.clipboard.writeText(value);
        addToast(successMessage, 'SUCCESS');
    };

    const ensureSession = async (options?: {
        title?: string;
        metadata?: Record<string, unknown>;
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
        return session;
    };

    const addToolMessageResult = async (
        factory: (session: ChatSession) => Promise<{ message: ChatMessage; action: AgentAction }>
    ) => {
        const session = await ensureSession();
        if (!session) return;

        const result = await factory(session);
        await addChatMessage(result.message);
        await addChatAction(result.action);
    };

    const handleCreateSession = async () => {
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
    };

    const handleCreateGuidedSession = async () => {
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
    };

    const handleRenameSession = async (session: ChatSession) => {
        const nextTitle = window.prompt('Rename chat session', session.title);
        if (!nextTitle) return;
        await renameChatSession(session.id, nextTitle);
    };

    const handleDeleteSession = async (session: ChatSession) => {
        const confirmed = window.confirm(`Delete "${getSessionTitle(session)}"?`);
        if (!confirmed) return;
        await deleteChatSession(session.id);
    };

    const handleStopGeneration = () => {
        if (!abortControllerRef.current) return;
        setChatGenerationStatus('CANCELLING');
        abortControllerRef.current.abort();
    };

    const handleSend = async (event: React.FormEvent) => {
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
                    content: streamedAnswerRef.current || 'Generation stopped before a full answer was produced.',
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
        if (!activeSession || workspaceReports.length === 0) {
            addToast('Save an artifact in this workspace before appending chat notes.', 'ERROR');
            return;
        }

        const prompt = workspaceReports
            .map((report, index) => `${index + 1}. ${report.topic}`)
            .join('\n');
        const rawSelection = window.prompt(`Append this note to which artifact?\n\n${prompt}`, '1');
        const index = Number(rawSelection || '0') - 1;
        const selectedReport = workspaceReports[index];

        if (!selectedReport?.id) return;

        const { section, action } = buildArtifactAppendFromChatMessage({
            session: activeSession,
            report: {
                id: selectedReport.id,
                topic: selectedReport.topic,
            },
            message,
        });

        await appendSectionToReport(selectedReport.id, section);
        await addChatAction(action);
        addToast(`Appended a chat note to ${selectedReport.topic}.`, 'SUCCESS');
    };

    const handleLaunchFollowUp = async (message: ChatMessage) => {
        if (!activeSession || !activeWorkspace) return;
        const { request, action, suggestedTopic } = buildFollowUpRunFromChatMessage({
            session: activeSession,
            workspace: activeWorkspace,
            message,
            workspaceIntent: 'CURRENT',
        });
        const nextTopic = window.prompt('Follow-up run topic', suggestedTopic);
        if (!nextTopic?.trim()) return;

        onLaunchInvestigation({
            ...request,
            topic: nextTopic.trim(),
        });
        await addChatAction({
            ...action,
            input: {
                ...(action.input || {}),
                topic: nextTopic.trim(),
            },
        });
        addToast(`Launching follow-up run: ${nextTopic.trim()}`, 'INFO');
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
        onLaunchInvestigation(buildLaunchRequestFromGuidedDraft(guidedState.draft, customScopes, activeWorkspace));
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

    if (cases.length === 0) {
        return (
            <div className="flex h-full min-h-screen items-center justify-center bg-black px-6">
                <div className="max-w-xl border border-zinc-800 bg-zinc-950/70 p-8 text-center">
                    <MessageSquare className="mx-auto mb-4 h-10 w-10 text-osint-primary" />
                    <h2 className="mb-3 text-xl font-semibold text-white">Workspace Chat Needs A Workspace</h2>
                    <p className="text-sm leading-6 text-zinc-400">
                        Start or reopen a workspace first. Chat sessions are scoped to one workspace so every answer
                        stays local, grounded, and auditable.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-screen flex-col bg-black text-zinc-100">
            <header className="border-b border-zinc-800 bg-zinc-950/90 px-4 py-4 backdrop-blur sm:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.28em] text-zinc-500">
                            <Sparkles className="h-4 w-4 text-osint-primary" />
                            Chat
                        </div>
                        <h1 className="mt-2 text-2xl font-semibold text-white">Workspace Grounded Chat</h1>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <select
                            value={activeWorkspace?.id || ''}
                            onChange={(event) => setActiveCaseId(event.target.value || null)}
                            className="border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-osint-primary"
                        >
                            {cases.map((workspace) => (
                                <option key={workspace.id} value={workspace.id}>
                                    {workspace.title}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleCreateSession}
                            className="inline-flex items-center justify-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono uppercase tracking-wide text-zinc-200 transition hover:border-osint-primary hover:text-white"
                        >
                            <Plus className="h-4 w-4" />
                            New Session
                        </button>
                        <button
                            onClick={handleCreateGuidedSession}
                            className="inline-flex items-center justify-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono uppercase tracking-wide text-zinc-200 transition hover:border-osint-primary hover:text-white"
                        >
                            <Workflow className="h-4 w-4" />
                            Guided Run
                        </button>
                        {activeSession && (
                            <>
                                <button
                                    onClick={() =>
                                        exportChatSessionAsMarkdown(activeSession, messages, activeWorkspace || undefined)
                                    }
                                    className="inline-flex items-center justify-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono uppercase tracking-wide text-zinc-200 transition hover:border-osint-primary hover:text-white"
                                >
                                    <FileText className="h-4 w-4" />
                                    Export MD
                                </button>
                                <button
                                    onClick={() =>
                                        exportChatSessionAsJson(activeSession, messages, activeWorkspace || undefined)
                                    }
                                    className="inline-flex items-center justify-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono uppercase tracking-wide text-zinc-200 transition hover:border-osint-primary hover:text-white"
                                >
                                    <FileJson className="h-4 w-4" />
                                    Export JSON
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
                <aside className="border-b border-zinc-800 bg-zinc-950/70 lg:border-b-0 lg:border-r">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                        <span className="text-xs font-mono uppercase tracking-[0.28em] text-zinc-500">
                            Sessions
                        </span>
                        <span className="text-xs text-zinc-600">{workspaceSessions.length}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-3 lg:max-h-full">
                        <div className="space-y-2">
                            {workspaceSessions.length === 0 && (
                                <div className="border border-dashed border-zinc-800 p-4 text-sm text-zinc-500">
                                    No chat history for this workspace yet.
                                </div>
                            )}
                            {workspaceSessions.map((session) => {
                                const sessionGuidedState = getGuidedSessionState(session);
                                return (
                                    <div
                                        key={session.id}
                                        className={`border p-3 transition ${
                                            activeSession?.id === session.id
                                                ? 'border-osint-primary bg-zinc-900 text-white'
                                                : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-zinc-600'
                                        }`}
                                    >
                                        <button
                                            onClick={() => setActiveChatSessionId(session.id)}
                                            className="w-full text-left"
                                        >
                                            <div className="line-clamp-2 text-sm font-medium">{getSessionTitle(session)}</div>
                                            <div className="mt-2 text-xs text-zinc-500">
                                                {sessionGuidedState ? 'Guided run builder' : 'Standard workspace chat'}
                                            </div>
                                            <div className="mt-1 text-xs text-zinc-600">
                                                Updated {new Date(session.updatedAt).toLocaleDateString()}
                                            </div>
                                        </button>
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                onClick={() => handleRenameSession(session)}
                                                className="inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-white"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Rename
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSession(session)}
                                                className="inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-red-400"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                <section className="flex min-h-0 flex-col">
                    <div className="border-b border-zinc-800 bg-zinc-950/40 px-4 py-3 sm:px-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-xs font-mono uppercase tracking-[0.28em] text-zinc-500">
                                    Transcript
                                </div>
                                <div className="mt-1 text-lg text-white">
                                    {activeSession ? getSessionTitle(activeSession) : 'Start a new session'}
                                </div>
                            </div>
                            {latestAssistantMessage && (
                                <button
                                    onClick={() =>
                                        void copyToClipboard(
                                            formatMessageWithCitations(latestAssistantMessage),
                                            'Copied latest assistant message.'
                                        )
                                    }
                                    className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-2 text-xs font-mono uppercase tracking-wide text-zinc-300 transition hover:border-osint-primary hover:text-white"
                                >
                                    <Clipboard className="h-4 w-4" />
                                    Copy Latest
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                        <div className="mx-auto flex max-w-4xl flex-col gap-4 pb-10">
                            {messages.length === 0 && (
                                <div className="border border-dashed border-zinc-800 bg-zinc-950/60 p-6 text-sm leading-6 text-zinc-400">
                                    Ask what changed in this workspace, summarize recent artifacts, compare saved materials,
                                    or use guided mode to turn a conversation into a launch-ready run.
                                </div>
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

                                return (
                                    <article
                                        key={message.id}
                                        className={`rounded-none border p-4 ${
                                            message.role === 'user'
                                                ? 'border-zinc-800 bg-zinc-950/80'
                                                : message.role === 'tool'
                                                  ? 'border-amber-800/60 bg-amber-950/20'
                                                  : 'border-zinc-700 bg-zinc-900/80'
                                        }`}
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.28em] text-zinc-500">
                                                {message.role === 'assistant' ? (
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
                                            <div className="prose prose-invert max-w-none text-sm leading-7 prose-p:my-2 prose-ul:my-2 prose-headings:my-3">
                                                <ReactMarkdown>{body}</ReactMarkdown>
                                            </div>
                                        )}

                                        {!!message.attachments?.length && (
                                            <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
                                                {message.attachments.map((attachment) => (
                                                    <span
                                                        key={attachment.id}
                                                        className="border border-zinc-700 bg-black px-2 py-1 text-[11px] text-zinc-300"
                                                        title={attachment.snippet}
                                                    >
                                                        {attachment.title}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {message.role === 'assistant' &&
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
                                            <div className="mt-3 border-t border-red-950 pt-3 text-sm text-red-400">
                                                {message.error}
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    </div>

                    {guidedState ? (
                        <GuidedRunBuilder
                            key={`${activeSession?.id || 'guided'}:${guidedState.step}`}
                            state={guidedState}
                            customScopes={customScopes}
                            workspace={activeWorkspace}
                            isBusy={chatGenerationStatus === 'GENERATING' || chatGenerationStatus === 'CANCELLING'}
                            onAdvance={handleAdvanceGuided}
                            onBack={handleGuidedBack}
                            onLaunchRun={handleGuidedLaunch}
                            onSaveDraft={handleGuidedSaveDraft}
                            onOpenManualSetup={handleOpenManualSetup}
                        />
                    ) : (
                        <form onSubmit={handleSend} className="border-t border-zinc-800 bg-zinc-950/80 px-4 py-4 sm:px-6">
                            <div className="mx-auto max-w-4xl">
                                <textarea
                                    value={draft}
                                    onChange={(event) => setDraft(event.target.value)}
                                    placeholder={
                                        activeWorkspace
                                            ? `Ask about ${activeWorkspace.title}...`
                                            : 'Select a workspace to begin chatting...'
                                    }
                                    className="h-28 w-full resize-none border border-zinc-700 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-osint-primary"
                                />
                                <div className="mt-3 flex items-center justify-between gap-4">
                                    <div className="text-xs text-zinc-500">
                                        {chatGenerationStatus === 'GENERATING' && workingSessionId
                                            ? 'Streaming the next answer with workspace retrieval and action logging...'
                                            : chatGenerationStatus === 'CANCELLING'
                                              ? 'Stopping the current response...'
                                              : 'Responses are grounded in the active workspace and saved locally.'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {chatGenerationStatus === 'GENERATING' ||
                                        chatGenerationStatus === 'CANCELLING' ? (
                                            <button
                                                type="button"
                                                onClick={handleStopGeneration}
                                                className="inline-flex items-center gap-2 border border-red-900 bg-red-950/40 px-4 py-2 text-xs font-mono uppercase tracking-wide text-red-200 transition hover:border-red-500 hover:text-white"
                                            >
                                                <CircleStop className="h-4 w-4" />
                                                Stop
                                            </button>
                                        ) : null}
                                        <button
                                            type="submit"
                                            disabled={
                                                !draft.trim() ||
                                                chatGenerationStatus === 'GENERATING' ||
                                                chatGenerationStatus === 'CANCELLING'
                                            }
                                            className="inline-flex items-center gap-2 bg-white px-4 py-2 text-xs font-mono uppercase tracking-wide text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Send className="h-4 w-4" />
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </section>

                <aside className="hidden border-l border-zinc-800 bg-zinc-950/70 xl:flex xl:flex-col">
                    <div className="border-b border-zinc-800 px-5 py-3">
                        <div className="text-xs font-mono uppercase tracking-[0.28em] text-zinc-500">
                            Context
                        </div>
                        <div className="mt-1 text-lg text-white">{activeWorkspace?.title}</div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 py-5">
                        <section className="mb-6">
                            <div className="text-xs font-mono uppercase tracking-[0.28em] text-zinc-500">
                                Workspace Summary
                            </div>
                            <p className="mt-3 text-sm leading-6 text-zinc-300">
                                {activeWorkspace?.description || 'No workspace summary saved yet.'}
                            </p>
                        </section>

                        {latestAssistantMessage?.attachments?.length ? (
                            <section className="mb-6">
                                <div className="text-xs font-mono uppercase tracking-[0.28em] text-zinc-500">
                                    Latest Retrieval
                                </div>
                                <div className="mt-3 space-y-3">
                                    {latestAssistantMessage.attachments.map((attachment) => (
                                        <div key={attachment.id} className="border border-zinc-800 bg-black/50 p-3">
                                            <div className="text-sm text-white">{attachment.title}</div>
                                            {attachment.snippet && (
                                                <p className="mt-2 text-xs leading-5 text-zinc-400">
                                                    {attachment.snippet}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        <section className="mb-6">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="text-xs font-mono uppercase tracking-[0.28em] text-zinc-500">
                                    Recent Artifacts
                                </div>
                            </div>
                            <div className="space-y-3">
                                {workspaceReports.slice(0, 4).map((artifact) => (
                                    <div key={artifact.id} className="border border-zinc-800 bg-black/50 p-3">
                                        <div className="text-sm text-white">{artifact.topic}</div>
                                        <p className="mt-2 text-xs leading-5 text-zinc-400">{artifact.summary}</p>
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                onClick={() => artifact.id && void handleFetchArtifactSummary(artifact.id)}
                                                className="inline-flex items-center gap-1 text-[11px] text-zinc-500 transition hover:text-white"
                                            >
                                                <FileText className="h-3.5 w-3.5" />
                                                Summary
                                            </button>
                                            <button
                                                onClick={() => artifact.id && void handleFetchFullArtifact(artifact.id)}
                                                className="inline-flex items-center gap-1 text-[11px] text-zinc-500 transition hover:text-white"
                                            >
                                                <FileSearch className="h-3.5 w-3.5" />
                                                Full Text
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="mb-6">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="text-xs font-mono uppercase tracking-[0.28em] text-zinc-500">
                                    Recent Signals
                                </div>
                                <button
                                    onClick={() => void handleFetchRecentSignals()}
                                    className="inline-flex items-center gap-1 text-[11px] text-zinc-500 transition hover:text-white"
                                >
                                    <FileSearch className="h-3.5 w-3.5" />
                                    Pin To Chat
                                </button>
                            </div>
                            <div className="space-y-3">
                                {headlines
                                    .filter((headline) => headline.caseId === activeWorkspace?.id)
                                    .slice(0, 4)
                                    .map((headline) => (
                                        <div key={headline.id} className="border border-zinc-800 bg-black/50 p-3">
                                            <div className="text-sm text-white">{headline.source || headline.type}</div>
                                            <p className="mt-2 text-xs leading-5 text-zinc-400">{headline.content}</p>
                                        </div>
                                    ))}
                            </div>
                        </section>

                        <section>
                            <div className="text-xs font-mono uppercase tracking-[0.28em] text-zinc-500">
                                Action Log
                            </div>
                            <div className="mt-3 space-y-3">
                                {sessionActions.length === 0 ? (
                                    <div className="border border-dashed border-zinc-800 p-3 text-xs text-zinc-500">
                                        No chat actions recorded yet.
                                    </div>
                                ) : (
                                    sessionActions.slice(0, 8).map((action) => (
                                        <div key={action.id} className="border border-zinc-800 bg-black/50 p-3">
                                            <div className="text-[11px] font-mono uppercase text-zinc-400">
                                                {action.type}
                                            </div>
                                            <div className="mt-2 text-xs leading-5 text-zinc-500">
                                                {new Date(action.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
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
        </div>
    );
};
