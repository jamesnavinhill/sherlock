import type { AIProvider } from '../config/aiModels';

export type BoardAgentSessionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type BoardAgentRequestState =
  | 'QUEUED'
  | 'ASSEMBLING_CONTEXT'
  | 'STREAMING'
  | 'AWAITING_APPROVAL'
  | 'EXECUTING_ACTIONS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type BoardAgentActionType =
  | 'MESSAGE'
  | 'THINK'
  | 'UPDATE_TODO'
  | 'SET_VIEWPORT'
  | 'PLACE_LINKED_CARD'
  | 'MOVE_SHAPES'
  | 'ALIGN_SHAPES'
  | 'DISTRIBUTE_SHAPES'
  | 'GROUP_SELECTION'
  | 'CREATE_CONNECTOR'
  | 'CREATE_BOARD_NOTE'
  | 'CREATE_WORKSPACE_NOTE'
  | 'PROMOTE_EXCERPT'
  | 'ATTACH_ARTIFACT_SUMMARY'
  | 'CREATE_ARTIFACT_DRAFT'
  | 'APPEND_NOTE_TO_ARTIFACT'
  | 'CREATE_FOLLOW_UP_RUN'
  | 'SCHEDULE_FOLLOW_UP'
  | 'REVIEW_REGION';

export type BoardAgentActionStatus =
  | 'PENDING'
  | 'AWAITING_APPROVAL'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'SKIPPED'
  | 'REJECTED';

export type BoardAgentContextPartKind =
  | 'USER_REQUEST'
  | 'VIEWPORT_BOUNDS'
  | 'SELECTION_SUMMARY'
  | 'VISIBLE_SHAPE_SUMMARY'
  | 'PERIPHERAL_CLUSTER_SUMMARY'
  | 'LINKED_RECORD_SUMMARY'
  | 'RECENT_AGENT_HISTORY'
  | 'RECENT_USER_BOARD_ACTIONS'
  | 'TODO'
  | 'SYSTEM_METADATA';

export interface BoardAgentContextPart {
  id: string;
  kind: BoardAgentContextPartKind;
  title: string;
  content: string;
  priority: number;
  metadata?: Record<string, unknown>;
}

export interface BoardAgentContextSnapshot {
  id: string;
  workspaceId: string;
  boardId: string;
  sessionId?: string;
  request: string;
  selectedShapeIds: string[];
  visibleShapeIds: string[];
  parts: BoardAgentContextPart[];
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface BoardAgentRequest {
  id: string;
  workspaceId: string;
  boardId: string;
  sessionId?: string;
  prompt: string;
  state: BoardAgentRequestState;
  selectedShapeIds?: string[];
  viewportBounds?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface BoardAgentSession {
  id: string;
  workspaceId: string;
  boardId: string;
  title: string;
  status: BoardAgentSessionStatus;
  request: string;
  requestState: BoardAgentRequestState;
  provider?: AIProvider;
  modelId?: string;
  contextSnapshotId?: string;
  lastError?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface BoardAgentAction {
  id: string;
  sessionId: string;
  workspaceId: string;
  boardId: string;
  type: BoardAgentActionType;
  status: BoardAgentActionStatus;
  input?: Record<string, unknown>;
  normalizedInput?: Record<string, unknown>;
  result?: Record<string, unknown>;
  affectedCanonicalIds?: string[];
  affectedBoardShapeIds?: string[];
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BoardAgentResultEnvelope {
  session: BoardAgentSession;
  contextSnapshot?: BoardAgentContextSnapshot;
  actions: BoardAgentAction[];
  message?: string;
}
