import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildFilesPath, buildWorkspaceBoardDocumentPath } from '@/app/routes';
import {
  buildWorkspaceArtifactReference,
  buildWorkspaceEntityReference,
  buildWorkspaceHeadlineReference,
  buildWorkspaceItemReference,
} from '@/services/workspace/library';
import { buildWorkspaceItemChatOpenRequest } from '@/services/workspace/workspaceHandoffs';
import type {
  ChatOpenRequest,
  Artifact,
  Headline,
  TimelineEvent,
  TimelineTrack,
  WorkspaceBoardItemReference,
  WorkspaceItem,
} from '@/types';
import type { InspectorActionItem } from '@/components/ui/InspectorActionRow';
import { buildTimelineDetailActions } from './timelineDetailActions';
import { getMetadataValue, getPrimaryRefId } from './timelineViewUtils';

interface UseTimelineWorkspaceActionsInput {
  activeWorkspaceId: string | undefined;
  detailEvent: TimelineEvent | null;
  ensureWorkspaceBoard: (workspaceId: string) => Promise<{ id: string }>;
  focusReference: (track: TimelineTrack, refId?: string) => void;
  labelArtifactLabel: string;
  onOpenChat: (request: ChatOpenRequest) => void;
  onOpenReport: (artifactId?: string) => void;
  parentArtifactId?: string;
  placeBoardItem: (input: {
    workspaceId: string;
    boardId: string;
    item: WorkspaceBoardItemReference;
    openInBoard?: boolean;
  }) => void;
  previousArtifactId?: string;
  relatedSignal?: Headline | null;
  selectedArtifact?: Artifact | null;
  selectedChatSessionId?: string;
  selectedEntityName: string | null;
  selectedRunId?: string;
  selectedWorkspaceItem?: WorkspaceItem | null;
}

export const useTimelineWorkspaceActions = ({
  activeWorkspaceId,
  detailEvent,
  ensureWorkspaceBoard,
  focusReference,
  labelArtifactLabel,
  onOpenChat,
  onOpenReport,
  parentArtifactId,
  placeBoardItem,
  previousArtifactId,
  relatedSignal,
  selectedArtifact,
  selectedChatSessionId,
  selectedEntityName,
  selectedRunId,
  selectedWorkspaceItem,
}: UseTimelineWorkspaceActionsInput) => {
  const navigate = useNavigate();

  const openWorkspaceChat = useCallback(
    (event?: TimelineEvent | null) => {
      if (!activeWorkspaceId) return;

      const sessionId =
        getPrimaryRefId(event || null, 'CHAT_SESSION') ||
        getMetadataValue<string>(event || null, 'sessionId');
      if (sessionId) {
        onOpenChat({
          workspaceId: activeWorkspaceId,
          sessionId,
        });
        return;
      }

      if (selectedWorkspaceItem) {
        onOpenChat(buildWorkspaceItemChatOpenRequest(selectedWorkspaceItem));
        return;
      }

      if (getPrimaryRefId(event || null, 'ARTIFACT')) {
        onOpenChat({
          workspaceId: activeWorkspaceId,
          launchContext: { sourceArtifactId: getPrimaryRefId(event || null, 'ARTIFACT') },
        });
        return;
      }

      if (getPrimaryRefId(event || null, 'SIGNAL')) {
        onOpenChat({
          workspaceId: activeWorkspaceId,
          launchContext: {
            signalId: getPrimaryRefId(event || null, 'SIGNAL'),
            headlineId: getPrimaryRefId(event || null, 'SIGNAL'),
          },
        });
        return;
      }

      const entityName =
        getPrimaryRefId(event || null, 'ENTITY') ||
        getMetadataValue<string>(event || null, 'entityName');
      if (entityName) {
        onOpenChat({
          workspaceId: activeWorkspaceId,
          launchContext: {
            entityName,
            sourceArtifactId: getMetadataValue<string>(event || null, 'relatedArtifactId'),
          },
        });
        return;
      }

      onOpenChat({ workspaceId: activeWorkspaceId });
    },
    [activeWorkspaceId, onOpenChat, selectedWorkspaceItem]
  );

  const openWorkspaceItem = useCallback(() => {
    if (!activeWorkspaceId || !selectedWorkspaceItem) return;
    navigate(
      buildFilesPath({
        workspaceId: activeWorkspaceId,
        focusItemId: selectedWorkspaceItem.id,
      })
    );
  }, [activeWorkspaceId, navigate, selectedWorkspaceItem]);

  const openWorkspaceBoard = useCallback(async () => {
    if (!activeWorkspaceId) return;
    const board = await ensureWorkspaceBoard(activeWorkspaceId);
    navigate(buildWorkspaceBoardDocumentPath(activeWorkspaceId, board.id));
  }, [activeWorkspaceId, ensureWorkspaceBoard, navigate]);

  const placeReferenceOnBoard = useCallback(async () => {
    if (!activeWorkspaceId) return;

    let reference = null;

    if (selectedArtifact?.id) {
      reference = buildWorkspaceArtifactReference(activeWorkspaceId, {
        ...selectedArtifact,
        id: selectedArtifact.id,
      });
    } else if (selectedWorkspaceItem) {
      reference = buildWorkspaceItemReference(selectedWorkspaceItem);
    } else if (relatedSignal) {
      reference = buildWorkspaceHeadlineReference(activeWorkspaceId, relatedSignal);
    } else if (selectedEntityName) {
      reference = buildWorkspaceEntityReference(activeWorkspaceId, {
        name: selectedEntityName,
        type: 'UNKNOWN',
      });
    }

    if (!reference) return;

    const board = await ensureWorkspaceBoard(activeWorkspaceId);
    placeBoardItem({
      workspaceId: activeWorkspaceId,
      boardId: board.id,
      item: reference,
      openInBoard: true,
    });
    navigate(buildWorkspaceBoardDocumentPath(activeWorkspaceId, board.id));
  }, [
    activeWorkspaceId,
    ensureWorkspaceBoard,
    navigate,
    placeBoardItem,
    relatedSignal,
    selectedArtifact,
    selectedEntityName,
    selectedWorkspaceItem,
  ]);

  const detailActions: InspectorActionItem[] = useMemo(
    () =>
      buildTimelineDetailActions({
        focusReference,
        labelArtifactLabel,
        onOpenArtifact: onOpenReport,
        onOpenItemSource: () => {
          if (selectedWorkspaceItem?.url) {
            window.open(selectedWorkspaceItem.url, '_blank', 'noopener,noreferrer');
          }
        },
        onOpenWorkspaceItem: openWorkspaceItem,
        onOpenWorkspaceChat: openWorkspaceChat,
        onPlaceReferenceOnBoard: placeReferenceOnBoard,
        parentArtifactId,
        previousArtifactId,
        relatedSignalId: relatedSignal?.id,
        selectedArtifact,
        selectedChatSessionId,
        selectedEntityName,
        selectedEvent: detailEvent,
        selectedRunId,
        selectedWorkspaceItem,
      }),
    [
      detailEvent,
      focusReference,
      labelArtifactLabel,
      onOpenReport,
      openWorkspaceChat,
      openWorkspaceItem,
      parentArtifactId,
      placeReferenceOnBoard,
      previousArtifactId,
      relatedSignal?.id,
      selectedArtifact,
      selectedChatSessionId,
      selectedEntityName,
      selectedRunId,
      selectedWorkspaceItem,
    ]
  );

  return {
    detailActions,
    openWorkspaceBoard,
    openWorkspaceChat,
    placeReferenceOnBoard,
  };
};
