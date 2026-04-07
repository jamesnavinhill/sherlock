import type {
  Artifact,
  ChatMentionReference,
  ChatSession,
  Headline,
  Workspace,
  WorkspaceContextSnippet,
  WorkspaceItem,
  WorkspaceRun,
} from '@/types';
import { getWorkspaceDisplayTitle, sanitizeDisplayTitle } from '@/domain';
import type { StoredOmniboxRecent } from '@/utils/localStorage';
import { findMentionMatches } from '@/services/chat/mentions';

export type OmniboxResultKind =
  | 'ROUTE'
  | 'WORKSPACE'
  | 'ARTIFACT'
  | 'SECTION'
  | 'SOURCE'
  | 'ENTITY'
  | 'SIGNAL'
  | 'CHAT_SESSION'
  | 'RUN'
  | 'WORKSPACE_ITEM';

export type OmniboxActionId =
  | 'OPEN'
  | 'OPEN_IN_CHAT'
  | 'PLACE_ON_BOARD'
  | 'OPEN_IN_TIMELINE'
  | 'OPEN_IN_NETWORK'
  | 'OPEN_IN_FILES';

export interface OmniboxResult {
  id: string;
  kind: OmniboxResultKind;
  title: string;
  subtitle: string;
  snippet?: string;
  workspaceId?: string;
  artifactId?: string;
  refId?: string;
  score: number;
  timestamp?: number;
  actions: OmniboxActionId[];
  metadata?: Record<string, unknown>;
}

interface BuildOmniboxResultsInput {
  query: string;
  activeWorkspaceId: string | null;
  artifacts: Artifact[];
  chatSessions: ChatSession[];
  snippets: WorkspaceContextSnippet[];
  storedRecents?: StoredOmniboxRecent[];
  workspaceItems: WorkspaceItem[];
  workspaceRuns: WorkspaceRun[];
  workspaces: Workspace[];
}

const normalize = (value: string) => value.trim().toLowerCase();

const tokenize = (value: string) =>
  normalize(value)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

const scoreTextMatch = (query: string, fields: Array<string | undefined>, title = '') => {
  const normalizedQuery = normalize(query);
  const tokens = tokenize(query);
  const haystack = fields.filter(Boolean).join(' ').toLowerCase();
  const lowerTitle = title.toLowerCase();

  let score = 0;

  if (!normalizedQuery && tokens.length === 0) {
    return 1;
  }
  if (normalizedQuery && lowerTitle.includes(normalizedQuery)) {
    score += 80;
  }
  if (normalizedQuery && haystack.includes(normalizedQuery)) {
    score += 40;
  }

  tokens.forEach((token) => {
    if (lowerTitle.includes(token)) score += 18;
    if (haystack.includes(token)) score += 8;
  });

  return score;
};

const dedupeResults = (results: OmniboxResult[]) => {
  const byId = new Map<string, OmniboxResult>();

  results.forEach((result) => {
    const existing = byId.get(result.id);
    if (!existing || existing.score < result.score) {
      byId.set(result.id, result);
    }
  });

  return Array.from(byId.values()).sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if ((right.timestamp || 0) !== (left.timestamp || 0)) {
      return (right.timestamp || 0) - (left.timestamp || 0);
    }
    return left.title.localeCompare(right.title);
  });
};

const buildRouteResults = (
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

const buildWorkspaceResults = (query: string, workspaces: Workspace[]) =>
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

const buildRunResults = (
  query: string,
  activeWorkspaceId: string | null,
  workspaceRuns: WorkspaceRun[]
) =>
  workspaceRuns
    .filter(
      (run) =>
        !activeWorkspaceId ||
        run.workspaceId === activeWorkspaceId ||
        run.report?.caseId === activeWorkspaceId
    )
    .map((run) => {
      const workspaceId = run.workspaceId || run.report?.caseId;
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

const buildChatResults = (
  query: string,
  activeWorkspaceId: string | null,
  chatSessions: ChatSession[]
) =>
  chatSessions
    .filter((session) => !activeWorkspaceId || session.workspaceId === activeWorkspaceId)
    .map((session) => {
      const score = scoreTextMatch(
        query,
        [session.title, session.status, session.sourceReportId, session.packId, session.purposeId],
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

const mapSnippetKindToResultKind = (
  snippet: WorkspaceContextSnippet
): OmniboxResultKind => {
  switch (snippet.kind) {
    case 'REPORT':
      return 'ARTIFACT';
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

export const mapWorkspaceSnippetToOmniboxResult = (
  snippet: WorkspaceContextSnippet,
  workspaceId: string
): OmniboxResult => {
  const kind = mapSnippetKindToResultKind(snippet);
  const actions: OmniboxActionId[] = ['OPEN'];

  if (
    kind === 'WORKSPACE_ITEM' ||
    kind === 'ARTIFACT' ||
    kind === 'SECTION' ||
    kind === 'SIGNAL' ||
    kind === 'ENTITY'
  ) {
    actions.push('OPEN_IN_CHAT');
  }
  if (kind === 'ARTIFACT' || kind === 'SECTION' || kind === 'SIGNAL' || kind === 'ENTITY') {
    actions.push('OPEN_IN_TIMELINE');
  }
  if (kind === 'ENTITY') {
    actions.push('OPEN_IN_NETWORK');
  }
  if (
    kind === 'ARTIFACT' ||
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
        : typeof snippet.metadata?.linkedReportId === 'string'
          ? snippet.metadata.linkedReportId
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

export const buildRecentOmniboxResults = ({
  activeWorkspaceId,
  artifacts,
  chatSessions,
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
          title: getWorkspaceDisplayTitle(workspace),
          subtitle: 'Recent workspace',
          workspaceId: workspace.id,
          score: 120 - index,
          timestamp: recent.visitedAt,
          actions: ['OPEN', 'OPEN_IN_CHAT', 'OPEN_IN_FILES'],
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
          workspaceId: artifact.caseId,
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
          actions: ['OPEN', 'OPEN_IN_TIMELINE'],
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
          workspaceId: run.workspaceId || run.report?.caseId,
          refId: run.id,
          score: 114 - index,
          timestamp: recent.visitedAt,
          actions: ['OPEN', 'OPEN_IN_TIMELINE'],
        };
      }

      if (recent.kind === 'WORKSPACE_ITEM') {
        const item = workspaceItems.find((entry) => entry.id === recent.refId);
        if (!item) return null;
        return {
          id: `stored-recent-item:${item.id}`,
          kind: 'WORKSPACE_ITEM',
          title: item.title,
          subtitle: `Recent ${item.kind.toLowerCase()}`,
          snippet: item.description || item.textContent || item.url,
          workspaceId: item.workspaceId,
          refId: item.id,
          score: 112 - index,
          timestamp: recent.visitedAt,
          actions: ['OPEN', 'OPEN_IN_CHAT', 'PLACE_ON_BOARD', 'OPEN_IN_FILES'],
          metadata: {
            workspaceItemKind: item.kind,
          },
        };
      }

      return null;
    })
    .filter((result): result is OmniboxResult => !!result);

  const recentWorkspaceResults = workspaces
    .slice()
    .sort((left, right) => (right.updatedAt || right.createdAt || 0) - (left.updatedAt || left.createdAt || 0))
    .slice(0, 3)
    .map((workspace, index) => ({
      id: `recent-workspace:${workspace.id}`,
      kind: 'WORKSPACE' as const,
      title: getWorkspaceDisplayTitle(workspace),
      subtitle: index === 0 ? 'Recent workspace' : 'Workspace',
      workspaceId: workspace.id,
      score: 90 - index,
      timestamp: workspace.updatedAt || workspace.createdAt,
      actions: ['OPEN', 'OPEN_IN_CHAT', 'OPEN_IN_FILES'] as OmniboxActionId[],
    }));

  const scopedArtifacts = artifacts
    .filter((artifact) => !activeWorkspaceId || artifact.caseId === activeWorkspaceId)
    .slice()
    .sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0))
    .slice(0, 3)
    .map((artifact, index) => ({
      id: `recent-artifact:${artifact.id || artifact.topic}:${index}`,
      kind: 'ARTIFACT' as const,
      title: sanitizeDisplayTitle(artifact.topic),
      subtitle: 'Recent artifact',
      snippet: artifact.summary,
      workspaceId: artifact.caseId,
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
    .map((item, index) => ({
      id: `recent-item:${item.id}`,
      kind: 'WORKSPACE_ITEM' as const,
      title: item.title,
      subtitle: `Recent ${item.kind.toLowerCase()}`,
      snippet: item.description || item.textContent || item.url,
      workspaceId: item.workspaceId,
      refId: item.id,
      score: 86 - index,
      timestamp: item.updatedAt,
      actions: ['OPEN', 'OPEN_IN_CHAT', 'PLACE_ON_BOARD', 'OPEN_IN_FILES'] as OmniboxActionId[],
      metadata: {
        workspaceItemKind: item.kind,
      },
    }));

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
        run.report?.caseId === activeWorkspaceId
    )
    .slice()
    .sort((left, right) => (right.endTime || right.startTime || 0) - (left.endTime || left.startTime || 0))
    .slice(0, 2)
    .map((run, index) => ({
      id: `recent-run:${run.id}`,
      kind: 'RUN' as const,
      title: sanitizeDisplayTitle(run.topic),
      subtitle: 'Recent run',
      workspaceId: run.workspaceId || run.report?.caseId,
      refId: run.id,
      score: 82 - index,
      timestamp: run.endTime || run.startTime,
      actions: ['OPEN', 'OPEN_IN_TIMELINE'] as OmniboxActionId[],
    }));

  return dedupeResults([
    ...storedRecentResults,
    ...recentWorkspaceResults,
    ...scopedArtifacts,
    ...scopedItems,
    ...recentChats,
    ...recentRuns,
  ]).slice(0, 10);
};

export const buildOmniboxResults = ({
  query,
  activeWorkspaceId,
  artifacts,
  chatSessions,
  snippets,
  storedRecents,
  workspaceItems,
  workspaceRuns,
  workspaces,
}: BuildOmniboxResultsInput): OmniboxResult[] => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return buildRecentOmniboxResults({
      activeWorkspaceId,
      artifacts,
      chatSessions,
      storedRecents,
      workspaceItems,
      workspaceRuns,
      workspaces,
    });
  }

  const workspaceScopedId =
    activeWorkspaceId ||
    snippets.find((snippet) => snippet.refId)?.metadata?.workspaceId;

  return dedupeResults([
    ...buildRouteResults(trimmedQuery, activeWorkspaceId),
    ...buildWorkspaceResults(trimmedQuery, workspaces),
    ...buildRunResults(trimmedQuery, activeWorkspaceId, workspaceRuns),
    ...buildChatResults(trimmedQuery, activeWorkspaceId, chatSessions),
    ...snippets
      .filter(() => !!activeWorkspaceId || !!workspaceScopedId)
      .map((snippet) => mapWorkspaceSnippetToOmniboxResult(snippet, activeWorkspaceId || String(workspaceScopedId))),
  ]).slice(0, 14);
};

export const buildMentionCandidates = (input: {
  workspaceId: string;
  artifacts: Artifact[];
  signals: Headline[];
  workspaceItems: WorkspaceItem[];
}): ChatMentionReference[] => {
  const artifactCandidates = input.artifacts
    .filter((artifact): artifact is Artifact & { id: string } =>
      artifact.caseId === input.workspaceId && typeof artifact.id === 'string' && artifact.id.length > 0
    )
    .map((artifact) => ({
      id: `artifact:${artifact.id}`,
      workspaceId: input.workspaceId,
      kind: 'ARTIFACT' as const,
      refId: artifact.id,
      title: sanitizeDisplayTitle(artifact.topic),
      subtitle: 'Artifact',
      snippet: artifact.summary,
      metadata: {
        artifactType: artifact.artifactType,
      },
    }));

  const entityCandidates = new Map<string, ChatMentionReference>();
  input.artifacts
    .filter((artifact) => artifact.caseId === input.workspaceId)
    .forEach((artifact) => {
      artifact.entities.forEach((entity) => {
        const title = typeof entity === 'string' ? sanitizeDisplayTitle(entity) : entity.name;
        const key = title.trim().toLowerCase();
        if (!key || entityCandidates.has(key)) return;
        entityCandidates.set(key, {
          id: `entity:${key}`,
          workspaceId: input.workspaceId,
          kind: 'ENTITY',
          refId: key,
          title,
          subtitle: 'Entity',
          snippet: artifact.topic,
        });
      });
    });

  const signalCandidates = input.signals
    .filter((signal) => signal.caseId === input.workspaceId)
    .map((signal) => ({
      id: `signal:${signal.id}`,
      workspaceId: input.workspaceId,
      kind: 'SIGNAL' as const,
      refId: signal.id,
      title: sanitizeDisplayTitle(signal.source || signal.content),
      subtitle: 'Signal',
      snippet: signal.content,
      metadata: {
        signalType: signal.type,
        threatLevel: signal.threatLevel,
        linkedReportId: signal.linkedReportId,
      },
    }));

  const itemCandidates = input.workspaceItems
    .filter((item) => item.workspaceId === input.workspaceId)
    .map((item) => ({
      id: `item:${item.id}`,
      workspaceId: input.workspaceId,
      kind: 'WORKSPACE_ITEM' as const,
      refId: item.id,
      title: item.title,
      subtitle: item.kind,
      snippet: item.description || item.textContent || item.url,
      metadata: {
        workspaceItemKind: item.kind,
        url: item.url,
      },
    }));

  return dedupeResults(
    [...itemCandidates, ...artifactCandidates, ...Array.from(entityCandidates.values()), ...signalCandidates].map(
      (candidate, index) => ({
        id: candidate.id,
        kind:
          candidate.kind === 'ARTIFACT'
            ? ('ARTIFACT' as const)
            : candidate.kind === 'ENTITY'
              ? ('ENTITY' as const)
              : candidate.kind === 'SIGNAL'
                ? ('SIGNAL' as const)
                : ('WORKSPACE_ITEM' as const),
        title: candidate.title,
        subtitle: candidate.subtitle,
        snippet: candidate.snippet,
        workspaceId: candidate.workspaceId,
        refId: candidate.refId,
        score: 100 - index,
        actions: ['OPEN'] as OmniboxActionId[],
        metadata: candidate.metadata,
      })
    )
  ).map((candidate) => ({
    id: candidate.id,
    workspaceId: candidate.workspaceId || input.workspaceId,
    kind:
      candidate.kind === 'ARTIFACT'
        ? 'ARTIFACT'
        : candidate.kind === 'ENTITY'
          ? 'ENTITY'
          : candidate.kind === 'SIGNAL'
            ? 'SIGNAL'
            : 'WORKSPACE_ITEM',
    refId: candidate.refId || candidate.id,
    title: candidate.title,
    subtitle: candidate.subtitle,
    snippet: candidate.snippet,
    metadata: candidate.metadata,
  }));
};

export const resolveMentionQuery = (
  draft: string,
  selectionStart: number,
  candidates: ChatMentionReference[]
) => {
  const prefix = draft.slice(0, selectionStart);
  const match = prefix.match(/(?:^|\s)@([^\n@]*)$/);
  if (!match) {
    return null;
  }

  const query = match[1].trim().toLowerCase();
  const filtered = candidates.filter((candidate) => {
    if (!query) return true;
    const haystack = `${candidate.title} ${candidate.subtitle}`.toLowerCase();
    return haystack.includes(query);
  });

  return {
    query,
    rangeStart: prefix.length - match[1].length - 1,
    rangeEnd: selectionStart,
    results: filtered.slice(0, 6),
  };
};

export const applyMentionSelection = (
  draft: string,
  selectionStart: number,
  selectionEnd: number,
  candidate: ChatMentionReference
) => {
  const resolved = resolveMentionQuery(draft, selectionStart, [candidate]);
  if (!resolved) return null;

  return `${draft.slice(0, resolved.rangeStart)}@${candidate.title} ${draft.slice(selectionEnd)}`;
};

export const resolveDraftMentions = (
  draft: string,
  candidates: ChatMentionReference[]
): ChatMentionReference[] => {
  const matches = findMentionMatches(draft, candidates);
  const seen = new Set<string>();

  return matches.reduce<ChatMentionReference[]>((acc, match) => {
    const key = `${match.mention.kind}:${match.mention.refId}`;
    if (seen.has(key)) return acc;
    seen.add(key);
    acc.push(match.mention);
    return acc;
  }, []);
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
