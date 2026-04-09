export type SherlockRouteId =
  | 'DISCOVER'
  | 'MONITOR'
  | 'FILES'
  | 'RUN_DETAIL'
  | 'SETTINGS'
  | 'WORKSPACE_HOME'
  | 'WORKSPACE_ARTIFACT'
  | 'WORKSPACE_CHAT'
  | 'WORKSPACE_CHAT_SESSION'
  | 'WORKSPACE_BOARD'
  | 'WORKSPACE_BOARD_DOCUMENT'
  | 'WORKSPACE_TIMELINE'
  | 'WORKSPACE_NETWORK';

export type SherlockRouteScope = 'GLOBAL' | 'WORKSPACE';

export type SherlockRouteParamKey = 'workspaceId' | 'artifactId' | 'sessionId' | 'boardId' | 'runId';

export type SherlockRouteQueryKey =
  | 'search'
  | 'range'
  | 'tracks'
  | 'focusTrack'
  | 'focusRefId'
  | 'workspaceId'
  | 'focusItemId'
  | 'focusSectionId'
  | 'focusEvidenceId'
  | 'inspector'
  | 'focusEntity';

export type WorkspaceArtifactInspectorMode = 'ENTITY' | 'HEADLINE' | 'REPORT';

export interface FilesRouteState {
  workspaceId?: string;
  focusItemId?: string;
}

export interface ArtifactRouteState {
  focusSectionId?: string;
  focusEvidenceId?: string;
  inspector?: WorkspaceArtifactInspectorMode;
}

export interface NetworkRouteState {
  focusEntity?: string;
}

export interface SherlockRouteDefinition {
  id: SherlockRouteId;
  path: string;
  scope: SherlockRouteScope;
  description: string;
  urlParams: readonly SherlockRouteParamKey[];
  urlQuery: readonly SherlockRouteQueryKey[];
  storeState: readonly string[];
}

export type WorkspaceSurfaceRoute =
  | { surface: 'HOME'; workspaceId: string }
  | { surface: 'ARTIFACT'; workspaceId: string; artifactId: string }
  | { surface: 'CHAT'; workspaceId: string }
  | { surface: 'CHAT_SESSION'; workspaceId: string; sessionId: string }
  | { surface: 'BOARD'; workspaceId: string }
  | { surface: 'BOARD_DOCUMENT'; workspaceId: string; boardId: string }
  | { surface: 'TIMELINE'; workspaceId: string }
  | { surface: 'NETWORK'; workspaceId: string };

const encodeRouteSegment = (value: string): string => encodeURIComponent(value.trim());

const normalizeQueryValue = (value?: string | null) => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const buildQueryString = (
  entries: Array<[SherlockRouteQueryKey, string | undefined]>
): string => {
  const params = new URLSearchParams();

  entries.forEach(([key, value]) => {
    const normalized = normalizeQueryValue(value);
    if (normalized) {
      params.set(key, normalized);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
};

const buildWorkspaceBasePath = (workspaceId: string): string =>
  `/workspaces/${encodeRouteSegment(workspaceId)}`;

export const SHERLOCK_ROUTE_DEFINITIONS: Record<SherlockRouteId, SherlockRouteDefinition> = {
  DISCOVER: {
    id: 'DISCOVER',
    path: '/discover',
    scope: 'GLOBAL',
    description: 'Discovery surface for scans, presets, and run launch entry.',
    urlParams: [],
    urlQuery: [],
    storeState: ['feed scanner settings', 'polling cadence', 'launch form drafts'],
  },
  MONITOR: {
    id: 'MONITOR',
    path: '/monitor',
    scope: 'GLOBAL',
    description: 'Live monitor surface for real-time event discovery and save flows.',
    urlParams: [],
    urlQuery: [],
    storeState: ['monitor filters', 'autosave preference', 'hydrated live event state'],
  },
  FILES: {
    id: 'FILES',
    path: '/files',
    scope: 'GLOBAL',
    description: 'Workspace files and canonical record retrieval surface.',
    urlParams: [],
    urlQuery: ['workspaceId', 'focusItemId'],
    storeState: ['archive search input', 'sort mode', 'drawer visibility'],
  },
  RUN_DETAIL: {
    id: 'RUN_DETAIL',
    path: '/runs/:runId',
    scope: 'GLOBAL',
    description: 'Transient or persisted run detail surface for active execution state and handoff.',
    urlParams: ['runId'],
    urlQuery: [],
    storeState: ['selected background task handling', 'temporary report fallback selection'],
  },
  SETTINGS: {
    id: 'SETTINGS',
    path: '/settings',
    scope: 'GLOBAL',
    description: 'Application settings, provider keys, templates, and theme controls.',
    urlParams: [],
    urlQuery: [],
    storeState: ['settings tab selection', 'unsaved form state', 'key visibility toggles'],
  },
  WORKSPACE_HOME: {
    id: 'WORKSPACE_HOME',
    path: '/workspaces/:workspaceId',
    scope: 'WORKSPACE',
    description: 'Canonical workspace landing route and future overview/default surface anchor.',
    urlParams: ['workspaceId'],
    urlQuery: [],
    storeState: ['default landing artifact resolution', 'workspace summary panel state'],
  },
  WORKSPACE_ARTIFACT: {
    id: 'WORKSPACE_ARTIFACT',
    path: '/workspaces/:workspaceId/artifacts/:artifactId',
    scope: 'WORKSPACE',
    description: 'Artifact detail surface replacing shell-only investigation/report selection.',
    urlParams: ['workspaceId', 'artifactId'],
    urlQuery: ['focusSectionId', 'focusEvidenceId', 'inspector'],
    storeState: [
      'dossier and inspector panel visibility',
      'entity or signal inspector selection',
      'task setup modal state',
    ],
  },
  WORKSPACE_CHAT: {
    id: 'WORKSPACE_CHAT',
    path: '/workspaces/:workspaceId/chat',
    scope: 'WORKSPACE',
    description: 'Workspace chat landing route when no specific session is deep-linked.',
    urlParams: ['workspaceId'],
    urlQuery: [],
    storeState: ['draft composer text', 'panel visibility', 'generation status'],
  },
  WORKSPACE_CHAT_SESSION: {
    id: 'WORKSPACE_CHAT_SESSION',
    path: '/workspaces/:workspaceId/chat/:sessionId',
    scope: 'WORKSPACE',
    description: 'Workspace chat route scoped to a specific persisted session.',
    urlParams: ['workspaceId', 'sessionId'],
    urlQuery: [],
    storeState: [
      'draft composer text',
      'panel visibility',
      'generation status',
      'expanded attachment cards',
    ],
  },
  WORKSPACE_BOARD: {
    id: 'WORKSPACE_BOARD',
    path: '/workspaces/:workspaceId/board',
    scope: 'WORKSPACE',
    description: 'Workspace board landing route when no specific board id is deep-linked.',
    urlParams: ['workspaceId'],
    urlQuery: [],
    storeState: ['panel visibility', 'selected library entries', 'agent prompt draft'],
  },
  WORKSPACE_BOARD_DOCUMENT: {
    id: 'WORKSPACE_BOARD_DOCUMENT',
    path: '/workspaces/:workspaceId/board/:boardId',
    scope: 'WORKSPACE',
    description: 'Workspace board route scoped to a specific named board/document.',
    urlParams: ['workspaceId', 'boardId'],
    urlQuery: [],
    storeState: ['panel visibility', 'selected library entries', 'agent prompt draft'],
  },
  WORKSPACE_TIMELINE: {
    id: 'WORKSPACE_TIMELINE',
    path: '/workspaces/:workspaceId/timeline',
    scope: 'WORKSPACE',
    description: 'Workspace chronology surface with shareable search and filter state.',
    urlParams: ['workspaceId'],
    urlQuery: ['search', 'range', 'tracks', 'focusTrack', 'focusRefId'],
    storeState: [
      'dossier and details drawer visibility',
      'transient selected event state',
      'export menu visibility',
    ],
  },
  WORKSPACE_NETWORK: {
    id: 'WORKSPACE_NETWORK',
    path: '/workspaces/:workspaceId/network',
    scope: 'WORKSPACE',
    description: 'Workspace network graph surface and node inspection workflow.',
    urlParams: ['workspaceId'],
    urlQuery: ['focusEntity'],
    storeState: ['inspector drawer state', 'hidden and flagged node sets', 'graph viewport state'],
  },
};

export const DEFAULT_APP_ROUTE_ID: SherlockRouteId = 'FILES';
export const DEFAULT_APP_PATH = SHERLOCK_ROUTE_DEFINITIONS[DEFAULT_APP_ROUTE_ID].path;

export const GLOBAL_ROUTE_IDS: readonly SherlockRouteId[] = [
  'DISCOVER',
  'MONITOR',
  'FILES',
  'RUN_DETAIL',
  'SETTINGS',
];

export const WORKSPACE_ROUTE_IDS: readonly SherlockRouteId[] = [
  'WORKSPACE_HOME',
  'WORKSPACE_ARTIFACT',
  'WORKSPACE_CHAT',
  'WORKSPACE_CHAT_SESSION',
  'WORKSPACE_BOARD',
  'WORKSPACE_BOARD_DOCUMENT',
  'WORKSPACE_TIMELINE',
  'WORKSPACE_NETWORK',
];

export const buildDiscoverPath = (): string => SHERLOCK_ROUTE_DEFINITIONS.DISCOVER.path;

export const buildMonitorPath = (): string => SHERLOCK_ROUTE_DEFINITIONS.MONITOR.path;

export const buildFilesPath = (routeState?: FilesRouteState): string =>
  `${SHERLOCK_ROUTE_DEFINITIONS.FILES.path}${buildQueryString([
    ['workspaceId', routeState?.workspaceId],
    ['focusItemId', routeState?.focusItemId],
  ])}`;

export const buildRunPath = (runId: string): string => `/runs/${encodeRouteSegment(runId)}`;

export const buildSettingsPath = (): string => SHERLOCK_ROUTE_DEFINITIONS.SETTINGS.path;

export const buildWorkspaceHomePath = (workspaceId: string): string =>
  buildWorkspaceBasePath(workspaceId);

export const buildWorkspaceArtifactPath = (
  workspaceId: string,
  artifactId: string,
  routeState?: ArtifactRouteState
): string =>
  `${buildWorkspaceBasePath(workspaceId)}/artifacts/${encodeRouteSegment(artifactId)}${buildQueryString([
    ['focusSectionId', routeState?.focusSectionId],
    ['focusEvidenceId', routeState?.focusEvidenceId],
    ['inspector', routeState?.inspector],
  ])}`;

export const buildWorkspaceChatPath = (workspaceId: string): string =>
  `${buildWorkspaceBasePath(workspaceId)}/chat`;

export const buildWorkspaceChatSessionPath = (workspaceId: string, sessionId: string): string =>
  `${buildWorkspaceChatPath(workspaceId)}/${encodeRouteSegment(sessionId)}`;

export const buildWorkspaceBoardPath = (workspaceId: string): string =>
  `${buildWorkspaceBasePath(workspaceId)}/board`;

export const buildWorkspaceBoardDocumentPath = (workspaceId: string, boardId: string): string =>
  `${buildWorkspaceBoardPath(workspaceId)}/${encodeRouteSegment(boardId)}`;

export const buildWorkspaceTimelinePath = (workspaceId: string): string =>
  `${buildWorkspaceBasePath(workspaceId)}/timeline`;

export const buildWorkspaceNetworkPath = (
  workspaceId: string,
  routeState?: NetworkRouteState
): string =>
  `${buildWorkspaceBasePath(workspaceId)}/network${buildQueryString([
    ['focusEntity', routeState?.focusEntity],
  ])}`;

export const parseFilesRouteState = (searchParams: URLSearchParams): FilesRouteState => ({
  workspaceId: normalizeQueryValue(searchParams.get('workspaceId')),
  focusItemId: normalizeQueryValue(searchParams.get('focusItemId')),
});

export const parseArtifactRouteState = (searchParams: URLSearchParams): ArtifactRouteState => {
  const inspector = normalizeQueryValue(searchParams.get('inspector'));

  return {
    focusSectionId: normalizeQueryValue(searchParams.get('focusSectionId')),
    focusEvidenceId: normalizeQueryValue(searchParams.get('focusEvidenceId')),
    inspector:
      inspector === 'ENTITY' || inspector === 'HEADLINE' || inspector === 'REPORT'
        ? inspector
        : undefined,
  };
};

export const parseNetworkRouteState = (searchParams: URLSearchParams): NetworkRouteState => ({
  focusEntity: normalizeQueryValue(searchParams.get('focusEntity')),
});

export const buildWorkspaceSurfacePath = (target: WorkspaceSurfaceRoute): string => {
  switch (target.surface) {
    case 'HOME':
      return buildWorkspaceHomePath(target.workspaceId);
    case 'ARTIFACT':
      return buildWorkspaceArtifactPath(target.workspaceId, target.artifactId);
    case 'CHAT':
      return buildWorkspaceChatPath(target.workspaceId);
    case 'CHAT_SESSION':
      return buildWorkspaceChatSessionPath(target.workspaceId, target.sessionId);
    case 'BOARD':
      return buildWorkspaceBoardPath(target.workspaceId);
    case 'BOARD_DOCUMENT':
      return buildWorkspaceBoardDocumentPath(target.workspaceId, target.boardId);
    case 'TIMELINE':
      return buildWorkspaceTimelinePath(target.workspaceId);
    case 'NETWORK':
      return buildWorkspaceNetworkPath(target.workspaceId);
  }
};

export const getRouteDefinition = (routeId: SherlockRouteId): SherlockRouteDefinition =>
  SHERLOCK_ROUTE_DEFINITIONS[routeId];

export const getGlobalRouteDefinitions = (): SherlockRouteDefinition[] =>
  GLOBAL_ROUTE_IDS.map((routeId) => SHERLOCK_ROUTE_DEFINITIONS[routeId]);

export const getWorkspaceRouteDefinitions = (): SherlockRouteDefinition[] =>
  WORKSPACE_ROUTE_IDS.map((routeId) => SHERLOCK_ROUTE_DEFINITIONS[routeId]);
