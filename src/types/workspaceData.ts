import type {
  Artifact,
  ManualConnection,
  ManualNode,
  Signal,
  Workspace,
  WorkspaceRun,
  WorkspaceTemplate,
} from './core';
import type { BoardAgentAction, BoardAgentSession } from './boardAgent';
import type { AgentAction, ChatMessage, ChatSession } from './chat';
import type { WorkspaceBoard, WorkspaceBoardDocument, WorkspaceItem } from './workspaceSurface';

export interface WorkspaceDataChatSnapshot {
  sessions: ChatSession[];
  messages: ChatMessage[];
  actions: AgentAction[];
}

export interface WorkspaceDataSignalSnapshot {
  signals: Signal[];
  headlines?: Signal[];
}

export interface WorkspaceDataBoardAgentSnapshot {
  sessions: BoardAgentSession[];
  actions: BoardAgentAction[];
}

export interface WorkspaceDataGraphSnapshot {
  manualNodes: ManualNode[];
  manualLinks: ManualConnection[];
}

export interface WorkspaceDataWorkspaceSurfaceSnapshot {
  items: WorkspaceItem[];
  boards: WorkspaceBoard[];
  boardDocuments: WorkspaceBoardDocument[];
}

export interface WorkspaceDataBackupMetadata {
  kind: 'SHERLOCK_WORKSPACE_DATA';
  formatVersion: 1;
  exportedAt: string;
}

export interface WorkspaceDataBackup {
  workspaces: Workspace[];
  artifacts: Artifact[];
  runs: WorkspaceRun[];
  chat: WorkspaceDataChatSnapshot;
  boardAgent: WorkspaceDataBoardAgentSnapshot;
  signals: WorkspaceDataSignalSnapshot;
  graph: WorkspaceDataGraphSnapshot;
  workspaceSurface: WorkspaceDataWorkspaceSurfaceSnapshot;
  templates: WorkspaceTemplate[];
  metadata: WorkspaceDataBackupMetadata;
}
