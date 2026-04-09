import type { ChatSession, Workspace, WorkspaceContextSnippet, WorkspaceItem, WorkspaceRun } from '@/types';
import { getWorkspaceDisplayTitle, sanitizeDisplayTitle } from '@/domain';
import type { TimelineSavedView } from '@/components/features/Timeline/timelineSavedViews';
import { buildTimelineSavedViewSnippet } from '@/components/features/Timeline/timelineSavedViews';
import { buildWorkspaceItemSnippet } from '@/services/workspace/workspaceItemText';
import { scoreTextMatch } from './omniboxSearchUtils';
import type { OmniboxActionId, OmniboxResult, OmniboxResultKind } from './omniboxTypes';

const mapSnippetKindToResultKind = (
  snippet: WorkspaceContextSnippet
): OmniboxResultKind => {
  switch (snippet.kind) {
    case 'REPORT':
      return 'ARTIFACT';
    case 'FINDING':
      return 'FINDING';
    case 'SECTION':
      return 'SECTION';
    case 'SOURCE':
      return 'SOURCE';
    case 'ENTITY':
      return 'ENTITY';
    case 'SIGNAL':
    case 'HEADLINE':
      return 'SIGNAL';
    case 'NOTE':
    case 'LINK':
    case 'FILE':
    case 'MEDIA':
    case 'EXCERPT':
      return 'WORKSPACE_ITEM';
    default:
      return 'WORKSPACE_ITEM';
  }
};

export const buildRouteResults = (
  query: string,
  activeWorkspaceId: string | null
): OmniboxResult[] => {
  const routes = [
    {
      id: 'route:discover',
      title: 'Discover',
      subtitle: 'Route',
      keywords: 'discover feed search monitor leads',
    },
    {
      id: 'route:files',
      title: 'Files',
      subtitle: 'Route',
      keywords: 'files archives artifacts items library',
      actions: ['OPEN', 'OPEN_IN_FILES'] as OmniboxActionId[],
    },
    {
      id: 'route:monitor',
      title: 'Monitor',
      subtitle: 'Route',
      keywords: 'monitor signals live monitor headlines',
    },
    {
      id: 'route:settings',
      title: 'Settings',
      subtitle: 'Route',
      keywords: 'settings theme runtime models providers',
    },
    ...(activeWorkspaceId
      ? [
          {
            id: `route:workspace:${activeWorkspaceId}:chat`,
            title: 'Workspace Chat',
            subtitle: 'Route',
            keywords: 'chat conversation workspace chat',
          },
          {
            id: `route:workspace:${activeWorkspaceId}:board`,
            title: 'Workspace Board',
            subtitle: 'Route',
            keywords: 'board canvas workspace board',
          },
          {
            id: `route:workspace:${activeWorkspaceId}:timeline`,
            title: 'Workspace Timeline',
            subtitle: 'Route',
            keywords: 'timeline chronology history',
            actions: ['OPEN', 'OPEN_IN_TIMELINE'] as OmniboxActionId[],
          },
          {
            id: `route:workspace:${activeWorkspaceId}:network`,
            title: 'Workspace Network',
            subtitle: 'Route',
            keywords: 'network graph entities',
            actions: ['OPEN', 'OPEN_IN_NETWORK'] as OmniboxActionId[],
          },
        ]
      : []),
  ];

  return routes
    .map((route) => ({
      id: route.id,
      kind: 'ROUTE' as const,
      title: route.title,
      subtitle: route.subtitle,
      score: scoreTextMatch(query, [route.keywords, route.title], route.title) + 15,
      actions: route.actions || ['OPEN'],
      metadata: {
        routeId: route.id,
      },
    }))
    .filter((route) => route.score > 0);
};

export const buildWorkspaceResults = (query: string, workspaces: Workspace[]) =>
  workspaces
    .map((workspace) => {
      const title = getWorkspaceDisplayTitle(workspace);
      const score = scoreTextMatch(
        query,
        [
          workspace.title,
          title,
          workspace.description,
          workspace.launchTopic,
          workspace.launchAngle,
          workspace.prioritySourcesSummary,
        ],
        title
      );

      return {
        id: `workspace:${workspace.id}`,
        kind: 'WORKSPACE' as const,
        title,
        subtitle: 'Workspace',
        snippet: workspace.description || workspace.launchAngle || workspace.launchTopic,
        workspaceId: workspace.id,
        score: score + 20,
        timestamp: workspace.updatedAt || workspace.createdAt,
        actions: ['OPEN', 'OPEN_IN_CHAT', 'OPEN_IN_FILES'] as OmniboxActionId[],
      };
    })
    .filter((result) => result.score > 0);

export const buildSavedViewResults = (
  query: string,
  activeWorkspaceId: string | null,
  savedViews: TimelineSavedView[],
  workspaces: Workspace[]
) =>
  savedViews
    .filter((view) => !activeWorkspaceId || view.workspaceId === activeWorkspaceId)
    .map((view) => {
      const workspace = workspaces.find((entry) => entry.id === view.workspaceId);
      const score = scoreTextMatch(
        query,
        [
          view.title,
          buildTimelineSavedViewSnippet(view, workspace),
          view.query.search,
          view.query.filters.range,
          view.query.filters.tracks.join(' '),
          view.query.focusedTrack,
          view.query.focusedRefId,
        ],
        view.title
      );

      return {
        id: `saved-view:${view.id}`,
        kind: 'SAVED_VIEW' as const,
        title: view.title,
        subtitle: 'Saved view',
        snippet: buildTimelineSavedViewSnippet(view, workspace),
        workspaceId: view.workspaceId,
        refId: view.id,
        score: score + 16,
        timestamp: view.updatedAt,
        actions: ['OPEN', 'OPEN_IN_TIMELINE'] as OmniboxActionId[],
        metadata: {
          savedViewQuery: view.query,
        },
      };
    })
    .filter((result) => result.score > 0);

export const buildRunResults = (
  query: string,
  activeWorkspaceId: string | null,
  workspaceRuns: WorkspaceRun[]
) =>
  workspaceRuns
    .filter(
      (run) =>
        !activeWorkspaceId ||
        run.workspaceId === activeWorkspaceId ||
        run.report?.workspaceId === activeWorkspaceId
    )
    .map((run) => {
      const workspaceId = run.workspaceId || run.report?.workspaceId;
      const score = scoreTextMatch(
        query,
        [
          run.topic,
          run.status,
          run.config?.purposeName,
          run.config?.artifactType,
          run.config?.launchSource,
        ],
        run.topic
      );

      return {
        id: `run:${run.id}`,
        kind: 'RUN' as const,
        title: sanitizeDisplayTitle(run.topic),
        subtitle: 'Run',
        snippet: [run.status, run.config?.purposeName, run.config?.artifactType]
          .filter(Boolean)
          .join(' | '),
        workspaceId,
        refId: run.id,
        score: score + 12,
        timestamp: run.endTime || run.startTime,
        actions: workspaceId
          ? (['OPEN', 'OPEN_IN_TIMELINE'] as OmniboxActionId[])
          : (['OPEN'] as OmniboxActionId[]),
      };
    })
    .filter((result) => result.score > 0);

export const buildChatResults = (
  query: string,
  activeWorkspaceId: string | null,
  chatSessions: ChatSession[]
) =>
  chatSessions
    .filter((session) => !activeWorkspaceId || session.workspaceId === activeWorkspaceId)
    .map((session) => {
      const score = scoreTextMatch(
        query,
        [session.title, session.status, session.sourceArtifactId, session.packId, session.purposeId],
        session.title
      );

      return {
        id: `chat:${session.id}`,
        kind: 'CHAT_SESSION' as const,
        title: session.title || 'Workspace Chat',
        subtitle: 'Chat',
        snippet: [session.status, session.purposeId].filter(Boolean).join(' | ') || undefined,
        workspaceId: session.workspaceId,
        refId: session.id,
        score: score + 12,
        timestamp: session.updatedAt,
        actions: ['OPEN', 'OPEN_IN_TIMELINE'] as OmniboxActionId[],
      };
    })
    .filter((result) => result.score > 0);

export const mapWorkspaceSnippetToOmniboxResult = (
  snippet: WorkspaceContextSnippet,
  workspaceId: string
): OmniboxResult => {
  const kind = mapSnippetKindToResultKind(snippet);
  const actions: OmniboxActionId[] = ['OPEN'];

  if (
    kind === 'WORKSPACE_ITEM' ||
    kind === 'ARTIFACT' ||
    kind === 'FINDING' ||
    kind === 'SECTION' ||
    kind === 'SIGNAL' ||
    kind === 'ENTITY'
  ) {
    actions.push('OPEN_IN_CHAT');
  }
  if (
    kind === 'ARTIFACT' ||
    kind === 'FINDING' ||
    kind === 'SECTION' ||
    kind === 'SIGNAL' ||
    kind === 'ENTITY'
  ) {
    actions.push('OPEN_IN_TIMELINE');
  }
  if (kind === 'ENTITY') {
    actions.push('OPEN_IN_NETWORK');
  }
  if (
    kind === 'ARTIFACT' ||
    kind === 'FINDING' ||
    kind === 'ENTITY' ||
    kind === 'SIGNAL' ||
    kind === 'SOURCE' ||
    kind === 'WORKSPACE_ITEM'
  ) {
    actions.push('PLACE_ON_BOARD');
  }
  if (kind === 'ARTIFACT' || kind === 'WORKSPACE_ITEM') {
    actions.push('OPEN_IN_FILES');
  }

  return {
    id: `snippet:${snippet.id}`,
    kind,
    title: snippet.title,
    subtitle:
      kind === 'WORKSPACE_ITEM'
        ? String(snippet.metadata?.workspaceItemKind || 'Item')
        : kind === 'ARTIFACT'
          ? 'Artifact'
          : kind === 'FINDING'
            ? 'Finding'
          : kind === 'SECTION'
            ? 'Section'
            : kind === 'SOURCE'
              ? 'Source'
              : kind === 'ENTITY'
                ? 'Entity'
                : 'Signal',
    snippet: snippet.snippet,
    workspaceId,
    artifactId:
      kind === 'ARTIFACT' || kind === 'SECTION' || kind === 'SOURCE'
        ? snippet.refId
        : kind === 'FINDING' && typeof snippet.metadata?.originArtifactId === 'string'
          ? snippet.metadata.originArtifactId
        : typeof snippet.metadata?.linkedArtifactId === 'string'
          ? snippet.metadata.linkedArtifactId
          : undefined,
    refId:
      kind === 'ENTITY' && typeof snippet.metadata?.entityName === 'string'
        ? snippet.metadata.entityName
        : snippet.refId,
    score: snippet.score + 30,
    timestamp: snippet.timestamp,
    actions,
    metadata: snippet.metadata,
  };
};

export const buildWorkspaceItemRecentResult = (
  item: WorkspaceItem,
  prefix: string,
  score: number,
  timestamp: number
): OmniboxResult => ({
  id: `${prefix}:${item.id}`,
  kind: 'WORKSPACE_ITEM',
  title: item.title,
  subtitle: `Recent ${item.kind.toLowerCase()}`,
  snippet: buildWorkspaceItemSnippet(item),
  workspaceId: item.workspaceId,
  refId: item.id,
  score,
  timestamp,
  actions: ['OPEN', 'OPEN_IN_CHAT', 'PLACE_ON_BOARD', 'OPEN_IN_FILES'],
  metadata: {
    workspaceItemKind: item.kind,
  },
});
