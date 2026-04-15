import {
  DEFAULT_THEME,
  getFontOption,
  type AccentPoint,
  type BackgroundSettings,
  type FontRole,
  type StudioTheme,
} from './schema';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const round = (value: number, places = 3) => {
  if (value === undefined || value === null || isNaN(value)) return 0;
  return Number(value.toFixed(places));
};

const buildAccentColor = (point: AccentPoint) => {
  const base = `${round(point.lightness)} ${round(point.chroma)} ${Math.round(point.hue)}`;
  if (point.opacity < 1) {
    return `oklch(${base} / ${round(point.opacity)})`;
  }
  return `oklch(${base})`;
};

const interpolate = (value: number, low: number, mid: number, high: number) => {
  const clamped = clamp(value, -1, 1);
  if (clamped <= 0) {
    return mid + (mid - low) * clamped;
  }
  return mid + (high - mid) * clamped;
};

const formatRem = (value: number) => `${Number(value.toFixed(4)).toString()}rem`;

const resolveTypeSizes = (value: number) => ({
  '2xs': formatRem(interpolate(value, 0.625, 0.6875, 0.75)),
  xs: formatRem(interpolate(value, 0.6875, 0.75, 0.8125)),
  sm: formatRem(interpolate(value, 0.8125, 0.875, 0.9375)),
  base: formatRem(interpolate(value, 0.9375, 1, 1.0625)),
  lg: formatRem(interpolate(value, 1.0625, 1.125, 1.1875)),
  xl: formatRem(interpolate(value, 1.1875, 1.3, 1.4)),
  '2xl': formatRem(interpolate(value, 1.45, 1.6, 1.8)),
  '3xl': formatRem(interpolate(value, 1.85, 2, 2.25)),
  '4xl': formatRem(interpolate(value, 2.2, 2.4, 2.7)),
});

const resolveWeights = (value: number) => ({
  body: Math.round(interpolate(value, 460, 500, 540)),
  semibold: Math.round(interpolate(value, 520, 560, 600)),
  bold: Math.round(interpolate(value, 580, 620, 680)),
  display: Math.round(interpolate(value, 560, 600, 640)),
  label: Math.round(interpolate(value, 540, 580, 620)),
});

const buildBackgroundImage = (settings: BackgroundSettings) => {
  const dotColor = `color-mix(in oklab, var(--ds-ink) ${settings.dotColor}%, var(--ds-border))`;

  if (settings.variant === 'plain') {
    return 'none';
  }

  if (settings.variant === 'dot-grid') {
    return `radial-gradient(${dotColor} 1px, transparent 1px)`;
  }

  if (settings.variant === 'cross-grid') {
    return [
      `linear-gradient(to right, color-mix(in oklab, var(--ds-border) 58%, transparent) 1px, transparent 1px)`,
      `linear-gradient(to bottom, color-mix(in oklab, var(--ds-border) 58%, transparent) 1px, transparent 1px)`,
    ].join(', ');
  }

  return 'none';
};

const getRoleWeightBase = (role: FontRole, weightScale: ReturnType<typeof resolveWeights>) => {
  if (role === 'display') return weightScale.display;
  if (role === 'label') return weightScale.label;
  if (role === 'mono') return weightScale.body;
  return weightScale.body;
};

const getRoleTrackingBase = (role: FontRole) => {
  if (role === 'display') return -0.02;
  if (role === 'label') return 0.14;
  if (role === 'mono') return 0.01;
  return -0.005;
};

const getRoleLeadingBase = (role: FontRole) => {
  if (role === 'display') return 1.08;
  if (role === 'label') return 1.2;
  if (role === 'mono') return 1.6;
  return 1.6;
};

const buildRoleVars = (
  theme: StudioTheme,
  role: FontRole,
  weightScale: ReturnType<typeof resolveWeights>
) => {
  const fontId = theme.typography[role];
  const font = getFontOption(fontId);
  const profile = theme.typography.profiles[fontId] ?? DEFAULT_THEME.typography.profiles[fontId];

  return {
    [`--ds-font-${role}`]: font.cssValue,
    [`--ds-${role}-scale`]: String(round(1 + profile.sizeAdjust, 3)),
    [`--ds-${role}-weight`]: String(
      clamp(getRoleWeightBase(role, weightScale) + Math.round(profile.weightAdjust), 360, 760)
    ),
    [`--ds-${role}-tracking`]: `${round(getRoleTrackingBase(role) + profile.trackingAdjust, 3)}em`,
    [`--ds-${role}-leading`]: String(round(getRoleLeadingBase(role) + profile.leadingAdjust, 3)),
  };
};

export const buildThemeCssVars = (theme: StudioTheme): Record<string, string> => {
  const modeScale = theme.surfaces[theme.mode];
  const typeSizes = resolveTypeSizes(theme.typography.size);
  const weightScale = resolveWeights(theme.typography.weight);
  const backgroundImage = buildBackgroundImage(theme.background);

  return {
    '--ds-accent': buildAccentColor(theme.accent),
    '--ds-bg': buildAccentColor(modeScale.background),
    '--ds-panel': buildAccentColor(modeScale.panel),
    '--ds-surface': buildAccentColor(modeScale.surface),
    '--ds-bg-dark': buildAccentColor(theme.surfaces.dark.background),
    '--ds-panel-dark': buildAccentColor(theme.surfaces.dark.panel),
    '--ds-surface-dark': buildAccentColor(theme.surfaces.dark.surface),
    '--ds-bg-light': buildAccentColor(theme.surfaces.light.background),
    '--ds-panel-light': buildAccentColor(theme.surfaces.light.panel),
    '--ds-surface-light': buildAccentColor(theme.surfaces.light.surface),
    '--ds-type-2xs': typeSizes['2xs'],
    '--ds-type-xs': typeSizes.xs,
    '--ds-type-sm': typeSizes.sm,
    '--ds-type-base': typeSizes.base,
    '--ds-type-lg': typeSizes.lg,
    '--ds-type-xl': typeSizes.xl,
    '--ds-type-2xl': typeSizes['2xl'],
    '--ds-type-3xl': typeSizes['3xl'],
    '--ds-type-4xl': typeSizes['4xl'],
    '--ds-weight-body': String(weightScale.body),
    '--ds-weight-semibold': String(weightScale.semibold),
    '--ds-weight-bold': String(weightScale.bold),
    '--ds-weight-display': String(weightScale.display),
    '--ds-weight-label': String(weightScale.label),
    '--ds-radius-shell': `${Math.round(theme.radii.shell)}px`,
    '--ds-radius-panel': `${Math.round(theme.radii.panel)}px`,
    '--ds-radius-control': `${Math.round(theme.radii.control)}px`,
    '--ds-radius-pill': `${Math.round(theme.radii.pill)}px`,
    '--ds-sidebar-width': `${Math.round(theme.shell.sidebarWidth)}px`,
    '--ds-rail-width': `${Math.round(theme.shell.railWidth)}px`,
    '--ds-toolbar-height': `${Math.round(theme.shell.toolbarHeight)}px`,
    '--ds-content-width': `${Math.round(theme.shell.contentWidth)}px`,
    '--ds-density': String(round(theme.shell.density, 2)),
    '--ds-surface-opacity': String(round(theme.shell.surfaceOpacity ?? 1, 2)),
    '--ds-background-image': backgroundImage,
    '--ds-background-opacity': String(round(theme.background.dotOpacity, 2)),
    '--ds-grid-size': `${Math.round(theme.background.gridSize)}px`,
    '--ds-glow-opacity': String(round(theme.background.glowOpacity, 2)),
    '--ds-glow-strength': `${Math.round(theme.background.glowOpacity * 100)}%`,
    '--ds-scanline-opacity': String(
      round(theme.background.variant === 'scanlines' ? theme.background.scanlineOpacity : 0, 2)
    ),
    '--ds-background-variant': theme.background.variant,
    ...buildRoleVars(theme, 'ui', weightScale),
    ...buildRoleVars(theme, 'display', weightScale),
    ...buildRoleVars(theme, 'label', weightScale),
    ...buildRoleVars(theme, 'mono', weightScale),
  };
};

export const buildThemeCssText = (theme: StudioTheme) => {
  const vars = buildThemeCssVars(theme);
  const lines = Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`);
  return [':root {', ...lines, '}'].join('\n');
};
