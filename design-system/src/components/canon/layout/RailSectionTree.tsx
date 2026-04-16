import type { ReactNode } from 'react';
import { useState } from 'react';

import { AccordionSection } from '../disclosure/AccordionSection';

export interface RailSectionNode {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
  content?: ReactNode;
  sections?: ReadonlyArray<RailSectionNode>;
  defaultOpen?: boolean;
  actions?: ReactNode;
  showActionsWhenOpenOnly?: boolean;
  compact?: boolean;
}

export interface RailSectionTreeProps {
  sections: ReadonlyArray<RailSectionNode>;
  openMode?: 'exclusive' | 'multiple';
}

const collectDefaultNestedOpenKeys = (
  sections: ReadonlyArray<RailSectionNode>,
  ancestry: ReadonlyArray<string> = []
): string[] =>
  sections.flatMap((section) => {
    const key = [...ancestry, section.id].join('::');
    const ownKey = ancestry.length > 0 && section.defaultOpen ? [key] : [];
    const childKeys = section.sections
      ? collectDefaultNestedOpenKeys(section.sections, [...ancestry, section.id])
      : [];

    return [...ownKey, ...childKeys];
  });

export function RailSectionTree({
  sections,
  openMode = 'exclusive',
}: RailSectionTreeProps) {
  const [openTopLevelIds, setOpenTopLevelIds] = useState<string[]>(() => {
    const defaultIds = sections.filter((section) => section.defaultOpen).map((section) => section.id);
    return openMode === 'exclusive' ? defaultIds.slice(0, 1) : defaultIds;
  });
  const [openNestedKeys, setOpenNestedKeys] = useState<string[]>(() =>
    collectDefaultNestedOpenKeys(sections)
  );

  const toggleTopLevel = (id: string) => {
    setOpenTopLevelIds((current) => {
      if (current.includes(id)) {
        return current.filter((currentId) => currentId !== id);
      }

      return openMode === 'exclusive' ? [id] : [...current, id];
    });
  };

  const toggleNested = (key: string) => {
    setOpenNestedKeys((current) =>
      current.includes(key)
        ? current.filter((currentKey) => currentKey !== key)
        : [...current, key]
    );
  };

  const renderSections = (
    currentSections: ReadonlyArray<RailSectionNode>,
    ancestry: ReadonlyArray<string> = []
  ): ReactNode =>
    currentSections.map((section) => {
      const key = [...ancestry, section.id].join('::');
      const nested = ancestry.length > 0;
      const isOpen = nested ? openNestedKeys.includes(key) : openTopLevelIds.includes(section.id);

      return (
        <AccordionSection
          key={key}
          title={section.title}
          meta={section.meta}
          icon={section.icon}
          compact={section.compact}
          actions={section.actions}
          showActionsWhenOpenOnly={section.showActionsWhenOpenOnly}
          variant={nested ? 'nested' : 'default'}
          isOpen={isOpen}
          onToggle={() => (nested ? toggleNested(key) : toggleTopLevel(section.id))}
        >
          <>
            {section.content}
            {section.sections?.length
              ? renderSections(section.sections, [...ancestry, section.id])
              : null}
          </>
        </AccordionSection>
      );
    });

  return <>{renderSections(sections)}</>;
}
