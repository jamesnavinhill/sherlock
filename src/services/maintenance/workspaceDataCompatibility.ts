import type { Artifact, ManualConnection, ManualNode, Signal, WorkspaceRun, WorkspaceTemplate } from '@/types/core';
import type { BoardAgentAction, BoardAgentSession } from '@/types/boardAgent';
import type { AgentAction, ChatMessage, ChatSession } from '@/types/chat';
import type { WorkspaceDataBackup } from '@/types/workspaceData';
import type { WorkspaceBoard, WorkspaceBoardDocument, WorkspaceItem } from '@/types/workspaceSurface';

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

export interface WorkspaceDataCompatibilitySlices {
  workspaces: WorkspaceDataBackup['workspaces'];
  artifacts: Artifact[];
  runs: WorkspaceRun[];
  chatSessions: ChatSession[];
  chatMessages: ChatMessage[];
  chatActions: AgentAction[];
  boardAgentSessions: BoardAgentSession[];
  boardAgentActions: BoardAgentAction[];
  signals: Signal[];
  manualNodes: ManualNode[];
  manualLinks: ManualConnection[];
  workspaceItems: WorkspaceItem[];
  workspaceBoards: WorkspaceBoard[];
  workspaceBoardDocuments: WorkspaceBoardDocument[];
  templates: WorkspaceTemplate[];
  exportedAt: string;
}

const isCanonicalWorkspaceExportPayload = (
  value: Partial<WorkspaceDataBackup> & CanonicalWorkspaceExportPayload
): value is Partial<WorkspaceDataBackup> &
  Required<
    Pick<CanonicalWorkspaceExportPayload, 'workspace' | 'artifacts'>
  > => !!value.workspace && Array.isArray(value.artifacts);

const isLegacyWorkspaceExportPayload = (
  value: Partial<WorkspaceDataBackup> & LegacyWorkspaceDataBackup
): value is Partial<WorkspaceDataBackup> &
  Required<Pick<LegacyWorkspaceDataBackup, 'case' | 'reports'>> =>
  !!value.case && Array.isArray(value.reports);

const asArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const withArtifactWorkspaceLink = (
  artifact: Artifact | (Artifact & { caseId?: string })
): Artifact => {
  const legacyArtifact = artifact as Artifact & { caseId?: string };

  return {
    ...artifact,
    workspaceId:
      artifact.workspaceId || legacyArtifact.caseId || undefined,
  };
};

const flattenSessionRecord = <T extends { sessionId: string }>(
  value: unknown
): T[] => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.values(value as Record<string, unknown>).flatMap((entry) =>
    asArray<T>(entry)
  );
};

const withWorkspaceLink = (run: WorkspaceRun): WorkspaceRun => ({
  ...run,
  workspaceId: run.workspaceId || run.artifact?.workspaceId,
});

export const normalizeWorkspaceDataCompatibility = (
  value: unknown
): WorkspaceDataCompatibilitySlices => {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid workspace-data backup format.');
  }

  const payload = value as Partial<WorkspaceDataBackup> &
    LegacyWorkspaceDataBackup;
  const legacyPayload = payload as LegacyWorkspaceDataBackup;
  const exportPayload = payload as LegacyWorkspaceDataBackup &
    CanonicalWorkspaceExportPayload;
  const metadata = payload.metadata;
  const looksCanonical =
    Array.isArray(payload.workspaces) && Array.isArray(payload.artifacts);
  const looksLegacy =
    Array.isArray(payload.cases) && Array.isArray(payload.archives);
  const looksCanonicalWorkspaceExport =
    isCanonicalWorkspaceExportPayload(payload);
  const looksLegacyWorkspaceExport =
    isLegacyWorkspaceExportPayload(payload);

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
      ? [payload.workspace as WorkspaceDataBackup['workspaces'][number]].filter(
          Boolean
        )
      : looksLegacyWorkspaceExport
        ? [payload.case as WorkspaceDataBackup['workspaces'][number]].filter(
            Boolean
          )
        : asArray<WorkspaceDataBackup['workspaces'][number]>(payload.cases);
  const artifacts = (
    looksCanonical
      ? asArray<Artifact | (Artifact & { caseId?: string })>(payload.artifacts)
      : looksCanonicalWorkspaceExport
        ? asArray<Artifact | (Artifact & { caseId?: string })>(
            payload.artifacts
          )
        : looksLegacyWorkspaceExport
          ? asArray<Artifact | (Artifact & { caseId?: string })>(
              payload.reports
            )
          : asArray<Artifact | (Artifact & { caseId?: string })>(
              payload.archives
            )
  ).map(withArtifactWorkspaceLink);
  const runs = (
    looksCanonical
      ? asArray<WorkspaceRun>(payload.runs)
      : looksCanonicalWorkspaceExport || looksLegacyWorkspaceExport
        ? []
        : asArray<WorkspaceRun>(payload.tasks)
  ).map(withWorkspaceLink);
  const chatSessions = looksCanonical
    ? asArray<ChatSession>(payload.chat?.sessions)
    : looksCanonicalWorkspaceExport || looksLegacyWorkspaceExport
      ? []
      : asArray<ChatSession>(payload.chatSessions);
  const chatMessages = looksCanonical
    ? asArray<ChatMessage>(payload.chat?.messages)
    : looksCanonicalWorkspaceExport || looksLegacyWorkspaceExport
      ? []
      : flattenSessionRecord<ChatMessage>(payload.chatMessagesBySessionId);
  const chatActions = looksCanonical
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
      : flattenSessionRecord<BoardAgentAction>(
          payload.boardAgentActionsBySessionId
        );
  const signals = looksCanonical
    ? Array.isArray((payload.signals as { signals?: unknown } | undefined)?.signals)
      ? asArray<Signal>(payload.signals?.signals)
      : asArray<Signal>(payload.signals?.headlines)
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
    ? asArray<WorkspaceBoardDocument>(
        payload.workspaceSurface?.boardDocuments
      )
    : asArray<WorkspaceBoardDocument>(
        legacyPayload.workspaceBoardDocuments
      );
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
    chatSessions,
    chatMessages,
    chatActions,
    boardAgentSessions,
    boardAgentActions,
    signals,
    manualNodes,
    manualLinks,
    workspaceItems,
    workspaceBoards,
    workspaceBoardDocuments,
    templates,
    exportedAt,
  };
};
