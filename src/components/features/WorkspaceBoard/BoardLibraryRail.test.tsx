import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BoardLibraryRail } from './BoardLibraryRail';

describe('BoardLibraryRail', () => {
  it('renders the shared library rail header and actions', () => {
    render(
      <BoardLibraryRail
        isOpen
        workspaceTitle="Agentic A.I."
        search=""
        groupedEntries={{
          created: [],
          artifacts: [],
          entities: [],
          sources: [],
          signals: [],
        }}
        librarySections={{
          created: false,
          artifacts: false,
          entities: false,
          sources: false,
          signals: false,
        }}
        libraryItemSections={{}}
        fileInputRef={{ current: null }}
        sectionScrollClassName=""
        onSearchChange={vi.fn()}
        onCreateNote={vi.fn()}
        onCreateLink={vi.fn()}
        onTriggerFileUpload={vi.fn()}
        onFileUpload={vi.fn()}
        onToggleLibrarySection={vi.fn()}
        onToggleLibraryEntrySection={vi.fn()}
        onDeleteCreatedItem={vi.fn()}
        onAddToBoard={vi.fn()}
      />
    );

    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Agentic A.I.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Note' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'File' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search library' })).toBeInTheDocument();
  });

  it('does not repeat the item kind inside expanded library entries', () => {
    render(
      <BoardLibraryRail
        isOpen
        workspaceTitle="Agentic A.I."
        search=""
        groupedEntries={{
          created: [],
          artifacts: [
            {
              workspaceId: 'ws-1',
              refKind: 'ARTIFACT',
              refId: 'artifact-1',
              title: 'Universal Action Protocol',
              kind: 'ARTIFACT',
              description: 'A brief summary for the expanded artifact card.',
              searchText: 'Universal Action Protocol',
              iconId: 'file-text',
            },
          ],
          entities: [],
          sources: [],
          signals: [],
        }}
        librarySections={{
          created: false,
          artifacts: true,
          entities: false,
          sources: false,
          signals: false,
        }}
        libraryItemSections={{
          'ARTIFACT:artifact-1': true,
        }}
        fileInputRef={{ current: null }}
        sectionScrollClassName=""
        onSearchChange={vi.fn()}
        onCreateNote={vi.fn()}
        onCreateLink={vi.fn()}
        onTriggerFileUpload={vi.fn()}
        onFileUpload={vi.fn()}
        onToggleLibrarySection={vi.fn()}
        onToggleLibraryEntrySection={vi.fn()}
        onDeleteCreatedItem={vi.fn()}
        onAddToBoard={vi.fn()}
      />
    );

    expect(screen.getByText('Universal Action Protocol')).toBeInTheDocument();
    expect(screen.getByText('Add To Board')).toBeInTheDocument();
    expect(screen.queryByText('ARTIFACT')).not.toBeInTheDocument();
  });
});
