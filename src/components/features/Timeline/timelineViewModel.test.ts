import { describe, expect, it } from 'vitest';

import type { Artifact, Workspace } from '@/types';

import { DEFAULT_FILTERS } from './timelineViewUtils';
import { buildTimelineViewModel } from './timelineViewModel';

describe('buildTimelineViewModel', () => {
  const workspace: Workspace = {
    id: 'ws-1',
    title: 'Alpha Workspace',
    status: 'ACTIVE',
    dateOpened: '2026-04-05',
  };

  const artifact: Artifact = {
    id: 'artifact-1',
    caseId: 'ws-1',
    topic: 'Signal Follow-up',
    summary: 'Saved artifact summary.',
    agendas: [],
    leads: [],
    entities: [],
    sources: [],
    rawText: 'artifact raw text',
    createdAt: 10,
    config: {
      sourceSignalId: 'signal-1',
      sourceRunId: 'run-1',
    },
  };

  it('derives event collections and selected artifact state from workspace data', () => {
    const initial = buildTimelineViewModel({
      activeWorkspaceId: 'ws-1',
      artifacts: [artifact],
      chatActionsBySessionId: {},
      chatSessions: [],
      headlines: [
        {
          id: 'signal-1',
          caseId: 'ws-1',
          content: 'Signal',
          source: 'Desk',
          timestamp: '2026-04-05T00:00:00.000Z',
          type: 'NEWS',
          status: 'PENDING',
          threatLevel: 'INFO',
        },
      ],
      selectedEventId: null,
      timelineQuery: {
        search: '',
        filters: DEFAULT_FILTERS,
        focusedTrack: 'ALL',
      },
      workspaceRuns: [],
      workspaces: [workspace],
    });

    const artifactEvent = initial.allTimelineEvents.find((event) => event.refId === 'artifact-1');
    expect(artifactEvent).toBeTruthy();
    expect(initial.timelineSnapshot?.events).toHaveLength(initial.visibleEvents.length);

    const selected = buildTimelineViewModel({
      activeWorkspaceId: 'ws-1',
      artifacts: [artifact],
      chatActionsBySessionId: {},
      chatSessions: [],
      headlines: [
        {
          id: 'signal-1',
          caseId: 'ws-1',
          content: 'Signal',
          source: 'Desk',
          timestamp: '2026-04-05T00:00:00.000Z',
          type: 'NEWS',
          status: 'PENDING',
          threatLevel: 'INFO',
        },
      ],
      selectedEventId: artifactEvent?.id || null,
      timelineQuery: {
        search: '',
        filters: DEFAULT_FILTERS,
        focusedTrack: 'ALL',
      },
      workspaceRuns: [],
      workspaces: [workspace],
    });

    expect(selected.selectedArtifact?.id).toBe('artifact-1');
    expect(selected.relatedSignal?.id).toBe('signal-1');
    expect(selected.artifactTitleById.get('artifact-1')).toBe('Signal Follow-up');
  });
});
