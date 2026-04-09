import { describe, expect, it, vi } from 'vitest';

import {
  buildArtifactChatOpenRequest,
  buildEntityChatOpenRequest,
  buildKeyFindingBoardReference,
  buildKeyFindingChatOpenRequest,
  buildSignalChatOpenRequest,
  buildWorkspaceItemChatOpenRequest,
  queueWorkspaceReferenceOnBoard,
} from './workspaceHandoffs';

describe('workspaceHandoffs', () => {
  it('builds artifact and provenance-aware item chat requests', () => {
    expect(
      buildArtifactChatOpenRequest({
        id: 'rep-1',
        workspaceId: 'ws-1',
        topic: 'Atlas Brief',
        summary: 'Summary',
        agendas: [],
        leads: [],
        entities: [],
        sources: [],
        rawText: '',
      })
    ).toEqual({
      workspaceId: 'ws-1',
      launchContext: {
        sourceArtifactId: 'rep-1',
      },
    });

    expect(
      buildWorkspaceItemChatOpenRequest({
        id: 'item-1',
        workspaceId: 'ws-1',
        kind: 'NOTE',
        title: 'Atlas note',
        createdAt: 100,
        updatedAt: 100,
        provenance: {
          source: 'CHAT',
          sourceArtifactId: 'rep-1',
        },
      })
    ).toEqual({
      workspaceId: 'ws-1',
      launchContext: {
        workspaceItemId: 'item-1',
        sourceArtifactId: 'rep-1',
      },
    });

    expect(
      buildWorkspaceItemChatOpenRequest({
        id: 'item-2',
        workspaceId: 'ws-1',
        kind: 'NOTE',
        title: 'Atlas signal note',
        createdAt: 100,
        updatedAt: 100,
        provenance: {
          source: 'NETWORK',
          sourceSignalId: 'signal-1',
        },
      })
    ).toEqual({
      workspaceId: 'ws-1',
      launchContext: {
        workspaceItemId: 'item-2',
        signalId: 'signal-1',
        headlineId: 'signal-1',
      },
    });

    expect(
      buildWorkspaceItemChatOpenRequest({
        id: 'item-3',
        workspaceId: 'ws-1',
        kind: 'FILE',
        title: 'Atlas source packet',
        createdAt: 100,
        updatedAt: 100,
      })
    ).toEqual({
      workspaceId: 'ws-1',
      launchContext: {
        workspaceItemId: 'item-3',
        signalId: undefined,
        headlineId: undefined,
        sourceArtifactId: undefined,
      },
    });

    expect(
      buildWorkspaceItemChatOpenRequest({
        id: 'item-4',
        workspaceId: 'ws-1',
        kind: 'NOTE',
        title: 'Atlas finding note',
        createdAt: 100,
        updatedAt: 100,
        provenance: {
          source: 'CHAT',
          sourceArtifactId: 'rep-1',
          sourceFindingId: 'finding-1',
        },
      })
    ).toEqual({
      workspaceId: 'ws-1',
      launchContext: {
        workspaceItemId: 'item-4',
        sourceArtifactId: 'rep-1',
        keyFindingId: 'finding-1',
        signalId: undefined,
        headlineId: undefined,
      },
    });
  });

  it('builds entity and signal chat requests for shared surface handoffs', () => {
    expect(
      buildEntityChatOpenRequest({
        entityName: 'Atlas Holdings',
        relatedArtifactId: 'rep-1',
        workspaceId: 'ws-1',
      })
    ).toEqual({
      workspaceId: 'ws-1',
      launchContext: {
        entityName: 'Atlas Holdings',
        sourceArtifactId: 'rep-1',
      },
    });

    expect(
      buildSignalChatOpenRequest({
        id: 'signal-1',
        workspaceId: 'ws-1',
        content: 'Signal',
        source: 'Registry',
        timestamp: '2026-04-08T00:00:00.000Z',
        type: 'NEWS',
        status: 'PENDING',
        threatLevel: 'INFO',
      })
    ).toEqual({
      workspaceId: 'ws-1',
      launchContext: {
        signalId: 'signal-1',
        headlineId: 'signal-1',
      },
    });

    expect(
      buildKeyFindingChatOpenRequest({
        id: 'finding-1',
        workspaceId: 'ws-1',
        originArtifactId: 'rep-1',
        title: 'Atlas exposure is rising',
        summary: 'Supplier concentration increased.',
      })
    ).toEqual({
      workspaceId: 'ws-1',
      launchContext: {
        keyFindingId: 'finding-1',
        sourceArtifactId: 'rep-1',
      },
    });
  });

  it('builds finding board references for direct placement flows', () => {
    expect(
      buildKeyFindingBoardReference({
        id: 'finding-1',
        workspaceId: 'ws-1',
        originArtifactId: 'rep-1',
        originSectionId: 'sec-1',
        title: 'Atlas exposure is rising',
        summary: 'Supplier concentration increased.',
        supportRefs: ['Registry filing'],
      })
    ).toEqual({
      workspaceId: 'ws-1',
      refKind: 'KEY_FINDING',
      refId: 'finding-1',
      title: 'Atlas exposure is rising',
      metadata: {
        originArtifactId: 'rep-1',
        originSectionId: 'sec-1',
        supportRefs: ['Registry filing'],
      },
    });
  });

  it('queues a canonical reference onto the resolved workspace board', async () => {
    const ensureWorkspaceBoard = vi.fn().mockResolvedValue({ id: 'board-1' });
    const navigate = vi.fn();
    const queueBoardPlacement = vi.fn();

    await queueWorkspaceReferenceOnBoard({
      ensureWorkspaceBoard,
      navigate,
      queueBoardPlacement,
      reference: {
        workspaceId: 'ws-1',
        refKind: 'WORKSPACE_ITEM',
        refId: 'item-1',
        title: 'Atlas note',
      },
      workspaceId: 'ws-1',
    });

    expect(ensureWorkspaceBoard).toHaveBeenCalledWith('ws-1');
    expect(queueBoardPlacement).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      boardId: 'board-1',
      item: {
        workspaceId: 'ws-1',
        refKind: 'WORKSPACE_ITEM',
        refId: 'item-1',
        title: 'Atlas note',
      },
      openInBoard: true,
    });
    expect(navigate).toHaveBeenCalledWith('/workspaces/ws-1/board/board-1');
  });
});
