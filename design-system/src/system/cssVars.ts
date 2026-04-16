import {
  DEFAULT_THEME,
  getFontOption,
  type AccentPoint,
  type BackgroundSettings,
  type ControlChrome,
  type FontRole,
  type StudioTheme,
} from './schema';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const round = (value: number, places = 3) => {
  if (value === undefined || value === null || isNaN(value)) return 0;
  return Number(value.toFixed(places));
};

const buildAccentColor = (point: AccentPoint) => {
  if (!point) return 'transparent';
  const base = `${round(point.lightness)} ${round(point.chroma)} ${Math.round(point.hue)}`;
  if (point.opacity < 1) {
    return `oklch(${base} / ${round(point.opacity)})`;
  }
  return `oklch(${base})`;
};

const CONTROL_CHROME_VARS: Record<ControlChrome, Record<string, string>> = {
  glass: {
    '--ds-control-bg':
      'color-mix(in oklab, var(--ds-panel) clamp(0%, calc(94% * var(--ds-surface-opacity)), 100%), transparent)',
    '--ds-control-bg-hover': 'var(--ds-accent-soft)',
    '--ds-control-bg-active': 'var(--ds-accent-soft)',
    '--ds-control-border': 'var(--ds-border-soft)',
    '--ds-control-border-hover': 'var(--ds-border-strong)',
    '--ds-control-shadow': 'none',
    '--ds-control-shadow-hover': 'var(--ds-shadow-accent-soft)',
    '--ds-floating-bg':
      'color-mix(in oklab, var(--ds-panel) clamp(0%, calc(96% * var(--ds-surface-opacity)), 100%), transparent)',
    '--ds-dialog-backdrop': 'color-mix(in oklab, var(--ds-panel-dark) 46%, transparent)',
  },
  solid: {
    '--ds-control-bg': 'color-mix(in oklab, var(--ds-surface) 74%, var(--ds-panel) 26%)',
    '--ds-control-bg-hover': 'color-mix(in oklab, var(--ds-surface) 84%, var(--ds-accent) 16%)',
    '--ds-control-bg-active': 'var(--ds-accent-soft)',
    '--ds-control-border': 'color-mix(in oklab, var(--ds-border) 84%, transparent)',
    '--ds-control-border-hover': 'var(--ds-border-strong)',
    '--ds-control-shadow': 'var(--ds-shadow-soft)',
    '--ds-control-shadow-hover': 'var(--ds-shadow-accent-soft)',
    '--ds-floating-bg': 'color-mix(in oklab, var(--ds-surface) 88%, var(--ds-panel) 12%)',
    '--ds-dialog-backdrop': 'color-mix(in oklab, var(--ds-panel-dark) 54%, transparent)',
  },
  line: {
    '--ds-control-bg': 'transparent',
    '--ds-control-bg-hover': 'color-mix(in oklab, var(--ds-accent) 8%, transparent)',
    '--ds-control-bg-active': 'color-mix(in oklab, var(--ds-accent) 12%, transparent)',
    '--ds-control-border': 'var(--ds-border-strong)',
    '--ds-control-border-hover': 'var(--ds-accent-border)',
    '--ds-control-shadow': 'none',
    '--ds-control-shadow-hover': 'none',
    '--ds-floating-bg': 'color-mix(in oklab, var(--ds-shell) 84%, var(--ds-panel) 16%)',
    '--ds-dialog-backdrop': 'color-mix(in oklab, var(--ds-panel-dark) 38%, transparent)',
  },
};

const SYSTEM_STYLE_VARS: Record<string, string> = {
  '--ds-motion-fast': '160ms',
  '--ds-motion-base': '180ms',
  '--ds-motion-slow': '200ms',
  '--ds-motion-ease': 'ease',
  '--ds-blur-shell': '18px',
  '--ds-blur-workbench': '28px',
  '--ds-blur-dialog-backdrop': '8px',
  '--ds-shell-chrome-bg': 'color-mix(in oklab, var(--ds-shell) 78%, var(--ds-panel) 22%)',
  '--ds-overlay-chrome-bg': 'var(--ds-shell-chrome-bg)',
  '--ds-overlay-body-bg':
    'color-mix(in oklab, var(--ds-panel) clamp(0%, calc(96% * var(--ds-surface-opacity)), 100%), transparent)',
  '--ds-overlay-panel-bg': 'var(--ds-overlay-body-bg)',
  '--ds-dialog-bg': 'var(--ds-overlay-body-bg)',
  '--ds-modal-header-bg': 'var(--ds-overlay-chrome-bg)',
  '--ds-modal-body-bg': 'var(--ds-overlay-body-bg)',
  '--ds-modal-footer-bg': 'var(--ds-overlay-chrome-bg)',
  '--ds-backdrop-saturate': '92%',
  '--ds-shadow-accent-ring':
    '0 0 12px -2px color-mix(in oklab, var(--ds-accent) 25%, transparent)',
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
  const profile = theme.typography.profiles[role] ?? DEFAULT_THEME.typography.profiles[role];

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
  const modeBackground = theme.background[theme.mode];
  const typeSizes = resolveTypeSizes(theme.typography.size);
  const weightScale = resolveWeights(theme.typography.weight);
  const backgroundImage = buildBackgroundImage(theme.background);
  const chromeVars = CONTROL_CHROME_VARS[theme.controls.chrome];
  const dividerStrength = clamp(theme.shell.dividerStrength ?? 1, 0, 1);
  const dividerTint = clamp(theme.shell.dividerTint ?? 0, 0, 1);
  const dividerGlow = clamp(theme.shell.dividerGlow ?? 0, 0, 1);
  const dividerWidth = Math.max(0, Math.round(theme.shell.dividerWidth ?? 1));
  const shellDividerBase =
    dividerStrength === 1
      ? 'var(--ds-border-soft)'
      : `color-mix(in oklab, var(--ds-border-soft) ${Math.round(dividerStrength * 100)}%, transparent)`;
  const shellDividerColor =
    dividerTint > 0
      ? `color-mix(in oklab, var(--ds-accent) ${Math.round(dividerTint * 100)}%, ${shellDividerBase})`
      : shellDividerBase;
  const dividerGlowColor =
    dividerGlow > 0
      ? `color-mix(in oklab, ${shellDividerColor} ${Math.round(28 + dividerGlow * 36)}%, transparent)`
      : 'transparent';
  const dividerGlowBlur = Math.round(dividerGlow * 18);
  const dividerGlowSpread = Math.round(dividerGlowBlur * 0.7);
  const dividerShadowRight =
    dividerGlowBlur > 0
      ? `${Math.max(1, dividerWidth)}px 0 ${dividerGlowBlur}px -${dividerGlowSpread}px ${dividerGlowColor}`
      : 'none';
  const dividerShadowLeft =
    dividerGlowBlur > 0
      ? `${-Math.max(1, dividerWidth)}px 0 ${dividerGlowBlur}px -${dividerGlowSpread}px ${dividerGlowColor}`
      : 'none';
  const dividerShadowBottom =
    dividerGlowBlur > 0
      ? `0 ${Math.max(1, dividerWidth)}px ${dividerGlowBlur}px -${dividerGlowSpread}px ${dividerGlowColor}`
      : 'none';

  return {
    '--ds-accent': buildAccentColor(theme.accent),
    '--ds-graph-1': buildAccentColor(theme.graphs[0]),
    '--ds-graph-2': buildAccentColor(theme.graphs[1]),
    '--ds-graph-3': buildAccentColor(theme.graphs[2]),
    '--ds-graph-4': buildAccentColor(theme.graphs[3]),
    '--ds-background': buildAccentColor(modeBackground),
    '--ds-shell': buildAccentColor(modeScale.shell),
    '--ds-panel': buildAccentColor(modeScale.panel),
    '--ds-rail': buildAccentColor(modeScale.rail),
    '--ds-surface': buildAccentColor(modeScale.surface),
    '--ds-background-dark': buildAccentColor(theme.background.dark),
    '--ds-shell-dark': buildAccentColor(theme.surfaces.dark.shell),
    '--ds-panel-dark': buildAccentColor(theme.surfaces.dark.panel),
    '--ds-rail-dark': buildAccentColor(theme.surfaces.dark.rail),
    '--ds-surface-dark': buildAccentColor(theme.surfaces.dark.surface),
    '--ds-background-light': buildAccentColor(theme.background.light),
    '--ds-shell-light': buildAccentColor(theme.surfaces.light.shell),
    '--ds-panel-light': buildAccentColor(theme.surfaces.light.panel),
    '--ds-rail-light': buildAccentColor(theme.surfaces.light.rail),
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
    '--ds-utility-width': `${Math.round(theme.shell.utilityWidth)}px`,
    '--ds-toolbar-height': `${Math.round(theme.shell.toolbarHeight)}px`,
    '--ds-shell-header-height': `${Math.round(theme.shell.toolbarHeight)}px`,
    '--ds-shell-header-padding-inline': '1.25rem',
    '--ds-shell-header-padding-block': '1rem',
    '--ds-content-width': `${Math.round(theme.shell.contentWidth)}px`,
    '--ds-density': String(round(theme.shell.density, 2)),
    '--ds-surface-opacity': String(round(theme.shell.surfaceOpacity ?? 1, 2)),
    '--ds-shell-divider-width': `${dividerWidth}px`,
    '--ds-shell-divider-color': shellDividerColor,
    '--ds-shell-divider-shadow-right': dividerShadowRight,
    '--ds-shell-divider-shadow-left': dividerShadowLeft,
    '--ds-shell-divider-shadow-bottom': dividerShadowBottom,
    '--ds-control-chrome': theme.controls.chrome,
    '--ds-background-image': backgroundImage,
    '--ds-background-opacity': String(round(theme.background.dotOpacity, 2)),
    '--ds-grid-size': `${Math.round(theme.background.gridSize)}px`,
    '--ds-glow-opacity': String(round(theme.background.glowOpacity, 2)),
    '--ds-glow-strength': `${Math.round(theme.background.glowOpacity * 100)}%`,
    '--ds-scanline-opacity': String(
      round(theme.background.variant === 'scanlines' ? theme.background.scanlineOpacity : 0, 2)
    ),
    '--ds-background-variant': theme.background.variant,
    ...SYSTEM_STYLE_VARS,
    ...chromeVars,
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
