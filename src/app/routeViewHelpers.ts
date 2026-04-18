import type { BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { getWorkspaceDisplayTitle } from '@/domain';
import type { Artifact, Workspace, WorkspaceBoard, WorkspaceRun } from '@/types';

export const buildArtifactRouteBreadcrumbs = (
  artifact: Artifact | null,
  workspaces: Workspace[],
  activeRunId: string | null
): BreadcrumbItem[] => {
  if (!artifact) return [];

  const breadcrumbs: BreadcrumbItem[] = [];
  if (artifact.workspaceId) {
    const workspace = workspaces.find((entry) => entry.id === artifact.workspaceId);
    if (workspace) {
      breadcrumbs.push({
        type: 'CASE',
        id: workspace.id,
        label: getWorkspaceDisplayTitle(workspace),
      });
    }
  }

  breadcrumbs.push({
    type: 'REPORT',
    id: artifact.id || activeRunId || 'report',
    label: artifact.topic,
  });

  return breadcrumbs;
};

export const resolveArtifactRouteArtifact = (
  artifacts: Artifact[],
  workspaceId: string,
  artifactId: string
): Artifact | null =>
  artifacts.find((artifact) => artifact.id === artifactId && artifact.workspaceId === workspaceId) ||
  artifacts.find((artifact) => artifact.id === artifactId) ||
  null;

export const resolveRelatedRunForArtifact = (
  workspaceRuns: WorkspaceRun[],
  artifact: Artifact | null
): WorkspaceRun | null => {
  if (!artifact) return null;

  return (
    workspaceRuns.find(
      (workspaceRun) =>
        workspaceRun.artifact?.id === artifact.id ||
        workspaceRun.id === artifact.config?.sourceRunId ||
        workspaceRun.artifact?.topic === artifact.topic
    ) || null
  );
};

export const resolveBoardRouteState = (
  workspaceBoards: WorkspaceBoard[],
  workspaceId: string,
  boardId?: string
): {
  workspaceScopedBoards: WorkspaceBoard[];
  matchedBoard: WorkspaceBoard | null;
  redirectBoardId: string | null;
} => {
  const workspaceScopedBoards = workspaceBoards
    .filter((board) => board.workspaceId === workspaceId)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const firstBoard = workspaceScopedBoards[0] || null;
  const matchedBoard = boardId
    ? workspaceScopedBoards.find((board) => board.id === boardId) || null
    : null;

  if (!boardId && firstBoard) {
    return {
      workspaceScopedBoards,
      matchedBoard: null,
      redirectBoardId: firstBoard.id,
    };
  }

  if (boardId && !matchedBoard && firstBoard) {
    return {
      workspaceScopedBoards,
      matchedBoard: null,
      redirectBoardId: firstBoard.id,
    };
  }

  return {
    workspaceScopedBoards,
    matchedBoard,
    redirectBoardId: null,
  };
};

export const workspaceExistsForRoute = (
  workspaces: Workspace[],
  workspaceId: string
): boolean => workspaces.some((workspace) => workspace.id === workspaceId);
