import { describe, expect, it, vi } from 'vitest';

import {
  buildArtifactChatOpenRequest,
  buildWorkspaceItemChatOpenRequest,
  queueWorkspaceReferenceOnBoard,
} from './workspaceHandoffs';

describe('workspaceHandoffs', () => {
  it('builds artifact and provenance-aware item chat requests', () => {
    expect(
      buildArtifactChatOpenRequest({
        id: 'rep-1',
        caseId: 'ws-1',
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
        sourceReportId: 'rep-1',
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
          sourceReportId: 'rep-1',
        },
      })
    ).toEqual({
      workspaceId: 'ws-1',
      launchContext: {
        sourceReportId: 'rep-1',
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
        signalId: 'signal-1',
        headlineId: 'signal-1',
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
