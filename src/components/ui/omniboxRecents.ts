import { sanitizeDisplayTitle } from '@/domain';
import type { StoredOmniboxRecent } from '@/utils/localStorage';
import { buildTimelineSavedViewSnippet } from '@/components/features/Timeline/timelineSavedViews';
import type {
  BuildOmniboxResultsInput,
  OmniboxActionId,
  OmniboxResult,
} from './omniboxTypes';
import { dedupeResults } from './omniboxSearchUtils';
import { buildWorkspaceItemRecentResult } from './omniboxResultBuilders';

export const buildRecentOmniboxResults = ({
  activeWorkspaceId,
  artifacts,
  chatSessions,
  savedViews = [],
  storedRecents = [],
  workspaceItems,
  workspaceRuns,
  workspaces,
}: Omit<BuildOmniboxResultsInput, 'query' | 'snippets'>): OmniboxResult[] => {
  const storedRecentResults = storedRecents
    .slice()
    .sort((left, right) => right.visitedAt - left.visitedAt)
    .map((recent, index): OmniboxResult | null => {
      if (recent.kind === 'WORKSPACE') {
        const workspace = workspaces.find((entry) => entry.id === recent.refId);
        if (!workspace) return null;
        return {
          id: `stored-recent-workspace:${workspace.id}`,
          kind: 'WORKSPACE',
          title: workspace.displayTitle || workspace.title,
          subtitle: 'Recent workspace',
          workspaceId: workspace.id,
          score: 120 - index,
          timestamp: recent.visitedAt,
          actions: ['OPEN', 'OPEN_IN_CHAT', 'OPEN_IN_FILES'] as OmniboxActionId[],
        };
      }

      if (recent.kind === 'ARTIFACT') {
        const artifact = artifacts.find((entry) => entry.id === recent.refId);
        if (!artifact?.id) return null;
        return {
          id: `stored-recent-artifact:${artifact.id}`,
          kind: 'ARTIFACT',
          title: sanitizeDisplayTitle(artifact.topic),
          subtitle: 'Recent artifact',
          snippet: artifact.summary,
          workspaceId: artifact.workspaceId,
          artifactId: artifact.id,
          refId: artifact.id,
          score: 118 - index,
          timestamp: recent.visitedAt,
          actions: ['OPEN', 'OPEN_IN_CHAT', 'PLACE_ON_BOARD', 'OPEN_IN_TIMELINE', 'OPEN_IN_FILES'],
        };
      }

      if (recent.kind === 'CHAT_SESSION') {
        const session = chatSessions.find((entry) => entry.id === recent.refId);
        if (!session) return null;
        return {
          id: `stored-recent-chat:${session.id}`,
          kind: 'CHAT_SESSION',
          title: session.title || 'Workspace Chat',
          subtitle: 'Recent chat',
          workspaceId: session.workspaceId,
          refId: session.id,
          score: 116 - index,
          timestamp: recent.visitedAt,
          actions: ['OPEN', 'OPEN_IN_TIMELINE'] as OmniboxActionId[],
        };
      }

      if (recent.kind === 'RUN') {
        const run = workspaceRuns.find((entry) => entry.id === recent.refId);
        if (!run) return null;
        return {
          id: `stored-recent-run:${run.id}`,
          kind: 'RUN',
          title: sanitizeDisplayTitle(run.topic),
          subtitle: 'Recent run',
          workspaceId: run.workspaceId || run.report?.workspaceId,
          refId: run.id,
          score: 114 - index,
          timestamp: recent.visitedAt,
          actions: ['OPEN', 'OPEN_IN_TIMELINE'] as OmniboxActionId[],
        };
      }

      if (recent.kind === 'WORKSPACE_ITEM') {
        const item = workspaceItems.find((entry) => entry.id === recent.refId);
        if (!item) return null;
        return buildWorkspaceItemRecentResult(item, 'stored-recent-item', 112 - index, recent.visitedAt);
      }

      return null;
    })
    .filter((result): result is OmniboxResult => !!result);

  const recentWorkspaceResults = workspaces
    .slice()
    .sort(
      (left, right) =>
        (right.updatedAt || right.createdAt || 0) - (left.updatedAt || left.createdAt || 0)
    )
    .slice(0, 3)
    .map((workspace, index) => ({
      id: `recent-workspace:${workspace.id}`,
      kind: 'WORKSPACE' as const,
      title: workspace.displayTitle || workspace.title,
      subtitle: index === 0 ? 'Recent workspace' : 'Workspace',
      workspaceId: workspace.id,
      score: 90 - index,
      timestamp: workspace.updatedAt || workspace.createdAt,
      actions: ['OPEN', 'OPEN_IN_CHAT', 'OPEN_IN_FILES'] as OmniboxActionId[],
    }));

  const scopedArtifacts = artifacts
    .filter((artifact) => !activeWorkspaceId || artifact.workspaceId === activeWorkspaceId)
    .slice()
    .sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0))
    .slice(0, 3)
    .map((artifact, index) => ({
      id: `recent-artifact:${artifact.id || artifact.topic}:${index}`,
      kind: 'ARTIFACT' as const,
      title: sanitizeDisplayTitle(artifact.topic),
      subtitle: 'Recent artifact',
      snippet: artifact.summary,
      workspaceId: artifact.workspaceId,
      artifactId: artifact.id,
      refId: artifact.id,
      score: 88 - index,
      timestamp: artifact.createdAt,
      actions: [
        'OPEN',
        'OPEN_IN_CHAT',
        'PLACE_ON_BOARD',
        'OPEN_IN_TIMELINE',
        'OPEN_IN_FILES',
      ] as OmniboxActionId[],
    }));

  const scopedItems = workspaceItems
    .filter((item) => !activeWorkspaceId || item.workspaceId === activeWorkspaceId)
    .slice()
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, 3)
    .map((item, index) =>
      buildWorkspaceItemRecentResult(item, 'recent-item', 86 - index, item.updatedAt)
    );

  const recentChats = chatSessions
    .filter((session) => !activeWorkspaceId || session.workspaceId === activeWorkspaceId)
    .slice()
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, 2)
    .map((session, index) => ({
      id: `recent-chat:${session.id}`,
      kind: 'CHAT_SESSION' as const,
      title: session.title || 'Workspace Chat',
      subtitle: 'Recent chat',
      workspaceId: session.workspaceId,
      refId: session.id,
      score: 84 - index,
      timestamp: session.updatedAt,
      actions: ['OPEN', 'OPEN_IN_TIMELINE'] as OmniboxActionId[],
    }));

  const recentRuns = workspaceRuns
    .filter(
      (run) =>
        !activeWorkspaceId ||
        run.workspaceId === activeWorkspaceId ||
        run.report?.workspaceId === activeWorkspaceId
    )
    .slice()
    .sort(
      (left, right) =>
        (right.endTime || right.startTime || 0) - (left.endTime || left.startTime || 0)
    )
    .slice(0, 2)
    .map((run, index) => ({
      id: `recent-run:${run.id}`,
      kind: 'RUN' as const,
      title: sanitizeDisplayTitle(run.topic),
      subtitle: 'Recent run',
      workspaceId: run.workspaceId || run.report?.workspaceId,
      refId: run.id,
      score: 82 - index,
      timestamp: run.endTime || run.startTime,
      actions: ['OPEN', 'OPEN_IN_TIMELINE'] as OmniboxActionId[],
    }));

  const recentSavedViews = savedViews
    .filter((view) => !activeWorkspaceId || view.workspaceId === activeWorkspaceId)
    .slice()
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, 3)
    .map((view, index) => {
      const workspace = workspaces.find((entry) => entry.id === view.workspaceId);
      return {
        id: `recent-saved-view:${view.id}`,
        kind: 'SAVED_VIEW' as const,
        title: view.title,
        subtitle: 'Saved view',
        snippet: buildTimelineSavedViewSnippet(view, workspace),
        workspaceId: view.workspaceId,
        refId: view.id,
        score: 80 - index,
        timestamp: view.updatedAt,
        actions: ['OPEN', 'OPEN_IN_TIMELINE'] as OmniboxActionId[],
        metadata: {
          savedViewQuery: view.query,
        },
      };
    });

  return dedupeResults([
    ...storedRecentResults,
    ...recentWorkspaceResults,
    ...scopedArtifacts,
    ...scopedItems,
    ...recentChats,
    ...recentRuns,
    ...recentSavedViews,
  ]).slice(0, 10);
};

export const createStoredOmniboxRecent = (result: OmniboxResult): StoredOmniboxRecent | null => {
  if (result.kind === 'WORKSPACE' && result.workspaceId) {
    return {
      kind: 'WORKSPACE',
      refId: result.workspaceId,
      workspaceId: result.workspaceId,
      visitedAt: Date.now(),
    };
  }

  if (result.kind === 'ARTIFACT' && (result.artifactId || result.refId)) {
    return {
      kind: 'ARTIFACT',
      refId: result.artifactId || String(result.refId),
      workspaceId: result.workspaceId,
      visitedAt: Date.now(),
    };
  }

  if (result.kind === 'CHAT_SESSION' && result.refId) {
    return {
      kind: 'CHAT_SESSION',
      refId: result.refId,
      workspaceId: result.workspaceId,
      visitedAt: Date.now(),
    };
  }

  if (result.kind === 'RUN' && result.refId) {
    return {
      kind: 'RUN',
      refId: result.refId,
      workspaceId: result.workspaceId,
      visitedAt: Date.now(),
    };
  }

  if (result.kind === 'WORKSPACE_ITEM' && result.refId) {
    return {
      kind: 'WORKSPACE_ITEM',
      refId: result.refId,
      workspaceId: result.workspaceId,
      visitedAt: Date.now(),
    };
  }

  return null;
};
