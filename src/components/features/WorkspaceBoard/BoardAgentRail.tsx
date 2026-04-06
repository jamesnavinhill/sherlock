import React from 'react';
import {
  Bot,
  Clock3,
  Paperclip,
  Send,
  Shapes,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import { Accordion } from '@/components/ui/Accordion';

interface BoardAgentAction {
  id: string;
  type: string;
  status: string;
  error?: string;
  result?: unknown;
}

interface BoardAgentTodoItem {
  id: string;
  text: string;
  status: string;
}

interface BoardAgentSession {
  title?: string;
  status: string;
  provider?: string;
  modelId?: string;
}

interface BoardAgentRailProps {
  agentSections: {
    context: boolean;
    session: boolean;
    actions: boolean;
  };
  selectedEntries: Array<{ title: string; refId: string; refKind: string }>;
  aiSummary: string | null;
  boardAgentMessage: string | null;
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
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const BoardAgentRail: React.FC<BoardAgentRailProps> = ({
  agentSections,
  selectedEntries,
  aiSummary,
  boardAgentMessage,
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
  onKeyDown,
}) => (
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
          <div className="space-y-3 bg-black/20 p-3 text-sm text-zinc-300">
            <div>
              {selectedEntries.length > 0
                ? `${selectedEntries.length} selected item${selectedEntries.length === 1 ? '' : 's'}`
                : 'Entire board in view'}
            </div>
            {selectedEntries.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedEntries.slice(0, 4).map((entry) => (
                  <span
                    key={`${entry.refKind}:${entry.refId}`}
                    className="rounded-none border border-zinc-800 bg-black/80 px-2.5 py-1 text-[11px] text-zinc-300"
                  >
                    {entry.title}
                  </span>
                ))}
                {selectedEntries.length > 4 ? (
                  <span className="rounded-none border border-zinc-800 bg-black/80 px-2.5 py-1 text-[11px] text-zinc-500">
                    +{selectedEntries.length - 4} more
                  </span>
                ) : null}
              </div>
            ) : null}
            {aiSummary ? (
              <div className="border border-zinc-800 bg-black/30 p-3 text-xs leading-6 text-zinc-300">
                {aiSummary}
              </div>
            ) : null}
          </div>
        </Accordion>

        {boardAgentMessage ? (
          <div className="border border-zinc-800 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
              <Bot className="h-3.5 w-3.5 text-osint-primary" />
              Agent Response
            </div>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
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
            <div className="space-y-3 border border-t-0 border-zinc-800 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-zinc-300">
                  {visibleBoardAgentSession?.title || 'Board agent'}
                </div>
                {visibleBoardAgentSession ? (
                  <div className="rounded-none border border-zinc-800 bg-black/60 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400">
                    {visibleBoardAgentSession.status}
                  </div>
                ) : null}
              </div>
              {visibleBoardAgentSession ? (
                <div className="text-xs text-zinc-500">
                  {visibleBoardAgentSession.provider || 'Provider pending'}
                  {visibleBoardAgentSession.modelId ? ` - ${visibleBoardAgentSession.modelId}` : ''}
                </div>
              ) : null}
              {boardAgentBusy ? (
                <div>
                  <button
                    type="button"
                    onClick={onCancelAgent}
                    className="inline-flex items-center gap-1 rounded-none border border-red-400/40 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-200 transition hover:bg-red-500/20 hover:text-white"
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
                      className="flex items-start justify-between gap-3 border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-zinc-300"
                    >
                      <div>{item.text}</div>
                      <div className="shrink-0 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
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
            title="Recent Actions"
            icon={SlidersHorizontal}
            isOpen={agentSections.actions}
            onToggle={onToggleActions}
          >
            <div className="space-y-2 border border-t-0 border-zinc-800 bg-black/20 p-4">
              {visibleBoardAgentActions.slice(0, 8).map((action) => (
                <div
                  key={action.id}
                  className="border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-zinc-300"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono uppercase tracking-[0.14em] text-zinc-200">
                      {action.type}
                    </div>
                    <div className="font-mono uppercase tracking-[0.14em] text-zinc-500">
                      {action.status}
                    </div>
                  </div>
                  {action.error ? (
                    <div className="mt-2 text-[11px] leading-5 text-red-300">{action.error}</div>
                  ) : null}
                  {!action.error && action.result ? (
                    <div className="mt-2 overflow-x-auto text-[11px] leading-5 text-zinc-500">
                      {JSON.stringify(action.result)}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Accordion>
        ) : null}
      </div>
    </div>

    <div className="p-4">
      <div className="border border-zinc-800 bg-black/20">
        <textarea
          value={boardAgentPrompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask the board agent to organize evidence, flag contradictions, or draft a note."
          className="min-h-28 w-full resize-none bg-transparent px-4 py-4 text-sm leading-6 text-zinc-300 outline-none placeholder:text-zinc-600"
        />
        <div className="flex items-center justify-between border-t border-zinc-800/80 px-3 py-3">
          <div className="flex items-center gap-2">
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
            className="osint-button-primary inline-flex items-center gap-2 rounded-none px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            {boardAgentBusy ? 'Running' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  </div>
);
