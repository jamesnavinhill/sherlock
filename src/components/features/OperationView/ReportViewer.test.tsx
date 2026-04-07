import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Artifact } from '../../../types';
import { ReportViewer } from './ReportViewer';

const reportFixture: Artifact = {
  id: 'report-1',
  caseId: 'case-1',
  topic: 'Atlas Contract Network',
  summary: 'Fallback summary',
  agendas: ['Award timing clusters across overlapping vendors.'],
  leads: [],
  followUps: [],
  entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
  sources: [{ title: 'Registry', url: 'https://example.com/registry' }],
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

describe('ReportViewer', () => {
  it('uses a unified report body, hides follow-up sections from the main column, and uses the report details rail open action', async () => {
    const onReportBodySave = vi.fn(async () => undefined);
    const onLeadOpen = vi.fn();

    render(
      <ReportViewer
        report={reportFixture}
        workspaceTitle="Atlas Review"
        navStack={[]}
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

    expect(screen.getByRole('heading', { name: 'REPORT' })).toBeInTheDocument();
    expect(screen.getByText('This is the fuller report body.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Atlas Review' })).toBeInTheDocument();
    expect(screen.queryByText('Follow-Up Questions')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse Report Details' }));
    expect(screen.getByRole('button', { name: 'Expand Report Details' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expand Report Details' }));
    expect(screen.getByRole('button', { name: 'Collapse Report Details' })).toBeInTheDocument();

    expect(
      screen.queryByText('Trace shared directors across the vendor cluster.')
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Investigative Leads (1)' }));
    expect(
      screen.getByText('Trace shared directors across the vendor cluster.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Atlas Holdings')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Entities (1)' }));
    expect(screen.getByText('Atlas Holdings')).toBeInTheDocument();
    expect(
      screen.queryByText('Trace shared directors across the vendor cluster.')
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Investigative Leads (1)' }));
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
        'section-executive_summary-0'
      );
    });
  });
});
