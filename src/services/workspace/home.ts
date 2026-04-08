import { getWorkspaceDisplayTitle } from '@/domain';
import type {
  Artifact,
  ChatSession,
  Headline,
  Workspace,
  WorkspaceBoard,
  WorkspaceBoardDocument,
  WorkspaceItem,
  WorkspaceRun,
} from '@/types';
import type { TimelineSavedView } from '@/components/features/Timeline/timelineSavedViews';
import { buildTimelineSavedViewSnippet } from '@/components/features/Timeline/timelineSavedViews';

export interface WorkspaceHomeCounts {
  artifacts: number;
  items: number;
  signals: number;
  chats: number;
  runs: number;
  boards: number;
  boardsWithSnapshots: number;
}

export interface WorkspaceHomeBoardState {
  count: number;
  boardsWithSnapshots: number;
  lastActivityAt: number | null;
}

export interface WorkspaceHomeSavedViewSummary {
  id: string;
  title: string;
  snippet: string;
  updatedAt: number;
  workspaceId: string;
}

export type WorkspaceHomeRecentActivityKind =
  | 'ARTIFACT'
  | 'ITEM'
  | 'SIGNAL'
  | 'CHAT'
  | 'RUN'
  | 'BOARD';

export interface WorkspaceHomeRecentActivityItem {
  id: string;
  kind: WorkspaceHomeRecentActivityKind;
  title: string;
  subtitle: string;
  timestamp: number;
  workspaceId: string;
}

export interface WorkspaceHomeSummary {
  workspaceId: string;
  title: string;
  description?: string;
  launchTopic?: string;
  launchAngle?: string;
  prioritySourcesSummary?: string;
  status: Workspace['status'];
  dateOpened: string;
  counts: WorkspaceHomeCounts;
  boardState: WorkspaceHomeBoardState;
}

export interface WorkspaceHomeSnapshot {
  workspaceId: string;
  summary: WorkspaceHomeSummary;
  recentActivity: WorkspaceHomeRecentActivityItem[];
  savedViews: WorkspaceHomeSavedViewSummary[];
}

const MAX_RECENT_ACTIVITY_ITEMS = 12;

const parseLooseTimestamp = (value?: string) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const buildWorkspaceHomeCounts = (input: {
  artifacts: Artifact[];
  chatSessions: ChatSession[];
  headlines: Headline[];
  workspaceBoardDocuments: Record<string, WorkspaceBoardDocument>;
  workspaceBoards: WorkspaceBoard[];
  workspaceId: string;
  workspaceItems: WorkspaceItem[];
  workspaceRuns: WorkspaceRun[];
}): WorkspaceHomeCounts => {
  const boards = input.workspaceBoards.filter((board) => board.workspaceId === input.workspaceId);
  const boardsWithSnapshots = boards.filter(
    (board) => !!input.workspaceBoardDocuments[board.id]?.snapshot
  ).length;

  return {
    artifacts: input.artifacts.filter((artifact) => artifact.caseId === input.workspaceId).length,
    items: input.workspaceItems.filter((item) => item.workspaceId === input.workspaceId).length,
    signals: input.headlines.filter((headline) => headline.caseId === input.workspaceId).length,
    chats: input.chatSessions.filter((session) => session.workspaceId === input.workspaceId).length,
    runs: input.workspaceRuns.filter(
      (run) => run.workspaceId === input.workspaceId || run.report?.caseId === input.workspaceId
    ).length,
    boards: boards.length,
    boardsWithSnapshots,
  };
};

export const buildWorkspaceHomeBoardState = (input: {
  workspaceBoardDocuments: Record<string, WorkspaceBoardDocument>;
  workspaceBoards: WorkspaceBoard[];
  workspaceId: string;
}): WorkspaceHomeBoardState => {
  const boards = input.workspaceBoards.filter((board) => board.workspaceId === input.workspaceId);
  const boardDocumentTimes = boards
    .map((board) => input.workspaceBoardDocuments[board.id]?.updatedAt || 0)
    .filter((value) => value > 0);
  const boardTimes = boards.map((board) => board.updatedAt).filter((value) => value > 0);
  const lastActivityAt = [...boardTimes, ...boardDocumentTimes].sort((left, right) => right - left)[0];

  return {
    count: boards.length,
    boardsWithSnapshots: boards.filter((board) => !!input.workspaceBoardDocuments[board.id]?.snapshot)
      .length,
    lastActivityAt: lastActivityAt || null,
  };
};

export const buildWorkspaceHomeSavedViewSummaries = (input: {
  savedViews: TimelineSavedView[];
  workspace: Workspace;
}): WorkspaceHomeSavedViewSummary[] =>
  input.savedViews
    .filter((view) => view.workspaceId === input.workspace.id)
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .map((view) => ({
      id: view.id,
      title: view.title,
      snippet: buildTimelineSavedViewSnippet(view, input.workspace),
      updatedAt: view.updatedAt,
      workspaceId: view.workspaceId,
    }));

export const buildWorkspaceHomeRecentActivity = (input: {
  artifacts: Artifact[];
  chatSessions: ChatSession[];
  headlines: Headline[];
  workspaceBoardDocuments: Record<string, WorkspaceBoardDocument>;
  workspaceBoards: WorkspaceBoard[];
  workspaceId: string;
  workspaceItems: WorkspaceItem[];
  workspaceRuns: WorkspaceRun[];
}): WorkspaceHomeRecentActivityItem[] => {
  const entries: WorkspaceHomeRecentActivityItem[] = [];

  input.artifacts
    .filter((artifact) => artifact.caseId === input.workspaceId && artifact.id)
    .forEach((artifact) => {
      entries.push({
        id: `artifact:${artifact.id}`,
        kind: 'ARTIFACT',
        title: artifact.topic,
        subtitle: artifact.artifactType || 'Artifact saved',
        timestamp: artifact.createdAt || 0,
        workspaceId: input.workspaceId,
      });
    });

  input.workspaceItems
    .filter((item) => item.workspaceId === input.workspaceId)
    .forEach((item) => {
      entries.push({
        id: `item:${item.id}`,
        kind: 'ITEM',
        title: item.title,
        subtitle: item.kind,
        timestamp: item.updatedAt || item.createdAt || 0,
        workspaceId: input.workspaceId,
      });
    });

  input.headlines
    .filter((headline) => headline.caseId === input.workspaceId)
    .forEach((headline) => {
      entries.push({
        id: `signal:${headline.id}`,
        kind: 'SIGNAL',
        title: headline.content,
        subtitle: headline.source || 'Saved signal',
        timestamp: parseLooseTimestamp(headline.timestamp),
        workspaceId: input.workspaceId,
      });
    });

  input.chatSessions
    .filter((session) => session.workspaceId === input.workspaceId)
    .forEach((session) => {
      entries.push({
        id: `chat:${session.id}`,
        kind: 'CHAT',
        title: session.title || 'Workspace Chat',
        subtitle: session.status,
        timestamp: session.updatedAt || session.createdAt,
        workspaceId: input.workspaceId,
      });
    });

  input.workspaceRuns
    .filter((run) => run.workspaceId === input.workspaceId || run.report?.caseId === input.workspaceId)
    .forEach((run) => {
      entries.push({
        id: `run:${run.id}`,
        kind: 'RUN',
        title: run.topic,
        subtitle: run.status,
        timestamp: run.endTime || run.startTime,
        workspaceId: input.workspaceId,
      });
    });

  input.workspaceBoards
    .filter((board) => board.workspaceId === input.workspaceId)
    .forEach((board) => {
      const documentUpdatedAt = input.workspaceBoardDocuments[board.id]?.updatedAt || 0;
      entries.push({
        id: `board:${board.id}`,
        kind: 'BOARD',
        title: board.name,
        subtitle: documentUpdatedAt > 0 ? 'Board updated' : 'Board ready',
        timestamp: Math.max(board.updatedAt, documentUpdatedAt),
        workspaceId: input.workspaceId,
      });
    });

  return entries
    .filter((entry) => entry.timestamp > 0)
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, MAX_RECENT_ACTIVITY_ITEMS);
};

export const buildWorkspaceHomeSummary = (input: {
  artifacts: Artifact[];
  chatSessions: ChatSession[];
  headlines: Headline[];
  workspace: Workspace;
  workspaceBoardDocuments: Record<string, WorkspaceBoardDocument>;
  workspaceBoards: WorkspaceBoard[];
  workspaceItems: WorkspaceItem[];
  workspaceRuns: WorkspaceRun[];
}): WorkspaceHomeSummary => {
  const counts = buildWorkspaceHomeCounts({
    artifacts: input.artifacts,
    chatSessions: input.chatSessions,
    headlines: input.headlines,
    workspaceBoardDocuments: input.workspaceBoardDocuments,
    workspaceBoards: input.workspaceBoards,
    workspaceId: input.workspace.id,
    workspaceItems: input.workspaceItems,
    workspaceRuns: input.workspaceRuns,
  });
  const boardState = buildWorkspaceHomeBoardState({
    workspaceBoardDocuments: input.workspaceBoardDocuments,
    workspaceBoards: input.workspaceBoards,
    workspaceId: input.workspace.id,
  });

  return {
    workspaceId: input.workspace.id,
    title: getWorkspaceDisplayTitle(input.workspace),
    description: input.workspace.description,
    launchTopic: input.workspace.launchTopic,
    launchAngle: input.workspace.launchAngle,
    prioritySourcesSummary: input.workspace.prioritySourcesSummary,
    status: input.workspace.status,
    dateOpened: input.workspace.dateOpened,
    counts,
    boardState,
  };
};

export const buildWorkspaceHomeSnapshot = (input: {
  artifacts: Artifact[];
  chatSessions: ChatSession[];
  headlines: Headline[];
  savedViews?: TimelineSavedView[];
  workspace: Workspace;
  workspaceBoardDocuments: Record<string, WorkspaceBoardDocument>;
  workspaceBoards: WorkspaceBoard[];
  workspaceItems: WorkspaceItem[];
  workspaceRuns: WorkspaceRun[];
}): WorkspaceHomeSnapshot => ({
  workspaceId: input.workspace.id,
  summary: buildWorkspaceHomeSummary(input),
  recentActivity: buildWorkspaceHomeRecentActivity({
    artifacts: input.artifacts,
    chatSessions: input.chatSessions,
    headlines: input.headlines,
    workspaceBoardDocuments: input.workspaceBoardDocuments,
    workspaceBoards: input.workspaceBoards,
    workspaceId: input.workspace.id,
    workspaceItems: input.workspaceItems,
    workspaceRuns: input.workspaceRuns,
  }),
  savedViews: buildWorkspaceHomeSavedViewSummaries({
    savedViews: input.savedViews || [],
    workspace: input.workspace,
  }),
});

