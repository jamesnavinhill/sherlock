import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { requestNetworkEntityFocus } from '@/services/workspace/workspaceSurfaceFocus';

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
const focusNodeMock = vi.fn();

vi.mock('./ControlBar', () => ({
  ControlBar: () => null,
}));

vi.mock('./GraphCanvas', () => ({
  GraphCanvas: React.forwardRef(function GraphCanvasMock(
    _props,
    ref: React.ForwardedRef<{ focusNode: (nodeId: string) => void }>
  ) {
    React.useImperativeHandle(ref, () => ({
      focusNode: focusNodeMock,
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
    }));
    return null;
  }),
}));

vi.mock('./EntityResolution', () => ({
  EntityResolution: () => null,
  detectEntityClusters: () => [],
}));

vi.mock('../OperationView/WorkspaceLibraryRail', () => ({
  WorkspaceRail: () => null,
}));

vi.mock('./NetworkGraphInspectorPanel', () => ({
  NetworkGraphInspectorPanel: ({
    onInvestigate,
    onOpenEntityChat,
  }: {
    onInvestigate: (topic: string) => void;
    onOpenEntityChat?: (entityName: string) => void;
  }) => (
    <>
      <button
        data-testid="network-investigate-entity"
        onClick={() => onInvestigate('Atlas Holdings')}
      >
        Investigate Entity
      </button>
      <button data-testid="network-open-chat" onClick={() => onOpenEntityChat?.('Atlas Holdings')}>
        Open Entity Chat
      </button>
    </>
  ),
}));

vi.mock('../Runs/RunSetupModal', () => ({
  RunSetupModal: ({
    onStart,
  }: {
    onStart: (
      topic: string,
      configOverride: Record<string, unknown>,
      preseeded?: unknown,
      scope?: unknown,
      dateRange?: { start?: string; end?: string }
    ) => void;
  }) => (
    <button
      data-testid="network-modal-start"
      onClick={() =>
        onStart(
          'Entity follow-up from graph',
          {
            provider: 'OPENROUTER',
            modelId: 'stepfun/step-3.5-flash:free',
            persona: 'general-investigator',
            searchDepth: 'DEEP',
            thinkingBudget: 0,
          },
          undefined,
          undefined,
          { start: '2024-11-01', end: '2025-01-31' }
        )
      }
    >
      Start Graph Modal
    </button>
  ),
}));

import { NetworkGraph } from './index';

describe('NetworkGraph launch propagation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    focusNodeMock.mockReset();

    useWorkspaceStore.setState({
      activeWorkspaceId: 'case-1',
      activeScope: 'open-investigation',
      workspaces: [
        {
          id: 'case-1',
          title: 'Operation: Atlas',
          status: 'ACTIVE',
          dateOpened: '2026-02-07',
          description: 'Entity mapping case',
        },
      ],
      artifacts: [
        {
          id: 'report-1',
          workspaceId: 'case-1',
          topic: 'Atlas baseline',
          summary: 'Summary',
          agendas: [],
          leads: [],
          entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
          sources: [],
          rawText: '{}',
        },
      ],
      manualNodes: [],
      manualLinks: [],
      hiddenNodeIds: [],
      flaggedNodeIds: [],
      headlines: [],
      entityAliases: {},
    });
  });

  it('dispatches unified launch request for entity investigate from graph flow', () => {
    const onInvestigateEntity = vi.fn();

    render(
      <MemoryRouter future={routerFuture}>
        <NetworkGraph
          onOpenReport={vi.fn()}
          onInvestigateEntity={onInvestigateEntity}
          onOpenChat={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('network-investigate-entity'));
    fireEvent.click(screen.getByTestId('network-modal-start'));

    expect(onInvestigateEntity).toHaveBeenCalledTimes(1);
    expect(onInvestigateEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'Entity follow-up from graph',
        launchSource: 'NETWORK_GRAPH',
        parentContext: {
          topic: 'Operation: Atlas',
          summary: 'Entity mapping case',
        },
        configOverride: expect.objectContaining({
          provider: 'OPENROUTER',
          modelId: 'stepfun/step-3.5-flash:free',
        }),
        dateRangeOverride: {
          start: '2024-11-01',
          end: '2025-01-31',
        },
      })
    );
  });

  it('opens workspace chat with entity grounding from graph inspector', () => {
    const onOpenChat = vi.fn();

    render(
      <MemoryRouter future={routerFuture}>
        <NetworkGraph
          onOpenReport={vi.fn()}
          onInvestigateEntity={vi.fn()}
          onOpenChat={onOpenChat}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('network-open-chat'));

    expect(onOpenChat).toHaveBeenCalledWith({
      workspaceId: 'case-1',
      launchContext: {
        entityName: 'Atlas Holdings',
      },
    });
  });

  it('focuses the active entity in-place when the omnibox targets the current network surface', () => {
    render(
      <MemoryRouter future={routerFuture}>
        <NetworkGraph
          onOpenReport={vi.fn()}
          onInvestigateEntity={vi.fn()}
          onOpenChat={vi.fn()}
        />
      </MemoryRouter>
    );

    act(() => {
      requestNetworkEntityFocus({
        workspaceId: 'case-1',
        entityName: 'Atlas Holdings',
      });
    });

    expect(focusNodeMock).toHaveBeenCalledWith('entity-atlasholdings');
  });
});
