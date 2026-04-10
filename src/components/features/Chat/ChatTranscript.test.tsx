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
    const scrollRegion = container.querySelector('[data-app-scroll-region]');
    expect(scrollRegion).not.toBeNull();
    expect(scrollRegion).toHaveClass('custom-scrollbar');
    expect(scrollRegion?.getAttribute('class')).toContain('[scrollbar-gutter:stable_both-edges]');
  });
});
