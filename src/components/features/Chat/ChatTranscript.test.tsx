import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ChatMessage, Workspace } from '@/types';
import { ChatTranscript } from './ChatTranscript';

const workspace: Workspace = {
  id: 'ws-1',
  title: 'Atlas Workspace',
  status: 'ACTIVE',
  dateOpened: '2026-04-10',
};

const message: ChatMessage = {
  id: 'message-1',
  sessionId: 'session-1',
  role: 'assistant',
  content: 'Latest workspace update.',
  createdAt: 1,
  updatedAt: 1,
  status: 'COMPLETED',
};

describe('ChatTranscript', () => {
  it('uses a stable balanced scrollbar gutter so transcript content stays aligned with the composer', () => {
    const { container } = render(
      <ChatTranscript
        activeWorkspace={workspace}
        messages={[message]}
        workspaces={[workspace]}
        workingAssistantMessageId={null}
        workingSessionId={null}
        partialAssistantOutput=""
        messageBodyClassName="osint-body-small"
        sectionLabelClassName="osint-meta-label"
        transcriptEndRef={createRef<HTMLDivElement>()}
        splitCollapsedFollowUpBlock={(body) => ({ primaryBody: body, collapsedBody: '' })}
        formatTimestamp={() => '12:00'}
        copyToClipboard={vi.fn(async () => undefined)}
        formatMessageWithCitations={(entry) => entry.content}
        handleOpenMention={vi.fn()}
        handlePromoteAttachment={vi.fn(async () => undefined)}
        handleSaveMessageAsArtifact={vi.fn(async () => undefined)}
        handleAppendMessageToArtifact={vi.fn(async () => undefined)}
        handleLaunchFollowUp={vi.fn(async () => undefined)}
        handleStartNewWorkspace={vi.fn()}
      />
    );

    expect(screen.getByText('Latest workspace update.')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('pt-2');
    expect(screen.getByTestId('chat-transcript-shell')).toHaveClass('border');
    const scrollRegion = container.querySelector('[data-app-scroll-region]');
    expect(scrollRegion).not.toBeNull();
    expect(scrollRegion).toHaveClass('custom-scrollbar');
    expect(scrollRegion?.getAttribute('class')).toContain('[scrollbar-gutter:stable_both-edges]');
    expect(screen.getByTestId('chat-transcript-stack')).toHaveClass(
      'min-h-full',
      'justify-end',
      'py-4'
    );
  });

  it('anchors the workspace primer at the top of the transcript before any messages exist', () => {
    render(
      <ChatTranscript
        activeWorkspace={workspace}
        messages={[]}
        workspaces={[workspace]}
        workingAssistantMessageId={null}
        workingSessionId={null}
        partialAssistantOutput=""
        messageBodyClassName="osint-body-small"
        sectionLabelClassName="osint-meta-label"
        transcriptEndRef={createRef<HTMLDivElement>()}
        splitCollapsedFollowUpBlock={(body) => ({ primaryBody: body, collapsedBody: '' })}
        formatTimestamp={() => '12:00'}
        copyToClipboard={vi.fn(async () => undefined)}
        formatMessageWithCitations={(entry) => entry.content}
        handleOpenMention={vi.fn()}
        handlePromoteAttachment={vi.fn(async () => undefined)}
        handleSaveMessageAsArtifact={vi.fn(async () => undefined)}
        handleAppendMessageToArtifact={vi.fn(async () => undefined)}
        handleLaunchFollowUp={vi.fn(async () => undefined)}
        handleStartNewWorkspace={vi.fn()}
      />
    );

    expect(screen.getByTestId('chat-assistant-primer')).toBeInTheDocument();
    expect(screen.getByTestId('chat-transcript-stack')).toHaveClass('justify-start');
  });

  it('renders user messages as natural rows inside the shared transcript pane', () => {
    const userMessage: ChatMessage = {
      id: 'message-2',
      sessionId: 'session-1',
      role: 'user',
      content: 'hi',
      createdAt: 2,
      updatedAt: 2,
      status: 'COMPLETED',
    };

    render(
      <ChatTranscript
        activeWorkspace={workspace}
        messages={[userMessage]}
        workspaces={[workspace]}
        workingAssistantMessageId={null}
        workingSessionId={null}
        partialAssistantOutput=""
        messageBodyClassName="osint-body-small"
        sectionLabelClassName="osint-meta-label"
        transcriptEndRef={createRef<HTMLDivElement>()}
        splitCollapsedFollowUpBlock={(body) => ({ primaryBody: body, collapsedBody: '' })}
        formatTimestamp={() => '12:01'}
        copyToClipboard={vi.fn(async () => undefined)}
        formatMessageWithCitations={(entry) => entry.content}
        handleOpenMention={vi.fn()}
        handlePromoteAttachment={vi.fn(async () => undefined)}
        handleSaveMessageAsArtifact={vi.fn(async () => undefined)}
        handleAppendMessageToArtifact={vi.fn(async () => undefined)}
        handleLaunchFollowUp={vi.fn(async () => undefined)}
        handleStartNewWorkspace={vi.fn()}
      />
    );

    const userCard = screen.getByText('hi').closest('article');
    expect(userCard).not.toBeNull();
    expect(userCard?.getAttribute('class')).toContain('w-full');
    expect(userCard?.getAttribute('class')).toContain('px-5');
    expect(userCard?.getAttribute('class')).toContain('group');
    expect(userCard?.getAttribute('class')).not.toContain('bg-zinc-950/60');
    expect(userCard?.getAttribute('class')).not.toContain('bg-zinc-900/80');
    expect(screen.getByText('user').closest('div')?.getAttribute('class')).toContain('justify-end');
    expect(screen.getByText('hi').getAttribute('class')).toContain('text-right');
    const footerMeta = userCard?.querySelector('.osint-body-quiet');
    expect(footerMeta).not.toBeNull();
    expect(footerMeta?.parentElement?.getAttribute('class')).toContain('group-hover:opacity-100');
  });

  it('left aligns assistant metadata while keeping user metadata right aligned', () => {
    const userMessage: ChatMessage = {
      id: 'message-2',
      sessionId: 'session-1',
      role: 'user',
      content: 'hi',
      createdAt: 2,
      updatedAt: 2,
      status: 'COMPLETED',
    };

    render(
      <ChatTranscript
        activeWorkspace={workspace}
        messages={[message, userMessage]}
        workspaces={[workspace]}
        workingAssistantMessageId={null}
        workingSessionId={null}
        partialAssistantOutput=""
        messageBodyClassName="osint-body-small"
        sectionLabelClassName="osint-meta-label"
        transcriptEndRef={createRef<HTMLDivElement>()}
        splitCollapsedFollowUpBlock={(body) => ({ primaryBody: body, collapsedBody: '' })}
        formatTimestamp={() => '12:00'}
        copyToClipboard={vi.fn(async () => undefined)}
        formatMessageWithCitations={(entry) => entry.content}
        handleOpenMention={vi.fn()}
        handlePromoteAttachment={vi.fn(async () => undefined)}
        handleSaveMessageAsArtifact={vi.fn(async () => undefined)}
        handleAppendMessageToArtifact={vi.fn(async () => undefined)}
        handleLaunchFollowUp={vi.fn(async () => undefined)}
        handleStartNewWorkspace={vi.fn()}
      />
    );

    const assistantCard = screen.getByText('Latest workspace update.').closest('article');
    const userCard = screen.getByText('hi').closest('article');
    const assistantFooter = assistantCard?.querySelector('.osint-body-quiet');
    const userFooter = userCard?.querySelector('.osint-body-quiet');

    expect(assistantFooter?.getAttribute('class')).toContain('justify-start');
    expect(userFooter?.getAttribute('class')).toContain('justify-end');
    expect(assistantFooter?.textContent).toBe('12:00Copy');
    expect(userFooter?.textContent).toBe('Copy12:00');
  });

  it('uses the Sherlock mark for assistant rows and the accent person icon for user rows', () => {
    const userMessage: ChatMessage = {
      id: 'message-2',
      sessionId: 'session-1',
      role: 'user',
      content: 'hi',
      createdAt: 2,
      updatedAt: 2,
      status: 'COMPLETED',
    };

    const { container } = render(
      <ChatTranscript
        activeWorkspace={workspace}
        messages={[message, userMessage]}
        workspaces={[workspace]}
        workingAssistantMessageId={null}
        workingSessionId={null}
        partialAssistantOutput=""
        messageBodyClassName="osint-body-small"
        sectionLabelClassName="osint-meta-label"
        transcriptEndRef={createRef<HTMLDivElement>()}
        splitCollapsedFollowUpBlock={(body) => ({ primaryBody: body, collapsedBody: '' })}
        formatTimestamp={() => '12:00'}
        copyToClipboard={vi.fn(async () => undefined)}
        formatMessageWithCitations={(entry) => entry.content}
        handleOpenMention={vi.fn()}
        handlePromoteAttachment={vi.fn(async () => undefined)}
        handleSaveMessageAsArtifact={vi.fn(async () => undefined)}
        handleAppendMessageToArtifact={vi.fn(async () => undefined)}
        handleLaunchFollowUp={vi.fn(async () => undefined)}
        handleStartNewWorkspace={vi.fn()}
      />
    );

    expect(container.querySelector('img[src="/logo-dark.jpg"]')).not.toBeNull();
    expect(container.querySelector('svg.lucide-user.text-osint-primary')).not.toBeNull();
  });
});
