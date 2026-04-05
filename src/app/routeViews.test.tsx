import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import type { ChatSession, WorkspaceBoard } from '@/types';

vi.mock('@/components/features/OperationView', () => ({
  OperationView: () => <div>Operation View</div>,
}));

vi.mock('@/components/features/Chat', () => ({
  Chat: () => <div>Chat View</div>,
}));

vi.mock('@/components/features/NetworkGraph', () => ({
  NetworkGraph: () => <div>Network View</div>,
}));

vi.mock('@/components/features/TimelineView', () => ({
  TimelineView: () => <div>Timeline View</div>,
}));

vi.mock('@/components/features/WorkspaceBoard', () => ({
  WorkspaceBoard: () => <div>Workspace Board</div>,
}));

import { BoardRouteView, ChatRouteView } from './routeViews';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}{location.search}</div>;
};

const boardFixture: WorkspaceBoard = {
  id: 'board-1',
  workspaceId: 'ws-1',
  name: 'Primary Board',
  sortOrder: 0,
  presentationMode: false,
  createdAt: 1,
  updatedAt: 1,
};

const sessionFixture: ChatSession = {
  id: 'session-1',
  workspaceId: 'ws-1',
  title: 'Primary Session',
  status: 'ACTIVE',
  createdAt: 1,
  updatedAt: 1,
};

describe('route views', () => {
  it('clears the active chat session on the workspace chat landing route', async () => {
    const setActiveWorkspaceId = vi.fn();
    const setActiveChatSessionId = vi.fn();

    render(
      <MemoryRouter initialEntries={['/workspaces/ws-1/chat']}>
        <Routes>
          <Route
            path="/workspaces/:workspaceId/chat"
            element={
              <>
                <ChatRouteView
                  setActiveWorkspaceId={setActiveWorkspaceId}
                  setActiveChatSessionId={setActiveChatSessionId}
                  chatSessions={[sessionFixture]}
                  onLaunchInvestigation={vi.fn()}
                />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(setActiveWorkspaceId).toHaveBeenCalledWith('ws-1');
      expect(setActiveChatSessionId).toHaveBeenCalledWith(null);
    });

    expect(screen.getByTestId('location')).toHaveTextContent('/workspaces/ws-1/chat');
  });

  it('redirects invalid chat session routes back to the workspace chat landing route', async () => {
    render(
      <MemoryRouter initialEntries={['/workspaces/ws-1/chat/missing']}>
        <Routes>
          <Route
            path="/workspaces/:workspaceId/chat/:sessionId"
            element={
              <>
                <ChatRouteView
                  setActiveWorkspaceId={vi.fn()}
                  setActiveChatSessionId={vi.fn()}
                  chatSessions={[sessionFixture]}
                  onLaunchInvestigation={vi.fn()}
                />
                <LocationProbe />
              </>
            }
          />
          <Route path="/workspaces/:workspaceId/chat" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/workspaces/ws-1/chat');
    });
  });

  it('redirects the board landing route to the first workspace board document', async () => {
    render(
      <MemoryRouter initialEntries={['/workspaces/ws-1/board']}>
        <Routes>
          <Route
            path="/workspaces/:workspaceId/board"
            element={
              <>
                <BoardRouteView
                  setActiveWorkspaceId={vi.fn()}
                  setActiveWorkspaceBoardId={vi.fn()}
                  workspaceBoards={[boardFixture]}
                  onViewReport={vi.fn()}
                  onOpenChat={vi.fn()}
                  onLaunchInvestigation={vi.fn()}
                />
                <LocationProbe />
              </>
            }
          />
          <Route path="/workspaces/:workspaceId/board/:boardId" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/workspaces/ws-1/board/board-1');
    });
  });

  it('redirects invalid board routes to the first valid workspace board document', async () => {
    render(
      <MemoryRouter initialEntries={['/workspaces/ws-1/board/missing']}>
        <Routes>
          <Route
            path="/workspaces/:workspaceId/board/:boardId"
            element={
              <>
                <BoardRouteView
                  setActiveWorkspaceId={vi.fn()}
                  setActiveWorkspaceBoardId={vi.fn()}
                  workspaceBoards={[boardFixture]}
                  onViewReport={vi.fn()}
                  onOpenChat={vi.fn()}
                  onLaunchInvestigation={vi.fn()}
                />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/workspaces/ws-1/board/board-1');
    });
  });
});
