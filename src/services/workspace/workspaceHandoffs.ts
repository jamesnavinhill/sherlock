import { buildWorkspaceBoardDocumentPath } from '@/app/routes';
import {
  buildWorkspaceArtifactReference,
  buildWorkspaceEntityReference,
  buildWorkspaceItemReference,
  buildWorkspaceSignalReference,
  buildWorkspaceSourceReference,
} from '@/services/workspace/library';
import type {
  Artifact,
  ChatOpenRequest,
  Headline,
  Source,
  WorkspaceBoardItemReference,
  WorkspaceItem,
} from '@/types';

export const buildArtifactChatOpenRequest = (artifact: Artifact): ChatOpenRequest | null => {
  if (!artifact.workspaceId || !artifact.id) return null;

  return {
    workspaceId: artifact.workspaceId,
    launchContext: {
      sourceArtifactId: artifact.id,
    },
  };
};

export const buildSignalChatOpenRequest = (signal: Headline): ChatOpenRequest | null => {
  if (!signal.workspaceId) return null;

  return {
    workspaceId: signal.workspaceId,
    launchContext: {
      signalId: signal.id,
      headlineId: signal.id,
    },
  };
};

export const buildEntityChatOpenRequest = (input: {
  entityName: string;
  relatedArtifactId?: string;
  workspaceId: string | null | undefined;
}): ChatOpenRequest | null => {
  if (!input.workspaceId) return null;

  return {
    workspaceId: input.workspaceId,
    launchContext: {
      entityName: input.entityName,
      sourceArtifactId: input.relatedArtifactId,
    },
  };
};

export const buildWorkspaceItemChatOpenRequest = (item: WorkspaceItem): ChatOpenRequest => {
  const signalId = item.provenance?.sourceSignalId || item.provenance?.sourceHeadlineId;
  return {
    workspaceId: item.workspaceId,
    launchContext: {
      workspaceItemId: item.id,
      sourceArtifactId: item.provenance?.sourceArtifactId,
      signalId,
      headlineId: signalId,
    },
  };
};

export const buildArtifactBoardReference = (artifact: Artifact): WorkspaceBoardItemReference | null =>
  artifact.workspaceId && artifact.id
    ? buildWorkspaceArtifactReference(artifact.workspaceId, { ...artifact, id: artifact.id })
    : null;

export const buildSignalBoardReference = (signal: Headline): WorkspaceBoardItemReference | null =>
  signal.workspaceId ? buildWorkspaceSignalReference(signal.workspaceId, signal) : null;

export const buildEntityBoardReference = (input: {
  entityName: string;
  workspaceId: string | null | undefined;
}): WorkspaceBoardItemReference | null =>
  input.workspaceId
    ? buildWorkspaceEntityReference(input.workspaceId, {
        name: input.entityName,
        type: 'UNKNOWN',
      })
    : null;

export const buildWorkspaceItemBoardReference = (
  item: WorkspaceItem
): WorkspaceBoardItemReference => buildWorkspaceItemReference(item);

export const buildSourceBoardReference = (input: {
  title: string;
  url?: string;
  workspaceId: string | null | undefined;
}): WorkspaceBoardItemReference | null =>
  input.workspaceId
    ? buildWorkspaceSourceReference(input.workspaceId, {
        title: input.title,
        url: input.url || '',
      } as Source)
    : null;

export const queueWorkspaceReferenceOnBoard = async ({
  boardId,
  ensureWorkspaceBoard,
  mode,
  navigate,
  queueBoardPlacement,
  reference,
  workspaceId,
}: {
  boardId?: string | null;
  ensureWorkspaceBoard: (workspaceId: string) => Promise<{ id: string }>;
  mode?: 'PLACE' | 'FOCUS_OR_PLACE';
  navigate: (path: string) => void;
  queueBoardPlacement: (input: {
    workspaceId: string;
    boardId: string;
    item: WorkspaceBoardItemReference;
    openInBoard?: boolean;
    mode?: 'PLACE' | 'FOCUS_OR_PLACE';
  }) => void;
  reference: WorkspaceBoardItemReference;
  workspaceId: string;
}) => {
  const resolvedBoardId = boardId || (await ensureWorkspaceBoard(workspaceId)).id;
  queueBoardPlacement({
    workspaceId,
    boardId: resolvedBoardId,
    item: reference,
    openInBoard: true,
    mode,
  });
  navigate(buildWorkspaceBoardDocumentPath(workspaceId, resolvedBoardId));
  return resolvedBoardId;
};
