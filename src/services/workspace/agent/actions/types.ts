import type {
  Artifact,
  ArtifactSection,
  BoardAgentAction,
  BoardAgentSession,
  Headline,
  InvestigationLaunchRequest,
  Workspace,
  WorkspaceBoard,
  WorkspaceItem,
} from '@/types';
import type { Editor } from 'tldraw';
import type { BoardAgentStructuredAction } from '@/services/providers/types';
import type { BoardThemeMode } from '../../boardShapes';

export type BoardAgentTodoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface BoardAgentTodoItem {
  id: string;
  text: string;
  status: BoardAgentTodoStatus;
}

export interface BoardAgentFollowUpPlan {
  prompt: string;
  sourceActionType: BoardAgentAction['type'];
}

export interface BoardAgentExecutionContext {
  session: BoardAgentSession;
  workspace: Workspace;
  board: WorkspaceBoard;
  editor: Editor;
  themeMode: BoardThemeMode;
  artifacts: Artifact[];
  headlines: Headline[];
  workspaceItems: WorkspaceItem[];
  persistBoardDocument?: () => Promise<void>;
  createWorkspaceItem: (item: WorkspaceItem) => Promise<void>;
  saveArtifact: (
    artifact: Artifact,
    parentContext?: { topic: string; summary: string }
  ) => Promise<Artifact>;
  appendSectionToReport: (reportId: string, section: ArtifactSection) => Promise<void>;
  launchInvestigation?: (request: InvestigationLaunchRequest) => Promise<void> | void;
}

export interface BoardAgentActionExecutionResult {
  type: BoardAgentAction['type'];
  status: BoardAgentAction['status'];
  normalizedInput?: Record<string, unknown>;
  result?: Record<string, unknown>;
  affectedCanonicalIds?: string[];
  affectedBoardShapeIds?: string[];
  error?: string;
  followUp?: BoardAgentFollowUpPlan;
  todoItems?: BoardAgentTodoItem[];
}

export interface ExecuteBoardAgentStructuredActionInput {
  action: BoardAgentStructuredAction;
  context: BoardAgentExecutionContext;
}
