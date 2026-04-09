import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Artifact, Entity } from '@/types';
import { InspectorPanel } from './InspectorPanel';

describe('InspectorPanel', () => {
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
      <InspectorPanel
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

    expect(screen.getByRole('button', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
    expect(screen.getByText('Procurement intermediary')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Artifact Mentions/i }));
    fireEvent.click(screen.getByRole('button', { name: /Atlas Contract Network/i }));

    expect(onNavigate).toHaveBeenCalledWith('artifact-1');
  });
});
