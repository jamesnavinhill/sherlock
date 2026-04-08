import React from 'react';
import {
  ArrowRight,
  Download,
  FileJson,
  FileText,
  Folder,
  FolderClosed,
  FolderOpen,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { CANONICAL_NOUNS } from '@/domain';
import type { Workspace } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import type { FilesOverviewViewModel, FilesViewMode } from './filesViewModel';

interface FilesOverviewProps {
  artifactLabel: string;
  artifactLabelPlural: string;
  currentPage: number;
  onChangePage: (page: number) => void;
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

export const FilesOverview: React.FC<FilesOverviewProps> = ({
  artifactLabel,
  artifactLabelPlural,
  currentPage,
  onChangePage,
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
                {displayTitle}
              </h3>
              <p className="osint-body-quiet mb-4">{workspace.dateOpened}</p>

              <div className="osint-meta-label relative z-10 flex items-center justify-between border-t border-zinc-800 pt-4">
                <span className="flex items-center gap-3">
                  <span className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    {artifactCount} {artifactCount === 1 ? artifactLabel : artifactLabelPlural}
                  </span>
                  <span>
                    {itemCount} {CANONICAL_NOUNS.itemPlural.toLowerCase()}
                  </span>
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenWorkspaceChat(workspace.id);
                    }}
                    className="p-1 opacity-0 transition-colors group-hover:opacity-100 hover:text-white"
                    title={`Open ${workspaceLabelLower} in workspace chat`}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onExportWorkspaceHtml(workspace);
                    }}
                    className="p-1 opacity-0 transition-colors group-hover:opacity-100 hover:text-white"
                    title={`Export formatted printable ${workspaceLabelLower} (HTML)`}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onExportWorkspaceJson(workspace);
                    }}
                    className="p-1 opacity-0 transition-colors group-hover:opacity-100 hover:text-white"
                    title={`Export raw ${workspaceLabelLower} data for backup (JSON)`}
                  >
                    <FileJson className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onExportWorkspaceMarkdown(workspace);
                    }}
                    className="p-1 opacity-0 transition-colors group-hover:opacity-100 hover:text-white"
                    title={`Export ${workspaceLabelLower} as Markdown (.md)`}
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(event) => onPurgeWorkspace(workspace.id, event)}
                    className="p-1 opacity-0 transition-colors group-hover:opacity-100 hover:text-osint-danger"
                    title={`Permanently Purge ${workspaceLabel}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {viewModel.unassignedArtifactCount > 0 ? (
            <div
              onClick={() => onSelectWorkspace('unassigned')}
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
                {viewModel.unassignedArtifactCount} {artifactLabelPlural}
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
            {viewModel.paginatedWorkspaces.map(({ workspace, artifactCount, itemCount, displayTitle }) => (
              <div
                key={workspace.id}
                onClick={() => onSelectWorkspace(workspace.id)}
                className="grid cursor-pointer grid-cols-[minmax(0,1.6fr)_auto_auto_auto] gap-4 px-4 py-4 transition hover:bg-zinc-900/70"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="osint-title-inline">{displayTitle}</div>
                    <span
                      className={`osint-meta-label border px-2 py-0.5 ${workspace.status === 'ACTIVE' ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary' : 'border-zinc-700 text-zinc-500'}`}
                    >
                      {workspace.status}
                    </span>
                  </div>
                  <div className="osint-meta-label mt-1">{workspace.dateOpened}</div>
                  <p className="osint-body-quiet mt-2 line-clamp-2">
                    {workspace.description ||
                      'Open this workspace to inspect artifacts, items, and saved history.'}
                  </p>
                </div>
                <div className="osint-meta-value self-center text-right">{artifactCount}</div>
                <div className="osint-meta-value self-center text-right">{itemCount}</div>
                <div className="flex items-center justify-end gap-2 self-center">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenWorkspaceChat(workspace.id);
                    }}
                    className="text-zinc-500 transition hover:text-white"
                    title={`Open ${workspaceLabelLower} in workspace chat`}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(event) => onPurgeWorkspace(workspace.id, event)}
                    className="text-zinc-500 transition hover:text-osint-danger"
                    title={`Permanently Purge ${workspaceLabel}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ArrowRight className="h-4 w-4 text-zinc-600" />
                </div>
              </div>
            ))}

            {viewModel.unassignedArtifactCount > 0 ? (
              <div
                onClick={() => onSelectWorkspace('unassigned')}
                className="grid cursor-pointer grid-cols-[minmax(0,1.6fr)_auto_auto_auto] gap-4 px-4 py-4 transition hover:bg-zinc-900/70"
              >
                <div className="min-w-0">
                  <div className="osint-title-inline text-zinc-300">Unassigned</div>
                  <div className="osint-meta-label mt-1">Loose {artifactLabelPlural}</div>
                </div>
                <div className="osint-meta-value self-center text-right">
                  {viewModel.unassignedArtifactCount}
                </div>
                <div className="osint-meta-value self-center text-right text-zinc-500">0</div>
                <div className="flex items-center justify-end">
                  <ArrowRight className="h-4 w-4 text-zinc-600" />
                </div>
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
