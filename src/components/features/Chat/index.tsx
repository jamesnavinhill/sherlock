import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    Bot,
    Clipboard,
    FileJson,
    FileText,
    MessageSquare,
    Pencil,
    Plus,
    Send,
    Sparkles,
    Trash2,
} from 'lucide-react';
import type { ChatMessage, ChatSession } from '@/types';
import { useCaseStore } from '../../../store/caseStore';
import { runWorkspaceChatTurn } from '../../../services/chat/runtime';
import { exportChatSessionAsJson, exportChatSessionAsMarkdown } from '../../../utils/exportUtils';
import { createLocalId } from '../../../utils/id';

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

const getSessionTitle = (session: ChatSession): string =>
    session.title.trim() || 'Untitled Chat';

export const Chat: React.FC = () => {
    const {
        cases,
        archives,
        headlines,
        activeCaseId,
        setActiveCaseId,
        chatSessions,
        chatMessagesBySessionId,
        activeChatSessionId,
        setActiveChatSessionId,
        createChatSession,
        renameChatSession,
        deleteChatSession,
        addChatMessage,
        updateChatMessage,
        addChatAction,
        addToast,
        chatGenerationStatus,
        setChatGenerationStatus,
        setPartialAssistantOutput,
    } = useCaseStore();

    const [draft, setDraft] = useState('');
    const [workingSessionId, setWorkingSessionId] = useState<string | null>(null);

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

    const messages = activeSession ? chatMessagesBySessionId[activeSession.id] || [] : [];
    const latestAssistantMessage = [...messages]
        .reverse()
        .find((message) => message.role === 'assistant');

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

    const copyToClipboard = async (value: string, successMessage: string) => {
        await navigator.clipboard.writeText(value);
        addToast(successMessage, 'SUCCESS');
    };

    const ensureSession = async (): Promise<ChatSession | null> => {
        if (!activeWorkspace) {
            addToast('Select or create a workspace before chatting.', 'ERROR');
            return null;
        }

        if (activeSession) return activeSession;

        const session = await createChatSession({
            workspaceId: activeWorkspace.id,
            packId: activeWorkspace.packId,
            purposeId: activeWorkspace.purposeId,
        });
        setActiveChatSessionId(session.id);
        return session;
    };

    const handleSend = async (event: React.FormEvent) => {
        event.preventDefault();
        const query = draft.trim();
        if (!query || chatGenerationStatus === 'GENERATING') return;

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

        setDraft('');
        setWorkingSessionId(session.id);
        setChatGenerationStatus('GENERATING');
        setPartialAssistantOutput('');

        await addChatMessage(userMessage);
        await addChatMessage(pendingAssistant);

        try {
            const result = await runWorkspaceChatTurn({
                session,
                messages: [...messages, userMessage],
                query,
                assistantMessageId,
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
            setWorkingSessionId(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Chat failed.';
            await updateChatMessage(assistantMessageId, session.id, {
                content: 'Unable to generate a response for this workspace query.',
                error: message,
                status: 'FAILED',
                updatedAt: Date.now(),
            });
            setChatGenerationStatus('FAILED');
            setWorkingSessionId(null);
            addToast(message, 'ERROR');
        }
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
                        {activeSession && (
                            <>
                                <button
                                    onClick={() => exportChatSessionAsMarkdown(activeSession, messages, activeWorkspace || undefined)}
                                    className="inline-flex items-center justify-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono uppercase tracking-wide text-zinc-200 transition hover:border-osint-primary hover:text-white"
                                >
                                    <FileText className="h-4 w-4" />
                                    Export MD
                                </button>
                                <button
                                    onClick={() => exportChatSessionAsJson(activeSession, messages, activeWorkspace || undefined)}
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
                            {workspaceSessions.map((session) => (
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
                            ))}
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
                                    Ask about what changed in this workspace, summarize recent artifacts, compare saved materials,
                                    or explain where the current evidence is thin.
                                </div>
                            )}

                            {messages.map((message) => (
                                <article
                                    key={message.id}
                                    className={`rounded-none border p-4 ${
                                        message.role === 'user'
                                            ? 'border-zinc-800 bg-zinc-950/80'
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

                                    {message.status === 'PENDING' ? (
                                        <div className="text-sm text-zinc-500">Generating response...</div>
                                    ) : (
                                        <div className="prose prose-invert max-w-none text-sm leading-7 prose-p:my-2 prose-ul:my-2 prose-headings:my-3">
                                            <ReactMarkdown>{message.content}</ReactMarkdown>
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

                                    {message.error && (
                                        <div className="mt-3 border-t border-red-950 pt-3 text-sm text-red-400">
                                            {message.error}
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    </div>

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
                                        ? 'Grounding the next answer in the active workspace...'
                                        : 'Responses are grounded in the active workspace and saved locally.'}
                                </div>
                                <button
                                    type="submit"
                                    disabled={!draft.trim() || chatGenerationStatus === 'GENERATING'}
                                    className="inline-flex items-center gap-2 bg-white px-4 py-2 text-xs font-mono uppercase tracking-wide text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" />
                                    Send
                                </button>
                            </div>
                        </div>
                    </form>
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
                            <div className="text-xs font-mono uppercase tracking-[0.28em] text-zinc-500">
                                Recent Artifacts
                            </div>
                            <div className="mt-3 space-y-3">
                                {archives.filter((artifact) => artifact.caseId === activeWorkspace?.id)
                                    .slice(0, 4)
                                    .map((artifact) => (
                                        <div key={artifact.id} className="border border-zinc-800 bg-black/50 p-3">
                                            <div className="text-sm text-white">{artifact.topic}</div>
                                            <p className="mt-2 text-xs leading-5 text-zinc-400">{artifact.summary}</p>
                                        </div>
                                    ))}
                            </div>
                        </section>

                        <section>
                            <div className="text-xs font-mono uppercase tracking-[0.28em] text-zinc-500">
                                Recent Signals
                            </div>
                            <div className="mt-3 space-y-3">
                                {headlines.filter((headline) => headline.caseId === activeWorkspace?.id)
                                    .slice(0, 4)
                                    .map((headline) => (
                                        <div key={headline.id} className="border border-zinc-800 bg-black/50 p-3">
                                            <div className="text-sm text-white">{headline.source || headline.type}</div>
                                            <p className="mt-2 text-xs leading-5 text-zinc-400">{headline.content}</p>
                                        </div>
                                    ))}
                            </div>
                        </section>
                    </div>
                </aside>
            </div>
        </div>
    );
};
