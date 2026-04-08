import type { AccentSettings } from './accent';
import { buildAccentColor } from './accent';

export interface ThemeSurfaceScale {
  background: AccentSettings;
  panel: AccentSettings;
  surface: AccentSettings;
}

export interface ThemeSurfaceSettings {
  dark: ThemeSurfaceScale;
  light: ThemeSurfaceScale;
}

export interface ThemeSurfacePreset {
  id: string;
  label: string;
  description: string;
  settings: ThemeSurfaceSettings;
}

export const DEFAULT_THEME_SURFACE_SETTINGS: ThemeSurfaceSettings = {
  dark: {
    background: { hue: 0, lightness: 0, chroma: 0 },
    panel: { hue: 286, lightness: 0.141, chroma: 0.004 },
    surface: { hue: 286, lightness: 0.21, chroma: 0.006 },
  },
  light: {
    background: { hue: 85, lightness: 0.88, chroma: 0.002 },
    panel: { hue: 85, lightness: 0.9, chroma: 0.004 },
    surface: { hue: 81, lightness: 0.975, chroma: 0.004 },
  },
};

export const THEME_SURFACE_PRESETS: ThemeSurfacePreset[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Current Sherlock contrast balance with warm paper light mode.',
    settings: DEFAULT_THEME_SURFACE_SETTINGS,
  },
  {
    id: 'graphite',
    label: 'Graphite',
    description: 'Neutral dark chrome with restrained daylight surfaces.',
    settings: {
      dark: {
        background: { hue: 220, lightness: 0.01, chroma: 0.004 },
        panel: { hue: 228, lightness: 0.125, chroma: 0.01 },
        surface: { hue: 232, lightness: 0.205, chroma: 0.012 },
      },
      light: {
        background: { hue: 220, lightness: 0.95, chroma: 0.01 },
        panel: { hue: 220, lightness: 0.965, chroma: 0.012 },
        surface: { hue: 218, lightness: 0.905, chroma: 0.016 },
      },
    },
  },
  {
    id: 'cobalt',
    label: 'Cobalt',
    description: 'Cool signal-room surfaces with a crisp brighter stack.',
    settings: {
      dark: {
        background: { hue: 236, lightness: 0.02, chroma: 0.02 },
        panel: { hue: 244, lightness: 0.13, chroma: 0.028 },
        surface: { hue: 248, lightness: 0.215, chroma: 0.034 },
      },
      light: {
        background: { hue: 220, lightness: 0.94, chroma: 0.03 },
        panel: { hue: 224, lightness: 0.965, chroma: 0.034 },
        surface: { hue: 220, lightness: 0.9, chroma: 0.045 },
      },
    },
  },
  {
    id: 'ember',
    label: 'Ember',
    description: 'Warm control-room surfaces with richer bronze highlights.',
    settings: {
      dark: {
        background: { hue: 18, lightness: 0.01, chroma: 0.01 },
        panel: { hue: 28, lightness: 0.13, chroma: 0.02 },
        surface: { hue: 32, lightness: 0.215, chroma: 0.028 },
      },
      light: {
        background: { hue: 74, lightness: 0.94, chroma: 0.03 },
        panel: { hue: 70, lightness: 0.962, chroma: 0.032 },
        surface: { hue: 64, lightness: 0.9, chroma: 0.04 },
      },
    },
  },
  {
    id: 'terminal',
    label: 'Terminal',
    description: 'Slight phosphor lean with higher separation in both modes.',
    settings: {
      dark: {
        background: { hue: 145, lightness: 0, chroma: 0.01 },
        panel: { hue: 150, lightness: 0.12, chroma: 0.024 },
        surface: { hue: 154, lightness: 0.205, chroma: 0.032 },
      },
      light: {
        background: { hue: 98, lightness: 0.935, chroma: 0.03 },
        panel: { hue: 102, lightness: 0.958, chroma: 0.034 },
        surface: { hue: 104, lightness: 0.885, chroma: 0.044 },
      },
    },
  },
  {
    id: 'archive',
    label: 'Archive',
    description: 'Muted ink-on-paper palette with softer daylight warmth.',
    settings: {
      dark: {
        background: { hue: 32, lightness: 0.005, chroma: 0.004 },
        panel: { hue: 34, lightness: 0.12, chroma: 0.012 },
        surface: { hue: 38, lightness: 0.19, chroma: 0.015 },
      },
      light: {
        background: { hue: 82, lightness: 0.955, chroma: 0.02 },
        panel: { hue: 80, lightness: 0.972, chroma: 0.022 },
        surface: { hue: 76, lightness: 0.91, chroma: 0.028 },
      },
    },
  },
];

const isAccentSettings = (value: unknown): value is AccentSettings => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AccentSettings>;

  return (
    typeof candidate.hue === 'number' &&
    Number.isFinite(candidate.hue) &&
    typeof candidate.lightness === 'number' &&
    Number.isFinite(candidate.lightness) &&
    typeof candidate.chroma === 'number' &&
    Number.isFinite(candidate.chroma)
  );
};

const isThemeSurfaceScale = (value: unknown): value is ThemeSurfaceScale => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ThemeSurfaceScale>;

  return (
    isAccentSettings(candidate.background) &&
    isAccentSettings(candidate.panel) &&
    isAccentSettings(candidate.surface)
  );
};

export const parseThemeSurfaceSettings = (value: unknown): ThemeSurfaceSettings | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ThemeSurfaceSettings>;

  if (!isThemeSurfaceScale(candidate.dark) || !isThemeSurfaceScale(candidate.light)) {
    return null;
  }

  return {
    dark: candidate.dark,
    light: candidate.light,
  };
};

export const buildThemeSurfaceCssVars = (
  settings: ThemeSurfaceSettings
): Record<string, string> => ({
  '--osint-dark-darkmode': buildAccentColor(settings.dark.background),
  '--osint-panel-darkmode': buildAccentColor(settings.dark.panel),
  '--osint-surface-darkmode': buildAccentColor(settings.dark.surface),
  '--osint-dark-lightmode': buildAccentColor(settings.light.background),
  '--osint-panel-lightmode': buildAccentColor(settings.light.panel),
  '--osint-surface-lightmode': buildAccentColor(settings.light.surface),
});
