import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { useWorkspaceStore } from '../../store/workspaceStore';
import { TimelineView } from './TimelineView';

vi.mock('../ui/BackgroundMatrixRain', () => ({
  BackgroundMatrixRain: () => null,
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}{location.search}</div>;
};

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

describe('TimelineView route state', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      activeWorkspaceId: 'case-1',
      artifacts: [],
      chatActionsBySessionId: {},
      chatSessions: [],
      headlines: [],
      isLoading: false,
      workspaceRuns: [],
      workspaces: [
        {
          id: 'case-1',
          title: 'Workspace Alpha',
          status: 'ACTIVE',
          dateOpened: '2026-04-05',
        },
        {
          id: 'case-2',
          title: 'Workspace Beta',
          status: 'ACTIVE',
          dateOpened: '2026-04-05',
        },
      ],
      addToast: vi.fn(),
      ensureWorkspaceBoard: vi.fn(async () => ({
        id: 'board-1',
        workspaceId: 'case-1',
        name: 'Primary Board',
        sortOrder: 0,
        presentationMode: false,
        createdAt: 1,
        updatedAt: 1,
      })),
      queueBoardPlacement: vi.fn(),
      saveArtifact: vi.fn(async (artifact) => artifact),
      setActiveWorkspaceId: vi.fn((id: string | null) => {
        useWorkspaceStore.setState({ activeWorkspaceId: id });
      }),
    });
  });

  it('hydrates the search input from URL state and writes updates back to the URL', async () => {
    render(
      <MemoryRouter
        future={routerFuture}
        initialEntries={['/workspaces/case-1/timeline?search=alpha+signal']}
      >
        <Routes>
          <Route
            path="/workspaces/:workspaceId/timeline"
            element={
              <>
                <TimelineView onOpenReport={vi.fn()} onOpenChat={vi.fn()} />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    const searchInput = screen.getByRole('textbox');
    expect(searchInput).toHaveValue('alpha signal');

    fireEvent.change(searchInput, { target: { value: 'beta timeline' } });

    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toMatch(
        /\/workspaces\/case-1\/timeline\?search=beta(?:\+|%20)timeline/
      );
    });
  });

  it('navigates to the selected workspace timeline route from the workspace selector', async () => {
    render(
      <MemoryRouter future={routerFuture} initialEntries={['/workspaces/case-1/timeline']}>
        <Routes>
          <Route
            path="/workspaces/:workspaceId/timeline"
            element={
              <>
                <TimelineView onOpenReport={vi.fn()} onOpenChat={vi.fn()} />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /timeline workspace/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Workspace Beta' }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/workspaces/case-2/timeline');
    });
  });
});
