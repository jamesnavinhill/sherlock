import { render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import type { ChatSession, Workspace, WorkspaceBoard } from '@/types';

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

vi.mock('@/components/features/WorkspaceHome', () => ({
  WorkspaceHome: ({ workspaceId }: { workspaceId: string }) => (
    <div>Workspace Home {workspaceId}</div>
  ),
}));

import { BoardRouteView, ChatRouteView, WorkspaceHomeRouteView } from './routeViews';

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

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

const workspaceFixture: Workspace = {
  id: 'ws-1',
  title: 'Workspace One',
  status: 'ACTIVE',
  dateOpened: '2026-04-05',
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
      <MemoryRouter future={routerFuture} initialEntries={['/workspaces/ws-1/chat']}>
        <Routes>
          <Route
            path="/workspaces/:workspaceId/chat"
            element={
              <>
                <ChatRouteView
                  activeWorkspaceId="ws-1"
                  activeChatSessionId={null}
                  setActiveWorkspaceId={setActiveWorkspaceId}
                  setActiveChatSessionId={setActiveChatSessionId}
                  chatSessions={[sessionFixture]}
                  onLaunchInvestigation={vi.fn()}
                  workspaces={[workspaceFixture]}
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
      <MemoryRouter future={routerFuture} initialEntries={['/workspaces/ws-1/chat/missing']}>
        <Routes>
          <Route
            path="/workspaces/:workspaceId/chat/:sessionId"
            element={
              <>
                <ChatRouteView
                  activeWorkspaceId={null}
                  activeChatSessionId={null}
                  setActiveWorkspaceId={vi.fn()}
                  setActiveChatSessionId={vi.fn()}
                  chatSessions={[sessionFixture]}
                  onLaunchInvestigation={vi.fn()}
                  workspaces={[workspaceFixture]}
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
      <MemoryRouter future={routerFuture} initialEntries={['/workspaces/ws-1/board']}>
        <Routes>
          <Route
            path="/workspaces/:workspaceId/board"
            element={
              <>
                <BoardRouteView
                  activeWorkspaceId={null}
                  activeWorkspaceBoardId={null}
                  setActiveWorkspaceId={vi.fn()}
                  setActiveWorkspaceBoardId={vi.fn()}
                  workspaceBoards={[boardFixture]}
                  onViewReport={vi.fn()}
                  onOpenChat={vi.fn()}
                  onLaunchInvestigation={vi.fn()}
                  workspaces={[workspaceFixture]}
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
      <MemoryRouter future={routerFuture} initialEntries={['/workspaces/ws-1/board/missing']}>
        <Routes>
          <Route
            path="/workspaces/:workspaceId/board/:boardId"
            element={
              <>
                <BoardRouteView
                  activeWorkspaceId={null}
                  activeWorkspaceBoardId={null}
                  setActiveWorkspaceId={vi.fn()}
                  setActiveWorkspaceBoardId={vi.fn()}
                  workspaceBoards={[boardFixture]}
                  onViewReport={vi.fn()}
                  onOpenChat={vi.fn()}
                  onLaunchInvestigation={vi.fn()}
                  workspaces={[workspaceFixture]}
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

  it('renders the workspace landing route in place for a valid workspace id', async () => {
    const setActiveWorkspaceId = vi.fn();

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/workspaces/ws-1']}>
        <Routes>
          <Route
            path="/workspaces/:workspaceId"
            element={
              <>
                <WorkspaceHomeRouteView
                  workspaces={[workspaceFixture]}
                  setActiveWorkspaceId={setActiveWorkspaceId}
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
      expect(screen.getByText('Workspace Home ws-1')).toBeInTheDocument();
      expect(screen.getByTestId('location')).toHaveTextContent('/workspaces/ws-1');
    });
  });

  it('keeps the canonical workspace path even when the workspace has no artifact or board yet', async () => {
    render(
      <MemoryRouter future={routerFuture} initialEntries={['/workspaces/ws-1']}>
        <Routes>
          <Route
            path="/workspaces/:workspaceId"
            element={
              <>
                <WorkspaceHomeRouteView
                  workspaces={[workspaceFixture]}
                  setActiveWorkspaceId={vi.fn()}
                />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Workspace Home ws-1')).toBeInTheDocument();
      expect(screen.getByTestId('location')).toHaveTextContent('/workspaces/ws-1');
    });
  });

  it('redirects unknown workspace ids back to the files route', async () => {
    render(
      <MemoryRouter future={routerFuture} initialEntries={['/workspaces/missing']}>
        <Routes>
          <Route
            path="/workspaces/:workspaceId"
            element={
              <>
                <WorkspaceHomeRouteView
                  workspaces={[workspaceFixture]}
                  setActiveWorkspaceId={vi.fn()}
                />
                <LocationProbe />
              </>
            }
          />
          <Route path="/files" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/files');
    });
  });

  it('holds the chat route on a loading fallback until store-backed route state syncs', async () => {
    const SyncedChatRoute = () => {
      const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
      const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>('stale-session');

      return (
        <>
          <ChatRouteView
            activeWorkspaceId={activeWorkspaceId}
            activeChatSessionId={activeChatSessionId}
            setActiveWorkspaceId={setActiveWorkspaceId}
            setActiveChatSessionId={setActiveChatSessionId}
            chatSessions={[sessionFixture]}
            onLaunchInvestigation={vi.fn()}
            workspaces={[workspaceFixture]}
          />
          <LocationProbe />
        </>
      );
    };

    render(
      <MemoryRouter future={routerFuture} initialEntries={['/workspaces/ws-1/chat']}>
        <Routes>
          <Route path="/workspaces/:workspaceId/chat" element={<SyncedChatRoute />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading workspace view')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Chat View')).toBeInTheDocument();
      expect(screen.getByTestId('location')).toHaveTextContent('/workspaces/ws-1/chat');
    });
  });
});
