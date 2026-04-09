import { describe, expect, it } from 'vitest';

import { DEFAULT_THEME_FONT_SETTINGS } from '@/utils/themeFonts';
import { DEFAULT_THEME_SURFACE_SETTINGS } from '@/utils/themeSurfaces';

import type { WorkspaceState } from '../workspaceStore';
import {
  buildAddBoardAgentActionState,
  buildAddChatMessageState,
  buildBoardAgentSessionRecord,
  buildChatSessionRecord,
  buildCreateChatSessionState,
  buildDeleteChatSessionState,
  buildUpdateBoardAgentActionState,
  buildUpdateChatMessageState,
} from './conversationActionState';

const createWorkspaceState = (overrides: Partial<WorkspaceState> = {}): WorkspaceState =>
  ({
    workspaces: [],
    artifacts: [],
    workspaceRuns: [],
    chatSessions: [],
    chatMessagesBySessionId: {},
    chatActionsBySessionId: {},
    boardAgentSessions: [],
    boardAgentActionsBySessionId: {},
    activeChatSessionId: null,
    chatGenerationStatus: 'IDLE',
    partialAssistantOutput: '',
    selectedChatLaunchContext: null,
    activeRunId: null,
    liveEvents: [],
    headlines: [],
    templates: [],
    workspaceItems: [],
    workspaceBoards: [],
    workspaceBoardDocuments: {},
    activeWorkspaceBoardId: null,
    queuedBoardPlacement: null,
    entityAliases: {},
    toasts: [],
    feedItems: [],
    feedConfig: { limit: 8, prioritySources: '', autoRefresh: false, refreshInterval: 60000 },
    manualLinks: [],
    manualNodes: [],
    hiddenNodeIds: [],
    flaggedNodeIds: [],
    activeWorkspaceId: null,
    customScopes: [],
    activeScope: null,
    defaultScopeId: 'default',
    isLoading: false,
    error: null,
    initializeStore: async () => undefined,
    setWorkspaces: () => undefined,
    setArtifacts: () => undefined,
    setWorkspaceRuns: () => undefined,
    setChatSessions: () => undefined,
    setChatMessagesBySessionId: () => undefined,
    setBoardAgentSessions: () => undefined,
    setBoardAgentActionsBySessionId: () => undefined,
    setActiveChatSessionId: () => undefined,
    setChatGenerationStatus: () => undefined,
    setPartialAssistantOutput: () => undefined,
    setSelectedChatLaunchContext: () => undefined,
    setActiveRunId: () => undefined,
    setLiveEvents: () => undefined,
    setNavStack: () => undefined,
    setIsSidebarCollapsed: () => undefined,
    setThemeMode: () => undefined,
    setThemeColor: () => undefined,
    setAccentSettings: () => undefined,
    setThemeSurfaceSettings: () => undefined,
    setThemeFontSettings: () => undefined,
    setShowGlobalSearch: () => undefined,
    setTemplates: () => undefined,
    setHeadlines: () => undefined,
    setWorkspaceItems: () => undefined,
    setWorkspaceBoards: () => undefined,
    setActiveWorkspaceBoardId: () => undefined,
    queueBoardPlacement: () => undefined,
    clearQueuedBoardPlacement: () => undefined,
    addHeadline: async () => undefined,
    addTemplate: () => undefined,
    deleteTemplate: () => undefined,
    setEntityAliases: async () => undefined,
    addAlias: () => undefined,
    resolveEntity: (name) => name,
    addToast: () => undefined,
    removeToast: () => undefined,
    setFeedItems: () => undefined,
    setFeedConfig: () => undefined,
    setManualLinks: () => undefined,
    setManualNodes: () => undefined,
    setHiddenNodeIds: () => undefined,
    setFlaggedNodeIds: () => undefined,
    setActiveWorkspaceId: () => undefined,
    toggleFlag: () => undefined,
    toggleHide: () => undefined,
    setActiveScope: () => undefined,
    setDefaultScope: () => undefined,
    addScope: async () => undefined,
    deleteScope: async () => undefined,
    addWorkspaceRun: async () => undefined,
    addRun: async () => undefined,
    createChatSession: async () => {
      throw new Error('not implemented');
    },
    updateChatSession: async () => undefined,
    renameChatSession: async () => undefined,
    deleteChatSession: async () => undefined,
    addChatMessage: async () => undefined,
    updateChatMessage: async () => undefined,
    addChatAction: async () => undefined,
    createBoardAgentSession: async () => {
      throw new Error('not implemented');
    },
    updateBoardAgentSession: async () => undefined,
    addBoardAgentAction: async () => undefined,
    updateBoardAgentAction: async () => undefined,
    appendSectionToArtifact: async () => undefined,
    updateArtifactSummary: async () => undefined,
    updateArtifactSection: async () => undefined,
    completeWorkspaceRun: async () => undefined,
    completeRun: async () => undefined,
    failRun: async () => undefined,
    clearCompletedRuns: async () => undefined,
    saveArtifact: async () => {
      throw new Error('not implemented');
    },
    updateArtifactTitle: async () => undefined,
    renameEntityAcrossArtifacts: async () => undefined,
    deleteArtifact: async () => undefined,
    deleteWorkspace: async () => undefined,
    purgeWorkspace: async () => undefined,
    ensureWorkspaceBoard: async () => {
      throw new Error('not implemented');
    },
    createWorkspaceBoard: async () => {
      throw new Error('not implemented');
    },
    updateWorkspaceBoard: async () => undefined,
    deleteWorkspaceBoard: async () => undefined,
    saveWorkspaceBoardDocument: async () => undefined,
    createWorkspaceItem: async () => undefined,
    updateWorkspaceItem: async () => undefined,
    deleteWorkspaceItem: async () => undefined,
    importWorkspaceData: async () => undefined,
    clearWorkspaceData: async () => undefined,
    navStack: [],
    isSidebarCollapsed: false,
    themeMode: 'dark',
    themeColor: '#000000',
    accentSettings: { hue: 0, lightness: 0.5, chroma: 0.1 },
    themeSurfaceSettings: DEFAULT_THEME_SURFACE_SETTINGS,
    themeFontSettings: DEFAULT_THEME_FONT_SETTINGS,
    showGlobalSearch: false,
    ...overrides,
  }) as WorkspaceState;

describe('conversationActionState', () => {
  it('builds a chat session record and activation state with system defaults', () => {
    const session = buildChatSessionRecord({
      defaults: { provider: 'OPENAI', modelId: 'gpt-5.4' },
      id: 'chat-1',
      input: {
        workspaceId: 'ws-1',
        title: '  Atlas Chat  ',
        metadata: { launchContext: { entityName: 'Atlas' } },
      },
      now: 10,
    });

    const next = buildCreateChatSessionState(createWorkspaceState(), session);

    expect(session).toEqual(
      expect.objectContaining({
        id: 'chat-1',
        title: 'Atlas Chat',
        provider: 'OPENAI',
        modelId: 'gpt-5.4',
      })
    );
    expect(next.chatSessions).toEqual([session]);
    expect(next.activeChatSessionId).toBe('chat-1');
  });

  it('removes a deleted chat session and its nested message/action state', () => {
    const next = buildDeleteChatSessionState(
      createWorkspaceState({
        chatSessions: [
          {
            id: 'chat-1',
            workspaceId: 'ws-1',
            title: 'Atlas',
            status: 'ACTIVE',
            createdAt: 1,
            updatedAt: 1,
          },
          {
            id: 'chat-2',
            workspaceId: 'ws-1',
            title: 'Bravo',
            status: 'ACTIVE',
            createdAt: 2,
            updatedAt: 2,
          },
        ],
        chatMessagesBySessionId: {
          'chat-1': [
            {
              id: 'msg-1',
              sessionId: 'chat-1',
              role: 'user',
              content: 'hello',
              status: 'COMPLETED',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
        },
        chatActionsBySessionId: {
          'chat-1': [
            {
              id: 'action-1',
              sessionId: 'chat-1',
              type: 'SEARCH_WORKSPACE',
              status: 'COMPLETED',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
        },
        activeChatSessionId: 'chat-1',
      }),
      'chat-1'
    );

    expect(next.chatSessions?.map((session) => session.id)).toEqual(['chat-2']);
    expect(next.chatMessagesBySessionId).toEqual({});
    expect(next.chatActionsBySessionId).toEqual({});
    expect(next.activeChatSessionId).toBe('chat-2');
  });

  it('updates chat message state and board-agent audit state without mutating unrelated records', () => {
    const state = createWorkspaceState({
      chatSessions: [
        {
          id: 'chat-1',
          workspaceId: 'ws-1',
          title: 'Atlas',
          status: 'ACTIVE',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      chatMessagesBySessionId: {
        'chat-1': [
          {
            id: 'msg-1',
            sessionId: 'chat-1',
            role: 'assistant',
            content: 'draft',
            status: 'STREAMING',
            attachments: [{ id: 'att-1', messageId: 'msg-1', kind: 'NOTE', title: 'A', createdAt: 1 }],
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      },
      boardAgentSessions: [
        {
          id: 'session-1',
          workspaceId: 'ws-1',
          boardId: 'board-1',
          title: 'Board Agent',
          status: 'RUNNING',
          request: 'Cluster',
          requestState: 'EXECUTING_ACTIONS',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      boardAgentActionsBySessionId: {
        'session-1': [
          {
            id: 'board-action-1',
            sessionId: 'session-1',
            workspaceId: 'ws-1',
            boardId: 'board-1',
            type: 'PLACE_LINKED_CARD',
            status: 'PENDING',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      },
    });

    const withAddedMessage = buildAddChatMessageState(state, {
      id: 'msg-2',
      sessionId: 'chat-1',
      role: 'user',
      content: 'follow up',
      status: 'COMPLETED',
      createdAt: 2,
      updatedAt: 3,
    });
    const withUpdatedMessage = buildUpdateChatMessageState(
      {
        ...state,
        ...withAddedMessage,
      } as WorkspaceState,
      'msg-1',
      'chat-1',
      { content: 'final', status: 'COMPLETED' },
      4
    );

    const withAddedBoardAction = buildAddBoardAgentActionState(state, {
      id: 'board-action-2',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      boardId: 'board-1',
      type: 'MOVE_SHAPES',
      status: 'COMPLETED',
      createdAt: 2,
      updatedAt: 5,
    });
    const withUpdatedBoardAction = buildUpdateBoardAgentActionState(
      {
        ...state,
        ...withAddedBoardAction,
      } as WorkspaceState,
      'board-action-1',
      'session-1',
      { status: 'FAILED', error: 'Missing shape.' },
      6
    );

    expect(withUpdatedMessage.chatMessagesBySessionId?.['chat-1'][0]).toEqual(
      expect.objectContaining({
        id: 'msg-1',
        content: 'final',
        status: 'COMPLETED',
        attachments: [{ id: 'att-1', messageId: 'msg-1', kind: 'NOTE', title: 'A', createdAt: 1 }],
        updatedAt: 4,
      })
    );
    expect(withAddedMessage.chatSessions?.[0]?.updatedAt).toBe(3);
    expect(withUpdatedBoardAction.boardAgentActionsBySessionId?.['session-1'][0]).toEqual(
      expect.objectContaining({
        id: 'board-action-1',
        status: 'FAILED',
        error: 'Missing shape.',
        updatedAt: 6,
      })
    );
    expect(withUpdatedBoardAction.boardAgentSessions?.[0]?.updatedAt).toBe(6);
    expect(
      buildBoardAgentSessionRecord({
        id: 'session-2',
        input: { workspaceId: 'ws-1', boardId: 'board-1', request: 'Summarize' },
        now: 7,
      })
    ).toEqual(
      expect.objectContaining({
        status: 'PENDING',
        requestState: 'QUEUED',
      })
    );
  });
});
