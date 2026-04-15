import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Editor } from 'tldraw';

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
} from '@/app/routes';
import { useWorkspaceBoardFeatureState } from '@/store/selectors/workspaceBoardSelectors';
import {
  boardRefKey,
  type WorkspaceLibraryEntry,
} from '@/services/workspace/library';
import {
  buildBoardCardSpec,
  findBoardShapeIdsForReference,
  placeStandaloneIconOnBoard,
} from '../../../services/workspace/boardShapes';
import { buildArtifactPackageEntries } from '@/services/workspace/artifactBoard';
import {
  LEFT_PANEL_SECTION_SCROLL_CLASS,
  placeEntryOnBoard,
  type RightPanelView,
} from './workspaceBoardUtils';
import { buildWorkspaceBoardViewModel } from './workspaceBoardViewModel';
import { useBoardCanvasPersistence } from './useBoardCanvasPersistence';
import { runWorkspaceBoardAgentTurn } from './workspaceBoardAgent';
import {
  getBoardAgentReviewDefaultSelection,
  isBoardAgentLowRiskOrganizationActionType,
} from '@/services/workspace/agent';
import type {
  BoardAgentReviewDecision,
  BoardAgentReviewRequest,
} from '@/services/workspace/agent';
import { useWorkspaceDocumentUpload } from '@/components/features/shared/useWorkspaceDocumentUpload';
import { useWorkspaceBoardLibraryState } from './useWorkspaceBoardLibraryState';
import { useWorkspaceBoardInspectorState } from './useWorkspaceBoardInspectorState';
export interface BoardAgentReviewState {
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

const PACKAGE_GUTTER_X = 32;
const PACKAGE_GUTTER_Y = 32;
const PACKAGE_STACK_GAP = 96;

const getBoardContentBounds = (editor: Editor) => {
  const bounds = editor
    .getCurrentPageShapes()
    .map((shape) => editor.getShapePageBounds(shape.id as never))
    .filter((entry): entry is NonNullable<typeof entry> => !!entry);

  if (bounds.length === 0) return null;

  return {
    minX: Math.min(...bounds.map((entry) => entry.x)),
    maxY: Math.max(...bounds.map((entry) => entry.y + entry.h)),
  };
};

const resolveArtifactPackageOrigin = (editor: Editor) => {
  const viewport = editor.getViewportPageBounds();
  const existingBounds = getBoardContentBounds(editor);

  if (!existingBounds) {
    return {
      x: viewport.x + 48,
      y: viewport.y + 48,
    };
  }

  return {
    x: existingBounds.minX,
    y: existingBounds.maxY + PACKAGE_STACK_GAP,
  };
};

const placeEntryGrid = (input: {
  editor: Editor;
  entries: WorkspaceLibraryEntry[];
  maxColumns: number;
  startX: number;
  startY: number;
  themeMode: 'dark' | 'light';
}) => {
  if (input.entries.length === 0) {
    return {
      height: 0,
      shapeIds: [] as string[],
      width: 0,
    };
  }

  const firstCard = buildBoardCardSpec(input.entries[0]);
  const columns = Math.max(1, Math.min(input.maxColumns, input.entries.length));
  const shapeIds: string[] = [];

  input.entries.forEach((entry, index) => {
    const card = buildBoardCardSpec(entry);
    const column = index % columns;
    const row = Math.floor(index / columns);
    const placed = placeEntryOnBoard(
      input.editor,
      entry,
      input.startX + column * (card.w + PACKAGE_GUTTER_X),
      input.startY + row * (card.h + PACKAGE_GUTTER_Y),
      input.themeMode
    );
    shapeIds.push(placed.shapeId as string);
  });

  const rows = Math.ceil(input.entries.length / columns);

  return {
    width: columns * firstCard.w + (columns - 1) * PACKAGE_GUTTER_X,
    height: rows * firstCard.h + (rows - 1) * PACKAGE_GUTTER_Y,
    shapeIds,
  };
};

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
  const [selectedEntries, setSelectedEntries] = useState<WorkspaceLibraryEntry[]>([]);
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
  const autoPlacementRef = useRef<{ boardId: string | null; index: number }>({
    boardId: null,
    index: 0,
  });
  const {
    closeUploadDialog,
    confirmUploadDialog,
    fileInputRef,
    handleFileUpload,
    setUploadArtifactType,
    setUploadRoute,
    setUploadTargetWorkspaceId,
    uploadDialogState,
    uploadInFlight,
  } = useWorkspaceDocumentUpload({
    addToast,
    createWorkspaceItem,
    initialWorkspaceId: activeWorkspaceId,
    saveArtifact,
    source: 'BOARD',
    workspaces,
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

  const copyToClipboard = useCallback(
    async (value: string, successMessage: string) => {
      await navigator.clipboard.writeText(value);
      addToast(successMessage, 'SUCCESS');
    },
    [addToast]
  );

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

  const handleAddBoardIcon = useCallback(
    (iconId: string) => {
      if (!editorRef.current || !activeBoard) return;
      if (activeBoard.presentationMode) {
        addToast('Disable presentation mode before editing this board.', 'INFO');
        return;
      }

      const viewport = editorRef.current.getViewportPageBounds();
      const iconSize = 56;
      const slotWidth = iconSize + 40;
      const slotHeight = iconSize + 40;
      const usableWidth = Math.max(slotWidth, viewport.w - 96);
      const columns = Math.max(1, Math.floor(usableWidth / slotWidth));
      const placementIndex = autoPlacementRef.current.index;
      const autoPosition = {
        x: viewport.x + 48 + (placementIndex % columns) * slotWidth,
        y: viewport.y + 48 + Math.floor(placementIndex / columns) * slotHeight,
      };

      autoPlacementRef.current = {
        boardId: activeBoard.id,
        index: placementIndex + 1,
      };

      placeStandaloneIconOnBoard(editorRef.current, {
        iconId,
        themeMode,
        x: autoPosition.x,
        y: autoPosition.y,
      });
    },
    [activeBoard, addToast, editorRef, themeMode]
  );

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

  const handleAddArtifactPackage = useCallback(
    (entry: WorkspaceLibraryEntry) => {
      if (!editorRef.current || !activeBoard || !activeWorkspace) return;
      if (entry.refKind !== 'ARTIFACT') return;
      if (activeBoard.presentationMode) {
        addToast('Disable presentation mode before editing this board.', 'INFO');
        return;
      }

      const artifact = workspaceArtifacts.find(
        (candidate): candidate is Artifact & { id: string; workspaceId: string } =>
          candidate.id === entry.refId &&
          candidate.workspaceId === activeWorkspace.id
      );
      if (!artifact) {
        addToast('Artifact package could not be resolved from the current workspace.', 'ERROR');
        return;
      }

      const packageEntries = buildArtifactPackageEntries({
        artifact,
        libraryMap,
        workspaceSignals: workspaceHeadlines,
      });
      if (!packageEntries) {
        addToast('Artifact package could not be assembled for board placement.', 'ERROR');
        return;
      }

      const origin = resolveArtifactPackageOrigin(editorRef.current);
      const placedArtifact = placeEntryOnBoard(
        editorRef.current,
        packageEntries.artifactEntry,
        origin.x,
        origin.y,
        themeMode
      );

      const artifactCard = placedArtifact.card;
      const artifactBounds = editorRef.current.getShapePageBounds(placedArtifact.shapeId as never);
      const artifactRight = artifactBounds ? artifactBounds.x + artifactBounds.w : origin.x + artifactCard.w;
      const artifactBottom =
        artifactBounds ? artifactBounds.y + artifactBounds.h : origin.y + artifactCard.h;
      const rightColumnX = artifactRight + 128;
      let rightColumnY = origin.y + 48;
      const lowerLeftY = artifactBottom + 80;
      const findingBlock = placeEntryGrid({
        editor: editorRef.current,
        entries: packageEntries.findingEntries,
        maxColumns: 2,
        startX: rightColumnX,
        startY: rightColumnY,
        themeMode,
      });
      rightColumnY += findingBlock.height > 0 ? findingBlock.height + PACKAGE_GUTTER_Y : 0;

      const entityBlock = placeEntryGrid({
        editor: editorRef.current,
        entries: packageEntries.entityEntries,
        maxColumns: 2,
        startX: rightColumnX,
        startY: rightColumnY,
        themeMode,
      });
      rightColumnY += entityBlock.height > 0 ? entityBlock.height + PACKAGE_GUTTER_Y : 0;

      placeEntryGrid({
        editor: editorRef.current,
        entries: packageEntries.sourceEntries,
        maxColumns: 3,
        startX: origin.x,
        startY: lowerLeftY,
        themeMode,
      });
      const rightColumnSignalsY =
        rightColumnY + (entityBlock.height > 0 ? PACKAGE_GUTTER_Y : 0);

      placeEntryGrid({
        editor: editorRef.current,
        entries: packageEntries.signalEntries,
        maxColumns: 3,
        startX: rightColumnX,
        startY: rightColumnSignalsY,
        themeMode,
      });
      editorRef.current.setSelectedShapes([placedArtifact.shapeId as never]);
    },
    [
      activeBoard,
      activeWorkspace,
      addToast,
      editorRef,
      libraryMap,
      themeMode,
      workspaceArtifacts,
      workspaceHeadlines,
    ]
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

  const {
    confirmDeleteCreatedItem,
    createModal,
    handleDeleteCreatedItem,
    handleSubmitCreateModal,
    libraryItemPendingDeletion,
    libraryItemSections,
    librarySections,
    setCreateModal,
    setLibraryItemPendingDeletion,
    toggleLibraryEntrySection,
    toggleLibrarySection,
  } = useWorkspaceBoardLibraryState({
    activeWorkspace,
    addToast,
    createWorkspaceItem,
    deleteWorkspaceItem,
    editorRef,
    handleDropEntry,
  });

  const {
    handleGenerateNote,
    handleGenerateSummary,
    inspectorActions,
    inspectorSections,
    toggleInspectorSection,
  } = useWorkspaceBoardInspectorState({
    activeBoard,
    activeWorkspace,
    addToast,
    createWorkspaceItem,
    handleDropEntry,
    navigate,
    onOpenChat,
    onOpenReport,
    persistCurrentBoardDocument,
    setAiBusy,
    setAiSummary,
    selectedArtifact,
    selectedEntries,
    selectedHeadline,
    selectedPrimaryEntry,
    selectedWorkspaceItem,
    workspaceArtifacts,
    workspaceHeadlines,
  });

  const toggleAgentSection = (section: keyof typeof agentSections) => {
    setAgentSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
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
    boardSessionsForBoard,
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
    handleAddArtifactPackage,
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
    handleAddBoardIcon,
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
    rightPanelView,
    search,
    selectedArtifact,
    selectedEntries,
    selectedHeadline,
    selectedPrimaryEntry,
    selectedWorkspaceItem,
    setUploadArtifactType,
    setUploadRoute,
    setUploadTargetWorkspaceId,
    setBoardAgentAutoApproveOrganizationActions:
      handleBoardAgentAutoApproveOrganizationActionsChange,
    setBoardAgentActiveSessionId,
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
    uploadDialogState,
    uploadInFlight,
    updateWorkspaceBoard,
    visibleBoardAgentActions,
    visibleBoardAgentSession,
    workspaceArtifacts,
    workspaceHeadlines,
    workspaceBoards,
    workspaceItems,
    workspaces,
    closeUploadDialog,
    confirmUploadDialog,
    copyToClipboard,
    LEFT_PANEL_SECTION_SCROLL_CLASS,
  };
};
