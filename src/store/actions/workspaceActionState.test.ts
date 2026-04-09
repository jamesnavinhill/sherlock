import { describe, expect, it } from 'vitest';

import {
  buildClearedWorkspaceDataState,
  buildDeleteWorkspaceState,
  buildImportedWorkspaceDataState,
  buildPurgeWorkspaceState,
} from './workspaceActionState';

describe('workspaceActionState', () => {
  it('removes workspace-owned state while preserving detached artifacts on delete', () => {
    const next = buildDeleteWorkspaceState(
      {
        workspaces: [{ id: 'ws-1', title: 'Atlas', status: 'ACTIVE', dateOpened: '2026-04-08' }],
        artifacts: [
          {
            id: 'artifact-1',
            workspaceId: 'ws-1',
            topic: 'Atlas Brief',
            summary: 'Summary',
            agendas: [],
            leads: [],
            entities: [],
            sources: [],
            rawText: 'raw',
          },
        ],
        workspaceRuns: [
          {
            id: 'run-1',
            workspaceId: 'ws-1',
            topic: 'Atlas',
            status: 'COMPLETED',
            startTime: 1,
          },
        ],
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
        feedConfig: { limit: 1, prioritySources: '', autoRefresh: false, refreshInterval: 1 },
        manualLinks: [],
        manualNodes: [],
        hiddenNodeIds: [],
        flaggedNodeIds: [],
        activeWorkspaceId: 'ws-1',
        customScopes: [],
        activeScope: null,
        defaultScopeId: 'default',
      } as never,
      'ws-1'
    );

    expect(next.workspaces).toEqual([]);
    expect(next.artifacts?.[0]?.workspaceId).toBeUndefined();
    expect(next.activeWorkspaceId).toBeNull();
  });

  it('builds imported and cleared workspace-data state snapshots', () => {
    const imported = buildImportedWorkspaceDataState({
      workspaces: [{ id: 'ws-1', title: 'Atlas', status: 'ACTIVE', dateOpened: '2026-04-08' }],
      artifacts: [],
      runs: [],
      chat: { sessions: [], messages: [], actions: [] },
      boardAgent: { sessions: [], actions: [] },
      signals: { signals: [] },
      graph: { manualNodes: [], manualLinks: [] },
      workspaceSurface: { items: [], boards: [], boardDocuments: [] },
      templates: [],
      metadata: {
        kind: 'SHERLOCK_WORKSPACE_DATA',
        formatVersion: 1,
        exportedAt: '2026-04-08T00:00:00.000Z',
      },
    });

    expect(imported.workspaces).toHaveLength(1);
    expect(buildClearedWorkspaceDataState().workspaces).toEqual([]);
  });

  it('purges workspace-linked graph and run state on workspace purge', () => {
    const next = buildPurgeWorkspaceState(
      {
        workspaces: [{ id: 'ws-1', title: 'Atlas', status: 'ACTIVE', dateOpened: '2026-04-08' }],
        artifacts: [
          {
            id: 'artifact-1',
            workspaceId: 'ws-1',
            topic: 'Atlas Brief',
            summary: 'Summary',
            agendas: [],
            leads: [],
            entities: [],
            sources: [],
            rawText: 'raw',
          },
        ],
        workspaceRuns: [
          {
            id: 'run-1',
            workspaceId: 'ws-1',
            topic: 'Atlas',
            status: 'COMPLETED',
            startTime: 1,
          },
        ],
        chatSessions: [],
        chatMessagesBySessionId: {},
        chatActionsBySessionId: {},
        boardAgentSessions: [],
        boardAgentActionsBySessionId: {},
        activeChatSessionId: null,
        chatGenerationStatus: 'IDLE',
        partialAssistantOutput: '',
        selectedChatLaunchContext: null,
        activeRunId: 'run-1',
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
        feedConfig: { limit: 1, prioritySources: '', autoRefresh: false, refreshInterval: 1 },
        manualLinks: [{ source: 'case-artifact-1', target: 'external', timestamp: 1 }],
        manualNodes: [{ id: 'case-artifact-1', label: 'Atlas', type: 'CASE', timestamp: 1 }],
        hiddenNodeIds: ['case-artifact-1'],
        flaggedNodeIds: ['case-artifact-1'],
        activeWorkspaceId: 'ws-1',
        customScopes: [],
        activeScope: null,
        defaultScopeId: 'default',
      } as never,
      'ws-1'
    );

    expect(next.workspaces).toEqual([]);
    expect(next.workspaceRuns).toEqual([]);
    expect(next.manualNodes).toEqual([]);
    expect(next.activeRunId).toBeNull();
  });
});
