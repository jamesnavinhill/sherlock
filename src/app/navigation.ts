import { AppView, type Artifact } from '@/types';

import {
  buildDiscoverPath,
  buildFilesPath,
  buildMonitorPath,
  buildRunPath,
  buildSettingsPath,
  buildWorkspaceArtifactPath,
  buildWorkspaceBoardDocumentPath,
  buildWorkspaceBoardPath,
  buildWorkspaceChatPath,
  buildWorkspaceChatSessionPath,
  buildWorkspaceHomePath,
  buildWorkspaceNetworkPath,
  buildWorkspaceTimelinePath,
} from './routes';

interface AppViewNavigationContext {
  activeWorkspaceId?: string | null;
  activeWorkspaceBoardId?: string | null;
  activeChatSessionId?: string | null;
  activeTaskId?: string | null;
  artifacts?: Artifact[];
  pathname?: string;
  search?: string;
}

const WORKSPACE_ARTIFACT_ROUTE = /^\/workspaces\/[^/]+\/artifacts\/[^/]+$/;
const WORKSPACE_CHAT_SESSION_ROUTE = /^\/workspaces\/[^/]+\/chat\/[^/]+$/;
const WORKSPACE_CHAT_ROUTE = /^\/workspaces\/[^/]+\/chat$/;
const WORKSPACE_BOARD_DOCUMENT_ROUTE = /^\/workspaces\/[^/]+\/board\/[^/]+$/;
const WORKSPACE_BOARD_ROUTE = /^\/workspaces\/[^/]+\/board$/;
const WORKSPACE_TIMELINE_ROUTE = /^\/workspaces\/[^/]+\/timeline$/;
const WORKSPACE_NETWORK_ROUTE = /^\/workspaces\/[^/]+\/network$/;
const WORKSPACE_HOME_ROUTE = /^\/workspaces\/[^/]+$/;
const RUN_ROUTE = /^\/runs\/[^/]+$/;

export const getAppViewForPath = (pathname: string): AppView => {
  if (pathname === '/settings') return AppView.SETTINGS;
  if (pathname === '/discover' || pathname === '/') return AppView.DASHBOARD;
  if (pathname === '/monitor') return AppView.LIVE_MONITOR;
  if (pathname === '/files') return AppView.FILES;
  if (RUN_ROUTE.test(pathname) || WORKSPACE_ARTIFACT_ROUTE.test(pathname)) {
    return AppView.INVESTIGATION;
  }
  if (WORKSPACE_CHAT_ROUTE.test(pathname) || WORKSPACE_CHAT_SESSION_ROUTE.test(pathname)) {
    return AppView.CHAT;
  }
  if (WORKSPACE_HOME_ROUTE.test(pathname)) return AppView.WORKSPACE;
  if (WORKSPACE_BOARD_ROUTE.test(pathname) || WORKSPACE_BOARD_DOCUMENT_ROUTE.test(pathname)) {
    return AppView.WORKSPACE;
  }
  if (WORKSPACE_TIMELINE_ROUTE.test(pathname)) return AppView.TIMELINE;
  if (WORKSPACE_NETWORK_ROUTE.test(pathname)) return AppView.NETWORK;
  return AppView.DASHBOARD;
};

export const findWorkspaceLandingArtifact = (
  workspaceId: string,
  artifacts: Artifact[] | undefined
): Artifact | null => {
  const workspaceArtifacts = (artifacts || []).filter((artifact) => artifact.workspaceId === workspaceId);
  if (workspaceArtifacts.length === 0) return null;

  return (
    workspaceArtifacts.find((artifact) => artifact.id && !artifact.config?.parentArtifactId) ||
    workspaceArtifacts.find((artifact) => artifact.id) ||
    null
  );
};

export const buildPathForAppView = (
  view: AppView,
  {
    activeWorkspaceId,
    activeWorkspaceBoardId,
    activeChatSessionId,
    activeTaskId,
    artifacts,
    pathname,
    search,
  }: AppViewNavigationContext
): string => {
  if (pathname && getAppViewForPath(pathname) === view && pathname !== '/') {
    return `${pathname}${search || ''}`;
  }

  switch (view) {
    case AppView.DASHBOARD:
      return buildDiscoverPath();
    case AppView.LIVE_MONITOR:
      return buildMonitorPath();
    case AppView.FILES:
      return buildFilesPath();
    case AppView.SETTINGS:
      return buildSettingsPath();
    case AppView.INVESTIGATION:
      if (activeTaskId) return buildRunPath(activeTaskId);
      if (activeWorkspaceId) {
        const landingArtifact = findWorkspaceLandingArtifact(activeWorkspaceId, artifacts);
        if (landingArtifact?.id) {
          return buildWorkspaceArtifactPath(activeWorkspaceId, landingArtifact.id);
        }
        return buildWorkspaceHomePath(activeWorkspaceId);
      }
      return buildDiscoverPath();
    case AppView.WORKSPACE:
      if (activeWorkspaceId && activeWorkspaceBoardId) {
        return buildWorkspaceBoardDocumentPath(activeWorkspaceId, activeWorkspaceBoardId);
      }
      if (activeWorkspaceId) return buildWorkspaceBoardPath(activeWorkspaceId);
      return buildFilesPath();
    case AppView.CHAT:
      if (activeWorkspaceId && activeChatSessionId) {
        return buildWorkspaceChatSessionPath(activeWorkspaceId, activeChatSessionId);
      }
      if (activeWorkspaceId) return buildWorkspaceChatPath(activeWorkspaceId);
      return buildFilesPath();
    case AppView.TIMELINE:
      return activeWorkspaceId ? buildWorkspaceTimelinePath(activeWorkspaceId) : buildFilesPath();
    case AppView.NETWORK:
      return activeWorkspaceId ? buildWorkspaceNetworkPath(activeWorkspaceId) : buildFilesPath();
  }
};
