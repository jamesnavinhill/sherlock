import { useCallback, useEffect, useRef, useState } from 'react';

import { buildWorkspaceBoardDocumentPath, type ArtifactRouteState } from '@/app/routes';
import {
  buildArtifactBoardReference,
  buildArtifactChatOpenRequest,
  buildEntityBoardReference,
  buildEntityChatOpenRequest,
  buildSignalBoardReference,
  buildSignalChatOpenRequest,
  queueWorkspaceReferenceOnBoard,
} from '@/services/workspace/workspaceHandoffs';
import type {
  Artifact,
  ChatOpenRequest,
  Entity,
  Headline,
  InvestigationLaunchRequest,
  InvestigationRunConfig,
  InvestigationScope,
  Workspace,
  WorkspaceBoardItemReference,
} from '@/types';

interface UseOperationViewInspectorStateInput {
  activeWorkspace: Workspace | null;
  artifactRouteState?: ArtifactRouteState;
  closeLeftPanelForMobile: () => void;
  effectiveWorkspaceId: string | null;
  ensureWorkspaceBoard: (workspaceId: string) => Promise<{ id: string }>;
  navigate: (path: string) => void;
  onInvestigateHeadline?: (request: InvestigationLaunchRequest) => void;
  onInvestigateEntity: (entityName: string) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
  queueBoardPlacement: (input: {
    workspaceId: string;
    boardId: string;
    item: WorkspaceBoardItemReference;
    openInBoard?: boolean;
    mode?: 'PLACE' | 'FOCUS_OR_PLACE';
  }) => void;
  artifact: Artifact | null;
  resolveScope: (scopeId?: string) => InvestigationScope | undefined;
  toConfigOverride: (
    config?: InvestigationRunConfig
  ) => Partial<NonNullable<InvestigationLaunchRequest['configOverride']>> | undefined;
}

export const useOperationViewInspectorState = ({
  activeWorkspace,
  artifactRouteState,
  closeLeftPanelForMobile,
  effectiveWorkspaceId,
  ensureWorkspaceBoard,
  navigate,
  onInvestigateHeadline,
  onInvestigateEntity,
  onOpenChat,
  queueBoardPlacement,
  artifact,
  resolveScope,
  toConfigOverride,
}: UseOperationViewInspectorStateInput) => {
  const lastAppliedArtifactFocusKeyRef = useRef<string | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [inspectorMode, setInspectorMode] = useState<'ENTITY' | 'HEADLINE' | 'REPORT' | null>(
    null
  );
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<Headline | null>(null);

  useEffect(() => {
    if (!artifact) return;

    const focusKey = [
      artifact.id || artifact.topic,
      artifactRouteState?.inspector || '',
      artifactRouteState?.focusSectionId || '',
      artifactRouteState?.focusEvidenceId || '',
    ].join(':');

    const shouldOpenArtifactInspector =
      artifactRouteState?.inspector === 'REPORT' ||
      !!artifactRouteState?.focusSectionId ||
      !!artifactRouteState?.focusEvidenceId;

    if (shouldOpenArtifactInspector && lastAppliedArtifactFocusKeyRef.current !== focusKey) {
      lastAppliedArtifactFocusKeyRef.current = focusKey;
      queueMicrotask(() => {
        setSelectedEntity(null);
        setSelectedHeadline(null);
        setInspectorMode('REPORT');
        setRightPanelOpen(true);
        closeLeftPanelForMobile();
      });
      return;
    }

    if (!inspectorMode) {
      queueMicrotask(() => {
        setInspectorMode('REPORT');
      });
    }
  }, [
    artifactRouteState?.focusEvidenceId,
    artifactRouteState?.focusSectionId,
    artifactRouteState?.inspector,
    closeLeftPanelForMobile,
    inspectorMode,
    artifact,
  ]);

  const openInspector = useCallback(
    (mode: 'ENTITY' | 'HEADLINE' | 'REPORT') => {
      setInspectorMode(mode);
      setRightPanelOpen(true);
      closeLeftPanelForMobile();
    },
    [closeLeftPanelForMobile]
  );

  const handleEntityClick = useCallback(
    (entity: Entity) => {
      setSelectedHeadline(null);
      setSelectedEntity(entity);
      openInspector('ENTITY');
    },
    [openInspector]
  );

  const handleHeadlineClick = useCallback(
    (headline: Headline) => {
      setSelectedEntity(null);
      setSelectedHeadline(headline);
      openInspector('HEADLINE');
    },
    [openInspector]
  );

  const handleOpenArtifactInspector = useCallback(() => {
    if (!artifact) return;
    setSelectedEntity(null);
    setSelectedHeadline(null);
    openInspector('REPORT');
  }, [artifact, openInspector]);

  const handleHeadlineInvestigate = useCallback(() => {
    if (!selectedHeadline || !onInvestigateHeadline) return;

    onInvestigateHeadline({
      topic: selectedHeadline.content,
      parentContext: activeWorkspace
        ? { topic: activeWorkspace.title, summary: activeWorkspace.description || '' }
        : undefined,
      configOverride: toConfigOverride(artifact?.config),
      scope: resolveScope(artifact?.config?.scopeId),
      dateRangeOverride: artifact?.config?.dateRangeOverride,
      launchSource: 'OPERATION_HEADLINE',
      sourceSignalId: selectedHeadline.id,
      parentArtifactId: artifact?.id,
    });
    setRightPanelOpen(false);
  }, [
    activeWorkspace,
    onInvestigateHeadline,
    artifact?.config,
    artifact?.id,
    resolveScope,
    selectedHeadline,
    toConfigOverride,
  ]);

  const handleOpenArtifactChat = useCallback(() => {
    if (artifact) {
      const request = buildArtifactChatOpenRequest(artifact);
      if (request) {
        onOpenChat(request);
        return;
      }
    }

    const workspaceId = effectiveWorkspaceId || artifact?.workspaceId;
    if (!workspaceId) return;
    onOpenChat({ workspaceId });
  }, [artifact, effectiveWorkspaceId, onOpenChat]);

  const handleOpenWorkspaceBoard = useCallback(async () => {
    const workspaceId = effectiveWorkspaceId || artifact?.workspaceId;
    if (!workspaceId) return;

    const board = await ensureWorkspaceBoard(workspaceId);
    navigate(buildWorkspaceBoardDocumentPath(workspaceId, board.id));
  }, [artifact?.workspaceId, effectiveWorkspaceId, ensureWorkspaceBoard, navigate]);

  const handlePlaceReferenceOnBoard = useCallback(
    async (reference: WorkspaceBoardItemReference) => {
      await queueWorkspaceReferenceOnBoard({
        ensureWorkspaceBoard,
        navigate,
        queueBoardPlacement,
        reference,
        workspaceId: reference.workspaceId,
      });
    },
    [ensureWorkspaceBoard, navigate, queueBoardPlacement]
  );

  const handlePlaceArtifactOnBoard = useCallback(async () => {
    if (!artifact) return;
    const reference = buildArtifactBoardReference(artifact);
    if (!reference) return;
    await handlePlaceReferenceOnBoard(reference);
  }, [artifact, handlePlaceReferenceOnBoard]);

  const handleOpenEntityChat = useCallback(
    (entityName: string) => {
      const request = buildEntityChatOpenRequest({
        entityName,
        relatedArtifactId: artifact?.id,
        workspaceId: effectiveWorkspaceId || artifact?.workspaceId,
      });
      if (!request) return;
      onOpenChat(request);
      setRightPanelOpen(false);
    },
    [artifact?.id, artifact?.workspaceId, effectiveWorkspaceId, onOpenChat]
  );

  const handlePlaceEntityOnBoard = useCallback(
    async (entityName: string) => {
      const workspaceId = effectiveWorkspaceId || artifact?.workspaceId;
      if (!workspaceId) return;

      const entityNameToPlace = selectedEntity?.name === entityName ? selectedEntity.name : entityName;
      const reference = buildEntityBoardReference({
        entityName: entityNameToPlace,
        workspaceId,
      });
      if (!reference) return;
      await handlePlaceReferenceOnBoard(reference);
      setRightPanelOpen(false);
    },
    [artifact?.workspaceId, effectiveWorkspaceId, handlePlaceReferenceOnBoard, selectedEntity]
  );

  const handleOpenHeadlineChat = useCallback(() => {
    if (!selectedHeadline) return;
    const request = buildSignalChatOpenRequest(selectedHeadline);
    if (!request) return;
    onOpenChat(request);
    setRightPanelOpen(false);
  }, [onOpenChat, selectedHeadline]);

  const handlePlaceHeadlineOnBoard = useCallback(async () => {
    if (!selectedHeadline) return;
    const reference = buildSignalBoardReference(selectedHeadline);
    if (!reference) return;
    await handlePlaceReferenceOnBoard(reference);
    setRightPanelOpen(false);
  }, [handlePlaceReferenceOnBoard, selectedHeadline]);

  const handleInvestigateEntity = useCallback(
    (entityName: string) => {
      setRightPanelOpen(false);
      onInvestigateEntity(entityName);
    },
    [onInvestigateEntity]
  );

  return {
    handleEntityClick,
    handleHeadlineClick,
    handleHeadlineInvestigate,
    handleInvestigateEntity,
    handleOpenEntityChat,
    handleOpenHeadlineChat,
    handleOpenArtifactChat,
    handleOpenArtifactInspector,
    handleOpenWorkspaceBoard,
    handlePlaceEntityOnBoard,
    handlePlaceHeadlineOnBoard,
    handlePlaceArtifactOnBoard,
    inspectorMode,
    rightPanelOpen,
    selectedEntity,
    selectedHeadline,
    setRightPanelOpen,
    setSelectedEntity,
  };
};
