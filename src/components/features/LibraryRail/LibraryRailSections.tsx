import React from 'react';

import { Accordion } from '@/components/ui/Accordion';
import { CHROME_RAIL_SECTION_SCROLL_CLASS, getRailAccordionClassName } from '@/components/ui/chrome';
import { LibraryRailEntry } from './LibraryRailEntry';
import type { LibraryRailSection } from './libraryRailTypes';

interface LibraryRailSectionsProps {
  sections: LibraryRailSection[];
}

export const LibraryRailSections: React.FC<LibraryRailSectionsProps> = ({ sections }) => {
  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section) => (
        <Accordion
          key={section.id}
          title={section.title}
          count={section.count}
          icon={section.icon}
          isOpen={section.isOpen}
          onToggle={section.onToggle}
          className={section.className || getRailAccordionClassName(section.isOpen)}
          headerClassName={section.headerClassName}
          contentClassName={section.contentClassName || CHROME_RAIL_SECTION_SCROLL_CLASS}
        >
          {section.content ? (
            section.content
          ) : section.entries?.length ? (
            <div className="space-y-2">
              {section.entries.map((entry) => (
                <LibraryRailEntry key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            section.emptyState || (
              <p className="px-2 py-1 osint-body-quiet italic">No items in this section.</p>
            )
          )}
        </Accordion>
      ))}
    </>
  );
};
