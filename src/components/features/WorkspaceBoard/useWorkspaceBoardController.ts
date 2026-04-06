import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSnapshot,
  type Editor,
  type TLEditorSnapshot,
  type TLStoreSnapshot,
} from 'tldraw';
import { Clock3, FileText, Link2, MessageSquare, Network } from 'lucide-react';

import type {
  Artifact,
  ChatOpenRequest,
  InvestigationLaunchRequest,
  WorkspaceBoardItemReference,
  WorkspaceItem,
} from '@/types';
import {
  buildFilesPath,
  buildWorkspaceBoardDocumentPath,
  buildWorkspaceBoardPath,
  buildWorkspaceNetworkPath,
  buildWorkspaceTimelinePath,
} from '@/app/routes';
import { useWorkspaceStore } from '@/store/caseStore';
import { type InspectorActionItem } from '@/components/ui/InspectorActionRow';
import { type WorkspaceLibraryEntry } from '@/services/workspace/library';
import {
  buildWorkspaceItemFromBoardDraft,
  generateBoardSelectionDraft,
} from '@/services/workspace/boardAi';
import {
  BOARD_REF_META_KEY,
  buildBoardCardSpec,
  parseBoardReference,
} from '../../../services/workspace/boardShapes';
import { runBoardAgentSession } from '@/services/workspace/agent';
import { createLocalId } from '@/utils/id';
import {
  boardRefKey,
  buildSingleWorkspaceItemEntry,
  LEFT_PANEL_SECTION_SCROLL_CLASS,
  placeEntryOnBoard,
  type CreateModalState,
  type RightPanelView,
} from './workspaceBoardUtils';
import { buildWorkspaceBoardViewModel } from './workspaceBoardViewModel';

interface UseWorkspaceBoardControllerInput {
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
  onOpenReport: (report: Artifact) => void;
}

export const useWorkspaceBoardController = ({
  onLaunchInvestigation,
  onOpenChat,
  onOpenReport,
}: UseWorkspaceBoardControllerInput) => {
  const navigate = useNavigate();
  const {
    activeWorkspaceBoardId,
    activeWorkspaceId,
    artifacts,
    boardAgentActionsBySessionId,
    boardAgentSessions,
    createBoardAgentSession,
    createWorkspaceBoard,
    createWorkspaceItem,
    deleteWorkspaceItem,
    ensureWorkspaceBoard,
    headlines,
    queuedBoardPlacement,
    saveArtifact,
    saveWorkspaceBoardDocument,
    setActiveWorkspaceId,
    appendSectionToReport,
    addBoardAgentAction,
    updateWorkspaceBoard,
    updateBoardAgentAction,
    updateBoardAgentSession,
    workspaceBoardDocuments,
    workspaceBoards,
    workspaceItems,
    workspaces,
    clearQueuedBoardPlacement,
    deleteWorkspaceBoard,
    addToast,
    themeMode,
  } = useWorkspaceStore();

  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [createModal, setCreateModal] = useState<CreateModalState>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [boardAgentBusy, setBoardAgentBusy] = useState(false);
  const [boardAgentPrompt, setBoardAgentPrompt] = useState('');
  const [boardAgentMessage, setBoardAgentMessage] = useState<string | null>(null);
  const [boardAgentActiveSessionId, setBoardAgentActiveSessionId] = useState<string | null>(null);
  const [boardPendingDeletion, setBoardPendingDeletion] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [libraryItemPendingDeletion, setLibraryItemPendingDeletion] =
    useState<WorkspaceLibraryEntry | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<WorkspaceLibraryEntry[]>([]);
  const [librarySections, setLibrarySections] = useState({
    created: false,
    artifacts: false,
    entities: false,
    sources: false,
    signals: false,
  });
  const [libraryItemSections, setLibraryItemSections] = useState<Record<string, boolean>>({});
  const [inspectorSections, setInspectorSections] = useState({
    selection: true,
    aiActions: true,
    provenance: true,
  });
  const [agentSections, setAgentSections] = useState({
    context: true,
    session: true,
    actions: false,
  });
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>('AGENT');
  const editorRef = useRef<Editor | null>(null);
  const boardAgentAbortRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autoPlacementRef = useRef<{ boardId: string | null; index: number }>({
    boardId: null,
    index: 0,
  });
  const {
    activeBoard,
    activeBoardDocument,
    activeWorkspace,
    availableBoards,
    boardAgentTodoItems,
    boardSessionsForBoard,
    createdWorkspaceItems,
    groupedEntries,
    libraryMap,
    selectedArtifact,
    selectedHeadline,
    selectedPrimaryEntry,
    selectedWorkspaceItem,
    visibleBoardAgentActions,
    visibleBoardAgentSession,
    workspaceArtifacts,
    workspaceHeadlines,
  } = useMemo(
    () =>
      buildWorkspaceBoardViewModel({
        activeWorkspaceBoardId,
        activeWorkspaceId,
        artifacts,
        boardAgentActionsBySessionId,
        boardAgentActiveSessionId,
        boardAgentSessions,
        headlines,
        search,
        selectedEntries,
        workspaceBoardDocuments,
        workspaceBoards,
        workspaceItems,
        workspaces,
      }),
    [
      activeWorkspaceBoardId,
      activeWorkspaceId,
      artifacts,
      boardAgentActionsBySessionId,
      boardAgentActiveSessionId,
      boardAgentSessions,
      headlines,
      search,
      selectedEntries,
      workspaceBoardDocuments,
      workspaceBoards,
      workspaceItems,
      workspaces,
    ]
  );

  const rightPanelTabButtonClass = (view: RightPanelView) =>
    `inline-flex h-9 flex-1 items-center justify-center border px-4 text-xs font-mono uppercase transition ${
      rightPanelView === view
        ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
        : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
    }`;

  const hydratedSnapshot = useMemo(
    () => (activeBoardDocument?.snapshot || undefined) as TLEditorSnapshot | TLStoreSnapshot | undefined,
    [activeBoardDocument?.snapshot]
  );

  if (activeBoard?.id !== autoPlacementRef.current.boardId) {
    autoPlacementRef.current = {
      boardId: activeBoard?.id || null,
      index: 0,
    };
  }

  useEffect(() => {
    if (!activeWorkspace) return;
    if (availableBoards.length > 0) return;
    void ensureWorkspaceBoard(activeWorkspace.id);
  }, [activeWorkspace, availableBoards.length, ensureWorkspaceBoard]);

  useEffect(() => {
    if (!activeWorkspace || !activeBoard) return;
    if (!editorRef.current || !queuedBoardPlacement) return;
    if (queuedBoardPlacement.workspaceId !== activeWorkspace.id) return;
    if (queuedBoardPlacement.boardId && queuedBoardPlacement.boardId !== activeBoard.id) {
      navigate(buildWorkspaceBoardDocumentPath(activeWorkspace.id, queuedBoardPlacement.boardId));
      return;
    }

    const queuedEntry = libraryMap.get(boardRefKey(queuedBoardPlacement.item));
    if (queuedEntry) {
      if (activeBoard.presentationMode) {
        addToast('Board is in presentation mode. Disable it before placing new items.', 'INFO');
        clearQueuedBoardPlacement();
        return;
      }

      const viewport = editorRef.current.getViewportPageBounds();
      const card = buildBoardCardSpec(queuedEntry);
      placeEntryOnBoard(
        editorRef.current,
        queuedEntry,
        viewport.x + viewport.w / 2 - card.w / 2,
        viewport.y + viewport.h / 2 - card.h / 2,
        themeMode
      );
    }

    clearQueuedBoardPlacement();
  }, [
    addToast,
    activeBoard,
    activeWorkspace,
    clearQueuedBoardPlacement,
    libraryMap,
    navigate,
    queuedBoardPlacement,
    themeMode,
  ]);

  useEffect(() => {
    if (!editorRef.current || !activeBoard) return;
    editorRef.current.updateInstanceState({ isReadonly: !!activeBoard.presentationMode });
  }, [activeBoard]);

  useEffect(() => {
    setBoardAgentActiveSessionId(null);
    setBoardAgentMessage(null);
  }, [activeBoard?.id, activeWorkspace?.id]);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.user.updateUserPreferences({ colorScheme: themeMode });
  }, [themeMode]);

  const clearPendingSaveTimeout = useCallback(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  const persistBoardSnapshot = useCallback(
    async (editor: Editor, boardId: string) => {
      try {
        await saveWorkspaceBoardDocument({
          boardId,
          snapshot: getSnapshot(editor.store) as unknown,
          updatedAt: Date.now(),
        });
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

  useEffect(
    () => () => {
      boardAgentAbortRef.current?.abort();
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

  useEffect(() => {
    if (boardAgentBusy) return;
    const latestSessionMessage =
      typeof visibleBoardAgentSession?.metadata?.latestMessage === 'string'
        ? visibleBoardAgentSession.metadata.latestMessage
        : null;
    setBoardAgentMessage(latestSessionMessage);
  }, [boardAgentBusy, visibleBoardAgentSession]);

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
      setSelectedEntries(Array.from(deduped.values()));
      setAiSummary(null);
    },
    [libraryMap]
  );

  const handleEditorMount = useCallback(
    (editor: Editor) => {
      const mountedBoardId = activeBoard?.id || null;
      editorRef.current = editor;
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

  const handleCreateBoard = async () => {
    if (!activeWorkspace) return;
    await persistCurrentBoardDocument();
    const board = await createWorkspaceBoard({ workspaceId: activeWorkspace.id });
    navigate(buildWorkspaceBoardDocumentPath(activeWorkspace.id, board.id));
  };

  const handleDeleteBoard = async () => {
    if (!activeBoard || availableBoards.length <= 1) return;
    setBoardPendingDeletion({ id: activeBoard.id, name: activeBoard.name });
  };

  const handleWorkspaceChange = async (workspaceId: string) => {
    await persistCurrentBoardDocument();
    setActiveWorkspaceId(workspaceId || null);
    if (workspaceId) {
      navigate(buildWorkspaceBoardPath(workspaceId));
    } else {
      navigate(buildFilesPath());
    }
  };

  const handleDropEntry = useCallback(
    (entry: WorkspaceLibraryEntry, clientX?: number, clientY?: number) => {
      if (!editorRef.current || !activeBoard) return;
      if (activeBoard.presentationMode) {
        addToast('Disable presentation mode before editing this board.', 'INFO');
        return;
      }

      const card = buildBoardCardSpec(entry);
      const point =
        clientX !== undefined && clientY !== undefined
          ? editorRef.current.screenToPage({ x: clientX, y: clientY })
          : null;
      const viewport = editorRef.current.getViewportPageBounds();
      const slotWidth = card.w + 48;
      const slotHeight = card.h + 48;
      const usableWidth = Math.max(slotWidth, viewport.w - 96);
      const columns = Math.max(1, Math.floor(usableWidth / slotWidth));
      const placementIndex = autoPlacementRef.current.index;
      const autoPosition = {
        x: viewport.x + 48 + (placementIndex % columns) * slotWidth,
        y: viewport.y + 48 + Math.floor(placementIndex / columns) * slotHeight,
      };

      if (!point) {
        autoPlacementRef.current = {
          boardId: activeBoard.id,
          index: placementIndex + 1,
        };
      }

      placeEntryOnBoard(
        editorRef.current,
        entry,
        point?.x ?? autoPosition.x,
        point?.y ?? autoPosition.y,
        themeMode
      );
    },
    [activeBoard, addToast, themeMode]
  );

  const handleCanvasDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/json+sherlock-entry');
    if (!raw) return;

    try {
      const ref = JSON.parse(raw) as WorkspaceBoardItemReference;
      const entry = libraryMap.get(boardRefKey(ref));
      if (entry) {
        handleDropEntry(entry, event.clientX, event.clientY);
      }
    } catch {
      // Ignore malformed drag payloads.
    }
  };

  const toggleLibraryEntrySection = (entryKey: string) => {
    setLibraryItemSections((current) => ({
      ...current,
      [entryKey]: !current[entryKey],
    }));
  };

  const toggleLibrarySection = (section: keyof typeof librarySections) => {
    setLibrarySections((current) =>
      Object.fromEntries(
        Object.keys(current).map((key) => [key, key === section ? !current[section] : false])
      ) as typeof current
    );
  };

  const toggleInspectorSection = (section: keyof typeof inspectorSections) => {
    setInspectorSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const toggleAgentSection = (section: keyof typeof agentSections) => {
    setAgentSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const handleSubmitCreateModal = useCallback(async () => {
    if (!activeWorkspace || !createModal) return;

    const now = Date.now();
    let nextItem: WorkspaceItem | null = null;

    if (createModal.type === 'NOTE' && createModal.title.trim() && createModal.content.trim()) {
      nextItem = {
        id: createLocalId('workspace-item'),
        workspaceId: activeWorkspace.id,
        kind: 'NOTE',
        title: createModal.title.trim(),
        description: createModal.content.trim().slice(0, 240),
        textContent: createModal.content.trim(),
        provenance: {
          source: 'USER',
          description: 'Created manually inside the research workspace.',
        },
        createdAt: now,
        updatedAt: now,
      };
    }

    if (createModal.type === 'LINK' && createModal.title.trim() && createModal.url.trim()) {
      nextItem = {
        id: createLocalId('workspace-item'),
        workspaceId: activeWorkspace.id,
        kind: 'LINK',
        title: createModal.title.trim(),
        description: createModal.description.trim() || createModal.url.trim(),
        url: createModal.url.trim(),
        provenance: {
          source: 'INGESTION',
          description: 'Captured from a manual workspace link ingestion.',
        },
        createdAt: now,
        updatedAt: now,
      };
    }

    if (!nextItem) return;
    await createWorkspaceItem(nextItem);
    const entry = buildSingleWorkspaceItemEntry(activeWorkspace.id, nextItem);
    if (entry) {
      handleDropEntry(entry);
    }
    setCreateModal(null);
  }, [activeWorkspace, createModal, createWorkspaceItem, handleDropEntry]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!activeWorkspace) return;
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      const previewUrl =
        file.type.startsWith('image/') || file.type.startsWith('video/')
          ? await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(file);
            })
          : undefined;

      await createWorkspaceItem({
        id: createLocalId('workspace-item'),
        workspaceId: activeWorkspace.id,
        kind: file.type.startsWith('image/') || file.type.startsWith('video/') ? 'MEDIA' : 'FILE',
        title: file.name,
        description: `${file.name} - ${Math.max(1, Math.round(file.size / 1024))} KB`,
        mimeType: file.type || undefined,
        fileName: file.name,
        sizeBytes: file.size,
        previewUrl: previewUrl || undefined,
        provenance: {
          source: 'INGESTION',
          description: 'Captured from a local file upload.',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    addToast(
      files.length === 1
        ? 'Added file to the workspace library.'
        : `Added ${files.length} files to the workspace library.`,
      'SUCCESS'
    );
    event.target.value = '';
  };

  const handleGenerateSummary = async () => {
    if (!activeWorkspace || selectedEntries.length === 0) return;
    setAiBusy(true);

    try {
      const result = await generateBoardSelectionDraft({
        workspace: activeWorkspace,
        artifacts: workspaceArtifacts,
        headlines: workspaceHeadlines,
        selectedEntries,
        mode: 'SUMMARY',
      });
      setAiSummary(result.content);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Unable to summarize this selection.',
        'ERROR'
      );
    } finally {
      setAiBusy(false);
    }
  };

  const handleGenerateNote = async () => {
    if (!activeWorkspace || !activeBoard || selectedEntries.length === 0) return;
    if (activeBoard.presentationMode) {
      addToast('Disable presentation mode before drafting a note card onto the board.', 'INFO');
      return;
    }
    setAiBusy(true);

    try {
      const result = await generateBoardSelectionDraft({
        workspace: activeWorkspace,
        artifacts: workspaceArtifacts,
        headlines: workspaceHeadlines,
        selectedEntries,
        mode: 'NOTE',
      });
      const noteItem = buildWorkspaceItemFromBoardDraft({
        workspaceId: activeWorkspace.id,
        title: result.title,
        content: result.content,
        sourceBoardId: activeBoard.id,
      });

      await createWorkspaceItem(noteItem);
      const entry = buildSingleWorkspaceItemEntry(activeWorkspace.id, noteItem);
      if (entry) {
        handleDropEntry(entry);
      }
      addToast('Created a new AI-assisted board note.', 'SUCCESS');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to draft a board note.', 'ERROR');
    } finally {
      setAiBusy(false);
    }
  };

  const handleCancelBoardAgent = useCallback(() => {
    boardAgentAbortRef.current?.abort();
    boardAgentAbortRef.current = null;
  }, []);

  const handleRunBoardAgent = useCallback(async () => {
    if (!activeWorkspace || !activeBoard || !editorRef.current) return;

    const request = boardAgentPrompt.trim();
    if (!request) {
      addToast('Enter a board-agent request first.', 'INFO');
      return;
    }
    if (activeBoard.presentationMode) {
      addToast('Disable presentation mode before running the board agent.', 'INFO');
      return;
    }

    const abortController = new AbortController();
    boardAgentAbortRef.current = abortController;
    setRightPanelOpen(true);
    setRightPanelView('AGENT');
    setBoardAgentBusy(true);
    setBoardAgentMessage(null);

    try {
      const recentBoardActions = boardSessionsForBoard
        .flatMap((session) => boardAgentActionsBySessionId[session.id] || [])
        .sort((left, right) => right.createdAt - left.createdAt)
        .slice(0, 24);

      const result = await runBoardAgentSession({
        workspace: activeWorkspace,
        board: activeBoard,
        boardDocument: activeBoardDocument,
        editor: editorRef.current,
        themeMode,
        artifacts: [...workspaceArtifacts],
        headlines: [...workspaceHeadlines],
        workspaceItems: [...createdWorkspaceItems],
        userRequest: request,
        selectedShapeIds: editorRef.current.getSelectedShapeIds().map((id) => id as string),
        viewportBounds: editorRef.current.getViewportPageBounds(),
        configOverride: undefined,
        packId: activeWorkspace.packId,
        purposeId: activeWorkspace.purposeId,
        recentSessions: boardSessionsForBoard.slice(0, 6),
        recentActions: recentBoardActions,
        signal: abortController.signal,
        createBoardAgentSession,
        updateBoardAgentSession,
        addBoardAgentAction,
        updateBoardAgentAction,
        persistBoardDocument: persistCurrentBoardDocument,
        createWorkspaceItem,
        saveArtifact,
        appendSectionToReport,
        launchInvestigation: async (launchRequest) => {
          onLaunchInvestigation({
            ...launchRequest,
            switchToView: true,
          });
        },
        onEvent: (event) => {
          if (event.type === 'SESSION_CREATED') {
            setBoardAgentActiveSessionId(event.session.id);
          }
          if (event.type === 'MESSAGE' && event.message) {
            setBoardAgentMessage(event.message);
          }
        },
      });

      setBoardAgentActiveSessionId(result.session.id);
      setBoardAgentMessage(result.message || null);

      if (result.session.status === 'FAILED') {
        addToast(result.session.lastError || 'Board-agent run failed.', 'ERROR');
      } else if (result.session.status === 'CANCELLED') {
        addToast('Board-agent run cancelled.', 'INFO');
      } else {
        addToast('Board-agent run complete.', 'SUCCESS');
      }
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Board-agent run failed unexpectedly.',
        'ERROR'
      );
    } finally {
      boardAgentAbortRef.current = null;
      setBoardAgentBusy(false);
    }
  }, [
    activeBoard,
    activeBoardDocument,
    activeWorkspace,
    addBoardAgentAction,
    addToast,
    appendSectionToReport,
    boardAgentActionsBySessionId,
    boardAgentPrompt,
    boardSessionsForBoard,
    createBoardAgentSession,
    createWorkspaceItem,
    createdWorkspaceItems,
    onLaunchInvestigation,
    persistCurrentBoardDocument,
    saveArtifact,
    themeMode,
    updateBoardAgentAction,
    updateBoardAgentSession,
    workspaceArtifacts,
    workspaceHeadlines,
  ]);

  const handleBoardAgentComposerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Enter' || event.shiftKey) return;
      event.preventDefault();
      if (!boardAgentBusy && boardAgentPrompt.trim()) {
        void handleRunBoardAgent();
      }
    },
    [boardAgentBusy, boardAgentPrompt, handleRunBoardAgent]
  );

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
    [addToast, deleteWorkspaceItem]
  );

  const handleDeleteCreatedItem = useCallback((entry: WorkspaceLibraryEntry) => {
    if (entry.refKind !== 'WORKSPACE_ITEM') return;
    setLibraryItemPendingDeletion(entry);
  }, []);

  const handleOpenSelectedChat = () => {
    if (!activeWorkspace) return;

    if (selectedArtifact?.id) {
      onOpenChat({
        workspaceId: activeWorkspace.id,
        launchContext: { sourceReportId: selectedArtifact.id },
      });
      return;
    }

    if (selectedHeadline) {
      onOpenChat({
        workspaceId: activeWorkspace.id,
        launchContext: { signalId: selectedHeadline.id, headlineId: selectedHeadline.id },
      });
      return;
    }

    const selectedEntity = selectedEntries.find((entry) => entry.refKind === 'ENTITY');
    if (selectedEntity) {
      onOpenChat({
        workspaceId: activeWorkspace.id,
        launchContext: { entityName: selectedEntity.title },
      });
      return;
    }

    onOpenChat({ workspaceId: activeWorkspace.id });
  };

  const inspectorActions: InspectorActionItem[] = [];
  if (selectedArtifact) {
    inspectorActions.push({
      id: 'board-open-report',
      label: 'Open Artifact',
      icon: FileText,
      onClick: () => onOpenReport(selectedArtifact),
    });
  }
  if (selectedEntries.length > 0) {
    inspectorActions.push({
      id: 'board-open-chat',
      label: 'Open In Chat',
      icon: MessageSquare,
      onClick: handleOpenSelectedChat,
    });
  }
  if (selectedWorkspaceItem?.provenance?.sourceSessionId) {
    inspectorActions.push({
      id: 'board-open-chat-session',
      label: 'Source Chat',
      icon: MessageSquare,
      onClick: () =>
        onOpenChat({
          workspaceId: selectedWorkspaceItem.workspaceId,
          sessionId: selectedWorkspaceItem.provenance?.sourceSessionId,
        }),
    });
  }
  if (selectedWorkspaceItem?.provenance?.sourceReportId) {
    const sourceReport = workspaceArtifacts.find(
      (artifact) => artifact.id === selectedWorkspaceItem.provenance?.sourceReportId
    );
    if (sourceReport) {
      inspectorActions.push({
        id: 'board-open-source-report',
        label: 'Source Report',
        icon: FileText,
        onClick: () => onOpenReport(sourceReport),
      });
    }
  }
  if (selectedPrimaryEntry?.url || typeof selectedPrimaryEntry?.metadata?.url === 'string') {
    inspectorActions.push({
      id: 'board-open-link',
      label: 'Open Link',
      icon: Link2,
      href:
        selectedPrimaryEntry?.url ||
        (typeof selectedPrimaryEntry?.metadata?.url === 'string'
          ? selectedPrimaryEntry.metadata.url
          : undefined),
      target: '_blank',
      rel: 'noopener noreferrer',
    });
  }
  if (activeWorkspace) {
    inspectorActions.push({
      id: 'board-open-timeline',
      label: 'Timeline',
      icon: Clock3,
      onClick: () => {
        void (async () => {
          await persistCurrentBoardDocument();
          navigate(buildWorkspaceTimelinePath(activeWorkspace.id));
        })();
      },
    });
    inspectorActions.push({
      id: 'board-open-network',
      label: 'Network Graph',
      icon: Network,
      onClick: () => {
        void (async () => {
          await persistCurrentBoardDocument();
          navigate(buildWorkspaceNetworkPath(activeWorkspace.id));
        })();
      },
    });
  }

  return {
    activeBoard,
    activeBoardDocument,
    activeWorkspace,
    aiBusy,
    aiSummary,
    agentSections,
    availableBoards,
    boardAgentActiveSessionId,
    boardAgentBusy,
    boardAgentMessage,
    boardAgentPrompt,
    boardAgentTodoItems,
    boardPendingDeletion,
    confirmDeleteCreatedItem,
    createModal,
    createdWorkspaceItems,
    deleteWorkspaceBoard,
    editorRef,
    fileInputRef,
    groupedEntries,
    handleBoardAgentComposerKeyDown,
    handleCanvasDrop,
    handleCancelBoardAgent,
    handleCreateBoard,
    handleDeleteBoard,
    handleDeleteCreatedItem,
    handleDropEntry,
    handleEditorMount,
    handleFileUpload,
    handleGenerateNote,
    handleGenerateSummary,
    handleRunBoardAgent,
    handleSubmitCreateModal,
    handleWorkspaceChange,
    hydratedSnapshot,
    inspectorActions,
    inspectorSections,
    leftPanelOpen,
    libraryItemPendingDeletion,
    libraryItemSections,
    libraryMap,
    librarySections,
    persistCurrentBoardDocument,
    rightPanelOpen,
    rightPanelTabButtonClass,
    rightPanelView,
    search,
    selectedArtifact,
    selectedEntries,
    selectedHeadline,
    selectedPrimaryEntry,
    selectedWorkspaceItem,
    setBoardAgentPrompt,
    setBoardPendingDeletion,
    setCreateModal,
    setLeftPanelOpen,
    setLibraryItemPendingDeletion,
    setRightPanelOpen,
    setRightPanelView,
    setSearch,
    toggleAgentSection,
    toggleInspectorSection,
    toggleLibraryEntrySection,
    toggleLibrarySection,
    updateWorkspaceBoard,
    visibleBoardAgentActions,
    visibleBoardAgentSession,
    workspaceArtifacts,
    workspaceHeadlines,
    workspaceBoards,
    workspaceItems,
    workspaces,
    LEFT_PANEL_SECTION_SCROLL_CLASS,
  };
};
