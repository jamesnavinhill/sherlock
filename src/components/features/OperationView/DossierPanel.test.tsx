import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Artifact, Entity, LabelProfile, Workspace } from '@/types';
import { DossierPanel } from './DossierPanel';

const labelProfile: LabelProfile = {
  id: 'default',
  workspaceLabel: 'Workspace',
  workspaceLabelPlural: 'Workspaces',
  artifactLabel: 'File',
  artifactLabelPlural: 'Files',
  detailViewLabel: 'Viewer',
  followUpLabel: 'Follow-Ups',
  anomalyLabel: 'Anomalies',
  signalLabel: 'Signal',
  archiveLabel: 'Archive',
};

describe('DossierPanel', () => {
  it('can suppress the header summary row for network-style library use', () => {
    const workspace: Workspace = {
      id: 'workspace-1',
      title: 'Atlas Workspace',
      status: 'ACTIVE',
      dateOpened: '2026-04-08',
    };

    const artifact: Artifact = {
      id: 'artifact-1',
      topic: 'Procurement File',
      summary: 'A saved artifact.',
      agendas: [],
      leads: [],
      entities: [],
      sources: [],
      rawText: 'artifact body',
    };

    const entity: Entity = {
      name: 'Atlas Holdings',
      type: 'ORGANIZATION',
    };

    render(
      <DossierPanel
        isOpen
        activeCase={workspace}
        labelProfile={labelProfile}
        reports={[artifact]}
        entities={[entity]}
        leads={[]}
        sources={[]}
        headlines={[]}
        openSections={{
          reports: true,
          entities: false,
          leads: false,
          evidence: false,
          sources: false,
          headlines: false,
        }}
        toggleSection={vi.fn()}
        onNavigate={vi.fn()}
        onEntityClick={vi.fn()}
        onLeadClick={vi.fn()}
        onHeadlineClick={vi.fn()}
        showHeaderSummary={false}
      />
    );

    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Atlas Workspace')).toBeInTheDocument();
    expect(screen.queryByText('1 Files')).not.toBeInTheDocument();
    expect(screen.queryByText('1 Entities')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /procurement file/i })).toBeInTheDocument();
  });

  it('uses the compact action styling for follow-up buttons', () => {
    const workspace: Workspace = {
      id: 'workspace-1',
      title: 'Atlas Workspace',
      status: 'ACTIVE',
      dateOpened: '2026-04-08',
    };

    render(
      <DossierPanel
        isOpen
        activeCase={workspace}
        labelProfile={labelProfile}
        reports={[]}
        entities={[]}
        leads={['Trace shared directors across the vendor cluster.']}
        sources={[]}
        headlines={[]}
        openSections={{
          reports: false,
          entities: false,
          leads: true,
          evidence: false,
          sources: false,
          headlines: false,
        }}
        toggleSection={vi.fn()}
        onNavigate={vi.fn()}
        onEntityClick={vi.fn()}
        onLeadClick={vi.fn()}
        onHeadlineClick={vi.fn()}
      />
    );

    expect(screen.queryByText('0 Files')).not.toBeInTheDocument();
    expect(screen.queryByText('0 Entities')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toHaveClass('h-6');
  });
});
