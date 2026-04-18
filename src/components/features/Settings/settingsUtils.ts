import { Compass, Cpu, Database, Layout, Palette } from 'lucide-react';

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

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
