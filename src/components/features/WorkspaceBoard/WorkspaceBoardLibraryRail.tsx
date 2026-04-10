import React from 'react';
import { ChevronDown, ChevronRight, FilePlus2, Link2, Radio, Sparkles, Trash2 } from 'lucide-react';

import { LibraryRailSearch } from '@/components/features/LibraryRail/LibraryRailSearch';
import { LibraryRailSections } from '@/components/features/LibraryRail/LibraryRailSections';
import { LibraryRailShell } from '@/components/features/LibraryRail/LibraryRailShell';
import type { LibraryRailSection } from '@/components/features/LibraryRail/libraryRailTypes';
import { AppIcon } from '@/lib/appIcons';
import {
  CHROME_RAIL_SECTION_SCROLL_CLASS,
  CHROME_THIN_ACTION_BUTTON_CLASS,
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

interface WorkspaceBoardLibraryRailProps {
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
  onAddIcon: () => void;
  onTriggerFileUpload: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleLibrarySection: (section: keyof GroupedEntries) => void;
  onToggleLibraryEntrySection: (entryKey: string) => void;
  onDeleteCreatedItem: (entry: WorkspaceLibraryEntry) => void;
  onAddToBoard: (entry: WorkspaceLibraryEntry) => void;
}

export const WorkspaceBoardLibraryRail: React.FC<WorkspaceBoardLibraryRailProps> = ({
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
  onAddIcon,
  onTriggerFileUpload,
  onFileUpload,
  onToggleLibrarySection,
  onToggleLibraryEntrySection,
  onDeleteCreatedItem,
  onAddToBoard,
}) => {
  const railSectionScrollClassName = sectionScrollClassName || CHROME_RAIL_SECTION_SCROLL_CLASS;
  const sections: LibraryRailSection[] = (
    [
      ['created', 'Created Items', groupedEntries.created, FilePlus2],
      ['artifacts', 'Artifacts', groupedEntries.artifacts, PANEL_SECTION_ICONS.artifacts],
      ['entities', 'Entities', groupedEntries.entities, PANEL_SECTION_ICONS.entities],
      ['sources', 'Sources', groupedEntries.sources, PANEL_SECTION_ICONS.sources],
      ['signals', 'Signals', groupedEntries.signals, PANEL_SECTION_ICONS.signals],
    ] as const
  ).map(([key, title, entries, icon]) => ({
    id: key,
    title,
    count: entries.length,
    icon,
    isOpen: librarySections[key],
    onToggle: () => onToggleLibrarySection(key),
    className: getRailAccordionClassName(librarySections[key]),
    contentClassName: railSectionScrollClassName,
    content: (
      <div className="space-y-1">
        {entries.length === 0 ? (
          <p className="px-2 py-1 osint-body-quiet italic">No matching items in this section.</p>
        ) : (
          entries.map((entry) => {
            const entryKey = boardRefKey(entry);
            const isEntryOpen = !!libraryItemSections[entryKey];
            const showSourceIcon = key === 'sources';

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
                <div className="osint-panel-item">
                  <button
                    type="button"
                    onClick={() => onToggleLibraryEntrySection(entryKey)}
                    className="osint-rail-item-trigger osint-meta-label-strong flex min-h-[34px] w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[11px] text-zinc-300"
                  >
                    <span
                      className={`flex min-w-0 items-center ${showSourceIcon ? 'gap-2' : 'pl-2.5'}`}
                    >
                      {showSourceIcon ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-zinc-400">
                          <AppIcon iconId={entry.iconId} size={11} strokeWidth={1.9} />
                        </span>
                      ) : null}
                      <span className="truncate osint-body-quiet leading-5 text-zinc-300">
                        {entry.title}
                      </span>
                    </span>
                    {isEntryOpen ? (
                      <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    ) : (
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    )}
                  </button>
                  {isEntryOpen ? (
                    <div className="border-t border-zinc-800/70 p-1.5">
                      <div className="space-y-2">
                        <div
                          className={`osint-body-quiet text-zinc-500 ${
                            key === 'sources' ? 'line-clamp-2 break-all' : ''
                          }`}
                        >
                          {entry.description ||
                            'Open this item from the library to place it on the board.'}
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
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    ),
  }));

  return (
    <LibraryRailShell
      isOpen={isOpen}
      title={workspaceTitle}
      className="lg:relative lg:z-0"
      actions={
        <div className="grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-2">
          <button
            type="button"
            onClick={onCreateNote}
            className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full`}
          >
            <FilePlus2 className="h-3.5 w-3.5" />
            Note
          </button>
          <button
            type="button"
            onClick={onCreateLink}
            className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full`}
          >
            <Link2 className="h-3.5 w-3.5" />
            Link
          </button>
          <button
            type="button"
            onClick={onAddIcon}
            className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full`}
            title="Add icon to board"
            aria-label="Add icon to board"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Icon
          </button>
          <button
            type="button"
            onClick={onTriggerFileUpload}
            className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full`}
          >
            <Radio className="h-3.5 w-3.5" />
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
      }
      search={<LibraryRailSearch value={search} onChange={onSearchChange} />}
      widthClassName="w-[min(23rem,calc(100vw-1rem))]"
    >
      <LibraryRailSections sections={sections} />
    </LibraryRailShell>
  );
};
