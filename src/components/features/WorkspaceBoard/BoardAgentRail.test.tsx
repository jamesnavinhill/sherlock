import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BoardAgentRail } from './BoardAgentRail';

describe('BoardAgentRail', () => {
  it('renders an icon-only composer toolbar and the thinner context subsection', () => {
    render(
      <BoardAgentRail
        agentSections={{
          context: true,
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
        boardSessionsForBoard={[]}
        visibleBoardAgentActions={[]}
        visibleBoardAgentSession={null}
        copyToClipboard={vi.fn(async () => undefined)}
        onSelectSession={vi.fn()}
        onPromptChange={vi.fn()}
        onToggleContext={vi.fn()}
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
    expect(screen.getByRole('button', { name: 'Session history' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Attach files' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle agent details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run agent' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /^Session$/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Intent')).not.toBeInTheDocument();
    expect(screen.queryByText('Plan')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agent Context/i })).toHaveClass('min-h-[34px]');
    expect(screen.getByText('Entire board in view')).toBeInTheDocument();
    const contextSection = screen
      .getByRole('button', { name: /Agent Context/i })
      .closest('.osint-raised-surface-section');
    expect(contextSection?.nextElementSibling?.querySelector('textarea')).toBeTruthy();
  });

  it('renders a full-width transcript block for the visible board-agent session', () => {
    render(
      <BoardAgentRail
        agentSections={{
          context: false,
          actions: false,
        }}
        selectedEntries={[]}
        aiSummary={null}
        boardAgentAutoApproveOrganizationActions={false}
        boardAgentMessage="Here is the latest board readout."
        boardAgentReviewActions={[]}
        boardAgentReviewSelections={{}}
        boardAgentReviewState={null}
        boardAgentTodoItems={[]}
        boardAgentBusy={false}
        boardAgentPrompt=""
        boardSessionsForBoard={[]}
        visibleBoardAgentActions={[]}
        visibleBoardAgentSession={{
          id: 'session-1',
          workspaceId: 'workspace-1',
          boardId: 'board-1',
          title: 'Board Agent Session',
          status: 'COMPLETED',
          request: 'Cluster the visible evidence.',
          requestState: 'COMPLETED',
          createdAt: new Date(2026, 3, 10, 15, 38).getTime(),
          updatedAt: new Date(2026, 3, 10, 15, 39).getTime(),
          completedAt: new Date(2026, 3, 10, 15, 39).getTime(),
          metadata: {
            latestMessage: 'Here is the latest board readout.',
          },
        }}
        copyToClipboard={vi.fn(async () => undefined)}
        onSelectSession={vi.fn()}
        onPromptChange={vi.fn()}
        onToggleContext={vi.fn()}
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

    const transcriptShell = screen.getByTestId('board-agent-transcript-shell');
    expect(transcriptShell).toHaveClass('w-full', 'border-x');
    expect(screen.getByText('Cluster the visible evidence.').getAttribute('class')).toContain(
      'text-right'
    );
    expect(
      screen.getByText('Here is the latest board readout.').closest('.prose')?.className
    ).toContain('prose-invert');

    const userCard = screen.getByText('Cluster the visible evidence.').closest('article');
    const assistantCard = screen.getByText('Here is the latest board readout.').closest('article');
    const userFooter = userCard?.querySelector('.osint-body-quiet');
    const assistantFooter = assistantCard?.querySelector('.osint-body-quiet');

    expect(userCard?.getAttribute('class')).toContain('group');
    expect(assistantCard?.getAttribute('class')).toContain('group');
    expect(userFooter?.getAttribute('class')).toContain('justify-end');
    expect(assistantFooter?.getAttribute('class')).toContain('justify-start');
    expect(userFooter?.parentElement?.getAttribute('class')).toContain('group-hover:opacity-100');
    expect(assistantFooter?.parentElement?.getAttribute('class')).toContain(
      'group-hover:opacity-100'
    );
    expect(userFooter?.textContent).toBe('Copy03:38 PM');
    expect(assistantFooter?.textContent).toBe('03:39 PMCopy');
  });

  it('surfaces streaming state in the transcript and avoids echoing the raw request as the session title', () => {
    render(
      <BoardAgentRail
        agentSections={{
          context: false,
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
        boardAgentBusy={true}
        boardAgentPrompt=""
        boardSessionsForBoard={[
          {
            id: 'session-2',
            workspaceId: 'workspace-1',
            boardId: 'board-1',
            title: 'heya',
            status: 'RUNNING',
            request: 'heya',
            requestState: 'STREAMING',
            createdAt: new Date(2026, 3, 10, 16, 6).getTime(),
            updatedAt: new Date(2026, 3, 10, 16, 6).getTime(),
            metadata: {},
          },
        ]}
        visibleBoardAgentActions={[]}
        visibleBoardAgentSession={{
          id: 'session-2',
          workspaceId: 'workspace-1',
          boardId: 'board-1',
          title: 'heya',
          status: 'RUNNING',
          request: 'heya',
          requestState: 'STREAMING',
          createdAt: new Date(2026, 3, 10, 16, 6).getTime(),
          updatedAt: new Date(2026, 3, 10, 16, 6).getTime(),
          metadata: {},
        }}
        copyToClipboard={vi.fn(async () => undefined)}
        onSelectSession={vi.fn()}
        onPromptChange={vi.fn()}
        onToggleContext={vi.fn()}
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

    expect(screen.getByText('Thinking through the board context.')).toBeInTheDocument();
    expect(screen.getByText('STREAMING')).toBeInTheDocument();
    expect(screen.getAllByText('heya')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Session history' }));
    expect(screen.getByText('Session History')).toBeInTheDocument();
    expect(screen.getAllByText('Board agent')).toHaveLength(2);
  });
});
