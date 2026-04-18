import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Artifact, Entity } from '@/types';
import type { GraphNode } from './GraphCanvas';
import { NetworkGraphInspectorPanel } from './NetworkGraphInspectorPanel';

describe('NetworkGraphInspectorPanel', () => {
  it('labels report follow-up actions as open', () => {
    const report: Artifact = {
      id: 'report-1',
      workspaceId: 'workspace-1',
      topic: 'Artifact Topic',
      summary: 'Artifact summary',
      agendas: [],
      leads: ['Trace shared directors across the vendor cluster.'],
      entities: [],
      sources: [],
      rawText: 'raw text',
      labelProfileId: 'research',
    };
    const selectedNode: GraphNode = {
      id: 'report-node-1',
      type: 'REPORT',
      label: 'Artifact Topic',
      connections: 1,
      data: report,
    };

    const { container } = render(
      <NetworkGraphInspectorPanel
        isOpen
        onClose={vi.fn()}
        mode="REPORT"
        selectedNode={selectedNode}
        selectedEntity={null}
        selectedHeadline={null}
        selectedReport={report}
        reports={[report]}
        hiddenNodeIds={new Set()}
        flaggedNodeIds={new Set()}
        onEntitySave={vi.fn()}
        onReportSave={vi.fn()}
        onToggleFlag={vi.fn()}
        onToggleHide={vi.fn()}
        onDeleteNode={vi.fn()}
        onSetManualNodeIcon={vi.fn()}
        onInvestigate={vi.fn()}
        onOpenReport={vi.fn()}
        onOpenEntityChat={vi.fn()}
        onOpenReportChat={vi.fn()}
        onOpenHeadlineChat={vi.fn()}
        onPlaceEntityOnBoard={vi.fn()}
        onPlaceReportOnBoard={vi.fn()}
        onPlaceHeadlineOnBoard={vi.fn()}
      />
    );

    const followUpAccordion = screen.getByRole('button', { name: /Follow-up Questions/i });
    fireEvent.click(followUpAccordion);

    const followUpCard = screen
      .getByText('Trace shared directors across the vendor cluster.')
      .closest('div');

    expect(followUpCard).not.toBeNull();
    expect(
      within(followUpCard as HTMLElement).getByRole('button', { name: 'Investigate follow-up' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Investigate' })).not.toBeInTheDocument();
    expect(container.querySelector('aside')).toHaveStyle({
      '--osint-dock-width': 'min(var(--osint-shell-rail-width),calc(100vw - 1rem))',
    });
  });

  it('starts the node summary accordion collapsed and still allows it to close fully after opening', () => {
    const entity: Entity = {
      name: 'Atlas Holdings',
      type: 'ORGANIZATION',
      role: 'Procurement intermediary',
      sentiment: 'NEGATIVE',
    };
    const report: Artifact = {
      id: 'report-1',
      workspaceId: 'workspace-1',
      topic: 'Artifact Topic',
      summary: 'Artifact summary',
      agendas: [],
      leads: [],
      entities: [
        entity,
        {
          name: 'Letta',
          type: 'ORGANIZATION',
        },
      ],
      sources: [],
      rawText: 'raw text',
      labelProfileId: 'research',
    };
    const selectedNode: GraphNode = {
      id: 'entity-node-1',
      type: 'ENTITY',
      label: entity.name,
      connections: 1,
    };

    render(
      <NetworkGraphInspectorPanel
        isOpen
        onClose={vi.fn()}
        mode="ENTITY"
        selectedNode={selectedNode}
        selectedEntity={entity.name}
        selectedHeadline={null}
        selectedReport={null}
        reports={[report]}
        hiddenNodeIds={new Set()}
        flaggedNodeIds={new Set()}
        onEntitySave={vi.fn()}
        onReportSave={vi.fn()}
        onToggleFlag={vi.fn()}
        onToggleHide={vi.fn()}
        onDeleteNode={vi.fn()}
        onSetManualNodeIcon={vi.fn()}
        onInvestigate={vi.fn()}
        onOpenReport={vi.fn()}
        onOpenEntityChat={vi.fn()}
        onOpenReportChat={vi.fn()}
        onOpenHeadlineChat={vi.fn()}
        onPlaceEntityOnBoard={vi.fn()}
        onPlaceReportOnBoard={vi.fn()}
        onPlaceHeadlineOnBoard={vi.fn()}
      />
    );

    expect(screen.queryByText('Procurement intermediary')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Node Summary/i }));
    expect(screen.getByText('Procurement intermediary')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Node Summary/i }));

    expect(screen.queryByText('Procurement intermediary')).not.toBeInTheDocument();
  });

  it('renders network connection counts without the links badge copy', () => {
    const entity: Entity = {
      name: 'Atlas Holdings',
      type: 'ORGANIZATION',
    };
    const report: Artifact = {
      id: 'report-1',
      workspaceId: 'workspace-1',
      topic: 'Artifact Topic',
      summary: 'Artifact summary',
      agendas: [],
      leads: [],
      entities: [
        entity,
        {
          name: 'Letta',
          type: 'ORGANIZATION',
        },
      ],
      sources: [],
      rawText: 'raw text',
      labelProfileId: 'research',
    };
    const selectedNode: GraphNode = {
      id: 'entity-node-1',
      type: 'ENTITY',
      label: entity.name,
      connections: 1,
    };

    render(
      <NetworkGraphInspectorPanel
        isOpen
        onClose={vi.fn()}
        mode="ENTITY"
        selectedNode={selectedNode}
        selectedEntity={entity.name}
        selectedHeadline={null}
        selectedReport={null}
        reports={[report]}
        hiddenNodeIds={new Set()}
        flaggedNodeIds={new Set()}
        onEntitySave={vi.fn()}
        onReportSave={vi.fn()}
        onToggleFlag={vi.fn()}
        onToggleHide={vi.fn()}
        onDeleteNode={vi.fn()}
        onSetManualNodeIcon={vi.fn()}
        onInvestigate={vi.fn()}
        onOpenReport={vi.fn()}
        onOpenEntityChat={vi.fn()}
        onOpenReportChat={vi.fn()}
        onOpenHeadlineChat={vi.fn()}
        onPlaceEntityOnBoard={vi.fn()}
        onPlaceReportOnBoard={vi.fn()}
        onPlaceHeadlineOnBoard={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Network Connections/i }));

    expect(screen.getByText('Letta')).toBeInTheDocument();
    expect(screen.queryByText(/Links/i)).not.toBeInTheDocument();
  });

  it('pins report deletion to the footer instead of the action row', () => {
    const report: Artifact = {
      id: 'report-1',
      workspaceId: 'workspace-1',
      topic: 'Artifact Topic',
      summary: 'Artifact summary',
      agendas: [],
      leads: [],
      entities: [],
      sources: [],
      rawText: 'raw text',
      labelProfileId: 'research',
    };
    const selectedNode: GraphNode = {
      id: 'report-node-1',
      type: 'REPORT',
      label: 'Artifact Topic',
      connections: 1,
      data: report,
    };
    const onDeleteNode = vi.fn();

    render(
      <NetworkGraphInspectorPanel
        isOpen
        onClose={vi.fn()}
        mode="REPORT"
        selectedNode={selectedNode}
        selectedEntity={null}
        selectedHeadline={null}
        selectedReport={report}
        reports={[report]}
        hiddenNodeIds={new Set()}
        flaggedNodeIds={new Set()}
        onEntitySave={vi.fn()}
        onReportSave={vi.fn()}
        onToggleFlag={vi.fn()}
        onToggleHide={vi.fn()}
        onDeleteNode={onDeleteNode}
        onSetManualNodeIcon={vi.fn()}
        onInvestigate={vi.fn()}
        onOpenReport={vi.fn()}
        onOpenEntityChat={vi.fn()}
        onOpenReportChat={vi.fn()}
        onOpenHeadlineChat={vi.fn()}
        onPlaceEntityOnBoard={vi.fn()}
        onPlaceReportOnBoard={vi.fn()}
        onPlaceHeadlineOnBoard={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /close inspector/i })).not.toBeInTheDocument();
    const deleteButton = screen.getByRole('button', { name: 'Remove from network' });
    expect(deleteButton).toHaveClass('w-full');
    fireEvent.click(deleteButton);
    expect(onDeleteNode).toHaveBeenCalledTimes(1);
  });
});
