import type { Artifact, Workspace, WorkspaceRun } from '@/types';

export type NavigationRecordMatch =
  | { kind: 'WORKSPACE'; workspace: Workspace }
  | { kind: 'TASK'; task: WorkspaceRun }
  | { kind: 'ARTIFACT'; artifact: Artifact };

interface ResolveNavigationRecordInput {
  artifacts: Artifact[];
  id: string;
  workspaceRuns: WorkspaceRun[];
  workspaces: Workspace[];
}

export const resolveNavigationRecord = ({
  artifacts,
  id,
  workspaceRuns,
  workspaces,
}: ResolveNavigationRecordInput): NavigationRecordMatch | null => {
  const workspace = workspaces.find((entry) => entry.id === id);
  if (workspace) {
    return { kind: 'WORKSPACE', workspace };
  }

  const task = workspaceRuns.find((entry) => entry.id === id || entry.report?.id === id);
  if (task) {
    return { kind: 'TASK', task };
  }

  const artifact = artifacts.find((entry) => entry.id === id);
  if (artifact) {
    return { kind: 'ARTIFACT', artifact };
  }

  return null;
};
