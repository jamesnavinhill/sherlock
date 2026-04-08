import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/caseStore';

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

vi.mock('../ui/BackgroundMatrixRain', () => ({
  BackgroundMatrixRain: () => null,
}));

vi.mock('./Runs/TaskSetupModal', () => ({
  TaskSetupModal: () => null,
}));

vi.mock('../../utils/exportUtils', () => ({
  exportCaseAsJson: vi.fn(),
  exportCaseAsHtml: vi.fn(),
  exportCaseAsMarkdown: vi.fn(),
}));

import { Archives } from './Archives';

describe('Archives chat launch propagation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    useWorkspaceStore.setState({
      workspaces: [
        {
          id: 'case-1',
          title: 'Operation: Atlas',
          status: 'ACTIVE',
          dateOpened: '2026-02-07',
          description: 'Procurement case',
        },
      ],
      artifacts: [
        {
          id: 'report-1',
          caseId: 'case-1',
          topic: 'Atlas baseline',
          summary: 'Summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: '{}',
        },
      ],
    });
  });

  it('opens workspace chat from case cards and report cards', () => {
    const onOpenChat = vi.fn();

    render(
      <MemoryRouter future={routerFuture}>
        <Archives onSelectReport={vi.fn()} onStartNewCase={vi.fn()} onOpenChat={onOpenChat} />
      </MemoryRouter>
    );

    const chatButtons = screen.getAllByTitle(/workspace chat/i);
    fireEvent.click(chatButtons[0]);
    fireEvent.click(screen.getByText('Atlas'));
    fireEvent.click(screen.getByTitle(/artifact context in workspace chat/i));

    expect(onOpenChat).toHaveBeenNthCalledWith(1, {
      workspaceId: 'case-1',
    });
    expect(onOpenChat).toHaveBeenNthCalledWith(2, {
      workspaceId: 'case-1',
      launchContext: {
        sourceReportId: 'report-1',
      },
    });
  });

  it('uses canonical workspace and artifact labels in the Files shell', () => {
    render(
      <MemoryRouter future={routerFuture}>
        <Archives onSelectReport={vi.fn()} onStartNewCase={vi.fn()} onOpenChat={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /new workspace/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/view workspace/i)).toBeInTheDocument();
  });
});
