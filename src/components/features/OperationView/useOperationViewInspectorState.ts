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
  report: Artifact | null;
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
  report,
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
    if (!report) return;

    const focusKey = [
      report.id || report.topic,
      artifactRouteState?.inspector || '',
      artifactRouteState?.focusSectionId || '',
      artifactRouteState?.focusEvidenceId || '',
    ].join(':');

    const shouldOpenReportInspector =
      artifactRouteState?.inspector === 'REPORT' ||
      !!artifactRouteState?.focusSectionId ||
      !!artifactRouteState?.focusEvidenceId;

    if (shouldOpenReportInspector && lastAppliedArtifactFocusKeyRef.current !== focusKey) {
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
    report,
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

  const handleOpenReportInspector = useCallback(() => {
    if (!report) return;
    setSelectedEntity(null);
    setSelectedHeadline(null);
    openInspector('REPORT');
  }, [openInspector, report]);

  const handleHeadlineInvestigate = useCallback(() => {
    if (!selectedHeadline || !onInvestigateHeadline) return;

    onInvestigateHeadline({
      topic: selectedHeadline.content,
      parentContext: activeWorkspace
        ? { topic: activeWorkspace.title, summary: activeWorkspace.description || '' }
        : undefined,
      configOverride: toConfigOverride(report?.config),
      scope: resolveScope(report?.config?.scopeId),
      dateRangeOverride: report?.config?.dateRangeOverride,
      launchSource: 'OPERATION_HEADLINE',
      sourceSignalId: selectedHeadline.id,
      parentArtifactId: report?.id,
    });
    setRightPanelOpen(false);
  }, [
    activeWorkspace,
    onInvestigateHeadline,
    report?.config,
    report?.id,
    resolveScope,
    selectedHeadline,
    toConfigOverride,
  ]);

  const handleOpenReportChat = useCallback(() => {
    if (report) {
      const request = buildArtifactChatOpenRequest(report);
      if (request) {
        onOpenChat(request);
        return;
      }
    }

    const workspaceId = effectiveWorkspaceId || report?.workspaceId;
    if (!workspaceId) return;
    onOpenChat({ workspaceId });
  }, [effectiveWorkspaceId, onOpenChat, report]);

  const handleOpenWorkspaceBoard = useCallback(async () => {
    const workspaceId = effectiveWorkspaceId || report?.workspaceId;
    if (!workspaceId) return;

    const board = await ensureWorkspaceBoard(workspaceId);
    navigate(buildWorkspaceBoardDocumentPath(workspaceId, board.id));
  }, [effectiveWorkspaceId, ensureWorkspaceBoard, navigate, report?.workspaceId]);

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

  const handlePlaceReportOnBoard = useCallback(async () => {
    if (!report) return;
    const reference = buildArtifactBoardReference(report);
    if (!reference) return;
    await handlePlaceReferenceOnBoard(reference);
  }, [handlePlaceReferenceOnBoard, report]);

  const handleOpenEntityChat = useCallback(
    (entityName: string) => {
      const request = buildEntityChatOpenRequest({
        entityName,
        relatedArtifactId: report?.id,
        workspaceId: effectiveWorkspaceId || report?.workspaceId,
      });
      if (!request) return;
      onOpenChat(request);
      setRightPanelOpen(false);
    },
    [effectiveWorkspaceId, onOpenChat, report?.id, report?.workspaceId]
  );

  const handlePlaceEntityOnBoard = useCallback(
    async (entityName: string) => {
      const workspaceId = effectiveWorkspaceId || report?.workspaceId;
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
    [effectiveWorkspaceId, handlePlaceReferenceOnBoard, report?.workspaceId, selectedEntity]
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
    handleOpenReportChat,
    handleOpenReportInspector,
    handleOpenWorkspaceBoard,
    handlePlaceEntityOnBoard,
    handlePlaceHeadlineOnBoard,
    handlePlaceReportOnBoard,
    inspectorMode,
    rightPanelOpen,
    selectedEntity,
    selectedHeadline,
    setRightPanelOpen,
    setSelectedEntity,
  };
};
