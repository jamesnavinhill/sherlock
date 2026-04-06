import React from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ModalShell } from '@/components/ui/ModalShell';
import type { WorkspaceLibraryEntry } from '@/services/workspace/library';
import type { CreateModalState } from './workspaceBoardUtils';

interface PendingBoardDeletion {
  id: string;
  name: string;
}

interface BoardDialogsProps {
  createModal: CreateModalState;
  boardPendingDeletion: PendingBoardDeletion | null;
  libraryItemPendingDeletion: WorkspaceLibraryEntry | null;
  onCloseCreateModal: () => void;
  onCreateModalChange: (next: CreateModalState | ((current: CreateModalState) => CreateModalState)) => void;
  onSubmitCreateModal: () => Promise<void>;
  onCloseBoardDeletion: () => void;
  onConfirmBoardDeletion: () => Promise<void>;
  onCloseLibraryItemDeletion: () => void;
  onConfirmLibraryItemDeletion: () => Promise<void>;
}

export const BoardDialogs: React.FC<BoardDialogsProps> = ({
  createModal,
  boardPendingDeletion,
  libraryItemPendingDeletion,
  onCloseCreateModal,
  onCreateModalChange,
  onSubmitCreateModal,
  onCloseBoardDeletion,
  onConfirmBoardDeletion,
  onCloseLibraryItemDeletion,
  onConfirmLibraryItemDeletion,
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
              className="border border-zinc-700 px-4 py-2 text-xs font-mono uppercase text-zinc-400 transition hover:border-zinc-500 hover:text-white"
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
            className="w-full border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none focus:border-osint-primary"
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
              className="h-40 w-full resize-none border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none focus:border-osint-primary"
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
                className="w-full border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none focus:border-osint-primary"
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
                className="h-28 w-full resize-none border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none focus:border-osint-primary"
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
  </>
);
