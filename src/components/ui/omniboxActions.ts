import { findWorkspaceLandingArtifact } from '@/app/navigation';
import { openWorkspaceChatRequest } from '@/app/openChatRequest';
import {
  type ArtifactRouteState,
  buildDiscoverPath,
  buildFilesPath,
  buildMonitorPath,
  buildRunPath,
  buildSettingsPath,
  buildWorkspaceArtifactPath,
  buildWorkspaceBoardPath,
  buildWorkspaceChatPath,
  buildWorkspaceChatSessionPath,
  buildWorkspaceHomePath,
  buildWorkspaceNetworkPath,
  buildWorkspaceTimelinePath,
} from '@/app/routes';
import {
  buildTimelineRouteQuery,
  parseTimelineRouteQuery,
  type TimelineRouteQueryState,
} from '@/components/features/Timeline/timelineRouteState';
import {
  buildArtifactBoardReference,
  buildArtifactChatOpenRequest,
  buildEntityBoardReference,
  buildEntityChatOpenRequest,
  buildSignalBoardReference,
  buildSignalChatOpenRequest,
  buildSourceBoardReference,
  buildWorkspaceItemBoardReference,
  buildWorkspaceItemChatOpenRequest,
  queueWorkspaceReferenceOnBoard,
} from '@/services/workspace/workspaceHandoffs';
import { requestNetworkEntityFocus } from '@/services/workspace/workspaceSurfaceFocus';
import type {
  Artifact,
  ChatMessage,
  ChatOpenRequest,
  ChatSession,
  Headline,
  Workspace,
  WorkspaceItem,
  WorkspaceRun,
} from '@/types';
import type { OmniboxActionId, OmniboxResult } from './omniboxModel';

const isTimelinePathForWorkspace = (pathname: string, workspaceId: string) =>
  pathname === buildWorkspaceTimelinePath(workspaceId);

const isBoardPathForWorkspace = (pathname: string, workspaceId: string) => {
  const boardPath = buildWorkspaceBoardPath(workspaceId);
  return pathname === boardPath || pathname.startsWith(`${boardPath}/`);
};

const isNetworkPathForWorkspace = (pathname: string, workspaceId: string) =>
  pathname === buildWorkspaceNetworkPath(workspaceId);

const buildTimelineFocusedPath = (
  locationSearch: string,
  workspaceId: string,
  track: 'SIGNAL' | 'RUN' | 'ARTIFACT' | 'CHAT' | 'ENTITY' | 'ITEM',
  refId?: string
) => {
  const params = parseTimelineRouteQuery(new URLSearchParams(locationSearch));
  const next = buildTimelineRouteQuery({
    ...params,
    focusedTrack: track === 'ITEM' ? 'ITEM' : track,
    focusedRefId: refId,
  });
  const query = next.toString();
  return `${buildWorkspaceTimelinePath(workspaceId)}${query ? `?${query}` : ''}`;
};

const resolveTimelineFocus = (
  result: OmniboxResult
): { track: 'SIGNAL' | 'RUN' | 'ARTIFACT' | 'CHAT' | 'ENTITY' | 'ITEM'; refId?: string } | null => {
  switch (result.kind) {
    case 'ARTIFACT':
    case 'SECTION':
    case 'SOURCE':
      return {
        track: 'ARTIFACT',
        refId: result.artifactId || result.refId,
      };
    case 'SIGNAL':
      return {
        track: 'SIGNAL',
        refId: result.refId,
      };
    case 'RUN':
      return {
        track: 'RUN',
        refId: result.refId,
      };
    case 'CHAT_SESSION':
      return {
        track: 'CHAT',
        refId: result.refId,
      };
    case 'ENTITY':
      return {
        track: 'ENTITY',
        refId:
          typeof result.metadata?.entityName === 'string'
            ? result.metadata.entityName
            : result.title,
      };
    case 'WORKSPACE_ITEM':
      return {
        track: 'ITEM',
        refId: result.refId,
      };
    default:
      return null;
  }
};

const resolveArtifactRouteState = (result: OmniboxResult): ArtifactRouteState | undefined => {
  if (result.kind !== 'ARTIFACT' && result.kind !== 'SECTION' && result.kind !== 'SOURCE') {
    return undefined;
  }

  const focusSectionId =
    typeof result.metadata?.sectionId === 'string' ? result.metadata.sectionId : undefined;
  const focusEvidenceId =
    typeof result.metadata?.evidenceId === 'string' ? result.metadata.evidenceId : undefined;

  if (!focusSectionId && !focusEvidenceId) {
    return undefined;
  }

  return {
    focusSectionId,
    focusEvidenceId,
    inspector: 'REPORT',
  };
};

const buildChatOpenRequestForResult = (input: {
  headlines: Headline[];
  result: OmniboxResult;
  workspaceItems: WorkspaceItem[];
}): ChatOpenRequest | null => {
  const { headlines, result, workspaceItems } = input;
  if (!result.workspaceId) return null;

  if (result.kind === 'WORKSPACE') {
    return {
      workspaceId: result.workspaceId,
    };
  }

  if (result.kind === 'CHAT_SESSION' && result.refId) {
    return {
      workspaceId: result.workspaceId,
      sessionId: result.refId,
    };
  }

  if ((result.kind === 'ARTIFACT' || result.kind === 'SECTION') && (result.artifactId || result.refId)) {
    return buildArtifactChatOpenRequest({
      id: result.artifactId || result.refId,
      workspaceId: result.workspaceId,
      topic: result.title,
      summary: result.snippet || '',
      agendas: [],
      leads: [],
      entities: [],
      sources: [],
      rawText: '',
    });
  }

  if (result.kind === 'SIGNAL' && result.refId) {
    const signal = headlines.find((entry) => entry.id === result.refId);
    return signal
      ? buildSignalChatOpenRequest(signal)
      : {
          workspaceId: result.workspaceId,
          launchContext: {
            signalId: result.refId,
            headlineId: result.refId,
          },
        };
  }

  if (result.kind === 'ENTITY') {
    return buildEntityChatOpenRequest({
      entityName:
        typeof result.metadata?.entityName === 'string' ? result.metadata.entityName : result.title,
      relatedArtifactId:
        typeof result.metadata?.relatedArtifactId === 'string'
          ? result.metadata.relatedArtifactId
          : undefined,
      workspaceId: result.workspaceId,
    });
  }

  if (result.kind === 'WORKSPACE_ITEM' && result.refId) {
    const item = workspaceItems.find((entry) => entry.id === result.refId);
    return item
      ? buildWorkspaceItemChatOpenRequest(item)
      : {
          workspaceId: result.workspaceId,
        };
  }

  return null;
};

const resolveBoardPlacementReference = (input: {
  artifacts: Artifact[];
  headlines: Headline[];
  result: OmniboxResult;
  workspaceItems: WorkspaceItem[];
}) => {
  const { artifacts, headlines, result, workspaceItems } = input;
  if (!result.workspaceId) return null;

  if (result.kind === 'ARTIFACT' || result.kind === 'SECTION') {
    const artifactId = result.artifactId || result.refId;
    const artifact = artifacts.find((entry) => entry.id === artifactId);
    return artifact ? buildArtifactBoardReference(artifact) : null;
  }

  if (result.kind === 'WORKSPACE_ITEM') {
    const item = workspaceItems.find((entry) => entry.id === result.refId);
    return item ? buildWorkspaceItemBoardReference(item) : null;
  }

  if (result.kind === 'SIGNAL') {
    const signal = headlines.find((entry) => entry.id === result.refId);
    return signal ? buildSignalBoardReference(signal) : null;
  }

  if (result.kind === 'ENTITY') {
    return buildEntityBoardReference({
      entityName:
        typeof result.metadata?.entityName === 'string' ? result.metadata.entityName : result.title,
      workspaceId: result.workspaceId,
    });
  }

  if (result.kind === 'SOURCE') {
    return buildSourceBoardReference({
      title: result.title,
      url: typeof result.metadata?.url === 'string' ? result.metadata.url : undefined,
      workspaceId: result.workspaceId,
    });
  }

  return null;
};

export const getOmniboxOpenLabel = (result: OmniboxResult) => {
  switch (result.kind) {
    case 'SAVED_VIEW':
      return 'Open View';
    case 'RUN':
      return 'Open Run';
    case 'CHAT_SESSION':
      return 'Open Chat';
    case 'WORKSPACE_ITEM':
      return 'Open In Files';
    case 'SIGNAL':
      return 'Open Timeline';
    default:
      return 'Open';
  }
};

interface ExecuteOmniboxActionInput {
  action: OmniboxActionId;
  activeWorkspaceBoardId: string | null;
  activeWorkspaceId: string | null;
  addChatMessage: (message: ChatMessage) => Promise<unknown>;
  addToast: (message: string, type?: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  artifacts: Artifact[];
  chatMessagesBySessionId: Record<string, ChatMessage[]>;
  chatSessions: ChatSession[];
  createChatSession: (input: {
    workspaceId: string;
    title?: string;
    sourceArtifactId?: string;
    packId?: string;
    purposeId?: string;
    provider?: ChatSession['provider'];
    modelId?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<ChatSession>;
  ensureWorkspaceBoard: (workspaceId: string) => Promise<{ id: string }>;
  headlines: Headline[];
  locationPathname: string;
  locationSearch: string;
  navigate: (path: string) => void;
  onClose: () => void;
  queueBoardPlacement: (input: {
    workspaceId: string;
    boardId: string;
    item: ReturnType<typeof resolveBoardPlacementReference> extends infer T
      ? T extends null
        ? never
        : T
      : never;
    openInBoard?: boolean;
  }) => void;
  result: OmniboxResult;
  setActiveChatSessionId: (id: string | null) => void;
  setActiveRunId: (id: string | null) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  workspaceItems: WorkspaceItem[];
  workspaceRuns: WorkspaceRun[];
  workspaces: Workspace[];
}

export const executeOmniboxAction = async ({
  action,
  activeWorkspaceBoardId,
  activeWorkspaceId,
  addChatMessage,
  addToast,
  artifacts,
  chatMessagesBySessionId,
  chatSessions,
  createChatSession,
  ensureWorkspaceBoard,
  headlines,
  locationPathname,
  locationSearch,
  navigate,
  onClose,
  queueBoardPlacement,
  result,
  setActiveChatSessionId,
  setActiveRunId,
  setActiveWorkspaceId,
  workspaceItems,
  workspaceRuns,
  workspaces,
}: ExecuteOmniboxActionInput) => {
  const openSavedView = (query: TimelineRouteQueryState) => {
    if (!result.workspaceId) return;
    setActiveWorkspaceId(result.workspaceId);
    const nextQuery = buildTimelineRouteQuery(query).toString();
    navigate(
      `${buildWorkspaceTimelinePath(result.workspaceId)}${nextQuery ? `?${nextQuery}` : ''}`
    );
    onClose();
  };

  const openTimeline = () => {
    if (result.kind === 'SAVED_VIEW') {
      const savedViewQuery = result.metadata?.savedViewQuery as TimelineRouteQueryState | undefined;
      if (savedViewQuery) {
        openSavedView(savedViewQuery);
      }
      return;
    }
    if (!result.workspaceId) return;
    setActiveWorkspaceId(result.workspaceId);
    const timelineFocus = resolveTimelineFocus(result);
    navigate(
      timelineFocus
        ? buildTimelineFocusedPath(
            locationSearch,
            result.workspaceId,
            timelineFocus.track,
            timelineFocus.refId
          )
        : buildWorkspaceTimelinePath(result.workspaceId)
    );
    onClose();
  };

  const openNetwork = () => {
    if (!result.workspaceId) return;
    setActiveWorkspaceId(result.workspaceId);
    if (
      result.kind === 'ENTITY' &&
      isNetworkPathForWorkspace(locationPathname, result.workspaceId)
    ) {
      requestNetworkEntityFocus({
        workspaceId: result.workspaceId,
        entityName:
          typeof result.metadata?.entityName === 'string' ? result.metadata.entityName : result.title,
      });
      onClose();
      return;
    }
    navigate(
      buildWorkspaceNetworkPath(result.workspaceId, {
        focusEntity:
          result.kind === 'ENTITY'
            ? typeof result.metadata?.entityName === 'string'
              ? result.metadata.entityName
              : result.title
            : undefined,
      })
    );
    onClose();
  };

  const openFiles = () => {
    if (result.workspaceId) {
      setActiveWorkspaceId(result.workspaceId);
    }
    navigate(
      buildFilesPath({
        workspaceId: result.workspaceId || undefined,
        focusItemId: result.kind === 'WORKSPACE_ITEM' ? result.refId : undefined,
      })
    );
    onClose();
  };

  const openChat = async () => {
    const request = buildChatOpenRequestForResult({
      headlines,
      result,
      workspaceItems,
    });
    if (!request) return;

    await openWorkspaceChatRequest({
      addChatMessage,
      addToast,
      artifacts,
      chatMessagesBySessionId,
      chatSessions,
      createChatSession,
      headlines,
      navigate,
      request,
      setActiveChatSessionId,
      setActiveWorkspaceId,
      workspaceItems,
      workspaces,
    });
    onClose();
  };

  const placeOnBoard = async () => {
    if (!result.workspaceId) return;
    setActiveWorkspaceId(result.workspaceId);

    const reference = resolveBoardPlacementReference({
      artifacts,
      headlines,
      result,
      workspaceItems,
    });
    if (!reference) return;

    await queueWorkspaceReferenceOnBoard({
      boardId:
        activeWorkspaceId === result.workspaceId ? activeWorkspaceBoardId : null,
      ensureWorkspaceBoard,
      mode: isBoardPathForWorkspace(locationPathname, result.workspaceId)
        ? 'FOCUS_OR_PLACE'
        : undefined,
      navigate,
      queueBoardPlacement,
      reference,
      workspaceId: result.workspaceId,
    });
    onClose();
  };

  if (action === 'OPEN_IN_CHAT') {
    await openChat();
    return;
  }

  if (action === 'PLACE_ON_BOARD') {
    await placeOnBoard();
    return;
  }

  if (action === 'OPEN_IN_TIMELINE') {
    openTimeline();
    return;
  }

  if (action === 'OPEN_IN_NETWORK') {
    openNetwork();
    return;
  }

  if (action === 'OPEN_IN_FILES') {
    openFiles();
    return;
  }

  if (result.kind === 'ROUTE') {
    const routeId = String(result.metadata?.routeId || '');
    const workspaceRouteMatch = routeId.match(/^route:workspace:(.+):(chat|board|timeline|network)$/);
    const workspaceRouteId = workspaceRouteMatch?.[1];
    const workspaceRouteSurface = workspaceRouteMatch?.[2];
    if (routeId === 'route:discover') navigate(buildDiscoverPath());
    if (routeId === 'route:files') navigate(buildFilesPath());
    if (routeId === 'route:monitor') navigate(buildMonitorPath());
    if (routeId === 'route:settings') navigate(buildSettingsPath());
    if (workspaceRouteId && workspaceRouteSurface) {
      setActiveWorkspaceId(workspaceRouteId);
      if (workspaceRouteSurface === 'chat') navigate(buildWorkspaceChatPath(workspaceRouteId));
      if (workspaceRouteSurface === 'board') navigate(buildWorkspaceBoardPath(workspaceRouteId));
      if (workspaceRouteSurface === 'timeline') navigate(buildWorkspaceTimelinePath(workspaceRouteId));
      if (workspaceRouteSurface === 'network') navigate(buildWorkspaceNetworkPath(workspaceRouteId));
    }
    onClose();
    return;
  }

  if (result.kind === 'WORKSPACE' && result.workspaceId) {
    setActiveWorkspaceId(result.workspaceId);
    const landingArtifact = findWorkspaceLandingArtifact(result.workspaceId, artifacts);
    navigate(
      landingArtifact?.id
        ? buildWorkspaceArtifactPath(result.workspaceId, landingArtifact.id)
        : buildWorkspaceHomePath(result.workspaceId)
    );
    onClose();
    return;
  }

  if (result.kind === 'SAVED_VIEW') {
    const savedViewQuery = result.metadata?.savedViewQuery as TimelineRouteQueryState | undefined;
    if (savedViewQuery) {
      openSavedView(savedViewQuery);
    }
    return;
  }

  if (result.workspaceId) {
    setActiveWorkspaceId(result.workspaceId);

    const timelineFocus = resolveTimelineFocus(result);
    if (timelineFocus && isTimelinePathForWorkspace(locationPathname, result.workspaceId)) {
      navigate(
        buildTimelineFocusedPath(
          locationSearch,
          result.workspaceId,
          timelineFocus.track,
          timelineFocus.refId
        )
      );
      onClose();
      return;
    }
  }

  if (
    (result.kind === 'ARTIFACT' || result.kind === 'SECTION' || result.kind === 'SOURCE') &&
    result.workspaceId &&
    (result.artifactId || result.refId)
  ) {
    const artifactId = result.artifactId || result.refId;
    if (artifactId) {
      const existingTask = workspaceRuns.find((entry) => entry.report?.id === artifactId);
      setActiveRunId(existingTask?.id || null);
      navigate(
        buildWorkspaceArtifactPath(result.workspaceId, artifactId, resolveArtifactRouteState(result))
      );
    }
    onClose();
    return;
  }

  if (result.kind === 'RUN' && result.refId) {
    setActiveRunId(result.refId);
    navigate(buildRunPath(result.refId));
    onClose();
    return;
  }

  if (result.kind === 'CHAT_SESSION' && result.workspaceId && result.refId) {
    navigate(buildWorkspaceChatSessionPath(result.workspaceId, result.refId));
    onClose();
    return;
  }

  if (result.kind === 'SIGNAL') {
    openTimeline();
    return;
  }

  if (result.kind === 'ENTITY') {
    openNetwork();
    return;
  }

  if (result.kind === 'WORKSPACE_ITEM') {
    openFiles();
  }
};
