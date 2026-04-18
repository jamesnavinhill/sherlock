import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { AppWorkbenchHost } from '@/app/workbench/AppWorkbenchHost';
import { AppWorkbenchHostProvider } from '@/app/workbench/AppWorkbenchHostProvider';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { TimelineView } from './TimelineView';

vi.mock('../ui/BackgroundMatrixRain', () => ({
  BackgroundMatrixRain: () => null,
}));

vi.mock('@/components/ui/GlobalSearch', () => ({
  GlobalSearch: () => <div data-testid="global-search" />,
}));

const LocationProbe = () => {
  const location = useLocation();
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  );
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

  it('does not render a search field inside the timeline filters menu', async () => {
    render(
      <AppWorkbenchHostProvider>
        <MemoryRouter
          future={routerFuture}
          initialEntries={['/workspaces/case-1/timeline?search=alpha+signal']}
        >
          <Routes>
            <Route
              path="/workspaces/:workspaceId/timeline"
              element={
                <>
                  <TimelineView onOpenArtifact={vi.fn()} onOpenChat={vi.fn()} />
                  <LocationProbe />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </AppWorkbenchHostProvider>
    );

    fireEvent.click(screen.getByLabelText('Timeline filters'));

    expect(screen.getByTestId('timeline-dot-grid-background')).toBeInTheDocument();
    expect(screen.queryByLabelText('Timeline search')).not.toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
  });

  it('navigates to the selected workspace timeline route from the workspace selector', async () => {
    render(
      <AppWorkbenchHostProvider>
        <MemoryRouter future={routerFuture} initialEntries={['/workspaces/case-1/timeline']}>
          <Routes>
            <Route
              path="/workspaces/:workspaceId/timeline"
              element={
                <>
                  <TimelineView onOpenArtifact={vi.fn()} onOpenChat={vi.fn()} />
                  <LocationProbe />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </AppWorkbenchHostProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /timeline workspace/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Workspace Beta' }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/workspaces/case-2/timeline');
    });
  });

  it('does not register a timeline-specific workbench panel', async () => {
    render(
      <AppWorkbenchHostProvider>
        <MemoryRouter future={routerFuture} initialEntries={['/workspaces/case-1/timeline']}>
          <Routes>
            <Route
              path="/workspaces/:workspaceId/timeline"
              element={<TimelineView onOpenArtifact={vi.fn()} onOpenChat={vi.fn()} />}
            />
          </Routes>
        </MemoryRouter>
        <AppWorkbenchHost />
      </AppWorkbenchHostProvider>
    );

    expect(screen.queryByText('Timeline Tools')).not.toBeInTheDocument();
  });
});
