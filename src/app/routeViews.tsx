import { lazy, Suspense, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import type { BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { findWorkspaceLandingArtifact } from '@/app/navigation';
import {
  buildFilesPath,
  buildWorkspaceArtifactPath,
  buildWorkspaceBoardDocumentPath,
  buildWorkspaceBoardPath,
  buildWorkspaceChatPath,
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

const RouteViewFallback = () => (
  <div className="flex h-full min-h-[50vh] items-center justify-center bg-osint-dark px-6">
    <div className="text-center">
      <div className="text-xs font-mono uppercase tracking-[0.18em] text-zinc-500">
        Loading workspace view
      </div>
    </div>
  </div>
);

const buildBreadcrumbs = (
  report: Artifact | null,
  workspaces: Workspace[],
  activeTaskId: string | null
): BreadcrumbItem[] => {
  if (!report) return [];

  const breadcrumbs: BreadcrumbItem[] = [];
  if (report.caseId) {
    const workspace = workspaces.find((entry) => entry.id === report.caseId);
    if (workspace) {
      breadcrumbs.push({
        type: 'CASE',
        id: workspace.id,
        label: workspace.title,
      });
    }
  }

  breadcrumbs.push({
    type: 'REPORT',
    id: report.id || activeTaskId || 'report',
    label: report.topic,
  });

  return breadcrumbs;
};

interface InvestigationRouteViewProps {
  artifacts: Artifact[];
  workspaceRuns: WorkspaceRun[];
  workspaces: Workspace[];
  workspaceBoards: WorkspaceBoardRecord[];
  setActiveTaskId: (id: string | null) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  onBack: () => void;
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
  onNavigateRecord: (id: string) => void;
  onViewReport: (report: Artifact) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
}

interface ChatRouteViewProps {
  setActiveWorkspaceId: (id: string | null) => void;
  setActiveChatSessionId: (id: string | null) => void;
  chatSessions: ChatSession[];
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
}

interface BoardRouteViewProps {
  setActiveWorkspaceId: (id: string | null) => void;
  setActiveWorkspaceBoardId: (id: string | null) => void;
  workspaceBoards: WorkspaceBoardRecord[];
  onViewReport: (report: Artifact) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
}

interface WorkspaceScopedRouteViewProps {
  setActiveWorkspaceId: (id: string | null) => void;
  onViewReport: (report: Artifact) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
}

interface WorkspaceHomeRouteViewProps {
  artifacts: Artifact[];
  workspaces: Workspace[];
  workspaceBoards: WorkspaceBoardRecord[];
  setActiveWorkspaceId: (id: string | null) => void;
}

export const WorkspaceHomeRouteView: React.FC<WorkspaceHomeRouteViewProps> = ({
  artifacts,
  workspaces,
  workspaceBoards,
  setActiveWorkspaceId,
}) => {
  const { workspaceId } = useParams();
  const nextWorkspaceId = workspaceId || '';

  useEffect(() => {
    if (nextWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
  }, [nextWorkspaceId, setActiveWorkspaceId]);

  const landingArtifact = findWorkspaceLandingArtifact(nextWorkspaceId, artifacts);
  if (!nextWorkspaceId || !workspaces.some((workspace) => workspace.id === nextWorkspaceId)) {
    return <Navigate to={buildFilesPath()} replace />;
  }

  if (landingArtifact?.id) {
    return <Navigate to={buildWorkspaceArtifactPath(nextWorkspaceId, landingArtifact.id)} replace />;
  }

  const boardId = workspaceBoards.find((board) => board.workspaceId === nextWorkspaceId)?.id;
  return (
    <Navigate
      to={boardId ? buildWorkspaceBoardDocumentPath(nextWorkspaceId, boardId) : buildWorkspaceBoardPath(nextWorkspaceId)}
      replace
    />
  );
};

export const ArtifactRouteView: React.FC<InvestigationRouteViewProps> = ({
  artifacts,
  workspaceRuns,
  workspaces,
  setActiveTaskId,
  setActiveWorkspaceId,
  onBack,
  onLaunchInvestigation,
  onNavigateRecord,
  onViewReport,
  onOpenChat,
}) => {
  const { workspaceId, artifactId } = useParams();
  const nextWorkspaceId = workspaceId || '';
  const nextArtifactId = artifactId || '';

  useEffect(() => {
    if (nextWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
  }, [nextWorkspaceId, setActiveWorkspaceId]);

  const report =
    artifacts.find((artifact) => artifact.id === nextArtifactId && artifact.caseId === nextWorkspaceId) ||
    artifacts.find((artifact) => artifact.id === nextArtifactId) ||
    null;

  const relatedTask =
    workspaceRuns.find(
      (task) =>
        task.report?.id === report?.id ||
        task.id === report?.config?.sourceRunId ||
        task.report?.topic === report?.topic
    ) || null;

  useEffect(() => {
    setActiveTaskId(relatedTask?.id || null);
  }, [relatedTask?.id, setActiveTaskId]);

  if (!report || !nextWorkspaceId) {
    return <Navigate to={buildFilesPath()} replace />;
  }

  return (
    <Suspense fallback={<RouteViewFallback />}>
      <OperationView
        task={relatedTask}
        reportOverride={report}
        onBack={onBack}
        onDeepDive={(request) => onLaunchInvestigation({ ...request, switchToView: true })}
        navStack={buildBreadcrumbs(report, workspaces, relatedTask?.id || null)}
        onNavigate={onNavigateRecord}
        onSelectCase={(reportId) => {
          const foundReport = artifacts.find((artifact) => artifact.id === reportId);
          if (foundReport) {
            onViewReport(foundReport);
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
  setActiveTaskId,
  setActiveWorkspaceId,
  onBack,
  onLaunchInvestigation,
  onNavigateRecord,
  onViewReport,
  onOpenChat,
}) => {
  const { runId } = useParams();
  const nextRunId = runId || '';
  const task = workspaceRuns.find((workspaceRun) => workspaceRun.id === nextRunId) || null;
  const report = task?.report || null;

  useEffect(() => {
    if (nextRunId) {
      setActiveTaskId(nextRunId);
    }
  }, [nextRunId, setActiveTaskId]);

  useEffect(() => {
    const workspaceId = report?.caseId || task?.workspaceId || null;
    if (workspaceId) {
      setActiveWorkspaceId(workspaceId);
    }
  }, [report?.caseId, setActiveWorkspaceId, task?.workspaceId]);

  if (!task || !nextRunId) {
    return <Navigate to={buildFilesPath()} replace />;
  }

  return (
    <Suspense fallback={<RouteViewFallback />}>
      <OperationView
        task={task}
        reportOverride={report}
        onBack={onBack}
        onDeepDive={(request) => onLaunchInvestigation({ ...request, switchToView: true })}
        navStack={buildBreadcrumbs(report, workspaces, task.id)}
        onNavigate={onNavigateRecord}
        onSelectCase={(reportId) => {
          const foundReport = artifacts.find((artifact) => artifact.id === reportId);
          if (foundReport) {
            onViewReport(foundReport);
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
  setActiveWorkspaceId,
  setActiveChatSessionId,
  chatSessions,
  onLaunchInvestigation,
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

  if (sessionId && !matchedSession) {
    return <Navigate to={buildWorkspaceChatPath(nextWorkspaceId)} replace />;
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
  setActiveWorkspaceId,
  setActiveWorkspaceBoardId,
  workspaceBoards,
  onViewReport,
  onOpenChat,
  onLaunchInvestigation,
}) => {
  const { workspaceId, boardId } = useParams();
  const nextWorkspaceId = workspaceId || '';
  const workspaceScopedBoards = workspaceBoards
    .filter((board) => board.workspaceId === nextWorkspaceId)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const matchedBoard = boardId
    ? workspaceScopedBoards.find((board) => board.id === boardId) || null
    : null;

  useEffect(() => {
    if (nextWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
    setActiveWorkspaceBoardId(matchedBoard?.id || null);
  }, [matchedBoard?.id, nextWorkspaceId, setActiveWorkspaceBoardId, setActiveWorkspaceId]);

  if (!boardId && workspaceScopedBoards[0]) {
    return (
      <Navigate
        to={buildWorkspaceBoardDocumentPath(nextWorkspaceId, workspaceScopedBoards[0].id)}
        replace
      />
    );
  }

  if (boardId && !matchedBoard && workspaceScopedBoards[0]) {
    return (
      <Navigate
        to={buildWorkspaceBoardDocumentPath(nextWorkspaceId, workspaceScopedBoards[0].id)}
        replace
      />
    );
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
  setActiveWorkspaceId,
  onViewReport,
  onOpenChat,
}) => {
  const { workspaceId } = useParams();
  const nextWorkspaceId = workspaceId || '';

  useEffect(() => {
    if (nextWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
  }, [nextWorkspaceId, setActiveWorkspaceId]);

  return (
    <Suspense fallback={<RouteViewFallback />}>
      <TimelineView onOpenReport={onViewReport} onOpenChat={onOpenChat} />
    </Suspense>
  );
};

export const NetworkRouteView: React.FC<WorkspaceScopedRouteViewProps> = ({
  setActiveWorkspaceId,
  onViewReport,
  onOpenChat,
  onLaunchInvestigation,
}) => {
  const { workspaceId } = useParams();
  const nextWorkspaceId = workspaceId || '';

  useEffect(() => {
    if (nextWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
  }, [nextWorkspaceId, setActiveWorkspaceId]);

  return (
    <Suspense fallback={<RouteViewFallback />}>
      <NetworkGraph
        onOpenReport={onViewReport}
        onInvestigateEntity={(request) =>
          onLaunchInvestigation({ ...request, switchToView: true })
        }
        onOpenChat={onOpenChat}
      />
    </Suspense>
  );
};
