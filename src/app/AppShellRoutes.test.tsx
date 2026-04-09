import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import type { AppShellController } from './useAppShellController';

vi.mock('@/components/features/Files', () => ({
  Files: () => <div>Files View</div>,
}));

import { AppShellRoutes } from './AppShellRoutes';

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const buildControllerStub = () =>
  ({
    accentSettings: { hue: 0, lightness: 0, chroma: 0 },
    artifacts: [],
    chatSessions: [],
    handleBack: vi.fn(),
    handleCloseSettings: vi.fn(),
    handleNavigateRecord: vi.fn(),
    handleViewReport: vi.fn(),
    launchInvestigation: vi.fn(),
    liveEvents: [],
    openChat: vi.fn(),
    setAccentSettings: vi.fn(),
    setActiveChatSessionId: vi.fn(),
    setActiveTaskId: vi.fn(),
    setActiveWorkspaceBoardId: vi.fn(),
    setActiveWorkspaceId: vi.fn(),
    setLiveEvents: vi.fn(),
    setThemeColor: vi.fn(),
    setThemeFontSettings: vi.fn(),
    setThemeSurfaceSettings: vi.fn(),
    themeColor: '#000000',
    themeFontSettings: {},
    themeMode: 'dark',
    themeSurfaceSettings: {},
    workspaceBoards: [],
    workspaceRuns: [],
    workspaces: [],
  }) as unknown as AppShellController;

describe('AppShellRoutes', () => {
  it('redirects the root path to files', async () => {
    render(
      <MemoryRouter future={routerFuture} initialEntries={['/']}>
        <Suspense fallback={<div>Loading...</div>}>
          <AppShellRoutes controller={buildControllerStub()} />
        </Suspense>
        <LocationProbe />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/files');
      expect(screen.getByText('Files View')).toBeInTheDocument();
    });
  });

  it('redirects unknown paths to files', async () => {
    render(
      <MemoryRouter future={routerFuture} initialEntries={['/missing']}>
        <Suspense fallback={<div>Loading...</div>}>
          <AppShellRoutes controller={buildControllerStub()} />
        </Suspense>
        <LocationProbe />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/files');
      expect(screen.getByText('Files View')).toBeInTheDocument();
    });
  });
});
