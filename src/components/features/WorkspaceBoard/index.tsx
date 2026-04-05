import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
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
  PanelRight,
  Presentation,
  Radio,
  Search,
  Shapes,
  Sparkles,
  Trash2,
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
import { AppView } from '@/types';
import { useWorkspaceStore, type ThemeMode } from '@/store/caseStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { OsintSelect } from '@/components/ui/OsintSelect';
import { Accordion } from '@/components/ui/Accordion';
import { EditableTitle } from '@/components/ui/EditableTitle';
import { InspectorActionRow, type InspectorActionItem } from '@/components/ui/InspectorActionRow';
import {
  buildWorkspaceLibraryEntries,
  type WorkspaceLibraryEntry,
} from '@/services/workspace/library';
import {
  buildWorkspaceItemFromBoardDraft,
  generateBoardSelectionDraft,
} from '@/services/workspace/boardAi';
import {
  BOARD_REF_META_KEY,
  buildBoardCardSpec,
  parseBoardReference,
  placeEntryOnBoard as placeWorkspaceEntryOnBoard,
  serializeBoardReference,
} from '../../../services/workspace/boardShapes';
import {
  deriveBoardAgentTodoItems,
  runBoardAgentSession,
} from '@/services/workspace/agent';
import { createLocalId } from '@/utils/id';
import { sanitizeDisplayTitle } from '@/domain';

const boardRefKey = (ref: WorkspaceBoardItemReference) => `${ref.refKind}:${ref.refId}`;
type CreateModalState =
  | { type: 'NOTE'; title: string; content: string }
  | { type: 'LINK'; title: string; url: string; description: string }
  | null;

const buildSingleWorkspaceItemEntry = (
  workspaceId: string,
  item: WorkspaceItem
): WorkspaceLibraryEntry | null =>
  buildWorkspaceLibraryEntries({
    workspaceId,
    artifacts: [],
    headlines: [],
    workspaceItems: [item],
  })[0] || null;

const placeEntryOnBoard = (
  editor: Editor,
  entry: WorkspaceLibraryEntry,
  x: number,
  y: number,
  themeMode: ThemeMode
) => {
  placeWorkspaceEntryOnBoard(editor, entry, x, y, themeMode);
};

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
  const {
    activeWorkspaceBoardId,
    activeWorkspaceId,
    artifacts,
    boardAgentActionsBySessionId,
    boardAgentSessions,
    createBoardAgentSession,
    createWorkspaceBoard,
    createWorkspaceItem,
    currentView,
    deleteWorkspaceItem,
    ensureWorkspaceBoard,
    headlines,
    queuedBoardPlacement,
    saveArtifact,
    saveWorkspaceBoardDocument,
    setActiveWorkspaceBoardId,
    setActiveWorkspaceId,
    setCurrentView,
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

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null,
    [activeWorkspaceId, workspaces]
  );

  const workspaceArtifacts = useMemo(
    () => artifacts.filter((artifact) => artifact.caseId === activeWorkspace?.id),
    [activeWorkspace?.id, artifacts]
  );
  const workspaceHeadlines = useMemo(
    () => headlines.filter((headline) => headline.caseId === activeWorkspace?.id),
    [activeWorkspace?.id, headlines]
  );
  const createdWorkspaceItems = useMemo(
    () => workspaceItems.filter((item) => item.workspaceId === activeWorkspace?.id),
    [activeWorkspace?.id, workspaceItems]
  );
  const availableBoards = useMemo(
    () =>
      workspaceBoards
        .filter((board) => board.workspaceId === activeWorkspace?.id)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [activeWorkspace?.id, workspaceBoards]
  );
  const activeBoard =
    availableBoards.find((board) => board.id === activeWorkspaceBoardId) || availableBoards[0] || null;
  const activeBoardDocument = activeBoard ? workspaceBoardDocuments[activeBoard.id] : undefined;
  const boardSessionsForBoard = useMemo(
    () =>
      boardAgentSessions
        .filter(
          (session) =>
            session.workspaceId === activeWorkspace?.id && session.boardId === activeBoard?.id
        )
        .sort((left, right) => right.updatedAt - left.updatedAt),
    [activeBoard?.id, activeWorkspace?.id, boardAgentSessions]
  );
  const visibleBoardAgentSession =
    boardSessionsForBoard.find((session) => session.id === boardAgentActiveSessionId) ||
    boardSessionsForBoard[0] ||
    null;
  const visibleBoardAgentActions = useMemo(
    () =>
      visibleBoardAgentSession
        ? [...(boardAgentActionsBySessionId[visibleBoardAgentSession.id] || [])].sort(
            (left, right) => right.createdAt - left.createdAt
          )
        : [],
    [boardAgentActionsBySessionId, visibleBoardAgentSession]
  );
  const boardAgentTodoItems = useMemo(
    () => deriveBoardAgentTodoItems(visibleBoardAgentActions),
    [visibleBoardAgentActions]
  );

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

  const libraryEntries = useMemo(() => {
    if (!activeWorkspace) return [];

    return buildWorkspaceLibraryEntries({
      workspaceId: activeWorkspace.id,
      artifacts: workspaceArtifacts,
      headlines: workspaceHeadlines,
      workspaceItems: createdWorkspaceItems,
    });
  }, [activeWorkspace, createdWorkspaceItems, workspaceArtifacts, workspaceHeadlines]);

  const libraryMap = useMemo(
    () => new Map(libraryEntries.map((entry) => [boardRefKey(entry), entry])),
    [libraryEntries]
  );

  const filteredEntries = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();
    return libraryEntries.filter((entry) => {
      if (!lowerSearch) return true;
      return (
        entry.title.toLowerCase().includes(lowerSearch) ||
        entry.searchText.toLowerCase().includes(lowerSearch)
      );
    });
  }, [libraryEntries, search]);

  const groupedEntries = useMemo(
    () => ({
      created: filteredEntries.filter((entry) =>
        ['NOTE', 'LINK', 'FILE', 'MEDIA', 'EXCERPT'].includes(entry.kind)
      ),
      artifacts: filteredEntries.filter((entry) => entry.kind === 'ARTIFACT'),
      entities: filteredEntries.filter((entry) => entry.kind === 'ENTITY'),
      sources: filteredEntries.filter((entry) => entry.kind === 'SOURCE'),
      signals: filteredEntries.filter((entry) => entry.kind === 'HEADLINE'),
    }),
    [filteredEntries]
  );

  const selectedArtifact = useMemo(() => {
    const first = selectedEntries.find((entry) => entry.refKind === 'ARTIFACT');
    return first ? workspaceArtifacts.find((artifact) => artifact.id === first.refId) || null : null;
  }, [selectedEntries, workspaceArtifacts]);

  const selectedHeadline = useMemo(() => {
    const first = selectedEntries.find((entry) => entry.refKind === 'HEADLINE');
    return first ? workspaceHeadlines.find((headline) => headline.id === first.refId) || null : null;
  }, [selectedEntries, workspaceHeadlines]);
  const selectedWorkspaceItem = useMemo(() => {
    const first = selectedEntries.find((entry) => entry.refKind === 'WORKSPACE_ITEM');
    return first ? createdWorkspaceItems.find((item) => item.id === first.refId) || null : null;
  }, [createdWorkspaceItems, selectedEntries]);
  const selectedPrimaryEntry = selectedEntries[0] || null;

  useEffect(() => {
    if (!activeWorkspace) return;
    if (availableBoards.length > 0) return;
    void ensureWorkspaceBoard(activeWorkspace.id);
  }, [activeWorkspace, availableBoards.length, ensureWorkspaceBoard]);

  useEffect(() => {
    if (!activeWorkspace || !availableBoards.length) return;
    if (activeBoard) return;
    setActiveWorkspaceBoardId(availableBoards[0].id);
  }, [activeBoard, activeWorkspace, availableBoards, setActiveWorkspaceBoardId]);

  useEffect(() => {
    if (!activeWorkspace || !activeBoard) return;
    if (!editorRef.current || !queuedBoardPlacement) return;
    if (queuedBoardPlacement.workspaceId !== activeWorkspace.id) return;
    if (queuedBoardPlacement.boardId && queuedBoardPlacement.boardId !== activeBoard.id) {
      setActiveWorkspaceBoardId(queuedBoardPlacement.boardId);
      return;
    }

    const queuedEntry = libraryMap.get(boardRefKey(queuedBoardPlacement.item));
    if (queuedEntry) {
      if (activeBoard.presentationMode) {
        if (queuedBoardPlacement.openInBoard && currentView !== AppView.WORKSPACE) {
          setCurrentView(AppView.WORKSPACE);
        }
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
      if (queuedBoardPlacement.openInBoard && currentView !== AppView.WORKSPACE) {
        setCurrentView(AppView.WORKSPACE);
      }
    }

    clearQueuedBoardPlacement();
  }, [
    addToast,
    activeBoard,
    activeWorkspace,
    clearQueuedBoardPlacement,
    currentView,
    libraryMap,
    queuedBoardPlacement,
    setActiveWorkspaceBoardId,
    setCurrentView,
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

  useEffect(
    () => () => {
      boardAgentAbortRef.current?.abort();
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    },
    []
  );

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

      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(async () => {
        await saveWorkspaceBoardDocument({
          boardId: activeBoard.id,
          snapshot: getSnapshot(editor.store) as unknown,
          updatedAt: Date.now(),
        });
      }, 550);
    },
    [activeBoard, saveWorkspaceBoardDocument]
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
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
        }
        editorRef.current = null;
      };
    },
    [activeBoard?.presentationMode, scheduleSave, syncSelection, themeMode]
  );

  const handleCreateBoard = async () => {
    if (!activeWorkspace) return;
    await createWorkspaceBoard({ workspaceId: activeWorkspace.id });
  };

  const handleDeleteBoard = async () => {
    if (!activeBoard || availableBoards.length <= 1) return;
    if (!window.confirm(`Delete "${activeBoard.name}"?`)) return;
    await deleteWorkspaceBoard(activeBoard.id);
  };

  const handleBoardNameSave = async (nextName: string) => {
    if (!activeBoard) return;
    await updateWorkspaceBoard(activeBoard.id, { name: nextName });
  };

  const handleWorkspaceChange = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId || null);
    setCurrentView(AppView.WORKSPACE);
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

  const toggleInspectorSection = (section: keyof typeof inspectorSections) => {
    setInspectorSections((current) => ({
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
              reader.onload = () =>
                resolve(typeof reader.result === 'string' ? reader.result : '');
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
      addToast(
        error instanceof Error ? error.message : 'Unable to draft a board note.',
        'ERROR'
      );
    } finally {
      setAiBusy(false);
    }
  };

  const persistCurrentBoardDocument = useCallback(async () => {
    if (!editorRef.current || !activeBoard) return;
    await saveWorkspaceBoardDocument({
      boardId: activeBoard.id,
      snapshot: getSnapshot(editorRef.current.store) as unknown,
      updatedAt: Date.now(),
    });
  }, [activeBoard, saveWorkspaceBoardDocument]);

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

  const handleDeleteCreatedItem = useCallback(
    async (entry: WorkspaceLibraryEntry) => {
      if (entry.refKind !== 'WORKSPACE_ITEM') return;
      if (!window.confirm(`Delete "${entry.title}" from the library?`)) return;

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
        launchContext: { headlineId: selectedHeadline.id },
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
  inspectorActions.push({
    id: 'board-open-timeline',
    label: 'Timeline',
    icon: Clock3,
    onClick: () => setCurrentView(AppView.TIMELINE),
  });
  inspectorActions.push({
    id: 'board-open-network',
    label: 'Network Graph',
    icon: Network,
    onClick: () => setCurrentView(AppView.NETWORK),
  });

  if (!activeWorkspace) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <EmptyState
          icon={Shapes}
          title="No Active Workspace"
          description="Open or create a workspace first. The research board mirrors the active workspace and keeps board composition tied to canonical Sherlock records."
          action={{
            label: 'Open Case Files',
            onClick: () => setCurrentView(AppView.ARCHIVES),
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-black text-zinc-100">
      <header className="osint-header-shadow sticky top-0 z-40 flex h-20 items-center justify-between border-b border-zinc-800 bg-black/95 px-6 backdrop-blur-md">
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
          <div className="hidden min-w-[220px] max-w-[280px] md:block">
            <OsintSelect
              ariaLabel="Select workspace"
              value={activeWorkspace.id}
              onChange={handleWorkspaceChange}
              triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono truncate"
              options={workspaces.map((workspace) => ({
                value: workspace.id,
                label: sanitizeDisplayTitle(workspace.title),
              }))}
            />
          </div>
          <div className="hidden min-w-[220px] max-w-[260px] md:block">
            <OsintSelect
              ariaLabel="Select board"
              value={activeBoard?.id || ''}
              onChange={(value) => setActiveWorkspaceBoardId(value || null)}
              triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono truncate"
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
                onClick={() => setCreateModal({ type: 'LINK', title: '', url: '', description: '' })}
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

          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
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
                onToggle={() =>
                  setLibrarySections((current) => ({
                    ...current,
                    [key]: !current[key],
                  }))
                }
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
          className={`absolute right-0 top-0 z-30 flex h-full flex-col overflow-hidden border-l border-zinc-800 bg-black/95 transition-all duration-200 xl:relative xl:translate-x-0 ${
            rightPanelOpen
              ? 'w-[min(24rem,calc(100vw-1rem))] translate-x-0'
              : 'w-[min(24rem,calc(100vw-1rem))] translate-x-full xl:w-0 xl:border-l-0'
          }`}
        >
          <div className="border-b border-zinc-800 bg-zinc-900/30 px-4 py-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
              Board Inspector
            </div>
            {activeBoard ? (
              <div className="mt-1 min-w-0">
                <EditableTitle
                  value={activeBoard.name}
                  onSave={(nextName) => void handleBoardNameSave(nextName)}
                  className="text-sm font-bold uppercase tracking-widest text-osint-ink"
                  inputClassName="text-sm font-bold uppercase tracking-widest text-osint-ink"
                />
              </div>
            ) : (
              <div className="mt-1 text-sm font-bold uppercase tracking-widest text-osint-ink">
                Workspace Board
              </div>
            )}
          </div>

          {inspectorActions.length > 0 && (
            <div className="border-b border-zinc-800 bg-zinc-900/10 px-4 py-3">
              <InspectorActionRow actions={inspectorActions} />
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
                        <div className="mt-2 text-xs leading-5 text-zinc-400">
                          {entry.description}
                        </div>
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
                <div className="border border-zinc-800 bg-zinc-900/30 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                    Board Agent
                  </div>
                  <textarea
                    value={boardAgentPrompt}
                    onChange={(event) => setBoardAgentPrompt(event.target.value)}
                    placeholder="Organize the visible cluster, add a note for the contradiction, and review the region for missing evidence."
                    className="mt-3 min-h-28 w-full resize-y border border-zinc-700 bg-black px-3 py-2 text-sm leading-6 text-zinc-100 outline-none transition focus:border-osint-primary"
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => void handleRunBoardAgent()}
                      disabled={boardAgentBusy || !boardAgentPrompt.trim()}
                      className="osint-button-primary inline-flex flex-1 items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Bot className="h-4 w-4" />
                      {boardAgentBusy ? 'Running Agent' : 'Run Board Agent'}
                    </button>
                    <button
                      onClick={handleCancelBoardAgent}
                      disabled={!boardAgentBusy}
                      className="inline-flex items-center justify-center gap-2 border border-zinc-700 px-3 py-2 text-xs font-mono uppercase text-zinc-300 transition hover:border-red-400/60 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </div>
                  {visibleBoardAgentSession && (
                    <div className="mt-3 border border-zinc-800 bg-black/40 p-3 text-[11px] font-mono text-zinc-400">
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate text-zinc-200">
                          {visibleBoardAgentSession.title}
                        </div>
                        <div className="uppercase tracking-[0.16em] text-zinc-500">
                          {visibleBoardAgentSession.status}
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                        {visibleBoardAgentSession.provider || 'Provider pending'}
                        {visibleBoardAgentSession.modelId
                          ? ` • ${visibleBoardAgentSession.modelId}`
                          : ''}
                      </div>
                    </div>
                  )}
                  {boardAgentMessage && (
                    <div className="mt-3 border border-zinc-800 bg-black/40 p-3 text-xs leading-6 text-zinc-300">
                      {boardAgentMessage}
                    </div>
                  )}
                  {boardAgentTodoItems.length > 0 && (
                    <div className="mt-3 border border-zinc-800 bg-black/40 p-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                        Current Todo
                      </div>
                      <div className="mt-2 space-y-2">
                        {boardAgentTodoItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-3 text-xs text-zinc-300"
                          >
                            <div>{item.text}</div>
                            <div className="shrink-0 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
                              {item.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {visibleBoardAgentActions.length > 0 && (
                    <div className="mt-3 border border-zinc-800 bg-black/40 p-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                        Recent Actions
                      </div>
                      <div className="mt-2 space-y-2">
                        {visibleBoardAgentActions.slice(0, 8).map((action) => (
                          <div
                            key={action.id}
                            className="border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-300"
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
                              <div className="mt-2 text-[11px] leading-5 text-red-300">
                                {action.error}
                              </div>
                            )}
                            {!action.error && action.result && (
                              <div className="mt-2 text-[11px] leading-5 text-zinc-500">
                                {JSON.stringify(action.result)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-zinc-800 bg-zinc-900/20 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                    Manual Helpers
                  </div>
                  <div className="mt-3 space-y-3">
                    <button
                      onClick={() => void handleGenerateSummary()}
                      disabled={selectedEntries.length === 0 || aiBusy}
                      className="osint-button-primary inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Sparkles className="h-4 w-4" />
                      Summarize Selection
                    </button>
                    <button
                      onClick={() => void handleGenerateNote()}
                      disabled={
                        selectedEntries.length === 0 || aiBusy || !!activeBoard?.presentationMode
                      }
                      className="osint-button-primary inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Bot className="h-4 w-4" />
                      Draft Note Card
                    </button>
                  </div>
                  {aiSummary && (
                    <div className="mt-3 border border-zinc-800 bg-black/40 p-3 text-xs leading-6 text-zinc-300">
                      {aiSummary}
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-mono leading-5 text-zinc-500">
                  Board-agent runs are logged per board session, and autonomous continuation only
                  happens when the model emits an explicit follow-up or review action.
                </p>
                <p className="text-[10px] font-mono leading-5 text-zinc-500">
                  Manual helpers remain available for fast note drafting when you do not want a
                  multi-step board pass.
                </p>
                <p className="text-[10px] font-mono leading-5 text-zinc-500">
                  AI changes stay inspectable. Sherlock records the requested action, normalized
                  payload, result, and any failure instead of hiding board writes behind a single
                  summary.
                </p>
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
                      <div className="mt-1">
                        {selectedWorkspaceItem.provenance?.source || 'USER'}
                      </div>
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
                        <div className="mt-1">
                          {selectedWorkspaceItem.provenance.sourceSessionId}
                        </div>
                      </div>
                    )}
                    {selectedWorkspaceItem.provenance?.sourceMessageId && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Message</div>
                        <div className="mt-1">
                          {selectedWorkspaceItem.provenance.sourceMessageId}
                        </div>
                      </div>
                    )}
                    {selectedWorkspaceItem.provenance?.sourceReportId && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Source Report</div>
                        <div className="mt-1">
                          {selectedWorkspaceItem.provenance.sourceReportId}
                        </div>
                      </div>
                    )}
                    {selectedWorkspaceItem.provenance?.sourceHeadlineId && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Source Signal</div>
                        <div className="mt-1">
                          {selectedWorkspaceItem.provenance.sourceHeadlineId}
                        </div>
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
    </div>
  );
};
