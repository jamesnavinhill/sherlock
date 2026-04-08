import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspaceStore';

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

vi.mock('../ui/BackgroundMatrixRain', () => ({
  BackgroundMatrixRain: () => null,
}));

vi.mock('../ui/GlobalSearch', () => ({
  GlobalSearch: () => null,
}));

vi.mock('./Runs/RunSetupModal', () => ({
  RunSetupModal: () => null,
}));

vi.mock('../../utils/exportUtils', () => ({
  exportCaseAsJson: vi.fn(),
  exportCaseAsHtml: vi.fn(),
  exportCaseAsMarkdown: vi.fn(),
}));

import { Files } from './Files';

describe('Files chat launch propagation', () => {
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
          workspaceId: 'case-1',
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
        <Files onSelectReport={vi.fn()} onStartNewCase={vi.fn()} onOpenChat={onOpenChat} />
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
        sourceArtifactId: 'report-1',
      },
    });
  });

  it('uses canonical workspace and artifact labels in the Files shell', () => {
    render(
      <MemoryRouter future={routerFuture}>
        <Files onSelectReport={vi.fn()} onStartNewCase={vi.fn()} onOpenChat={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /new workspace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/view workspace/i)).toBeInTheDocument();
  });

  it('moves the layout switch into the files filters menu', () => {
    render(
      <MemoryRouter future={routerFuture}>
        <Files onSelectReport={vi.fn()} onStartNewCase={vi.fn()} onOpenChat={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('group', { name: /files layout/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /files filters/i }));

    expect(screen.getByRole('group', { name: /files layout/i })).toBeInTheDocument();

    const listToggle = screen.getByRole('button', { name: /show dense list view/i });
    const gridToggle = screen.getByRole('button', { name: /show grid view/i });

    expect(listToggle).toHaveAttribute('aria-pressed', 'true');
    expect(gridToggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(gridToggle);

    expect(listToggle).toHaveAttribute('aria-pressed', 'false');
    expect(gridToggle).toHaveAttribute('aria-pressed', 'true');
  });
});
