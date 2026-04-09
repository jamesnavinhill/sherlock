import React, { useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Clock3,
  Paperclip,
  Send,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';

import type { BoardAgentAction, BoardAgentSession } from '@/types';
import { Accordion } from '@/components/ui/Accordion';
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
    session: boolean;
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
  visibleBoardAgentActions: BoardAgentAction[];
  visibleBoardAgentSession: BoardAgentSession | null;
  onPromptChange: (value: string) => void;
  onToggleContext: () => void;
  onToggleSession: () => void;
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
  visibleBoardAgentActions,
  visibleBoardAgentSession,
  onPromptChange,
  onToggleContext,
  onToggleSession,
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
  const selectedReviewCount = boardAgentReviewState
    ? boardAgentReviewState.actionIds.filter((actionId) => boardAgentReviewSelections[actionId]).length
    : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black">
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="space-y-4">
          <Accordion
            title="Agent Context"
            icon={Shapes}
            count={selectedEntries.length || undefined}
            isOpen={agentSections.context}
            onToggle={onToggleContext}
          >
            <div className="osint-raised-surface-subtle space-y-3 p-3 osint-body-small">
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
                      className="rounded-none border border-zinc-800 bg-black/80 px-2.5 py-1 osint-title-inline text-zinc-300"
                    >
                      {entry.title}
                    </span>
                  ))}
                  {selectedEntries.length > 4 ? (
                    <span className="rounded-none border border-zinc-800 bg-black/80 px-2.5 py-1 osint-body-quiet">
                      +{selectedEntries.length - 4} more
                    </span>
                  ) : null}
                </div>
              ) : null}
              {aiSummary ? (
                <div className="osint-raised-surface-subtle p-3 osint-body-small">{aiSummary}</div>
              ) : null}
            </div>
          </Accordion>

          {boardAgentReviewState ? (
            <div className="osint-panel-shell border border-zinc-800 bg-black/30 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
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
                  <div className="mt-3 border border-zinc-800 bg-black/40 p-3 osint-body-small">
                    {boardAgentReviewState.message}
                  </div>
                ) : null}
                <label className="mt-4 flex items-start gap-3 border border-zinc-800 bg-black/40 p-3 osint-body-small">
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
                      Preselect board-only layout changes like align, move, distribute, grouping, and viewport actions.
                    </div>
                  </div>
                </label>
              </div>

              <div className="space-y-3 px-4 py-4">
                {boardAgentReviewActions.map((action) => {
                  const presentation = buildBoardAgentActionPresentation(action);
                  const isSelected = !!boardAgentReviewSelections[action.id];

                  return (
                  <div key={action.id} className="osint-raised-surface-subtle p-3">
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
                            <div className="mt-2 osint-body-small">
                              {presentation.summary}
                            </div>
                            {presentation.expectedWrites.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {presentation.expectedWrites.map((write) => (
                                  <span
                                    key={write}
                                    className="rounded-none border border-zinc-800 bg-black/70 px-2 py-1 osint-meta-label text-zinc-400"
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
                      className="inline-flex items-center gap-2 border border-zinc-700 bg-zinc-950 px-3 py-2 osint-meta-label-strong text-zinc-400 transition hover:border-zinc-500 hover:text-white"
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

          {boardAgentMessage ? (
            <div className="osint-panel-shell border border-zinc-800 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
              <div className="osint-eyebrow flex items-center gap-2">
                <Bot className="h-3.5 w-3.5 text-osint-primary" />
                Agent Response
              </div>
              <div className="mt-3 whitespace-pre-wrap osint-body-small">
                {boardAgentMessage}
              </div>
            </div>
          ) : null}

          {visibleBoardAgentSession || boardAgentTodoItems.length > 0 ? (
            <Accordion
              title="Session"
              icon={Clock3}
              isOpen={agentSections.session}
              onToggle={onToggleSession}
          >
              <div className="osint-raised-surface-subtle space-y-3 border border-t-0 border-zinc-800 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="osint-meta-value">{visibleBoardAgentSession?.title || 'Board agent'}</div>
                  {visibleBoardAgentSession ? (
                    <div
                      className={`rounded-none border px-2.5 py-1 osint-meta-label-strong ${getStatusClassName(visibleBoardAgentSession.requestState || visibleBoardAgentSession.status)}`}
                    >
                      {visibleBoardAgentSession.requestState}
                    </div>
                  ) : null}
                </div>
                {visibleBoardAgentSession ? (
                  <div className="space-y-1 osint-body-quiet">
                    <div>
                      {visibleBoardAgentSession.provider || 'Provider pending'}
                      {visibleBoardAgentSession.modelId
                        ? ` - ${visibleBoardAgentSession.modelId}`
                        : ''}
                    </div>
                    <div>Status: {visibleBoardAgentSession.status}</div>
                  </div>
                ) : null}
                {boardAgentBusy ? (
                  <div>
                    <button
                      type="button"
                      onClick={onCancelAgent}
                      className="inline-flex items-center gap-1 rounded-none border border-red-400/40 bg-red-500/10 px-2.5 py-1.5 osint-meta-label-strong text-red-200 transition hover:bg-red-500/20 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </div>
                ) : null}
                {boardAgentTodoItems.length > 0 ? (
                  <div className="space-y-2">
                    {boardAgentTodoItems.map((item) => (
                      <div
                        key={item.id}
                      className="osint-raised-surface-subtle flex items-start justify-between gap-3 px-3 py-2"
                      >
                        <div className="osint-body-small">{item.text}</div>
                        <div className="shrink-0 osint-meta-label">
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </Accordion>
          ) : null}

          {visibleBoardAgentActions.length > 0 ? (
            <Accordion
              title="Action History"
              icon={SlidersHorizontal}
              isOpen={agentSections.actions}
              onToggle={onToggleActions}
            >
              <div className="osint-raised-surface-subtle space-y-2 border border-t-0 border-zinc-800 p-4">
                {visibleBoardAgentActions.slice(0, 8).map((action) => {
                  const presentation = buildBoardAgentActionPresentation(action);
                  return (
                    <div
                      key={action.id}
                      className="osint-raised-surface-subtle px-3 py-3"
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

      <div className="p-4">
        <div className="osint-panel-shell border border-zinc-800 bg-black/20">
          <textarea
            value={boardAgentPrompt}
            onChange={(event) => onPromptChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask the board agent to organize evidence, flag contradictions, or draft a note."
            className="min-h-28 w-full resize-none bg-transparent px-4 py-4 text-sm leading-6 text-zinc-300 outline-none placeholder:text-zinc-600"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 px-3 py-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStarterMenuOpen((current) => !current)}
                  className={`osint-meta-label-strong inline-flex h-10 items-center gap-2 rounded-none border px-3 transition ${
                    starterMenuOpen
                      ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Intent
                </button>
                {starterMenuOpen ? (
                  <div className="absolute bottom-12 left-0 z-20 w-72 border border-zinc-800 bg-black shadow-2xl">
                    {BOARD_AGENT_STARTER_INTENTS.map((intent) => (
                      <button
                        key={intent.id}
                        type="button"
                        onClick={() => {
                          onSelectStarterIntent(intent.prompt);
                          setStarterMenuOpen(false);
                        }}
                        className="block w-full border-b border-zinc-800 px-3 py-3 text-left transition last:border-b-0 hover:bg-zinc-900/80"
                      >
                        <div className="osint-meta-label-strong text-zinc-200">{intent.label}</div>
                        <div className="mt-1 osint-body-quiet">{intent.description}</div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onAttachFiles}
                className="inline-flex h-10 w-10 items-center justify-center rounded-none border border-zinc-800 bg-zinc-900/80 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                aria-label="Attach files"
                title="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onToggleActions}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-none border transition ${
                  agentSections.actions
                    ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
                aria-label="Toggle agent details"
                title="Toggle agent details"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={onRunAgent}
              disabled={boardAgentBusy || !boardAgentPrompt.trim()}
              className="osint-button-primary osint-meta-label-strong inline-flex items-center gap-2 rounded-none px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              {boardAgentBusy ? 'Running' : 'Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
