import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Bot,
  Clock3,
  FilePlus2,
  FileText,
  FolderPlus,
  Link2,
  MessageSquare,
  Network,
  Paperclip,
  PanelRight,
  Presentation,
  Radio,
  Search,
  Send,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  Tldraw,
  getSnapshot,
  type Editor,
  type TLEditorSnapshot,
  type TLStoreSnapshot,
} from 'tldraw';
import 'tldraw/tldraw.css';
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
import { EmptyState } from '@/components/ui/EmptyState';
import { OsintSelect } from '@/components/ui/OsintSelect';
import { Accordion } from '@/components/ui/Accordion';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InspectorActionRow, type InspectorActionItem } from '@/components/ui/InspectorActionRow';
import { type WorkspaceLibraryEntry } from '@/services/workspace/library';
import {
  buildWorkspaceItemFromBoardDraft,
  generateBoardSelectionDraft,
} from '@/services/workspace/boardAi';
import {
  BOARD_REF_META_KEY,
  buildBoardCardSpec,
  parseBoardReference,
  serializeBoardReference,
} from '../../../services/workspace/boardShapes';
import { runBoardAgentSession } from '@/services/workspace/agent';
import { createLocalId } from '@/utils/id';
import { sanitizeDisplayTitle } from '@/domain';
import {
  boardRefKey,
  boardTldrawComponents,
  buildSingleWorkspaceItemEntry,
  LEFT_PANEL_SECTION_SCROLL_CLASS,
  placeEntryOnBoard,
  type CreateModalState,
  type RightPanelView,
} from './workspaceBoardUtils';
import { buildWorkspaceBoardViewModel } from './workspaceBoardViewModel';

interface WorkspaceBoardProps {
  onOpenReport: (report: Artifact) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
}

export const WorkspaceBoard: React.FC<WorkspaceBoardProps> = ({
  onOpenReport,
  onOpenChat,
  onLaunchInvestigation,
}) => {
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
  const hydratedSnapshotRef = useRef<{
    boardId: string | null;
    snapshot: TLEditorSnapshot | TLStoreSnapshot | undefined;
  }>({
    boardId: null,
    snapshot: undefined,
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

  if (activeBoard?.id !== hydratedSnapshotRef.current.boardId) {
    hydratedSnapshotRef.current = {
      boardId: activeBoard?.id || null,
      snapshot: (activeBoardDocument?.snapshot || undefined) as
        | TLEditorSnapshot
        | TLStoreSnapshot
        | undefined,
    };
  }

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
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  const inspectorPanelBody = (
    <>
      {inspectorActions.length > 0 && (
        <div className="border-b border-zinc-800 bg-zinc-900/10 px-4 py-3">
          <InspectorActionRow actions={inspectorActions} layout="wrap" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        <Accordion
          title="Selection"
          icon={Shapes}
          count={selectedEntries.length}
          isOpen={inspectorSections.selection}
          onToggle={() => toggleInspectorSection('selection')}
        >
          <div className="space-y-2">
            {selectedEntries.length === 0 ? (
              <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
                Select one or more board items to inspect linked Sherlock records.
              </p>
            ) : (
              selectedEntries.map((entry) => (
                <div
                  key={boardRefKey(entry)}
                  className="border border-zinc-800 bg-zinc-900/40 p-3 text-zinc-200"
                >
                  <div className="text-xs font-bold uppercase tracking-wide text-osint-ink">
                    {entry.title}
                  </div>
                  {entry.description && (
                    <div className="mt-2 text-xs leading-5 text-zinc-400">{entry.description}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </Accordion>

        <Accordion
          title="AI Actions"
          icon={Bot}
          isOpen={inspectorSections.aiActions}
          onToggle={() => toggleInspectorSection('aiActions')}
        >
          <div className="space-y-3">
            <button
              onClick={() => {
                setRightPanelView('AGENT');
                void handleGenerateSummary();
              }}
              disabled={selectedEntries.length === 0 || aiBusy}
              className="osint-button-primary inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              Summarize Selection
            </button>
            <button
              onClick={() => {
                setRightPanelView('AGENT');
                void handleGenerateNote();
              }}
              disabled={selectedEntries.length === 0 || aiBusy || !!activeBoard?.presentationMode}
              className="osint-button-primary inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Bot className="h-4 w-4" />
              Draft Note Card
            </button>
            {aiSummary && (
              <div className="bg-black/40 p-3 text-xs leading-6 text-zinc-300">{aiSummary}</div>
            )}
          </div>
        </Accordion>

        <Accordion
          title="Provenance"
          icon={Clock3}
          isOpen={inspectorSections.provenance}
          onToggle={() => toggleInspectorSection('provenance')}
        >
          <div className="space-y-3 px-1 py-1 text-xs font-mono text-zinc-300">
            {selectedWorkspaceItem ? (
              <>
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Source</div>
                  <div className="mt-1">{selectedWorkspaceItem.provenance?.source || 'USER'}</div>
                </div>
                {selectedWorkspaceItem.provenance?.description && (
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500">Notes</div>
                    <div className="mt-1 leading-relaxed text-zinc-400">
                      {selectedWorkspaceItem.provenance.description}
                    </div>
                  </div>
                )}
                {selectedWorkspaceItem.provenance?.sourceSessionId && (
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500">Chat Session</div>
                    <div className="mt-1">{selectedWorkspaceItem.provenance.sourceSessionId}</div>
                  </div>
                )}
                {selectedWorkspaceItem.provenance?.sourceMessageId && (
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500">Message</div>
                    <div className="mt-1">{selectedWorkspaceItem.provenance.sourceMessageId}</div>
                  </div>
                )}
                {selectedWorkspaceItem.provenance?.sourceReportId && (
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500">Source Report</div>
                    <div className="mt-1">{selectedWorkspaceItem.provenance.sourceReportId}</div>
                  </div>
                )}
                {selectedWorkspaceItem.provenance?.sourceHeadlineId && (
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500">Source Signal</div>
                    <div className="mt-1">{selectedWorkspaceItem.provenance.sourceHeadlineId}</div>
                  </div>
                )}
              </>
            ) : (
              <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
                Select a promoted excerpt, note, link, file, or media item to inspect its origin.
              </p>
            )}
          </div>
        </Accordion>

        {activeBoard && (
          <div className="mt-3 border border-zinc-800 bg-zinc-900/20 p-3">
            <button
              onClick={handleDeleteBoard}
              disabled={availableBoards.length <= 1}
              className="osint-button-danger inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              Delete Board
            </button>
          </div>
        )}
      </div>
    </>
  );

  const agentPanelBody = (
    <div className="flex min-h-0 flex-1 flex-col bg-black">
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="space-y-4">
          <Accordion
            title="Agent Context"
            icon={Shapes}
            count={selectedEntries.length || undefined}
            isOpen={agentSections.context}
            onToggle={() => toggleAgentSection('context')}
          >
            <div className="space-y-3 bg-black/20 p-3 text-sm text-zinc-300">
              <div>
                {selectedEntries.length > 0
                  ? `${selectedEntries.length} selected item${selectedEntries.length === 1 ? '' : 's'}`
                  : 'Entire board in view'}
              </div>
              {selectedEntries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedEntries.slice(0, 4).map((entry) => (
                    <span
                      key={boardRefKey(entry)}
                      className="rounded-none border border-zinc-800 bg-black/80 px-2.5 py-1 text-[11px] text-zinc-300"
                    >
                      {entry.title}
                    </span>
                  ))}
                  {selectedEntries.length > 4 && (
                    <span className="rounded-none border border-zinc-800 bg-black/80 px-2.5 py-1 text-[11px] text-zinc-500">
                      +{selectedEntries.length - 4} more
                    </span>
                  )}
                </div>
              )}
              {aiSummary && (
                <div className="border border-zinc-800 bg-black/30 p-3 text-xs leading-6 text-zinc-300">
                  {aiSummary}
                </div>
              )}
            </div>
          </Accordion>

          {boardAgentMessage ? (
            <div className="border border-zinc-800 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                <Bot className="h-3.5 w-3.5 text-osint-primary" />
                Agent Response
              </div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                {boardAgentMessage}
              </div>
            </div>
          ) : null}

          {(visibleBoardAgentSession || boardAgentTodoItems.length > 0) && (
            <Accordion
              title="Session"
              icon={Clock3}
              isOpen={agentSections.session}
              onToggle={() => toggleAgentSection('session')}
            >
              <div className="space-y-3 border border-t-0 border-zinc-800 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-zinc-300">
                    {visibleBoardAgentSession?.title || 'Board agent'}
                  </div>
                  {visibleBoardAgentSession && (
                    <div className="rounded-none border border-zinc-800 bg-black/60 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400">
                      {visibleBoardAgentSession.status}
                    </div>
                  )}
                </div>
                {visibleBoardAgentSession && (
                  <div className="text-xs text-zinc-500">
                    {visibleBoardAgentSession.provider || 'Provider pending'}
                    {visibleBoardAgentSession.modelId
                      ? ` - ${visibleBoardAgentSession.modelId}`
                      : ''}
                  </div>
                )}
                {boardAgentBusy ? (
                  <div>
                    <button
                      type="button"
                      onClick={handleCancelBoardAgent}
                      className="inline-flex items-center gap-1 rounded-none border border-red-400/40 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-200 transition hover:bg-red-500/20 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </div>
                ) : null}
                {boardAgentTodoItems.length > 0 && (
                  <div className="space-y-2">
                    {boardAgentTodoItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-zinc-300"
                      >
                        <div>{item.text}</div>
                        <div className="shrink-0 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Accordion>
          )}

          {visibleBoardAgentActions.length > 0 && (
            <Accordion
              title="Recent Actions"
              icon={SlidersHorizontal}
              isOpen={agentSections.actions}
              onToggle={() => toggleAgentSection('actions')}
            >
              <div className="space-y-2 border border-t-0 border-zinc-800 bg-black/20 p-4">
                {visibleBoardAgentActions.slice(0, 8).map((action) => (
                  <div
                    key={action.id}
                    className="border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-zinc-300"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono uppercase tracking-[0.14em] text-zinc-200">
                        {action.type}
                      </div>
                      <div className="font-mono uppercase tracking-[0.14em] text-zinc-500">
                        {action.status}
                      </div>
                    </div>
                    {action.error && (
                      <div className="mt-2 text-[11px] leading-5 text-red-300">{action.error}</div>
                    )}
                    {!action.error && action.result && (
                      <div className="mt-2 overflow-x-auto text-[11px] leading-5 text-zinc-500">
                        {JSON.stringify(action.result)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Accordion>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="border border-zinc-800 bg-black/20">
          <textarea
            value={boardAgentPrompt}
            onChange={(event) => setBoardAgentPrompt(event.target.value)}
            onKeyDown={handleBoardAgentComposerKeyDown}
            placeholder="Ask the board agent to organize evidence, flag contradictions, or draft a note."
            className="min-h-28 w-full resize-none bg-transparent px-4 py-4 text-sm leading-6 text-zinc-300 outline-none placeholder:text-zinc-600"
          />
          <div className="flex items-center justify-between border-t border-zinc-800/80 px-3 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-none border border-zinc-800 bg-zinc-900/80 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                aria-label="Attach files"
                title="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => toggleAgentSection('actions')}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-none border transition ${
                  agentSections.actions
                    ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
                aria-label="Toggle agent details"
                title="Toggle agent details"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => void handleRunBoardAgent()}
              disabled={boardAgentBusy || !boardAgentPrompt.trim()}
              className="osint-button-primary inline-flex items-center gap-2 rounded-none px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              {boardAgentBusy ? 'Running' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!activeWorkspace) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <EmptyState
          icon={Shapes}
          title="No Active Workspace"
          description="Open or create a workspace first. The research board mirrors the active workspace and keeps board composition tied to canonical Sherlock records."
          action={{
            label: 'Open Case Files',
            onClick: () => navigate(buildFilesPath()),
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-black text-zinc-100">
      <header className="osint-header-shadow sticky top-0 z-[12000] flex h-20 items-center justify-between border-b border-zinc-800 bg-black/95 px-6 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setLeftPanelOpen((current) => !current)}
            className={`hidden items-center justify-center border p-2 text-xs font-mono uppercase transition md:inline-flex ${
              leftPanelOpen
                ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
            }`}
          >
            <Briefcase className="h-4 w-4" />
          </button>
          <button
            onClick={handleCreateBoard}
            className="osint-button-primary inline-flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase"
          >
            <FolderPlus className="h-4 w-4" />
            New Board
          </button>
          <div className="relative z-[12010] hidden min-w-[220px] max-w-[280px] md:block">
            <OsintSelect
              ariaLabel="Select workspace"
              value={activeWorkspace.id}
              onChange={handleWorkspaceChange}
              triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono truncate"
              menuClassName="z-[12020]"
              options={workspaces.map((workspace) => ({
                value: workspace.id,
                label: sanitizeDisplayTitle(workspace.title),
              }))}
            />
          </div>
          <div className="relative z-[12010] hidden min-w-[220px] max-w-[260px] md:block">
            <OsintSelect
              ariaLabel="Select board"
              value={activeBoard?.id || ''}
              onChange={(value) => {
                if (!activeWorkspace || !value) return;
                void (async () => {
                  await persistCurrentBoardDocument();
                  navigate(buildWorkspaceBoardDocumentPath(activeWorkspace.id, value));
                })();
              }}
              triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono truncate"
              menuClassName="z-[12020]"
              options={availableBoards.map((board) => ({
                value: board.id,
                label: board.name,
              }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeBoard && (
            <>
              <button
                onClick={() =>
                  void updateWorkspaceBoard(activeBoard.id, {
                    presentationMode: !activeBoard.presentationMode,
                  })
                }
                className={`inline-flex items-center gap-2 border px-3 py-2 text-xs font-mono uppercase transition ${
                  activeBoard.presentationMode
                    ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                    : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
                }`}
              >
                <Presentation className="h-4 w-4" />
                {activeBoard.presentationMode ? 'Presentation' : 'Edit Mode'}
              </button>
            </>
          )}
          <button
            onClick={() => setRightPanelOpen((current) => !current)}
            className={`hidden items-center justify-center border p-2 text-xs font-mono uppercase transition xl:inline-flex ${
              rightPanelOpen
                ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
            }`}
            title="Toggle Inspector Panel"
          >
            <PanelRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {(leftPanelOpen || rightPanelOpen) && (
          <div
            className="absolute inset-0 z-20 bg-black/80 xl:hidden"
            onClick={() => {
              setLeftPanelOpen(false);
              setRightPanelOpen(false);
            }}
          />
        )}

        <aside
          className={`absolute left-0 top-0 z-30 flex h-full flex-col overflow-hidden border-r border-zinc-800 bg-black/95 transition-all duration-200 xl:relative xl:translate-x-0 ${
            leftPanelOpen
              ? 'w-[min(23rem,calc(100vw-1rem))] translate-x-0'
              : 'w-[min(23rem,calc(100vw-1rem))] -translate-x-full xl:w-0 xl:border-r-0'
          }`}
        >
          <div className="border-b border-zinc-800 px-4 py-4">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
              <Shapes className="h-4 w-4 text-osint-primary" />
              Canonical Library
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setCreateModal({ type: 'NOTE', title: '', content: '' })}
                className="osint-button-primary inline-flex items-center gap-2 px-3 py-2 text-[11px] font-mono uppercase"
              >
                <FilePlus2 className="h-4 w-4" />
                Note
              </button>
              <button
                onClick={() =>
                  setCreateModal({ type: 'LINK', title: '', url: '', description: '' })
                }
                className="osint-button-primary inline-flex items-center gap-2 px-3 py-2 text-[11px] font-mono uppercase"
              >
                <Link2 className="h-4 w-4" />
                Link
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="osint-button-primary inline-flex items-center gap-2 px-3 py-2 text-[11px] font-mono uppercase"
              >
                <Radio className="h-4 w-4" />
                File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search library..."
                className="w-full border border-zinc-700 bg-black px-10 py-2 text-sm text-white outline-none transition focus:border-osint-primary"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden p-3">
            {(
              [
                ['created', 'Created Items', groupedEntries.created, FilePlus2],
                ['artifacts', 'Artifacts', groupedEntries.artifacts, FileText],
                ['entities', 'Entities', groupedEntries.entities, Network],
                ['sources', 'Sources', groupedEntries.sources, Link2],
                ['signals', 'Signals', groupedEntries.signals, Radio],
              ] as const
            ).map(([key, title, entries, icon]) => (
              <Accordion
                key={key}
                title={title}
                count={entries.length}
                icon={icon}
                isOpen={librarySections[key]}
                onToggle={() => toggleLibrarySection(key)}
                contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
              >
                <div className="space-y-2">
                  {entries.length === 0 ? (
                    <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
                      No matching items in this section.
                    </p>
                  ) : (
                    entries.map((entry) => (
                      <div
                        key={boardRefKey(entry)}
                        draggable
                        onDragStart={(event) =>
                          event.dataTransfer.setData(
                            'application/json+sherlock-entry',
                            serializeBoardReference(entry)
                          )
                        }
                      >
                        <Accordion
                          title={entry.title}
                          isOpen={!!libraryItemSections[boardRefKey(entry)]}
                          onToggle={() => toggleLibraryEntrySection(boardRefKey(entry))}
                          className="border-zinc-800 bg-zinc-900/40 text-zinc-200"
                          headerClassName="bg-black/10 px-2.5 py-2 text-left text-[10px] font-normal leading-5 tracking-[0.04em] text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-200"
                          chevronClassName="h-[15px] w-[15px] shrink-0 text-zinc-500"
                        >
                          <div className="space-y-3">
                            <div
                              className={`text-xs leading-5 text-zinc-500 ${
                                key === 'sources' ? 'line-clamp-2 break-all' : ''
                              }`}
                            >
                              {entry.description ||
                                'Open this item from the library to place it on the board.'}
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                                {entry.kind}
                              </div>
                              <div className="flex items-center gap-2">
                                {key === 'created' && entry.refKind === 'WORKSPACE_ITEM' && (
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteCreatedItem(entry)}
                                    className="inline-flex items-center gap-1 border border-zinc-700 px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-400 transition hover:border-red-400/50 hover:text-red-300"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDropEntry(entry)}
                                  className="osint-button-primary px-3 py-1.5 text-[10px] font-mono uppercase"
                                >
                                  Add To Board
                                </button>
                              </div>
                            </div>
                          </div>
                        </Accordion>
                      </div>
                    ))
                  )}
                </div>
              </Accordion>
            ))}
          </div>
        </aside>

        <main className="relative flex-1 overflow-hidden bg-osint-dark">
          <div
            className="sherlock-board-canvas absolute inset-0"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleCanvasDrop}
          >
            {activeBoard ? (
              <Tldraw
                key={activeBoard.id}
                className="h-full w-full"
                components={boardTldrawComponents}
                snapshot={hydratedSnapshotRef.current.snapshot}
                onMount={handleEditorMount}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  icon={Shapes}
                  title="Preparing Board"
                  description="Sherlock is preparing the primary board for this workspace."
                />
              </div>
            )}
          </div>
        </main>

        <aside
          className={`absolute right-0 top-0 z-30 flex h-full flex-col overflow-hidden border-l border-zinc-800 bg-black transition-all duration-200 xl:relative xl:translate-x-0 ${
            rightPanelOpen
              ? 'w-[min(24rem,calc(100vw-1rem))] translate-x-0'
              : 'w-[min(24rem,calc(100vw-1rem))] translate-x-full xl:w-0 xl:border-l-0'
          }`}
        >
          <div className="border-b border-zinc-800 bg-zinc-900/30 px-4 py-3">
            <div className="flex w-full justify-start gap-2">
              {(
                [
                  ['AGENT', 'Agent'],
                  ['INSPECTOR', 'Inspector'],
                ] as const
              ).map(([view, label]) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setRightPanelView(view)}
                  className={rightPanelTabButtonClass(view)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {rightPanelView === 'INSPECTOR' ? inspectorPanelBody : agentPanelBody}
        </aside>
      </div>

      {createModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
            <div className="border-b border-zinc-800 px-6 py-4 text-sm font-bold uppercase tracking-widest text-white">
              {createModal.type === 'NOTE' ? 'Create Workspace Note' : 'Capture Workspace Link'}
            </div>
            <div className="space-y-4 p-6">
              <input
                value={createModal.title}
                onChange={(event) =>
                  setCreateModal((current) =>
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
                    setCreateModal((current) =>
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
                      setCreateModal((current) =>
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
                      setCreateModal((current) =>
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
            <div className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-4">
              <button
                onClick={() => setCreateModal(null)}
                className="border border-zinc-700 px-4 py-2 text-xs font-mono uppercase text-zinc-400 transition hover:border-zinc-500 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSubmitCreateModal()}
                className="osint-button-primary px-4 py-2 text-xs font-mono uppercase"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}

      {boardPendingDeletion && (
        <ConfirmDialog
          title="Delete Board"
          description={`Delete "${boardPendingDeletion.name}" and its saved board document? This removes this board and its board-agent session history, but keeps the rest of the workspace intact.`}
          confirmLabel="Delete Board"
          tone="danger"
          onClose={() => setBoardPendingDeletion(null)}
          onConfirm={() => {
            void (async () => {
              await deleteWorkspaceBoard(boardPendingDeletion.id);
              setBoardPendingDeletion(null);
            })();
          }}
        />
      )}

      {libraryItemPendingDeletion && (
        <ConfirmDialog
          title="Delete Library Item"
          description={`Delete "${libraryItemPendingDeletion.title}" from the workspace library and remove matching cards from the active board?`}
          confirmLabel="Delete Item"
          tone="danger"
          onClose={() => setLibraryItemPendingDeletion(null)}
          onConfirm={() => {
            void (async () => {
              await confirmDeleteCreatedItem(libraryItemPendingDeletion);
              setLibraryItemPendingDeletion(null);
            })();
          }}
        />
      )}
    </div>
  );
};
