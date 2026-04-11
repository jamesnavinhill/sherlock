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
    expect(screen.getByRole('heading', { name: /Appendix/i })).toBeInTheDocument();
    expect(screen.getAllByText('This is the fuller report body.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Atlas Review').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Atlas Contract Network').length).toBeGreaterThan(0);
    expect(screen.getByTestId('artifact-viewer-top-header')).toBeInTheDocument();
    expect(screen.getByTestId('artifact-viewer-top-header')).toHaveClass('min-h-16');
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
    const findingSupportReference = within(findingCard as HTMLElement).getAllByText('Registry')[1];
    expect(findingSupportReference.className).toContain('osint-inline-reference');
    expect(findingSupportReference.className).not.toContain('border-zinc-700');
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
    expect(screen.queryByText('Follow-Up Questions')).not.toBeInTheDocument();
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

    expect(
      screen.queryByText('Trace shared directors across the vendor cluster.')
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Investigative Leads/i }));
    const followUpText = screen.getByText('Trace shared directors across the vendor cluster.');
    expect(followUpText).toBeInTheDocument();
    expect(followUpText).toHaveClass('osint-body-quiet');
    expect(followUpText).not.toHaveClass('osint-meta-value');

    fireEvent.click(screen.getByRole('button', { name: /Sources/i }));
    expect(screen.getByText('One source could not be fully verified.')).toBeInTheDocument();
    expect(screen.queryByText('Generation')).not.toBeInTheDocument();
    expect(screen.queryByText('OPENAI / gpt-test')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Entities/i }));
    expect(screen.getAllByText('Atlas Holdings').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Investigative Leads/i }));
    const openFollowUpButton = screen.getByRole('button', { name: 'Open' });
    expect(openFollowUpButton).toHaveClass('h-6');
    fireEvent.click(openFollowUpButton);
    expect(onLeadOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        actionText: 'Trace shared directors across the vendor cluster.',
      })
    );

    const executiveSummarySection = screen
      .getByRole('heading', { name: /Executive Summary/i })
      .closest('section');
    expect(executiveSummarySection).not.toBeNull();
    expect(executiveSummarySection).toHaveClass('p-6');

    fireEvent.click(within(executiveSummarySection as HTMLElement).getByRole('button', { name: 'Edit' }));
    const textarea = await screen.findByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Expanded report body for editing.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onReportBodySave).toHaveBeenCalledWith(
        'Expanded report body for editing.',
        'section-executive_summary-0',
        {
          syncSummary: true,
        }
      );
    });
  });
});
