import { buildWorkspaceBoardDocumentPath } from '@/app/routes';
import type { Artifact, ChatOpenRequest, Headline } from '@/types';
import {
  buildWorkspaceArtifactReference,
  buildWorkspaceEntityReference,
  buildWorkspaceHeadlineReference,
} from '@/services/workspace/library';

export const openEntityGraphChat = ({
  onOpenChat,
  workspaceId,
  entityName,
}: {
  onOpenChat: (request: ChatOpenRequest) => void;
  workspaceId: string | null;
  entityName: string;
}) => {
  if (!workspaceId || workspaceId === 'ALL') return;

  onOpenChat({
    workspaceId,
    launchContext: {
      entityName,
    },
  });
};

export const openReportGraphChat = ({
  onOpenChat,
  report,
}: {
  onOpenChat: (request: ChatOpenRequest) => void;
  report: Artifact;
}) => {
  if (!report.caseId || !report.id) return;

  onOpenChat({
    workspaceId: report.caseId,
    launchContext: {
      sourceReportId: report.id,
    },
  });
};

export const openHeadlineGraphChat = ({
  headline,
  onOpenChat,
}: {
  headline: Headline;
  onOpenChat: (request: ChatOpenRequest) => void;
}) => {
  if (!headline.caseId) return;

  onOpenChat({
    workspaceId: headline.caseId,
    launchContext: {
      signalId: headline.id,
      headlineId: headline.id,
    },
  });
};

export const placeEntityOnWorkspaceBoard = async ({
  ensureWorkspaceBoard,
  entityName,
  navigate,
  queueBoardPlacement,
  workspaceId,
}: {
  ensureWorkspaceBoard: (workspaceId: string) => Promise<{ id: string }>;
  entityName: string;
  navigate: (path: string) => void;
  queueBoardPlacement: (input: {
    workspaceId: string;
    boardId: string;
    item: ReturnType<typeof buildWorkspaceEntityReference>;
    openInBoard?: boolean;
  }) => void;
  workspaceId: string | null;
}) => {
  if (!workspaceId || workspaceId === 'ALL') return;

  const board = await ensureWorkspaceBoard(workspaceId);
  queueBoardPlacement({
    workspaceId,
    boardId: board.id,
    item: buildWorkspaceEntityReference(workspaceId, {
      name: entityName,
      type: 'UNKNOWN',
    }),
    openInBoard: true,
  });
  navigate(buildWorkspaceBoardDocumentPath(workspaceId, board.id));
};

export const placeReportOnWorkspaceBoard = async ({
  ensureWorkspaceBoard,
  navigate,
  queueBoardPlacement,
  report,
}: {
  ensureWorkspaceBoard: (workspaceId: string) => Promise<{ id: string }>;
  navigate: (path: string) => void;
  queueBoardPlacement: (input: {
    workspaceId: string;
    boardId: string;
    item: ReturnType<typeof buildWorkspaceArtifactReference>;
    openInBoard?: boolean;
  }) => void;
  report: Artifact;
}) => {
  if (!report.caseId || !report.id) return;

  const board = await ensureWorkspaceBoard(report.caseId);
  queueBoardPlacement({
    workspaceId: report.caseId,
    boardId: board.id,
    item: buildWorkspaceArtifactReference(report.caseId, { ...report, id: report.id }),
    openInBoard: true,
  });
  navigate(buildWorkspaceBoardDocumentPath(report.caseId, board.id));
};

export const placeHeadlineOnWorkspaceBoard = async ({
  ensureWorkspaceBoard,
  headline,
  navigate,
  queueBoardPlacement,
}: {
  ensureWorkspaceBoard: (workspaceId: string) => Promise<{ id: string }>;
  headline: Headline;
  navigate: (path: string) => void;
  queueBoardPlacement: (input: {
    workspaceId: string;
    boardId: string;
    item: ReturnType<typeof buildWorkspaceHeadlineReference>;
    openInBoard?: boolean;
  }) => void;
}) => {
  if (!headline.caseId) return;

  const board = await ensureWorkspaceBoard(headline.caseId);
  queueBoardPlacement({
    workspaceId: headline.caseId,
    boardId: board.id,
    item: buildWorkspaceHeadlineReference(headline.caseId, headline),
    openInBoard: true,
  });
  navigate(buildWorkspaceBoardDocumentPath(headline.caseId, board.id));
};
