import React from 'react';
import {
  Download,
  FileJson,
  FileText,
  FolderOpen,
  MessageSquare,
  Pencil,
  Trash2,
} from 'lucide-react';
import { CANONICAL_NOUNS } from '@/domain';
import type { Workspace } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppIcon, getDefaultWorkspaceIconId } from '@/lib/appIcons';
import type { FilesOverviewViewModel, FilesViewMode } from './filesViewModel';

interface FilesOverviewProps {
  artifactLabelPlural: string;
  currentPage: number;
  onChangePage: (page: number) => void;
  onEditWorkspaceIcon: (workspace: Workspace, event: React.MouseEvent) => void;
  onExportWorkspaceHtml: (workspace: Workspace) => void;
  onExportWorkspaceJson: (workspace: Workspace) => void;
  onExportWorkspaceMarkdown: (workspace: Workspace) => void;
  onOpenWorkspaceChat: (workspaceId: string) => void;
  onPurgeWorkspace: (workspaceId: string, event: React.MouseEvent) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onStartNewWorkspace: () => void;
  viewMode: FilesViewMode;
  viewModel: FilesOverviewViewModel;
  workspaceLabel: string;
  workspaceLabelLower: string;
}

const renderPagination = (input: {
  currentPage: number;
  onChangePage: (page: number) => void;
  totalPages: number;
}) =>
  input.totalPages > 1 ? (
    <div className="flex items-center justify-center space-x-4 pt-8">
      <button
        onClick={() => input.onChangePage(Math.max(1, input.currentPage - 1))}
        disabled={input.currentPage === 1}
        className="osint-meta-label border border-zinc-800 p-2 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500"
      >
        Prev
      </button>
      <span className="osint-meta-label">
        Page {input.currentPage} of {input.totalPages}
      </span>
      <button
        onClick={() => input.onChangePage(Math.min(input.totalPages, input.currentPage + 1))}
        disabled={input.currentPage === input.totalPages}
        className="osint-meta-label border border-zinc-800 p-2 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500"
      >
        Next
      </button>
    </div>
  ) : null;

const WORKSPACE_ACTION_BUTTON_CLASS =
  'osint-icon-button-plain inline-flex h-8 w-8 shrink-0 items-center justify-center p-0';

const WORKSPACE_HOVER_REVEAL_ACTION_BUTTON_CLASS =
  `${WORKSPACE_ACTION_BUTTON_CLASS} opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100`;

const getWorkspaceOverviewSummary = (workspaceLabelLower: string, workspace: Workspace) =>
  workspace.description || `Open this ${workspaceLabelLower} to inspect artifacts, items, and saved history.`;

export const FilesOverview: React.FC<FilesOverviewProps> = ({
  artifactLabelPlural,
  currentPage,
  onChangePage,
  onEditWorkspaceIcon,
  onExportWorkspaceHtml,
  onExportWorkspaceJson,
  onExportWorkspaceMarkdown,
  onOpenWorkspaceChat,
  onPurgeWorkspace,
  onSelectWorkspace,
  onStartNewWorkspace,
  viewMode,
  viewModel,
  workspaceLabel,
  workspaceLabelLower,
}) => {
  const renderWorkspaceActions = (workspace: Workspace) => (
    <>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onOpenWorkspaceChat(workspace.id);
        }}
        className={WORKSPACE_ACTION_BUTTON_CLASS}
        title={`Open ${workspaceLabelLower} in workspace chat`}
      >
        <MessageSquare className="h-4 w-4" />
      </button>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onExportWorkspaceHtml(workspace);
        }}
        className={WORKSPACE_ACTION_BUTTON_CLASS}
        title={`Export formatted printable ${workspaceLabelLower} (HTML)`}
      >
        <Download className="h-4 w-4" />
      </button>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onExportWorkspaceJson(workspace);
        }}
        className={WORKSPACE_ACTION_BUTTON_CLASS}
        title={`Export raw ${workspaceLabelLower} data for backup (JSON)`}
      >
        <FileJson className="h-4 w-4" />
      </button>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onExportWorkspaceMarkdown(workspace);
        }}
        className={WORKSPACE_ACTION_BUTTON_CLASS}
        title={`Export ${workspaceLabelLower} as Markdown (.md)`}
      >
        <FileText className="h-4 w-4" />
      </button>
      <button
        onClick={(event) => onPurgeWorkspace(workspace.id, event)}
        className="osint-icon-button-plain-danger inline-flex h-8 w-8 shrink-0 items-center justify-center p-0"
        title={`Permanently Purge ${workspaceLabel}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </>
  );

  if (viewModel.paginatedWorkspaces.length === 0 && viewModel.unassignedArtifactCount === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Files Empty"
        description={`No saved ${CANONICAL_NOUNS.workspacePlural.toLowerCase()} or ${CANONICAL_NOUNS.artifactPlural.toLowerCase()} found yet. Start a new run to begin collecting work.`}
        action={{
          label: `Start New ${CANONICAL_NOUNS.workspace}`,
          onClick: onStartNewWorkspace,
        }}
        className="animate-in fade-in duration-700"
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {viewModel.paginatedWorkspaces.map(({ workspace, artifactCount, itemCount, displayTitle }) => (
            <div
              key={workspace.id}
              onClick={() => onSelectWorkspace(workspace.id)}
              className="osint-raised-surface group relative flex min-h-[22rem] cursor-pointer flex-col overflow-hidden p-6 backdrop-blur-sm transition-all hover:border-osint-primary"
            >
              <div className="absolute right-0 top-0 p-4 opacity-20 transition-opacity group-hover:opacity-40">
                <AppIcon
                  iconId={workspace.iconId || getDefaultWorkspaceIconId()}
                  className="h-24 w-24 text-white"
                  size={96}
                  strokeWidth={1.5}
                />
              </div>

              <div className="relative z-10 mb-4 flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <div className="p-3 text-white">
                    <AppIcon
                      iconId={workspace.iconId || getDefaultWorkspaceIconId()}
                      className="h-8 w-8"
                      size={32}
                      strokeWidth={1.85}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditWorkspaceIcon(workspace, event);
                    }}
                    className={WORKSPACE_HOVER_REVEAL_ACTION_BUTTON_CLASS}
                    title={`Customize ${workspaceLabelLower} icon`}
                    aria-label={`Customize ${workspaceLabelLower} icon`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span
                  className={`osint-meta-label border px-2 py-1 ${workspace.status === 'ACTIVE' ? 'border-osint-primary/50 bg-osint-primary/10 text-osint-primary' : 'border-zinc-700 text-zinc-500'}`}
                >
                  {workspace.status}
                </span>
              </div>

              <h3 className="osint-title-card relative z-10 mb-1 truncate transition-colors group-hover:text-zinc-300">
                {displayTitle}
              </h3>
              <p className="osint-body-quiet">{workspace.dateOpened}</p>
              <p className="relative z-10 mt-4 line-clamp-4 osint-body-quiet">
                {getWorkspaceOverviewSummary(workspaceLabelLower, workspace)}
              </p>

              <div className="relative z-10 mt-auto pt-6">
                <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4">
                  <div className="osint-raised-surface-subtle min-w-0 px-3 py-2">
                    <div className="osint-meta-label">Artifacts</div>
                    <div className="mt-1 flex items-center gap-2 osint-meta-value">
                      <FileText className="h-4 w-4 text-zinc-500" />
                      <span>{artifactCount}</span>
                    </div>
                  </div>
                  <div className="osint-raised-surface-subtle min-w-0 px-3 py-2">
                    <div className="osint-meta-label">Items</div>
                    <div className="mt-1 osint-meta-value">{itemCount}</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-zinc-800 pt-4">
                  {renderWorkspaceActions(workspace)}
                </div>
              </div>
            </div>
          ))}

          {viewModel.unassignedArtifactCount > 0 ? (
            <div
              onClick={() => onSelectWorkspace('unassigned')}
              className="osint-raised-surface-subtle cursor-pointer border-dashed p-6 backdrop-blur-sm transition-all hover:border-zinc-500"
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
                {viewModel.unassignedArtifactCount} {artifactLabelPlural}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="osint-panel-shell overflow-hidden border border-zinc-800 bg-zinc-950/70">
          <div className="osint-meta-label grid grid-cols-[minmax(0,1.2fr)_auto_auto] gap-4 border-b border-zinc-800 px-4 py-3">
            <span>Workspace</span>
            <span>Artifacts</span>
            <span>Items</span>
          </div>
          <div className="divide-y divide-zinc-800">
            {viewModel.paginatedWorkspaces.map(({ workspace, artifactCount, itemCount, displayTitle }) => (
              <div
                key={workspace.id}
                onClick={() => onSelectWorkspace(workspace.id)}
                className="osint-raised-surface-subtle cursor-pointer px-4 py-4 transition hover:bg-zinc-900/70"
              >
                <div className="grid grid-cols-[minmax(0,1.2fr)_auto_auto] items-start gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 text-zinc-300">
                        <AppIcon
                          iconId={workspace.iconId || getDefaultWorkspaceIconId()}
                          className="h-4 w-4"
                          size={16}
                          strokeWidth={1.9}
                        />
                      </div>
                      <div className="osint-title-inline">{displayTitle}</div>
                      <span
                        className={`osint-meta-label border px-2 py-0.5 ${workspace.status === 'ACTIVE' ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary' : 'border-zinc-700 text-zinc-500'}`}
                      >
                        {workspace.status}
                      </span>
                    </div>
                    <div className="osint-meta-label mt-1">{workspace.dateOpened}</div>
                    <p className="osint-body-quiet mt-2 line-clamp-2 max-w-4xl">
                      {getWorkspaceOverviewSummary(workspaceLabelLower, workspace)}
                    </p>
                  </div>
                  <div className="osint-meta-value self-center text-right">{artifactCount}</div>
                  <div className="osint-meta-value self-center text-right">{itemCount}</div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditWorkspaceIcon(workspace, event);
                    }}
                    className={WORKSPACE_ACTION_BUTTON_CLASS}
                    title={`Customize ${workspaceLabelLower} icon`}
                    aria-label={`Customize ${workspaceLabelLower} icon`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {renderWorkspaceActions(workspace)}
                </div>
              </div>
            ))}

            {viewModel.unassignedArtifactCount > 0 ? (
              <div
                onClick={() => onSelectWorkspace('unassigned')}
                className="osint-raised-surface-subtle grid cursor-pointer grid-cols-[minmax(0,1.2fr)_auto_auto] gap-4 px-4 py-4 transition hover:bg-zinc-900/70"
              >
                <div className="min-w-0">
                  <div className="osint-title-inline text-zinc-300">Unassigned</div>
                  <div className="osint-meta-label mt-1">Loose {artifactLabelPlural}</div>
                </div>
                <div className="osint-meta-value self-center text-right">
                  {viewModel.unassignedArtifactCount}
                </div>
                <div className="osint-meta-value self-center text-right text-zinc-500">0</div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {renderPagination({
        currentPage,
        onChangePage,
        totalPages: viewModel.totalPages,
      })}
    </div>
  );
};
