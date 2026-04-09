import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BoardLibraryRail } from './BoardLibraryRail';

describe('BoardLibraryRail', () => {
  it('renders the unified library header and separators', () => {
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
    expect(screen.queryByText('Canonical Library')).not.toBeInTheDocument();
    expect(screen.getByTestId('board-library-title-divider')).toHaveClass('-mx-4');
    expect(screen.getByTestId('board-library-search-divider')).toBeInTheDocument();
  });
});
