import React from 'react';

import { Accordion } from '@/components/ui/Accordion';
import { buildAccentColor } from '@/utils/accent';
import type { SherlockTheme, SherlockThemeMode } from '@/system/theme/schema';
import {
  CodePreview,
  PaletteSwatch,
  SECTION_ACTION_BUTTON_CLASS,
  SECTION_WRAPPER_CLASS,
  copyText,
  toggleSection,
} from './workbenchPanelShared';

interface ThemeWorkbenchExportTabProps {
  activeMode: SherlockThemeMode;
  activeTheme: SherlockTheme;
  exportResolvedCss: string;
  exportThemeJson: string;
  openSections: string[];
  setOpenSections: React.Dispatch<React.SetStateAction<string[]>>;
}

export const ThemeWorkbenchExportTab: React.FC<ThemeWorkbenchExportTabProps> = ({
  activeMode,
  activeTheme,
  exportResolvedCss,
  exportThemeJson,
  openSections,
  setOpenSections,
}) => {
  const activeAccent = activeTheme.accent[activeMode];
  const activeGraphs = activeTheme.graphs[activeMode];
  const activeSurfaces = activeTheme.surfaces[activeMode];

  const paletteSwatches = [
    { label: 'Accent', value: buildAccentColor(activeAccent) },
    { label: 'Background', value: buildAccentColor(activeTheme.background[activeMode]) },
    { label: 'Shell', value: buildAccentColor(activeSurfaces.shell) },
    { label: 'Rail', value: buildAccentColor(activeSurfaces.rail) },
    { label: 'Panel', value: buildAccentColor(activeSurfaces.panel) },
    { label: 'Surface', value: buildAccentColor(activeSurfaces.surface) },
    ...activeGraphs.map((graph, index) => ({
      label: `Graph ${index + 1}`,
      value: buildAccentColor(graph),
    })),
  ];

  const onToggle = (sectionId: string) => {
    setOpenSections((current) => toggleSection(current, sectionId));
  };

  return (
    <div className={SECTION_WRAPPER_CLASS}>
      <Accordion
        title="Token Snapshot"
        isOpen={openSections.includes('tokens')}
        onToggle={() => onToggle('tokens')}
        actions={
          <button
            type="button"
            onClick={() => void copyText(exportThemeJson)}
            className={SECTION_ACTION_BUTTON_CLASS}
          >
            Copy
          </button>
        }
        showActionsWhenOpenOnly
      >
        <CodePreview value={exportThemeJson} />
      </Accordion>

      <Accordion
        title="Resolved Styles"
        isOpen={openSections.includes('css')}
        onToggle={() => onToggle('css')}
        actions={
          <button
            type="button"
            onClick={() => void copyText(exportResolvedCss)}
            className={SECTION_ACTION_BUTTON_CLASS}
          >
            Copy
          </button>
        }
        showActionsWhenOpenOnly
      >
        <CodePreview value={exportResolvedCss} />
      </Accordion>

      <Accordion
        title="Palette Swatches"
        isOpen={openSections.includes('swatches')}
        onToggle={() => onToggle('swatches')}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {paletteSwatches.map((swatch) => (
            <PaletteSwatch
              key={`${swatch.label}-${swatch.value}`}
              label={swatch.label}
              value={swatch.value}
            />
          ))}
        </div>
      </Accordion>
    </div>
  );
};
