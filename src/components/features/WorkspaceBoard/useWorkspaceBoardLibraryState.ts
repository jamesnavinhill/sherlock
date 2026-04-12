import { useCallback, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { Editor } from 'tldraw';

import type { Workspace } from '@/types';
import {
  boardRefKey,
  buildSingleWorkspaceItemEntry,
  type WorkspaceLibraryEntry,
} from '@/services/workspace/library';
import {
  BOARD_REF_META_KEY,
  parseBoardReference,
} from '@/services/workspace/boardShapes';
import { useExclusivePanelSections } from '@/components/features/shared/useExclusivePanelSections';
import { buildWorkspaceItemFromCreateModal } from './workspaceBoardItemActions';
import type { CreateModalState } from './workspaceBoardUtils';

interface UseWorkspaceBoardLibraryStateInput {
  activeWorkspace: Workspace | null;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  createWorkspaceItem: (item: Parameters<typeof buildSingleWorkspaceItemEntry>[1]) => Promise<unknown>;
  deleteWorkspaceItem: (itemId: string) => Promise<unknown>;
  editorRef: MutableRefObject<Editor | null>;
  handleDropEntry: (entry: WorkspaceLibraryEntry, clientX?: number, clientY?: number) => void;
}

export const useWorkspaceBoardLibraryState = ({
  activeWorkspace,
  addToast,
  createWorkspaceItem,
  deleteWorkspaceItem,
  editorRef,
  handleDropEntry,
}: UseWorkspaceBoardLibraryStateInput) => {
  const [createModal, setCreateModal] = useState<CreateModalState>(null);
  const [libraryItemSections, setLibraryItemSections] = useState<Record<string, boolean>>({});
  const [libraryItemPendingDeletion, setLibraryItemPendingDeletion] =
    useState<WorkspaceLibraryEntry | null>(null);
  const librarySectionState = useExclusivePanelSections(
    ['created', 'artifacts', 'findings', 'entities', 'sources', 'signals'] as const
  );

  const toggleLibraryEntrySection = useCallback((entryKey: string) => {
    setLibraryItemSections((current) => ({
      ...current,
      [entryKey]: !current[entryKey],
    }));
  }, []);

  const handleSubmitCreateModal = useCallback(async () => {
    if (!activeWorkspace || !createModal) return;

    const nextItem = buildWorkspaceItemFromCreateModal({
      createModal,
      workspaceId: activeWorkspace.id,
    });

    if (!nextItem) return;
    await createWorkspaceItem(nextItem);
    const entry = buildSingleWorkspaceItemEntry(activeWorkspace.id, nextItem);
    if (entry) {
      handleDropEntry(entry);
    }
    setCreateModal(null);
  }, [activeWorkspace, createModal, createWorkspaceItem, handleDropEntry]);

  const confirmDeleteCreatedItem = useCallback(
    async (entry: WorkspaceLibraryEntry) => {
      if (editorRef.current) {
        const shapeIds = editorRef.current.store.allRecords().flatMap((record) => {
          if (record.typeName !== 'shape') return [];

          const meta = record.meta as Record<string, unknown> | undefined;
          const ref = parseBoardReference(meta?.[BOARD_REF_META_KEY]);
          if (ref?.refKind === 'WORKSPACE_ITEM' && ref.refId === entry.refId) {
            return [record.id];
          }

          return [];
        });

        if (shapeIds.length > 0) {
          editorRef.current.deleteShapes(shapeIds);
        }
      }

      await deleteWorkspaceItem(entry.refId);
      setLibraryItemSections((current) => {
        const next = { ...current };
        delete next[boardRefKey(entry)];
        return next;
      });
      addToast('Removed item from the library.', 'SUCCESS');
    },
    [addToast, deleteWorkspaceItem, editorRef]
  );

  const handleDeleteCreatedItem = useCallback((entry: WorkspaceLibraryEntry) => {
    if (entry.refKind !== 'WORKSPACE_ITEM') return;
    setLibraryItemPendingDeletion(entry);
  }, []);

  return {
    confirmDeleteCreatedItem,
    createModal,
    handleDeleteCreatedItem,
    handleSubmitCreateModal,
    libraryItemPendingDeletion,
    libraryItemSections,
    librarySections: librarySectionState.state,
    setCreateModal,
    setLibraryItemPendingDeletion,
    toggleLibraryEntrySection,
    toggleLibrarySection: librarySectionState.toggleSection,
  };
};
