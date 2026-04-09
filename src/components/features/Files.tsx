import React from 'react';
import {
  ChevronDown,
  Download,
  FileJson,
  FileText,
  Filter,
  Plus,
  Upload,
} from 'lucide-react';
import type { Artifact, ChatOpenRequest, InvestigationLaunchRequest } from '@/types';
import { CANONICAL_NOUNS } from '@/domain';
import {
  exportWorkspaceAsHtml,
  exportWorkspaceAsJson,
  exportWorkspaceAsMarkdown,
} from '@/utils/exportUtils';
import {
  CHROME_HEADER_CLASS,
  CHROME_HEADER_LEADING_GROUP_CLASS,
  CHROME_HEADER_PRIMARY_ACTION_CLASS,
  CHROME_HEADER_SELECT_TRIGGER_CLASS,
  CHROME_HEADER_SELECT_WRAP_CLASS,
  getChromeMenuButtonClass,
} from '@/components/ui/chrome';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import { OsintSelect } from '@/components/ui/OsintSelect';
import { WorkspaceDocumentUploadDialog } from '@/components/ui/WorkspaceDocumentUploadDialog';
import { RunSetupModal } from '@/components/features/Runs/RunSetupModal';
import { FilesFiltersPanel } from '@/components/features/Files/FilesFiltersPanel';
import { FilesOverview } from '@/components/features/Files/FilesOverview';
import { FilesRecords } from '@/components/features/Files/FilesRecords';
import { useFilesController } from '@/components/features/Files/useFilesController';

interface FilesProps {
  onSelectReport: (report: Artifact) => void;
  onStartNewCase: (request: InvestigationLaunchRequest) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
}

export const Files: React.FC<FilesProps> = ({ onSelectReport, onStartNewCase, onOpenChat }) => {
  const controller = useFilesController({ onOpenChat, onSelectReport });
  const {
    artifactLabel,
    artifactLabelLower,
    artifactLabelPlural,
    closeWorkspacePurgeDialog,
    confirmPurgeWorkspace,
    currentPage,
    currentWorkspace,
    currentWorkspaceArtifacts,
    effectiveSelectedCaseId,
    exportMenuRef,
    fileInputRef,
    filterMenuRef,
    focusedItem,
    focusedItemRowRef,
    getWorkspaceArtifacts,
    handleDeleteReport,
    handlePlaceArtifactOnBoard,
    handlePlaceItemOnBoard,
    handlePurgeWorkspace,
    handleWorkspaceSelect,
    handleFileUpload,
    isNewCaseModalOpen,
    onOpenArtifactChat,
    onOpenItemChat,
    onOpenItemSource,
    onSelectArtifact,
    overviewViewModel,
    recordFilter,
    recordsViewModel,
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
    uploadDialogState,
    uploadInFlight,
    viewMode,
    workspaceLabel,
    workspaceLabelLower,
    workspacePendingPurge,
    workspaces,
    closeUploadDialog,
    confirmUploadDialog,
    openUploadPicker,
  } = controller;

  return (
    <div className="relative min-h-screen h-full w-full bg-black">
      <div className={`${CHROME_HEADER_CLASS} px-6`}>
        <div className="flex h-full min-w-0 items-center gap-3">
          <div className={CHROME_HEADER_LEADING_GROUP_CLASS}>
            <button
              onClick={() => setIsNewCaseModalOpen(true)}
              className={CHROME_HEADER_PRIMARY_ACTION_CLASS}
              aria-label={`New ${workspaceLabel}`}
            >
              <Plus className="h-4 w-4" />
              <span>New</span>
            </button>
            <div className={CHROME_HEADER_SELECT_WRAP_CLASS}>
              <OsintSelect
                ariaLabel={`View ${workspaceLabel}`}
                value={effectiveSelectedCaseId || 'ALL'}
                onChange={handleWorkspaceSelect}
                chrome="toolbar"
                triggerClassName={CHROME_HEADER_SELECT_TRIGGER_CLASS}
                options={[
                  { value: 'ALL', label: `All ${CANONICAL_NOUNS.workspacePlural}` },
                  ...workspaces.map((workspace) => ({
                    value: workspace.id,
                    label: workspace.displayTitle || workspace.title,
                  })),
                  ...(overviewViewModel.unassignedArtifactCount > 0
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

          <div className="flex min-w-[12rem] flex-[0.95_1_24rem] items-center justify-center">
            <GlobalSearch compact className="mx-auto w-full" />
          </div>

          <div className="flex flex-1 items-center justify-end">
            <div className="flex shrink-0 items-center gap-3">
              <div className="relative shrink-0" ref={filterMenuRef}>
                <button
                  onClick={() => {
                    setShowFilters(!showFilters);
                    setShowExportMenu(false);
                  }}
                  className={getChromeMenuButtonClass(showFilters)}
                  aria-label="Files filters"
                  title="Filter visible records"
                >
                  <Filter className="h-4 w-4" />
                </button>

                {showFilters ? (
                  <FilesFiltersPanel
                    recordFilter={recordFilter}
                    showRecordTypeFilters={
                      !!effectiveSelectedCaseId && effectiveSelectedCaseId !== 'unassigned'
                    }
                    viewMode={viewMode}
                    onClearFilters={() => {
                      setRecordFilter('ALL');
                      setViewMode('GRID');
                      setCurrentPage(1);
                    }}
                    onClose={() => setShowFilters(false)}
                    onRecordFilterChange={(value) => {
                      setRecordFilter(value);
                      setCurrentPage(1);
                    }}
                    onViewModeChange={setViewMode}
                  />
                ) : null}
              </div>

              <button
                onClick={openUploadPicker}
                disabled={workspaces.length === 0}
                className={getChromeMenuButtonClass(false)}
                title={
                  workspaces.length === 0
                    ? `Create a ${workspaceLabelLower} before uploading documents`
                    : 'Upload documents into a workspace'
                }
              >
                <Upload className="h-4 w-4" />
                <span className="hidden lg:inline">Upload</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />

              {currentWorkspace ? (
                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => {
                      setShowExportMenu(!showExportMenu);
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
                          if (!currentWorkspace) return;
                          exportWorkspaceAsHtml(currentWorkspace, currentWorkspaceArtifacts);
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
                          if (!currentWorkspace) return;
                          exportWorkspaceAsJson(currentWorkspace, currentWorkspaceArtifacts);
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
                          if (!currentWorkspace) return;
                          exportWorkspaceAsMarkdown(currentWorkspace, currentWorkspaceArtifacts);
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
              ) : null}
            </div>
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
          onClose={closeWorkspacePurgeDialog}
          onConfirm={() => void confirmPurgeWorkspace()}
        />
      ) : null}

      {uploadDialogState ? (
        <WorkspaceDocumentUploadDialog
          isSubmitting={uploadInFlight}
          state={uploadDialogState}
          workspaces={workspaces}
          onArtifactTypeChange={setUploadArtifactType}
          onClose={closeUploadDialog}
          onConfirm={() => void confirmUploadDialog()}
          onRouteChange={setUploadRoute}
          onTargetWorkspaceChange={setUploadTargetWorkspaceId}
        />
      ) : null}

      <div className="relative z-10 h-full w-full overflow-y-auto p-6">
        {recordsViewModel && effectiveSelectedCaseId ? (
          <FilesRecords
            focusedItem={focusedItem}
            focusedItemRowRef={focusedItemRowRef}
            onChangePage={setCurrentPage}
            onDeleteArtifact={handleDeleteReport}
            onOpenArtifactChat={onOpenArtifactChat}
            onOpenItemChat={onOpenItemChat}
            onOpenItemSource={onOpenItemSource}
            onPlaceArtifactOnBoard={handlePlaceArtifactOnBoard}
            onSelectArtifact={onSelectArtifact}
            onPlaceItemOnBoard={handlePlaceItemOnBoard}
            viewMode={viewMode}
            viewModel={recordsViewModel}
          />
        ) : (
          <FilesOverview
            artifactLabel={artifactLabel}
            artifactLabelPlural={artifactLabelPlural}
            currentPage={currentPage}
            onChangePage={setCurrentPage}
            onExportWorkspaceHtml={(workspace) =>
              exportWorkspaceAsHtml(workspace, getWorkspaceArtifacts(workspace.id))
            }
            onExportWorkspaceJson={(workspace) =>
              exportWorkspaceAsJson(workspace, getWorkspaceArtifacts(workspace.id))
            }
            onExportWorkspaceMarkdown={(workspace) =>
              exportWorkspaceAsMarkdown(workspace, getWorkspaceArtifacts(workspace.id))
            }
            onOpenWorkspaceChat={(workspaceId) => onOpenChat({ workspaceId })}
            onPurgeWorkspace={handlePurgeWorkspace}
            onSelectWorkspace={handleWorkspaceSelect}
            onStartNewWorkspace={() => setIsNewCaseModalOpen(true)}
            viewMode={viewMode}
            viewModel={overviewViewModel}
            workspaceLabel={workspaceLabel}
            workspaceLabelLower={workspaceLabelLower}
          />
        )}
      </div>
    </div>
  );
};
