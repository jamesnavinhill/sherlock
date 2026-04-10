import { lazy, Suspense, useEffect } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';

import {
  buildFilesPath,
  buildWorkspaceBoardDocumentPath,
  buildWorkspaceChatPath,
  parseArtifactRouteState,
  parseNetworkRouteState,
} from '@/app/routes';
import type {
  Artifact,
  ChatOpenRequest,
  ChatSession,
  InvestigationLaunchRequest,
  Workspace,
  WorkspaceBoard as WorkspaceBoardRecord,
  WorkspaceRun,
} from '@/types';
import {
  buildArtifactRouteBreadcrumbs,
  resolveArtifactRouteArtifact,
  resolveBoardRouteState,
  resolveRelatedRunForArtifact,
  workspaceExistsForRoute,
} from '@/app/routeViewHelpers';

const OperationView = lazy(() =>
  import('@/components/features/OperationView').then((module) => ({
    default: module.OperationView,
  }))
);
const Chat = lazy(() =>
  import('@/components/features/Chat').then((module) => ({
    default: module.Chat,
  }))
);
const NetworkGraph = lazy(() =>
  import('@/components/features/NetworkGraph').then((module) => ({
    default: module.NetworkGraph,
  }))
);
const TimelineView = lazy(() =>
  import('@/components/features/TimelineView').then((module) => ({
    default: module.TimelineView,
  }))
);
const WorkspaceBoard = lazy(() =>
  import('@/components/features/WorkspaceBoard').then((module) => ({
    default: module.WorkspaceBoard,
  }))
);
const WorkspaceHome = lazy(() =>
  import('@/components/features/WorkspaceHome').then((module) => ({
    default: module.WorkspaceHome,
  }))
);

const RouteViewFallback = () => (
  <div className="flex h-full min-h-[50vh] items-center justify-center bg-osint-dark px-6">
    <div className="text-center">
      <div className="text-xs font-mono uppercase tracking-[0.18em] text-zinc-500">
        Loading workspace view
      </div>
    </div>
  </div>
);

interface InvestigationRouteViewProps {
  artifacts: Artifact[];
  workspaceRuns: WorkspaceRun[];
  workspaces: Workspace[];
  workspaceBoards: WorkspaceBoardRecord[];
  setActiveRunId: (id: string | null) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  onBack: () => void;
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
  onNavigateRecord: (id: string) => void;
  onViewReport: (report: Artifact) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
}

interface ChatRouteViewProps {
  activeChatSessionId: string | null;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  setActiveChatSessionId: (id: string | null) => void;
  chatSessions: ChatSession[];
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
  workspaces: Workspace[];
}

interface BoardRouteViewProps {
  activeWorkspaceBoardId: string | null;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  setActiveWorkspaceBoardId: (id: string | null) => void;
  workspaceBoards: WorkspaceBoardRecord[];
  onViewReport: (report: Artifact) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
  workspaces: Workspace[];
}

interface WorkspaceScopedRouteViewProps {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  onViewReport: (report: Artifact) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
  workspaces: Workspace[];
}

interface WorkspaceHomeRouteViewProps {
  workspaces: Workspace[];
  setActiveWorkspaceId: (id: string | null) => void;
}

export const WorkspaceHomeRouteView: React.FC<WorkspaceHomeRouteViewProps> = ({
  workspaces,
  setActiveWorkspaceId,
}) => {
  const { workspaceId } = useParams();
  const nextWorkspaceId = workspaceId || '';

  useEffect(() => {
    if (nextWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
  }, [nextWorkspaceId, setActiveWorkspaceId]);

  if (!nextWorkspaceId || !workspaceExistsForRoute(workspaces, nextWorkspaceId)) {
    return <Navigate to={buildFilesPath()} replace />;
  }

  return (
    <Suspense fallback={<RouteViewFallback />}>
      <WorkspaceHome workspaceId={nextWorkspaceId} />
    </Suspense>
  );
};

export const ArtifactRouteView: React.FC<InvestigationRouteViewProps> = ({
  artifacts,
  workspaceRuns,
  workspaces,
  setActiveRunId,
  setActiveWorkspaceId,
  onBack,
  onLaunchInvestigation,
  onNavigateRecord,
  onViewReport,
  onOpenChat,
}) => {
  const { workspaceId, artifactId } = useParams();
  const [searchParams] = useSearchParams();
  const nextWorkspaceId = workspaceId || '';
  const nextArtifactId = artifactId || '';
  const artifactRouteState = parseArtifactRouteState(searchParams);

  useEffect(() => {
    if (nextWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
  }, [nextWorkspaceId, setActiveWorkspaceId]);

  const report = resolveArtifactRouteArtifact(artifacts, nextWorkspaceId, nextArtifactId);
  const relatedTask = resolveRelatedRunForArtifact(workspaceRuns, report);

  useEffect(() => {
    setActiveRunId(relatedTask?.id || null);
  }, [relatedTask?.id, setActiveRunId]);

  if (!report || !nextWorkspaceId) {
    return <Navigate to={buildFilesPath()} replace />;
  }

  return (
    <Suspense fallback={<RouteViewFallback />}>
      <OperationView
        task={relatedTask}
        reportOverride={report}
        artifactRouteState={artifactRouteState}
        onBack={onBack}
        onDeepDive={(request) => onLaunchInvestigation({ ...request, switchToView: true })}
        navStack={buildArtifactRouteBreadcrumbs(report, workspaces, relatedTask?.id || null)}
        onNavigate={onNavigateRecord}
        onSelectCase={(artifactId) => {
          const foundArtifact = artifacts.find((artifact) => artifact.id === artifactId);
          if (foundArtifact) {
            onViewReport(foundArtifact);
          }
        }}
        onStartNewCase={(request) => onLaunchInvestigation({ ...request, switchToView: true })}
        onInvestigateHeadline={(request) =>
          onLaunchInvestigation({ ...request, switchToView: true })
        }
        onOpenChat={onOpenChat}
      />
    </Suspense>
  );
};

export const RunRouteView: React.FC<InvestigationRouteViewProps> = ({
  artifacts,
  workspaceRuns,
  workspaces,
  setActiveRunId,
  setActiveWorkspaceId,
  onBack,
  onLaunchInvestigation,
  onNavigateRecord,
  onViewReport,
  onOpenChat,
}) => {
  const { runId } = useParams();
  const [searchParams] = useSearchParams();
  const nextRunId = runId || '';
  const task = workspaceRuns.find((workspaceRun) => workspaceRun.id === nextRunId) || null;
  const report = task?.report || null;
  const artifactRouteState = parseArtifactRouteState(searchParams);

  useEffect(() => {
    if (nextRunId) {
      setActiveRunId(nextRunId);
    }
  }, [nextRunId, setActiveRunId]);

  useEffect(() => {
    const workspaceId = report?.workspaceId || task?.workspaceId || null;
    if (workspaceId) {
      setActiveWorkspaceId(workspaceId);
    }
  }, [report?.workspaceId, setActiveWorkspaceId, task?.workspaceId]);

  if (!task || !nextRunId) {
    return <Navigate to={buildFilesPath()} replace />;
  }

  return (
    <Suspense fallback={<RouteViewFallback />}>
      <OperationView
        task={task}
        reportOverride={report}
        artifactRouteState={artifactRouteState}
        onBack={onBack}
        onDeepDive={(request) => onLaunchInvestigation({ ...request, switchToView: true })}
        navStack={buildArtifactRouteBreadcrumbs(report, workspaces, task.id)}
        onNavigate={onNavigateRecord}
        onSelectCase={(artifactId) => {
          const foundArtifact = artifacts.find((artifact) => artifact.id === artifactId);
          if (foundArtifact) {
            onViewReport(foundArtifact);
          }
        }}
        onStartNewCase={(request) => onLaunchInvestigation({ ...request, switchToView: true })}
        onInvestigateHeadline={(request) =>
          onLaunchInvestigation({ ...request, switchToView: true })
        }
        onOpenChat={onOpenChat}
      />
    </Suspense>
  );
};

export const ChatRouteView: React.FC<ChatRouteViewProps> = ({
  activeChatSessionId,
  activeWorkspaceId,
  setActiveWorkspaceId,
  setActiveChatSessionId,
  chatSessions,
  onLaunchInvestigation,
  workspaces,
}) => {
  const { workspaceId, sessionId } = useParams();
  const nextWorkspaceId = workspaceId || '';
  const matchedSession =
    sessionId && nextWorkspaceId
      ? chatSessions.find(
          (session) => session.id === sessionId && session.workspaceId === nextWorkspaceId
        ) || null
      : null;

  useEffect(() => {
    if (nextWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
    setActiveChatSessionId(matchedSession?.id || null);
  }, [matchedSession?.id, nextWorkspaceId, setActiveChatSessionId, setActiveWorkspaceId]);

  if (!nextWorkspaceId || !workspaceExistsForRoute(workspaces, nextWorkspaceId)) {
    return <Navigate to={buildFilesPath()} replace />;
  }

  if (sessionId && !matchedSession) {
    return <Navigate to={buildWorkspaceChatPath(nextWorkspaceId)} replace />;
  }

  const expectedSessionId = matchedSession?.id || null;
  const workspaceReady = activeWorkspaceId === nextWorkspaceId;
  const sessionReady = activeChatSessionId === expectedSessionId;

  if (!workspaceReady || !sessionReady) {
    return <RouteViewFallback />;
  }

  return (
    <Suspense fallback={<RouteViewFallback />}>
      <Chat
        onLaunchInvestigation={(request) =>
          onLaunchInvestigation({ ...request, switchToView: true })
        }
      />
    </Suspense>
  );
};

export const BoardRouteView: React.FC<BoardRouteViewProps> = ({
  activeWorkspaceBoardId,
  activeWorkspaceId,
  setActiveWorkspaceId,
  setActiveWorkspaceBoardId,
  workspaceBoards,
  onViewReport,
  onOpenChat,
  onLaunchInvestigation,
  workspaces,
}) => {
  const { workspaceId, boardId } = useParams();
  const nextWorkspaceId = workspaceId || '';
  const { matchedBoard, redirectBoardId } = resolveBoardRouteState(
    workspaceBoards,
    nextWorkspaceId,
    boardId
  );

  useEffect(() => {
    if (nextWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
    setActiveWorkspaceBoardId(matchedBoard?.id || null);
  }, [matchedBoard?.id, nextWorkspaceId, setActiveWorkspaceBoardId, setActiveWorkspaceId]);

  if (!nextWorkspaceId || !workspaceExistsForRoute(workspaces, nextWorkspaceId)) {
    return <Navigate to={buildFilesPath()} replace />;
  }

  if (redirectBoardId) {
    return (
      <Navigate
        to={buildWorkspaceBoardDocumentPath(nextWorkspaceId, redirectBoardId)}
        replace
      />
    );
  }

  const workspaceReady = activeWorkspaceId === nextWorkspaceId;
  const boardReady = activeWorkspaceBoardId === (matchedBoard?.id || null);

  if (!workspaceReady || !boardReady) {
    return <RouteViewFallback />;
  }

  return (
    <Suspense fallback={<RouteViewFallback />}>
      <WorkspaceBoard
        onOpenReport={onViewReport}
        onOpenChat={onOpenChat}
        onLaunchInvestigation={onLaunchInvestigation}
      />
    </Suspense>
  );
};

export const TimelineRouteView: React.FC<WorkspaceScopedRouteViewProps> = ({
  activeWorkspaceId,
  setActiveWorkspaceId,
  onViewReport,
  onOpenChat,
  workspaces,
}) => {
  const { workspaceId } = useParams();
  const nextWorkspaceId = workspaceId || '';

  useEffect(() => {
    if (nextWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
  }, [nextWorkspaceId, setActiveWorkspaceId]);

  if (!nextWorkspaceId || !workspaceExistsForRoute(workspaces, nextWorkspaceId)) {
    return <Navigate to={buildFilesPath()} replace />;
  }

  if (activeWorkspaceId !== nextWorkspaceId) {
    return <RouteViewFallback />;
  }

  return (
    <Suspense fallback={<RouteViewFallback />}>
      <TimelineView onOpenReport={onViewReport} onOpenChat={onOpenChat} />
    </Suspense>
  );
};

export const NetworkRouteView: React.FC<WorkspaceScopedRouteViewProps> = ({
  activeWorkspaceId,
  setActiveWorkspaceId,
  onViewReport,
  onOpenChat,
  onLaunchInvestigation,
  workspaces,
}) => {
  const { workspaceId } = useParams();
  const [searchParams] = useSearchParams();
  const nextWorkspaceId = workspaceId || '';
  const networkRouteState = parseNetworkRouteState(searchParams);

  useEffect(() => {
    if (nextWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
  }, [nextWorkspaceId, setActiveWorkspaceId]);

  if (!nextWorkspaceId || !workspaceExistsForRoute(workspaces, nextWorkspaceId)) {
    return <Navigate to={buildFilesPath()} replace />;
  }

  if (activeWorkspaceId !== nextWorkspaceId) {
    return <RouteViewFallback />;
  }

  return (
    <Suspense fallback={<RouteViewFallback />}>
      <NetworkGraph
        routeState={networkRouteState}
        onOpenReport={onViewReport}
        onInvestigateEntity={(request) =>
          onLaunchInvestigation({ ...request, switchToView: true })
        }
        onOpenChat={onOpenChat}
      />
    </Suspense>
  );
};
