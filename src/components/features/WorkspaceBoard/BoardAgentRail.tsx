import React, { useState } from 'react';
import {
  CheckCircle2,
  Clipboard,
  Clock3,
  Paperclip,
  Send,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import type { BoardAgentAction, BoardAgentSession } from '@/types';
import { Accordion } from '@/components/ui/Accordion';
import { TranscriptRoleIcon } from '@/components/features/Chat/TranscriptRoleIcon';
import {
  formatDateTime,
  formatTimestamp,
  sectionLabelClassName,
} from '@/components/features/Chat/chatPageUtils';
import {
  BOARD_AGENT_STARTER_INTENTS,
  buildBoardAgentActionPresentation,
} from '@/services/workspace/agent';
import type { BoardAgentTodoItem } from '@/services/workspace/agent';

interface BoardAgentReviewState {
  sessionId: string;
  passIndex: number;
  actionIds: string[];
  message: string;
  phase: 'REVIEW' | 'EXECUTING' | 'COMPLETE' | 'CANCELLED';
}

interface BoardAgentRailProps {
  agentSections: {
    context: boolean;
    actions: boolean;
  };
  selectedEntries: Array<{ title: string; refId: string; refKind: string }>;
  aiSummary: string | null;
  boardAgentAutoApproveOrganizationActions: boolean;
  boardAgentMessage: string | null;
  boardAgentReviewActions: BoardAgentAction[];
  boardAgentReviewSelections: Record<string, boolean>;
  boardAgentReviewState: BoardAgentReviewState | null;
  boardAgentTodoItems: BoardAgentTodoItem[];
  boardAgentBusy: boolean;
  boardAgentPrompt: string;
  boardSessionsForBoard: BoardAgentSession[];
  visibleBoardAgentActions: BoardAgentAction[];
  visibleBoardAgentSession: BoardAgentSession | null;
  copyToClipboard: (value: string, successMessage: string) => Promise<void>;
  onSelectSession: (sessionId: string) => void;
  onPromptChange: (value: string) => void;
  onToggleContext: () => void;
  onToggleActions: () => void;
  onAttachFiles: () => void;
  onRunAgent: () => void;
  onCancelAgent: () => void;
  onApprovePlan: () => void;
  onReviewSelectionChange: (actionId: string, selected: boolean) => void;
  onSelectStarterIntent: (prompt: string) => void;
  onSkipPlan: () => void;
  onToggleAutoApproveOrganizationActions: (value: boolean) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const getStatusClassName = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
    case 'RUNNING':
    case 'EXECUTING':
      return 'border-sky-400/30 bg-sky-500/10 text-sky-200';
    case 'AWAITING_APPROVAL':
    case 'REVIEW':
      return 'border-amber-400/30 bg-amber-500/10 text-amber-200';
    case 'SKIPPED':
    case 'CANCELLED':
      return 'border-zinc-700 bg-zinc-900 text-zinc-400';
    case 'FAILED':
    case 'REJECTED':
      return 'border-red-400/30 bg-red-500/10 text-red-200';
    default:
      return 'border-zinc-800 bg-black/60 text-zinc-400';
  }
};

const getRiskClassName = (risk: ReturnType<typeof buildBoardAgentActionPresentation>['risk']) => {
  switch (risk) {
    case 'MATERIAL':
      return 'border-red-400/30 bg-red-500/10 text-red-200';
    case 'LOW':
      return 'border-amber-400/30 bg-amber-500/10 text-amber-200';
    default:
      return 'border-zinc-700 bg-zinc-900 text-zinc-400';
  }
};

export const BoardAgentRail: React.FC<BoardAgentRailProps> = ({
  agentSections,
  selectedEntries,
  aiSummary,
  boardAgentAutoApproveOrganizationActions,
  boardAgentMessage,
  boardAgentReviewActions,
  boardAgentReviewSelections,
  boardAgentReviewState,
  boardAgentTodoItems,
  boardAgentBusy,
  boardAgentPrompt,
  boardSessionsForBoard,
  visibleBoardAgentActions,
  visibleBoardAgentSession,
  copyToClipboard,
  onSelectSession,
  onPromptChange,
  onToggleContext,
  onToggleActions,
  onAttachFiles,
  onRunAgent,
  onCancelAgent,
  onApprovePlan,
  onReviewSelectionChange,
  onSelectStarterIntent,
  onSkipPlan,
  onToggleAutoApproveOrganizationActions,
  onKeyDown,
}) => {
  const [starterMenuOpen, setStarterMenuOpen] = useState(false);
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const selectedReviewCount = boardAgentReviewState
    ? boardAgentReviewState.actionIds.filter((actionId) => boardAgentReviewSelections[actionId])
        .length
    : 0;
  const headerToneSurfaceClassName = 'osint-shell-stage-surface';
  const headerToneChipClassName = 'osint-shell-chip';
  const hoverToolbarIconClassName =
    'h-4 w-4 text-current transition-colors group-hover:[color:var(--osint-primary)] group-focus-visible:[color:var(--osint-primary)]';
  const activeToolbarIconClassName = 'h-4 w-4 [color:var(--osint-primary)]';
  const composerToolButtonClassName =
    'osint-ghost-button group inline-flex h-9 w-9 items-center justify-center text-[color:var(--osint-text-muted)] transition hover:text-osint-primary focus-visible:text-osint-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40';
  const boardTranscriptBodyClassName =
    'prose prose-invert max-w-none text-sm leading-7 text-[color:var(--osint-text-strong)] prose-p:my-2 prose-ul:my-2 prose-headings:my-3 [&_h1]:text-inherit [&_h2]:text-inherit [&_h3]:text-inherit [&_h4]:text-inherit [&_h5]:text-inherit [&_h6]:text-inherit [&_p]:text-inherit [&_li]:text-inherit [&_ol]:text-inherit [&_ul]:text-inherit [&_strong]:text-inherit [&_em]:text-inherit [&_code]:text-inherit [&_blockquote]:text-inherit';
  const latestPersistedMessage =
    typeof visibleBoardAgentSession?.metadata?.latestMessage === 'string'
      ? visibleBoardAgentSession.metadata.latestMessage
      : '';
  const assistantTranscriptMessage = (boardAgentMessage || latestPersistedMessage || '').trim();
  const userTranscriptMessage = visibleBoardAgentSession?.request.trim() || '';
  const sessionRequestState = visibleBoardAgentSession?.requestState || null;
  const sessionStatus = visibleBoardAgentSession?.status || null;
  const assistantTranscriptFallbackMessage =
    assistantTranscriptMessage.length > 0
      ? ''
      : visibleBoardAgentSession?.lastError?.trim() ||
        (sessionRequestState === 'QUEUED'
          ? 'Queued to start the board-agent pass.'
          : sessionRequestState === 'ASSEMBLING_CONTEXT'
            ? 'Assembling the visible board context.'
            : sessionRequestState === 'STREAMING'
              ? 'Thinking through the board context.'
              : sessionRequestState === 'EXECUTING_ACTIONS'
                ? 'Applying the approved board actions.'
                : sessionRequestState === 'AWAITING_APPROVAL'
                  ? 'Waiting for plan approval before making board changes.'
                  : sessionStatus === 'FAILED'
                    ? 'Board-agent run failed before it returned a response.'
                    : sessionStatus === 'CANCELLED'
                      ? 'Board-agent run cancelled.'
                      : '');
  const assistantTranscriptDisplayMessage =
    assistantTranscriptMessage || assistantTranscriptFallbackMessage;
  const showTranscript =
    userTranscriptMessage.length > 0 || assistantTranscriptDisplayMessage.length > 0;
  const userTranscriptTimestamp =
    visibleBoardAgentSession?.startedAt || visibleBoardAgentSession?.createdAt || null;
  const assistantTranscriptTimestamp =
    visibleBoardAgentSession?.completedAt || visibleBoardAgentSession?.updatedAt || null;
  const showAssistantStatusChip = !!sessionRequestState && sessionRequestState !== 'COMPLETED';
  const sessionDisplayTitle =
    visibleBoardAgentSession &&
    visibleBoardAgentSession.title.trim() &&
    visibleBoardAgentSession.title.trim() !== visibleBoardAgentSession.request.trim()
      ? visibleBoardAgentSession.title
      : 'Board agent';
  const getSessionDisplayTitle = (session: BoardAgentSession) =>
    session.title.trim() && session.title.trim() !== session.request.trim()
      ? session.title
      : 'Board agent';
  const sharedSectionSurfaceClassName = 'osint-shell-stage-surface';
  const transcriptSurfaceClassName = 'osint-shell-stage-surface';
  const composerShellClassName = `${sharedSectionSurfaceClassName} -mt-px overflow-visible`;
  const composerInputClassName = 'overflow-hidden';

  return (
    <div className="-mx-3 -mb-3 flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex min-h-full flex-col gap-4 pt-3 pb-3">
            {boardAgentReviewState ? (
              <div
                className={`osint-panel-shell ${headerToneSurfaceClassName} shadow-[0_18px_48px_rgba(0,0,0,0.24)]`}
              >
                <div className="border-b border-zinc-800 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="osint-eyebrow flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-osint-primary" />
                        Review Plan
                      </div>
                      <div className="mt-2 osint-meta-value">
                        Pass {boardAgentReviewState.passIndex}
                      </div>
                    </div>
                    <div
                      className={`rounded-none border px-2.5 py-1 osint-meta-label-strong ${getStatusClassName(boardAgentReviewState.phase)}`}
                    >
                      {boardAgentReviewState.phase}
                    </div>
                  </div>
                  {boardAgentReviewState.message ? (
                    <div className={`mt-3 p-3 osint-body-small ${headerToneSurfaceClassName}`}>
                      {boardAgentReviewState.message}
                    </div>
                  ) : null}
                  <label
                    className={`mt-4 flex items-start gap-3 p-3 osint-body-small ${headerToneSurfaceClassName}`}
                  >
                    <input
                      type="checkbox"
                      checked={boardAgentAutoApproveOrganizationActions}
                      onChange={(event) =>
                        onToggleAutoApproveOrganizationActions(event.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 rounded-none border-zinc-700 bg-black text-osint-primary focus:ring-osint-primary"
                      disabled={boardAgentReviewState.phase !== 'REVIEW'}
                    />
                    <div>
                      <div className="osint-meta-value">
                        Auto-approve low-risk organization moves
                      </div>
                      <div className="mt-1 osint-body-quiet">
                        Preselect board-only layout changes like align, move, distribute, grouping,
                        and viewport actions.
                      </div>
                    </div>
                  </label>
                </div>

                <div className="space-y-3 px-4 py-4">
                  {boardAgentReviewActions.map((action) => {
                    const presentation = buildBoardAgentActionPresentation(action);
                    const isSelected = !!boardAgentReviewSelections[action.id];

                    return (
                      <div
                        key={action.id}
                        className={`osint-raised-surface-subtle p-3 ${headerToneSurfaceClassName}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(event) =>
                                onReviewSelectionChange(action.id, event.target.checked)
                              }
                              className="mt-0.5 h-4 w-4 rounded-none border-zinc-700 bg-black text-osint-primary focus:ring-osint-primary"
                              disabled={boardAgentReviewState.phase !== 'REVIEW'}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="osint-title-inline">{presentation.title}</div>
                                <span
                                  className={`rounded-none border px-2 py-0.5 osint-meta-label-strong ${getRiskClassName(presentation.risk)}`}
                                >
                                  {presentation.risk}
                                </span>
                                <span
                                  className={`rounded-none border px-2 py-0.5 osint-meta-label-strong ${getStatusClassName(action.status)}`}
                                >
                                  {action.status}
                                </span>
                              </div>
                              <div className="mt-2 osint-body-small">{presentation.summary}</div>
                              {presentation.expectedWrites.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {presentation.expectedWrites.map((write) => (
                                    <span
                                      key={write}
                                      className={`${headerToneChipClassName} px-2 py-1 osint-meta-label text-zinc-400`}
                                    >
                                      {write}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                              {boardAgentReviewState.phase !== 'REVIEW' ? (
                                <div className="mt-3 border-t border-zinc-800 pt-3 osint-body-quiet">
                                  {presentation.receipt}
                                  {presentation.queuedFollowUpPrompt ? (
                                    <div className="mt-2 text-zinc-500">
                                      Next action: {presentation.queuedFollowUpPrompt}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {boardAgentReviewState.phase === 'REVIEW' ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 px-4 py-4">
                      <div className="osint-body-quiet">
                        {selectedReviewCount} of {boardAgentReviewActions.length} action
                        {boardAgentReviewActions.length === 1 ? '' : 's'} selected
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={onSkipPlan}
                          className="osint-button-chrome inline-flex items-center gap-2 px-3 py-2 osint-meta-label-strong"
                        >
                          Skip All
                        </button>
                      <button
                        type="button"
                        onClick={onApprovePlan}
                        className="osint-button-primary osint-meta-label-strong inline-flex items-center gap-2 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={selectedReviewCount === 0}
                      >
                        Execute Selected
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {showTranscript ? (
              <section
                className={`w-full overflow-hidden ${transcriptSurfaceClassName}`}
                data-testid="board-agent-transcript-shell"
              >
                {userTranscriptMessage ? (
                  <article className="group w-full px-5 py-3.5">
                    <div className="mb-2 space-y-2">
                      <div
                        className={`flex items-center gap-2 ${sectionLabelClassName} justify-end text-right`}
                      >
                        <TranscriptRoleIcon role="user" />
                        user
                      </div>
                    </div>

                    <div className="whitespace-pre-wrap text-right osint-body-small leading-6 text-[color:var(--osint-text-heading)]">
                      {userTranscriptMessage}
                    </div>

                    <div className="mt-4 min-h-5 opacity-0 transition-opacity duration-150 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
                      <div className="flex items-center justify-end gap-3 osint-body-quiet">
                        <button
                          type="button"
                          onClick={() =>
                            void copyToClipboard(
                              userTranscriptMessage,
                              'Board-agent request copied to clipboard.'
                            )
                          }
                          className="inline-flex items-center gap-1 transition-colors hover:text-osint-primary focus-visible:text-osint-primary"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                          Copy
                        </button>
                        {userTranscriptTimestamp ? (
                          <span>{formatTimestamp(userTranscriptTimestamp)}</span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ) : null}

                {assistantTranscriptDisplayMessage ? (
                  <article className="group w-full px-5 py-4">
                    <div className="mb-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div
                          className={`flex items-center gap-2 ${sectionLabelClassName} justify-start`}
                        >
                          <TranscriptRoleIcon role="assistant" />
                          Sherlock
                        </div>
                        {showAssistantStatusChip ? (
                          <span
                            className={`rounded-none border px-2 py-0.5 osint-meta-label-strong ${getStatusClassName(sessionRequestState || 'PENDING')}`}
                          >
                            {sessionRequestState}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className={boardTranscriptBodyClassName}>
                      <ReactMarkdown>{assistantTranscriptDisplayMessage}</ReactMarkdown>
                    </div>

                    <div className="mt-4 min-h-5 opacity-0 transition-opacity duration-150 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
                      <div className="flex items-center justify-start gap-3 osint-body-quiet">
                        {assistantTranscriptTimestamp ? (
                          <span>{formatTimestamp(assistantTranscriptTimestamp)}</span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() =>
                            void copyToClipboard(
                              assistantTranscriptDisplayMessage,
                              'Board-agent response copied to clipboard.'
                            )
                          }
                          className="inline-flex items-center gap-1 transition-colors hover:text-osint-primary focus-visible:text-osint-primary"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                          Copy
                        </button>
                      </div>
                    </div>
                  </article>
                ) : null}
              </section>
            ) : null}

            {visibleBoardAgentActions.length > 0 ? (
              <Accordion
                title="Action History"
                icon={SlidersHorizontal}
                isOpen={agentSections.actions}
                onToggle={onToggleActions}
              >
                <div
                  className={`osint-raised-surface-subtle space-y-2 p-4 ${headerToneSurfaceClassName} border-t-0`}
                >
                  {visibleBoardAgentActions.slice(0, 8).map((action) => {
                    const presentation = buildBoardAgentActionPresentation(action);
                    return (
                      <div
                        key={action.id}
                        className={`osint-raised-surface-subtle px-3 py-3 ${headerToneSurfaceClassName}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="osint-title-inline">{presentation.title}</div>
                          <div
                            className={`rounded-none border px-2 py-0.5 osint-meta-label-strong ${getStatusClassName(action.status)}`}
                          >
                            {action.status}
                          </div>
                        </div>
                        <div className="mt-2 osint-body-quiet">{presentation.receipt}</div>
                        {presentation.queuedFollowUpPrompt ? (
                          <div className="mt-2 osint-body-quiet text-zinc-500">
                            Next action: {presentation.queuedFollowUpPrompt}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </Accordion>
            ) : null}
          </div>
        </div>

        <div className="space-y-0">
          <Accordion
            title="Agent Context"
            icon={Shapes}
            count={selectedEntries.length || undefined}
            isOpen={agentSections.context}
            onToggle={onToggleContext}
            variant="nested"
            className="!mb-0"
            headerClassName="px-4 py-2"
            contentClassName="px-4 py-3"
          >
            <div
              className={`osint-raised-surface-subtle space-y-3 p-3 osint-body-small ${headerToneSurfaceClassName}`}
            >
              <div className="osint-meta-value">
                {selectedEntries.length > 0
                  ? `${selectedEntries.length} selected item${selectedEntries.length === 1 ? '' : 's'}`
                  : 'Entire board in view'}
              </div>
              {selectedEntries.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedEntries.slice(0, 4).map((entry) => (
                    <span
                      key={`${entry.refKind}:${entry.refId}`}
                      className={`${headerToneChipClassName} px-2.5 py-1 osint-title-inline text-zinc-300`}
                    >
                      {entry.title}
                    </span>
                  ))}
                  {selectedEntries.length > 4 ? (
                    <span className={`${headerToneChipClassName} px-2.5 py-1 osint-body-quiet`}>
                      +{selectedEntries.length - 4} more
                    </span>
                  ) : null}
                </div>
              ) : null}
              {aiSummary ? (
                <div
                  className={`osint-raised-surface-subtle p-3 osint-body-small ${headerToneSurfaceClassName}`}
                >
                  {aiSummary}
                </div>
              ) : null}
            </div>
          </Accordion>

          <div className={composerShellClassName}>
            <div className={composerInputClassName}>
              <textarea
                value={boardAgentPrompt}
                onChange={(event) => onPromptChange(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask the board agent to organize evidence, flag contradictions, or draft a note."
                className="min-h-28 w-full resize-none bg-transparent px-4 py-4 text-sm leading-6 text-[color:var(--osint-text)] outline-none placeholder:text-[color:var(--osint-text-muted)]"
              />
            </div>
            <div
              className={`relative z-10 flex items-center justify-between gap-3 border-t border-zinc-800/80 px-4 py-2.5 ${headerToneSurfaceClassName}`}
            >
              <div className="flex items-center gap-1">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setStarterMenuOpen((current) => !current);
                      setSessionMenuOpen(false);
                    }}
                    className={`${composerToolButtonClassName} ${
                      starterMenuOpen ? 'text-osint-primary' : ''
                    }`}
                    aria-label="Starter prompts"
                    title="Starter prompts"
                  >
                    <Sparkles
                      className={
                        starterMenuOpen ? activeToolbarIconClassName : hoverToolbarIconClassName
                      }
                    />
                  </button>
                  {starterMenuOpen ? (
                    <div className="osint-menu-panel absolute bottom-11 left-0 z-30 w-72 shadow-2xl">
                      {BOARD_AGENT_STARTER_INTENTS.map((intent) => (
                        <button
                          key={intent.id}
                          type="button"
                          onClick={() => {
                            onSelectStarterIntent(intent.prompt);
                            setStarterMenuOpen(false);
                          }}
                          className="osint-menu-item block w-full border-b border-zinc-800 px-3 py-3 text-left transition last:border-b-0"
                        >
                          <div className="osint-meta-label-strong">{intent.label}</div>
                          <div className="mt-1 osint-body-quiet">{intent.description}</div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setSessionMenuOpen((current) => !current);
                      setStarterMenuOpen(false);
                    }}
                    className={`${composerToolButtonClassName} ${
                      sessionMenuOpen ? 'text-osint-primary' : ''
                    }`}
                    aria-label="Session history"
                    title="Session history"
                  >
                    <Clock3
                      className={
                        sessionMenuOpen ? activeToolbarIconClassName : hoverToolbarIconClassName
                      }
                    />
                  </button>
                  {sessionMenuOpen ? (
                    <div className="osint-menu-panel absolute bottom-11 left-0 z-30 w-80 shadow-2xl">
                      <div className="border-b border-zinc-800 px-3 py-2 osint-menu-section-label">
                        Session History
                      </div>
                      {visibleBoardAgentSession ? (
                        <div className="border-b border-zinc-800 px-3 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="osint-meta-value">{sessionDisplayTitle}</div>
                            <div
                              className={`rounded-none border px-2 py-0.5 osint-meta-label-strong ${getStatusClassName(
                                visibleBoardAgentSession.requestState ||
                                  visibleBoardAgentSession.status
                              )}`}
                            >
                              {visibleBoardAgentSession.requestState ||
                                visibleBoardAgentSession.status}
                            </div>
                          </div>
                          <div className="mt-2 osint-body-quiet">
                            {formatDateTime(visibleBoardAgentSession.updatedAt)}
                          </div>
                          <div className="mt-1 osint-body-quiet">
                            {visibleBoardAgentSession.provider || 'Provider pending'}
                            {visibleBoardAgentSession.modelId
                              ? ` - ${visibleBoardAgentSession.modelId}`
                              : ''}
                          </div>
                          {boardAgentBusy ? (
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  onCancelAgent();
                                  setSessionMenuOpen(false);
                                }}
                                className="inline-flex items-center gap-1 rounded-none border border-red-400/40 bg-red-500/10 px-2.5 py-1.5 osint-meta-label-strong text-red-200 transition hover:bg-red-500/20 hover:text-white"
                              >
                                <X className="h-3.5 w-3.5" />
                                Cancel
                              </button>
                            </div>
                          ) : null}
                          {boardAgentTodoItems.length > 0 ? (
                            <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
                              {boardAgentTodoItems.slice(0, 4).map((item) => (
                                <div
                                  key={item.id}
                                  className="osint-shell-stage-surface-subtle flex items-start justify-between gap-3 px-3 py-2"
                                >
                                  <div className="osint-body-small">{item.text}</div>
                                  <div className="shrink-0 osint-meta-label">{item.status}</div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="border-b border-zinc-800 px-3 py-3 osint-body-quiet">
                          No board-agent sessions yet.
                        </div>
                      )}

                      {boardSessionsForBoard.length > 0 ? (
                        <div className="max-h-72 overflow-y-auto py-1">
                          {boardSessionsForBoard.slice(0, 8).map((session) => {
                            const isActive = session.id === visibleBoardAgentSession?.id;
                            return (
                              <button
                                key={session.id}
                                type="button"
                                disabled={boardAgentBusy}
                                onClick={() => {
                                  onSelectSession(session.id);
                                  setSessionMenuOpen(false);
                                }}
                                className={`osint-menu-item block w-full border-b border-zinc-800 px-3 py-3 text-left transition last:border-b-0 ${
                                  isActive ? 'bg-[var(--osint-menu-selection-bg)]' : ''
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="osint-meta-value">
                                    {getSessionDisplayTitle(session)}
                                  </div>
                                  <div
                                    className={`rounded-none border px-2 py-0.5 osint-meta-label-strong ${getStatusClassName(
                                      session.requestState || session.status
                                    )}`}
                                  >
                                    {session.requestState || session.status}
                                  </div>
                                </div>
                                <div className="mt-1 truncate osint-body-quiet">
                                  {session.request.trim() || 'No request saved.'}
                                </div>
                                <div className="mt-1 osint-body-quiet">
                                  {formatDateTime(session.updatedAt)}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onAttachFiles}
                  className={composerToolButtonClassName}
                  aria-label="Attach files"
                  title="Attach files"
                >
                  <Paperclip className={hoverToolbarIconClassName} />
                </button>
                <button
                  type="button"
                  onClick={onToggleActions}
                  className={`${composerToolButtonClassName} ${
                    agentSections.actions ? 'text-osint-primary' : ''
                  }`}
                  aria-label="Toggle agent details"
                  title="Toggle agent details"
                >
                  <SlidersHorizontal
                    className={
                      agentSections.actions ? activeToolbarIconClassName : hoverToolbarIconClassName
                    }
                  />
                </button>
              </div>
              <button
                type="button"
                onClick={onRunAgent}
                disabled={boardAgentBusy || !boardAgentPrompt.trim()}
                className={composerToolButtonClassName}
                aria-label={boardAgentBusy ? 'Agent running' : 'Run agent'}
                title={boardAgentBusy ? 'Agent running' : 'Run agent'}
              >
                <Send className={hoverToolbarIconClassName} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
