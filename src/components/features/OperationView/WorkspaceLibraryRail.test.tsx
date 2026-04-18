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
        findings={[]}
        entities={[entity]}
        leads={[]}
        sources={[]}
        headlines={[]}
        openSections={{
          reports: true,
          findings: false,
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
        findings={[]}
        entities={[entity]}
        leads={[]}
        sources={[]}
        headlines={[]}
        openSections={{
          reports: false,
          findings: false,
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
        findings={[]}
        entities={[]}
        leads={['Trace shared directors across the vendor cluster.']}
        sources={[]}
        headlines={[]}
        openSections={{
          reports: false,
          findings: false,
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
        findings={[]}
        entities={[]}
        leads={[]}
        sources={[]}
        headlines={[]}
        openSections={{
          reports: false,
          findings: false,
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
        findings={[]}
        entities={[]}
        leads={[]}
        sources={[{ title: 'Registry', url: 'https://example.com/registry' }]}
        headlines={[]}
        openSections={{
          reports: false,
          findings: false,
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

  it('does not keep desktop width classes when the overlay rail is closed', () => {
    const workspace: Workspace = {
      id: 'workspace-1',
      title: 'Atlas Workspace',
      status: 'ACTIVE',
      dateOpened: '2026-04-08',
    };

    render(
      <WorkspaceLibraryRail
        isOpen={false}
        activeCase={workspace}
        labelProfile={labelProfile}
        reports={[]}
        findings={[]}
        entities={[]}
        leads={[]}
        sources={[]}
        headlines={[]}
        openSections={{
          reports: false,
          findings: false,
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
        overlayOnDesktop
      />
    );

    const panel = screen.getByText('Atlas Workspace').closest('aside');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel).toHaveStyle({
      width: '0px',
      'max-width': '0px',
      flex: '0 0 0px',
    });
    expect(panel?.className).not.toContain('lg:w-80 lg:-translate-x-full');
  });

  it('uses absolute desktop positioning when overlayOnDesktop is enabled', () => {
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
        findings={[]}
        entities={[]}
        leads={[]}
        sources={[]}
        headlines={[]}
        openSections={{
          reports: false,
          findings: false,
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
        overlayOnDesktop
      />
    );

    const panel = screen.getByText('Atlas Workspace').closest('aside');
    expect(panel?.className).toContain('lg:absolute');
    expect(panel?.className).not.toContain('lg:relative');
  });

  it('surfaces findings as their own rail section in the operation library', () => {
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
        findings={[
          {
            finding: {
              id: 'finding-1',
              title: 'Ownership chain converges on one holding company',
              summary: 'Registry and procurement records point to a shared parent.',
            },
            reportId: 'artifact-1',
            reportTopic: 'Procurement File',
          },
        ]}
        entities={[]}
        leads={[]}
        sources={[]}
        headlines={[]}
        openSections={{
          reports: false,
          findings: true,
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
      />
    );

    expect(screen.getByText('Findings')).toBeInTheDocument();
    expect(screen.getByText('Ownership chain converges on one holding company')).toBeInTheDocument();
  });
});
