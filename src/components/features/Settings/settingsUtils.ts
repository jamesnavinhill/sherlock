import { Compass, Cpu, Database, Layout, Palette } from 'lucide-react';

import type { ThemeSurfaceScale, ThemeSurfaceSettings } from '@/utils/themeSurfaces';
import type { ThemeFontRole } from '@/utils/themeFonts';
import {
  CHROME_CARD_SECTION_CLASS,
  CHROME_CARD_SECTION_SUBTLE_CLASS,
  CHROME_CARD_SURFACE_CLASS,
  CHROME_PANEL_ACTION_ROW_CLASS,
  CHROME_PANEL_CLASS,
  CHROME_PANEL_HEADER_CLASS,
} from '@/components/ui/chrome';

export const TABS = [
  { id: 'DATA', label: 'Data', icon: Database },
  { id: 'RUNTIME', label: 'Runtime', icon: Cpu },
  { id: 'SCOPES', label: 'Scopes', icon: Compass },
  { id: 'TEMPLATES', label: 'Templates', icon: Layout },
  { id: 'THEME', label: 'Theme', icon: Palette },
] as const;

export const SETTINGS_TAB_DESCRIPTIONS: Record<(typeof TABS)[number]['id'], string> = {
  DATA: 'Backups, imports, quiet mode, and workspace data maintenance.',
  RUNTIME: 'Provider keys, model defaults, and active runtime behavior.',
  SCOPES: 'Scope presets and domain defaults that shape investigations.',
  TEMPLATES: 'Reusable launch and workflow templates for common setups.',
  THEME: 'Surface, typography, and accent controls for Sherlock chrome.',
};

export const SETTINGS_SECTION_BODY_CLASS = 'space-y-6 px-3 pb-3 pt-1';

export const SETTINGS_CARD_CLASS =
  `${CHROME_CARD_SURFACE_CLASS} rounded p-4`;

export const SETTINGS_CARD_INTERACTIVE_CLASS =
  `${SETTINGS_CARD_CLASS} transition-all duration-200 hover:border-osint-primary hover:bg-[var(--osint-rail-interaction-hover-bg)] hover:shadow-[var(--osint-rail-interaction-shadow)]`;

export const SETTINGS_CARD_ACTIVE_CLASS =
  'border-osint-primary/50 bg-[var(--osint-rail-interaction-active-bg)] shadow-[var(--osint-rail-interaction-shadow)]';

export const SETTINGS_CARD_SECTION_CLASS =
  `${CHROME_CARD_SECTION_CLASS} rounded p-4`;

export const SETTINGS_CARD_SECTION_INTERACTIVE_CLASS =
  `${SETTINGS_CARD_SECTION_CLASS} text-zinc-300 transition-all duration-200 hover:border-osint-primary hover:bg-[var(--osint-rail-interaction-hover-bg)] hover:text-[color:var(--osint-text-strong)] hover:shadow-[var(--osint-rail-interaction-shadow)]`;

export const SETTINGS_CARD_SECTION_ACTIVE_CLASS =
  'border-osint-primary/50 bg-[var(--osint-rail-interaction-active-bg)] text-[color:var(--osint-text-strong)] shadow-[var(--osint-rail-interaction-shadow)]';

export const SETTINGS_CARD_SECTION_SUBTLE_CLASS =
  `${CHROME_CARD_SECTION_SUBTLE_CLASS} rounded p-4`;

export const SETTINGS_SURFACE_BUTTON_CLASS = 'osint-settings-surface-button';

export const SETTINGS_ACCORDION_CLASS = 'osint-settings-accordion mb-0';

export const SETTINGS_TOOLBAR_CLASS =
  `${CHROME_CARD_SECTION_SUBTLE_CLASS} flex flex-col justify-between gap-4 rounded p-4 md:flex-row md:items-center`;

export const SETTINGS_MODAL_PANEL_CLASS = `${CHROME_PANEL_CLASS} osint-section-shadow`;

export const SETTINGS_MODAL_HEADER_CLASS =
  `${CHROME_PANEL_HEADER_CLASS} flex items-start justify-between gap-4`;

export const SETTINGS_MODAL_ACTION_ROW_CLASS =
  `${CHROME_PANEL_ACTION_ROW_CLASS} flex items-center justify-between`;

export const SETTINGS_SELECT_TRIGGER_CLASS = 'p-2 pr-8 osint-meta-value';

export const SETTINGS_INPUT_CLASS = 'osint-input-field w-full px-3 py-2 osint-meta-value';

export const SETTINGS_SEARCH_INPUT_CLASS =
  'osint-input-field w-full py-2 pl-10 pr-4 osint-meta-value';

export const SETTINGS_TEXTAREA_CLASS =
  'osint-input-field w-full resize-none px-3 py-2 osint-meta-value';

export const SURFACE_LABELS: Record<keyof ThemeSurfaceScale, string> = {
  background: 'Workspace Background',
  panel: 'Panel Background',
  surface: 'Raised Surface',
};

export const FONT_ROLE_CARDS: Array<{
  key: ThemeFontRole;
  label: string;
  description: string;
  sample: string;
}> = [
  {
    key: 'ui',
    label: 'UI Text',
    description: 'Default reading font for reports, forms, and body copy.',
    sample: 'Signal review stays readable when the volume gets messy.',
  },
  {
    key: 'display',
    label: 'Display',
    description: 'Large headings, report titles, and hero-level moments.',
    sample: 'Operational Summary',
  },
  {
    key: 'label',
    label: 'Labels',
    description: 'Navigation chrome, tabs, and uppercase interface metadata.',
    sample: 'THEME CONTROL MATRIX',
  },
  {
    key: 'mono',
    label: 'Data Text',
    description: 'Dense evidence, structured values, code, and logs.',
    sample: 'oklch(0.21 0.01 286) :: artifact_id=ops-17',
  },
];

export const cloneThemeSurfaceSettings = (
  settings: ThemeSurfaceSettings
): ThemeSurfaceSettings => ({
  dark: {
    background: { ...settings.dark.background },
    panel: { ...settings.dark.panel },
    surface: { ...settings.dark.surface },
  },
  light: {
    background: { ...settings.light.background },
    panel: { ...settings.light.panel },
    surface: { ...settings.light.surface },
  },
});

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getSurfacePreviewTone = (
  surface: ThemeSurfaceScale[keyof ThemeSurfaceScale]
) => {
  const usesDarkInk = surface.lightness >= 0.72;

  return usesDarkInk
    ? {
        textColor: 'rgba(31, 22, 13, 0.92)',
        labelColor: 'rgba(31, 22, 13, 0.62)',
        borderColor: 'rgba(82, 63, 40, 0.26)',
        overlayColor: 'rgba(255, 255, 255, 0.16)',
      }
    : {
        textColor: 'rgba(255, 253, 248, 0.92)',
        labelColor: 'rgba(255, 253, 248, 0.7)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        overlayColor: 'rgba(0, 0, 0, 0.12)',
      };
};
