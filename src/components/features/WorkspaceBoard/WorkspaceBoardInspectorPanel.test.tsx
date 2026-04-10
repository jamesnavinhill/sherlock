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
  });
});
