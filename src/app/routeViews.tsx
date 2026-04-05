import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import type { BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { OperationView } from '@/components/features/OperationView';
import { Chat } from '@/components/features/Chat';
import { NetworkGraph } from '@/components/features/NetworkGraph';
import { TimelineView } from '@/components/features/TimelineView';
import { WorkspaceBoard } from '@/components/features/WorkspaceBoard';
import { findWorkspaceLandingArtifact } from '@/app/navigation';
import {
  buildFilesPath,
  buildWorkspaceArtifactPath,
  buildWorkspaceBoardDocumentPath,
  buildWorkspaceBoardPath,
} from '@/app/routes';
import type {
  Artifact,
  ChatOpenRequest,
  FollowUp,
  InvestigationLaunchRequest,
  Workspace,
  WorkspaceBoard as WorkspaceBoardRecord,
  WorkspaceRun,
} from '@/types';

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
  onBatchInvestigate: (followUps: FollowUp[], parentReport: Artifact) => void;
  onNavigateRecord: (id: string) => void;
  onViewReport: (report: Artifact) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
}

interface ChatRouteViewProps {
  setActiveWorkspaceId: (id: string | null) => void;
  setActiveChatSessionId: (id: string | null) => void;
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
}

interface BoardRouteViewProps {
  setActiveWorkspaceId: (id: string | null) => void;
  setActiveWorkspaceBoardId: (id: string | null) => void;
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
  onBatchInvestigate,
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
    <OperationView
      task={relatedTask}
      reportOverride={report}
      onBack={onBack}
      onDeepDive={(request) => onLaunchInvestigation({ ...request, switchToView: true })}
      onBatchDeepDive={onBatchInvestigate}
      navStack={buildBreadcrumbs(report, workspaces, relatedTask?.id || null)}
      onNavigate={onNavigateRecord}
      onSelectCase={(reportId) => {
        const foundReport = artifacts.find((artifact) => artifact.id === reportId);
        if (foundReport) {
          onViewReport(foundReport);
        }
      }}
      onStartNewCase={(request) => onLaunchInvestigation({ ...request, switchToView: true })}
      onInvestigateHeadline={(request) => onLaunchInvestigation({ ...request, switchToView: true })}
      onOpenChat={onOpenChat}
    />
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
  onBatchInvestigate,
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
    <OperationView
      task={task}
      reportOverride={report}
      onBack={onBack}
      onDeepDive={(request) => onLaunchInvestigation({ ...request, switchToView: true })}
      onBatchDeepDive={onBatchInvestigate}
      navStack={buildBreadcrumbs(report, workspaces, task.id)}
      onNavigate={onNavigateRecord}
      onSelectCase={(reportId) => {
        const foundReport = artifacts.find((artifact) => artifact.id === reportId);
        if (foundReport) {
          onViewReport(foundReport);
        }
      }}
      onStartNewCase={(request) => onLaunchInvestigation({ ...request, switchToView: true })}
      onInvestigateHeadline={(request) => onLaunchInvestigation({ ...request, switchToView: true })}
      onOpenChat={onOpenChat}
    />
  );
};

export const ChatRouteView: React.FC<ChatRouteViewProps> = ({
  setActiveWorkspaceId,
  setActiveChatSessionId,
  onLaunchInvestigation,
}) => {
  const { workspaceId, sessionId } = useParams();
  const nextWorkspaceId = workspaceId || '';

  useEffect(() => {
    if (nextWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
    if (sessionId) {
      setActiveChatSessionId(sessionId);
    }
  }, [nextWorkspaceId, sessionId, setActiveChatSessionId, setActiveWorkspaceId]);

  return (
    <Chat onLaunchInvestigation={(request) => onLaunchInvestigation({ ...request, switchToView: true })} />
  );
};

export const BoardRouteView: React.FC<BoardRouteViewProps> = ({
  setActiveWorkspaceId,
  setActiveWorkspaceBoardId,
  onViewReport,
  onOpenChat,
  onLaunchInvestigation,
}) => {
  const { workspaceId, boardId } = useParams();
  const nextWorkspaceId = workspaceId || '';

  useEffect(() => {
    if (nextWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaceId);
    }
    if (boardId) {
      setActiveWorkspaceBoardId(boardId);
    }
  }, [boardId, nextWorkspaceId, setActiveWorkspaceBoardId, setActiveWorkspaceId]);

  return (
    <WorkspaceBoard
      onOpenReport={onViewReport}
      onOpenChat={onOpenChat}
      onLaunchInvestigation={onLaunchInvestigation}
    />
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

  return <TimelineView onOpenReport={onViewReport} onOpenChat={onOpenChat} />;
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
    <NetworkGraph
      onOpenReport={onViewReport}
      onInvestigateEntity={(request) => onLaunchInvestigation({ ...request, switchToView: true })}
      onOpenChat={onOpenChat}
    />
  );
};
