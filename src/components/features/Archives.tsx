import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChatOpenRequest, InvestigationLaunchRequest, Artifact, WorkspaceItem } from '../../types';
import {
  FileText,
  Trash2,
  ArrowRight,
  FolderOpen,
  Folder,
  Plus,
  FolderClosed,
  Download,
  FileJson,
  ChevronDown,
  MessageSquare,
  Link2,
  Workflow,
} from 'lucide-react';
import { TaskSetupModal } from './Runs/TaskSetupModal';
import { EmptyState } from '../ui/EmptyState';
import { useWorkspaceStore } from '../../store/caseStore';
import { BackgroundMatrixRain } from '../ui/BackgroundMatrixRain';
import { OsintSelect } from '../ui/OsintSelect';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { exportCaseAsJson, exportCaseAsHtml, exportCaseAsMarkdown } from '../../utils/exportUtils';
import { CANONICAL_NOUNS, getWorkspaceDisplayTitle } from '../../domain';
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

interface ArchivesProps {
  onSelectReport: (report: Artifact) => void;
  onStartNewCase: (request: InvestigationLaunchRequest) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
}

export const Archives: React.FC<ArchivesProps> = ({
  onSelectReport,
  onStartNewCase,
  onOpenChat,
}) => {
  const navigate = useNavigate();
  const {
    artifacts,
    workspaces,
    workspaceItems,
    deleteReport,
    ensureWorkspaceBoard,
    purgeCase,
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
  const [recordFilter, setRecordFilter] = useState<'ALL' | 'ARTIFACT' | 'ITEM'>('ALL');
  const [workspacePendingPurge, setWorkspacePendingPurge] = useState<{
    id: string;
    name: string;
    reportCount: number;
  } | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const workspaceLabel = CANONICAL_NOUNS.workspace;
  const workspaceLabelLower = workspaceLabel.toLowerCase();
  const artifactLabel = CANONICAL_NOUNS.artifact;
  const artifactLabelLower = artifactLabel.toLowerCase();
  const artifactLabelPlural = CANONICAL_NOUNS.artifactPlural;

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
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
    selectedCaseId &&
    selectedCaseId !== 'unassigned' &&
    !workspaces.some((c) => c.id === selectedCaseId)
      ? null
      : selectedCaseId;

  useEffect(() => {
    if (!selectedCaseId || selectedCaseId === 'unassigned') return;
    if (workspaces.some((c) => c.id === selectedCaseId)) return;
    if (getStoredActiveWorkspaceId() === selectedCaseId) {
      clearStoredActiveWorkspaceId();
    }
  }, [workspaces, selectedCaseId]);

  const getCaseReports = (caseId: string) => {
    return artifacts.filter((r) => r.caseId === caseId);
  };

  const getCaseItems = (caseId: string) =>
    workspaceItems.filter((item) => item.workspaceId === caseId);

  const getUnassignedReports = () => {
    return artifacts.filter((r) => !r.caseId);
  };

  const handleDeleteReport = async (e: React.MouseEvent, id?: string) => {
    e.stopPropagation();
    if (!id) return;
    await deleteReport(id);
  };

  const handlePlaceArtifactOnBoard = async (e: React.MouseEvent, artifact: Artifact) => {
    e.stopPropagation();
    const reference = buildArtifactBoardReference(artifact);
    if (!reference || !artifact.caseId) return;

    setActiveWorkspaceId(artifact.caseId);
    await queueWorkspaceReferenceOnBoard({
      ensureWorkspaceBoard,
      navigate,
      queueBoardPlacement,
      reference,
      workspaceId: artifact.caseId,
    });
  };

  const handlePlaceItemOnBoard = async (e: React.MouseEvent, item: WorkspaceItem) => {
    e.stopPropagation();
    setActiveWorkspaceId(item.workspaceId);
    await queueWorkspaceReferenceOnBoard({
      ensureWorkspaceBoard,
      navigate,
      queueBoardPlacement,
      reference: buildWorkspaceItemBoardReference(item),
      workspaceId: item.workspaceId,
    });
  };

  const handlePurgeCase = (caseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const targetCase = workspaces.find((c) => c.id === caseId);
    const reportCount = getCaseReports(caseId).length;
    setWorkspacePendingPurge({
      id: caseId,
      name: targetCase ? getWorkspaceDisplayTitle(targetCase) : `this ${workspaceLabelLower}`,
      reportCount,
    });
  };

  const confirmPurgeCase = async () => {
    if (!workspacePendingPurge) return;

    await purgeCase(workspacePendingPurge.id);

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
    setCurrentPage(1); // Reset pagination on filter change
    setRecordFilter('ALL');
  };

  // --- RENDER HELPERS ---

  const renderCaseGrid = () => {
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
    const paginatedCases = workspaces.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(workspaces.length / itemsPerPage);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {/* Active Cases */}
          {paginatedCases.map((c) => {
            const fileCount = artifacts.filter((r) => r.caseId === c.id).length;
            const itemCount = workspaceItems.filter((item) => item.workspaceId === c.id).length;
            return (
              <div
                key={c.id}
                onClick={() => handleCaseSelect(c.id)}
                className="bg-osint-panel/80 backdrop-blur-sm p-6 border border-zinc-800 hover:border-osint-primary cursor-pointer group transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Folder className="w-24 h-24 text-white" />
                </div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="bg-zinc-900 p-3 text-white border border-zinc-700">
                    <FolderClosed className="w-8 h-8" />
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-1 border uppercase ${c.status === 'ACTIVE' ? 'border-osint-primary/50 text-osint-primary bg-osint-primary/10' : 'border-zinc-700 text-zinc-500'}`}
                  >
                    {c.status}
                  </span>
                </div>

                <h3 className="mb-1 truncate text-lg font-medium leading-snug text-white group-hover:text-zinc-300 relative z-10 font-sans tracking-normal">
                  {getWorkspaceDisplayTitle(c)}
                </h3>
                <p className="text-zinc-600 text-sm font-mono mb-4">{c.dateOpened}</p>

                <div className="flex items-center justify-between text-sm text-zinc-500 border-t border-zinc-800 pt-4 relative z-10 font-mono uppercase">
                  <span className="flex items-center gap-3">
                    <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    {fileCount} {fileCount === 1 ? artifactLabel : artifactLabelPlural}
                    </span>
                    <span>{itemCount} {CANONICAL_NOUNS.itemPlural.toLowerCase()}</span>
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat({ workspaceId: c.id });
                      }}
                      className="p-1 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title={`Open ${workspaceLabelLower} in workspace chat`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportCaseAsHtml(c, getCaseReports(c.id));
                      }}
                      className="p-1 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title={`Export formatted printable ${workspaceLabelLower} (HTML)`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportCaseAsJson(c, getCaseReports(c.id));
                      }}
                      className="p-1 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title={`Export raw ${workspaceLabelLower} data for backup (JSON)`}
                    >
                      <FileJson className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportCaseAsMarkdown(c, getCaseReports(c.id));
                      }}
                      className="p-1 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title={`Export ${workspaceLabelLower} as Markdown (.md)`}
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handlePurgeCase(c.id, e)}
                      className="p-1 hover:text-osint-danger transition-colors opacity-0 group-hover:opacity-100"
                      title={`Permanently Purge ${workspaceLabel}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Unassigned Reports Folder (Virtual) */}
          {getUnassignedReports().length > 0 && (
            <div
              onClick={() => handleCaseSelect('unassigned')}
              className="bg-zinc-900/30 backdrop-blur-sm p-6 border border-zinc-800 border-dashed hover:border-zinc-500 cursor-pointer group transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-zinc-900 p-3 text-zinc-500">
                  <FolderOpen className="w-8 h-8" />
                </div>
              </div>
              <h3 className="mb-1 text-lg font-medium leading-snug text-zinc-400 group-hover:text-white font-sans tracking-normal">
                Unassigned
              </h3>
              <p className="text-zinc-600 text-sm font-mono mb-4">{`Loose ${artifactLabelPlural}`}</p>
              <div className="flex items-center text-sm text-zinc-500 border-t border-zinc-800 pt-4 font-mono uppercase">
                <FileText className="w-4 h-4 mr-2" />
                {getUnassignedReports().length} {artifactLabelPlural}
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 pt-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 font-mono text-xs uppercase"
              >
                Prev
              </button>
              <span className="text-xs font-mono text-zinc-500 uppercase">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 font-mono text-xs uppercase"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReportList = (caseId: string) => {
    const isUnassigned = caseId === 'unassigned';
    const caseReports = isUnassigned ? getUnassignedReports() : getCaseReports(caseId);
    const caseItems = isUnassigned ? [] : getCaseItems(caseId);
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
      .filter((record) => {
        if (recordFilter === 'ALL') return true;
        return record.kind === recordFilter;
      })
      .sort((left, right) => right.sortAt - left.sortAt);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRecords = records.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(records.length / itemsPerPage);

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {records.length === 0 ? (
            <div className="col-span-full py-20 bg-zinc-900/20 border border-dashed border-zinc-800 flex flex-col items-center justify-center animate-in fade-in">
              <FileText className="w-12 h-12 text-zinc-800 mb-4" />
              <div className="text-zinc-600 italic font-mono uppercase text-xs tracking-widest">
                NO_WORKSPACE_RECORDS_MATCH_FILTER
              </div>
            </div>
          ) : (
            paginatedRecords.map((record, idx) =>
              record.kind === 'ARTIFACT' ? (
                <div
                  key={record.artifact.id || idx}
                  onClick={() => onSelectReport(record.artifact)}
                  className="bg-zinc-900/70 backdrop-blur-sm p-6 border border-zinc-800 hover:border-osint-primary cursor-pointer group flex items-center justify-between transition-all hover:bg-zinc-900"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-black p-3 text-white border border-zinc-800 group-hover:border-zinc-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-zinc-500">
                        Artifact
                      </div>
                      <h3 className="font-sans text-base font-normal leading-7 tracking-normal text-zinc-200 group-hover:text-white transition-colors">
                        {record.artifact.topic}
                      </h3>
                      <div className="mt-1 text-xs font-mono uppercase text-zinc-500">
                        {record.artifact.dateStr || 'Unknown Date'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {record.artifact.caseId && record.artifact.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const request = buildArtifactChatOpenRequest(record.artifact);
                          if (!request) return;
                          onOpenChat(request);
                        }}
                        className="text-zinc-600 hover:text-white p-2 transition-colors opacity-0 group-hover:opacity-100"
                        title="Open artifact context in workspace chat"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    )}
                    {record.artifact.caseId && record.artifact.id ? (
                      <button
                        onClick={(e) => void handlePlaceArtifactOnBoard(e, record.artifact)}
                        className="text-zinc-600 hover:text-white p-2 transition-colors opacity-0 group-hover:opacity-100"
                        title="Place artifact on board"
                      >
                        <Workflow className="w-5 h-5" />
                      </button>
                    ) : null}
                    <button
                      onClick={(e) => handleDeleteReport(e, record.artifact.id)}
                      className="text-zinc-600 osint-danger-inline p-2 opacity-0 group-hover:opacity-100"
                      title="Delete Artifact"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-white transition-colors" />
                  </div>
                </div>
              ) : (
                <div
                  key={record.item.id}
                  className="bg-zinc-900/70 backdrop-blur-sm p-6 border border-zinc-800 hover:border-zinc-600 group flex items-center justify-between transition-all hover:bg-zinc-900"
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="bg-black p-3 text-white border border-zinc-800 group-hover:border-zinc-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono uppercase text-zinc-500">
                        {record.item.kind}
                      </div>
                      <h3 className="truncate font-sans text-base font-normal leading-7 tracking-normal text-zinc-200 group-hover:text-white transition-colors">
                        {record.item.title}
                      </h3>
                      <div className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                        {record.item.description ||
                          record.item.textContent ||
                          record.item.url ||
                          record.item.fileName ||
                          'Saved workspace item'}
                      </div>
                      <div className="mt-2 text-[10px] font-mono uppercase text-zinc-600">
                        {record.item.provenance?.source || 'USER'} •{' '}
                        {new Date(record.item.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex items-center space-x-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat(buildWorkspaceItemChatOpenRequest(record.item));
                      }}
                      className="text-zinc-600 hover:text-white p-2 transition-colors opacity-0 group-hover:opacity-100"
                      title="Open workspace chat"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => void handlePlaceItemOnBoard(e, record.item)}
                      className="text-zinc-600 hover:text-white p-2 transition-colors opacity-0 group-hover:opacity-100"
                      title="Place item on board"
                    >
                      <Workflow className="w-5 h-5" />
                    </button>
                    {record.item.url ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(record.item.url, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-zinc-600 hover:text-white p-2 transition-colors opacity-0 group-hover:opacity-100"
                        title="Open linked source"
                      >
                        <Link2 className="w-5 h-5" />
                      </button>
                    ) : null}
                    <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-white transition-colors" />
                  </div>
                </div>
              )
            )
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 pt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 font-mono text-xs uppercase"
            >
              Prev
            </button>
            <span className="text-xs font-mono text-zinc-500 uppercase">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 font-mono text-xs uppercase"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-black min-h-screen relative">
      <BackgroundMatrixRain />

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 h-20 px-6 bg-black/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setIsNewCaseModalOpen(true)}
            className="osint-button-primary inline-flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">{`New ${workspaceLabel}`}</span>
          </button>
          {/* Workspace Selector */}
          <div className="hidden md:block min-w-[200px] max-w-[300px]">
            <OsintSelect
              ariaLabel={`View ${workspaceLabel}`}
              value={effectiveSelectedCaseId || 'ALL'}
              onChange={handleCaseSelect}
              triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono truncate"
              options={[
                { value: 'ALL', label: `All ${CANONICAL_NOUNS.workspacePlural}` },
                ...workspaces.map((workspace) => ({
                  value: workspace.id,
                  label: getWorkspaceDisplayTitle(workspace),
                })),
                ...(getUnassignedReports().length > 0
                  ? [
                      {
                        value: 'unassigned',
                        label: `Unassigned ${artifactLabelPlural}`,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {effectiveSelectedCaseId && effectiveSelectedCaseId !== 'unassigned' ? (
            <div className="hidden md:flex items-center rounded border border-zinc-800 bg-zinc-950/70 p-1">
              {(['ALL', 'ARTIFACT', 'ITEM'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    setRecordFilter(value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase transition-colors ${
                    recordFilter === value
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {value === 'ALL' ? 'All' : value === 'ARTIFACT' ? 'Artifacts' : 'Items'}
                </button>
              ))}
            </div>
          ) : null}
          {/* Export Dropdown - only show when case is selected */}
          {effectiveSelectedCaseId &&
            effectiveSelectedCaseId !== 'unassigned' &&
            (() => {
              const currentCase = workspaces.find((c) => c.id === effectiveSelectedCaseId);
              return currentCase ? (
                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className={`flex items-center px-3 py-1.5 font-mono text-xs font-bold uppercase ${
                      showExportMenu ? 'osint-button-chrome-active' : 'osint-button-chrome'
                    }`}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    <span className="hidden lg:inline">Export</span>
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </button>
                  {showExportMenu && (
                    <div className="osint-menu-panel absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 z-50 min-w-[200px]">
                      <button
                        onClick={() => {
                          exportCaseAsHtml(currentCase, getCaseReports(currentCase.id));
                          setShowExportMenu(false);
                        }}
                        className="osint-menu-item w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 flex items-center border-b border-zinc-800"
                        title={`Exports a formatted printable ${workspaceLabelLower}`}
                      >
                        <Download className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                        <div>
                          <div className="font-bold">{`${workspaceLabel} HTML`}</div>
                          <div className="text-[10px] text-zinc-500">{`Formatted printable ${workspaceLabelLower}`}</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          exportCaseAsJson(currentCase, getCaseReports(currentCase.id));
                          setShowExportMenu(false);
                        }}
                        className="osint-menu-item w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 flex items-center"
                        title={`Exports raw ${workspaceLabelLower} data for backup/integration`}
                      >
                        <FileJson className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                        <div>
                          <div className="font-bold">{`${workspaceLabel} JSON`}</div>
                          <div className="text-[10px] text-zinc-500">{`Raw ${workspaceLabelLower} data for backup`}</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              ) : null;
            })()}
        </div>
      </div>

      {/* Start New Workspace Modal */}
      {isNewCaseModalOpen && (
        <TaskSetupModal
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
      )}

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

      <div className="relative z-10 p-6 w-full h-full overflow-y-auto">
        {effectiveSelectedCaseId ? renderReportList(effectiveSelectedCaseId) : renderCaseGrid()}
      </div>
    </div>
  );
};
