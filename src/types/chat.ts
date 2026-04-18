import type { AIProvider } from '../config/aiModels';
import type { Artifact, ArtifactType, Signal, Workspace } from './core';

export type ChatSessionStatus = 'ACTIVE' | 'ARCHIVED';
export type ChatMessageRole = 'system' | 'user' | 'assistant' | 'tool';
export type ChatMessageStatus = 'PENDING' | 'STREAMING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ChatGenerationStatus = 'IDLE' | 'GENERATING' | 'CANCELLING' | 'FAILED';
export type ChatAttachmentKind =
  | 'WORKSPACE'
  | 'REPORT'
  | 'SECTION'
  | 'FINDING'
  | 'ENTITY'
  | 'SIGNAL'
  | 'HEADLINE'
  | 'SOURCE'
  | 'NOTE'
  | 'LINK'
  | 'FILE'
  | 'MEDIA'
  | 'EXCERPT'
  | 'CUSTOM';

export type AgentActionType =
  | 'SEARCH_WORKSPACE'
  | 'FETCH_ARTIFACT_SUMMARY'
  | 'FETCH_FULL_ARTIFACT_TEXT'
  | 'FETCH_RECENT_SIGNALS'
  | 'CREATE_ARTIFACT_DRAFT'
  | 'APPEND_NOTE_TO_ARTIFACT'
  | 'CREATE_FOLLOW_UP_RUN';

export type AgentActionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface ChatSession {
  id: string;
  workspaceId: string;
  title: string;
  status: ChatSessionStatus;
  sourceArtifactId?: string;
  packId?: string;
  purposeId?: string;
  provider?: AIProvider;
  modelId?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface ChatAttachment {
  id: string;
  messageId: string;
  kind: ChatAttachmentKind;
  title: string;
  refId?: string;
  refKind?: string;
  snippet?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  status: ChatMessageStatus;
  citations?: string[];
  attachments?: ChatAttachment[];
  metadata?: Record<string, unknown>;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AgentAction {
  id: string;
  sessionId: string;
  messageId?: string;
  type: AgentActionType;
  status: AgentActionStatus;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface ChatDraftArtifact {
  id: string;
  workspaceId: string;
  sourceMessageId: string;
  title: string;
  content: string;
  artifactType?: ArtifactType;
  citations?: string[];
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface ChatLaunchContext {
  workspaceItemId?: string;
  sourceArtifactId?: string;
  keyFindingId?: string;
  entityName?: string;
  signalId?: string;
  headlineId?: string;
}

export interface ChatOpenRequest {
  workspaceId: string;
  sessionId?: string;
  launchContext?: ChatLaunchContext;
}

export interface WorkspaceContextSnippet {
  id: string;
  kind: ChatAttachmentKind;
  title: string;
  snippet: string;
  refId?: string;
  refKind?: string;
  score: number;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceContextBundle {
  workspace: Workspace;
  summary: string;
  recentArtifacts: Artifact[];
  recentSignals: Signal[];
  snippets: WorkspaceContextSnippet[];
}

export type ChatMentionKind =
  | 'ARTIFACT'
  | 'KEY_FINDING'
  | 'ENTITY'
  | 'SIGNAL'
  | 'WORKSPACE_ITEM';

export interface ChatMentionReference {
  id: string;
  workspaceId: string;
  kind: ChatMentionKind;
  refId: string;
  title: string;
  subtitle: string;
  snippet?: string;
  metadata?: Record<string, unknown>;
}
