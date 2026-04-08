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
  activeTaskId: string | null;
  activeWorkspaceBoardId: string | null;
  activeWorkspaceId: string | null;
  artifacts: Artifact[];
  workspaceBoards: WorkspaceBoard[];
  workspaceRuns: WorkspaceRun[];
  workspaces: Workspace[];
  clearCompletedRuns: () => Promise<void>;
  setActiveTaskId: (id: string | null) => void;
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
  activeTaskId,
  activeWorkspaceBoardId,
  activeWorkspaceId,
  artifacts,
  workspaceBoards,
  workspaceRuns,
  workspaces,
  clearCompletedRuns,
  setActiveTaskId,
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
            activeTaskId,
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
      activeTaskId,
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
    setActiveTaskId(null);
    navigate(buildDiscoverPath());
  }, [navigate, setActiveTaskId]);

  const handleCloseSettings = useCallback(() => {
    navigate(lastNonSettingsPathRef.current);
  }, [navigate, lastNonSettingsPathRef]);

  const handleViewReport = useCallback(
    (artifact: Artifact) => {
      setActiveWorkspaceId(artifact.workspaceId || null);

      const existingTask = workspaceRuns.find(
        (workspaceRun) =>
          workspaceRun.report?.id === artifact.id ||
          workspaceRun.id === artifact.config?.sourceRunId ||
          workspaceRun.report?.topic === artifact.topic
      );

      setActiveTaskId(existingTask?.id || null);

      if (artifact.workspaceId && artifact.id) {
        navigate(buildWorkspaceArtifactPath(artifact.workspaceId, artifact.id));
      } else if (existingTask) {
        navigate(buildRunPath(existingTask.id));
      } else {
        navigate(buildFilesPath());
      }
    },
    [navigate, setActiveTaskId, setActiveWorkspaceId, workspaceRuns]
  );

  const handleSelectTask = useCallback(
    (taskId: string) => {
      setActiveTaskId(taskId);
      navigate(buildRunPath(taskId));
    },
    [navigate, setActiveTaskId]
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
        handleSelectTask(matchedRecord.task.id);
        return;
      }

      handleViewReport(matchedRecord.artifact);
    },
    [
      artifacts,
      handleSelectTask,
      handleViewReport,
      navigate,
      workspaceBoards,
      workspaceRuns,
      workspaces,
    ]
  );

  const handleClearCompleted = useCallback(async () => {
    const activeBeforeClear = workspaceRuns.find((workspaceRun) => workspaceRun.id === activeTaskId);
    await clearCompletedRuns();

    if (
      activeBeforeClear &&
      (activeBeforeClear.status === 'COMPLETED' || activeBeforeClear.status === 'FAILED')
    ) {
      setActiveTaskId(null);
      if (locationPathRef.current === buildRunPath(activeBeforeClear.id)) {
        navigate(buildFilesPath(), { replace: true });
      }
    }
  }, [activeTaskId, clearCompletedRuns, locationPathRef, navigate, setActiveTaskId, workspaceRuns]);

  return {
    handleBack,
    handleClearCompleted,
    handleCloseSettings,
    handleNavigateRecord,
    handleNavigateToView,
    handleSelectTask,
    handleViewReport,
  };
};
