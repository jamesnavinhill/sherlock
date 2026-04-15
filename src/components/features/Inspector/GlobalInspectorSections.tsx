import React from 'react';

import { Accordion } from '@/components/ui/Accordion';
import { CHROME_RAIL_SECTION_SCROLL_CLASS, getRailAccordionClassName } from '@/components/ui/chrome';
import type { GlobalInspectorSection } from './globalInspectorTypes';

interface GlobalInspectorSectionsProps {
  sections: GlobalInspectorSection[];
}

export const GlobalInspectorSections: React.FC<GlobalInspectorSectionsProps> = ({ sections }) => {
  if (sections.length === 0) return null;
  const hasOpenSection = sections.some((section) => section.isOpen);

  return (
    <>
      {sections.map((section, index) => (
        <Accordion
          key={section.id}
          title={section.title}
          count={section.count}
          icon={section.icon}
          isOpen={section.isOpen}
          onToggle={section.onToggle}
          className={
            section.className ||
            getRailAccordionClassName({
              hasOpenSection,
              isLast: index === sections.length - 1,
              isOpen: section.isOpen,
            })
          }
          headerClassName={section.headerClassName}
          chevronClassName={section.chevronClassName}
          contentClassName={section.contentClassName || CHROME_RAIL_SECTION_SCROLL_CLASS}
        >
          {section.content}
        </Accordion>
      ))}
    </>
  );
};
