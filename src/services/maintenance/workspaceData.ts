import type {
  AgentAction,
  Artifact,
  BoardAgentAction,
  BoardAgentSession,
  WorkspaceTemplate,
  ChatMessage,
  ChatSession,
  ManualConnection,
  ManualNode,
  Signal,
  WorkspaceBoard,
  WorkspaceBoardDocument,
  WorkspaceItem,
  WorkspaceDataBackup,
  WorkspaceRun,
} from '@/types';

export const WORKSPACE_DATA_BACKUP_KIND = 'SHERLOCK_WORKSPACE_DATA';
export const WORKSPACE_DATA_BACKUP_VERSION = 1 as const;

type LegacyWorkspaceDataBackup = Partial<{
  cases: unknown;
  case: unknown;
  archives: unknown;
  reports: unknown;
  tasks: unknown;
  chatSessions: unknown;
  chatMessagesBySessionId: unknown;
  chatActionsBySessionId: unknown;
  boardAgentSessions: unknown;
  boardAgentActionsBySessionId: unknown;
  headlines: unknown;
  templates: unknown;
  manualNodes: unknown;
  manualLinks: unknown;
  workspaceItems: unknown;
  workspaceBoards: unknown;
  workspaceBoardDocuments: unknown;
  timestamp: unknown;
  exportedAt: unknown;
}>;

type CanonicalWorkspaceExportPayload = Partial<{
  workspace: unknown;
  artifacts: unknown;
  exportedAt: unknown;
}>;

const isCanonicalWorkspaceExportPayload = (
  value: Partial<WorkspaceDataBackup> & CanonicalWorkspaceExportPayload
): value is Partial<WorkspaceDataBackup> & Required<Pick<CanonicalWorkspaceExportPayload, 'workspace' | 'artifacts'>> =>
  !!value.workspace && Array.isArray(value.artifacts);

const isLegacyWorkspaceExportPayload = (
  value: Partial<WorkspaceDataBackup> & LegacyWorkspaceDataBackup
): value is Partial<WorkspaceDataBackup> & Required<Pick<LegacyWorkspaceDataBackup, 'case' | 'reports'>> =>
  !!value.case && Array.isArray(value.reports);

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const withArtifactWorkspaceLink = (
  artifact: Artifact | (Artifact & { caseId?: string })
): Artifact => {
  const legacyArtifact = artifact as Artifact & { caseId?: string };

  return {
    ...artifact,
    workspaceId: artifact.workspaceId || legacyArtifact.caseId || undefined,
  };
};

const flattenSessionRecord = <T extends { sessionId: string }>(value: unknown): T[] => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.values(value as Record<string, unknown>).flatMap((entry) => asArray<T>(entry));
};

const withWorkspaceLink = (run: WorkspaceRun): WorkspaceRun => ({
  ...run,
  workspaceId: run.workspaceId || run.report?.workspaceId,
});

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
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid workspace-data backup format.');
  }

  const payload = value as Partial<WorkspaceDataBackup> & LegacyWorkspaceDataBackup;
  const legacyPayload = payload as LegacyWorkspaceDataBackup;
  const exportPayload = payload as LegacyWorkspaceDataBackup & CanonicalWorkspaceExportPayload;
  const metadata = payload.metadata;
  const looksCanonical = Array.isArray(payload.workspaces) && Array.isArray(payload.artifacts);
  const looksLegacy = Array.isArray(payload.cases) && Array.isArray(payload.archives);
  const looksCanonicalWorkspaceExport = isCanonicalWorkspaceExportPayload(payload);
  const looksLegacyWorkspaceExport = isLegacyWorkspaceExportPayload(payload);

  if (
    !looksCanonical &&
    !looksLegacy &&
    !looksCanonicalWorkspaceExport &&
    !looksLegacyWorkspaceExport
  ) {
    throw new Error('Invalid workspace-data backup format.');
  }

  const workspaces: WorkspaceDataBackup['workspaces'] = looksCanonical
    ? asArray<WorkspaceDataBackup['workspaces'][number]>(payload.workspaces)
    : looksCanonicalWorkspaceExport
      ? [payload.workspace as WorkspaceDataBackup['workspaces'][number]].filter(Boolean)
      : looksLegacyWorkspaceExport
        ? [payload.case as WorkspaceDataBackup['workspaces'][number]].filter(Boolean)
      : asArray<WorkspaceDataBackup['workspaces'][number]>(payload.cases);
  const artifacts = looksCanonical
    ? asArray<Artifact | (Artifact & { caseId?: string })>(payload.artifacts).map(
        withArtifactWorkspaceLink
      )
    : looksCanonicalWorkspaceExport
      ? asArray<Artifact | (Artifact & { caseId?: string })>(payload.artifacts).map(
          withArtifactWorkspaceLink
        )
      : looksLegacyWorkspaceExport
        ? asArray<Artifact | (Artifact & { caseId?: string })>(payload.reports).map(
            withArtifactWorkspaceLink
          )
      : asArray<Artifact | (Artifact & { caseId?: string })>(payload.archives).map(
          withArtifactWorkspaceLink
        );
  const runs = (
    looksCanonical
      ? asArray<WorkspaceRun>(payload.runs)
      : looksCanonicalWorkspaceExport || looksLegacyWorkspaceExport
        ? []
        : asArray<WorkspaceRun>(payload.tasks)
  ).map(withWorkspaceLink);
  const sessions = looksCanonical
    ? asArray<ChatSession>(payload.chat?.sessions)
    : looksCanonicalWorkspaceExport || looksLegacyWorkspaceExport
      ? []
      : asArray<ChatSession>(payload.chatSessions);
  const messages = looksCanonical
    ? asArray<ChatMessage>(payload.chat?.messages)
    : looksCanonicalWorkspaceExport || looksLegacyWorkspaceExport
      ? []
      : flattenSessionRecord<ChatMessage>(payload.chatMessagesBySessionId);
  const actions = looksCanonical
    ? asArray<AgentAction>(payload.chat?.actions)
    : looksCanonicalWorkspaceExport || looksLegacyWorkspaceExport
      ? []
      : flattenSessionRecord<AgentAction>(payload.chatActionsBySessionId);
  const boardAgentSessions = looksCanonical
    ? asArray<BoardAgentSession>(payload.boardAgent?.sessions)
    : looksCanonicalWorkspaceExport || looksLegacyWorkspaceExport
      ? []
      : asArray<BoardAgentSession>(payload.boardAgentSessions);
  const boardAgentActions = looksCanonical
    ? asArray<BoardAgentAction>(payload.boardAgent?.actions)
    : looksCanonicalWorkspaceExport || looksLegacyWorkspaceExport
      ? []
      : flattenSessionRecord<BoardAgentAction>(payload.boardAgentActionsBySessionId);
  const signals = looksCanonical
    ? getWorkspaceDataSignals(payload.signals)
    : looksCanonicalWorkspaceExport || looksLegacyWorkspaceExport
      ? []
      : asArray<Signal>(payload.headlines);
  const manualNodes = looksCanonical
    ? asArray<ManualNode>(payload.graph?.manualNodes)
    : looksCanonicalWorkspaceExport || looksLegacyWorkspaceExport
      ? []
      : asArray<ManualNode>(payload.manualNodes);
  const manualLinks = looksCanonical
    ? asArray<ManualConnection>(payload.graph?.manualLinks)
    : looksCanonicalWorkspaceExport || looksLegacyWorkspaceExport
      ? []
      : asArray<ManualConnection>(payload.manualLinks);
  const workspaceItems = looksCanonical
    ? asArray<WorkspaceItem>(payload.workspaceSurface?.items)
    : asArray<WorkspaceItem>(legacyPayload.workspaceItems);
  const workspaceBoards = looksCanonical
    ? asArray<WorkspaceBoard>(payload.workspaceSurface?.boards)
    : asArray<WorkspaceBoard>(legacyPayload.workspaceBoards);
  const workspaceBoardDocuments = looksCanonical
    ? asArray<WorkspaceBoardDocument>(payload.workspaceSurface?.boardDocuments)
    : asArray<WorkspaceBoardDocument>(legacyPayload.workspaceBoardDocuments);
  const templates =
    looksCanonicalWorkspaceExport || looksLegacyWorkspaceExport
      ? []
      : asArray<WorkspaceTemplate>(payload.templates);
  const exportedAt =
    typeof metadata?.exportedAt === 'string'
      ? metadata.exportedAt
      : typeof exportPayload.exportedAt === 'string'
        ? exportPayload.exportedAt
        : typeof legacyPayload.timestamp === 'string'
          ? legacyPayload.timestamp
          : new Date().toISOString();

  return {
    workspaces,
    artifacts,
    runs,
    chat: {
      sessions,
      messages,
      actions,
    },
    boardAgent: {
      sessions: boardAgentSessions,
      actions: boardAgentActions,
    },
    signals: {
      signals,
    },
    graph: {
      manualNodes,
      manualLinks,
    },
    workspaceSurface: {
      items: workspaceItems,
      boards: workspaceBoards,
      boardDocuments: workspaceBoardDocuments,
    },
    templates,
    metadata: {
      kind: WORKSPACE_DATA_BACKUP_KIND,
      formatVersion: WORKSPACE_DATA_BACKUP_VERSION,
      exportedAt,
    },
  };
};
