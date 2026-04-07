import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { getSnapshot, type Editor, type TLEditorSnapshot, type TLStoreSnapshot } from 'tldraw';

import type { WorkspaceBoard, WorkspaceBoardDocument } from '@/types';
import {
  BOARD_REF_META_KEY,
  parseBoardReference,
} from '@/services/workspace/boardShapes';
import { boardRefKey, type WorkspaceLibraryEntry } from '@/services/workspace/library';

interface UseBoardCanvasPersistenceInput {
  activeBoard: WorkspaceBoard | null;
  activeBoardDocument?: WorkspaceBoardDocument | null;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  libraryMap: Map<string, WorkspaceLibraryEntry>;
  saveWorkspaceBoardDocument: (input: {
    boardId: string;
    snapshot: unknown;
    updatedAt: number;
  }) => Promise<unknown>;
  setAiSummary: (value: string | null) => void;
  setSelectedEntries: Dispatch<SetStateAction<WorkspaceLibraryEntry[]>>;
  themeMode: 'dark' | 'light';
}

export const useBoardCanvasPersistence = ({
  activeBoard,
  activeBoardDocument,
  addToast,
  libraryMap,
  saveWorkspaceBoardDocument,
  setAiSummary,
  setSelectedEntries,
  themeMode,
}: UseBoardCanvasPersistenceInput) => {
  const editorRef = useRef<Editor | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const lastPersistedSnapshotRef = useRef<{ boardId: string | null; serialized: string | null }>({
    boardId: null,
    serialized: null,
  });
  const lastSelectionKeyRef = useRef<string>('');

  const hydratedSnapshot = useMemo(
    () =>
      (activeBoardDocument?.snapshot || undefined) as
        | TLEditorSnapshot
        | TLStoreSnapshot
        | undefined,
    [activeBoardDocument?.snapshot]
  );

  useEffect(() => {
    const serialized = activeBoardDocument?.snapshot
      ? JSON.stringify(activeBoardDocument.snapshot)
      : null;
    lastPersistedSnapshotRef.current = {
      boardId: activeBoard?.id || null,
      serialized,
    };
  }, [activeBoard?.id, activeBoardDocument?.snapshot]);

  const clearPendingSaveTimeout = useCallback(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  const persistBoardSnapshot = useCallback(
    async (editor: Editor, boardId: string) => {
      const snapshot = getSnapshot(editor.store) as unknown;
      const serialized = JSON.stringify(snapshot);
      if (
        lastPersistedSnapshotRef.current.boardId === boardId &&
        lastPersistedSnapshotRef.current.serialized === serialized
      ) {
        return;
      }

      try {
        await saveWorkspaceBoardDocument({
          boardId,
          snapshot,
          updatedAt: Date.now(),
        });
        lastPersistedSnapshotRef.current = {
          boardId,
          serialized,
        };
      } catch (error) {
        console.error(`Failed to save board ${boardId}`, error);
        addToast('Unable to save the latest board changes.', 'ERROR');
      }
    },
    [addToast, saveWorkspaceBoardDocument]
  );

  const persistCurrentBoardDocument = useCallback(async () => {
    if (!editorRef.current || !activeBoard) return;
    clearPendingSaveTimeout();
    await persistBoardSnapshot(editorRef.current, activeBoard.id);
  }, [activeBoard, clearPendingSaveTimeout, persistBoardSnapshot]);

  useEffect(() => {
    if (!editorRef.current || !activeBoard) return;
    editorRef.current.updateInstanceState({ isReadonly: !!activeBoard.presentationMode });
  }, [activeBoard]);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.user.updateUserPreferences({ colorScheme: themeMode });
  }, [themeMode]);

  useEffect(
    () => () => {
      void persistCurrentBoardDocument();
    },
    [persistCurrentBoardDocument]
  );

  useEffect(() => {
    const handlePageHide = () => {
      void persistCurrentBoardDocument();
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [persistCurrentBoardDocument]);

  const scheduleSave = useCallback(
    (editor: Editor) => {
      if (!activeBoard) return;

      clearPendingSaveTimeout();

      saveTimeoutRef.current = window.setTimeout(async () => {
        saveTimeoutRef.current = null;
        await persistBoardSnapshot(editor, activeBoard.id);
      }, 550);
    },
    [activeBoard, clearPendingSaveTimeout, persistBoardSnapshot]
  );

  const syncSelection = useCallback(
    (editor: Editor) => {
      const nextEntries = editor
        .getSelectedShapes()
        .map((shape) => {
          const meta = shape.meta as Record<string, unknown> | undefined;
          const ref = parseBoardReference(meta?.[BOARD_REF_META_KEY]);
          return ref ? libraryMap.get(boardRefKey(ref)) || null : null;
        })
        .filter((entry): entry is WorkspaceLibraryEntry => !!entry);

      const deduped = new Map(nextEntries.map((entry) => [boardRefKey(entry), entry]));
      const orderedEntries = Array.from(deduped.values());
      const nextSelectionKey = orderedEntries.map((entry) => boardRefKey(entry)).join('|');
      if (nextSelectionKey === lastSelectionKeyRef.current) {
        return;
      }

      lastSelectionKeyRef.current = nextSelectionKey;
      setSelectedEntries(orderedEntries);
      setAiSummary(null);
    },
    [libraryMap, setAiSummary, setSelectedEntries]
  );

  const handleEditorMount = useCallback(
    (editor: Editor) => {
      const mountedBoardId = activeBoard?.id || null;
      editorRef.current = editor;
      lastSelectionKeyRef.current = '';
      editor.user.updateUserPreferences({ colorScheme: themeMode });
      editor.updateInstanceState({ isReadonly: !!activeBoard?.presentationMode });
      syncSelection(editor);

      const removeSelectionListener = editor.store.listen(() => {
        syncSelection(editor);
      });
      const removeDocumentListener = editor.store.listen(
        () => {
          scheduleSave(editor);
        },
        {
          scope: 'document',
          source: 'user',
        }
      );

      return () => {
        removeSelectionListener();
        removeDocumentListener();
        if (mountedBoardId) {
          void persistBoardSnapshot(editor, mountedBoardId);
        } else {
          clearPendingSaveTimeout();
        }
        editorRef.current = null;
      };
    },
    [
      activeBoard?.id,
      activeBoard?.presentationMode,
      clearPendingSaveTimeout,
      persistBoardSnapshot,
      scheduleSave,
      syncSelection,
      themeMode,
    ]
  );

  return {
    editorRef,
    handleEditorMount,
    hydratedSnapshot,
    persistCurrentBoardDocument,
  };
};
