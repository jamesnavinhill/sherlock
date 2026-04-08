import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BoardLibraryRail } from './BoardLibraryRail';

describe('BoardLibraryRail', () => {
  it('renders separators below the title and above search controls', () => {
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

    expect(screen.getByTestId('board-library-title-divider')).toBeInTheDocument();
    expect(screen.getByTestId('board-library-search-divider')).toBeInTheDocument();
  });
});
