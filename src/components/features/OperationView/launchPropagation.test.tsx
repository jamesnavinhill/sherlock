import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Artifact, WorkspaceRun } from '../../../types';
import { useWorkspaceStore } from '../../../store/workspaceStore';

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
const flushMicrotasks = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

vi.mock('./Toolbar', () => ({
  Toolbar: ({ onOpenChat }: { onOpenChat?: () => void }) => (
    <button data-testid="operation-open-chat" onClick={() => onOpenChat?.()}>
      Open Chat
    </button>
  ),
}));

vi.mock('./WorkspaceLibraryRail', () => ({
  WorkspaceLibraryRail: ({
    onHeadlineClick,
  }: {
    onHeadlineClick: (headline: {
      id: string;
      content: string;
      workspaceId: string;
      source: string;
      timestamp: string;
      type: 'NEWS';
      status: 'PENDING';
      threatLevel: 'INFO';
    }) => void;
  }) => (
    <button
      data-testid="select-headline"
      onClick={() =>
        onHeadlineClick({
          id: 'headline-1',
          workspaceId: 'case-1',
          content: 'Suspicious contract amendment detected',
          source: 'Ledger',
          timestamp: '2026-02-07T00:00:00.000Z',
          type: 'NEWS',
          status: 'PENDING',
          threatLevel: 'INFO',
        })
      }
    >
      Select Headline
    </button>
  ),
}));

vi.mock('./ArtifactViewer', () => ({
  ArtifactViewer: ({
    onLeadOpen,
  }: {
    onLeadOpen: (followUp: {
      id: string;
      kind: 'TASK';
      title: string;
      actionText: string;
      status: 'OPEN';
    }) => void;
  }) => (
    <button
      data-testid="report-open-lead"
      onClick={() =>
        onLeadOpen({
          id: 'follow-up-1',
          kind: 'TASK',
          title: 'Trace vendor ownership',
          actionText: 'Trace vendor ownership',
          status: 'OPEN',
        })
      }
    >
      Open Lead
    </button>
  ),
}));

vi.mock('./OperationInspectorPanel', () => ({
  OperationInspectorPanel: ({
    onInvestigateEntity,
    onInvestigateHeadline,
    onOpenEntityChat,
    onOpenHeadlineChat,
  }: {
    onInvestigateEntity: (entity: string) => void;
    onInvestigateHeadline: () => void;
    onOpenEntityChat?: (entity: string) => void;
    onOpenHeadlineChat?: () => void;
  }) => (
    <>
      <button data-testid="inspect-entity" onClick={() => onInvestigateEntity('Atlas Holdings')}>
        Investigate Entity
      </button>
      <button data-testid="inspect-headline" onClick={() => onInvestigateHeadline()}>
        Investigate Headline
      </button>
      <button
        data-testid="inspect-entity-chat"
        onClick={() => onOpenEntityChat?.('Atlas Holdings')}
      >
        Open Entity Chat
      </button>
      <button data-testid="inspect-headline-chat" onClick={() => onOpenHeadlineChat?.()}>
        Open Headline Chat
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
      data-testid="operation-modal-start"
      onClick={() =>
        onStart(
          'Entity investigation from modal',
          {
            provider: 'OPENAI',
            modelId: 'gpt-4.1-mini',
            thinkingBudget: 0,
          },
          undefined,
          undefined,
          undefined
        )
      }
    >
      Start Modal Investigation
    </button>
  ),
}));

vi.mock('../../ui/BackgroundMatrixRain', () => ({
  BackgroundMatrixRain: () => null,
}));

import { OperationView } from './index';

const reportFixture: Artifact = {
  id: 'report-1',
  workspaceId: 'case-1',
  topic: 'Atlas Contract Network',
  summary: 'Initial summary',
  agendas: ['Agenda 1'],
  leads: ['Lead 1'],
  followUps: [
    {
      id: 'follow-up-1',
      originArtifactId: 'report-1',
      kind: 'TASK',
      title: 'Trace vendor ownership',
      actionText: 'Trace vendor ownership',
      status: 'OPEN',
    },
  ],
  entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
  sources: [{ title: 'Registry', url: 'https://example.com/registry' }],
  rawText: '{}',
  config: {
    provider: 'GEMINI',
    modelId: 'gemini-3-flash-preview',
    persona: 'general-investigator',
    searchDepth: 'DEEP',
    thinkingBudget: 1024,
    scopeId: 'open-investigation',
    dateRangeOverride: { start: '2025-01-01', end: '2025-12-31' },
  },
};

const taskFixture: WorkspaceRun = {
  id: 'task-1',
  topic: reportFixture.topic,
  status: 'COMPLETED',
  startTime: Date.now(),
  report: reportFixture,
};

describe('OperationView launch propagation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    useWorkspaceStore.setState({
      activeWorkspaceId: 'case-1',
      workspaces: [
        {
          id: 'case-1',
          title: 'Operation: Atlas',
          status: 'ACTIVE',
          dateOpened: '2026-02-07',
          description: 'Procurement case',
        },
      ],
      artifacts: [reportFixture],
      headlines: [
        {
          id: 'headline-1',
          workspaceId: 'case-1',
          content: 'Suspicious contract amendment detected',
          source: 'Ledger',
          timestamp: '2026-02-07T00:00:00.000Z',
          type: 'NEWS',
          status: 'PENDING',
          threatLevel: 'INFO',
        },
      ],
      customScopes: [],
    });
  });

  it('propagates report lead launches through the modal flow with inherited report config', async () => {
    const onDeepDive = vi.fn();

    render(
      <MemoryRouter future={routerFuture}>
        <OperationView
          task={taskFixture}
          onBack={vi.fn()}
          onDeepDive={onDeepDive}
          navStack={[]}
          onNavigate={vi.fn()}
          onStartNewCase={vi.fn()}
          onInvestigateHeadline={vi.fn()}
          onOpenChat={vi.fn()}
        />
      </MemoryRouter>
    );

    await flushMicrotasks();

    fireEvent.click(screen.getByTestId('report-open-lead'));
    fireEvent.click(screen.getByTestId('operation-modal-start'));

    expect(onDeepDive).toHaveBeenCalledTimes(1);
    expect(onDeepDive).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'Entity investigation from modal',
        launchSource: 'OPERATION_LEAD_MODAL',
        parentArtifactId: 'report-1',
        sourceFollowUpId: 'follow-up-1',
        parentContext: {
          topic: reportFixture.topic,
          summary: reportFixture.summary,
        },
        configOverride: expect.objectContaining({
          provider: 'OPENAI',
          modelId: 'gpt-4.1-mini',
          searchDepth: 'DEEP',
        }),
        scope: expect.objectContaining({ id: 'open-investigation' }),
        dateRangeOverride: { start: '2025-01-01', end: '2025-12-31' },
      })
    );
  });

  it('propagates headline investigate launches from inspector', async () => {
    const onInvestigateHeadline = vi.fn();

    render(
      <MemoryRouter future={routerFuture}>
        <OperationView
          task={taskFixture}
          onBack={vi.fn()}
          onDeepDive={vi.fn()}
          navStack={[]}
          onNavigate={vi.fn()}
          onStartNewCase={vi.fn()}
          onInvestigateHeadline={onInvestigateHeadline}
          onOpenChat={vi.fn()}
        />
      </MemoryRouter>
    );

    await flushMicrotasks();

    fireEvent.click(screen.getByTestId('select-headline'));
    await flushMicrotasks();
    fireEvent.click(screen.getByTestId('inspect-headline'));

    expect(onInvestigateHeadline).toHaveBeenCalledTimes(1);
    expect(onInvestigateHeadline).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'Suspicious contract amendment detected',
        launchSource: 'OPERATION_HEADLINE',
        scope: expect.objectContaining({ id: 'open-investigation' }),
      })
    );
  });

  it('propagates entity investigate launches through lead modal overrides', async () => {
    const onDeepDive = vi.fn();

    render(
      <MemoryRouter future={routerFuture}>
        <OperationView
          task={taskFixture}
          onBack={vi.fn()}
          onDeepDive={onDeepDive}
          navStack={[]}
          onNavigate={vi.fn()}
          onStartNewCase={vi.fn()}
          onInvestigateHeadline={vi.fn()}
          onOpenChat={vi.fn()}
        />
      </MemoryRouter>
    );

    await flushMicrotasks();

    fireEvent.click(screen.getByTestId('inspect-entity'));
    fireEvent.click(screen.getByTestId('operation-modal-start'));

    expect(onDeepDive).toHaveBeenCalledTimes(1);
    expect(onDeepDive).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'Entity investigation from modal',
        launchSource: 'OPERATION_LEAD_MODAL',
        configOverride: expect.objectContaining({
          provider: 'OPENAI',
          modelId: 'gpt-4.1-mini',
          searchDepth: 'DEEP',
        }),
        scope: expect.objectContaining({ id: 'open-investigation' }),
        dateRangeOverride: { start: '2025-01-01', end: '2025-12-31' },
      })
    );
  });

  it('propagates report and inspector chat launches with grounding context', async () => {
    const onOpenChat = vi.fn();

    render(
      <MemoryRouter future={routerFuture}>
        <OperationView
          task={taskFixture}
          onBack={vi.fn()}
          onDeepDive={vi.fn()}
          navStack={[]}
          onNavigate={vi.fn()}
          onStartNewCase={vi.fn()}
          onInvestigateHeadline={vi.fn()}
          onOpenChat={onOpenChat}
        />
      </MemoryRouter>
    );

    await flushMicrotasks();

    fireEvent.click(screen.getByTestId('operation-open-chat'));
    fireEvent.click(screen.getByTestId('select-headline'));
    await flushMicrotasks();
    fireEvent.click(screen.getByTestId('inspect-headline-chat'));
    fireEvent.click(screen.getByTestId('inspect-entity-chat'));

    expect(onOpenChat).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        workspaceId: 'case-1',
        launchContext: {
          sourceArtifactId: 'report-1',
        },
      })
    );
    expect(onOpenChat).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        workspaceId: 'case-1',
        launchContext: expect.objectContaining({
          headlineId: 'headline-1',
          signalId: 'headline-1',
        }),
      })
    );
    expect(onOpenChat).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        workspaceId: 'case-1',
        launchContext: expect.objectContaining({
          entityName: 'Atlas Holdings',
          sourceArtifactId: 'report-1',
        }),
      })
    );
  });
});
