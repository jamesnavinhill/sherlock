import type { WorkspaceState } from '../caseStore';

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
