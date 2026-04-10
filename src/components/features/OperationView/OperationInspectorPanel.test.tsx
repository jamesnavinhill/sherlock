import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Artifact, Entity } from '@/types';
import { OperationInspectorPanel } from './OperationInspectorPanel';

describe('OperationInspectorPanel', () => {
  it('renders entity details through the shared inspector shell and preserves mention navigation', () => {
    const entity: Entity = {
      name: 'Atlas Holdings',
      type: 'ORGANIZATION',
      role: 'Procurement intermediary',
      sentiment: 'NEGATIVE',
    };
    const report: Artifact = {
      id: 'artifact-1',
      workspaceId: 'workspace-1',
      topic: 'Atlas Contract Network',
      summary: 'Artifact summary',
      agendas: [],
      leads: [],
      entities: [entity],
      sources: [],
      rawText: 'raw',
    };
    const onNavigate = vi.fn();

    render(
      <OperationInspectorPanel
        isOpen
        onClose={vi.fn()}
        mode="ENTITY"
        report={report}
        workspaceTitle="Atlas Workspace"
        entity={entity}
        headline={null}
        reports={[report]}
        onEntitySave={vi.fn()}
        onFlagEntity={vi.fn()}
        onInvestigateEntity={vi.fn()}
        onInvestigateHeadline={vi.fn()}
        onOpenEntityChat={vi.fn()}
        onOpenHeadlineChat={vi.fn()}
        onOpenReportChat={vi.fn()}
        onPlaceEntityOnBoard={vi.fn()}
        onPlaceHeadlineOnBoard={vi.fn()}
        onPlaceReportOnBoard={vi.fn()}
        onNavigate={onNavigate}
      />
    );

    expect(screen.getByRole('button', { name: 'Open Workspace Chat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Launch Investigation' })).toBeInTheDocument();
    expect(screen.queryByText('Procurement intermediary')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Entity Summary/i }));
    expect(screen.getByText('Procurement intermediary')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Artifact Mentions/i }));
    fireEvent.click(screen.getByRole('button', { name: /Atlas Contract Network/i }));

    expect(onNavigate).toHaveBeenCalledWith('artifact-1');
  });

  it('starts the entity summary accordion collapsed and still allows it to close fully after opening', () => {
    const entity: Entity = {
      name: 'Atlas Holdings',
      type: 'ORGANIZATION',
      role: 'Procurement intermediary',
      sentiment: 'NEGATIVE',
    };

    render(
      <OperationInspectorPanel
        isOpen
        onClose={vi.fn()}
        mode="ENTITY"
        report={null}
        workspaceTitle={null}
        entity={entity}
        headline={null}
        reports={[]}
        onEntitySave={vi.fn()}
        onFlagEntity={vi.fn()}
        onInvestigateEntity={vi.fn()}
        onInvestigateHeadline={vi.fn()}
        onOpenEntityChat={vi.fn()}
        onOpenHeadlineChat={vi.fn()}
        onOpenReportChat={vi.fn()}
        onPlaceEntityOnBoard={vi.fn()}
        onPlaceHeadlineOnBoard={vi.fn()}
        onPlaceReportOnBoard={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.queryByText('Procurement intermediary')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Entity Summary/i }));
    expect(screen.getByText('Procurement intermediary')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Entity Summary/i }));

    expect(screen.queryByText('Procurement intermediary')).not.toBeInTheDocument();
  });
});
