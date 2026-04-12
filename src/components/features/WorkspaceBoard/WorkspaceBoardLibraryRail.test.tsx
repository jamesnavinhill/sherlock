import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WorkspaceBoardLibraryRail } from './WorkspaceBoardLibraryRail';

describe('WorkspaceBoardLibraryRail', () => {
  it('renders the shared library rail header and actions', () => {
    render(
      <WorkspaceBoardLibraryRail
        isOpen
        workspaceTitle="Agentic A.I."
        search=""
        groupedEntries={{
          created: [],
          artifacts: [],
          findings: [],
          entities: [],
          sources: [],
          signals: [],
        }}
        librarySections={{
          created: false,
          artifacts: false,
          findings: false,
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
        onAddIcon={vi.fn()}
        onTriggerFileUpload={vi.fn()}
        onFileUpload={vi.fn()}
        onToggleLibrarySection={vi.fn()}
        onToggleLibraryEntrySection={vi.fn()}
        onDeleteCreatedItem={vi.fn()}
        onAddToBoard={vi.fn()}
        onAddArtifactPackage={vi.fn()}
      />
    );

    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Agentic A.I.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Note' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add icon to board' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'File' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search library' })).toBeInTheDocument();
  });

  it('opens the board icon picker from the rail action row', () => {
    const onAddIcon = vi.fn();

    render(
      <WorkspaceBoardLibraryRail
        isOpen
        workspaceTitle="Agentic A.I."
        search=""
        groupedEntries={{
          created: [],
          artifacts: [],
          findings: [],
          entities: [],
          sources: [],
          signals: [],
        }}
        librarySections={{
          created: false,
          artifacts: false,
          findings: false,
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
        onAddIcon={onAddIcon}
        onTriggerFileUpload={vi.fn()}
        onFileUpload={vi.fn()}
        onToggleLibrarySection={vi.fn()}
        onToggleLibraryEntrySection={vi.fn()}
        onDeleteCreatedItem={vi.fn()}
        onAddToBoard={vi.fn()}
        onAddArtifactPackage={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add icon to board' }));

    expect(onAddIcon).toHaveBeenCalledTimes(1);
  });

  it('renders the rail action row as width-filling buttons', () => {
    render(
      <WorkspaceBoardLibraryRail
        isOpen
        workspaceTitle="Agentic A.I."
        search=""
        groupedEntries={{
          created: [],
          artifacts: [],
          findings: [],
          entities: [],
          sources: [],
          signals: [],
        }}
        librarySections={{
          created: false,
          artifacts: false,
          findings: false,
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
        onAddIcon={vi.fn()}
        onTriggerFileUpload={vi.fn()}
        onFileUpload={vi.fn()}
        onToggleLibrarySection={vi.fn()}
        onToggleLibraryEntrySection={vi.fn()}
        onDeleteCreatedItem={vi.fn()}
        onAddToBoard={vi.fn()}
        onAddArtifactPackage={vi.fn()}
      />
    );

    const noteButton = screen.getByRole('button', { name: 'Note' });
    const linkButton = screen.getByRole('button', { name: 'Link' });
    const iconButton = screen.getByRole('button', { name: 'Add icon to board' });
    const fileButton = screen.getByRole('button', { name: 'File' });
    const actionRow = noteButton.parentElement;

    expect(actionRow?.className).toContain('grid');
    expect(actionRow?.className).toContain('grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))]');
    expect(noteButton).toHaveClass('w-full');
    expect(linkButton).toHaveClass('w-full');
    expect(iconButton).toHaveClass('w-full');
    expect(fileButton).toHaveClass('w-full');
  });

  it('does not repeat the item kind inside expanded library entries', () => {
    render(
      <WorkspaceBoardLibraryRail
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
          findings: [],
          entities: [],
          sources: [],
          signals: [],
        }}
        librarySections={{
          created: false,
          artifacts: true,
          findings: false,
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
        onAddIcon={vi.fn()}
        onTriggerFileUpload={vi.fn()}
        onFileUpload={vi.fn()}
        onToggleLibrarySection={vi.fn()}
        onToggleLibraryEntrySection={vi.fn()}
        onDeleteCreatedItem={vi.fn()}
        onAddToBoard={vi.fn()}
        onAddArtifactPackage={vi.fn()}
      />
    );

    expect(screen.getByText('Universal Action Protocol')).toBeInTheDocument();
    expect(screen.getByText('Add To Board')).toBeInTheDocument();
    expect(screen.getByText('Add All')).toBeInTheDocument();
    expect(screen.queryByText('ARTIFACT')).not.toBeInTheDocument();
  });

  it('clamps expanded artifact descriptions to a short preview', () => {
    render(
      <WorkspaceBoardLibraryRail
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
              title: 'Memo vs Zep vs Letta',
              kind: 'ARTIFACT',
              description:
                'As of April 2026, the local AI agent memory landscape has fractured into three dominant architectural paradigms. Memo leads as a pluggable, hybrid memory service optimized for multi-scope state. Letta offers a heavily integrated runtime that handles self-editing agent state directly. Zep focuses on temporal knowledge graphs designed to track fact evolution over time for deterministic retrieval.',
              searchText: 'Memo vs Zep vs Letta',
              iconId: 'file-text',
            },
          ],
          findings: [],
          entities: [],
          sources: [],
          signals: [],
        }}
        librarySections={{
          created: false,
          artifacts: true,
          findings: false,
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
        onAddIcon={vi.fn()}
        onTriggerFileUpload={vi.fn()}
        onFileUpload={vi.fn()}
        onToggleLibrarySection={vi.fn()}
        onToggleLibraryEntrySection={vi.fn()}
        onDeleteCreatedItem={vi.fn()}
        onAddToBoard={vi.fn()}
        onAddArtifactPackage={vi.fn()}
      />
    );

    expect(
      screen.getByText(/As of April 2026, the local AI agent memory landscape/i)
    ).toHaveClass('line-clamp-6');
    expect(screen.getByRole('button', { name: 'Add To Board' })).toBeInTheDocument();
  });

  it('uses the shared thin rail spacing for board entries', () => {
    render(
      <WorkspaceBoardLibraryRail
        isOpen
        workspaceTitle="Agentic A.I."
        search=""
        groupedEntries={{
          created: [],
          artifacts: [],
          findings: [],
          entities: [
            {
              workspaceId: 'ws-1',
              refKind: 'ENTITY',
              refId: 'entity-1',
              title: 'Letta',
              kind: 'ENTITY',
              description: 'Entity description',
              searchText: 'Letta',
              iconId: 'users',
            },
          ],
          sources: [],
          signals: [],
        }}
        librarySections={{
          created: false,
          artifacts: false,
          findings: false,
          entities: true,
          sources: false,
          signals: false,
        }}
        libraryItemSections={{}}
        fileInputRef={{ current: null }}
        sectionScrollClassName=""
        onSearchChange={vi.fn()}
        onCreateNote={vi.fn()}
        onCreateLink={vi.fn()}
        onAddIcon={vi.fn()}
        onTriggerFileUpload={vi.fn()}
        onFileUpload={vi.fn()}
        onToggleLibrarySection={vi.fn()}
        onToggleLibraryEntrySection={vi.fn()}
        onDeleteCreatedItem={vi.fn()}
        onAddToBoard={vi.fn()}
        onAddArtifactPackage={vi.fn()}
      />
    );

    const entryButton = screen.getByRole('button', { name: /Letta/i });
    expect(entryButton.className).toContain('min-h-[34px]');
    expect(entryButton.className).toContain('px-2.5');
    expect(entryButton.className).not.toContain('px-0');
  });

  it('keeps relative desktop positioning for the board library rail', () => {
    render(
      <WorkspaceBoardLibraryRail
        isOpen
        workspaceTitle="Agentic A.I."
        search=""
        groupedEntries={{
          created: [],
          artifacts: [],
          findings: [],
          entities: [],
          sources: [],
          signals: [],
        }}
        librarySections={{
          created: false,
          artifacts: false,
          findings: false,
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
        onAddIcon={vi.fn()}
        onTriggerFileUpload={vi.fn()}
        onFileUpload={vi.fn()}
        onToggleLibrarySection={vi.fn()}
        onToggleLibraryEntrySection={vi.fn()}
        onDeleteCreatedItem={vi.fn()}
        onAddToBoard={vi.fn()}
        onAddArtifactPackage={vi.fn()}
      />
    );

    const panel = screen.getByText('Agentic A.I.').closest('aside');
    expect(panel?.className).toContain('lg:relative');
  });

  it('adds a dedicated findings section to the board library rail', () => {
    render(
      <WorkspaceBoardLibraryRail
        isOpen
        workspaceTitle="Agentic A.I."
        search=""
        groupedEntries={{
          created: [],
          artifacts: [],
          findings: [
            {
              workspaceId: 'ws-1',
              refKind: 'KEY_FINDING',
              refId: 'finding-1',
              title: 'Core divergence is architectural',
              kind: 'FINDING',
              description: 'Each system optimizes a different memory model.',
              searchText: 'architectural divergence',
              iconId: 'file-text',
            },
          ],
          entities: [],
          sources: [],
          signals: [],
        }}
        librarySections={{
          created: false,
          artifacts: false,
          findings: true,
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
        onAddIcon={vi.fn()}
        onTriggerFileUpload={vi.fn()}
        onFileUpload={vi.fn()}
        onToggleLibrarySection={vi.fn()}
        onToggleLibraryEntrySection={vi.fn()}
        onDeleteCreatedItem={vi.fn()}
        onAddToBoard={vi.fn()}
        onAddArtifactPackage={vi.fn()}
      />
    );

    expect(screen.getByText('Findings')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Core divergence is architectural/i })).toBeInTheDocument();
  });
});
