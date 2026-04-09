import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ChatSession } from '@/types';
import { ChatSessionRail } from './ChatSessionRail';

describe('ChatSessionRail', () => {
  it('renders the library header and board-style session actions', () => {
    const session: ChatSession = {
      id: 'session-1',
      workspaceId: 'workspace-1',
      title: 'Procurement Review',
      status: 'ACTIVE',
      createdAt: 1,
      updatedAt: 2,
    };

    render(
      <ChatSessionRail
        activeSessionId={session.id}
        leftPanelOpen
        leftPanelSections={{ sessions: true, workspace: true }}
        workspaceDescription="Weekly procurement and vendor review."
        workspaceSessions={[session]}
        chatMessagesBySessionId={{ [session.id]: [{ id: 'message-1' }] as never[] }}
        workspaceTitle="Atlas Workspace"
        sectionScrollClassName=""
        getGuidedSessionState={() => null}
        getSessionTitle={(value) => value.title}
        formatDateTime={() => 'April 8, 2026'}
        onToggleSessions={vi.fn()}
        onToggleWorkspace={vi.fn()}
        onSelectSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />
    );

    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Atlas Workspace')).toBeInTheDocument();
    expect(screen.getByText('Procurement Review')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rename/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByText(/weekly procurement and vendor review/i)).toBeInTheDocument();
  });
});
