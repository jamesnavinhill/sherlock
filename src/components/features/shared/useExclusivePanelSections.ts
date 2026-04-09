import { useCallback, useMemo, useState } from 'react';

export interface UseExclusivePanelSectionsOptions<TSection extends string> {
  initialOpenSection?: TSection | null;
}

const buildExclusiveState = <TSection extends string>(
  sections: readonly TSection[],
  openSection: TSection | null
): Record<TSection, boolean> =>
  Object.fromEntries(sections.map((section) => [section, openSection === section])) as Record<
    TSection,
    boolean
  >;

export const useExclusivePanelSections = <TSection extends string>(
  sections: readonly TSection[],
  options: UseExclusivePanelSectionsOptions<TSection> = {}
) => {
  const [openSection, setOpenSection] = useState<TSection | null>(
    options.initialOpenSection ?? null
  );

  const state = useMemo(
    () => buildExclusiveState(sections, openSection),
    [openSection, sections]
  );

  const toggleSection = useCallback((section: TSection) => {
    setOpenSection((current) => (current === section ? null : section));
  }, []);

  const closeAllSections = useCallback(() => {
    setOpenSection(null);
  }, []);

  return {
    closeAllSections,
    openSection,
    setOpenSection,
    state,
    toggleSection,
  };
};
