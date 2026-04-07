import React from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  ChevronDown,
  Clipboard,
  FilePlus2,
  FileSearch,
  Layout,
  MessageSquare,
  PlayCircle,
} from 'lucide-react';

import type { ChatMentionReference, ChatMessage, ChatSession, Workspace } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { findMentionMatches } from '@/services/chat/mentions';

type ChatAttachment = NonNullable<ChatMessage['attachments']>[number];

interface ChatTranscriptProps {
  activeSession: ChatSession | null;
  activeWorkspace: Workspace | null;
  messages: ChatMessage[];
  workspaces: Workspace[];
  workingAssistantMessageId: string | null;
  workingSessionId: string | null;
  partialAssistantOutput: string;
  messageBodyClassName: string;
  sectionLabelClassName: string;
  transcriptEndRef: React.RefObject<HTMLDivElement | null>;
  splitCollapsedFollowUpBlock: (body: string) => { primaryBody: string; collapsedBody: string };
  formatTimestamp: (value: number) => string;
  copyToClipboard: (value: string, successMessage: string) => Promise<void>;
  formatMessageWithCitations: (message: ChatMessage) => string;
  handleOpenMention: (mention: ChatMentionReference) => void;
  handlePromoteAttachment: (
    message: ChatMessage,
    attachment: ChatAttachment,
    placeOnBoard?: boolean
  ) => Promise<void>;
  handleSaveMessageAsArtifact: (message: ChatMessage) => Promise<void>;
  handleAppendMessageToArtifact: (message: ChatMessage) => Promise<void>;
  handleLaunchFollowUp: (message: ChatMessage) => Promise<void>;
  handleStartNewWorkspace: () => void;
  handleCreateSession: () => Promise<void>;
}

export const ChatTranscript: React.FC<ChatTranscriptProps> = ({
  activeSession,
  activeWorkspace,
  messages,
  workspaces,
  workingAssistantMessageId,
  workingSessionId,
  partialAssistantOutput,
  messageBodyClassName,
  sectionLabelClassName,
  transcriptEndRef,
  splitCollapsedFollowUpBlock,
  formatTimestamp,
  copyToClipboard,
  formatMessageWithCitations,
  handleOpenMention,
  handlePromoteAttachment,
  handleSaveMessageAsArtifact,
  handleAppendMessageToArtifact,
  handleLaunchFollowUp,
  handleStartNewWorkspace,
  handleCreateSession,
}) => (
  <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-black">
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 pb-4">
        {!activeWorkspace ? (
          <EmptyState
            icon={MessageSquare}
            title={workspaces.length === 0 ? 'Workspace Chat Needs A Workspace' : 'No Workspace Selected'}
            description={
              workspaces.length === 0
                ? 'Start a workspace first. Chat sessions are scoped to one workspace so every answer stays local, grounded, and auditable.'
                : 'Select a workspace from the header to open sessions, context, and chat history.'
            }
            action={
              workspaces.length === 0
                ? {
                    label: 'Start New Workspace',
                    onClick: handleStartNewWorkspace,
                  }
                : undefined
            }
            className="px-0 py-6"
            panelClassName="max-w-3xl px-6 py-8"
          />
        ) : messages.length === 0 ? (
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
        ) : null}

        {messages.map((message) => {
          const isStreamingMessage =
            message.id === workingAssistantMessageId &&
            message.sessionId === workingSessionId &&
            (message.status === 'PENDING' || message.status === 'STREAMING');
          const body =
            isStreamingMessage && partialAssistantOutput ? partialAssistantOutput : message.content;
          const isAssistant = message.role === 'assistant';
          const isUser = message.role === 'user';
          const isTool = message.role === 'tool';
          const { primaryBody, collapsedBody } = isAssistant
            ? splitCollapsedFollowUpBlock(body)
            : { primaryBody: body, collapsedBody: '' };

          const messageMentions = Array.isArray((message.metadata as { mentions?: unknown } | undefined)?.mentions)
            ? ((message.metadata as { mentions?: ChatMentionReference[] }).mentions || [])
            : [];
          const mentionMatches = findMentionMatches(primaryBody, messageMentions);

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
                  {messageMentions.length > 0 && isUser ? (
                    <div className="text-sm leading-7 text-zinc-100">
                      {mentionMatches.length === 0 ? (
                        <span className="whitespace-pre-wrap">{primaryBody}</span>
                      ) : (
                        <>
                          {(() => {
                            const segments: React.ReactNode[] = [];
                            let cursor = 0;

                            mentionMatches.forEach((match) => {
                              if (match.start > cursor) {
                                segments.push(
                                  <span key={`text:${cursor}`} className="whitespace-pre-wrap">
                                    {primaryBody.slice(cursor, match.start)}
                                  </span>
                                );
                              }

                              segments.push(
                                <button
                                  key={`${match.mention.id}:${match.start}`}
                                  type="button"
                                  onClick={() => handleOpenMention(match.mention)}
                                  className="mx-0.5 inline-flex items-center gap-2 border border-osint-primary/40 bg-osint-primary/10 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wide text-zinc-100 transition hover:border-osint-primary hover:text-white"
                                >
                                  <span className="normal-case">{match.mention.title}</span>
                                  <span className="text-zinc-400">{match.mention.subtitle}</span>
                                </button>
                              );

                              cursor = match.end;
                            });

                            if (cursor < primaryBody.length) {
                              segments.push(
                                <span key={`text:${cursor}`} className="whitespace-pre-wrap">
                                  {primaryBody.slice(cursor)}
                                </span>
                              );
                            }

                            return segments;
                          })()}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className={messageBodyClassName}>
                      <ReactMarkdown>{primaryBody}</ReactMarkdown>
                    </div>
                  )}
                  {collapsedBody ? (
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
                  ) : null}
                </>
              )}

              {(message.attachments?.length ?? 0) > 0 ? (
                <div className="mt-4 border-t border-zinc-800 pt-3">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500 transition hover:text-white [&::-webkit-details-marker]:hidden">
                      {`Related Context (${message.attachments?.length ?? 0})`}
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    </summary>
                    <div className="mt-3 space-y-2">
                      {(message.attachments || []).map((attachment) => (
                        <div key={attachment.id} className="border border-zinc-800 bg-zinc-900/20 p-3">
                          <div className="text-sm text-zinc-200">{attachment.title}</div>
                          {attachment.snippet ? (
                            <p className="mt-1 text-xs leading-5 text-zinc-500">{attachment.snippet}</p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() => void handlePromoteAttachment(message, attachment)}
                              className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wide text-zinc-300 transition hover:border-osint-primary hover:text-white"
                            >
                              <FilePlus2 className="h-3.5 w-3.5" />
                              Promote Excerpt
                            </button>
                            <button
                              onClick={() => void handlePromoteAttachment(message, attachment, true)}
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
              ) : null}

              {isAssistant && message.status === 'COMPLETED' && message.content.trim().length > 0 ? (
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

              {message.status === 'CANCELLED' ? (
                <div className="mt-3 border-t border-amber-950 pt-3 text-sm text-amber-300">
                  Generation was stopped before completion.
                </div>
              ) : null}

              {message.error ? (
                <div className="osint-danger-banner mt-3 border-t pt-3 text-sm">{message.error}</div>
              ) : null}
            </article>
          );
        })}

        <div ref={transcriptEndRef} />
      </div>
    </div>
  </section>
);
