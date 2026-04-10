import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppView } from '@/types';
import type { AppShellController } from '@/app/useAppShellController';

let controllerStub: AppShellController;

vi.mock('@/app/useAppShellController', () => ({
  useAppShellController: () => controllerStub,
}));

vi.mock('@/app/AppShellRoutes', () => ({
  AppShellRoutes: () => <div>Routes</div>,
}));

vi.mock('@/components/ui/ApiKeyModal', () => ({
  ApiKeyModal: () => <div>API Key Modal</div>,
}));

vi.mock('@/components/ui/HelpModal', () => ({
  HelpModal: () => <div>Help Modal</div>,
}));

vi.mock('@/components/ui/Sidebar', () => ({
  Sidebar: () => <div>Sidebar</div>,
}));

vi.mock('@/components/ui/Toast', () => ({
  ToastContainer: () => <div>Toasts</div>,
}));

import { AppShell } from './AppShell';

const buildControllerStub = (
  overrides: Partial<AppShellController> = {}
): AppShellController =>
  ({
    activeChatSessionId: null,
    activeRunId: null,
    activeWorkspaceBoardId: null,
    activeWorkspaceId: null,
    accentSettings: { hue: 0, lightness: 0, chroma: 0 },
    artifacts: [],
    chatMessagesBySessionId: {},
    chatSessions: [],
    customScopes: [],
    handleBack: vi.fn(),
    handleBatchInvestigate: vi.fn(),
    handleApiKeyPromptBypass: vi.fn(),
    handleApiKeySet: vi.fn(),
    handleClearCompleted: vi.fn(),
    handleCloseSettings: vi.fn(),
    handleLandingOpenWorkspace: vi.fn(),
    handleNavigateRecord: vi.fn(),
    handleNavigateToView: vi.fn(),
    handleSelectRun: vi.fn(),
    handleViewReport: vi.fn(),
    initializeStore: vi.fn(),
    showApiKeyPrompt: false,
    isLoading: false,
    isSidebarCollapsed: false,
    launchInvestigation: vi.fn(),
    liveEvents: [],
    locationPathname: '/welcome',
    openChat: vi.fn(),
    routeCurrentView: AppView.LANDING,
    setActiveChatSessionId: vi.fn(),
    setActiveRunId: vi.fn(),
    setActiveWorkspaceBoardId: vi.fn(),
    setActiveWorkspaceId: vi.fn(),
    setAccentSettings: vi.fn(),
    setShowApiKeyPrompt: vi.fn(),
    setIsSidebarCollapsed: vi.fn(),
    setShowHelpModal: vi.fn(),
    setLiveEvents: vi.fn(),
    setThemeColor: vi.fn(),
    setThemeFontSettings: vi.fn(),
    setThemeMode: vi.fn(),
    setThemeSurfaceSettings: vi.fn(),
    showLandingApiKeyPrompt: false,
    showGlobalSearch: false,
    shouldHideRouteHeader: false,
    showHelpModal: false,
    themeColor: '#000000',
    themeFontSettings: {},
    themeMode: 'dark',
    themeSurfaceSettings: {},
    workspaceBoards: [],
    workspaceRuns: [],
    workspaces: [],
    ...overrides,
  }) as unknown as AppShellController;

describe('AppShell', () => {
  it('keeps the landing page free of the API key modal until onboarding is requested', () => {
    controllerStub = buildControllerStub({
      showApiKeyPrompt: true,
      showLandingApiKeyPrompt: false,
      routeCurrentView: AppView.LANDING,
    });

    render(<AppShell />);

    expect(screen.queryByText('API Key Modal')).not.toBeInTheDocument();
    expect(screen.getByText('Routes')).toBeInTheDocument();
  });

  it('renders the API key modal over the landing page after the welcome CTA requests onboarding', () => {
    controllerStub = buildControllerStub({
      showApiKeyPrompt: true,
      showLandingApiKeyPrompt: true,
      routeCurrentView: AppView.LANDING,
    });

    render(<AppShell />);

    expect(screen.getByText('API Key Modal')).toBeInTheDocument();
  });
});
