import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { buildAccentColor } from '@/utils/accent';
import { buildDiscoverPath, getRouteDefinition } from '@/app/routes';
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

const Archives = lazy(() =>
  import('@/components/features/Archives').then((m) => ({ default: m.Archives }))
);
const LiveMonitor = lazy(() =>
  import('@/components/features/LiveMonitor').then((m) => ({ default: m.LiveMonitor }))
);
const Settings = lazy(() =>
  import('@/components/features/Settings').then((m) => ({ default: m.Settings }))
);
const Feed = lazy(() => import('@/components/features/Feed').then((m) => ({ default: m.Feed })));

interface AppShellRoutesProps {
  controller: AppShellController;
}

export function AppShellRoutes({ controller }: AppShellRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={buildDiscoverPath()} replace />} />
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
          <Archives
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
            setActiveTaskId={controller.setActiveTaskId}
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
            artifacts={controller.artifacts}
            workspaces={controller.workspaces}
            workspaceBoards={controller.workspaceBoards}
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
            setActiveTaskId={controller.setActiveTaskId}
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
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
            setActiveChatSessionId={controller.setActiveChatSessionId}
            chatSessions={controller.chatSessions}
            onLaunchInvestigation={controller.launchInvestigation}
          />
        }
      />
      <Route
        path={getRouteDefinition('WORKSPACE_CHAT_SESSION').path}
        element={
          <ChatRouteView
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
            setActiveChatSessionId={controller.setActiveChatSessionId}
            chatSessions={controller.chatSessions}
            onLaunchInvestigation={controller.launchInvestigation}
          />
        }
      />
      <Route
        path={getRouteDefinition('WORKSPACE_BOARD').path}
        element={
          <BoardRouteView
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
            setActiveWorkspaceBoardId={controller.setActiveWorkspaceBoardId}
            workspaceBoards={controller.workspaceBoards}
            onViewReport={controller.handleViewReport}
            onOpenChat={controller.openChat}
            onLaunchInvestigation={controller.launchInvestigation}
          />
        }
      />
      <Route
        path={getRouteDefinition('WORKSPACE_BOARD_DOCUMENT').path}
        element={
          <BoardRouteView
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
            setActiveWorkspaceBoardId={controller.setActiveWorkspaceBoardId}
            workspaceBoards={controller.workspaceBoards}
            onViewReport={controller.handleViewReport}
            onOpenChat={controller.openChat}
            onLaunchInvestigation={controller.launchInvestigation}
          />
        }
      />
      <Route
        path={getRouteDefinition('WORKSPACE_TIMELINE').path}
        element={
          <TimelineRouteView
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
            onViewReport={controller.handleViewReport}
            onOpenChat={controller.openChat}
            onLaunchInvestigation={controller.launchInvestigation}
          />
        }
      />
      <Route
        path={getRouteDefinition('WORKSPACE_NETWORK').path}
        element={
          <NetworkRouteView
            setActiveWorkspaceId={controller.setActiveWorkspaceId}
            onViewReport={controller.handleViewReport}
            onOpenChat={controller.openChat}
            onLaunchInvestigation={controller.launchInvestigation}
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
      <Route path="*" element={<Navigate to={buildDiscoverPath()} replace />} />
    </Routes>
  );
}
