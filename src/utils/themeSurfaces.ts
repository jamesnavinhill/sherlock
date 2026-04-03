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

export const DEFAULT_THEME_SURFACE_SETTINGS: ThemeSurfaceSettings = {
  dark: {
    background: { hue: 0, lightness: 0, chroma: 0 },
    panel: { hue: 286, lightness: 0.141, chroma: 0.004 },
    surface: { hue: 286, lightness: 0.21, chroma: 0.006 },
  },
  light: {
    background: { hue: 85, lightness: 0.963, chroma: 0.017 },
    panel: { hue: 85, lightness: 0.986, chroma: 0.014 },
    surface: { hue: 81, lightness: 0.937, chroma: 0.025 },
  },
};

const isAccentSettings = (value: unknown): value is AccentSettings => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AccentSettings>;

  return (
    typeof candidate.hue === 'number'
    && Number.isFinite(candidate.hue)
    && typeof candidate.lightness === 'number'
    && Number.isFinite(candidate.lightness)
    && typeof candidate.chroma === 'number'
    && Number.isFinite(candidate.chroma)
  );
};

const isThemeSurfaceScale = (value: unknown): value is ThemeSurfaceScale => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ThemeSurfaceScale>;

  return (
    isAccentSettings(candidate.background)
    && isAccentSettings(candidate.panel)
    && isAccentSettings(candidate.surface)
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

export const buildThemeSurfaceCssVars = (settings: ThemeSurfaceSettings): Record<string, string> => ({
  '--osint-dark-darkmode': buildAccentColor(settings.dark.background),
  '--osint-panel-darkmode': buildAccentColor(settings.dark.panel),
  '--osint-surface-darkmode': buildAccentColor(settings.dark.surface),
  '--osint-dark-lightmode': buildAccentColor(settings.light.background),
  '--osint-panel-lightmode': buildAccentColor(settings.light.panel),
  '--osint-surface-lightmode': buildAccentColor(settings.light.surface),
});
