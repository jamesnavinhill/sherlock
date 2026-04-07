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
  if (!artifact.caseId || !artifact.id) return null;

  return {
    workspaceId: artifact.caseId,
    launchContext: {
      sourceReportId: artifact.id,
    },
  };
};

export const buildSignalChatOpenRequest = (signal: Headline): ChatOpenRequest | null => {
  if (!signal.caseId) return null;

  return {
    workspaceId: signal.caseId,
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
      sourceReportId: input.relatedArtifactId,
    },
  };
};

export const buildWorkspaceItemChatOpenRequest = (item: WorkspaceItem): ChatOpenRequest => {
  const signalId = item.provenance?.sourceSignalId || item.provenance?.sourceHeadlineId;
  if (item.provenance?.sourceReportId) {
    return {
      workspaceId: item.workspaceId,
      launchContext: {
        sourceReportId: item.provenance.sourceReportId,
      },
    };
  }

  if (signalId) {
    return {
      workspaceId: item.workspaceId,
      launchContext: {
        signalId,
        headlineId: signalId,
      },
    };
  }

  return {
    workspaceId: item.workspaceId,
  };
};

export const buildArtifactBoardReference = (artifact: Artifact): WorkspaceBoardItemReference | null =>
  artifact.caseId && artifact.id
    ? buildWorkspaceArtifactReference(artifact.caseId, { ...artifact, id: artifact.id })
    : null;

export const buildSignalBoardReference = (signal: Headline): WorkspaceBoardItemReference | null =>
  signal.caseId ? buildWorkspaceSignalReference(signal.caseId, signal) : null;

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
  navigate,
  queueBoardPlacement,
  reference,
  workspaceId,
}: {
  boardId?: string | null;
  ensureWorkspaceBoard: (workspaceId: string) => Promise<{ id: string }>;
  navigate: (path: string) => void;
  queueBoardPlacement: (input: {
    workspaceId: string;
    boardId: string;
    item: WorkspaceBoardItemReference;
    openInBoard?: boolean;
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
  });
  navigate(buildWorkspaceBoardDocumentPath(workspaceId, resolvedBoardId));
  return resolvedBoardId;
};
