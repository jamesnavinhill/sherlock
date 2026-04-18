import React from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ModalShell } from '@/components/ui/ModalShell';
import { WorkspaceDocumentUploadDialog } from '@/components/ui/WorkspaceDocumentUploadDialog';
import type { WorkspaceDocumentUploadDialogState } from '@/components/features/shared/useWorkspaceDocumentUpload';
import type { WorkspaceLibraryEntry } from '@/services/workspace/library';
import type { WorkspaceDocumentUploadRoute } from '@/services/workspace/documentUploads';
import type { ArtifactType, Workspace } from '@/types';
import type { CreateModalState } from './workspaceBoardUtils';

interface PendingBoardDeletion {
  id: string;
  name: string;
}

interface BoardDialogsProps {
  createModal: CreateModalState;
  boardPendingDeletion: PendingBoardDeletion | null;
  libraryItemPendingDeletion: WorkspaceLibraryEntry | null;
  uploadDialogState: WorkspaceDocumentUploadDialogState | null;
  uploadInFlight: boolean;
  onCloseCreateModal: () => void;
  onCreateModalChange: (next: CreateModalState | ((current: CreateModalState) => CreateModalState)) => void;
  onSubmitCreateModal: () => Promise<void>;
  onCloseBoardDeletion: () => void;
  onConfirmBoardDeletion: () => Promise<void>;
  onCloseLibraryItemDeletion: () => void;
  onConfirmLibraryItemDeletion: () => Promise<void>;
  onCloseUploadDialog: () => void;
  onConfirmUploadDialog: () => Promise<void>;
  onUploadArtifactTypeChange: (artifactType: ArtifactType) => void;
  onUploadRouteChange: (route: WorkspaceDocumentUploadRoute) => void;
  onUploadTargetWorkspaceChange: (workspaceId: string) => void;
  workspaces: Workspace[];
}

export const BoardDialogs: React.FC<BoardDialogsProps> = ({
  createModal,
  boardPendingDeletion,
  libraryItemPendingDeletion,
  uploadDialogState,
  uploadInFlight,
  onCloseCreateModal,
  onCreateModalChange,
  onSubmitCreateModal,
  onCloseBoardDeletion,
  onConfirmBoardDeletion,
  onCloseLibraryItemDeletion,
  onConfirmLibraryItemDeletion,
  onCloseUploadDialog,
  onConfirmUploadDialog,
  onUploadArtifactTypeChange,
  onUploadRouteChange,
  onUploadTargetWorkspaceChange,
  workspaces,
}) => (
  <>
    {createModal ? (
      <ModalShell
        title={createModal.type === 'NOTE' ? 'Create Workspace Note' : 'Capture Workspace Link'}
        onClose={onCloseCreateModal}
        widthClassName="max-w-xl"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={onCloseCreateModal}
              className="osint-button-chrome px-4 py-2 text-xs font-mono uppercase"
            >
              Cancel
            </button>
            <button
              onClick={() => void onSubmitCreateModal()}
              className="osint-button-primary px-4 py-2 text-xs font-mono uppercase"
            >
              Save Item
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <input
            value={createModal.title}
            onChange={(event) =>
              onCreateModalChange((current) =>
                current ? { ...current, title: event.target.value } : current
              )
            }
            placeholder="Title"
            className="osint-input-field w-full px-3 py-3 text-sm"
          />
          {createModal.type === 'NOTE' ? (
            <textarea
              value={createModal.content}
              onChange={(event) =>
                onCreateModalChange((current) =>
                  current && current.type === 'NOTE'
                    ? { ...current, content: event.target.value }
                    : current
                )
              }
              placeholder="Write the note..."
              className="osint-input-field h-40 w-full resize-none px-3 py-3 text-sm"
            />
          ) : (
            <>
              <input
                value={createModal.url}
                onChange={(event) =>
                  onCreateModalChange((current) =>
                    current && current.type === 'LINK'
                        ? { ...current, url: event.target.value }
                        : current
                  )
                }
                placeholder="https://..."
                className="osint-input-field w-full px-3 py-3 text-sm"
              />
              <textarea
                value={createModal.description}
                onChange={(event) =>
                  onCreateModalChange((current) =>
                    current && current.type === 'LINK'
                        ? { ...current, description: event.target.value }
                        : current
                  )
                }
                placeholder="Why this link matters..."
                className="osint-input-field h-28 w-full resize-none px-3 py-3 text-sm"
              />
            </>
          )}
        </div>
      </ModalShell>
    ) : null}

    {boardPendingDeletion ? (
      <ConfirmDialog
        title="Delete Board"
        description={`Delete "${boardPendingDeletion.name}" and its saved board document? This removes this board and its board-agent session history, but keeps the rest of the workspace intact.`}
        confirmLabel="Delete Board"
        tone="danger"
        onClose={onCloseBoardDeletion}
        onConfirm={() => void onConfirmBoardDeletion()}
      />
    ) : null}

    {libraryItemPendingDeletion ? (
      <ConfirmDialog
        title="Delete Library Item"
        description={`Delete "${libraryItemPendingDeletion.title}" from the workspace library and remove matching cards from the active board?`}
        confirmLabel="Delete Item"
        tone="danger"
        onClose={onCloseLibraryItemDeletion}
        onConfirm={() => void onConfirmLibraryItemDeletion()}
      />
    ) : null}

    {uploadDialogState ? (
      <WorkspaceDocumentUploadDialog
        isSubmitting={uploadInFlight}
        state={uploadDialogState}
        workspaces={workspaces}
        onArtifactTypeChange={onUploadArtifactTypeChange}
        onClose={onCloseUploadDialog}
        onConfirm={() => void onConfirmUploadDialog()}
        onRouteChange={onUploadRouteChange}
        onTargetWorkspaceChange={onUploadTargetWorkspaceChange}
      />
    ) : null}
  </>
);
