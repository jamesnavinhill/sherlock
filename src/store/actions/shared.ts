import type { WorkspaceState } from '../workspaceStore';

export type WorkspaceStoreSet = (
  partial:
    | Partial<WorkspaceState>
    | ((state: WorkspaceState) => Partial<WorkspaceState>)
) => void;

export type WorkspaceStoreGet = () => WorkspaceState;

export interface WorkspaceStoreApi {
  get: WorkspaceStoreGet;
  set: WorkspaceStoreSet;
}
