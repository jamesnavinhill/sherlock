import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useOperationViewInspectorState } from './useOperationViewInspectorState';

const flushMicrotasks = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('useOperationViewInspectorState', () => {
  it('opens headline-grounded chat from the extracted inspector seam', async () => {
    const onOpenChat = vi.fn();

    const { result } = renderHook(() =>
      useOperationViewInspectorState({
        activeWorkspace: {
          id: 'ws-1',
          title: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-08',
          description: 'Workspace summary',
        },
        artifactRouteState: undefined,
        closeLeftPanelForMobile: vi.fn(),
        effectiveWorkspaceId: 'ws-1',
        ensureWorkspaceBoard: vi.fn(async () => ({ id: 'board-1' })),
        navigate: vi.fn(),
        onInvestigateHeadline: vi.fn(),
        onInvestigateEntity: vi.fn(),
        onOpenChat,
        queueBoardPlacement: vi.fn(),
        artifact: {
          id: 'artifact-1',
          workspaceId: 'ws-1',
          topic: 'Atlas Report',
          summary: 'Summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: '',
          config: {},
        },
        resolveScope: vi.fn(),
        toConfigOverride: vi.fn(() => ({})),
      })
    );

    await flushMicrotasks();

    act(() => {
      result.current.handleHeadlineClick({
        id: 'signal-1',
        workspaceId: 'ws-1',
        content: 'Suspicious transfer',
        source: 'Ledger',
        timestamp: '2026-04-08T00:00:00.000Z',
        type: 'NEWS',
        status: 'PENDING',
        threatLevel: 'INFO',
      });
    });

    act(() => {
      result.current.handleOpenHeadlineChat();
    });

    expect(onOpenChat).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      launchContext: {
        signalId: 'signal-1',
        headlineId: 'signal-1',
      },
    });
    expect(result.current.rightPanelOpen).toBe(false);
  });

  it('queues canonical entity placement from the extracted inspector seam', async () => {
    const ensureWorkspaceBoard = vi.fn(async () => ({ id: 'board-1' }));
    const navigate = vi.fn();
    const queueBoardPlacement = vi.fn();

    const { result } = renderHook(() =>
      useOperationViewInspectorState({
        activeWorkspace: {
          id: 'ws-1',
          title: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-08',
        },
        artifactRouteState: undefined,
        closeLeftPanelForMobile: vi.fn(),
        effectiveWorkspaceId: 'ws-1',
        ensureWorkspaceBoard,
        navigate,
        onInvestigateHeadline: vi.fn(),
        onInvestigateEntity: vi.fn(),
        onOpenChat: vi.fn(),
        queueBoardPlacement,
        artifact: {
          id: 'artifact-1',
          workspaceId: 'ws-1',
          topic: 'Atlas Report',
          summary: 'Summary',
          agendas: [],
          leads: [],
          entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
          sources: [],
          rawText: '',
          config: {},
        },
        resolveScope: vi.fn(),
        toConfigOverride: vi.fn(() => ({})),
      })
    );

    act(() => {
      result.current.handleEntityClick({
        name: 'Atlas Holdings',
        type: 'ORGANIZATION',
      });
    });

    await act(async () => {
      await result.current.handlePlaceEntityOnBoard('Atlas Holdings');
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
