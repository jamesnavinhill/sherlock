import { describe, expect, it, vi } from 'vitest';

import {
  openEntityGraphChat,
  openHeadlineGraphChat,
  openReportGraphChat,
  placeEntityOnWorkspaceBoard,
} from './networkGraphWorkspaceHandoffs';

describe('networkGraphWorkspaceHandoffs', () => {
  it('opens canonical chat requests for entity, artifact, and signal graph actions', () => {
    const onOpenChat = vi.fn();

    openEntityGraphChat({
      entityName: 'Atlas Holdings',
      onOpenChat,
      workspaceId: 'ws-1',
    });
    openReportGraphChat({
      onOpenChat,
      report: {
        id: 'rep-1',
        workspaceId: 'ws-1',
        topic: 'Atlas Brief',
        summary: 'Summary',
        agendas: [],
        leads: [],
        entities: [],
        sources: [],
        rawText: '',
      },
    });
    openHeadlineGraphChat({
      headline: {
        id: 'signal-1',
        workspaceId: 'ws-1',
        content: 'Suspicious transfer',
        source: 'Ledger',
        timestamp: '2026-04-08T00:00:00.000Z',
        type: 'NEWS',
        status: 'PENDING',
        threatLevel: 'INFO',
      },
      onOpenChat,
    });

    expect(onOpenChat.mock.calls).toEqual([
      [
        {
          workspaceId: 'ws-1',
          launchContext: {
            entityName: 'Atlas Holdings',
          },
        },
      ],
      [
        {
          workspaceId: 'ws-1',
          launchContext: {
            sourceArtifactId: 'rep-1',
          },
        },
      ],
      [
        {
          workspaceId: 'ws-1',
          launchContext: {
            signalId: 'signal-1',
            headlineId: 'signal-1',
          },
        },
      ],
    ]);
  });

  it('places graph entities on the workspace board through the shared queue helper', async () => {
    const ensureWorkspaceBoard = vi.fn().mockResolvedValue({ id: 'board-1' });
    const navigate = vi.fn();
    const queueBoardPlacement = vi.fn();

    await placeEntityOnWorkspaceBoard({
      ensureWorkspaceBoard,
      entityName: 'Atlas Holdings',
      navigate,
      queueBoardPlacement,
      workspaceId: 'ws-1',
    });

    expect(ensureWorkspaceBoard).toHaveBeenCalledWith('ws-1');
    expect(queueBoardPlacement).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      boardId: 'board-1',
      item: {
        workspaceId: 'ws-1',
        refKind: 'ENTITY',
        refId: 'entity:atlas-holdings',
        title: 'Atlas Holdings',
        metadata: {
          entityType: 'UNKNOWN',
          role: undefined,
        },
      },
      openInBoard: true,
      mode: undefined,
    });
    expect(navigate).toHaveBeenCalledWith('/workspaces/ws-1/board/board-1');
  });
});
