import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { CircleStop, Send } from 'lucide-react';

import type { ChatGenerationStatus, ChatMentionReference, InvestigationScope, Workspace } from '@/types';
import type { GuidedRunDraft, GuidedSessionState } from '@/services/chat/guidedMode';
import { sanitizeDisplayTitle } from '@/domain';
import {
  applyMentionSelection,
  resolveDraftMentions,
  resolveMentionQuery,
} from '@/components/ui/omniboxModel';
import { GuidedRunBuilder } from './GuidedRunBuilder';

interface ChatComposerProps {
  activeWorkspace: Workspace | null;
  customScopes: InvestigationScope[];
  draft: string;
  guidedState: GuidedSessionState | null;
  isBusy: boolean;
  chatGenerationStatus: ChatGenerationStatus;
  mentionCandidates: ChatMentionReference[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDraftChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onStopGeneration: () => void;
  onAdvanceGuided: (draft: GuidedRunDraft) => void;
  onGuidedBack: () => void;
  onGuidedLaunch: () => void;
  onGuidedSaveDraft: () => void;
  onOpenManualSetup: () => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  activeWorkspace,
  customScopes,
  draft,
  guidedState,
  isBusy,
  chatGenerationStatus,
  mentionCandidates,
  onSubmit,
  onDraftChange,
  onKeyDown,
  onStopGeneration,
  onAdvanceGuided,
  onGuidedBack,
  onGuidedLaunch,
  onGuidedSaveDraft,
  onOpenManualSetup,
}) =>
  activeWorkspace && guidedState ? (
    <GuidedRunBuilder
      key={guidedState.step}
      state={guidedState}
      customScopes={customScopes}
      workspace={activeWorkspace}
      isBusy={isBusy}
      onAdvance={onAdvanceGuided}
      onBack={onGuidedBack}
      onLaunchRun={onGuidedLaunch}
      onSaveDraft={onGuidedSaveDraft}
      onOpenManualSetup={onOpenManualSetup}
    />
  ) : (
    <ChatComposerInput
      activeWorkspace={activeWorkspace}
      chatGenerationStatus={chatGenerationStatus}
      draft={draft}
      isBusy={isBusy}
      mentionCandidates={mentionCandidates}
      onDraftChange={onDraftChange}
      onKeyDown={onKeyDown}
      onStopGeneration={onStopGeneration}
      onSubmit={onSubmit}
    />
  );

interface ChatComposerInputProps {
  activeWorkspace: Workspace | null;
  chatGenerationStatus: ChatGenerationStatus;
  draft: string;
  isBusy: boolean;
  mentionCandidates: ChatMentionReference[];
  onDraftChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onStopGeneration: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const ChatComposerInput: React.FC<ChatComposerInputProps> = ({
  activeWorkspace,
  chatGenerationStatus,
  draft,
  isBusy,
  mentionCandidates,
  onDraftChange,
  onKeyDown,
  onStopGeneration,
  onSubmit,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingSelectionRef = useRef<number | null>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const mentionState = useMemo(
    () => resolveMentionQuery(draft, selectionStart, mentionCandidates),
    [draft, mentionCandidates, selectionStart]
  );
  const linkedMentions = useMemo(
    () => resolveDraftMentions(draft, mentionCandidates),
    [draft, mentionCandidates]
  );

  useEffect(() => {
    if (pendingSelectionRef.current === null || !textareaRef.current) return;
    const nextPosition = pendingSelectionRef.current;
    pendingSelectionRef.current = null;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(nextPosition, nextPosition);
    setSelectionStart(nextPosition);
  }, [draft]);

  const commitMention = (index: number) => {
    if (!mentionState) return;
    const candidate = mentionState.results[index];
    if (!candidate) return;

    const nextDraft = applyMentionSelection(
      draft,
      selectionStart,
      textareaRef.current?.selectionEnd || selectionStart,
      candidate
    );
    if (!nextDraft) return;

    onDraftChange(nextDraft);
    pendingSelectionRef.current = mentionState.rangeStart + candidate.title.length + 2;
  };

  return (
    <form onSubmit={onSubmit} className="h-[150px] border-t border-zinc-800 bg-black/95 px-4 sm:px-6">
      <div className="mx-auto h-full max-w-4xl py-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => {
              onDraftChange(event.target.value);
              setSelectionStart(event.target.selectionStart || 0);
              setActiveMentionIndex(0);
            }}
            onClick={(event) => setSelectionStart(event.currentTarget.selectionStart || 0)}
            onKeyUp={(event) => setSelectionStart(event.currentTarget.selectionStart || 0)}
            onSelect={(event) => setSelectionStart(event.currentTarget.selectionStart || 0)}
            onKeyDown={(event) => {
              if (mentionState?.results.length) {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setActiveMentionIndex((current) => (current + 1) % mentionState.results.length);
                  return;
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActiveMentionIndex(
                    (current) => (current - 1 + mentionState.results.length) % mentionState.results.length
                  );
                  return;
                }
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  commitMention(activeMentionIndex);
                  return;
                }
              }

              onKeyDown(event);
            }}
            placeholder={
              activeWorkspace
                ? `Ask about ${sanitizeDisplayTitle(activeWorkspace.title)}...`
                : 'Select a workspace to begin chatting...'
            }
            className="h-full min-h-0 w-full resize-none border border-zinc-700 bg-black px-4 py-4 pb-14 pr-24 text-sm text-white outline-none transition focus:border-osint-primary"
          />

          {mentionState?.results.length ? (
            <div className="absolute bottom-16 left-4 right-4 z-10 rounded border border-zinc-800 bg-zinc-950 shadow-xl">
              <div className="border-b border-zinc-800 px-3 py-2 text-[10px] font-mono uppercase tracking-wide text-zinc-500">
                Mention workspace records
              </div>
              <div className="max-h-48 overflow-y-auto py-1">
                {mentionState.results.map((candidate, index) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      commitMention(index);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors ${
                      index === activeMentionIndex ? 'bg-zinc-900 text-white' : 'text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <span className="truncate text-sm">{candidate.title}</span>
                    <span className="ml-3 shrink-0 text-[10px] font-mono uppercase text-zinc-500">
                      {candidate.subtitle}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {linkedMentions.length ? (
              <div className="absolute bottom-12 left-3 right-24 flex flex-wrap gap-1.5">
                {linkedMentions.map((mention) => (
                  <span
                    key={mention.id}
                    className="inline-flex max-w-full items-center gap-2 border border-zinc-700/80 bg-zinc-950/90 px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-zinc-300"
                  >
                    <span className="truncate">{mention.title}</span>
                    <span className="shrink-0 text-zinc-500">{mention.subtitle}</span>
                  </span>
                ))}
              </div>
            ) : null}
            {chatGenerationStatus === 'GENERATING' || chatGenerationStatus === 'CANCELLING' ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="osint-button-danger inline-flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wide"
              >
                <CircleStop className="h-4 w-4" />
                Stop
              </button>
            ) : null}
            <button
              type="submit"
              disabled={!activeWorkspace || !draft.trim() || isBusy}
              aria-label="Send message"
              title="Send message"
              className="osint-button-primary inline-flex h-10 w-10 items-center justify-center p-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
