import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Artifact, Entity, LabelProfile, Workspace } from '@/types';
import { WorkspaceLibraryRail } from './WorkspaceLibraryRail';

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

describe('WorkspaceLibraryRail', () => {
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
      <WorkspaceLibraryRail
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

  it('renders entity rows with the thin detail-panel treatment and identifier dot', () => {
    const workspace: Workspace = {
      id: 'workspace-1',
      title: 'Atlas Workspace',
      status: 'ACTIVE',
      dateOpened: '2026-04-08',
    };

    const entity: Entity = {
      name: 'Atlas Holdings',
      type: 'ORGANIZATION',
    };

    render(
      <WorkspaceLibraryRail
        isOpen
        activeCase={workspace}
        labelProfile={labelProfile}
        reports={[]}
        entities={[entity]}
        leads={[]}
        sources={[]}
        headlines={[]}
        openSections={{
          reports: false,
          entities: true,
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
      />
    );

    const entityButton = screen.getByRole('button', { name: 'Atlas Holdings' });
    expect(entityButton).toBeInTheDocument();
    expect(entityButton.querySelector('.entity-tone-dot')).not.toBeNull();
  });

  it('uses the compact action styling for follow-up buttons', () => {
    const workspace: Workspace = {
      id: 'workspace-1',
      title: 'Atlas Workspace',
      status: 'ACTIVE',
      dateOpened: '2026-04-08',
    };

    render(
      <WorkspaceLibraryRail
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

  it('uses normalized source and signal labels in the shared dossier rail', () => {
    const workspace: Workspace = {
      id: 'workspace-1',
      title: 'Atlas Workspace',
      status: 'ACTIVE',
      dateOpened: '2026-04-08',
    };

    render(
      <WorkspaceLibraryRail
        isOpen
        activeCase={workspace}
        labelProfile={labelProfile}
        reports={[]}
        entities={[]}
        leads={[]}
        sources={[]}
        headlines={[]}
        openSections={{
          reports: false,
          entities: false,
          leads: false,
          evidence: false,
          sources: true,
          headlines: true,
        }}
        toggleSection={vi.fn()}
        onNavigate={vi.fn()}
        onEntityClick={vi.fn()}
        onLeadClick={vi.fn()}
        onHeadlineClick={vi.fn()}
      />
    );

    expect(screen.getByText('Signal')).toBeInTheDocument();
    expect(screen.getByText('No sources captured yet.')).toBeInTheDocument();
  });

  it('renders source rows without raw url subtext when a source title exists', () => {
    const workspace: Workspace = {
      id: 'workspace-1',
      title: 'Atlas Workspace',
      status: 'ACTIVE',
      dateOpened: '2026-04-08',
    };

    render(
      <WorkspaceLibraryRail
        isOpen
        activeCase={workspace}
        labelProfile={labelProfile}
        reports={[]}
        entities={[]}
        leads={[]}
        sources={[{ title: 'Registry', url: 'https://example.com/registry' }]}
        headlines={[]}
        openSections={{
          reports: false,
          entities: false,
          leads: false,
          evidence: false,
          sources: true,
          headlines: false,
        }}
        toggleSection={vi.fn()}
        onNavigate={vi.fn()}
        onEntityClick={vi.fn()}
        onLeadClick={vi.fn()}
        onHeadlineClick={vi.fn()}
      />
    );

    expect(screen.getByRole('link', { name: 'Registry' })).toBeInTheDocument();
    expect(screen.queryByText('https://example.com/registry')).not.toBeInTheDocument();
  });
});
