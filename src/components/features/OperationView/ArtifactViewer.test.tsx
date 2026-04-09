import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Artifact } from '../../../types';
import { ArtifactViewer } from './ArtifactViewer';

const reportFixture: Artifact = {
  id: 'report-1',
  workspaceId: 'case-1',
  topic:
    '[Atlas Contract Network] [RUN_ANGLE]: trace unusual award timing [PRIORITY_SOURCES]: registry.example',
  summary: 'Fallback summary',
  artifactType: 'SYNTHESIS',
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
    expect(screen.getAllByText('This is the fuller report body.').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Atlas Review' })).toBeInTheDocument();
    expect(screen.getAllByText('Atlas Contract Network').length).toBeGreaterThan(0);
    expect(screen.queryByText('Synthesis Reading Pattern')).not.toBeInTheDocument();
    expect(screen.getAllByText('Award timing irregularity').length).toBeGreaterThan(1);
    expect(
      screen.getAllByText('Coordinated contract awards cluster around the same vendor network.')
        .length
    ).toBeGreaterThan(1);
    expect(screen.queryByText(/\[RUN_ANGLE\]/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\[PRIORITY_SOURCES\]/)).not.toBeInTheDocument();
    expect(screen.queryByText('Grounded vs Inferred')).not.toBeInTheDocument();
    expect(screen.getAllByText('Registry').length).toBeGreaterThan(0);
    expect(screen.queryByText('Follow-Up Questions')).not.toBeInTheDocument();
    expect(screen.queryByText('Award timing clusters across overlapping vendors.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse Artifact Details' }));
    expect(screen.getByRole('button', { name: 'Expand Artifact Details' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expand Artifact Details' }));
    expect(screen.getByRole('button', { name: 'Collapse Artifact Details' })).toBeInTheDocument();

    expect(
      screen.queryByText('Trace shared directors across the vendor cluster.')
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Investigative Leads/i }));
    expect(
      screen.getAllByText('Trace shared directors across the vendor cluster.').length
    ).toBeGreaterThan(1);

    fireEvent.click(screen.getByRole('button', { name: /Provenance/i }));
    expect(screen.getByText('One source could not be fully verified.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Entities/i }));
    expect(screen.getAllByText('Atlas Holdings').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Investigative Leads/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(onLeadOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        actionText: 'Trace shared directors across the vendor cluster.',
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
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
