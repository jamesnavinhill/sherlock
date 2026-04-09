import { useCallback, useMemo, useState, type SetStateAction } from 'react';

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

const resolveOpenSection = <TSection extends string>(
  sections: readonly TSection[],
  openSection: TSection | null
) => (openSection && sections.includes(openSection) ? openSection : null);

const resolveVisibleOpenSection = <TSection extends string>(
  sections: readonly TSection[],
  openSection: TSection | null,
  initialOpenSection?: TSection | null
) => {
  const resolvedCurrent = resolveOpenSection(sections, openSection);
  if (resolvedCurrent) return resolvedCurrent;
  if (openSection === null) return null;
  return resolveOpenSection(sections, initialOpenSection ?? null);
};

export const useExclusivePanelSections = <TSection extends string>(
  sections: readonly TSection[],
  options: UseExclusivePanelSectionsOptions<TSection> = {}
) => {
  const [openSectionState, setOpenSectionState] = useState<TSection | null>(
    resolveOpenSection(sections, options.initialOpenSection ?? null)
  );

  const openSection = useMemo(
    () => resolveVisibleOpenSection(sections, openSectionState, options.initialOpenSection),
    [openSectionState, options.initialOpenSection, sections]
  );

  const setOpenSection = useCallback(
    (nextSection: SetStateAction<TSection | null>) => {
      setOpenSectionState((current) => {
        const resolvedCurrent = resolveVisibleOpenSection(
          sections,
          current,
          options.initialOpenSection
        );
        const resolvedNext =
          typeof nextSection === 'function' ? nextSection(resolvedCurrent) : nextSection;

        return resolveOpenSection(sections, resolvedNext);
      });
    },
    [options.initialOpenSection, sections]
  );

  const state = useMemo(
    () => buildExclusiveState(sections, openSection),
    [openSection, sections]
  );

  const toggleSection = useCallback(
    (section: TSection) => {
      setOpenSection((current) => (current === section ? null : section));
    },
    [setOpenSection]
  );

  const closeAllSections = useCallback(() => {
    setOpenSection(null);
  }, [setOpenSection]);

  return {
    closeAllSections,
    openSection,
    setOpenSection,
    state,
    toggleSection,
  };
};
