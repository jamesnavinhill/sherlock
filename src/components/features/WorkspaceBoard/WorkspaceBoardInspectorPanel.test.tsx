import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WorkspaceBoardInspectorPanel } from './WorkspaceBoardInspectorPanel';

describe('WorkspaceBoardInspectorPanel', () => {
  it('wraps long source descriptions inside the selection panel', () => {
    const sourceUrl =
      'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUzIYQGmurMWV4gNGnsgCdxK7Fq5HVLH0RsQ0MPWwCKieJJD5woLoa0zQtywWtSnxV7sJVXtEaf8KCmELOP22OpEJ7EPftjp9-Lc=';

    render(
      <WorkspaceBoardInspectorPanel
        isOpen
        tabs={[
          { id: 'AGENT', label: 'Agent' },
          { id: 'INSPECTOR', label: 'Inspector' },
        ]}
        activeTabId="INSPECTOR"
        onTabChange={vi.fn()}
        inspectorActions={[]}
        inspectorSections={{
          quickActions: true,
          selection: true,
          provenance: false,
        }}
        selectedEntries={[
          {
            workspaceId: 'ws-1',
            refKind: 'SOURCE',
            refId: 'source-1',
            title: 'medium.com',
            kind: 'SOURCE',
            description: sourceUrl,
            searchText: sourceUrl,
            url: sourceUrl,
            iconId: 'link',
          },
        ]}
        selectedWorkspaceItem={null}
        activeBoard={{
          id: 'board-1',
          workspaceId: 'ws-1',
          name: 'Primary Board',
          sortOrder: 0,
          createdAt: 1,
          updatedAt: 1,
        }}
        availableBoardsLength={2}
        aiBusy={false}
        onToggleQuickActions={vi.fn()}
        onToggleSelection={vi.fn()}
        onToggleProvenance={vi.fn()}
        onShowAgentAndGenerateSummary={vi.fn()}
        onShowAgentAndGenerateNote={vi.fn()}
        onOpenAgentStarterIntent={vi.fn()}
        onDeleteBoard={vi.fn()}
      />
    );

    expect(screen.getByText(sourceUrl)).toHaveClass('break-all');
    expect(screen.getByRole('button', { name: 'Agent' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inspector' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agent Quick Actions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate Summary' })).toHaveClass('w-full');
    expect(screen.getByRole('button', { name: 'Generate Summary' }).querySelector('svg')).toBeNull();
  });

  it('orders board agent quick actions in the requested top-to-bottom sequence', () => {
    render(
      <WorkspaceBoardInspectorPanel
        isOpen
        tabs={[
          { id: 'AGENT', label: 'Agent' },
          { id: 'INSPECTOR', label: 'Inspector' },
        ]}
        activeTabId="INSPECTOR"
        onTabChange={vi.fn()}
        inspectorActions={[]}
        inspectorSections={{
          quickActions: true,
          selection: false,
          provenance: false,
        }}
        selectedEntries={[
          {
            workspaceId: 'ws-1',
            refKind: 'ENTITY',
            refId: 'entity-1',
            title: 'Atlas',
            kind: 'ENTITY',
            searchText: 'Atlas',
            iconId: 'users',
          },
        ]}
        selectedWorkspaceItem={null}
        activeBoard={{
          id: 'board-1',
          workspaceId: 'ws-1',
          name: 'Primary Board',
          sortOrder: 0,
          createdAt: 1,
          updatedAt: 1,
        }}
        availableBoardsLength={2}
        aiBusy={false}
        onToggleQuickActions={vi.fn()}
        onToggleSelection={vi.fn()}
        onToggleProvenance={vi.fn()}
        onShowAgentAndGenerateSummary={vi.fn()}
        onShowAgentAndGenerateNote={vi.fn()}
        onOpenAgentStarterIntent={vi.fn()}
        onDeleteBoard={vi.fn()}
      />
    );

    const actionButtons = screen.getAllByRole('button').filter((button) =>
      [
        'Generate Summary',
        'Draft Note',
        'Prep briefing',
        'Cluster sources',
        'Organize evidence',
        'Find contradictions',
      ].includes(button.getAttribute('aria-label') || '')
    );

    expect(actionButtons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Generate Summary',
      'Draft Note',
      'Prep briefing',
      'Cluster sources',
      'Organize evidence',
      'Find contradictions',
    ]);
  });

  it('renders the primary inspector action row as fill-width grid buttons', () => {
    render(
      <WorkspaceBoardInspectorPanel
        isOpen
        tabs={[
          { id: 'AGENT', label: 'Agent' },
          { id: 'INSPECTOR', label: 'Inspector' },
        ]}
        activeTabId="INSPECTOR"
        onTabChange={vi.fn()}
        inspectorActions={[
          { id: 'open', label: 'Open', onClick: vi.fn() },
          { id: 'chat', label: 'Chat', onClick: vi.fn() },
          { id: 'timeline', label: 'Timeline', onClick: vi.fn() },
          { id: 'network', label: 'Network', onClick: vi.fn() },
        ]}
        inspectorSections={{
          quickActions: false,
          selection: false,
          provenance: false,
        }}
        selectedEntries={[]}
        selectedWorkspaceItem={null}
        activeBoard={{
          id: 'board-1',
          workspaceId: 'ws-1',
          name: 'Primary Board',
          sortOrder: 0,
          createdAt: 1,
          updatedAt: 1,
        }}
        availableBoardsLength={2}
        aiBusy={false}
        onToggleQuickActions={vi.fn()}
        onToggleSelection={vi.fn()}
        onToggleProvenance={vi.fn()}
        onShowAgentAndGenerateSummary={vi.fn()}
        onShowAgentAndGenerateNote={vi.fn()}
        onOpenAgentStarterIntent={vi.fn()}
        onDeleteBoard={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Open' })).toHaveClass('w-full');
    expect(screen.getByRole('button', { name: 'Chat' })).toHaveClass('w-full');
    expect(screen.getByRole('button', { name: 'Timeline' })).toHaveClass('w-full');
    expect(screen.getByRole('button', { name: 'Network' })).toHaveClass('w-full');
  });
});
