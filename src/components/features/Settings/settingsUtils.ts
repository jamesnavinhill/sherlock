import { Compass, Cpu, Database, Layout, Palette } from 'lucide-react';

import type { ThemeSurfaceScale, ThemeSurfaceSettings } from '@/utils/themeSurfaces';
import type { ThemeFontSettings } from '@/utils/themeFonts';

export const TABS = [
  { id: 'DATA', label: 'Data', icon: Database },
  { id: 'RUNTIME', label: 'Runtime', icon: Cpu },
  { id: 'SCOPES', label: 'Scopes', icon: Compass },
  { id: 'TEMPLATES', label: 'Templates', icon: Layout },
  { id: 'THEME', label: 'Theme', icon: Palette },
] as const;

export const SURFACE_LABELS: Record<keyof ThemeSurfaceScale, string> = {
  background: 'Workspace Background',
  panel: 'Panel Background',
  surface: 'Raised Surface',
};

export const FONT_ROLE_CARDS: Array<{
  key: keyof ThemeFontSettings;
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
