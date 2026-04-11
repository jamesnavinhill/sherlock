import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import type { TimelineSavedView } from '@/components/features/Timeline/timelineSavedViews';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { WorkspaceHome } from './index';

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

const { getWorkspaceTimelineSavedViews } = vi.hoisted(() => ({
  getWorkspaceTimelineSavedViews: vi.fn(),
}));

vi.mock('@/components/features/Timeline/timelineSavedViews', async () => {
  const actual = await vi.importActual('@/components/features/Timeline/timelineSavedViews');

  return {
    ...actual,
    getWorkspaceTimelineSavedViews,
  };
});

describe('WorkspaceHome', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    getWorkspaceTimelineSavedViews.mockReset();

    const savedViews: TimelineSavedView[] = [
      {
        id: 'view-1',
        workspaceId: 'ws-1',
        title: 'Timeline: supplier watch',
        query: {
          search: 'supplier',
          filters: {
            range: '30D',
            tracks: ['SIGNAL', 'RUN'],
          },
          focusedTrack: 'ALL',
          focusedRefId: undefined,
        },
        createdAt: 5,
        updatedAt: 10,
      },
    ];

    getWorkspaceTimelineSavedViews.mockResolvedValue(savedViews);

    useWorkspaceStore.setState({
      workspaces: [
        {
          id: 'ws-1',
          title: 'Atlas Workspace',
          displayTitle: 'Atlas Workspace',
          launchTopic: 'Strategic procurement exposure',
          launchAngle: 'Critical suppliers under pressure',
          prioritySourcesSummary: 'sec.gov, reuters.com',
          status: 'ACTIVE',
          dateOpened: '2026-04-01',
          description: 'Procurement activity across strategic vendors.',
        },
      ],
      artifacts: [
        {
          id: 'artifact-1',
          workspaceId: 'ws-1',
          topic: 'Supplier baseline',
          artifactType: 'SYNTHESIS',
          summary: 'Baseline summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: 'artifact body',
          createdAt: 4,
        },
      ],
      chatSessions: [
        {
          id: 'chat-1',
          workspaceId: 'ws-1',
          title: 'Atlas follow-up',
          status: 'ACTIVE',
          createdAt: 7,
          updatedAt: 8,
        },
      ],
      headlines: [
        {
          id: 'signal-1',
          workspaceId: 'ws-1',
          content: 'Recent vendor movement',
          source: 'Reuters',
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
          title: 'Working notes',
          createdAt: 2,
          updatedAt: 6,
        },
      ],
      workspaceRuns: [
        {
          id: 'run-1',
          workspaceId: 'ws-1',
          topic: 'Supplier review',
          status: 'COMPLETED',
          startTime: 3,
          endTime: 9,
        },
      ],
      workspaceBoards: [
        {
          id: 'board-1',
          workspaceId: 'ws-1',
          name: 'Primary Board',
          sortOrder: 0,
          createdAt: 1,
          updatedAt: 5,
        },
      ],
      workspaceBoardDocuments: {
        'board-1': {
          boardId: 'board-1',
          snapshot: { nodes: [] },
          updatedAt: 11,
        },
      },
    });
  });

  it('renders the readiness summary, recent activity, saved views, and quick links', async () => {
    render(
      <MemoryRouter future={routerFuture}>
        <WorkspaceHome workspaceId="ws-1" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getWorkspaceTimelineSavedViews).toHaveBeenCalledWith('ws-1');
    });

    const savedViewLink = await screen.findByRole('link', {
      name: /timeline: supplier watch/i,
    });

    expect(screen.getByTestId('workspace-home-dot-grid-background')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Atlas Workspace' })).toBeInTheDocument();
    expect(screen.getByText('Procurement activity across strategic vendors.')).toBeInTheDocument();
    expect(screen.getByText('Artifacts')).toBeInTheDocument();
    expect(screen.getByText('Signals')).toBeInTheDocument();
    expect(screen.getByText('Resume Chat')).toBeInTheDocument();
    expect(screen.getByText('Recent vendor movement')).toBeInTheDocument();
    expect(screen.getByText('Critical suppliers under pressure')).toBeInTheDocument();
    expect(screen.getByText('sec.gov, reuters.com')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /resume chat/i })).toHaveAttribute(
      'href',
      '/workspaces/ws-1/chat/chat-1'
    );
    expect(savedViewLink).toHaveAttribute('href', expect.stringContaining('/workspaces/ws-1/timeline?'));
  });
});
