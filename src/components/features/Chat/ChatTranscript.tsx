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

import type { ChatMentionReference, ChatMessage, Workspace } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { findMentionMatches } from '@/services/chat/mentions';
import { getWorkspaceDisplayTitle } from '@/domain';

type ChatAttachment = NonNullable<ChatMessage['attachments']>[number];

interface ChatTranscriptProps {
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
}

export const ChatTranscript: React.FC<ChatTranscriptProps> = ({
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
}) => {
  const showWorkspaceEmptyState = !activeWorkspace;
  const hasMessages = messages.length > 0;
  const showAssistantPrimer = !!activeWorkspace && !hasMessages;
  const assistantPrimerBody = activeWorkspace
    ? buildAssistantPrimerBody(activeWorkspace)
    : '';

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-black">
      <div
        className={`min-h-0 flex-1 px-4 py-4 sm:px-6 ${
          showWorkspaceEmptyState
            ? 'overflow-hidden'
            : 'overflow-y-auto overscroll-contain custom-scrollbar [scrollbar-gutter:stable_both-edges]'
        }`}
        data-app-scroll-region
      >
        <div
          className={`mx-auto flex w-full max-w-4xl flex-col ${
            hasMessages ? 'gap-4 pb-0' : showAssistantPrimer ? 'gap-4 py-6' : 'min-h-full justify-center'
          }`}
        >
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
        ) : null}

        {showAssistantPrimer ? (
          <article className="w-full max-w-4xl self-start border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className={`flex items-center gap-2 ${sectionLabelClassName}`}>
                <Bot className="h-4 w-4 text-osint-primary" />
                assistant
              </div>
              <div className="osint-body-quiet">Ready in workspace</div>
            </div>
            <div className={messageBodyClassName} data-testid="chat-assistant-primer">
              <ReactMarkdown>{assistantPrimerBody}</ReactMarkdown>
            </div>
          </article>
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
                <div className="flex items-center gap-3 osint-body-quiet">
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
                <div className="osint-body-muted">Generating response...</div>
              ) : (
                <>
                  {messageMentions.length > 0 && isUser ? (
                    <div className="osint-body-small leading-7 text-zinc-100">
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
                                  className="mx-0.5 inline-flex items-center gap-2 border border-osint-primary/40 bg-osint-primary/10 px-2 py-0.5 osint-meta-label-strong text-zinc-100 transition hover:border-osint-primary hover:text-white"
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
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 osint-meta-label transition hover:text-white [&::-webkit-details-marker]:hidden">
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
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 osint-meta-label transition hover:text-white [&::-webkit-details-marker]:hidden">
                      {`Related Context (${message.attachments?.length ?? 0})`}
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    </summary>
                    <div className="mt-3 space-y-2">
                      {(message.attachments || []).map((attachment) => (
                        <div key={attachment.id} className="border border-zinc-800 bg-zinc-900/20 p-3">
                          <div className="osint-panel-title text-zinc-200">{attachment.title}</div>
                          {attachment.snippet ? (
                            <p className="mt-1 osint-body-quiet leading-5">{attachment.snippet}</p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() => void handlePromoteAttachment(message, attachment)}
                              className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-1.5 osint-meta-label-strong text-zinc-300 transition hover:border-osint-primary hover:text-white"
                            >
                              <FilePlus2 className="h-3.5 w-3.5" />
                              Promote Excerpt
                            </button>
                            <button
                              onClick={() => void handlePromoteAttachment(message, attachment, true)}
                              className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-1.5 osint-meta-label-strong text-zinc-300 transition hover:border-osint-primary hover:text-white"
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
                    className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-2 osint-meta-label-strong text-zinc-300 transition hover:border-osint-primary hover:text-white"
                  >
                    <FilePlus2 className="h-3.5 w-3.5" />
                    Save Draft
                  </button>
                  <button
                    onClick={() => void handleAppendMessageToArtifact(message)}
                    className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-2 osint-meta-label-strong text-zinc-300 transition hover:border-osint-primary hover:text-white"
                  >
                    <FileSearch className="h-3.5 w-3.5" />
                    Append To Artifact
                  </button>
                  <button
                    onClick={() => void handleLaunchFollowUp(message)}
                    className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-2 osint-meta-label-strong text-zinc-300 transition hover:border-osint-primary hover:text-white"
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
};

const buildAssistantPrimerBody = (workspace: Workspace): string => {
  const workspaceTitle = getWorkspaceDisplayTitle(workspace);
  const workspaceDescription = workspace.description?.trim();

  return `You are back in **${workspaceTitle}**.${workspaceDescription ? ` I already have this workspace framing in view: _${workspaceDescription}_.` : ' I can work from the artifacts, signals, prior sessions, and linked context already saved here.'}

**I can help you:**
- summarize the current state of the workspace
- compare artifacts, signals, runs, and prior chat threads
- trace what changed, what matters, and what still looks thin
- turn an answer into a draft, append it to an existing artifact, or tee up a follow-up run

**A few good ways to start:**
- "Give me the current state of play in five bullets."
- "What changed since the latest artifact or signal?"
- "Compare the strongest evidence we have and call out the gaps."
- "Draft the next investigation steps from what is already in this workspace."

You can also mention saved records with \`@\` if you want me to focus on a specific artifact, signal, entity, or board item.`;
};
