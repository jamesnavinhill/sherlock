import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MutableRefObject } from 'react';
import type { Editor } from 'tldraw';

import type {
  Artifact,
  ArtifactSection,
  BoardAgentAction,
  BoardAgentSession,
  Headline,
  InvestigationLaunchRequest,
  Workspace,
  WorkspaceBoard,
  WorkspaceBoardDocument,
  WorkspaceItem,
} from '@/types';
import { runWorkspaceBoardAgentTurn } from './workspaceBoardAgent';
import {
  getBoardAgentReviewDefaultSelection,
  isBoardAgentLowRiskOrganizationActionType,
} from '@/services/workspace/agent';
import type {
  BoardAgentReviewDecision,
  BoardAgentReviewRequest,
} from '@/services/workspace/agent';

export interface BoardAgentReviewState {
  sessionId: string;
  passIndex: number;
  actionIds: string[];
  message: string;
  phase: 'REVIEW' | 'EXECUTING' | 'COMPLETE' | 'CANCELLED';
}

interface UseWorkspaceBoardAgentStateInput {
  activeBoard: WorkspaceBoard | null;
  activeBoardDocument: WorkspaceBoardDocument | null;
  activeWorkspace: Workspace | null;
  addBoardAgentAction: (action: BoardAgentAction) => Promise<void>;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  appendSectionToArtifact: (artifactId: string, section: ArtifactSection) => Promise<void>;
  boardAgentActiveSessionId: string | null;
  boardAgentActionsBySessionId: Record<string, BoardAgentAction[]>;
  boardSessionsForBoard: BoardAgentSession[];
  createBoardAgentSession: (input: {
    workspaceId: string;
    boardId: string;
    title?: string;
    request: string;
    provider?: BoardAgentSession['provider'];
    modelId?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<BoardAgentSession>;
  createWorkspaceItem: (item: WorkspaceItem) => Promise<unknown>;
  createdWorkspaceItems: WorkspaceItem[];
  editorRef: MutableRefObject<Editor | null>;
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
  openAgentPanel: () => void;
  persistCurrentBoardDocument: () => Promise<void>;
  saveArtifact: (
    artifact: Artifact,
    parentContext?: { topic: string; summary: string }
  ) => Promise<Artifact>;
  themeMode: 'dark' | 'light';
  updateBoardAgentAction: (
    actionId: string,
    sessionId: string,
    patch: Partial<
      Omit<BoardAgentAction, 'id' | 'sessionId' | 'workspaceId' | 'boardId' | 'createdAt'>
    >
  ) => Promise<void>;
  updateBoardAgentSession: (
    sessionId: string,
    patch: Partial<Omit<BoardAgentSession, 'id' | 'workspaceId' | 'boardId' | 'createdAt'>>
  ) => Promise<void>;
  visibleBoardAgentSession: BoardAgentSession | null;
  workspaceArtifacts: Artifact[];
  workspaceHeadlines: Headline[];
  setBoardAgentActiveSessionId: (value: string | null) => void;
}

export const useWorkspaceBoardAgentState = ({
  activeBoard,
  activeBoardDocument,
  activeWorkspace,
  addBoardAgentAction,
  addToast,
  appendSectionToArtifact,
  boardAgentActiveSessionId,
  boardAgentActionsBySessionId,
  boardSessionsForBoard,
  createBoardAgentSession,
  createWorkspaceItem,
  createdWorkspaceItems,
  editorRef,
  onLaunchInvestigation,
  openAgentPanel,
  persistCurrentBoardDocument,
  saveArtifact,
  themeMode,
  updateBoardAgentAction,
  updateBoardAgentSession,
  visibleBoardAgentSession,
  workspaceArtifacts,
  workspaceHeadlines,
  setBoardAgentActiveSessionId,
}: UseWorkspaceBoardAgentStateInput) => {
  const [agentSections, setAgentSections] = useState({
    context: false,
    session: false,
    actions: false,
  });
  const [boardAgentBusy, setBoardAgentBusy] = useState(false);
  const [boardAgentAutoApproveOrganizationActions, setBoardAgentAutoApproveOrganizationActions] =
    useState(false);
  const [boardAgentPrompt, setBoardAgentPrompt] = useState('');
  const [boardAgentMessage, setBoardAgentMessage] = useState<string | null>(null);
  const [boardAgentReviewState, setBoardAgentReviewState] = useState<BoardAgentReviewState | null>(
    null
  );
  const [boardAgentReviewSelections, setBoardAgentReviewSelections] = useState<
    Record<string, boolean>
  >({});
  const boardAgentAbortRef = useRef<AbortController | null>(null);
  const boardAgentReviewResolveRef = useRef<((decision: BoardAgentReviewDecision) => void) | null>(
    null
  );

  const boardAgentReviewActions = useMemo(() => {
    if (!boardAgentReviewState) return [];
    const sessionActions = boardAgentActionsBySessionId[boardAgentReviewState.sessionId] || [];
    const actionMap = new Map(sessionActions.map((action) => [action.id, action]));

    return boardAgentReviewState.actionIds
      .map((actionId) => actionMap.get(actionId))
      .filter((action): action is NonNullable<typeof action> => !!action);
  }, [boardAgentActionsBySessionId, boardAgentReviewState]);

  useEffect(() => {
    setBoardAgentActiveSessionId(null);
    setBoardAgentMessage(null);
    setBoardAgentReviewState(null);
    setBoardAgentReviewSelections({});
    boardAgentReviewResolveRef.current = null;
  }, [activeBoard?.id, activeWorkspace?.id, setBoardAgentActiveSessionId]);

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
    },
    []
  );

  const toggleAgentSection = useCallback((section: keyof typeof agentSections) => {
    setAgentSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }, []);

  const requestBoardAgentReview = useCallback(
    async (request: BoardAgentReviewRequest) =>
      await new Promise<BoardAgentReviewDecision>((resolve) => {
        boardAgentReviewResolveRef.current = resolve;
        openAgentPanel();
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
    [openAgentPanel]
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

  const handleRunBoardAgent = useCallback(async () => {
    if (!activeWorkspace || !activeBoard || !editorRef.current) return;

    const abortController = new AbortController();
    boardAgentAbortRef.current = abortController;
    openAgentPanel();
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
        userRequest: boardAgentPrompt,
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
        createWorkspaceItem: async (item) => {
          await createWorkspaceItem(item);
        },
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
    boardAgentActionsBySessionId,
    boardAgentAutoApproveOrganizationActions,
    boardAgentPrompt,
    boardSessionsForBoard,
    createBoardAgentSession,
    createWorkspaceItem,
    createdWorkspaceItems,
    editorRef,
    onLaunchInvestigation,
    openAgentPanel,
    persistCurrentBoardDocument,
    requestBoardAgentReview,
    saveArtifact,
    setBoardAgentActiveSessionId,
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

  return {
    agentSections,
    boardAgentActiveSessionId,
    boardAgentAutoApproveOrganizationActions,
    boardAgentBusy,
    boardAgentMessage,
    boardAgentPrompt,
    boardAgentReviewActions,
    boardAgentReviewSelections,
    boardAgentReviewState,
    handleApproveBoardAgentPlan,
    handleBoardAgentComposerKeyDown,
    handleBoardAgentReviewSelectionChange,
    handleCancelBoardAgent,
    handleRunBoardAgent,
    handleSkipBoardAgentPlan,
    setBoardAgentActiveSessionId,
    setBoardAgentAutoApproveOrganizationActions:
      handleBoardAgentAutoApproveOrganizationActionsChange,
    setBoardAgentPrompt,
    toggleAgentSection,
  };
};
