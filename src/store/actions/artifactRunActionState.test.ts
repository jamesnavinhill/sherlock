import { describe, expect, it } from 'vitest';

import type { WorkspaceState } from '../workspaceStore';
import {
  buildAddWorkspaceRunState,
  buildArtifactSavePlan,
  buildCompleteWorkspaceRunState,
  buildSavedArtifactState,
} from './artifactRunActionState';

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
    activeTaskId: null,
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
    ...overrides,
  }) as WorkspaceState;

describe('artifactRunActionState', () => {
  it('keeps workspace runs unique and marks completed runs with produced artifacts', () => {
    const state = createWorkspaceState({
      workspaceRuns: [
        {
          id: 'run-1',
          workspaceId: 'ws-1',
          topic: 'Atlas',
          status: 'RUNNING',
          startTime: 1,
          config: {},
        },
      ],
    });

    const withRun = buildAddWorkspaceRunState(state, {
      id: 'run-1',
      workspaceId: 'ws-1',
      topic: 'Atlas',
      status: 'RUNNING',
      startTime: 2,
      config: {},
    });
    const completed = buildCompleteWorkspaceRunState(
      {
        ...state,
        ...withRun,
      } as WorkspaceState,
      {
        artifact: {
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
        endTime: 5,
        id: 'run-1',
        nextConfig: { producedArtifactId: 'artifact-1' },
      }
    );

    expect(withRun.workspaceRuns).toHaveLength(1);
    expect(completed.workspaceRuns?.[0]).toEqual(
      expect.objectContaining({
        status: 'COMPLETED',
        endTime: 5,
        report: expect.objectContaining({ id: 'artifact-1' }),
        config: expect.objectContaining({ producedArtifactId: 'artifact-1' }),
      })
    );
  });

  it('builds an artifact save plan that reuses the matching workspace and normalizes entity aliases', () => {
    const plan = buildArtifactSavePlan({
      artifact: {
        topic: 'Atlas Workspace',
        summary: 'New artifact',
        agendas: [],
        leads: [],
        entities: [{ name: 'atlas holdings', type: 'ORGANIZATION' }],
        sources: [],
        rawText: 'raw',
      },
      artifacts: [
        {
          id: 'artifact-existing',
          workspaceId: 'ws-1',
          topic: 'Atlas History',
          summary: 'Existing',
          agendas: [],
          leads: [],
          entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
          sources: [],
          rawText: 'raw',
        },
      ],
      autoNormalize: true,
      createArtifactId: () => 'artifact-new',
      createWorkspaceId: () => 'ws-new',
      dateOpened: '4/8/2026',
      entityAliases: {},
      now: 10,
      workspaces: [
        {
          id: 'ws-1',
          title: 'Atlas Workspace',
          displayTitle: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-08',
        },
      ],
      workspaceRuns: [],
    });

    expect(plan.isNewWorkspace).toBe(false);
    expect(plan.targetWorkspaceId).toBe('ws-1');
    expect(plan.savedArtifact).toEqual(
      expect.objectContaining({
        id: 'artifact-new',
        workspaceId: 'ws-1',
        entities: [expect.objectContaining({ name: 'Atlas Holdings' })],
      })
    );
    expect(plan.aliasUpdates).toEqual({ 'atlas holdings': 'Atlas Holdings' });
  });

  it('builds saved artifact state that links signals and resolves follow-ups', () => {
    const savedArtifact = {
      id: 'artifact-child',
      workspaceId: 'ws-1',
      topic: 'Child Artifact',
      summary: 'Summary',
      agendas: [],
      leads: [],
      entities: [],
      sources: [],
      rawText: 'raw',
      createdAt: 20,
      config: {
        sourceSignalId: 'signal-1',
        sourceFollowUpId: 'follow-up-1',
      },
    };
    const next = buildSavedArtifactState(
      createWorkspaceState({
        artifacts: [
          {
            id: 'artifact-parent',
            workspaceId: 'ws-1',
            topic: 'Parent Artifact',
            summary: 'Parent',
            agendas: [],
            leads: [],
            entities: [],
            sources: [],
            rawText: 'raw',
            followUps: [
              {
                id: 'follow-up-1',
                kind: 'QUESTION',
                title: 'Check Atlas',
                actionText: 'Check Atlas',
                status: 'OPEN',
              },
            ],
          },
        ],
        headlines: [
          {
            id: 'signal-1',
            workspaceId: 'ws-1',
            content: 'Signal',
            source: 'Desk',
            timestamp: '2026-04-08T00:00:00.000Z',
            type: 'NEWS',
            status: 'PENDING',
            threatLevel: 'INFO',
          },
        ],
      }),
      {
        aliasUpdates: {},
        isNewWorkspace: false,
        savedArtifact,
        sourceSignalId: 'signal-1',
        targetWorkspaceId: 'ws-1',
        workspaces: [
          {
            id: 'ws-1',
            title: 'Atlas Workspace',
            status: 'ACTIVE',
            dateOpened: '2026-04-08',
          },
        ],
      }
    );

    expect(next.activeWorkspaceId).toBe('ws-1');
    expect(next.headlines?.[0]?.linkedArtifactId).toBe('artifact-child');
    expect(next.artifacts?.[0]?.followUps?.[0]).toEqual(
      expect.objectContaining({
        status: 'RESOLVED',
        resolvedByArtifactId: 'artifact-child',
        updatedAt: 20,
      })
    );
    expect(next.artifacts?.[1]).toEqual(expect.objectContaining({ id: 'artifact-child' }));
  });
});
