import React from 'react';
import {
  ArrowRight,
  FileText,
  Link2,
  MessageSquare,
  Trash2,
  Workflow,
} from 'lucide-react';
import type { Artifact, WorkspaceItem } from '@/types';
import type { FilesRecordsViewModel, FilesViewMode } from './filesViewModel';
import {
  getArtifactRecordSummary,
  getWorkspaceItemRecordSummary,
} from './filesViewModel';
import {
  CHROME_CARD_SURFACE_CLASS,
} from '@/components/ui/chrome';

const RECORD_ACTION_BUTTON_CLASS =
  'osint-icon-button-plain inline-flex h-9 w-9 items-center justify-center p-2';

const RECORD_ACTION_REVEAL_BUTTON_CLASS =
  `${RECORD_ACTION_BUTTON_CLASS} opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100`;

const RECORD_ACTION_DANGER_REVEAL_BUTTON_CLASS =
  'osint-icon-button-hover-danger inline-flex h-9 w-9 items-center justify-center p-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100';

const RECORD_LIST_ACTION_BUTTON_CLASS =
  'osint-icon-button-plain inline-flex h-8 w-8 items-center justify-center p-0';

const RECORD_LIST_ACTION_DANGER_BUTTON_CLASS =
  'osint-icon-button-hover-danger inline-flex h-8 w-8 items-center justify-center p-0';

interface FilesRecordsProps {
  focusedItem: WorkspaceItem | null;
  focusedItemRowRef: React.MutableRefObject<HTMLDivElement | null>;
  onChangePage: (page: number) => void;
  onDeleteArtifact: (event: React.MouseEvent, id?: string) => void;
  onOpenArtifactChat: (artifact: Artifact) => void;
  onOpenItemChat: (item: WorkspaceItem) => void;
  onOpenItemSource: (item: WorkspaceItem) => void;
  onPlaceArtifactOnBoard: (event: React.MouseEvent, artifact: Artifact) => void;
  onPlaceItemOnBoard: (event: React.MouseEvent, item: WorkspaceItem) => void;
  onSelectArtifact: (artifact: Artifact) => void;
  viewMode: FilesViewMode;
  viewModel: FilesRecordsViewModel;
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

export const FilesRecords: React.FC<FilesRecordsProps> = ({
  focusedItem,
  focusedItemRowRef,
  onChangePage,
  onDeleteArtifact,
  onOpenArtifactChat,
  onOpenItemChat,
  onOpenItemSource,
  onPlaceArtifactOnBoard,
  onPlaceItemOnBoard,
  onSelectArtifact,
  viewMode,
  viewModel,
}) => (
  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
    {focusedItem && !viewModel.isUnassigned && focusedItem.workspaceId ? (
      <div
        className={`${CHROME_CARD_SURFACE_CLASS} mb-6 border-l-2 border-osint-primary bg-[var(--osint-rail-interaction-active-bg)] p-5 shadow-[var(--osint-rail-interaction-shadow)]`}
      >
        <div className="osint-meta-label text-osint-primary">Focused Item</div>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="osint-title-card text-osint-primary">{focusedItem.title}</div>
            <div className="osint-body-small mt-2 max-w-3xl">
              {getWorkspaceItemRecordSummary(focusedItem)}
            </div>
            <div className="osint-meta-label mt-3">
              {focusedItem.kind} / {focusedItem.provenance?.source || 'USER'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenItemChat(focusedItem)}
              className="osint-meta-label-strong inline-flex items-center gap-2 border border-zinc-700 px-3 py-2 text-zinc-200 transition hover:border-white hover:text-white"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </button>
            <button
              onClick={(event) => void onPlaceItemOnBoard(event, focusedItem)}
              className="osint-meta-label-strong inline-flex items-center gap-2 border border-zinc-700 px-3 py-2 text-zinc-200 transition hover:border-white hover:text-white"
            >
              <Workflow className="h-4 w-4" />
              Board
            </button>
            {focusedItem.url ? (
              <button
                onClick={() => onOpenItemSource(focusedItem)}
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
        {viewModel.records.length === 0 ? (
          <div className="osint-raised-surface-subtle col-span-full flex flex-col items-center justify-center border border-dashed border-zinc-800 bg-zinc-900/20 py-20 animate-in fade-in">
            <FileText className="mb-4 h-12 w-12 text-zinc-800" />
            <div className="osint-meta-label italic text-zinc-600">
              NO_WORKSPACE_RECORDS_MATCH_FILTER
            </div>
          </div>
        ) : (
          viewModel.paginatedRecords.map((record, index) =>
            record.kind === 'ARTIFACT' ? (
              <div
                key={record.artifact.id || index}
                onClick={() => onSelectArtifact(record.artifact)}
                className={`${CHROME_CARD_SURFACE_CLASS} group flex cursor-pointer items-center justify-between p-6 transition-all duration-200 hover:border-osint-primary hover:bg-[var(--osint-rail-interaction-hover-bg)] hover:shadow-[var(--osint-rail-interaction-shadow)]`}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 text-osint-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="osint-meta-label">Artifact</div>
                    <h3 className="font-sans text-base font-normal leading-7 tracking-normal text-zinc-200 transition-colors group-hover:text-osint-primary">
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
                        onOpenArtifactChat(record.artifact);
                      }}
                      className={RECORD_ACTION_REVEAL_BUTTON_CLASS}
                      title="Open artifact context in workspace chat"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </button>
                  ) : null}
                  {record.artifact.workspaceId && record.artifact.id ? (
                    <button
                      onClick={(event) => void onPlaceArtifactOnBoard(event, record.artifact)}
                      className={RECORD_ACTION_REVEAL_BUTTON_CLASS}
                      title="Place artifact on board"
                    >
                      <Workflow className="h-5 w-5" />
                    </button>
                  ) : null}
                  <button
                    onClick={(event) => onDeleteArtifact(event, record.artifact.id)}
                    className={RECORD_ACTION_DANGER_REVEAL_BUTTON_CLASS}
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
                className={`${CHROME_CARD_SURFACE_CLASS} group flex items-center justify-between border p-6 transition-all duration-200 ${
                  focusedItem?.id === record.item.id
                    ? 'bg-[var(--osint-rail-interaction-active-bg)] shadow-[var(--osint-rail-interaction-shadow)] border-l-2 border-osint-primary'
                    : 'hover:bg-[var(--osint-rail-interaction-hover-bg)] hover:shadow-[var(--osint-rail-interaction-shadow)] hover:border-zinc-600'
                }`}
              >
                <div className="flex min-w-0 items-center space-x-4">
                  <div className="p-3 text-osint-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="osint-meta-label">{record.item.kind}</div>
                    <h3 className={`truncate font-sans text-base font-normal leading-7 tracking-normal transition-colors ${focusedItem?.id === record.item.id ? 'text-osint-primary' : 'text-zinc-200 group-hover:text-osint-primary'}`}>
                      {record.item.title}
                    </h3>
                    <div className="osint-body-quiet mt-1 line-clamp-2">
                      {getWorkspaceItemRecordSummary(record.item)}
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
                      onOpenItemChat(record.item);
                    }}
                    className={RECORD_ACTION_REVEAL_BUTTON_CLASS}
                    title="Open workspace chat"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(event) => void onPlaceItemOnBoard(event, record.item)}
                    className={RECORD_ACTION_REVEAL_BUTTON_CLASS}
                    title="Place item on board"
                  >
                    <Workflow className="h-5 w-5" />
                  </button>
                  {record.item.url ? (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenItemSource(record.item);
                      }}
                      className={RECORD_ACTION_REVEAL_BUTTON_CLASS}
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
      <div className="osint-panel-shell overflow-hidden border border-zinc-800 bg-zinc-950/70">
        <div className="osint-meta-label grid grid-cols-[auto_minmax(0,1.4fr)_auto_auto] gap-4 border-b border-zinc-800 px-4 py-3">
          <span>Type</span>
          <span>Record</span>
          <span>Updated</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-zinc-800">
          {viewModel.records.length === 0 ? (
            <div className="osint-meta-label px-4 py-16 text-center text-zinc-600">
              No workspace records match filter
            </div>
          ) : (
            viewModel.paginatedRecords.map((record, index) =>
              record.kind === 'ARTIFACT' ? (
                <div
                  key={record.artifact.id || index}
                  onClick={() => onSelectArtifact(record.artifact)}
                  className="osint-raised-surface-subtle group grid cursor-pointer grid-cols-[auto_minmax(0,1.4fr)_auto_auto] gap-4 px-4 py-4 transition-all duration-200 hover:bg-[var(--osint-rail-interaction-hover-bg)] hover:shadow-[var(--osint-rail-interaction-shadow)]"
                >
                  <div className="self-start p-3 text-osint-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="osint-meta-label">Artifact</div>
                    <h3 className="osint-title-inline mt-1 truncate transition-colors group-hover:text-osint-primary">{record.artifact.topic}</h3>
                    <p className="osint-body-quiet mt-2 line-clamp-2">
                      {getArtifactRecordSummary(record.artifact)}
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
                          onOpenArtifactChat(record.artifact);
                        }}
                        className={RECORD_LIST_ACTION_BUTTON_CLASS}
                        title="Open artifact context in workspace chat"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    ) : null}
                    {record.artifact.workspaceId && record.artifact.id ? (
                      <button
                        onClick={(event) => void onPlaceArtifactOnBoard(event, record.artifact)}
                        className={RECORD_LIST_ACTION_BUTTON_CLASS}
                        title="Place artifact on board"
                      >
                        <Workflow className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button
                      onClick={(event) => onDeleteArtifact(event, record.artifact.id)}
                      className={RECORD_LIST_ACTION_DANGER_BUTTON_CLASS}
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
                  className="osint-raised-surface-subtle group grid grid-cols-[auto_minmax(0,1.4fr)_auto_auto] gap-4 px-4 py-4 transition-all duration-200 hover:bg-[var(--osint-rail-interaction-hover-bg)] hover:shadow-[var(--osint-rail-interaction-shadow)]"
                >
                  <div className="self-start p-3 text-osint-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="osint-meta-label">{record.item.kind}</div>
                    <h3 className="osint-title-inline mt-1 truncate transition-colors group-hover:text-osint-primary">{record.item.title}</h3>
                    <p className="osint-body-quiet mt-2 line-clamp-2">
                      {getWorkspaceItemRecordSummary(record.item)}
                    </p>
                  </div>
                  <div className="osint-meta-label self-center text-right">
                    {new Date(record.item.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center justify-end gap-3 self-center">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenItemChat(record.item);
                      }}
                      className={RECORD_LIST_ACTION_BUTTON_CLASS}
                      title="Open workspace chat"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(event) => void onPlaceItemOnBoard(event, record.item)}
                      className={RECORD_LIST_ACTION_BUTTON_CLASS}
                      title="Place item on board"
                    >
                      <Workflow className="h-4 w-4" />
                    </button>
                    {record.item.url ? (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenItemSource(record.item);
                        }}
                        className={RECORD_LIST_ACTION_BUTTON_CLASS}
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

    {renderPagination({
      currentPage: viewModel.resolvedCurrentPage,
      onChangePage,
      totalPages: viewModel.totalPages,
    })}
  </div>
);
