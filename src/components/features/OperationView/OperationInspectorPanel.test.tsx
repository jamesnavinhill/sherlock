import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getLabelProfileById } from '@/domain';
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
    const artifact: Artifact = {
      id: 'artifact-1',
      workspaceId: 'workspace-1',
      topic: 'Atlas Contract Network',
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
      rawText: 'raw',
    };
    const onNavigate = vi.fn();

    render(
      <OperationInspectorPanel
        isOpen
        mode="ENTITY"
        artifact={artifact}
        labelProfile={getLabelProfileById()}
        workspaceTitle="Atlas Workspace"
        entity={entity}
        headline={null}
        artifacts={[artifact]}
        onEntitySave={vi.fn()}
        onFlagEntity={vi.fn()}
        onInvestigateEntity={vi.fn()}
        onInvestigateHeadline={vi.fn()}
        onOpenEntityChat={vi.fn()}
        onOpenHeadlineChat={vi.fn()}
        onOpenArtifactChat={vi.fn()}
        onPlaceEntityOnBoard={vi.fn()}
        onPlaceHeadlineOnBoard={vi.fn()}
        onPlaceArtifactOnBoard={vi.fn()}
        onSelectArtifactEntity={vi.fn()}
        onOpenArtifactFollowUp={vi.fn()}
        onJumpToArtifactSection={vi.fn()}
        onJumpToArtifactEvidence={vi.fn()}
        onNavigate={onNavigate}
      />
    );

    expect(screen.queryByRole('button', { name: /Close inspector/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Workspace Chat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Launch Investigation' })).toBeInTheDocument();
    expect(screen.queryByText('Procurement intermediary')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Entity Summary/i }));
    expect(screen.getByText('Procurement intermediary')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Network Connections/i }));
    expect(screen.getByText('Letta')).toBeInTheDocument();
    expect(screen.queryByText(/Links/i)).not.toBeInTheDocument();
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
        mode="ENTITY"
        artifact={null}
        labelProfile={getLabelProfileById()}
        workspaceTitle={null}
        entity={entity}
        headline={null}
        artifacts={[]}
        onEntitySave={vi.fn()}
        onFlagEntity={vi.fn()}
        onInvestigateEntity={vi.fn()}
        onInvestigateHeadline={vi.fn()}
        onOpenEntityChat={vi.fn()}
        onOpenHeadlineChat={vi.fn()}
        onOpenArtifactChat={vi.fn()}
        onPlaceEntityOnBoard={vi.fn()}
        onPlaceHeadlineOnBoard={vi.fn()}
        onPlaceArtifactOnBoard={vi.fn()}
        onSelectArtifactEntity={vi.fn()}
        onOpenArtifactFollowUp={vi.fn()}
        onJumpToArtifactSection={vi.fn()}
        onJumpToArtifactEvidence={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.queryByText('Procurement intermediary')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Entity Summary/i }));
    expect(screen.getByText('Procurement intermediary')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Entity Summary/i }));

    expect(screen.queryByText('Procurement intermediary')).not.toBeInTheDocument();
  });

  it('replaces artifact metrics with the existing artifact detail sections', () => {
    const onJumpToArtifactSection = vi.fn();
    const onOpenArtifactFollowUp = vi.fn();
    const onSelectArtifactEntity = vi.fn();

    const artifact: Artifact = {
      id: 'artifact-1',
      workspaceId: 'workspace-1',
      topic: 'Atlas Contract Network',
      summary: 'Artifact summary',
      artifactType: 'BRIEF',
      agendas: [],
      leads: [],
      followUps: [],
      keyFindings: [
        {
          id: 'finding-1',
          title: 'Award timing irregularity',
          summary: 'Coordinated contract awards cluster around the same vendor network.',
          supportRefs: ['Registry'],
          originSectionId: 'section-executive_summary-0',
          order: 0,
        },
      ],
      entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
      sources: [{ title: 'Registry', url: 'https://example.com/registry' }],
      evidence: [
        {
          id: 'evidence-1',
          kind: 'FINDING',
          title: 'Procurement record',
          summary: 'The procurement record ties Atlas to overlapping awards.',
          sourceTitle: 'Registry',
          sourceUrl: 'https://example.com/registry',
          sectionId: 'section-executive_summary-0',
        },
      ],
      provenance: {
        provider: 'OPENAI',
        modelId: 'gpt-test',
        generatedAt: '2026-04-08T12:00:00.000Z',
        warnings: ['One source could not be fully verified.'],
      },
      rawText: 'raw',
      sections: [
        {
          id: 'section-executive_summary-0',
          kind: 'EXECUTIVE_SUMMARY',
          title: 'Executive Summary',
          content: 'This is the fuller report body.',
          order: 0,
        },
        {
          id: 'section-next_steps-1',
          kind: 'NEXT_STEPS',
          title: 'Follow-Up Questions',
          items: ['Trace shared directors across the vendor cluster.'],
          order: 1,
        },
      ],
      config: {},
    };

    render(
      <OperationInspectorPanel
        isOpen
        mode="REPORT"
        artifact={artifact}
        labelProfile={getLabelProfileById()}
        workspaceTitle="Atlas Workspace"
        entity={null}
        headline={null}
        artifacts={[artifact]}
        onEntitySave={vi.fn()}
        onFlagEntity={vi.fn()}
        onInvestigateEntity={vi.fn()}
        onInvestigateHeadline={vi.fn()}
        onOpenEntityChat={vi.fn()}
        onOpenHeadlineChat={vi.fn()}
        onOpenArtifactChat={vi.fn()}
        onPlaceEntityOnBoard={vi.fn()}
        onPlaceHeadlineOnBoard={vi.fn()}
        onPlaceArtifactOnBoard={vi.fn()}
        onSelectArtifactEntity={onSelectArtifactEntity}
        onOpenArtifactFollowUp={onOpenArtifactFollowUp}
        onJumpToArtifactSection={onJumpToArtifactSection}
        onJumpToArtifactEvidence={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Artifact Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Key Findings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Investigative Leads/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entities/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sources/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Artifact Metrics/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Key Findings/i }));
    fireEvent.click(screen.getByRole('button', { name: /1\s*Award timing irregularity/i }));
    expect(
      screen.getByText('Coordinated contract awards cluster around the same vendor network.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Open finding context/i }));
    expect(onJumpToArtifactSection).toHaveBeenCalledWith('section-executive_summary-0');

    fireEvent.click(screen.getByRole('button', { name: /Investigative Leads/i }));
    expect(screen.getByText('Trace shared directors across the vendor cluster.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Open follow-up/i }));
    expect(onOpenArtifactFollowUp).toHaveBeenCalledWith(
      expect.objectContaining({
        actionText: 'Trace shared directors across the vendor cluster.',
      })
    );

    fireEvent.click(screen.getByRole('button', { name: /Entities/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Atlas Holdings' }));
    expect(onSelectArtifactEntity).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Atlas Holdings' })
    );
  });
});
