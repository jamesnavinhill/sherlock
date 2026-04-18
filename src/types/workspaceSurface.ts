export type WorkspaceCanonicalRefKind =
  | 'ARTIFACT'
  | 'KEY_FINDING'
  | 'ENTITY'
  | 'SOURCE'
  | 'SIGNAL'
  | 'HEADLINE'
  | 'WORKSPACE_ITEM';

export type WorkspaceItemKind = 'NOTE' | 'LINK' | 'FILE' | 'MEDIA' | 'EXCERPT';

export interface WorkspaceItemProvenance {
  source: 'USER' | 'CHAT' | 'REPORT' | 'TIMELINE' | 'NETWORK' | 'INGESTION' | 'BOARD_AGENT';
  sourceMessageId?: string;
  sourceSessionId?: string;
  sourceArtifactId?: string;
  sourceFindingId?: string;
  sourceSignalId?: string;
  sourceHeadlineId?: string;
  sourceBoardId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceItem {
  id: string;
  workspaceId: string;
  kind: WorkspaceItemKind;
  title: string;
  description?: string;
  textContent?: string;
  url?: string;
  mimeType?: string;
  fileName?: string;
  sizeBytes?: number;
  previewUrl?: string;
  tags?: string[];
  provenance?: WorkspaceItemProvenance;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceBoard {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  sortOrder: number;
  presentationMode?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceBoardDocument {
  boardId: string;
  snapshot: unknown | null;
  updatedAt: number;
}

export interface WorkspaceBoardItemReference {
  workspaceId: string;
  refKind: WorkspaceCanonicalRefKind;
  refId: string;
  title: string;
  workspaceItemKind?: WorkspaceItemKind;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceBoardPlacementRequest {
  workspaceId: string;
  boardId?: string;
  item: WorkspaceBoardItemReference;
  openInBoard?: boolean;
  mode?: 'PLACE' | 'FOCUS_OR_PLACE';
}
