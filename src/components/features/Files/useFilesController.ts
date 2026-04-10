import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CANONICAL_NOUNS, getWorkspaceDisplayTitle } from '@/domain';
import { parseFilesRouteState } from '@/app/routes';
import {
  clearStoredActiveWorkspaceId,
  getStoredActiveWorkspaceId,
  setStoredActiveWorkspaceId,
} from '@/utils/localStorage';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useWorkspaceDocumentUpload } from '@/components/features/shared/useWorkspaceDocumentUpload';
import {
  buildArtifactBoardReference,
  buildArtifactChatOpenRequest,
  buildWorkspaceItemBoardReference,
  buildWorkspaceItemChatOpenRequest,
  queueWorkspaceReferenceOnBoard,
} from '@/services/workspace/workspaceHandoffs';
import type { Artifact, ChatOpenRequest, WorkspaceItem } from '@/types';
import type { AppIconId } from '@/lib/appIcons';
import {
  buildFilesOverviewViewModel,
  buildFilesRecordsViewModel,
  type FilesViewMode,
  type RecordFilter,
} from './filesViewModel';

interface UseFilesControllerInput {
  onOpenChat: (request: ChatOpenRequest) => void;
  onSelectReport: (report: Artifact) => void;
}

export const useFilesController = ({
  onOpenChat,
  onSelectReport,
}: UseFilesControllerInput) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeState = parseFilesRouteState(searchParams);
  const {
    artifacts,
    workspaces,
    workspaceItems,
    addToast,
    createWorkspaceItem,
    deleteArtifact,
    ensureWorkspaceBoard,
    purgeWorkspace,
    queueBoardPlacement,
    saveArtifact,
    setActiveWorkspaceId,
    updateWorkspace,
  } = useWorkspaceStore();

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recordFilter, setRecordFilter] = useState<RecordFilter>('ALL');
  const [viewMode, setViewMode] = useState<FilesViewMode>('GRID');
  const [workspacePendingPurge, setWorkspacePendingPurge] = useState<{
    id: string;
    name: string;
    reportCount: number;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const applyWorkspaceSelection = (id: string) => {
    if (id === 'ALL' || id === 'unassigned') {
      setSelectedCaseId(null);
      clearStoredActiveWorkspaceId();
      setActiveWorkspaceId(null);
    } else {
      setSelectedCaseId(id);
      setStoredActiveWorkspaceId(id);
      setActiveWorkspaceId(id);
    }

    setCurrentPage(1);
    setRecordFilter('ALL');
  };

  const exportMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const focusedItemRowRef = useRef<HTMLDivElement | null>(null);
  const itemsPerPage = 8;
  const workspaceLabel = CANONICAL_NOUNS.workspace;
  const workspaceLabelLower = workspaceLabel.toLowerCase();
  const artifactLabel = CANONICAL_NOUNS.artifact;
  const artifactLabelLower = artifactLabel.toLowerCase();
  const artifactLabelPlural = CANONICAL_NOUNS.artifactPlural;
  const focusedItem = routeState.focusItemId
    ? workspaceItems.find((item) => item.id === routeState.focusItemId) || null
    : null;
  const requestedCaseId = focusedItem?.workspaceId || routeState.workspaceId || selectedCaseId;
  const effectiveRecordFilter: RecordFilter = focusedItem ? 'ALL' : recordFilter;
  const effectiveSelectedCaseId =
    requestedCaseId &&
    requestedCaseId !== 'unassigned' &&
    !workspaces.some((workspace) => workspace.id === requestedCaseId)
      ? null
      : requestedCaseId;

  const overviewViewModel = useMemo(
    () =>
      buildFilesOverviewViewModel({
        artifacts,
        currentPage,
        itemsPerPage,
        workspaceItems,
        workspaces,
      }),
    [artifacts, currentPage, workspaceItems, workspaces]
  );

  const recordsViewModel = useMemo(
    () =>
      effectiveSelectedCaseId
        ? buildFilesRecordsViewModel({
            artifacts,
            currentPage,
            focusedItem,
            itemsPerPage,
            recordFilter: effectiveRecordFilter,
            workspaceId: effectiveSelectedCaseId,
            workspaceItems,
          })
        : null,
    [artifacts, currentPage, effectiveRecordFilter, effectiveSelectedCaseId, focusedItem, workspaceItems]
  );

  const currentWorkspace =
    effectiveSelectedCaseId && effectiveSelectedCaseId !== 'unassigned'
      ? workspaces.find((workspace) => workspace.id === effectiveSelectedCaseId) || null
      : null;
  const currentWorkspaceArtifacts = currentWorkspace
    ? artifacts.filter((artifact) => artifact.workspaceId === currentWorkspace.id)
    : [];
  const {
    closeUploadDialog,
    confirmUploadDialog,
    fileInputRef,
    handleFileUpload,
    openUploadPicker,
    setUploadArtifactType,
    setUploadRoute,
    setUploadTargetWorkspaceId,
    uploadDialogState,
    uploadInFlight,
  } = useWorkspaceDocumentUpload({
    addToast,
    createWorkspaceItem,
    initialWorkspaceId:
      currentWorkspace?.id ||
      (effectiveSelectedCaseId && effectiveSelectedCaseId !== 'unassigned'
        ? effectiveSelectedCaseId
        : null),
    onComplete: async (result) => {
      applyWorkspaceSelection(result.targetWorkspaceId);
    },
    saveArtifact,
    source: 'FILES',
    workspaces,
  });

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    const handleOpenNewWorkspaceModal = () => setIsNewCaseModalOpen(true);
    window.addEventListener('OPEN_NEW_WORKSPACE_MODAL', handleOpenNewWorkspaceModal);
    return () =>
      window.removeEventListener('OPEN_NEW_WORKSPACE_MODAL', handleOpenNewWorkspaceModal);
  }, []);

  useEffect(() => {
    if (!requestedCaseId || requestedCaseId === 'unassigned') return;
    if (workspaces.some((workspace) => workspace.id === requestedCaseId)) return;
    if (getStoredActiveWorkspaceId() === requestedCaseId) {
      clearStoredActiveWorkspaceId();
    }
  }, [requestedCaseId, workspaces]);

  useEffect(() => {
    if (!effectiveSelectedCaseId || effectiveSelectedCaseId === 'unassigned') return;
    setActiveWorkspaceId(effectiveSelectedCaseId);
    if (getStoredActiveWorkspaceId() !== effectiveSelectedCaseId) {
      setStoredActiveWorkspaceId(effectiveSelectedCaseId);
    }
  }, [effectiveSelectedCaseId, setActiveWorkspaceId]);

  useEffect(() => {
    if (!focusedItemRowRef.current) return;
    focusedItemRowRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [currentPage, effectiveRecordFilter, effectiveSelectedCaseId, focusedItem?.id, viewMode]);

  const handleDeleteReport = async (event: ReactMouseEvent, id?: string) => {
    event.stopPropagation();
    if (!id) return;
    await deleteArtifact(id);
  };

  const handlePlaceArtifactOnBoard = async (event: ReactMouseEvent, artifact: Artifact) => {
    event.stopPropagation();
    const reference = buildArtifactBoardReference(artifact);
    if (!reference || !artifact.workspaceId) return;

    setActiveWorkspaceId(artifact.workspaceId);
    await queueWorkspaceReferenceOnBoard({
      ensureWorkspaceBoard,
      navigate,
      queueBoardPlacement,
      reference,
      workspaceId: artifact.workspaceId,
    });
  };

  const handlePlaceItemOnBoard = async (event: ReactMouseEvent, item: WorkspaceItem) => {
    event.stopPropagation();
    setActiveWorkspaceId(item.workspaceId);
    await queueWorkspaceReferenceOnBoard({
      ensureWorkspaceBoard,
      navigate,
      queueBoardPlacement,
      reference: buildWorkspaceItemBoardReference(item),
      workspaceId: item.workspaceId,
    });
  };

  const handleWorkspaceSelect = (id: string) => {
    applyWorkspaceSelection(id);
  };

  const handleWorkspaceIconUpdate = async (workspaceId: string, iconId: AppIconId | null) => {
    await updateWorkspace(workspaceId, {
      iconId: iconId || undefined,
    });
  };

  const handlePurgeWorkspace = (workspaceId: string, event?: ReactMouseEvent) => {
    event?.stopPropagation();

    const targetWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);
    setWorkspacePendingPurge({
      id: workspaceId,
      name: targetWorkspace
        ? getWorkspaceDisplayTitle(targetWorkspace)
        : `this ${workspaceLabelLower}`,
      reportCount: artifacts.filter((artifact) => artifact.workspaceId === workspaceId).length,
    });
  };

  const confirmPurgeWorkspace = async () => {
    if (!workspacePendingPurge) return;

    await purgeWorkspace(workspacePendingPurge.id);

    if (effectiveSelectedCaseId === workspacePendingPurge.id) {
      setSelectedCaseId(null);
    }
    if (getStoredActiveWorkspaceId() === workspacePendingPurge.id) {
      clearStoredActiveWorkspaceId();
    }
    setWorkspacePendingPurge(null);
    setShowExportMenu(false);
    setCurrentPage(1);
  };

  return {
    artifactLabel,
    artifactLabelLower,
    artifactLabelPlural,
    currentPage,
    currentWorkspace,
    currentWorkspaceArtifacts,
    effectiveRecordFilter,
    effectiveSelectedCaseId,
    exportMenuRef,
    fileInputRef,
    filterMenuRef,
    focusedItem,
    focusedItemRowRef,
    getWorkspaceArtifacts: (workspaceId: string) =>
      artifacts.filter((artifact) => artifact.workspaceId === workspaceId),
    handleDeleteReport,
    handlePlaceArtifactOnBoard,
    handlePlaceItemOnBoard,
    handlePurgeWorkspace,
    handleWorkspaceIconUpdate,
    handleWorkspaceSelect,
    handleFileUpload,
    isNewCaseModalOpen,
    itemsPerPage,
    onOpenArtifactChat: (artifact: Artifact) => {
      const request = buildArtifactChatOpenRequest(artifact);
      if (!request) return;
      onOpenChat(request);
    },
    onOpenItemChat: (item: WorkspaceItem) => onOpenChat(buildWorkspaceItemChatOpenRequest(item)),
    onOpenItemSource: (item: WorkspaceItem) => {
      if (!item.url) return;
      window.open(item.url, '_blank', 'noopener,noreferrer');
    },
    onSelectArtifact: onSelectReport,
    overviewViewModel,
    recordFilter,
    recordsViewModel,
    routeState,
    setUploadArtifactType,
    setUploadRoute,
    setUploadTargetWorkspaceId,
    setCurrentPage,
    setIsNewCaseModalOpen,
    setRecordFilter,
    setShowExportMenu,
    setShowFilters,
    setViewMode,
    showExportMenu,
    showFilters,
    viewMode,
    workspaceLabel,
    workspaceLabelLower,
    workspacePendingPurge,
    uploadDialogState,
    uploadInFlight,
    workspaces,
    closeUploadDialog,
    closeWorkspacePurgeDialog: () => setWorkspacePendingPurge(null),
    confirmPurgeWorkspace,
    confirmUploadDialog,
    openUploadPicker,
  };
};

export type FilesController = ReturnType<typeof useFilesController>;
