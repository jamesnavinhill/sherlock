import React from 'react';
import {
  FilePlus2,
  FileText,
  Link2,
  Network,
  Radio,
  Search,
  Shapes,
  Trash2,
} from 'lucide-react';

import { Accordion } from '@/components/ui/Accordion';
import { boardRefKey, type WorkspaceLibraryEntry } from '@/services/workspace/library';
import { serializeBoardReference } from '@/services/workspace/boardShapes';

interface GroupedEntries {
  created: WorkspaceLibraryEntry[];
  artifacts: WorkspaceLibraryEntry[];
  entities: WorkspaceLibraryEntry[];
  sources: WorkspaceLibraryEntry[];
  signals: WorkspaceLibraryEntry[];
}

interface BoardLibraryRailProps {
  isOpen: boolean;
  workspaceTitle: string;
  search: string;
  groupedEntries: GroupedEntries;
  librarySections: Record<keyof GroupedEntries, boolean>;
  libraryItemSections: Record<string, boolean>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  sectionScrollClassName: string;
  onSearchChange: (value: string) => void;
  onCreateNote: () => void;
  onCreateLink: () => void;
  onTriggerFileUpload: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleLibrarySection: (section: keyof GroupedEntries) => void;
  onToggleLibraryEntrySection: (entryKey: string) => void;
  onDeleteCreatedItem: (entry: WorkspaceLibraryEntry) => void;
  onAddToBoard: (entry: WorkspaceLibraryEntry) => void;
}

export const BoardLibraryRail: React.FC<BoardLibraryRailProps> = ({
  isOpen,
  workspaceTitle,
  search,
  groupedEntries,
  librarySections,
  libraryItemSections,
  fileInputRef,
  sectionScrollClassName,
  onSearchChange,
  onCreateNote,
  onCreateLink,
  onTriggerFileUpload,
  onFileUpload,
  onToggleLibrarySection,
  onToggleLibraryEntrySection,
  onDeleteCreatedItem,
  onAddToBoard,
}) => (
  <aside
    className={`absolute left-0 top-0 z-30 flex h-full flex-col overflow-hidden border-r border-zinc-800 bg-black/95 transition-all duration-200 xl:relative xl:translate-x-0 ${
      isOpen
        ? 'w-[min(23rem,calc(100vw-1rem))] translate-x-0'
        : 'w-[min(23rem,calc(100vw-1rem))] -translate-x-full xl:w-0 xl:border-r-0'
    }`}
  >
    <div className="border-b border-zinc-800 px-4 py-4">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
        <Shapes className="h-4 w-4 text-osint-primary" />
        Canonical Library
      </div>
      <div className="mt-1 text-sm font-bold uppercase tracking-widest text-white">
        {workspaceTitle}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onCreateNote}
          className="osint-button-primary inline-flex items-center gap-2 px-3 py-2 text-[11px] font-mono uppercase"
        >
          <FilePlus2 className="h-4 w-4" />
          Note
        </button>
        <button
          onClick={onCreateLink}
          className="osint-button-primary inline-flex items-center gap-2 px-3 py-2 text-[11px] font-mono uppercase"
        >
          <Link2 className="h-4 w-4" />
          Link
        </button>
        <button
          onClick={onTriggerFileUpload}
          className="osint-button-primary inline-flex items-center gap-2 px-3 py-2 text-[11px] font-mono uppercase"
        >
          <Radio className="h-4 w-4" />
          File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onFileUpload}
        />
      </div>
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search library..."
          className="w-full border border-zinc-700 bg-black px-10 py-2 text-sm text-white outline-none transition focus:border-osint-primary"
        />
      </div>
    </div>

    <div className="flex-1 min-h-0 overflow-hidden p-3">
      {(
        [
          ['created', 'Created Items', groupedEntries.created, FilePlus2],
          ['artifacts', 'Artifacts', groupedEntries.artifacts, FileText],
          ['entities', 'Entities', groupedEntries.entities, Network],
          ['sources', 'Sources', groupedEntries.sources, Link2],
          ['signals', 'Signals', groupedEntries.signals, Radio],
        ] as const
      ).map(([key, title, entries, icon]) => (
        <Accordion
          key={key}
          title={title}
          count={entries.length}
          icon={icon}
          isOpen={librarySections[key]}
          onToggle={() => onToggleLibrarySection(key)}
          contentClassName={sectionScrollClassName}
        >
          <div className="space-y-2">
            {entries.length === 0 ? (
              <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
                No matching items in this section.
              </p>
            ) : (
              entries.map((entry) => (
                <div
                  key={boardRefKey(entry)}
                  draggable
                  onDragStart={(event) =>
                    event.dataTransfer.setData(
                      'application/json+sherlock-entry',
                      serializeBoardReference(entry)
                    )
                  }
                >
                  <Accordion
                    title={entry.title}
                    isOpen={!!libraryItemSections[boardRefKey(entry)]}
                    onToggle={() => onToggleLibraryEntrySection(boardRefKey(entry))}
                    className="border-zinc-800 bg-zinc-900/40 text-zinc-200"
                    headerClassName="bg-black/10 px-2.5 py-2 text-left text-[10px] font-normal leading-5 tracking-[0.04em] text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-200"
                    chevronClassName="h-[15px] w-[15px] shrink-0 text-zinc-500"
                  >
                    <div className="space-y-3">
                      <div
                        className={`text-xs leading-5 text-zinc-500 ${
                          key === 'sources' ? 'line-clamp-2 break-all' : ''
                        }`}
                      >
                        {entry.description || 'Open this item from the library to place it on the board.'}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                          {entry.kind}
                        </div>
                        <div className="flex items-center gap-2">
                          {key === 'created' && entry.refKind === 'WORKSPACE_ITEM' ? (
                            <button
                              type="button"
                              onClick={() => onDeleteCreatedItem(entry)}
                              className="inline-flex items-center gap-1 border border-zinc-700 px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-400 transition hover:border-red-400/50 hover:text-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => onAddToBoard(entry)}
                            className="osint-button-primary px-3 py-1.5 text-[10px] font-mono uppercase"
                          >
                            Add To Board
                          </button>
                        </div>
                      </div>
                    </div>
                  </Accordion>
                </div>
              ))
            )}
          </div>
        </Accordion>
      ))}
    </div>
  </aside>
);
