import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Artifact, WorkspaceItem } from '@/types';

import { FilesRecords } from './FilesRecords';
import type { FilesRecordsViewModel } from './filesViewModel';

const artifact: Artifact = {
  id: 'artifact-1',
  workspaceId: 'ws-1',
  topic: 'Artifact record',
  dateStr: '2026-04-10',
  createdAt: 1712700000000,
  summary: 'Saved workspace artifact.',
  agendas: [],
  leads: [],
  entities: [],
  sources: [],
  rawText: '',
};

const workspaceItem: WorkspaceItem = {
  id: 'item-1',
  workspaceId: 'ws-1',
  kind: 'LINK',
  title: 'Workspace item',
  url: 'https://example.com/source',
  provenance: { source: 'USER' },
  createdAt: 1712700000000,
  updatedAt: 1712700000000,
};

const viewModel: FilesRecordsViewModel = {
  isUnassigned: false,
  records: [
    { kind: 'ARTIFACT', sortAt: 1712700000000, artifact },
    { kind: 'ITEM', sortAt: 1712700000001, item: workspaceItem },
  ],
  paginatedRecords: [
    { kind: 'ARTIFACT', sortAt: 1712700000000, artifact },
    { kind: 'ITEM', sortAt: 1712700000001, item: workspaceItem },
  ],
  resolvedCurrentPage: 1,
  totalPages: 1,
};

const baseProps = {
  focusedItem: null,
  focusedItemRowRef: { current: null },
  onChangePage: vi.fn(),
  onDeleteArtifact: vi.fn(),
  onOpenArtifactChat: vi.fn(),
  onOpenItemChat: vi.fn(),
  onOpenItemSource: vi.fn(),
  onPlaceArtifactOnBoard: vi.fn(),
  onPlaceItemOnBoard: vi.fn(),
  onSelectArtifact: vi.fn(),
  viewModel,
} as const;

describe('FilesRecords', () => {
  it('uses icon-only ghost action styling for grid record actions', () => {
    render(<FilesRecords {...baseProps} viewMode="GRID" />);

    expect(screen.getByTitle('Open artifact context in workspace chat')).toHaveClass(
      'osint-icon-button-plain'
    );
    expect(screen.getByTitle('Delete Artifact')).toHaveClass('osint-icon-button-hover-danger');
    expect(screen.getByTitle('Open linked source')).toHaveClass('osint-icon-button-plain');
  });

  it('uses icon-only ghost action styling for list record actions', () => {
    render(<FilesRecords {...baseProps} viewMode="LIST" />);

    expect(screen.getByTitle('Open artifact context in workspace chat')).toHaveClass(
      'osint-icon-button-plain'
    );
    expect(screen.getByTitle('Delete Artifact')).toHaveClass('osint-icon-button-hover-danger');
    expect(screen.getByTitle('Open linked source')).toHaveClass('osint-icon-button-plain');
  });
});
