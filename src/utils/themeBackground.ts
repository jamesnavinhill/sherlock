export type ThemeBackgroundVariant = 'grid' | 'plain';

export interface ThemeBackgroundSettings {
  variant: ThemeBackgroundVariant;
  dotColor: number;
  dotOpacity: number;
}

export const DEFAULT_THEME_BACKGROUND_SETTINGS: ThemeBackgroundSettings = {
  variant: 'grid',
  dotColor: 23,
  dotOpacity: 0.45,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isThemeBackgroundVariant = (value: unknown): value is ThemeBackgroundVariant =>
  value === 'grid' || value === 'plain';

export const parseThemeBackgroundSettings = (value: unknown): ThemeBackgroundSettings | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ThemeBackgroundSettings>;

  if (
    !isThemeBackgroundVariant(candidate.variant) ||
    typeof candidate.dotColor !== 'number' ||
    !Number.isFinite(candidate.dotColor) ||
    typeof candidate.dotOpacity !== 'number' ||
    !Number.isFinite(candidate.dotOpacity)
  ) {
    return null;
  }

  return {
    variant: candidate.variant,
    dotColor: clamp(Math.round(candidate.dotColor), 0, 100),
    dotOpacity: clamp(Number(candidate.dotOpacity.toFixed(2)), 0, 1),
  };
};

export const buildThemeBackgroundDotColor = (settings: ThemeBackgroundSettings): string =>
  `color-mix(in oklab, var(--osint-ink) ${settings.dotColor}%, var(--osint-border))`;

export const buildThemeBackgroundImage = (settings: ThemeBackgroundSettings): string =>
  settings.variant === 'grid'
    ? `radial-gradient(${buildThemeBackgroundDotColor(settings)} 1px, transparent 1px)`
    : 'none';

export const buildThemeBackgroundCssVars = (
  settings: ThemeBackgroundSettings
): Record<string, string> => ({
  '--osint-main-bg-image': buildThemeBackgroundImage(settings),
  '--osint-main-bg-dot-color': buildThemeBackgroundDotColor(settings),
  '--osint-main-bg-dot-opacity': settings.dotOpacity.toString(),
});
