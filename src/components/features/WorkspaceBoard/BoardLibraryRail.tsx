import React from 'react';
import {
  FilePlus2,
  Link2,
  Radio,
  Search,
  Trash2,
} from 'lucide-react';

import { Accordion } from '@/components/ui/Accordion';
import { AppIcon } from '@/lib/appIcons';
import {
  CHROME_ACTION_BUTTON_CLASS,
  CHROME_PANEL_HEADER_CLASS,
  CHROME_RAIL_BODY_CLASS,
  CHROME_RAIL_SECTION_SCROLL_CLASS,
  CHROME_THIN_ACCORDION_TRIGGER_CLASS,
  CHROME_THIN_ACTION_BUTTON_CLASS,
  CHROME_THIN_NESTED_ITEM_CLASS,
  getChromeThinActionRowClassName,
  getRailAccordionClassName,
} from '@/components/ui/chrome';
import { PANEL_SECTION_ICONS } from '@/components/ui/panelSectionIcons';
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
    className={`osint-panel-shell absolute left-0 top-0 z-30 flex h-full flex-col overflow-hidden border-r border-zinc-800 bg-black/95 transition-all duration-200 xl:relative xl:translate-x-0 ${
      isOpen
        ? 'w-[min(23rem,calc(100vw-1rem))] translate-x-0'
        : 'w-[min(23rem,calc(100vw-1rem))] -translate-x-full xl:w-0 xl:border-r-0'
    }`}
  >
    <div className={CHROME_PANEL_HEADER_CLASS}>
      <div className="osint-eyebrow">Library</div>
      <div className="mt-1 osint-panel-title">{workspaceTitle}</div>
      <div
        aria-hidden="true"
        data-testid="board-library-title-divider"
        className="-mx-4 mt-3 border-t border-zinc-800/80"
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={onCreateNote}
          className={CHROME_ACTION_BUTTON_CLASS}
        >
          <FilePlus2 className="h-4 w-4" />
          Note
        </button>
        <button
          onClick={onCreateLink}
          className={CHROME_ACTION_BUTTON_CLASS}
        >
          <Link2 className="h-4 w-4" />
          Link
        </button>
        <button
          onClick={onTriggerFileUpload}
          className={CHROME_ACTION_BUTTON_CLASS}
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
      <div
        aria-hidden="true"
        data-testid="board-library-search-divider"
        className="mt-4 border-t border-zinc-800/80"
      />
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search library..."
          className="osint-input-field w-full px-10 py-2 text-sm"
        />
      </div>
    </div>

    <div className={CHROME_RAIL_BODY_CLASS}>
      {(
        [
          ['created', 'Created Items', groupedEntries.created, FilePlus2],
          ['artifacts', 'Artifacts', groupedEntries.artifacts, PANEL_SECTION_ICONS.artifacts],
          ['entities', 'Entities', groupedEntries.entities, PANEL_SECTION_ICONS.entities],
          ['sources', 'Sources', groupedEntries.sources, PANEL_SECTION_ICONS.sources],
          ['signals', 'Signals', groupedEntries.signals, PANEL_SECTION_ICONS.signals],
        ] as const
      ).map(([key, title, entries, icon]) => (
        <Accordion
          key={key}
          title={title}
          count={entries.length}
          icon={icon}
          isOpen={librarySections[key]}
          onToggle={() => onToggleLibrarySection(key)}
          className={getRailAccordionClassName(librarySections[key])}
          contentClassName={sectionScrollClassName || CHROME_RAIL_SECTION_SCROLL_CLASS}
        >
          <div className="space-y-2">
            {entries.length === 0 ? (
              <p className="px-2 py-1 osint-body-quiet italic">No matching items in this section.</p>
            ) : (
              entries.map((entry) => {
                const entryKey = boardRefKey(entry);
                const isEntryOpen = !!libraryItemSections[entryKey];
                const entryTitle = (
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-zinc-800 bg-zinc-950/60 text-zinc-300">
                      <AppIcon iconId={entry.iconId} size={13} strokeWidth={1.9} />
                    </span>
                    <span className="truncate">{entry.title}</span>
                  </span>
                );

                return (
                  <div
                    key={entryKey}
                  draggable
                  onDragStart={(event) =>
                    event.dataTransfer.setData(
                      'application/json+sherlock-entry',
                      serializeBoardReference(entry)
                    )
                  }
                  >
                    <Accordion
                      title={entryTitle}
                      isOpen={isEntryOpen}
                      onToggle={() => onToggleLibraryEntrySection(entryKey)}
                      variant="nested"
                      headerClassName={CHROME_THIN_ACCORDION_TRIGGER_CLASS}
                    >
                      <div className={`${CHROME_THIN_NESTED_ITEM_CLASS} space-y-2`}>
                        <div
                          className={`osint-body-quiet text-zinc-500 ${
                            key === 'sources' ? 'line-clamp-2 break-all' : ''
                          }`}
                        >
                          {entry.description ||
                            'Open this item from the library to place it on the board.'}
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="osint-meta-label">{entry.kind}</div>
                        </div>
                        <div
                          className={getChromeThinActionRowClassName(
                            key === 'created' && entry.refKind === 'WORKSPACE_ITEM' ? 2 : 1
                          )}
                        >
                            {key === 'created' && entry.refKind === 'WORKSPACE_ITEM' ? (
                              <button
                                type="button"
                                onClick={() => onDeleteCreatedItem(entry)}
                                className={`${CHROME_THIN_ACTION_BUTTON_CLASS} osint-danger-inline w-full`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => onAddToBoard(entry)}
                              className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full`}
                            >
                              Add To Board
                            </button>
                        </div>
                      </div>
                    </Accordion>
                  </div>
                );
              })
            )}
          </div>
        </Accordion>
      ))}
    </div>
  </aside>
);
