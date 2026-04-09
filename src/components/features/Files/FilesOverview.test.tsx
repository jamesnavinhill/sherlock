import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Workspace } from '@/types';

import { FilesOverview } from './FilesOverview';
import type { FilesOverviewViewModel } from './filesViewModel';

const workspace: Workspace = {
  id: 'ws-1',
  title: 'Agentic A.I.',
  status: 'ACTIVE',
  dateOpened: '2026-04-04',
  description: 'Workspace summary copy for layout coverage.',
};

const viewModel: FilesOverviewViewModel = {
  paginatedWorkspaces: [
    {
      workspace,
      artifactCount: 7,
      itemCount: 0,
      displayTitle: 'agentic a.i.',
    },
  ],
  totalPages: 1,
  unassignedArtifactCount: 0,
};

const baseProps = {
  artifactLabelPlural: 'Artifacts',
  currentPage: 1,
  onChangePage: vi.fn(),
  onEditWorkspaceIcon: vi.fn(),
  onExportWorkspaceHtml: vi.fn(),
  onExportWorkspaceJson: vi.fn(),
  onExportWorkspaceMarkdown: vi.fn(),
  onOpenWorkspaceChat: vi.fn(),
  onPurgeWorkspace: vi.fn(),
  onSelectWorkspace: vi.fn(),
  onStartNewWorkspace: vi.fn(),
  viewModel,
  workspaceLabel: 'Workspace',
  workspaceLabelLower: 'workspace',
} as const;

describe('FilesOverview', () => {
  it('keeps grid workspace actions visible on their own row', () => {
    render(<FilesOverview {...baseProps} viewMode="GRID" />);

    expect(screen.getByText('Workspace summary copy for layout coverage.')).toBeInTheDocument();
    expect(screen.getByTitle(/workspace chat/i)).toBeInTheDocument();
    expect(screen.getByTitle(/\(HTML\)/i)).toBeInTheDocument();
    expect(screen.getByTitle(/\(JSON\)/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Markdown \(\.md\)/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Permanently Purge Workspace/i)).toBeInTheDocument();
  });

  it('renders list workspace actions separately from the counts row', () => {
    render(<FilesOverview {...baseProps} viewMode="LIST" />);

    expect(screen.getByTitle(/workspace chat/i)).toBeInTheDocument();
    expect(screen.getByTitle(/\(HTML\)/i)).toBeInTheDocument();
    expect(screen.getByTitle(/\(JSON\)/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Markdown \(\.md\)/i)).toBeInTheDocument();
  });

  it('opens workspace chat from the action row without triggering row navigation', () => {
    const onOpenWorkspaceChat = vi.fn();
    const onSelectWorkspace = vi.fn();

    render(
      <FilesOverview
        {...baseProps}
        viewMode="LIST"
        onOpenWorkspaceChat={onOpenWorkspaceChat}
        onSelectWorkspace={onSelectWorkspace}
      />
    );

    fireEvent.click(screen.getByTitle(/workspace chat/i));

    expect(onOpenWorkspaceChat).toHaveBeenCalledWith('ws-1');
    expect(onSelectWorkspace).not.toHaveBeenCalled();
  });

  it('opens the workspace icon picker without triggering row navigation', () => {
    const onEditWorkspaceIcon = vi.fn();
    const onSelectWorkspace = vi.fn();

    render(
      <FilesOverview
        {...baseProps}
        viewMode="GRID"
        onEditWorkspaceIcon={onEditWorkspaceIcon}
        onSelectWorkspace={onSelectWorkspace}
      />
    );

    fireEvent.click(screen.getByTitle(/Customize workspace icon/i));

    expect(onEditWorkspaceIcon).toHaveBeenCalled();
    expect(onSelectWorkspace).not.toHaveBeenCalled();
  });
});
