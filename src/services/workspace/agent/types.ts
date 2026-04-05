import type {
  Artifact,
  BoardAgentAction,
  BoardAgentContextSnapshot,
  BoardAgentSession,
  Headline,
  Workspace,
  WorkspaceBoard,
  WorkspaceBoardDocument,
  WorkspaceBoardItemReference,
  WorkspaceItem,
} from '@/types';

export interface BoardAgentViewportBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BoardAgentBoardShapeSummary {
  id: string;
  type: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  text?: string;
  linkedRef?: WorkspaceBoardItemReference;
}

export interface BuildBoardAgentContextInput {
  workspace: Workspace;
  board: WorkspaceBoard;
  boardDocument?: WorkspaceBoardDocument | null;
  userRequest: string;
  selectedShapeIds?: string[];
  viewportBounds?: BoardAgentViewportBounds | null;
  artifacts: Artifact[];
  headlines: Headline[];
  workspaceItems: WorkspaceItem[];
  recentSessions?: BoardAgentSession[];
  recentActions?: BoardAgentAction[];
  maxVisibleShapes?: number;
  maxPeripheralShapes?: number;
}

export interface BuildBoardAgentContextResult {
  snapshot: BoardAgentContextSnapshot;
  shapes: BoardAgentBoardShapeSummary[];
  selectedShapes: BoardAgentBoardShapeSummary[];
  visibleShapes: BoardAgentBoardShapeSummary[];
  peripheralShapes: BoardAgentBoardShapeSummary[];
}
