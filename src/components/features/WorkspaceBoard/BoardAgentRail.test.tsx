import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BoardAgentRail } from './BoardAgentRail';

describe('BoardAgentRail', () => {
  it('renders an icon-only composer toolbar and the thinner context subsection', () => {
    render(
      <BoardAgentRail
        agentSections={{
          context: true,
          session: false,
          actions: false,
        }}
        selectedEntries={[]}
        aiSummary={null}
        boardAgentAutoApproveOrganizationActions={false}
        boardAgentMessage={null}
        boardAgentReviewActions={[]}
        boardAgentReviewSelections={{}}
        boardAgentReviewState={null}
        boardAgentTodoItems={[]}
        boardAgentBusy={false}
        boardAgentPrompt=""
        visibleBoardAgentActions={[]}
        visibleBoardAgentSession={null}
        onPromptChange={vi.fn()}
        onToggleContext={vi.fn()}
        onToggleSession={vi.fn()}
        onToggleActions={vi.fn()}
        onAttachFiles={vi.fn()}
        onRunAgent={vi.fn()}
        onCancelAgent={vi.fn()}
        onApprovePlan={vi.fn()}
        onReviewSelectionChange={vi.fn()}
        onSelectStarterIntent={vi.fn()}
        onSkipPlan={vi.fn()}
        onToggleAutoApproveOrganizationActions={vi.fn()}
        onKeyDown={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/ask the board agent/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Starter prompts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Attach files' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle agent details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run agent' })).toBeDisabled();
    expect(screen.queryByText('Intent')).not.toBeInTheDocument();
    expect(screen.queryByText('Plan')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agent Context/i })).toHaveClass('min-h-[34px]');
    expect(screen.getByText('Entire board in view')).toBeInTheDocument();
    const contextSection = screen
      .getByRole('button', { name: /Agent Context/i })
      .closest('.osint-raised-surface-section');
    expect(contextSection?.nextElementSibling?.querySelector('textarea')).toBeTruthy();
  });
});
