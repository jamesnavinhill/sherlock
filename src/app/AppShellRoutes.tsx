import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { buildAccentColor } from '@/utils/accent';
import { buildLandingPath, getRouteDefinition } from '@/app/routes';
import {
  ArtifactRouteView,
  BoardRouteView,
  ChatRouteView,
  NetworkRouteView,
  RunRouteView,
  TimelineRouteView,
  WorkspaceHomeRouteView,
} from '@/app/routeViews';
import type { AppShellController } from '@/app/useAppShellController';

const Files = lazy(() =>
  import('@/components/features/Files').then((m) => ({ default: m.Files }))
);
const LiveMonitor = lazy(() =>
  import('@/components/features/LiveMonitor').then((m) => ({ default: m.LiveMonitor }))
);
const Settings = lazy(() =>
  import('@/components/features/Settings').then((m) => ({ default: m.Settings }))
);
const Feed = lazy(() => import('@/components/features/Feed').then((m) => ({ default: m.Feed })));
const LandingPage = lazy(() =>
  import('@/components/features/LandingPage').then((m) => ({ default: m.LandingPage }))
);

interface AppShellRoutesProps {
  controller: AppShellController;
}

export function AppShellRoutes({ controller }: AppShellRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={buildLandingPath()} replace />} />
      <Route
        path={getRouteDefinition('LANDING').path}
        element={
          <LandingPage
            themeMode={controller.themeMode}
            onToggleTheme={() =>
              controller.setThemeMode(controller.themeMode === 'dark' ? 'light' : 'dark')
            }
            onGetStarted={controller.handleLandingOpenWorkspace}
          />
        }
      />
      <Route
        path={getRouteDefinition('DISCOVER').path}
        element={
          <Feed
            onInvestigate={(request) =>
              controller.launchInvestigation({ ...request, switchToView: true })
            }
          />
        }
      />
      <Route
        path={getRouteDefinition('FILES').path}
        element={
          <Files
            onSelectReport={controller.handleViewReport}
            onStartNewCase={(request) =>
              controller.launchInvestigation({ ...request, switchToView: true })
            }
            onOpenChat={controller.openChat}
          />
        }
      />
      <Route
        path={getRouteDefinition('MONITOR').path}
        element={
          <LiveMonitor
            events={controller.liveEvents}
            setEvents={controller.setLiveEvents}
            onInvestigate={(request) =>
              controller.launchInvestigation({ ...request, switchToView: true })
            }
          />
        }
      />
      <Route
        path={getRouteDefinition('RUN_DETAIL').path}
        element={
          <RunRouteView
            artifacts={controller.artifacts}
            workspaceRuns={controller.workspaceRuns}
            workspaces={controller.workspaces}
            workspaceBoards={controller.workspaceBoards}
            setActiveRunId={controller.setActiveRunId}
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
            onBack={controller.handleBack}
            onLaunchInvestigation={controller.launchInvestigation}
            onNavigateRecord={controller.handleNavigateRecord}
            onViewReport={controller.handleViewReport}
            onOpenChat={controller.openChat}
          />
        }
      />
      <Route
        path={getRouteDefinition('WORKSPACE_HOME').path}
        element={
          <WorkspaceHomeRouteView
            workspaces={controller.workspaces}
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
          />
        }
      />
      <Route
        path={getRouteDefinition('WORKSPACE_ARTIFACT').path}
        element={
          <ArtifactRouteView
            artifacts={controller.artifacts}
            workspaceRuns={controller.workspaceRuns}
            workspaces={controller.workspaces}
            workspaceBoards={controller.workspaceBoards}
            setActiveRunId={controller.setActiveRunId}
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
            onBack={controller.handleBack}
            onLaunchInvestigation={controller.launchInvestigation}
            onNavigateRecord={controller.handleNavigateRecord}
            onViewReport={controller.handleViewReport}
            onOpenChat={controller.openChat}
          />
        }
      />
      <Route
        path={getRouteDefinition('WORKSPACE_CHAT').path}
        element={
          <ChatRouteView
            activeWorkspaceId={controller.activeWorkspaceId}
            activeChatSessionId={controller.activeChatSessionId}
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
            setActiveChatSessionId={controller.setActiveChatSessionId}
            chatSessions={controller.chatSessions}
            onLaunchInvestigation={controller.launchInvestigation}
            workspaces={controller.workspaces}
          />
        }
      />
      <Route
        path={getRouteDefinition('WORKSPACE_CHAT_SESSION').path}
        element={
          <ChatRouteView
            activeWorkspaceId={controller.activeWorkspaceId}
            activeChatSessionId={controller.activeChatSessionId}
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
            setActiveChatSessionId={controller.setActiveChatSessionId}
            chatSessions={controller.chatSessions}
            onLaunchInvestigation={controller.launchInvestigation}
            workspaces={controller.workspaces}
          />
        }
      />
      <Route
        path={getRouteDefinition('WORKSPACE_BOARD').path}
        element={
          <BoardRouteView
            activeWorkspaceId={controller.activeWorkspaceId}
            activeWorkspaceBoardId={controller.activeWorkspaceBoardId}
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
            setActiveWorkspaceBoardId={controller.setActiveWorkspaceBoardId}
            workspaceBoards={controller.workspaceBoards}
            onViewReport={controller.handleViewReport}
            onOpenChat={controller.openChat}
            onLaunchInvestigation={controller.launchInvestigation}
            workspaces={controller.workspaces}
          />
        }
      />
      <Route
        path={getRouteDefinition('WORKSPACE_BOARD_DOCUMENT').path}
        element={
          <BoardRouteView
            activeWorkspaceId={controller.activeWorkspaceId}
            activeWorkspaceBoardId={controller.activeWorkspaceBoardId}
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
            setActiveWorkspaceBoardId={controller.setActiveWorkspaceBoardId}
            workspaceBoards={controller.workspaceBoards}
            onViewReport={controller.handleViewReport}
            onOpenChat={controller.openChat}
            onLaunchInvestigation={controller.launchInvestigation}
            workspaces={controller.workspaces}
          />
        }
      />
      <Route
        path={getRouteDefinition('WORKSPACE_TIMELINE').path}
        element={
          <TimelineRouteView
            activeWorkspaceId={controller.activeWorkspaceId}
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
            onViewReport={controller.handleViewReport}
            onOpenChat={controller.openChat}
            onLaunchInvestigation={controller.launchInvestigation}
            workspaces={controller.workspaces}
          />
        }
      />
      <Route
        path={getRouteDefinition('WORKSPACE_NETWORK').path}
        element={
          <NetworkRouteView
            activeWorkspaceId={controller.activeWorkspaceId}
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
            onViewReport={controller.handleViewReport}
            onOpenChat={controller.openChat}
            onLaunchInvestigation={controller.launchInvestigation}
            workspaces={controller.workspaces}
          />
        }
      />
      <Route
        path={getRouteDefinition('SETTINGS').path}
        element={
          <Settings
            themeColor={controller.themeColor}
            themeMode={controller.themeMode}
            accentSettings={controller.accentSettings}
            onAccentChange={(settings) => {
              controller.setAccentSettings(settings);
              controller.setThemeColor(buildAccentColor(settings));
            }}
            themeSurfaceSettings={controller.themeSurfaceSettings}
            onThemeSurfaceSettingsChange={controller.setThemeSurfaceSettings}
            themeFontSettings={controller.themeFontSettings}
            onThemeFontSettingsChange={controller.setThemeFontSettings}
            onStartCase={(request) =>
              controller.launchInvestigation({
                ...request,
                switchToView: true,
                launchSource: 'SETTINGS_TEMPLATE',
              })
            }
            onClose={controller.handleCloseSettings}
          />
        }
      />
      <Route path="*" element={<Navigate to={buildLandingPath()} replace />} />
    </Routes>
  );
}
