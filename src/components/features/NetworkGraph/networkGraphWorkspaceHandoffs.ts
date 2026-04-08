import type { Artifact, ChatOpenRequest, Headline } from '@/types';
import {
  buildArtifactBoardReference,
  buildArtifactChatOpenRequest,
  buildEntityBoardReference,
  buildEntityChatOpenRequest,
  buildSignalBoardReference,
  buildSignalChatOpenRequest,
  queueWorkspaceReferenceOnBoard,
} from '@/services/workspace/workspaceHandoffs';

export const openEntityGraphChat = ({
  onOpenChat,
  workspaceId,
  entityName,
}: {
  onOpenChat: (request: ChatOpenRequest) => void;
  workspaceId: string | null;
  entityName: string;
}) => {
  const request =
    workspaceId && workspaceId !== 'ALL'
      ? buildEntityChatOpenRequest({
          entityName,
          workspaceId,
        })
      : null;
  if (!request) return;
  onOpenChat(request);
};

export const openReportGraphChat = ({
  onOpenChat,
  report,
}: {
  onOpenChat: (request: ChatOpenRequest) => void;
  report: Artifact;
}) => {
  const request = buildArtifactChatOpenRequest(report);
  if (!request) return;
  onOpenChat(request);
};

export const openHeadlineGraphChat = ({
  headline,
  onOpenChat,
}: {
  headline: Headline;
  onOpenChat: (request: ChatOpenRequest) => void;
}) => {
  const request = buildSignalChatOpenRequest(headline);
  if (!request) return;
  onOpenChat(request);
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
    item: NonNullable<ReturnType<typeof buildEntityBoardReference>>;
    openInBoard?: boolean;
  }) => void;
  workspaceId: string | null;
}) => {
  const reference =
    workspaceId && workspaceId !== 'ALL'
      ? buildEntityBoardReference({
          entityName,
          workspaceId,
        })
      : null;
  if (!reference) return;

  await queueWorkspaceReferenceOnBoard({
    ensureWorkspaceBoard,
    navigate,
    queueBoardPlacement,
    reference,
    workspaceId: reference.workspaceId,
  });
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
    item: NonNullable<ReturnType<typeof buildArtifactBoardReference>>;
    openInBoard?: boolean;
  }) => void;
  report: Artifact;
}) => {
  const reference = buildArtifactBoardReference(report);
  if (!reference) return;

  await queueWorkspaceReferenceOnBoard({
    ensureWorkspaceBoard,
    navigate,
    queueBoardPlacement,
    reference,
    workspaceId: reference.workspaceId,
  });
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
    item: NonNullable<ReturnType<typeof buildSignalBoardReference>>;
    openInBoard?: boolean;
  }) => void;
}) => {
  const reference = buildSignalBoardReference(headline);
  if (!reference) return;

  await queueWorkspaceReferenceOnBoard({
    ensureWorkspaceBoard,
    navigate,
    queueBoardPlacement,
    reference,
    workspaceId: reference.workspaceId,
  });
};
