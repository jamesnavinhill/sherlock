import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import type {
  Artifact,
  ChatOpenRequest,
  InvestigationLaunchRequest,
  WorkspaceBoardItemReference,
} from '@/types';
import {
  buildFilesPath,
  buildWorkspaceBoardDocumentPath,
  buildWorkspaceBoardPath,
  buildWorkspaceNetworkPath,
  buildWorkspaceTimelinePath,
} from '@/app/routes';
import { useWorkspaceBoardFeatureState } from '@/store/selectors/featureSelectors';
import {
  boardRefKey,
  buildSingleWorkspaceItemEntry,
  type WorkspaceLibraryEntry,
} from '@/services/workspace/library';
import {
  BOARD_REF_META_KEY,
  buildBoardCardSpec,
  findBoardShapeIdsForReference,
  parseBoardReference,
} from '../../../services/workspace/boardShapes';
import {
  LEFT_PANEL_SECTION_SCROLL_CLASS,
  placeEntryOnBoard,
  type CreateModalState,
  type RightPanelView,
} from './workspaceBoardUtils';
import { buildWorkspaceBoardViewModel } from './workspaceBoardViewModel';
import { buildBoardInspectorActions } from './boardInspectorActions';
import { useBoardCanvasPersistence } from './useBoardCanvasPersistence';
import {
  buildWorkspaceItemFromCreateModal,
  createWorkspaceSelectionNote,
  generateWorkspaceSelectionSummary,
  ingestWorkspaceFiles,
} from './workspaceBoardItemActions';
import { runWorkspaceBoardAgentTurn } from './workspaceBoardAgent';
import {
  getBoardAgentReviewDefaultSelection,
  isBoardAgentLowRiskOrganizationActionType,
} from '@/services/workspace/agent';
import type {
  BoardAgentReviewDecision,
  BoardAgentReviewRequest,
} from '@/services/workspace/agent';

interface BoardAgentReviewState {
  sessionId: string;
  passIndex: number;
  actionIds: string[];
  message: string;
  phase: 'REVIEW' | 'EXECUTING' | 'COMPLETE' | 'CANCELLED';
}

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
    appendSectionToArtifact,
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
  } = useWorkspaceBoardFeatureState();

  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [createModal, setCreateModal] = useState<CreateModalState>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [boardAgentBusy, setBoardAgentBusy] = useState(false);
  const [boardAgentAutoApproveOrganizationActions, setBoardAgentAutoApproveOrganizationActions] =
    useState(false);
  const [boardAgentPrompt, setBoardAgentPrompt] = useState('');
  const [boardAgentMessage, setBoardAgentMessage] = useState<string | null>(null);
  const [boardAgentActiveSessionId, setBoardAgentActiveSessionId] = useState<string | null>(null);
  const [boardAgentReviewState, setBoardAgentReviewState] = useState<BoardAgentReviewState | null>(
    null
  );
  const [boardAgentReviewSelections, setBoardAgentReviewSelections] = useState<
    Record<string, boolean>
  >({});
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
    selection: false,
    aiActions: false,
    provenance: false,
  });
  const [agentSections, setAgentSections] = useState({
    context: false,
    session: false,
    actions: false,
  });
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>('AGENT');
  const boardAgentAbortRef = useRef<AbortController | null>(null);
  const boardAgentReviewResolveRef = useRef<((decision: BoardAgentReviewDecision) => void) | null>(
    null
  );
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

  const boardAgentReviewActions = useMemo(() => {
    if (!boardAgentReviewState) return [];
    const sessionActions = boardAgentActionsBySessionId[boardAgentReviewState.sessionId] || [];
    const actionMap = new Map(sessionActions.map((action) => [action.id, action]));

    return boardAgentReviewState.actionIds
      .map((actionId) => actionMap.get(actionId))
      .filter((action): action is NonNullable<typeof action> => !!action);
  }, [boardAgentActionsBySessionId, boardAgentReviewState]);

  const rightPanelTabButtonClass = (view: RightPanelView) =>
    `inline-flex h-9 flex-1 items-center justify-center border px-4 text-xs font-mono uppercase transition ${
      rightPanelView === view
        ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
        : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
    }`;

  const { editorRef, handleEditorMount, hydratedSnapshot, persistCurrentBoardDocument } =
    useBoardCanvasPersistence({
      activeBoard,
      activeBoardDocument,
      addToast,
      libraryMap,
      saveWorkspaceBoardDocument,
      setAiSummary,
      setSelectedEntries,
      themeMode,
    });

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
      if (queuedBoardPlacement.mode === 'FOCUS_OR_PLACE') {
        const matchingShapeIds = findBoardShapeIdsForReference(
          editorRef.current.getCurrentPageShapes(),
          queuedBoardPlacement.item
        );

        if (matchingShapeIds.length > 0) {
          const focusBounds = matchingShapeIds
            .map((shapeId) => editorRef.current?.getShapePageBounds(shapeId as never))
            .filter((entry): entry is NonNullable<typeof entry> => !!entry);

          editorRef.current.setSelectedShapes(matchingShapeIds as never);
          if (focusBounds.length > 0) {
            const minX = Math.min(...focusBounds.map((entry) => entry.x));
            const minY = Math.min(...focusBounds.map((entry) => entry.y));
            const maxX = Math.max(...focusBounds.map((entry) => entry.x + entry.w));
            const maxY = Math.max(...focusBounds.map((entry) => entry.y + entry.h));

            editorRef.current.zoomToBounds(
              {
                x: minX,
                y: minY,
                w: maxX - minX,
                h: maxY - minY,
              },
              { targetZoom: 1, animation: { duration: 180 } }
            );
          }

          clearQueuedBoardPlacement();
          return;
        }
      }

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
    editorRef,
    libraryMap,
    navigate,
    queuedBoardPlacement,
    themeMode,
  ]);

  useEffect(() => {
    setBoardAgentActiveSessionId(null);
    setBoardAgentMessage(null);
    setBoardAgentReviewState(null);
    setBoardAgentReviewSelections({});
    boardAgentReviewResolveRef.current = null;
  }, [activeBoard?.id, activeWorkspace?.id]);

  useEffect(() => {
    if (boardAgentBusy) return;
    const latestSessionMessage =
      typeof visibleBoardAgentSession?.metadata?.latestMessage === 'string'
        ? visibleBoardAgentSession.metadata.latestMessage
        : null;
    setBoardAgentMessage(latestSessionMessage);
  }, [boardAgentBusy, visibleBoardAgentSession]);

  useEffect(
    () => () => {
      boardAgentAbortRef.current?.abort();
      boardAgentReviewResolveRef.current?.({
        approvedActionIds: [],
        cancelled: true,
      });
      boardAgentReviewResolveRef.current = null;
      void persistCurrentBoardDocument();
    },
    [persistCurrentBoardDocument]
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
    [activeBoard, addToast, editorRef, themeMode]
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

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!activeWorkspace) return;
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    await ingestWorkspaceFiles({
      createWorkspaceItem,
      files,
      workspaceId: activeWorkspace.id,
    });

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
      const result = await generateWorkspaceSelectionSummary({
        workspace: activeWorkspace,
        artifacts: workspaceArtifacts,
        headlines: workspaceHeadlines,
        selectedEntries,
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
      const noteItem = await createWorkspaceSelectionNote({
        activeBoard,
        createWorkspaceItem,
        selectedEntries,
        workspace: activeWorkspace,
        workspaceArtifacts,
        workspaceHeadlines,
      });
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
    setBoardAgentReviewState((current) =>
      current
        ? {
            ...current,
            phase: 'CANCELLED',
          }
        : current
    );
    boardAgentReviewResolveRef.current?.({
      approvedActionIds: [],
      cancelled: true,
    });
    boardAgentReviewResolveRef.current = null;
  }, []);

  const requestBoardAgentReview = useCallback(
    async (request: BoardAgentReviewRequest) =>
      await new Promise<BoardAgentReviewDecision>((resolve) => {
        boardAgentReviewResolveRef.current = resolve;
        setRightPanelOpen(true);
        setRightPanelView('AGENT');
        setAgentSections((current) => ({
          ...current,
          actions: true,
          session: true,
        }));
        setBoardAgentReviewSelections(
          Object.fromEntries(
            request.actions.map((action) => [
              action.id,
              request.defaultSelectedActionIds.includes(action.id),
            ])
          )
        );
        setBoardAgentReviewState({
          sessionId: request.session.id,
          passIndex: request.passIndex,
          actionIds: request.actions.map((action) => action.id),
          message: request.message,
          phase: 'REVIEW',
        });
      }),
    []
  );

  const handleBoardAgentReviewSelectionChange = useCallback(
    (actionId: string, selected: boolean) => {
      setBoardAgentReviewSelections((current) => ({
        ...current,
        [actionId]: selected,
      }));
    },
    []
  );

  const handleBoardAgentAutoApproveOrganizationActionsChange = useCallback(
    (value: boolean) => {
      setBoardAgentAutoApproveOrganizationActions(value);
      if (!boardAgentReviewState || boardAgentReviewState.phase !== 'REVIEW') {
        return;
      }

      setBoardAgentReviewSelections((current) => {
        const next = { ...current };
        for (const action of boardAgentReviewActions) {
          if (!isBoardAgentLowRiskOrganizationActionType(action.type)) continue;
          next[action.id] = getBoardAgentReviewDefaultSelection(action.type, value);
        }
        return next;
      });
    },
    [boardAgentReviewActions, boardAgentReviewState]
  );

  const handleApproveBoardAgentPlan = useCallback(() => {
    if (!boardAgentReviewState || !boardAgentReviewResolveRef.current) return;

    const approvedActionIds = boardAgentReviewState.actionIds.filter(
      (actionId) => boardAgentReviewSelections[actionId]
    );
    const skippedActionIds = boardAgentReviewState.actionIds.filter(
      (actionId) => !boardAgentReviewSelections[actionId]
    );

    setBoardAgentReviewState((current) =>
      current
        ? {
            ...current,
            phase: 'EXECUTING',
          }
        : current
    );

    const resolve = boardAgentReviewResolveRef.current;
    boardAgentReviewResolveRef.current = null;
    resolve({
      approvedActionIds,
      skippedActionIds,
    });
  }, [boardAgentReviewSelections, boardAgentReviewState]);

  const handleSkipBoardAgentPlan = useCallback(() => {
    if (!boardAgentReviewState || !boardAgentReviewResolveRef.current) return;

    setBoardAgentReviewSelections(
      Object.fromEntries(boardAgentReviewState.actionIds.map((actionId) => [actionId, false]))
    );
    setBoardAgentReviewState((current) =>
      current
        ? {
            ...current,
            phase: 'EXECUTING',
          }
        : current
    );

    const resolve = boardAgentReviewResolveRef.current;
    boardAgentReviewResolveRef.current = null;
    resolve({
      approvedActionIds: [],
      skippedActionIds: [...boardAgentReviewState.actionIds],
    });
  }, [boardAgentReviewState]);

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
    setBoardAgentReviewState(null);
    setBoardAgentReviewSelections({});

    try {
      const result = await runWorkspaceBoardAgentTurn({
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
        recentActions: boardSessionsForBoard
          .flatMap((session) => boardAgentActionsBySessionId[session.id] || [])
          .sort((left, right) => right.createdAt - left.createdAt)
          .slice(0, 24),
        signal: abortController.signal,
        autoApproveOrganizationActions: boardAgentAutoApproveOrganizationActions,
        createBoardAgentSession,
        updateBoardAgentSession,
        addBoardAgentAction,
        updateBoardAgentAction,
        persistBoardDocument: persistCurrentBoardDocument,
        createWorkspaceItem,
        saveArtifact,
        appendSectionToArtifact,
        requestReview: requestBoardAgentReview,
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

      if (result.status === 'BLOCKED') {
        addToast(result.message, 'INFO');
        return;
      }

      setBoardAgentActiveSessionId(result.session.id);
      setBoardAgentMessage(result.message || null);
      setBoardAgentReviewState((current) =>
        current && current.sessionId === result.session.id
          ? {
              ...current,
              phase: result.status === 'CANCELLED' ? 'CANCELLED' : 'COMPLETE',
            }
          : current
      );

      if (result.status === 'FAILED') {
        addToast(result.session.lastError || 'Board-agent run failed.', 'ERROR');
      } else if (result.status === 'CANCELLED') {
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
      boardAgentReviewResolveRef.current = null;
      setBoardAgentBusy(false);
    }
  }, [
    activeBoard,
    activeBoardDocument,
    activeWorkspace,
    addBoardAgentAction,
    addToast,
    appendSectionToArtifact,
    boardAgentAutoApproveOrganizationActions,
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
    editorRef,
    requestBoardAgentReview,
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
    [addToast, deleteWorkspaceItem, editorRef]
  );

  const handleDeleteCreatedItem = useCallback((entry: WorkspaceLibraryEntry) => {
    if (entry.refKind !== 'WORKSPACE_ITEM') return;
    setLibraryItemPendingDeletion(entry);
  }, []);

  const handleOpenSelectedChat = useCallback(() => {
    if (!activeWorkspace) return;

    if (selectedArtifact?.id) {
      onOpenChat({
        workspaceId: activeWorkspace.id,
        launchContext: { sourceArtifactId: selectedArtifact.id },
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
  }, [activeWorkspace, onOpenChat, selectedArtifact, selectedEntries, selectedHeadline]);

  const inspectorActions = useMemo(
    () =>
      buildBoardInspectorActions({
        activeWorkspaceId: activeWorkspace?.id,
        onNavigateNetwork: async () => {
          if (!activeWorkspace) return;
          await persistCurrentBoardDocument();
          navigate(buildWorkspaceNetworkPath(activeWorkspace.id));
        },
        onNavigateTimeline: async () => {
          if (!activeWorkspace) return;
          await persistCurrentBoardDocument();
          navigate(buildWorkspaceTimelinePath(activeWorkspace.id));
        },
        onOpenChat,
        onOpenReport,
        onOpenSelectedChat: handleOpenSelectedChat,
        selectedArtifact,
        selectedEntries,
        selectedPrimaryEntry,
        selectedWorkspaceItem,
        workspaceArtifacts,
      }),
    [
      activeWorkspace,
      handleOpenSelectedChat,
      navigate,
      onOpenChat,
      onOpenReport,
      persistCurrentBoardDocument,
      selectedArtifact,
      selectedEntries,
      selectedPrimaryEntry,
      selectedWorkspaceItem,
      workspaceArtifacts,
    ]
  );

  return {
    activeBoard,
    activeBoardDocument,
    activeWorkspace,
    aiBusy,
    aiSummary,
    agentSections,
    availableBoards,
    boardAgentActiveSessionId,
    boardAgentAutoApproveOrganizationActions,
    boardAgentBusy,
    boardAgentMessage,
    boardAgentPrompt,
    boardAgentReviewActions,
    boardAgentReviewSelections,
    boardAgentReviewState,
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
    handleBoardAgentReviewSelectionChange,
    handleApproveBoardAgentPlan,
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
    handleSkipBoardAgentPlan,
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
    setBoardAgentAutoApproveOrganizationActions:
      handleBoardAgentAutoApproveOrganizationActionsChange,
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
