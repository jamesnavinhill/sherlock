import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Artifact, WorkspaceRun } from '../../../types';
import { useWorkspaceStore } from '../../../store/caseStore';

vi.mock('./Toolbar', () => ({
  Toolbar: ({ onOpenChat }: { onOpenChat?: () => void }) => (
    <button data-testid="operation-open-chat" onClick={() => onOpenChat?.()}>
      Open Chat
    </button>
  ),
}));

vi.mock('./DossierPanel', () => ({
  DossierPanel: ({
    onHeadlineClick,
  }: {
    onHeadlineClick: (headline: {
      id: string;
      content: string;
      caseId: string;
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
          caseId: 'case-1',
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

vi.mock('./ReportViewer', () => ({
  ReportViewer: ({
    onDeepDive,
  }: {
    onDeepDive: (followUp: {
      id: string;
      kind: 'TASK';
      title: string;
      actionText: string;
      status: 'OPEN';
    }) => void;
  }) => (
    <button
      data-testid="report-deep-dive"
      onClick={() =>
        onDeepDive({
          id: 'follow-up-1',
          kind: 'TASK',
          title: 'Trace vendor ownership',
          actionText: 'Trace vendor ownership',
          status: 'OPEN',
        })
      }
    >
      Deep Dive
    </button>
  ),
}));

vi.mock('./InspectorPanel', () => ({
  InspectorPanel: ({
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

vi.mock('../Runs/TaskSetupModal', () => ({
  TaskSetupModal: ({
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
  caseId: 'case-1',
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
          caseId: 'case-1',
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

  it('propagates deep-dive launches with inherited report config', () => {
    const onDeepDive = vi.fn();

    render(
      <MemoryRouter>
        <OperationView
          task={taskFixture}
          onBack={vi.fn()}
          onDeepDive={onDeepDive}
          onBatchDeepDive={vi.fn()}
          navStack={[]}
          onNavigate={vi.fn()}
          onStartNewCase={vi.fn()}
          onInvestigateHeadline={vi.fn()}
          onOpenChat={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('report-deep-dive'));

    expect(onDeepDive).toHaveBeenCalledTimes(1);
    expect(onDeepDive).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'Trace vendor ownership',
        launchSource: 'OPERATION_DEEP_DIVE',
        parentArtifactId: 'report-1',
        sourceFollowUpId: 'follow-up-1',
        parentContext: {
          topic: reportFixture.topic,
          summary: reportFixture.summary,
        },
        configOverride: expect.objectContaining({
          provider: 'GEMINI',
          modelId: 'gemini-3-flash-preview',
          searchDepth: 'DEEP',
        }),
        scope: expect.objectContaining({ id: 'open-investigation' }),
        dateRangeOverride: { start: '2025-01-01', end: '2025-12-31' },
      })
    );
  });

  it('propagates headline investigate launches from inspector', () => {
    const onInvestigateHeadline = vi.fn();

    render(
      <MemoryRouter>
        <OperationView
          task={taskFixture}
          onBack={vi.fn()}
          onDeepDive={vi.fn()}
          onBatchDeepDive={vi.fn()}
          navStack={[]}
          onNavigate={vi.fn()}
          onStartNewCase={vi.fn()}
          onInvestigateHeadline={onInvestigateHeadline}
          onOpenChat={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('select-headline'));
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

  it('propagates entity investigate launches through lead modal overrides', () => {
    const onDeepDive = vi.fn();

    render(
      <MemoryRouter>
        <OperationView
          task={taskFixture}
          onBack={vi.fn()}
          onDeepDive={onDeepDive}
          onBatchDeepDive={vi.fn()}
          navStack={[]}
          onNavigate={vi.fn()}
          onStartNewCase={vi.fn()}
          onInvestigateHeadline={vi.fn()}
          onOpenChat={vi.fn()}
        />
      </MemoryRouter>
    );

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

  it('propagates report and inspector chat launches with grounding context', () => {
    const onOpenChat = vi.fn();

    render(
      <MemoryRouter>
        <OperationView
          task={taskFixture}
          onBack={vi.fn()}
          onDeepDive={vi.fn()}
          onBatchDeepDive={vi.fn()}
          navStack={[]}
          onNavigate={vi.fn()}
          onStartNewCase={vi.fn()}
          onInvestigateHeadline={vi.fn()}
          onOpenChat={onOpenChat}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('operation-open-chat'));
    fireEvent.click(screen.getByTestId('select-headline'));
    fireEvent.click(screen.getByTestId('inspect-headline-chat'));
    fireEvent.click(screen.getByTestId('inspect-entity-chat'));

    expect(onOpenChat).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        workspaceId: 'case-1',
        launchContext: {
          sourceReportId: 'report-1',
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
        launchContext: {
          entityName: 'Atlas Holdings',
        },
      })
    );
  });
});
