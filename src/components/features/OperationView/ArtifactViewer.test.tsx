import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Artifact } from '../../../types';
import { ArtifactViewer } from './ArtifactViewer';

const reportFixture: Artifact = {
  id: 'report-1',
  workspaceId: 'case-1',
  topic:
    '[Atlas Contract Network] [RUN_ANGLE]: trace unusual award timing [PRIORITY_SOURCES]: registry.example',
  summary: 'Fallback summary',
  artifactType: 'BRIEF',
  agendas: ['Award timing clusters across overlapping vendors.'],
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
    citations: [{ url: 'https://example.com/registry', title: 'Registry' }],
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
    {
      id: 'section-implications-2',
      kind: 'IMPLICATIONS',
      title: 'Implications',
      items: ['The award sequence suggests centralized coordination.'],
      order: 2,
    },
    {
      id: 'section-custom-3',
      kind: 'CUSTOM',
      title: 'Appendix',
      content: 'Supporting notes for the case team.',
      order: 3,
    },
  ],
  config: {},
};

describe('ArtifactViewer', () => {
  it('renders canonical findings in both the document body and details rail, hides legacy follow-up sections, and preserves detail-rail actions', async () => {
    const onReportBodySave = vi.fn(async () => undefined);
    const onLeadOpen = vi.fn();

    render(
      <ArtifactViewer
        report={reportFixture}
        workspaceTitle="Atlas Review"
        navStack={[
          { type: 'CASE', id: 'case-1', label: 'Atlas Review' },
          { type: 'REPORT', id: 'report-1', label: reportFixture.topic },
        ]}
        onNavigate={vi.fn()}
        onNotify={vi.fn()}
        showPlaceholder={false}
        onStartNewCase={vi.fn()}
        onTitleSave={vi.fn()}
        onReportBodySave={onReportBodySave}
        onLeadOpen={onLeadOpen}
        onEntityClick={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /Executive Summary/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Key Findings/i })).toBeInTheDocument();
    const executiveSummarySection = screen
      .getByRole('heading', { name: /Executive Summary/i })
      .closest('section');
    expect(executiveSummarySection).not.toBeNull();
    expect(executiveSummarySection?.textContent).toContain('This is the fuller report body.');
    expect(screen.getAllByText('Atlas Review').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Atlas Contract Network').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Atlas Contract Network/i })).toHaveClass(
      'osint-breadcrumb-current'
    );
    expect(screen.getByTestId('artifact-viewer-top-header')).toBeInTheDocument();
    expect(screen.getByTestId('artifact-viewer-top-header')).toHaveClass('min-h-16');
    expect(screen.getByTestId('artifact-viewer-dot-grid-background')).toBeInTheDocument();
    expect(screen.getByTestId('artifact-viewer-title-surface')).toBeInTheDocument();
    expect(screen.getByTestId('artifact-viewer-title-surface')).not.toHaveClass('border-b');
    expect(screen.getAllByText('Award timing irregularity')).toHaveLength(1);
    const findingCard = screen.getByRole('heading', { name: 'Award timing irregularity' }).closest('article');
    expect(findingCard).not.toBeNull();
    const findingSourceLink = within(findingCard as HTMLElement).getByRole('link', {
      name: 'Registry',
    });
    expect(findingSourceLink.className).toContain('osint-inline-text-link');
    expect(findingSourceLink.className).not.toContain('border-zinc-700');
    expect(within(findingCard as HTMLElement).queryByText('Support References')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expand Artifact Details' }));
    fireEvent.click(screen.getByRole('button', { name: /Key Findings/i }));
    const findingDisclosure = screen.getByRole('button', {
      name: /1\s*Award timing irregularity/i,
    });
    expect(findingDisclosure).toBeInTheDocument();
    expect(screen.getAllByText('Coordinated contract awards cluster around the same vendor network.')).toHaveLength(1);
    fireEvent.click(findingDisclosure);
    expect(
      screen.getAllByText('Coordinated contract awards cluster around the same vendor network.').length
    ).toBeGreaterThan(1);
    fireEvent.click(findingDisclosure);
    expect(screen.getAllByText('Coordinated contract awards cluster around the same vendor network.')).toHaveLength(1);
    expect(screen.queryByText(/\[RUN_ANGLE\]/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\[PRIORITY_SOURCES\]/)).not.toBeInTheDocument();
    expect(screen.queryByText('Grounded vs Inferred')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Brief$/)).not.toBeInTheDocument();
    expect(screen.queryByText('Structured Findings')).not.toBeInTheDocument();
    expect(screen.queryByText('Document Section')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Open In Document/i })).not.toBeInTheDocument();
    expect(screen.queryByText('1 findings')).not.toBeInTheDocument();
    expect(screen.queryByText('1 sources')).not.toBeInTheDocument();
    expect(screen.queryByText('1 evidence rows')).not.toBeInTheDocument();
    expect(screen.queryByText('1 warnings')).not.toBeInTheDocument();
    expect(screen.getAllByText('Registry').length).toBeGreaterThan(0);
    expect(screen.queryByText('Entity Index')).not.toBeInTheDocument();
    expect(screen.queryByText('Source Index')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Next Steps/i })).toBeInTheDocument();
    expect(screen.getByText('Trace shared directors across the vendor cluster.')).toBeInTheDocument();
    const investigateButton = screen.getByRole('button', { name: 'Investigate' });
    expect(investigateButton.className).toContain('osint-button-chrome');
    expect(screen.queryByText('Award timing clusters across overlapping vendors.')).not.toBeInTheDocument();
    expect(
      screen
        .getByRole('button', { name: /Entities/i })
        .compareDocumentPosition(screen.getByRole('button', { name: /Investigative Leads/i }))
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    expect(screen.getByRole('button', { name: 'Collapse Artifact Details' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse Artifact Details' }));
    expect(screen.getByRole('button', { name: 'Expand Artifact Details' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expand Artifact Details' }));

    fireEvent.click(screen.getByRole('button', { name: /Investigative Leads/i }));
    const followUpMatches = screen.getAllByText('Trace shared directors across the vendor cluster.');
    expect(followUpMatches.length).toBeGreaterThan(1);
    const detailRailFollowUp = followUpMatches.find((node) =>
      node.className.includes('osint-body-quiet')
    );
    expect(detailRailFollowUp).toBeDefined();
    expect(detailRailFollowUp as HTMLElement).not.toHaveClass('osint-meta-value');

    fireEvent.click(screen.getByRole('button', { name: /Sources/i }));
    expect(screen.getByText('One source could not be fully verified.')).toBeInTheDocument();
    expect(screen.queryByText('Generation')).not.toBeInTheDocument();
    expect(screen.queryByText('OPENAI / gpt-test')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Entities/i }));
    expect(screen.getAllByText('Atlas Holdings').length).toBeGreaterThan(0);

    fireEvent.click(investigateButton);
    expect(onLeadOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        actionText: 'Trace shared directors across the vendor cluster.',
      })
    );

    expect(executiveSummarySection).toHaveClass('p-6');
    expect(
      within(executiveSummarySection as HTMLElement).queryByRole('button', { name: 'Edit' })
    ).not.toBeInTheDocument();
    expect(onReportBodySave).not.toHaveBeenCalled();
  });

});
