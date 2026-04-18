import { useCallback, type MutableRefObject } from 'react';
import type { NavigateFunction } from 'react-router-dom';

import { AppView, type Artifact, type Workspace, type WorkspaceBoard, type WorkspaceRun } from '@/types';
import {
  buildPathForAppView,
  findWorkspaceLandingArtifact,
} from '@/app/navigation';
import {
  buildDiscoverPath,
  buildFilesPath,
  buildRunPath,
  buildSettingsPath,
  buildWorkspaceArtifactPath,
  buildWorkspaceBoardDocumentPath,
  buildWorkspaceBoardPath,
} from '@/app/routes';
import { resolveNavigationRecord } from '@/app/appShellNavigationHelpers';

interface UseAppShellNavigationInput {
  navigate: NavigateFunction;
  routeCurrentView: AppView;
  location: { pathname: string; search: string };
  locationPathRef: MutableRefObject<string>;
  lastNonSettingsPathRef: MutableRefObject<string>;
  activeChatSessionId: string | null;
  activeRunId: string | null;
  activeWorkspaceBoardId: string | null;
  activeWorkspaceId: string | null;
  artifacts: Artifact[];
  workspaceBoards: WorkspaceBoard[];
  workspaceRuns: WorkspaceRun[];
  workspaces: Workspace[];
  clearCompletedRuns: () => Promise<void>;
  setActiveRunId: (id: string | null) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppShellNavigation = ({
  navigate,
  routeCurrentView,
  location,
  locationPathRef,
  lastNonSettingsPathRef,
  activeChatSessionId,
  activeRunId,
  activeWorkspaceBoardId,
  activeWorkspaceId,
  artifacts,
  workspaceBoards,
  workspaceRuns,
  workspaces,
  clearCompletedRuns,
  setActiveRunId,
  setActiveWorkspaceId,
  setIsSidebarCollapsed,
}: UseAppShellNavigationInput) => {
  const handleNavigateToView = useCallback(
    (view: AppView) => {
      if (view === AppView.SETTINGS) {
        if (routeCurrentView === AppView.SETTINGS) {
          navigate(lastNonSettingsPathRef.current);
        } else {
          navigate(buildSettingsPath());
        }
      } else {
        navigate(
          buildPathForAppView(view, {
            activeWorkspaceId,
            activeWorkspaceBoardId,
            activeChatSessionId,
            activeRunId,
            artifacts,
            pathname: location.pathname,
            search: location.search,
          })
        );
      }

      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    },
    [
      activeChatSessionId,
      activeRunId,
      activeWorkspaceBoardId,
      activeWorkspaceId,
      artifacts,
      location.pathname,
      location.search,
      navigate,
      routeCurrentView,
      setIsSidebarCollapsed,
      lastNonSettingsPathRef,
    ]
  );

  const handleBack = useCallback(() => {
    setActiveRunId(null);
    navigate(buildDiscoverPath());
  }, [navigate, setActiveRunId]);

  const handleCloseSettings = useCallback(() => {
    navigate(lastNonSettingsPathRef.current);
  }, [navigate, lastNonSettingsPathRef]);

  const handleViewArtifact = useCallback(
    (artifact: Artifact) => {
      setActiveWorkspaceId(artifact.workspaceId || null);

      const existingTask = workspaceRuns.find(
        (workspaceRun) =>
          workspaceRun.artifact?.id === artifact.id ||
          workspaceRun.id === artifact.config?.sourceRunId ||
          workspaceRun.artifact?.topic === artifact.topic
      );

      setActiveRunId(existingTask?.id || null);

      if (artifact.workspaceId && artifact.id) {
        navigate(buildWorkspaceArtifactPath(artifact.workspaceId, artifact.id));
      } else if (existingTask) {
        navigate(buildRunPath(existingTask.id));
      } else {
        navigate(buildFilesPath());
      }
    },
    [navigate, setActiveRunId, setActiveWorkspaceId, workspaceRuns]
  );

  const handleSelectRun = useCallback(
    (runId: string) => {
      setActiveRunId(runId);
      navigate(buildRunPath(runId));
    },
    [navigate, setActiveRunId]
  );

  const handleNavigateRecord = useCallback(
    (id: string) => {
      const matchedRecord = resolveNavigationRecord({
        artifacts,
        id,
        workspaceRuns,
        workspaces,
      });
      if (!matchedRecord) return;

      if (matchedRecord.kind === 'WORKSPACE') {
        const landingArtifact = findWorkspaceLandingArtifact(matchedRecord.workspace.id, artifacts);
        if (landingArtifact?.id) {
          navigate(buildWorkspaceArtifactPath(matchedRecord.workspace.id, landingArtifact.id));
        } else {
          const boardId = workspaceBoards.find(
            (board) => board.workspaceId === matchedRecord.workspace.id
          )?.id;
          navigate(
            boardId
              ? buildWorkspaceBoardDocumentPath(matchedRecord.workspace.id, boardId)
              : buildWorkspaceBoardPath(matchedRecord.workspace.id)
          );
        }
        return;
      }

      if (matchedRecord.kind === 'TASK') {
        handleSelectRun(matchedRecord.task.id);
        return;
      }

      handleViewArtifact(matchedRecord.artifact);
    },
    [
      artifacts,
      handleSelectRun,
      handleViewArtifact,
      navigate,
      workspaceBoards,
      workspaceRuns,
      workspaces,
    ]
  );

  const handleClearCompleted = useCallback(async () => {
    const activeBeforeClear = workspaceRuns.find((workspaceRun) => workspaceRun.id === activeRunId);
    await clearCompletedRuns();

    if (
      activeBeforeClear &&
      (activeBeforeClear.status === 'COMPLETED' || activeBeforeClear.status === 'FAILED')
    ) {
      setActiveRunId(null);
      if (locationPathRef.current === buildRunPath(activeBeforeClear.id)) {
        navigate(buildFilesPath(), { replace: true });
      }
    }
  }, [activeRunId, clearCompletedRuns, locationPathRef, navigate, setActiveRunId, workspaceRuns]);

  return {
    handleBack,
    handleClearCompleted,
    handleCloseSettings,
    handleNavigateRecord,
    handleNavigateToView,
    handleSelectRun,
    handleViewArtifact,
  };
};
