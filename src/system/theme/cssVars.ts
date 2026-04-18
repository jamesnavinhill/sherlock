import { buildEntityPaletteCssVars } from '@/utils/entityPalette';
import {
  buildThemeFontCssVars,
  getThemeFontOption,
  resolveThemeFontSizes,
  resolveThemeFontWeights,
} from '@/utils/themeFonts';
import { buildAccentColor } from '@/utils/accent';

import type {
  SherlockTheme,
  SherlockThemeBackgroundLayer,
  SherlockThemeControlChrome,
  SherlockThemeMode,
} from './schema';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const buildBackgroundImage = (settings: SherlockThemeBackgroundLayer) => {
  const dotColor = `color-mix(in oklab, var(--osint-ink) ${settings.dotColor}%, var(--osint-border))`;
  const gridColor = `color-mix(in oklab, var(--osint-border) 58%, transparent)`;

  if (settings.variant === 'plain') {
    return 'none';
  }

  if (settings.variant === 'dot-grid') {
    return `radial-gradient(${dotColor} 1px, transparent 1px)`;
  }

  if (settings.variant === 'cross-grid') {
    return [
      `linear-gradient(to right, ${gridColor} 1px, transparent 1px)`,
      `linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
    ].join(', ');
  }

  return `linear-gradient(to bottom, color-mix(in oklab, var(--osint-ink) ${
    Math.round(settings.scanlineOpacity * 100)
  }%, transparent) 0, transparent 2px, transparent 4px)`;
};

const buildBackgroundSize = (settings: SherlockThemeBackgroundLayer) => {
  const size = `${Math.round(settings.gridSize)}px`;

  if (settings.variant === 'scanlines') {
    return `100% ${Math.max(4, Math.round(settings.gridSize * 0.35))}px`;
  }

  return `${size} ${size}`;
};

const CONTROL_CHROME_VARS: Record<SherlockThemeControlChrome, Record<string, string>> = {
  glass: {
    '--osint-interaction-bg':
      'color-mix(in oklab, var(--osint-dark) 88%, var(--osint-panel) 12%)',
    '--osint-interaction-hover-bg':
      'color-mix(in oklab, var(--osint-primary) 8%, color-mix(in oklab, var(--osint-dark) 86%, var(--osint-panel) 14%))',
    '--osint-interaction-active-bg':
      'color-mix(in oklab, var(--osint-primary) 12%, color-mix(in oklab, var(--osint-dark) 82%, var(--osint-panel) 18%))',
    '--osint-card-surface-bg':
      'color-mix(in oklab, var(--osint-panel) 74%, transparent)',
    '--osint-card-section-bg': 'color-mix(in oklab, var(--osint-panel) 74%, var(--osint-surface) 26%)',
    '--osint-card-section-subtle-bg':
      'color-mix(in oklab, var(--osint-panel) 68%, var(--osint-dark) 32%)',
  },
  solid: {
    '--osint-interaction-bg':
      'color-mix(in oklab, var(--osint-panel) 82%, var(--osint-surface) 18%)',
    '--osint-interaction-hover-bg':
      'color-mix(in oklab, var(--osint-panel) 74%, var(--osint-surface) 26%)',
    '--osint-interaction-active-bg':
      'color-mix(in oklab, var(--osint-panel) 64%, var(--osint-primary) 10%, var(--osint-surface) 26%)',
    '--osint-card-surface-bg':
      'color-mix(in oklab, var(--osint-panel) 86%, var(--osint-surface) 14%)',
    '--osint-card-section-bg':
      'color-mix(in oklab, var(--osint-panel) 82%, var(--osint-surface) 18%)',
    '--osint-card-section-subtle-bg':
      'color-mix(in oklab, var(--osint-panel) 74%, var(--osint-dark) 26%)',
  },
  line: {
    '--osint-interaction-bg': 'transparent',
    '--osint-interaction-hover-bg': 'color-mix(in oklab, var(--osint-primary) 8%, transparent)',
    '--osint-interaction-active-bg':
      'color-mix(in oklab, var(--osint-primary) 14%, transparent)',
    '--osint-card-surface-bg':
      'color-mix(in oklab, var(--osint-panel) 22%, transparent)',
    '--osint-card-section-bg':
      'color-mix(in oklab, var(--osint-panel) 54%, transparent)',
    '--osint-card-section-subtle-bg':
      'color-mix(in oklab, var(--osint-panel) 42%, transparent)',
  },
};

export const buildSherlockThemeCssVars = (
  theme: SherlockTheme,
  mode: SherlockThemeMode
): Record<string, string> => {
  const fontVars = buildThemeFontCssVars(theme.typography);
  const fontSizes = resolveThemeFontSizes(theme.typography.size);
  const fontWeights = resolveThemeFontWeights(theme.typography.weight);
  const activeAccent = theme.accent[mode];
  const activeGraphs = theme.graphs[mode];
  const activeBackground = theme.background[mode];
  const dividerStrength = clamp(theme.shell.dividerStrength[mode], 0, 1);
  const dividerTint = clamp(theme.shell.dividerTint[mode], 0, 1);
  const dividerGlow = clamp(theme.shell.dividerGlow[mode], 0, 1);
  const dividerWidth = Math.max(0, Math.round(theme.shell.dividerWidth[mode]));
  const shellDividerBase =
    dividerStrength === 1
      ? 'var(--osint-raised-outline)'
      : `color-mix(in oklab, var(--osint-raised-outline) ${Math.round(dividerStrength * 100)}%, transparent)`;
  const shellDividerColor =
    dividerTint > 0
      ? `color-mix(in oklab, var(--osint-primary) ${Math.round(dividerTint * 100)}%, ${shellDividerBase})`
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
    '--osint-primary': buildAccentColor(activeAccent),
    '--osint-graph-1': buildAccentColor(activeGraphs[0]),
    '--osint-graph-2': buildAccentColor(activeGraphs[1]),
    '--osint-graph-3': buildAccentColor(activeGraphs[2]),
    '--osint-graph-4': buildAccentColor(activeGraphs[3]),
    ...buildEntityPaletteCssVars(activeAccent),
    '--osint-shell-darkmode': buildAccentColor(theme.surfaces.dark.shell),
    '--osint-dark-darkmode': buildAccentColor(theme.background.dark),
    '--osint-panel-darkmode': buildAccentColor(theme.surfaces.dark.panel),
    '--osint-rail-darkmode': buildAccentColor(theme.surfaces.dark.rail),
    '--osint-surface-darkmode': buildAccentColor(theme.surfaces.dark.surface),
    '--osint-shell-lightmode': buildAccentColor(theme.surfaces.light.shell),
    '--osint-dark-lightmode': buildAccentColor(theme.background.light),
    '--osint-panel-lightmode': buildAccentColor(theme.surfaces.light.panel),
    '--osint-rail-lightmode': buildAccentColor(theme.surfaces.light.rail),
    '--osint-surface-lightmode': buildAccentColor(theme.surfaces.light.surface),
    '--osint-main-bg-color': buildAccentColor(activeBackground),
    '--osint-main-bg-image': buildBackgroundImage(activeBackground),
    '--osint-main-bg-dot-color': `color-mix(in oklab, var(--osint-ink) ${activeBackground.dotColor}%, var(--osint-border))`,
    '--osint-main-bg-dot-opacity': String(activeBackground.dotOpacity),
    '--osint-main-bg-size': buildBackgroundSize(activeBackground),
    '--osint-main-bg-glow-opacity': String(activeBackground.glowOpacity),
    '--osint-shell-radius': `${Math.round(theme.radii.shell)}px`,
    '--osint-panel-radius': `${Math.round(theme.radii.panel)}px`,
    '--osint-control-radius': `${Math.round(theme.radii.control)}px`,
    '--osint-pill-radius': `${Math.round(theme.radii.pill)}px`,
    '--osint-shell-sidebar-width': `${Math.round(theme.shell.sidebarWidth)}px`,
    '--osint-shell-rail-width': `${Math.round(theme.shell.railWidth)}px`,
    '--osint-shell-utility-width': `${Math.round(theme.shell.utilityWidth)}px`,
    '--osint-shell-toolbar-height': `${Math.round(theme.shell.toolbarHeight)}px`,
    '--osint-shell-content-width': `${Math.round(theme.shell.contentWidth)}px`,
    '--osint-shell-density': String(theme.shell.density),
    '--osint-shell-surface-opacity': String(theme.shell.surfaceOpacity),
    '--osint-shell-divider-width': `${dividerWidth}px`,
    '--osint-shell-divider-color': shellDividerColor,
    '--osint-shell-divider-shadow-right': dividerShadowRight,
    '--osint-shell-divider-shadow-left': dividerShadowLeft,
    '--osint-shell-divider-shadow-bottom': dividerShadowBottom,
    '--osint-shell-header-bg':
      'color-mix(in oklab, var(--osint-shell) 92%, var(--osint-panel) 8%)',
    '--osint-shell-panel-bg':
      'color-mix(in oklab, var(--osint-panel) clamp(0%, calc(95% * var(--osint-shell-surface-opacity)), 100%), transparent)',
    '--osint-shell-panel-header-bg':
      'color-mix(in oklab, var(--osint-panel) 78%, var(--osint-surface) 22%)',
    '--osint-shell-panel-action-bg':
      'color-mix(in oklab, var(--osint-panel) 70%, var(--osint-dark) 30%)',
    '--osint-shell-border': shellDividerColor,
    '--osint-slider-track-bg': 'var(--osint-surface)',
    '--osint-control-font': getThemeFontOption(theme.typography.ui).cssValue,
    '--osint-title-font': getThemeFontOption(theme.typography.display).cssValue,
    '--osint-label-font': getThemeFontOption(theme.typography.label).cssValue,
    '--osint-mono-font': getThemeFontOption(theme.typography.mono).cssValue,
    '--osint-font-base': fontSizes.base,
    '--osint-font-display': fontSizes['3xl'],
    '--osint-font-label': fontSizes.xs,
    '--osint-font-mono': fontSizes.sm,
    '--osint-weight-display': String(fontWeights.display),
    '--osint-weight-label': String(fontWeights.label),
    '--osint-weight-body': String(fontWeights.medium),
    ...CONTROL_CHROME_VARS[theme.controls.chrome],
    ...fontVars,
  };
};

export const buildSherlockThemeCssText = (theme: SherlockTheme, mode: SherlockThemeMode) => {
  const vars = buildSherlockThemeCssVars(theme, mode);
  const lines = Object.entries(vars).map(([name, value]) => `  ${name}: ${value};`);
  return [':root {', ...lines, '}'].join('\n');
};
