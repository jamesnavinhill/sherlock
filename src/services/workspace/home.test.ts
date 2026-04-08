import { describe, expect, it } from 'vitest';

import type { TimelineSavedView } from '@/components/features/Timeline/timelineSavedViews';
import { buildWorkspaceHomeSnapshot } from './home';

describe('workspace home readiness model', () => {
  it('builds summary counts, saved views, and recent activity for a workspace', () => {
    const workspace = {
      id: 'ws-1',
      title: 'Operation: Atlas',
      displayTitle: 'Atlas Procurement',
      launchTopic: 'Atlas shell companies',
      launchAngle: 'Follow procurement anomalies',
      prioritySourcesSummary: 'SEC filings, tender records',
      status: 'ACTIVE' as const,
      dateOpened: '2026-04-07',
      description: 'Procurement review workspace',
    };
    const savedViews: TimelineSavedView[] = [
      {
        id: 'view-1',
        workspaceId: 'ws-1',
        title: 'Timeline: anomalies',
        createdAt: 10,
        updatedAt: 80,
        query: {
          search: 'anomalies',
          filters: {
            range: '30D',
            tracks: ['SIGNAL', 'ARTIFACT'],
          },
          focusedTrack: 'ALL',
        },
      },
    ];

    const snapshot = buildWorkspaceHomeSnapshot({
      workspace,
      savedViews,
      artifacts: [
        {
          id: 'artifact-1',
          caseId: 'ws-1',
          topic: 'Atlas baseline',
          summary: 'Baseline summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: 'baseline',
          createdAt: 50,
        },
      ],
      chatSessions: [
        {
          id: 'chat-1',
          workspaceId: 'ws-1',
          title: 'Atlas Chat',
          status: 'ACTIVE',
          createdAt: 20,
          updatedAt: 90,
        },
      ],
      headlines: [
        {
          id: 'headline-1',
          caseId: 'ws-1',
          content: 'Contract update detected',
          source: 'Ledger',
          timestamp: '2026-04-08T10:00:00.000Z',
          type: 'NEWS',
          status: 'PENDING',
          threatLevel: 'CAUTION',
        },
      ],
      workspaceItems: [
        {
          id: 'item-1',
          workspaceId: 'ws-1',
          kind: 'NOTE',
          title: 'Lead note',
          createdAt: 40,
          updatedAt: 95,
        },
      ],
      workspaceRuns: [
        {
          id: 'run-1',
          topic: 'Atlas deep dive',
          status: 'COMPLETED',
          startTime: 30,
          endTime: 70,
          workspaceId: 'ws-1',
        },
      ],
      workspaceBoards: [
        {
          id: 'board-1',
          workspaceId: 'ws-1',
          name: 'Primary Board',
          sortOrder: 0,
          createdAt: 5,
          updatedAt: 60,
        },
      ],
      workspaceBoardDocuments: {
        'board-1': {
          boardId: 'board-1',
          snapshot: { page: 1 },
          updatedAt: 100,
        },
      },
    });

    expect(snapshot.summary.title).toBe('Atlas Procurement');
    expect(snapshot.summary.launchTopic).toBe('Atlas shell companies');
    expect(snapshot.summary.counts).toEqual({
      artifacts: 1,
      items: 1,
      signals: 1,
      chats: 1,
      runs: 1,
      boards: 1,
      boardsWithSnapshots: 1,
    });
    expect(snapshot.summary.boardState).toEqual({
      count: 1,
      boardsWithSnapshots: 1,
      lastActivityAt: 100,
    });
    expect(snapshot.savedViews).toEqual([
      expect.objectContaining({
        id: 'view-1',
        workspaceId: 'ws-1',
        title: 'Timeline: anomalies',
      }),
    ]);
    expect(snapshot.recentActivity.map((entry) => entry.kind)).toEqual([
      'SIGNAL',
      'BOARD',
      'ITEM',
      'CHAT',
      'RUN',
      'ARTIFACT',
    ]);
  });
});
