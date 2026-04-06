import React from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { CircleStop, Send } from 'lucide-react';

import type { ChatGenerationStatus, InvestigationScope, Workspace } from '@/types';
import type { GuidedRunDraft, GuidedSessionState } from '@/services/chat/guidedMode';
import { sanitizeDisplayTitle } from '@/domain';
import { GuidedRunBuilder } from './GuidedRunBuilder';

interface ChatComposerProps {
  activeWorkspace: Workspace | null;
  customScopes: InvestigationScope[];
  draft: string;
  guidedState: GuidedSessionState | null;
  isBusy: boolean;
  chatGenerationStatus: ChatGenerationStatus;
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
    <form onSubmit={onSubmit} className="h-[150px] border-t border-zinc-800 bg-black/95 px-4 sm:px-6">
      <div className="mx-auto h-full max-w-4xl py-2">
        <div className="relative">
          <textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              activeWorkspace
                ? `Ask about ${sanitizeDisplayTitle(activeWorkspace.title)}...`
                : 'Select a workspace to begin chatting...'
            }
            className="h-full min-h-0 w-full resize-none border border-zinc-700 bg-black px-4 py-4 pb-14 pr-24 text-sm text-white outline-none transition focus:border-osint-primary"
          />

          <div className="absolute bottom-3 right-3 flex items-center gap-2">
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
