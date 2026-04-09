import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorkspaceStore } from './workspaceStore';
import type { Artifact, WorkspaceTemplate, WorkspaceDataBackup } from '../types';
import { TemplateRepository } from '../services/db/repositories/TemplateRepository';
import { WorkspaceRunRepository } from '../services/db/repositories/WorkspaceRunRepository';
import { WorkspaceRepository } from '../services/db/repositories/WorkspaceRepository';
import { ChatRepository } from '../services/db/repositories/ChatRepository';
import { BoardAgentRepository } from '../services/db/repositories/BoardAgentRepository';
import { ManualDataRepository } from '../services/db/repositories/ManualDataRepository';
import { SettingsRepository } from '../services/db/repositories/SettingsRepository';
import { ScopeRepository } from '../services/db/repositories/ScopeRepository';
import { WorkspaceBoardRepository } from '../services/db/repositories/WorkspaceBoardRepository';
import { WorkspaceItemRepository } from '../services/db/repositories/WorkspaceItemRepository';
import * as dbClient from '../services/db/client';

describe('workspaceStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    vi.spyOn(TemplateRepository, 'create').mockResolvedValue();
    vi.spyOn(TemplateRepository, 'delete').mockResolvedValue();
    vi.spyOn(TemplateRepository, 'clearAll').mockResolvedValue();
    vi.spyOn(WorkspaceRunRepository, 'create').mockResolvedValue();
    vi.spyOn(WorkspaceRunRepository, 'updateStatus').mockResolvedValue();
    vi.spyOn(WorkspaceRunRepository, 'updateWorkspace').mockResolvedValue();
    vi.spyOn(WorkspaceRunRepository, 'updateConfig').mockResolvedValue();
    vi.spyOn(WorkspaceRunRepository, 'clearWorkspace').mockResolvedValue();
    vi.spyOn(WorkspaceRunRepository, 'deleteByWorkspace').mockResolvedValue();
    vi.spyOn(WorkspaceRepository, 'purgeWorkspace').mockResolvedValue();
    vi.spyOn(WorkspaceRepository, 'clearWorkspaceData').mockResolvedValue();
    vi.spyOn(WorkspaceRepository, 'createWorkspace').mockResolvedValue();
    vi.spyOn(WorkspaceRepository, 'createArtifact').mockResolvedValue();
    vi.spyOn(WorkspaceRepository, 'createSignal').mockResolvedValue();
    vi.spyOn(WorkspaceRepository, 'replaceWorkspaceDataBackup').mockResolvedValue();
    vi.spyOn(ChatRepository, 'createSession').mockResolvedValue();
    vi.spyOn(ChatRepository, 'updateSession').mockResolvedValue();
    vi.spyOn(ChatRepository, 'deleteSession').mockResolvedValue();
    vi.spyOn(ChatRepository, 'deleteSessionsForWorkspace').mockResolvedValue();
    vi.spyOn(ChatRepository, 'clearAll').mockResolvedValue();
    vi.spyOn(ChatRepository, 'createMessage').mockResolvedValue();
    vi.spyOn(ChatRepository, 'updateMessage').mockResolvedValue();
    vi.spyOn(ChatRepository, 'replaceAttachments').mockResolvedValue();
    vi.spyOn(ChatRepository, 'createAction').mockResolvedValue();
    vi.spyOn(BoardAgentRepository, 'createSession').mockResolvedValue();
    vi.spyOn(BoardAgentRepository, 'updateSession').mockResolvedValue();
    vi.spyOn(BoardAgentRepository, 'deleteSession').mockResolvedValue();
    vi.spyOn(BoardAgentRepository, 'deleteSessionsForWorkspace').mockResolvedValue();
    vi.spyOn(BoardAgentRepository, 'clearAll').mockResolvedValue();
    vi.spyOn(BoardAgentRepository, 'createAction').mockResolvedValue();
    vi.spyOn(BoardAgentRepository, 'updateAction').mockResolvedValue();
    vi.spyOn(BoardAgentRepository, 'getAllSessions').mockResolvedValue([]);
    vi.spyOn(BoardAgentRepository, 'getActionsForSession').mockResolvedValue([]);
    vi.spyOn(ManualDataRepository, 'saveAllNodes').mockResolvedValue();
    vi.spyOn(ManualDataRepository, 'saveAllLinks').mockResolvedValue();
    vi.spyOn(ManualDataRepository, 'removeWorkspaceLinkedData').mockResolvedValue();
    vi.spyOn(ManualDataRepository, 'clearAll').mockResolvedValue();
    vi.spyOn(ScopeRepository, 'ensureBuiltinScopes').mockResolvedValue();
    vi.spyOn(WorkspaceItemRepository, 'create').mockResolvedValue();
    vi.spyOn(WorkspaceItemRepository, 'update').mockResolvedValue();
    vi.spyOn(WorkspaceItemRepository, 'delete').mockResolvedValue();
    vi.spyOn(WorkspaceItemRepository, 'getAll').mockResolvedValue([]);
    vi.spyOn(WorkspaceBoardRepository, 'createBoard').mockResolvedValue();
    vi.spyOn(WorkspaceBoardRepository, 'updateBoard').mockResolvedValue();
    vi.spyOn(WorkspaceBoardRepository, 'deleteBoard').mockResolvedValue();
    vi.spyOn(WorkspaceBoardRepository, 'upsertDocument').mockResolvedValue();
    vi.spyOn(WorkspaceBoardRepository, 'getAllBoards').mockResolvedValue([]);
    vi.spyOn(WorkspaceBoardRepository, 'getAllDocuments').mockResolvedValue([]);
    vi.spyOn(SettingsRepository, 'setSetting').mockResolvedValue();

    // Reset store before each test
    const store = useWorkspaceStore.getState();
    store.setArtifacts([]);
    store.setWorkspaces([]);
    store.setWorkspaceRuns([]);
    store.setChatSessions([]);
    store.setChatMessagesBySessionId({});
    useWorkspaceStore.setState({
      chatActionsBySessionId: {},
      boardAgentSessions: [],
      boardAgentActionsBySessionId: {},
      headlines: [],
      manualNodes: [],
      manualLinks: [],
      workspaceItems: [],
      workspaceBoards: [],
      workspaceBoardDocuments: {},
      hiddenNodeIds: [],
      flaggedNodeIds: [],
      activeWorkspaceId: null,
      activeRunId: null,
      activeChatSessionId: null,
    });
    store.setTemplates([]);
  });

  it('should initialize with default state', () => {
    const state = useWorkspaceStore.getState();
    expect(state.artifacts).toEqual([]);
    expect(state.workspaces).toEqual([]);
    expect(state.activeRunId).toBeNull();
  });

  it('creates and persists a primary workspace board document', async () => {
    useWorkspaceStore.setState({
      workspaces: [
        { id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' },
      ],
      activeWorkspaceId: 'case-1',
    });

    const store = useWorkspaceStore.getState();
    const board = await store.ensureWorkspaceBoard('case-1');

    expect(WorkspaceBoardRepository.createBoard).toHaveBeenCalledTimes(1);
    expect(board.workspaceId).toBe('case-1');
    expect(board.name).toBe('Primary Board');
    expect(useWorkspaceStore.getState().activeWorkspaceBoardId).toBe(board.id);

    await store.saveWorkspaceBoardDocument({
      boardId: board.id,
      snapshot: { store: {}, schema: {} },
      updatedAt: 10,
    });

    expect(WorkspaceBoardRepository.upsertDocument).toHaveBeenCalledWith({
      boardId: board.id,
      snapshot: { store: {}, schema: {} },
      updatedAt: 10,
    });
    expect(useWorkspaceStore.getState().workspaceBoardDocuments[board.id]).toEqual({
      boardId: board.id,
      snapshot: { store: {}, schema: {} },
      updatedAt: 10,
    });
  });

  it('bootstraps the demo workspace seed once when local workspace data is empty', async () => {
    const payload: WorkspaceDataBackup = {
      workspaces: [
        {
          id: 'ws-seed',
          title: 'Seed Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-04',
        },
      ],
      artifacts: [
        {
          id: 'artifact-seed',
          workspaceId: 'ws-seed',
          topic: 'Seed Artifact',
          summary: 'Saved artifact',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: 'seed artifact',
        },
      ],
      runs: [
        {
          id: 'run-seed',
          workspaceId: 'ws-seed',
          topic: 'Seed Run',
          status: 'COMPLETED',
          startTime: 1,
          endTime: 2,
          config: {},
        },
      ],
      chat: {
        sessions: [],
        messages: [],
        actions: [],
      },
      boardAgent: {
        sessions: [],
        actions: [],
      },
      signals: {
        signals: [],
      },
      graph: {
        manualNodes: [],
        manualLinks: [],
      },
      workspaceSurface: {
        items: [],
        boards: [],
        boardDocuments: [],
      },
      templates: [],
      metadata: {
        kind: 'SHERLOCK_WORKSPACE_DATA',
        formatVersion: 1,
        exportedAt: '2026-04-04T00:00:00.000Z',
      },
    };

    vi.spyOn(dbClient, 'initDB').mockResolvedValue(
      {} as Awaited<ReturnType<typeof dbClient.initDB>>
    );
    vi.spyOn(WorkspaceRepository, 'getAllWorkspaces').mockResolvedValue([]);
    vi.spyOn(WorkspaceRepository, 'getAllArtifacts').mockResolvedValue([]);
    vi.spyOn(ScopeRepository, 'getAll').mockResolvedValue([]);
    vi.spyOn(WorkspaceRunRepository, 'getAll').mockResolvedValue([]);
    vi.spyOn(ChatRepository, 'getAllSessions').mockResolvedValue([]);
    vi.spyOn(ChatRepository, 'getMessagesBySessionIds').mockResolvedValue({});
    vi.spyOn(BoardAgentRepository, 'getAllSessions').mockResolvedValue([]);
    vi.spyOn(WorkspaceRepository, 'getSignals').mockResolvedValue([]);
    vi.spyOn(TemplateRepository, 'getAll').mockResolvedValue([]);
    vi.spyOn(ManualDataRepository, 'getAllNodes').mockResolvedValue([]);
    vi.spyOn(ManualDataRepository, 'getAllLinks').mockResolvedValue([]);
    vi.spyOn(SettingsRepository, 'getSetting').mockResolvedValue(undefined);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
    vi.stubGlobal('fetch', fetchMock);

    await useWorkspaceStore.getState().initializeStore();

    expect(ScopeRepository.ensureBuiltinScopes).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/seeds/demo-workspace.json', { cache: 'no-store' });
    expect(WorkspaceRepository.replaceWorkspaceDataBackup).toHaveBeenCalledWith(payload);
    expect(useWorkspaceStore.getState().workspaces).toEqual(payload.workspaces);
    expect(useWorkspaceStore.getState().artifacts).toEqual(payload.artifacts);
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('ws-seed');
    expect(localStorage.getItem('sherlock_active_workspace_id')).toBe('ws-seed');
    expect(localStorage.getItem('sherlock_demo_seed_v1_applied')).toBe('true');
  });

  it('keeps bootstrapping when one repository read fails and falls back to empty data', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    vi.spyOn(dbClient, 'initDB').mockResolvedValue(
      {} as Awaited<ReturnType<typeof dbClient.initDB>>
    );
    vi.spyOn(WorkspaceRepository, 'getAllWorkspaces').mockResolvedValue([
      {
        id: 'ws-1',
        title: 'Workspace One',
        status: 'ACTIVE',
        dateOpened: '2026-04-04',
      },
    ]);
    vi.spyOn(WorkspaceRepository, 'getAllArtifacts').mockRejectedValue(new Error('corrupted report row'));
    vi.spyOn(ScopeRepository, 'getAll').mockResolvedValue([]);
    vi.spyOn(WorkspaceRunRepository, 'getAll').mockResolvedValue([]);
    vi.spyOn(ChatRepository, 'getAllSessions').mockResolvedValue([]);
    vi.spyOn(ChatRepository, 'getMessagesBySessionIds').mockResolvedValue({});
    vi.spyOn(BoardAgentRepository, 'getAllSessions').mockResolvedValue([]);
    vi.spyOn(WorkspaceRepository, 'getSignals').mockResolvedValue([]);
    vi.spyOn(TemplateRepository, 'getAll').mockResolvedValue([]);
    vi.spyOn(ManualDataRepository, 'getAllNodes').mockResolvedValue([]);
    vi.spyOn(ManualDataRepository, 'getAllLinks').mockResolvedValue([]);
    vi.spyOn(SettingsRepository, 'getSetting').mockResolvedValue(undefined);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    await useWorkspaceStore.getState().initializeStore();

    expect(ScopeRepository.ensureBuiltinScopes).toHaveBeenCalledTimes(1);
    expect(useWorkspaceStore.getState().workspaces).toEqual([
      {
        id: 'ws-1',
        title: 'Workspace One',
        status: 'ACTIVE',
        dateOpened: '2026-04-04',
      },
    ]);
    expect(useWorkspaceStore.getState().artifacts).toEqual([]);
    expect(useWorkspaceStore.getState().error).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      '[bootstrap][skip] Failed to load artifacts. Using fallback.',
      expect.any(Error)
    );
  });

  it('should add and delete templates', async () => {
    const template: WorkspaceTemplate = {
      id: 'tpl-1',
      name: 'Test Template',
      topic: 'Test Topic',
      config: { modelId: 'test-model' },
      createdAt: Date.now(),
    };

    const { addTemplate, deleteTemplate } = useWorkspaceStore.getState();

    await addTemplate(template);
    expect(useWorkspaceStore.getState().templates).toHaveLength(1);
    expect(useWorkspaceStore.getState().templates[0].name).toBe('Test Template');

    await deleteTemplate('tpl-1');
    expect(useWorkspaceStore.getState().templates).toHaveLength(0);
  });

  it('should handle task lifecycle', async () => {
    const { addRun, completeRun } = useWorkspaceStore.getState();
    const taskId = 'task-1';

    await addRun({
      id: taskId,
      topic: 'Lifecycle test',
      status: 'RUNNING',
      startTime: Date.now(),
      config: {},
    });

    expect(useWorkspaceStore.getState().workspaceRuns).toHaveLength(1);
    expect(useWorkspaceStore.getState().workspaceRuns[0].status).toBe('RUNNING');

    const report: Artifact = {
      id: 'rep-1',
      topic: 'Lifecycle test',
      summary: 'Success',
      agendas: [],
      leads: [],
      entities: [],
      sources: [],
      rawText: 'Test content',
    };

    await completeRun(taskId, report);
    expect(useWorkspaceStore.getState().workspaceRuns[0].status).toBe('COMPLETED');
    expect(useWorkspaceStore.getState().workspaceRuns[0].report?.id).toBe('rep-1');
    expect(WorkspaceRunRepository.updateConfig).toHaveBeenCalledWith(taskId, {
      producedArtifactId: 'rep-1',
    });
  });

  it('rolls back optimistic task state when task persistence fails', async () => {
    vi.mocked(WorkspaceRunRepository.create).mockRejectedValueOnce(new Error('sqlite unavailable'));

    await expect(
      useWorkspaceStore.getState().addRun({
        id: 'task-fail',
        topic: 'Rollback test',
        status: 'RUNNING',
        startTime: Date.now(),
        config: {},
      })
    ).rejects.toThrow('sqlite unavailable');

    expect(useWorkspaceStore.getState().workspaceRuns).toEqual([]);
  });

  it('should link a signal to its saved artifact when archive lineage is present', async () => {
    const store = useWorkspaceStore.getState();
    store.setWorkspaces([
      { id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' },
    ]);
    store.setHeadlines([
      {
        id: 'head-1',
        workspaceId: 'case-1',
        content: 'Signal',
        source: 'Desk',
        timestamp: '2026-04-03T00:00:00.000Z',
        type: 'NEWS',
        status: 'PENDING',
        threatLevel: 'INFO',
      },
    ]);

    const saved = await store.saveArtifact({
      id: 'rep-1',
      workspaceId: 'case-1',
      topic: 'Signal Follow-up',
      createdAt: 1,
      summary: 'Summary',
      agendas: [],
      leads: [],
      entities: [],
      sources: [],
      rawText: 'raw',
      config: {
        sourceSignalId: 'head-1',
        sourceRunId: 'run-1',
      },
    });

    expect(saved.id).toBe('rep-1');
    expect(WorkspaceRepository.createArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'rep-1',
        config: expect.objectContaining({
          sourceSignalId: 'head-1',
        }),
      })
    );
    expect(useWorkspaceStore.getState().headlines[0].linkedArtifactId).toBe('rep-1');
  });

  it('should backfill artifact lineage from the source run when the report input is partial', async () => {
    const store = useWorkspaceStore.getState();
    store.setWorkspaces([
      { id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' },
    ]);
    store.setArtifacts([
      {
        id: 'rep-parent',
        workspaceId: 'case-1',
        topic: 'Parent Artifact',
        createdAt: 1,
        summary: 'Parent summary',
        agendas: [],
        leads: [],
        entities: [],
        sources: [],
        rawText: 'raw',
      },
    ]);
    store.setHeadlines([
      {
        id: 'head-1',
        workspaceId: 'case-1',
        content: 'Signal',
        source: 'Desk',
        timestamp: '2026-04-03T00:00:00.000Z',
        type: 'NEWS',
        status: 'PENDING',
        threatLevel: 'INFO',
      },
    ]);
    store.setWorkspaceRuns([
      {
        id: 'run-1',
        workspaceId: 'case-1',
        topic: 'Follow-up',
        status: 'RUNNING',
        startTime: 1,
        config: {
          parentArtifactId: 'rep-parent',
          parentRunId: 'run-root',
          sourceSignalId: 'head-1',
        },
      },
    ]);

    const saved = await store.saveArtifact({
      id: 'rep-child',
      topic: 'Child Artifact',
      summary: 'Child summary',
      agendas: [],
      leads: [],
      entities: [],
      sources: [],
      rawText: 'raw',
      config: {
        sourceRunId: 'run-1',
      },
    });

    expect(saved.workspaceId).toBe('case-1');
    expect(saved.config).toEqual(
      expect.objectContaining({
        sourceRunId: 'run-1',
        parentArtifactId: 'rep-parent',
        parentRunId: 'run-root',
        sourceSignalId: 'head-1',
      })
    );
  });

  it('should create and update chat sessions and messages', async () => {
    const store = useWorkspaceStore.getState();
    store.setWorkspaces([
      { id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' },
    ]);

    const session = await store.createChatSession({ workspaceId: 'case-1', title: 'Alpha Chat' });
    expect(useWorkspaceStore.getState().chatSessions).toHaveLength(1);
    expect(session.title).toBe('Alpha Chat');

    await store.renameChatSession(session.id, 'Renamed Alpha Chat');
    expect(useWorkspaceStore.getState().chatSessions[0].title).toBe('Renamed Alpha Chat');

    await store.addChatMessage({
      id: 'msg-1',
      sessionId: session.id,
      role: 'user',
      content: 'Hello workspace',
      status: 'COMPLETED',
      createdAt: 1,
      updatedAt: 1,
    });
    expect(useWorkspaceStore.getState().chatMessagesBySessionId[session.id]).toHaveLength(1);

    await store.updateChatMessage('msg-1', session.id, {
      content: 'Updated workspace message',
      status: 'COMPLETED',
      updatedAt: 2,
    });
    expect(useWorkspaceStore.getState().chatMessagesBySessionId[session.id][0].content).toBe(
      'Updated workspace message'
    );
  });

  it('should persist board-agent sessions and audit actions', async () => {
    const store = useWorkspaceStore.getState();
    store.setWorkspaces([
      { id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' },
    ]);
    useWorkspaceStore.setState({
      workspaceBoards: [
        {
          id: 'board-1',
          workspaceId: 'case-1',
          name: 'Primary Board',
          sortOrder: 0,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });

    const session = await store.createBoardAgentSession({
      workspaceId: 'case-1',
      boardId: 'board-1',
      request: 'Cluster the visible evidence',
      title: 'Clustering pass',
    });

    expect(BoardAgentRepository.createSession).toHaveBeenCalledTimes(1);
    expect(session.requestState).toBe('QUEUED');
    expect(useWorkspaceStore.getState().boardAgentSessions[0].id).toBe(session.id);

    await store.updateBoardAgentSession(session.id, {
      status: 'RUNNING',
      requestState: 'EXECUTING_ACTIONS',
      updatedAt: 2,
    });

    expect(useWorkspaceStore.getState().boardAgentSessions[0]).toEqual(
      expect.objectContaining({
        status: 'RUNNING',
        requestState: 'EXECUTING_ACTIONS',
      })
    );

    await store.addBoardAgentAction({
      id: 'board-action-1',
      sessionId: session.id,
      workspaceId: 'case-1',
      boardId: 'board-1',
      type: 'PLACE_LINKED_CARD',
      status: 'COMPLETED',
      affectedCanonicalIds: ['rep-1'],
      affectedBoardShapeIds: ['shape:1'],
      createdAt: 3,
      updatedAt: 4,
    });

    expect(BoardAgentRepository.createAction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'board-action-1',
        sessionId: session.id,
      })
    );
    expect(useWorkspaceStore.getState().boardAgentActionsBySessionId[session.id]).toEqual([
      expect.objectContaining({
        type: 'PLACE_LINKED_CARD',
        affectedBoardShapeIds: ['shape:1'],
      }),
    ]);

    await store.updateBoardAgentAction('board-action-1', session.id, {
      status: 'FAILED',
      error: 'Missing board shape.',
      updatedAt: 5,
    });

    expect(BoardAgentRepository.updateAction).toHaveBeenCalledWith('board-action-1', {
      status: 'FAILED',
      error: 'Missing board shape.',
      updatedAt: 5,
    });
    expect(useWorkspaceStore.getState().boardAgentActionsBySessionId[session.id][0]).toEqual(
      expect.objectContaining({
        id: 'board-action-1',
        status: 'FAILED',
        error: 'Missing board shape.',
      })
    );
  });

  it('should add toasts and remove them', () => {
    vi.useFakeTimers();
    const { addToast } = useWorkspaceStore.getState();

    addToast('Test message', 'SUCCESS');
    expect(useWorkspaceStore.getState().toasts).toHaveLength(1);
    expect(useWorkspaceStore.getState().toasts[0].message).toBe('Test message');

    // Should auto-remove after 5s
    vi.advanceTimersByTime(5001);
    expect(useWorkspaceStore.getState().toasts).toHaveLength(0);
    vi.useRealTimers();
  });

  it('should purge a case and remove related local state', async () => {
    const store = useWorkspaceStore.getState();
    store.setWorkspaces([
      { id: 'case-1', title: 'Operation: Alpha', status: 'ACTIVE', dateOpened: '2026-02-07' },
      { id: 'case-2', title: 'Operation: Bravo', status: 'ACTIVE', dateOpened: '2026-02-07' },
    ]);
    store.setArtifacts([
      {
        id: 'rep-1',
        workspaceId: 'case-1',
        topic: 'A1',
        summary: '',
        agendas: [],
        leads: [],
        entities: [],
        sources: [],
        rawText: '',
      },
      {
        id: 'rep-2',
        workspaceId: 'case-2',
        topic: 'B1',
        summary: '',
        agendas: [],
        leads: [],
        entities: [],
        sources: [],
        rawText: '',
      },
      {
        id: 'rep-3',
        topic: 'Loose',
        summary: '',
        agendas: [],
        leads: [],
        entities: [],
        sources: [],
        rawText: '',
      },
    ]);
    store.setHeadlines([
      {
        id: 'h-1',
        workspaceId: 'case-1',
        content: 'alpha',
        source: 'src',
        timestamp: 'now',
        type: 'NEWS',
        status: 'PENDING',
        threatLevel: 'INFO',
      },
      {
        id: 'h-2',
        workspaceId: 'case-2',
        content: 'bravo',
        source: 'src',
        timestamp: 'now',
        type: 'NEWS',
        status: 'PENDING',
        threatLevel: 'INFO',
      },
    ]);
    store.setWorkspaceRuns([
      {
        id: 'run-1',
        workspaceId: 'case-1',
        topic: 'Alpha run',
        status: 'COMPLETED',
        startTime: 1,
      },
      {
        id: 'run-2',
        workspaceId: 'case-2',
        topic: 'Bravo run',
        status: 'RUNNING',
        startTime: 2,
      },
    ]);
    store.setActiveWorkspaceId('case-1');
    store.setChatSessions([
      {
        id: 'chat-1',
        workspaceId: 'case-1',
        title: 'Alpha Chat',
        status: 'ACTIVE',
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'chat-2',
        workspaceId: 'case-2',
        title: 'Bravo Chat',
        status: 'ACTIVE',
        createdAt: 2,
        updatedAt: 2,
      },
    ]);
    store.setChatMessagesBySessionId({
      'chat-1': [
        {
          id: 'msg-1',
          sessionId: 'chat-1',
          role: 'user',
          content: 'alpha',
          status: 'COMPLETED',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      'chat-2': [
        {
          id: 'msg-2',
          sessionId: 'chat-2',
          role: 'user',
          content: 'bravo',
          status: 'COMPLETED',
          createdAt: 2,
          updatedAt: 2,
        },
      ],
    });
    useWorkspaceStore.setState({
      chatActionsBySessionId: {
        'chat-1': [
          {
            id: 'act-1',
            sessionId: 'chat-1',
            type: 'SEARCH_WORKSPACE',
            status: 'COMPLETED',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
        'chat-2': [
          {
            id: 'act-2',
            sessionId: 'chat-2',
            type: 'SEARCH_WORKSPACE',
            status: 'COMPLETED',
            createdAt: 2,
            updatedAt: 2,
          },
        ],
      },
      boardAgentSessions: [
        {
          id: 'board-agent-1',
          workspaceId: 'case-1',
          boardId: 'board-1',
          title: 'Alpha board agent',
          status: 'RUNNING',
          request: 'Cluster alpha',
          requestState: 'EXECUTING_ACTIONS',
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'board-agent-2',
          workspaceId: 'case-2',
          boardId: 'board-2',
          title: 'Bravo board agent',
          status: 'PENDING',
          request: 'Cluster bravo',
          requestState: 'QUEUED',
          createdAt: 2,
          updatedAt: 2,
        },
      ],
      boardAgentActionsBySessionId: {
        'board-agent-1': [
          {
            id: 'board-act-1',
            sessionId: 'board-agent-1',
            workspaceId: 'case-1',
            boardId: 'board-1',
            type: 'PLACE_LINKED_CARD',
            status: 'COMPLETED',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
        'board-agent-2': [
          {
            id: 'board-act-2',
            sessionId: 'board-agent-2',
            workspaceId: 'case-2',
            boardId: 'board-2',
            type: 'MOVE_SHAPES',
            status: 'COMPLETED',
            createdAt: 2,
            updatedAt: 2,
          },
        ],
      },
      manualNodes: [
        { id: 'case-rep-1', label: 'Alpha Artifact', type: 'CASE', timestamp: 1 },
        { id: 'manual-keep', label: 'Keep Me', type: 'ENTITY', timestamp: 2 },
      ],
      manualLinks: [
        { source: 'case-rep-1', target: 'manual-keep', timestamp: 1 },
        { source: 'manual-keep', target: 'external', timestamp: 2 },
      ],
      hiddenNodeIds: ['case-rep-1', 'manual-keep'],
      flaggedNodeIds: ['case-rep-1', 'manual-keep'],
      activeRunId: 'run-2',
      activeChatSessionId: 'chat-1',
    });

    await store.purgeWorkspace('case-1');

    expect(WorkspaceRepository.purgeWorkspace).toHaveBeenCalledWith('case-1');
    expect(useWorkspaceStore.getState().workspaces.map((c) => c.id)).toEqual(['case-2']);
    expect(useWorkspaceStore.getState().artifacts.map((r) => r.id)).toEqual(['rep-2', 'rep-3']);
    expect(useWorkspaceStore.getState().headlines.map((h) => h.id)).toEqual(['h-2']);
    expect(useWorkspaceStore.getState().chatSessions.map((session) => session.id)).toEqual([
      'chat-2',
    ]);
    expect(Object.keys(useWorkspaceStore.getState().chatMessagesBySessionId)).toEqual(['chat-2']);
    expect(Object.keys(useWorkspaceStore.getState().chatActionsBySessionId)).toEqual(['chat-2']);
    expect(useWorkspaceStore.getState().boardAgentSessions.map((session) => session.id)).toEqual([
      'board-agent-2',
    ]);
    expect(Object.keys(useWorkspaceStore.getState().boardAgentActionsBySessionId)).toEqual([
      'board-agent-2',
    ]);
    expect(useWorkspaceStore.getState().manualNodes.map((node) => node.id)).toEqual([
      'manual-keep',
    ]);
    expect(useWorkspaceStore.getState().manualLinks).toEqual([
      { source: 'manual-keep', target: 'external', timestamp: 2 },
    ]);
    expect(useWorkspaceStore.getState().workspaceRuns.map((run) => run.id)).toEqual(['run-2']);
    expect(useWorkspaceStore.getState().hiddenNodeIds).toEqual(['manual-keep']);
    expect(useWorkspaceStore.getState().flaggedNodeIds).toEqual(['manual-keep']);
    expect(useWorkspaceStore.getState().activeRunId).toBe('run-2');
    expect(useWorkspaceStore.getState().activeChatSessionId).toBeNull();
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBeNull();
  });

  it('should import workspace data using the canonical backup payload', async () => {
    const store = useWorkspaceStore.getState();
    const payload: WorkspaceDataBackup = {
      workspaces: [
        { id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' },
      ],
      artifacts: [
        {
          id: 'rep-1',
          workspaceId: 'case-1',
          topic: 'Alpha',
          summary: 'Summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: 'raw',
        },
      ],
      runs: [
        {
          id: 'run-1',
          topic: 'Alpha',
          status: 'COMPLETED',
          startTime: 1,
          endTime: 2,
          workspaceId: 'case-1',
        },
      ],
      chat: {
        sessions: [
          {
            id: 'chat-1',
            workspaceId: 'case-1',
            title: 'Alpha Chat',
            status: 'ACTIVE',
            createdAt: 1,
            updatedAt: 2,
          },
        ],
        messages: [
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
        actions: [
          {
            id: 'act-1',
            sessionId: 'chat-1',
            type: 'SEARCH_WORKSPACE',
            status: 'COMPLETED',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      },
      boardAgent: {
        sessions: [
          {
            id: 'board-agent-1',
            workspaceId: 'case-1',
            boardId: 'board-1',
            title: 'Board agent',
            status: 'PENDING',
            request: 'Summarize the visible board',
            requestState: 'QUEUED',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
        actions: [
          {
            id: 'board-act-1',
            sessionId: 'board-agent-1',
            workspaceId: 'case-1',
            boardId: 'board-1',
            type: 'PLACE_LINKED_CARD',
            status: 'COMPLETED',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      },
      signals: {
        signals: [
          {
            id: 'head-1',
            workspaceId: 'case-1',
            content: 'Signal',
            source: 'Desk',
            timestamp: '2026-04-03T00:00:00.000Z',
            type: 'NEWS',
            status: 'PENDING',
            threatLevel: 'INFO',
          },
        ],
      },
      graph: {
        manualNodes: [{ id: 'manual-1', label: 'Entity', type: 'ENTITY', timestamp: 1 }],
        manualLinks: [{ source: 'manual-1', target: 'external', timestamp: 2 }],
      },
      workspaceSurface: {
        items: [],
        boards: [],
        boardDocuments: [],
      },
      templates: [
        { id: 'tpl-1', name: 'Template', topic: 'Topic', config: { modelId: 'x' }, createdAt: 1 },
      ],
      metadata: {
        kind: 'SHERLOCK_WORKSPACE_DATA',
        formatVersion: 1,
        exportedAt: '2026-04-03T00:00:00.000Z',
      },
    };

    await store.importWorkspaceData(payload);

    expect(WorkspaceRepository.replaceWorkspaceDataBackup).toHaveBeenCalledWith(payload);
    expect(useWorkspaceStore.getState().workspaces).toEqual(payload.workspaces);
    expect(useWorkspaceStore.getState().artifacts).toEqual(payload.artifacts);
    expect(useWorkspaceStore.getState().workspaceRuns).toEqual(payload.runs);
    expect(useWorkspaceStore.getState().chatSessions).toEqual(payload.chat.sessions);
    expect(useWorkspaceStore.getState().chatMessagesBySessionId).toEqual({
      'chat-1': payload.chat.messages,
    });
    expect(useWorkspaceStore.getState().chatActionsBySessionId).toEqual({
      'chat-1': payload.chat.actions,
    });
    expect(useWorkspaceStore.getState().boardAgentSessions).toEqual(payload.boardAgent.sessions);
    expect(useWorkspaceStore.getState().boardAgentActionsBySessionId).toEqual({
      'board-agent-1': payload.boardAgent.actions,
    });
    expect(useWorkspaceStore.getState().hiddenNodeIds).toEqual([]);
    expect(useWorkspaceStore.getState().flaggedNodeIds).toEqual([]);
  });

  it('should clear workspace data without touching app-level store config', async () => {
    const store = useWorkspaceStore.getState();
    store.setWorkspaces([
      { id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' },
    ]);
    store.setArtifacts([
      {
        id: 'rep-1',
        workspaceId: 'case-1',
        topic: 'Alpha',
        summary: '',
        agendas: [],
        leads: [],
        entities: [],
        sources: [],
        rawText: '',
      },
    ]);
    store.setWorkspaceRuns([{ id: 'run-1', topic: 'Alpha', status: 'RUNNING', startTime: 1 }]);
    store.setChatSessions([
      {
        id: 'chat-1',
        workspaceId: 'case-1',
        title: 'Alpha Chat',
        status: 'ACTIVE',
        createdAt: 1,
        updatedAt: 1,
      },
    ]);
    store.setChatMessagesBySessionId({
      'chat-1': [
        {
          id: 'msg-1',
          sessionId: 'chat-1',
          role: 'user',
          content: 'alpha',
          status: 'COMPLETED',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });
    store.setHeadlines([
      {
        id: 'head-1',
        workspaceId: 'case-1',
        content: 'Signal',
        source: 'Desk',
        timestamp: '2026-04-03T00:00:00.000Z',
        type: 'NEWS',
        status: 'PENDING',
        threatLevel: 'INFO',
      },
    ]);
    store.setTemplates([
      { id: 'tpl-1', name: 'Template', topic: 'Topic', config: { modelId: 'x' }, createdAt: 1 },
    ]);
    useWorkspaceStore.setState({
      chatActionsBySessionId: {
        'chat-1': [
          {
            id: 'act-1',
            sessionId: 'chat-1',
            type: 'SEARCH_WORKSPACE',
            status: 'COMPLETED',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      },
      boardAgentSessions: [
        {
          id: 'board-agent-1',
          workspaceId: 'case-1',
          boardId: 'board-1',
          title: 'Board agent',
          status: 'RUNNING',
          request: 'Summarize the board',
          requestState: 'EXECUTING_ACTIONS',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      boardAgentActionsBySessionId: {
        'board-agent-1': [
          {
            id: 'board-act-1',
            sessionId: 'board-agent-1',
            workspaceId: 'case-1',
            boardId: 'board-1',
            type: 'MOVE_SHAPES',
            status: 'COMPLETED',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      },
      manualNodes: [{ id: 'manual-1', label: 'Entity', type: 'ENTITY', timestamp: 1 }],
      manualLinks: [{ source: 'manual-1', target: 'external', timestamp: 2 }],
      hiddenNodeIds: ['manual-1'],
      flaggedNodeIds: ['manual-1'],
      activeWorkspaceId: 'case-1',
      activeRunId: 'run-1',
      activeChatSessionId: 'chat-1',
    });

    await store.clearWorkspaceData();

    expect(WorkspaceRepository.clearWorkspaceData).toHaveBeenCalled();
    expect(useWorkspaceStore.getState().workspaces).toEqual([]);
    expect(useWorkspaceStore.getState().artifacts).toEqual([]);
    expect(useWorkspaceStore.getState().workspaceRuns).toEqual([]);
    expect(useWorkspaceStore.getState().chatSessions).toEqual([]);
    expect(useWorkspaceStore.getState().chatMessagesBySessionId).toEqual({});
    expect(useWorkspaceStore.getState().chatActionsBySessionId).toEqual({});
    expect(useWorkspaceStore.getState().boardAgentSessions).toEqual([]);
    expect(useWorkspaceStore.getState().boardAgentActionsBySessionId).toEqual({});
    expect(useWorkspaceStore.getState().templates).toEqual([]);
    expect(useWorkspaceStore.getState().manualNodes).toEqual([]);
    expect(useWorkspaceStore.getState().manualLinks).toEqual([]);
    expect(useWorkspaceStore.getState().hiddenNodeIds).toEqual([]);
    expect(useWorkspaceStore.getState().flaggedNodeIds).toEqual([]);
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBeNull();
    expect(useWorkspaceStore.getState().activeRunId).toBeNull();
    expect(useWorkspaceStore.getState().activeChatSessionId).toBeNull();
  });
});
