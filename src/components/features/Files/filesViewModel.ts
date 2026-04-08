import { getWorkspaceDisplayTitle } from '@/domain';
import { getWorkspaceItemPrimaryText } from '@/services/workspace/workspaceItemText';
import type { Artifact, Workspace, WorkspaceItem } from '@/types';

export type FilesViewMode = 'GRID' | 'LIST';
export type RecordFilter = 'ALL' | 'ARTIFACT' | 'ITEM';

export type FilesRecord =
  | { kind: 'ARTIFACT'; sortAt: number; artifact: Artifact }
  | { kind: 'ITEM'; sortAt: number; item: WorkspaceItem };

export interface FilesOverviewWorkspace {
  workspace: Workspace;
  artifactCount: number;
  itemCount: number;
  displayTitle: string;
}

export interface FilesOverviewViewModel {
  paginatedWorkspaces: FilesOverviewWorkspace[];
  totalPages: number;
  unassignedArtifactCount: number;
}

export interface FilesRecordsViewModel {
  isUnassigned: boolean;
  records: FilesRecord[];
  paginatedRecords: FilesRecord[];
  resolvedCurrentPage: number;
  totalPages: number;
}

export const buildFilesOverviewViewModel = (input: {
  artifacts: Artifact[];
  currentPage: number;
  itemsPerPage: number;
  workspaceItems: WorkspaceItem[];
  workspaces: Workspace[];
}): FilesOverviewViewModel => {
  const startIndex = (input.currentPage - 1) * input.itemsPerPage;

  return {
    paginatedWorkspaces: input.workspaces
      .slice(startIndex, startIndex + input.itemsPerPage)
      .map((workspace) => ({
        workspace,
        artifactCount: input.artifacts.filter((artifact) => artifact.workspaceId === workspace.id).length,
        itemCount: input.workspaceItems.filter((item) => item.workspaceId === workspace.id).length,
        displayTitle: getWorkspaceDisplayTitle(workspace),
      })),
    totalPages: Math.ceil(input.workspaces.length / input.itemsPerPage),
    unassignedArtifactCount: input.artifacts.filter((artifact) => !artifact.workspaceId).length,
  };
};

export const buildFilesRecordsViewModel = (input: {
  artifacts: Artifact[];
  currentPage: number;
  focusedItem: WorkspaceItem | null;
  itemsPerPage: number;
  recordFilter: RecordFilter;
  workspaceId: string;
  workspaceItems: WorkspaceItem[];
}): FilesRecordsViewModel => {
  const isUnassigned = input.workspaceId === 'unassigned';
  const workspaceArtifacts = input.artifacts.filter((artifact) =>
    isUnassigned ? !artifact.workspaceId : artifact.workspaceId === input.workspaceId
  );
  const scopedItems = isUnassigned
    ? []
    : input.workspaceItems.filter((item) => item.workspaceId === input.workspaceId);
  const records: FilesRecord[] = [
    ...workspaceArtifacts.map((artifact) => ({
      kind: 'ARTIFACT' as const,
      sortAt: artifact.createdAt || 0,
      artifact,
    })),
    ...scopedItems.map((item) => ({
      kind: 'ITEM' as const,
      sortAt: item.updatedAt || item.createdAt || 0,
      item,
    })),
  ]
    .filter((record) => input.recordFilter === 'ALL' || record.kind === input.recordFilter)
    .sort((left, right) => right.sortAt - left.sortAt);

  const focusedItemPage =
    input.focusedItem && !isUnassigned && input.focusedItem.workspaceId === input.workspaceId
      ? Math.floor(
          Math.max(
            0,
            records.findIndex(
              (record) => record.kind === 'ITEM' && record.item.id === input.focusedItem?.id
            )
          ) / input.itemsPerPage
        ) + 1
      : null;
  const resolvedCurrentPage = focusedItemPage || input.currentPage;
  const startIndex = (resolvedCurrentPage - 1) * input.itemsPerPage;

  return {
    isUnassigned,
    records,
    paginatedRecords: records.slice(startIndex, startIndex + input.itemsPerPage),
    resolvedCurrentPage,
    totalPages: Math.ceil(records.length / input.itemsPerPage),
  };
};

export const getArtifactRecordSummary = (artifact: Artifact) =>
  artifact.summary || 'Saved workspace artifact.';

export const getWorkspaceItemRecordSummary = (item: WorkspaceItem) =>
  getWorkspaceItemPrimaryText(item, 'Saved workspace item');
