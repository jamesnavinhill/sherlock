import type {
  Artifact,
  ManualConnection,
  ManualNode,
  Signal,
  WorkspaceRun,
  WorkspaceTemplate,
} from '@/types/core';
import type { BoardAgentAction, BoardAgentSession } from '@/types/boardAgent';
import type { AgentAction, ChatMessage, ChatSession } from '@/types/chat';
import type { WorkspaceDataBackup } from '@/types/workspaceData';
import type { WorkspaceBoard, WorkspaceBoardDocument, WorkspaceItem } from '@/types/workspaceSurface';
import { normalizeWorkspaceDataCompatibility } from './workspaceDataCompatibility';

export const WORKSPACE_DATA_BACKUP_KIND = 'SHERLOCK_WORKSPACE_DATA';
export const WORKSPACE_DATA_BACKUP_VERSION = 1 as const;

export const groupChatMessagesBySessionId = (
  messages: ChatMessage[]
): Record<string, ChatMessage[]> =>
  messages.reduce<Record<string, ChatMessage[]>>((acc, message) => {
    const next = acc[message.sessionId] || [];
    next.push(message);
    acc[message.sessionId] = next;
    return acc;
  }, {});

export const groupChatActionsBySessionId = (
  actions: AgentAction[]
): Record<string, AgentAction[]> =>
  actions.reduce<Record<string, AgentAction[]>>((acc, action) => {
    const next = acc[action.sessionId] || [];
    next.push(action);
    acc[action.sessionId] = next;
    return acc;
  }, {});

export const groupBoardAgentActionsBySessionId = (
  actions: BoardAgentAction[]
): Record<string, BoardAgentAction[]> =>
  actions.reduce<Record<string, BoardAgentAction[]>>((acc, action) => {
    const next = acc[action.sessionId] || [];
    next.push(action);
    acc[action.sessionId] = next;
    return acc;
  }, {});

const withWorkspaceLink = (run: WorkspaceRun): WorkspaceRun => ({
  ...run,
  workspaceId: run.workspaceId || run.artifact?.workspaceId,
});

export const getWorkspaceDataSignals = (
  snapshot: WorkspaceDataBackup['signals'] | null | undefined
): Signal[] => {
  if (!snapshot) return [];
  const canonicalSignals = Array.isArray((snapshot as { signals?: unknown }).signals)
    ? snapshot.signals
    : [];
  return canonicalSignals.length > 0
    ? canonicalSignals
    : Array.isArray(snapshot.headlines)
      ? snapshot.headlines
      : [];
};

export const buildWorkspaceLinkedGraphReferenceIds = (
  workspaceId: string,
  artifactIds: string[]
): Set<string> =>
  new Set([
    workspaceId,
    `case-${workspaceId}`,
    ...artifactIds,
    ...artifactIds.map((artifactId) => `case-${artifactId}`),
  ]);

export const filterManualGraphForWorkspaceRemoval = (input: {
  manualNodes: ManualNode[];
  manualLinks: ManualConnection[];
  hiddenNodeIds?: string[];
  flaggedNodeIds?: string[];
  workspaceId: string;
  artifactIds: string[];
}) => {
  const removableIds = buildWorkspaceLinkedGraphReferenceIds(input.workspaceId, input.artifactIds);

  return {
    manualNodes: input.manualNodes.filter((node) => !removableIds.has(node.id)),
    manualLinks: input.manualLinks.filter(
      (link) => !removableIds.has(link.source) && !removableIds.has(link.target)
    ),
    hiddenNodeIds: (input.hiddenNodeIds || []).filter((id) => !removableIds.has(id)),
    flaggedNodeIds: (input.flaggedNodeIds || []).filter((id) => !removableIds.has(id)),
  };
};

export const buildWorkspaceDataBackup = (input: {
  workspaces: WorkspaceDataBackup['workspaces'];
  artifacts: Artifact[];
  runs: WorkspaceRun[];
  chatSessions: ChatSession[];
  chatMessagesBySessionId: Record<string, ChatMessage[]>;
  chatActionsBySessionId: Record<string, AgentAction[]>;
  boardAgentSessions: BoardAgentSession[];
  boardAgentActionsBySessionId: Record<string, BoardAgentAction[]>;
  signals: Signal[];
  manualNodes: ManualNode[];
  manualLinks: ManualConnection[];
  workspaceItems: WorkspaceItem[];
  workspaceBoards: WorkspaceBoard[];
  workspaceBoardDocuments: WorkspaceBoardDocument[];
  templates: WorkspaceTemplate[];
  exportedAt?: string;
}): WorkspaceDataBackup => ({
  workspaces: input.workspaces,
  artifacts: input.artifacts,
  runs: input.runs.map(withWorkspaceLink),
  chat: {
    sessions: input.chatSessions,
    messages: Object.values(input.chatMessagesBySessionId).flat(),
    actions: Object.values(input.chatActionsBySessionId).flat(),
  },
  boardAgent: {
    sessions: input.boardAgentSessions,
    actions: Object.values(input.boardAgentActionsBySessionId).flat(),
  },
  signals: {
    signals: input.signals,
  },
  graph: {
    manualNodes: input.manualNodes,
    manualLinks: input.manualLinks,
  },
  workspaceSurface: {
    items: input.workspaceItems,
    boards: input.workspaceBoards,
    boardDocuments: input.workspaceBoardDocuments,
  },
  templates: input.templates,
  metadata: {
    kind: WORKSPACE_DATA_BACKUP_KIND,
    formatVersion: WORKSPACE_DATA_BACKUP_VERSION,
    exportedAt: input.exportedAt || new Date().toISOString(),
  },
});

export const normalizeWorkspaceDataBackup = (value: unknown): WorkspaceDataBackup => {
  const slices = normalizeWorkspaceDataCompatibility(value);

  return {
    workspaces: slices.workspaces,
    artifacts: slices.artifacts,
    runs: slices.runs,
    chat: {
      sessions: slices.chatSessions,
      messages: slices.chatMessages,
      actions: slices.chatActions,
    },
    boardAgent: {
      sessions: slices.boardAgentSessions,
      actions: slices.boardAgentActions,
    },
    signals: {
      signals: slices.signals,
    },
    graph: {
      manualNodes: slices.manualNodes,
      manualLinks: slices.manualLinks,
    },
    workspaceSurface: {
      items: slices.workspaceItems,
      boards: slices.workspaceBoards,
      boardDocuments: slices.workspaceBoardDocuments,
    },
    templates: slices.templates,
    metadata: {
      kind: WORKSPACE_DATA_BACKUP_KIND,
      formatVersion: WORKSPACE_DATA_BACKUP_VERSION,
      exportedAt: slices.exportedAt,
    },
  };
};
