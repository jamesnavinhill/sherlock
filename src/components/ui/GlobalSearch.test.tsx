import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { useWorkspaceStore } from '@/store/workspaceStore';
import type { ChatSession } from '@/types';

vi.mock('@/services/db/repositories/WorkspaceSearchRepository', () => ({
  WorkspaceSearchRepository: {
    searchWorkspace: vi.fn(async () => []),
  },
}));

vi.mock('@/components/features/Timeline/timelineSavedViews', () => ({
  getAllTimelineSavedViews: vi.fn(async () => []),
}));

import { GlobalSearch } from './GlobalSearch';

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

describe('GlobalSearch', () => {
  beforeEach(() => {
    const chatSession: ChatSession = {
      id: 'chat-1',
      workspaceId: 'ws-1',
      title: 'Chat',
      status: 'ACTIVE',
      provider: 'OPENAI',
      modelId: 'gpt-5.4-mini',
      createdAt: 1,
      updatedAt: 1,
    };

    localStorage.clear();
    useWorkspaceStore.setState({
      activeWorkspaceBoardId: null,
      activeWorkspaceId: 'ws-1',
      artifacts: [
        {
          id: 'artifact-1',
          workspaceId: 'ws-1',
          topic: 'Atlas Memo',
          summary: 'Hidden snippet text',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: 'raw',
          createdAt: 100,
        },
      ],
      chatMessagesBySessionId: {},
      chatSessions: [],
      headlines: [],
      showGlobalSearch: true,
      workspaceItems: [],
      workspaceRuns: [],
      workspaces: [
        {
          id: 'ws-1',
          title: 'Atlas Workspace',
          displayTitle: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-10',
          updatedAt: 200,
        },
      ],
      addChatMessage: vi.fn(async () => undefined),
      addToast: vi.fn(),
      createChatSession: vi.fn(async () => chatSession),
      ensureWorkspaceBoard: vi.fn(async () => ({
        id: 'board-1',
        workspaceId: 'ws-1',
        name: 'Primary Board',
        sortOrder: 0,
        presentationMode: false,
        createdAt: 1,
        updatedAt: 1,
      })),
      queueBoardPlacement: vi.fn(),
      setActiveChatSessionId: vi.fn(),
      setActiveRunId: vi.fn(),
      setActiveWorkspaceId: vi.fn(),
      setShowGlobalSearch: vi.fn(),
    });
  });

  it('keeps result rows collapsed and moves actions into the row menu', () => {
    render(
      <MemoryRouter future={routerFuture}>
        <GlobalSearch />
      </MemoryRouter>
    );

    expect(screen.getByText('Atlas Memo')).toBeInTheDocument();
    expect(screen.queryByText('Hidden snippet text')).not.toBeInTheDocument();
    expect(screen.queryByText('Chat')).not.toBeInTheDocument();

    const menuTrigger = screen.getByRole('button', { name: /more options for atlas memo/i });

    fireEvent.click(menuTrigger);

    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Place' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Timeline' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Files' })).toBeInTheDocument();

    fireEvent.click(menuTrigger);

    expect(screen.queryByRole('button', { name: 'Open' })).not.toBeInTheDocument();
  });
});
