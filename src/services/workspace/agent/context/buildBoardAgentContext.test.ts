import { describe, expect, it } from 'vitest';
import { buildBoardAgentContext } from './buildBoardAgentContext';
import { BOARD_AGENT_REF_META_KEY } from './boardSnapshot';

describe('buildBoardAgentContext', () => {
  it('builds bounded prompt parts from the board snapshot and linked records', () => {
    const result = buildBoardAgentContext({
      workspace: {
        id: 'case-1',
        title: 'Atlas Workspace',
        status: 'ACTIVE',
        dateOpened: '2026-04-05',
        description: 'Cross-border network mapping',
      },
      board: {
        id: 'board-1',
        workspaceId: 'case-1',
        name: 'Primary Board',
        sortOrder: 0,
        createdAt: 1,
        updatedAt: 1,
      },
      boardDocument: {
        boardId: 'board-1',
        snapshot: {
          store: {
            'shape:1': {
              id: 'shape:1',
              type: 'geo',
              x: 100,
              y: 80,
              meta: {
                [BOARD_AGENT_REF_META_KEY]: JSON.stringify({
                  workspaceId: 'case-1',
                  refKind: 'ARTIFACT',
                  refId: 'rep-1',
                  title: 'Atlas Brief',
                }),
              },
              props: {
                w: 300,
                h: 220,
                richText: { content: [{ text: 'Atlas Brief' }, { text: 'Key findings' }] },
              },
            },
            'shape:2': {
              id: 'shape:2',
              type: 'geo',
              x: 980,
              y: 820,
              meta: {
                [BOARD_AGENT_REF_META_KEY]: JSON.stringify({
                  workspaceId: 'case-1',
                  refKind: 'HEADLINE',
                  refId: 'head-1',
                  title: 'Desk',
                }),
              },
              props: {
                w: 260,
                h: 180,
                text: 'Peripheral signal',
              },
            },
          },
        },
        updatedAt: 2,
      },
      userRequest: 'Organize the visible evidence into a working cluster.',
      selectedShapeIds: ['shape:1'],
      viewportBounds: {
        x: 0,
        y: 0,
        w: 640,
        h: 480,
      },
      artifacts: [
        {
          id: 'rep-1',
          caseId: 'case-1',
          topic: 'Atlas Brief',
          summary: 'A concise report on the Atlas network.',
          agendas: [],
          leads: [],
          entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
          sources: [{ title: 'Registry filing', url: 'https://example.com/registry' }],
          rawText: 'Long form artifact text',
          artifactType: 'BRIEF',
        },
      ],
      headlines: [
        {
          id: 'head-1',
          caseId: 'case-1',
          content: 'New filing ties Atlas to a regional broker.',
          source: 'Desk',
          timestamp: '2026-04-05T00:00:00.000Z',
          type: 'NEWS',
          status: 'PENDING',
          threatLevel: 'CAUTION',
        },
      ],
      workspaceItems: [
        {
          id: 'note-1',
          workspaceId: 'case-1',
          kind: 'NOTE',
          title: 'Hypothesis',
          description: 'Broker may be acting as intermediary.',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      recentActions: [
        {
          id: 'action-1',
          sessionId: 'session-1',
          workspaceId: 'case-1',
          boardId: 'board-1',
          type: 'PLACE_LINKED_CARD',
          status: 'COMPLETED',
          result: { shapeId: 'shape:1' },
          createdAt: 3,
          updatedAt: 4,
        },
      ],
    });

    expect(result.shapes).toHaveLength(2);
    expect(result.selectedShapes.map((shape) => shape.id)).toEqual(['shape:1']);
    expect(result.visibleShapes.map((shape) => shape.id)).toEqual(['shape:1']);
    expect(result.peripheralShapes.map((shape) => shape.id)).toEqual(['shape:2']);
    expect(result.snapshot.parts.map((part) => part.kind)).toEqual(
      expect.arrayContaining([
        'USER_REQUEST',
        'SELECTION_SUMMARY',
        'VISIBLE_SHAPE_SUMMARY',
        'PERIPHERAL_CLUSTER_SUMMARY',
        'LINKED_RECORD_SUMMARY',
        'RECENT_AGENT_HISTORY',
        'SYSTEM_METADATA',
      ])
    );
    expect(
      result.snapshot.parts.find((part) => part.kind === 'LINKED_RECORD_SUMMARY')?.content
    ).toContain('Atlas Brief');
    expect(result.snapshot.metadata).toEqual(
      expect.objectContaining({
        totalShapeCount: 2,
        linkedShapeCount: 2,
      })
    );
  });
});
