import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type {
  Artifact,
  ChatOpenRequest,
  InvestigationLaunchRequest,
  WorkspaceItem,
} from '../../types';
import {
  ArrowRight,
  ChevronDown,
  Download,
  FileJson,
  FileText,
  Filter,
  Folder,
  FolderClosed,
  FolderOpen,
  LayoutGrid,
  Link2,
  List,
  MessageSquare,
  Plus,
  Trash2,
  Workflow,
} from 'lucide-react';

import { RunSetupModal } from './Runs/RunSetupModal';
import { EmptyState } from '../ui/EmptyState';
import { OsintSelect } from '../ui/OsintSelect';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { GlobalSearch } from '../ui/GlobalSearch';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { exportCaseAsHtml, exportCaseAsJson, exportCaseAsMarkdown } from '../../utils/exportUtils';
import { CANONICAL_NOUNS, getWorkspaceDisplayTitle } from '../../domain';
import {
  CHROME_HEADER_CLASS,
  CHROME_HEADER_ICON_BUTTON_SIZE_CLASS,
  CHROME_HEADER_LEADING_GROUP_CLASS,
  CHROME_HEADER_PRIMARY_ACTION_CLASS,
  CHROME_HEADER_SELECT_TRIGGER_CLASS,
  CHROME_HEADER_SELECT_WRAP_CLASS,
  getChromeMenuButtonClass,
  getChromeToggleButtonClass,
} from '../ui/chrome';
import {
  clearStoredActiveWorkspaceId,
  getStoredActiveWorkspaceId,
  setStoredActiveWorkspaceId,
} from '../../utils/localStorage';
import {
  buildArtifactBoardReference,
  buildArtifactChatOpenRequest,
  buildWorkspaceItemBoardReference,
  buildWorkspaceItemChatOpenRequest,
  queueWorkspaceReferenceOnBoard,
} from '../../services/workspace/workspaceHandoffs';
import { parseFilesRouteState } from '@/app/routes';

interface FilesProps {
  onSelectReport: (report: Artifact) => void;
  onStartNewCase: (request: InvestigationLaunchRequest) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
}

type FilesViewMode = 'GRID' | 'LIST';
type RecordFilter = 'ALL' | 'ARTIFACT' | 'ITEM';

export const Files: React.FC<FilesProps> = ({ onSelectReport, onStartNewCase, onOpenChat }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeState = parseFilesRouteState(searchParams);
  const {
    artifacts,
    workspaces,
    workspaceItems,
    deleteArtifact,
    ensureWorkspaceBoard,
    purgeWorkspace,
    queueBoardPlacement,
    setActiveWorkspaceId,
  } = useWorkspaceStore();

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() => {
    const activeWorkspaceId = getStoredActiveWorkspaceId();
    if (activeWorkspaceId && activeWorkspaceId !== 'ALL') {
      return activeWorkspaceId;
    }
    return null;
  });
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recordFilter, setRecordFilter] = useState<RecordFilter>('ALL');
  const [viewMode, setViewMode] = useState<FilesViewMode>('LIST');
  const [workspacePendingPurge, setWorkspacePendingPurge] = useState<{
    id: string;
    name: string;
    reportCount: number;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleOpenNewWorkspaceModal = () => setIsNewCaseModalOpen(true);
    window.addEventListener('OPEN_NEW_WORKSPACE_MODAL', handleOpenNewWorkspaceModal);
    return () =>
      window.removeEventListener('OPEN_NEW_WORKSPACE_MODAL', handleOpenNewWorkspaceModal);
  }, []);

  const effectiveSelectedCaseId =
    requestedCaseId &&
    requestedCaseId !== 'unassigned' &&
    !workspaces.some((workspace) => workspace.id === requestedCaseId)
      ? null
      : requestedCaseId;

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

  const getCaseReports = (workspaceId: string) =>
    artifacts.filter((artifact) => artifact.workspaceId === workspaceId);
  const getCaseItems = (workspaceId: string) =>
    workspaceItems.filter((item) => item.workspaceId === workspaceId);
  const getUnassignedReports = () => artifacts.filter((artifact) => !artifact.workspaceId);

  const handleDeleteReport = async (event: React.MouseEvent, id?: string) => {
    event.stopPropagation();
    if (!id) return;
    await deleteArtifact(id);
  };

  const handlePlaceArtifactOnBoard = async (event: React.MouseEvent, artifact: Artifact) => {
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

  const handlePlaceItemOnBoard = async (event: React.MouseEvent, item: WorkspaceItem) => {
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

  const handlePurgeCase = (workspaceId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();

    const targetWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);
    setWorkspacePendingPurge({
      id: workspaceId,
      name: targetWorkspace
        ? getWorkspaceDisplayTitle(targetWorkspace)
        : `this ${workspaceLabelLower}`,
      reportCount: getCaseReports(workspaceId).length,
    });
  };

  const confirmPurgeCase = async () => {
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

  const handleCaseSelect = (id: string) => {
    if (id === 'ALL') {
      setSelectedCaseId(null);
      clearStoredActiveWorkspaceId();
    } else {
      setSelectedCaseId(id);
      setStoredActiveWorkspaceId(id);
    }

    setCurrentPage(1);
    setRecordFilter('ALL');
  };

  const renderPagination = (current: number, total: number) =>
    total > 1 ? (
      <div className="flex items-center justify-center space-x-4 pt-8">
        <button
          onClick={() => setCurrentPage(Math.max(1, current - 1))}
          disabled={current === 1}
          className="osint-meta-label border border-zinc-800 p-2 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500"
        >
          Prev
        </button>
        <span className="osint-meta-label">
          Page {current} of {total}
        </span>
        <button
          onClick={() => setCurrentPage(Math.min(total, current + 1))}
          disabled={current === total}
          className="osint-meta-label border border-zinc-800 p-2 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500"
        >
          Next
        </button>
      </div>
    ) : null;

  const renderWorkspaceOverview = () => {
    if (workspaces.length === 0 && getUnassignedReports().length === 0) {
      return (
        <EmptyState
          icon={FolderOpen}
          title="Files Empty"
          description={`No saved ${CANONICAL_NOUNS.workspacePlural.toLowerCase()} or ${CANONICAL_NOUNS.artifactPlural.toLowerCase()} found yet. Start a new run to begin collecting work.`}
          action={{
            label: `Start New ${CANONICAL_NOUNS.workspace}`,
            onClick: () => setIsNewCaseModalOpen(true),
          }}
          className="animate-in fade-in duration-700"
        />
      );
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedWorkspaces = workspaces.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(workspaces.length / itemsPerPage);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {viewMode === 'GRID' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {paginatedWorkspaces.map((workspace) => {
              const fileCount = getCaseReports(workspace.id).length;
              const itemCount = getCaseItems(workspace.id).length;

              return (
                <div
                  key={workspace.id}
                  onClick={() => handleCaseSelect(workspace.id)}
                  className="group relative cursor-pointer overflow-hidden border border-zinc-800 bg-osint-panel/80 p-6 backdrop-blur-sm transition-all hover:border-osint-primary"
                >
                  <div className="absolute right-0 top-0 p-4 opacity-20 transition-opacity group-hover:opacity-40">
                    <Folder className="h-24 w-24 text-white" />
                  </div>

                  <div className="relative z-10 mb-4 flex items-start justify-between">
                    <div className="border border-zinc-700 bg-zinc-900 p-3 text-white">
                      <FolderClosed className="h-8 w-8" />
                    </div>
                    <span
                      className={`osint-meta-label border px-2 py-1 ${workspace.status === 'ACTIVE' ? 'border-osint-primary/50 bg-osint-primary/10 text-osint-primary' : 'border-zinc-700 text-zinc-500'}`}
                    >
                      {workspace.status}
                    </span>
                  </div>

                  <h3 className="osint-title-card relative z-10 mb-1 truncate transition-colors group-hover:text-zinc-300">
                    {getWorkspaceDisplayTitle(workspace)}
                  </h3>
                  <p className="osint-body-quiet mb-4">{workspace.dateOpened}</p>

                  <div className="osint-meta-label relative z-10 flex items-center justify-between border-t border-zinc-800 pt-4">
                    <span className="flex items-center gap-3">
                      <span className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        {fileCount} {fileCount === 1 ? artifactLabel : artifactLabelPlural}
                      </span>
                      <span>
                        {itemCount} {CANONICAL_NOUNS.itemPlural.toLowerCase()}
                      </span>
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenChat({ workspaceId: workspace.id });
                        }}
                        className="p-1 opacity-0 transition-colors group-hover:opacity-100 hover:text-white"
                        title={`Open ${workspaceLabelLower} in workspace chat`}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          exportCaseAsHtml(workspace, getCaseReports(workspace.id));
                        }}
                        className="p-1 opacity-0 transition-colors group-hover:opacity-100 hover:text-white"
                        title={`Export formatted printable ${workspaceLabelLower} (HTML)`}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          exportCaseAsJson(workspace, getCaseReports(workspace.id));
                        }}
                        className="p-1 opacity-0 transition-colors group-hover:opacity-100 hover:text-white"
                        title={`Export raw ${workspaceLabelLower} data for backup (JSON)`}
                      >
                        <FileJson className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          exportCaseAsMarkdown(workspace, getCaseReports(workspace.id));
                        }}
                        className="p-1 opacity-0 transition-colors group-hover:opacity-100 hover:text-white"
                        title={`Export ${workspaceLabelLower} as Markdown (.md)`}
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(event) => handlePurgeCase(workspace.id, event)}
                        className="p-1 opacity-0 transition-colors group-hover:opacity-100 hover:text-osint-danger"
                        title={`Permanently Purge ${workspaceLabel}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {getUnassignedReports().length > 0 ? (
              <div
                onClick={() => handleCaseSelect('unassigned')}
                className="cursor-pointer border border-dashed border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-sm transition-all hover:border-zinc-500"
              >
                <div className="mb-4 flex justify-between">
                  <div className="bg-zinc-900 p-3 text-zinc-500">
                    <FolderOpen className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="osint-title-card mb-1 text-zinc-400 transition-colors hover:text-white">
                  Unassigned
                </h3>
                <p className="osint-body-quiet mb-4">{`Loose ${artifactLabelPlural}`}</p>
                <div className="osint-meta-label flex items-center border-t border-zinc-800 pt-4">
                  <FileText className="mr-2 h-4 w-4" />
                  {getUnassignedReports().length} {artifactLabelPlural}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden border border-zinc-800 bg-zinc-950/70">
            <div className="osint-meta-label grid grid-cols-[minmax(0,1.6fr)_auto_auto_auto] gap-4 border-b border-zinc-800 px-4 py-3">
              <span>Workspace</span>
              <span>Artifacts</span>
              <span>Items</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-zinc-800">
              {paginatedWorkspaces.map((workspace) => {
                const fileCount = getCaseReports(workspace.id).length;
                const itemCount = getCaseItems(workspace.id).length;

                return (
                  <div
                    key={workspace.id}
                    onClick={() => handleCaseSelect(workspace.id)}
                    className="grid cursor-pointer grid-cols-[minmax(0,1.6fr)_auto_auto_auto] gap-4 px-4 py-4 transition hover:bg-zinc-900/70"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="osint-title-inline">{getWorkspaceDisplayTitle(workspace)}</div>
                        <span
                          className={`osint-meta-label border px-2 py-0.5 ${workspace.status === 'ACTIVE' ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary' : 'border-zinc-700 text-zinc-500'}`}
                        >
                          {workspace.status}
                        </span>
                      </div>
                      <div className="osint-meta-label mt-1">
                        {workspace.dateOpened}
                      </div>
                      <p className="osint-body-quiet mt-2 line-clamp-2">
                        {workspace.description ||
                          'Open this workspace to inspect artifacts, items, and saved history.'}
                      </p>
                    </div>
                    <div className="osint-meta-value self-center text-right">{fileCount}</div>
                    <div className="osint-meta-value self-center text-right">{itemCount}</div>
                    <div className="flex items-center justify-end gap-2 self-center">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenChat({ workspaceId: workspace.id });
                        }}
                        className="text-zinc-500 transition hover:text-white"
                        title={`Open ${workspaceLabelLower} in workspace chat`}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(event) => handlePurgeCase(workspace.id, event)}
                        className="text-zinc-500 transition hover:text-osint-danger"
                        title={`Permanently Purge ${workspaceLabel}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <ArrowRight className="h-4 w-4 text-zinc-600" />
                    </div>
                  </div>
                );
              })}

              {getUnassignedReports().length > 0 ? (
                <div
                  onClick={() => handleCaseSelect('unassigned')}
                  className="grid cursor-pointer grid-cols-[minmax(0,1.6fr)_auto_auto_auto] gap-4 px-4 py-4 transition hover:bg-zinc-900/70"
                >
                  <div className="min-w-0">
                    <div className="osint-title-inline text-zinc-300">Unassigned</div>
                    <div className="osint-meta-label mt-1">
                      Loose {artifactLabelPlural}
                    </div>
                  </div>
                  <div className="osint-meta-value self-center text-right">{getUnassignedReports().length}</div>
                  <div className="osint-meta-value self-center text-right text-zinc-500">0</div>
                  <div className="flex items-center justify-end">
                    <ArrowRight className="h-4 w-4 text-zinc-600" />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {renderPagination(currentPage, totalPages)}
      </div>
    );
  };

  const renderWorkspaceRecords = (workspaceId: string) => {
    const isUnassigned = workspaceId === 'unassigned';
    const caseReports = isUnassigned ? getUnassignedReports() : getCaseReports(workspaceId);
    const caseItems = isUnassigned ? [] : getCaseItems(workspaceId);
    const records: Array<
      | { kind: 'ARTIFACT'; sortAt: number; artifact: Artifact }
      | { kind: 'ITEM'; sortAt: number; item: WorkspaceItem }
    > = [
      ...caseReports.map((artifact) => ({
        kind: 'ARTIFACT' as const,
        sortAt: artifact.createdAt || 0,
        artifact,
      })),
      ...caseItems.map((item) => ({
        kind: 'ITEM' as const,
        sortAt: item.updatedAt || item.createdAt || 0,
        item,
      })),
    ]
      .filter((record) => effectiveRecordFilter === 'ALL' || record.kind === effectiveRecordFilter)
      .sort((left, right) => right.sortAt - left.sortAt);
    const focusedItemPage =
      focusedItem && !isUnassigned && focusedItem.workspaceId === workspaceId
        ? Math.floor(
            Math.max(
              0,
              records.findIndex(
                (record) => record.kind === 'ITEM' && record.item.id === focusedItem.id
              )
            ) / itemsPerPage
          ) + 1
        : null;
    const resolvedCurrentPage = focusedItemPage || currentPage;

    const startIndex = (resolvedCurrentPage - 1) * itemsPerPage;
    const paginatedRecords = records.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(records.length / itemsPerPage);

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        {focusedItem && !isUnassigned && focusedItem.workspaceId === workspaceId ? (
          <div className="mb-6 border border-osint-primary/40 bg-osint-primary/10 p-5">
            <div className="osint-meta-label text-osint-primary">Focused Item</div>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="osint-title-card">{focusedItem.title}</div>
                <div className="osint-body-small mt-2 max-w-3xl">
                  {focusedItem.description ||
                    focusedItem.textContent ||
                    focusedItem.url ||
                    focusedItem.fileName ||
                    'Saved workspace item'}
                </div>
                <div className="osint-meta-label mt-3">
                  {focusedItem.kind} / {focusedItem.provenance?.source || 'USER'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenChat(buildWorkspaceItemChatOpenRequest(focusedItem))}
                  className="osint-meta-label-strong inline-flex items-center gap-2 border border-zinc-700 px-3 py-2 text-zinc-200 transition hover:border-white hover:text-white"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </button>
                <button
                  onClick={() =>
                    void queueWorkspaceReferenceOnBoard({
                      ensureWorkspaceBoard,
                      navigate,
                      queueBoardPlacement,
                      reference: buildWorkspaceItemBoardReference(focusedItem),
                      workspaceId: focusedItem.workspaceId,
                    })
                  }
                  className="osint-meta-label-strong inline-flex items-center gap-2 border border-zinc-700 px-3 py-2 text-zinc-200 transition hover:border-white hover:text-white"
                >
                  <Workflow className="h-4 w-4" />
                  Board
                </button>
                {focusedItem.url ? (
                  <button
                    onClick={() => window.open(focusedItem.url, '_blank', 'noopener,noreferrer')}
                    className="osint-meta-label-strong inline-flex items-center gap-2 border border-zinc-700 px-3 py-2 text-zinc-200 transition hover:border-white hover:text-white"
                  >
                    <Link2 className="h-4 w-4" />
                    Source
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        {viewMode === 'GRID' ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {records.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center border border-dashed border-zinc-800 bg-zinc-900/20 py-20 animate-in fade-in">
                <FileText className="mb-4 h-12 w-12 text-zinc-800" />
                <div className="osint-meta-label italic text-zinc-600">
                  NO_WORKSPACE_RECORDS_MATCH_FILTER
                </div>
              </div>
            ) : (
              paginatedRecords.map((record, index) =>
                record.kind === 'ARTIFACT' ? (
                  <div
                    key={record.artifact.id || index}
                    onClick={() => onSelectReport(record.artifact)}
                    className="group flex cursor-pointer items-center justify-between border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-sm transition-all hover:border-osint-primary hover:bg-zinc-900"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="border border-zinc-800 bg-black p-3 text-white group-hover:border-zinc-600">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="osint-meta-label">Artifact</div>
                        <h3 className="font-sans text-base font-normal leading-7 tracking-normal text-zinc-200 transition-colors group-hover:text-white">
                          {record.artifact.topic}
                        </h3>
                        <div className="osint-meta-label mt-1">
                          {record.artifact.dateStr || 'Unknown Date'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {record.artifact.workspaceId && record.artifact.id ? (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            const request = buildArtifactChatOpenRequest(record.artifact);
                            if (!request) return;
                            onOpenChat(request);
                          }}
                          className="p-2 text-zinc-600 opacity-0 transition-colors group-hover:opacity-100 hover:text-white"
                          title="Open artifact context in workspace chat"
                        >
                          <MessageSquare className="h-5 w-5" />
                        </button>
                      ) : null}
                      {record.artifact.workspaceId && record.artifact.id ? (
                        <button
                          onClick={(event) =>
                            void handlePlaceArtifactOnBoard(event, record.artifact)
                          }
                          className="p-2 text-zinc-600 opacity-0 transition-colors group-hover:opacity-100 hover:text-white"
                          title="Place artifact on board"
                        >
                          <Workflow className="h-5 w-5" />
                        </button>
                      ) : null}
                      <button
                        onClick={(event) => handleDeleteReport(event, record.artifact.id)}
                        className="osint-danger-inline p-2 text-zinc-600 opacity-0 group-hover:opacity-100"
                        title="Delete Artifact"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <ArrowRight className="h-5 w-5 text-zinc-700 transition-colors group-hover:text-white" />
                    </div>
                  </div>
                ) : (
                  <div
                    key={record.item.id}
                    ref={
                      focusedItem?.id === record.item.id
                        ? (node) => {
                            focusedItemRowRef.current = node;
                          }
                        : undefined
                    }
                    className={`group flex items-center justify-between border bg-zinc-900/70 p-6 backdrop-blur-sm transition-all hover:bg-zinc-900 ${
                      focusedItem?.id === record.item.id
                        ? 'border-osint-primary shadow-[0_0_0_1px_rgba(231,255,77,0.28)]'
                        : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex min-w-0 items-center space-x-4">
                      <div className="border border-zinc-800 bg-black p-3 text-white group-hover:border-zinc-600">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="osint-meta-label">{record.item.kind}</div>
                        <h3 className="truncate font-sans text-base font-normal leading-7 tracking-normal text-zinc-200 transition-colors group-hover:text-white">
                          {record.item.title}
                        </h3>
                        <div className="osint-body-quiet mt-1 line-clamp-2">
                          {record.item.description ||
                            record.item.textContent ||
                            record.item.url ||
                            record.item.fileName ||
                            'Saved workspace item'}
                        </div>
                        <div className="osint-meta-label mt-2 text-zinc-600">
                          {record.item.provenance?.source || 'USER'} /{' '}
                          {new Date(record.item.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex items-center space-x-4">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenChat(buildWorkspaceItemChatOpenRequest(record.item));
                        }}
                        className="p-2 text-zinc-600 opacity-0 transition-colors group-hover:opacity-100 hover:text-white"
                        title="Open workspace chat"
                      >
                        <MessageSquare className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(event) => void handlePlaceItemOnBoard(event, record.item)}
                        className="p-2 text-zinc-600 opacity-0 transition-colors group-hover:opacity-100 hover:text-white"
                        title="Place item on board"
                      >
                        <Workflow className="h-5 w-5" />
                      </button>
                      {record.item.url ? (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            window.open(record.item.url, '_blank', 'noopener,noreferrer');
                          }}
                          className="p-2 text-zinc-600 opacity-0 transition-colors group-hover:opacity-100 hover:text-white"
                          title="Open linked source"
                        >
                          <Link2 className="h-5 w-5" />
                        </button>
                      ) : null}
                      <ArrowRight className="h-5 w-5 text-zinc-700 transition-colors group-hover:text-white" />
                    </div>
                  </div>
                )
              )
            )}
          </div>
        ) : (
          <div className="overflow-hidden border border-zinc-800 bg-zinc-950/70">
            <div className="osint-meta-label grid grid-cols-[auto_minmax(0,1.4fr)_auto_auto] gap-4 border-b border-zinc-800 px-4 py-3">
              <span>Type</span>
              <span>Record</span>
              <span>Updated</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-zinc-800">
              {records.length === 0 ? (
                <div className="osint-meta-label px-4 py-16 text-center text-zinc-600">
                  No workspace records match filter
                </div>
              ) : (
                paginatedRecords.map((record, index) =>
                  record.kind === 'ARTIFACT' ? (
                    <div
                      key={record.artifact.id || index}
                      onClick={() => onSelectReport(record.artifact)}
                      className="grid cursor-pointer grid-cols-[auto_minmax(0,1.4fr)_auto_auto] gap-4 px-4 py-4 transition hover:bg-zinc-900/70"
                    >
                      <div className="self-start border border-zinc-800 bg-black p-3 text-white">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="osint-meta-label">Artifact</div>
                        <h3 className="osint-title-inline mt-1 truncate">{record.artifact.topic}</h3>
                        <p className="osint-body-quiet mt-2 line-clamp-2">
                          {record.artifact.summary || 'Saved workspace artifact.'}
                        </p>
                      </div>
                      <div className="osint-meta-label self-center text-right">
                        {record.artifact.dateStr || 'Unknown Date'}
                      </div>
                      <div className="flex items-center justify-end gap-3 self-center">
                        {record.artifact.workspaceId && record.artifact.id ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              const request = buildArtifactChatOpenRequest(record.artifact);
                              if (!request) return;
                              onOpenChat(request);
                            }}
                            className="text-zinc-500 transition hover:text-white"
                            title="Open artifact context in workspace chat"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        ) : null}
                        {record.artifact.workspaceId && record.artifact.id ? (
                          <button
                            onClick={(event) =>
                              void handlePlaceArtifactOnBoard(event, record.artifact)
                            }
                            className="text-zinc-500 transition hover:text-white"
                            title="Place artifact on board"
                          >
                            <Workflow className="h-4 w-4" />
                          </button>
                        ) : null}
                        <button
                          onClick={(event) => handleDeleteReport(event, record.artifact.id)}
                          className="text-zinc-500 transition hover:text-osint-danger"
                          title="Delete Artifact"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <ArrowRight className="h-4 w-4 text-zinc-600" />
                      </div>
                    </div>
                  ) : (
                    <div
                      key={record.item.id}
                      className="grid grid-cols-[auto_minmax(0,1.4fr)_auto_auto] gap-4 px-4 py-4 transition hover:bg-zinc-900/70"
                    >
                      <div className="self-start border border-zinc-800 bg-black p-3 text-white">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="osint-meta-label">{record.item.kind}</div>
                        <h3 className="osint-title-inline mt-1 truncate">{record.item.title}</h3>
                        <p className="osint-body-quiet mt-2 line-clamp-2">
                          {record.item.description ||
                            record.item.textContent ||
                            record.item.url ||
                            record.item.fileName ||
                            'Saved workspace item'}
                        </p>
                      </div>
                      <div className="osint-meta-label self-center text-right">
                        {new Date(record.item.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center justify-end gap-3 self-center">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenChat(buildWorkspaceItemChatOpenRequest(record.item));
                          }}
                          className="text-zinc-500 transition hover:text-white"
                          title="Open workspace chat"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(event) => void handlePlaceItemOnBoard(event, record.item)}
                          className="text-zinc-500 transition hover:text-white"
                          title="Place item on board"
                        >
                          <Workflow className="h-4 w-4" />
                        </button>
                        {record.item.url ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              window.open(record.item.url, '_blank', 'noopener,noreferrer');
                            }}
                            className="text-zinc-500 transition hover:text-white"
                            title="Open linked source"
                          >
                            <Link2 className="h-4 w-4" />
                          </button>
                        ) : null}
                        <ArrowRight className="h-4 w-4 text-zinc-600" />
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        )}

        {renderPagination(resolvedCurrentPage, totalPages)}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen h-full w-full bg-black">
      <div className={`${CHROME_HEADER_CLASS} px-6`}>
        <div className="flex h-full min-w-0 items-center gap-3">
          <div className={CHROME_HEADER_LEADING_GROUP_CLASS}>
            <button
              onClick={() => setIsNewCaseModalOpen(true)}
              className={CHROME_HEADER_PRIMARY_ACTION_CLASS}
            >
              <Plus className="h-4 w-4" />
              <span>{`New ${workspaceLabel}`}</span>
            </button>
            <div className={CHROME_HEADER_SELECT_WRAP_CLASS}>
              <OsintSelect
                ariaLabel={`View ${workspaceLabel}`}
                value={effectiveSelectedCaseId || 'ALL'}
                onChange={handleCaseSelect}
                chrome="toolbar"
                triggerClassName={CHROME_HEADER_SELECT_TRIGGER_CLASS}
                options={[
                  { value: 'ALL', label: `All ${CANONICAL_NOUNS.workspacePlural}` },
                  ...workspaces.map((workspace) => ({
                    value: workspace.id,
                    label: getWorkspaceDisplayTitle(workspace),
                  })),
                  ...(getUnassignedReports().length > 0
                    ? [{ value: 'unassigned', label: `Unassigned ${artifactLabelPlural}` }]
                    : []),
                ]}
              />
            </div>
          </div>

          <div className="flex min-w-[12rem] flex-[0.95_1_24rem] items-center justify-center">
            <GlobalSearch compact className="mx-auto w-full" />
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <div className="flex items-center -space-x-px">
              <button
                onClick={() => setViewMode('LIST')}
                className={`flex ${CHROME_HEADER_ICON_BUTTON_SIZE_CLASS} ${getChromeToggleButtonClass(
                  viewMode === 'LIST'
                )}`}
                title="Show dense list view"
                aria-label="Show dense list view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('GRID')}
                className={`flex ${CHROME_HEADER_ICON_BUTTON_SIZE_CLASS} ${getChromeToggleButtonClass(
                  viewMode === 'GRID'
                )}`}
                title="Show grid view"
                aria-label="Show grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {effectiveSelectedCaseId && effectiveSelectedCaseId !== 'unassigned' ? (
              <div className="relative shrink-0" ref={filterMenuRef}>
                <button
                  onClick={() => {
                    setShowFilters((current) => !current);
                    setShowExportMenu(false);
                  }}
                  className={getChromeMenuButtonClass(showFilters)}
                  aria-label="Files filters"
                  title="Filter visible records"
                >
                  <Filter className="h-4 w-4" />
                </button>

                {showFilters ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] border border-zinc-700 bg-osint-panel shadow-2xl">
                    <div className="border-b border-zinc-800 bg-black px-4 py-3">
                      <h3 className="osint-panel-title">Files Filters</h3>
                    </div>
                    <div className="space-y-5 p-4">
                      <div>
                        <label className="osint-meta-label mb-2 block">Record Type</label>
                        <div className="space-y-2">
                          {(['ALL', 'ARTIFACT', 'ITEM'] as const).map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                setRecordFilter(value);
                                setCurrentPage(1);
                              }}
                              className={`osint-meta-label flex w-full items-center justify-between border px-3 py-2 transition ${
                                recordFilter === value
                                  ? 'border-osint-primary bg-osint-primary/10 text-osint-primary'
                                  : 'border-zinc-800 bg-black text-zinc-300 hover:border-zinc-600 hover:text-white'
                              }`}
                            >
                              <span>
                                {value === 'ALL'
                                  ? 'All'
                                  : value === 'ARTIFACT'
                                    ? 'Artifacts'
                                    : 'Items'}
                              </span>
                              {recordFilter === value ? <span>Active</span> : null}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setRecordFilter('ALL');
                            setCurrentPage(1);
                          }}
                          className="osint-meta-label hover:text-white"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFilters(false)}
                          className="osint-button-primary osint-meta-label-strong px-4 py-1.5"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {effectiveSelectedCaseId && effectiveSelectedCaseId !== 'unassigned'
              ? (() => {
                  const currentWorkspace = workspaces.find(
                    (workspace) => workspace.id === effectiveSelectedCaseId
                  );
                  if (!currentWorkspace) return null;

                  return (
                    <div className="relative" ref={exportMenuRef}>
                      <button
                        onClick={() => {
                          setShowExportMenu((current) => !current);
                          setShowFilters(false);
                        }}
                        className={getChromeMenuButtonClass(showExportMenu)}
                      >
                        <Download className="mr-1 h-4 w-4" />
                        <span className="hidden lg:inline">Export</span>
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </button>
                      {showExportMenu ? (
                        <div className="osint-menu-panel absolute right-0 top-full z-50 mt-1 min-w-[200px] border border-zinc-700 bg-zinc-900">
                          <button
                            onClick={() => {
                              exportCaseAsHtml(
                                currentWorkspace,
                                getCaseReports(currentWorkspace.id)
                              );
                              setShowExportMenu(false);
                            }}
                            className="osint-menu-item flex w-full items-center border-b border-zinc-800 px-4 py-3 text-left text-zinc-300"
                            title={`Exports a formatted printable ${workspaceLabelLower}`}
                          >
                            <Download className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                            <div>
                              <div className="osint-menu-item-title">{`${workspaceLabel} HTML`}</div>
                              <div className="osint-menu-item-description">
                                {`Formatted printable ${workspaceLabelLower}`}
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              exportCaseAsJson(
                                currentWorkspace,
                                getCaseReports(currentWorkspace.id)
                              );
                              setShowExportMenu(false);
                            }}
                            className="osint-menu-item flex w-full items-center border-b border-zinc-800 px-4 py-3 text-left text-zinc-300"
                            title={`Exports raw ${workspaceLabelLower} data for backup/integration`}
                          >
                            <FileJson className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                            <div>
                              <div className="osint-menu-item-title">{`${workspaceLabel} JSON`}</div>
                              <div className="osint-menu-item-description">
                                {`Raw ${workspaceLabelLower} data for backup`}
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              exportCaseAsMarkdown(
                                currentWorkspace,
                                getCaseReports(currentWorkspace.id)
                              );
                              setShowExportMenu(false);
                            }}
                            className="osint-menu-item flex w-full items-center px-4 py-3 text-left text-zinc-300"
                            title={`Exports ${workspaceLabelLower} as Markdown`}
                          >
                            <FileText className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                            <div>
                              <div className="osint-menu-item-title">{`${workspaceLabel} Markdown`}</div>
                              <div className="osint-menu-item-description">
                                {`${workspaceLabel} narrative package`}
                              </div>
                            </div>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })()
              : null}
          </div>
        </div>
      </div>

      {isNewCaseModalOpen ? (
        <RunSetupModal
          initialTopic=""
          onCancel={() => setIsNewCaseModalOpen(false)}
          onStart={(topic, configOverride, preseededEntities, scope, dateRange) => {
            onStartNewCase({
              topic,
              configOverride,
              preseededEntities,
              scope,
              dateRangeOverride: dateRange,
              launchSource: 'ARCHIVES_NEW_CASE',
            });
            setIsNewCaseModalOpen(false);
          }}
        />
      ) : null}

      {workspacePendingPurge ? (
        <ConfirmDialog
          title={`Purge ${workspacePendingPurge.name}?`}
          description={`This will delete ${workspacePendingPurge.reportCount} ${artifactLabelLower}(s), saved signals, workspace chat sessions, linked run history, and directly linked manual graph references for this ${workspaceLabelLower}. This cannot be undone.`}
          confirmLabel="Purge Workspace"
          tone="danger"
          onClose={() => setWorkspacePendingPurge(null)}
          onConfirm={() => void confirmPurgeCase()}
        />
      ) : null}

      <div className="relative z-10 h-full w-full overflow-y-auto p-6">
        {effectiveSelectedCaseId
          ? renderWorkspaceRecords(effectiveSelectedCaseId)
          : renderWorkspaceOverview()}
      </div>
    </div>
  );
};
