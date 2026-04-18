import { describe, expect, it } from 'vitest';

import { DEFAULT_THEME_FONT_SETTINGS } from '@/utils/themeFonts';
import { buildSherlockThemeCssVars } from './cssVars';
import {
  createDefaultSherlockThemeGraphs,
  createInitialThemeWorkspace,
} from './schema';
import {
  factoryResetActiveTheme,
  getActiveDraftTheme,
  getDisplayTheme,
  hydrateSherlockThemeWorkspace,
  migrateLegacySherlockThemeWorkspace,
  revertActiveThemeDraft,
  saveActiveThemeDraft,
  selectActiveTheme,
  updateActiveDraftTheme,
} from './storage';

describe('theme workspace storage helpers', () => {
  it('migrates legacy split theme settings into a unified workspace', () => {
    const workspace = migrateLegacySherlockThemeWorkspace({
      accentSettings: { hue: 20, lightness: 0.62, chroma: 0.18 },
      themeSurfaceSettings: {
        dark: {
          background: { hue: 210, lightness: 0.04, chroma: 0.01 },
          panel: { hue: 220, lightness: 0.14, chroma: 0.02 },
          surface: { hue: 230, lightness: 0.22, chroma: 0.03 },
        },
        light: {
          background: { hue: 40, lightness: 0.94, chroma: 0.02 },
          panel: { hue: 44, lightness: 0.965, chroma: 0.03 },
          surface: { hue: 48, lightness: 0.9, chroma: 0.04 },
        },
      },
      themeBackgroundSettings: { variant: 'grid', dotColor: 34, dotOpacity: 0.48 },
      themeFontSettings: {
        ...DEFAULT_THEME_FONT_SETTINGS,
        display: 'space-grotesk',
      },
    });

    const activeTheme = getActiveDraftTheme(workspace);
    const displayTheme = getDisplayTheme(workspace, 'dark');

    expect(activeTheme.accent.dark).toEqual({ hue: 20, lightness: 0.62, chroma: 0.18 });
    expect(activeTheme.accent.light).toEqual({ hue: 20, lightness: 0.62, chroma: 0.18 });
    expect(activeTheme.surfaces.dark.panel).toEqual({
      hue: 220,
      lightness: 0.14,
      chroma: 0.02,
      opacity: 1,
    });
    expect(activeTheme.background.dark.variant).toBe('dot-grid');
    expect(activeTheme.background.dark.dotColor).toBe(34);
    expect(activeTheme.background.light.dotOpacity).toBe(0.48);
    expect(displayTheme.typography.display).toBe('space-grotesk');
    expect(activeTheme.graphs.dark).toEqual(createDefaultSherlockThemeGraphs(activeTheme.accent.dark));
    expect(activeTheme.typography.profiles.ui.sizeAdjust).toBe(
      DEFAULT_THEME_FONT_SETTINGS.profiles.ui.sizeAdjust
    );
  });

  it('saves, reverts, and factory-resets active theme drafts without mutating the other mode branch', () => {
    const initialWorkspace = createInitialThemeWorkspace();
    const draftWorkspace = updateActiveDraftTheme(initialWorkspace, (theme) => ({
      ...theme,
      accent: {
        ...theme.accent,
        dark: { hue: 188, lightness: 0.64, chroma: 0.12 },
      },
    }));

    expect(getActiveDraftTheme(draftWorkspace).accent.dark.hue).toBe(188);
    expect(getActiveDraftTheme(draftWorkspace).accent.light.hue).toBe(
      getActiveDraftTheme(initialWorkspace).accent.light.hue
    );
    expect(getActiveDraftTheme(revertActiveThemeDraft(draftWorkspace)).accent.dark.hue).toBe(
      getActiveDraftTheme(initialWorkspace).accent.dark.hue
    );

    const savedWorkspace = saveActiveThemeDraft(draftWorkspace);
    expect(getActiveDraftTheme(savedWorkspace).accent.dark.hue).toBe(188);

    const resetWorkspace = factoryResetActiveTheme(savedWorkspace);
    expect(getActiveDraftTheme(resetWorkspace).accent.dark.hue).toBe(
      getActiveDraftTheme(initialWorkspace).accent.dark.hue
    );
  });

  it('hydrates pre-mode-split saved themes without discarding the rest of the workspace theme', () => {
    const initialWorkspace = createInitialThemeWorkspace();
    const themeWithoutModeSplit = {
      ...initialWorkspace.savedThemes.default,
      accent: { ...initialWorkspace.savedThemes.default.accent.dark },
      graphs: initialWorkspace.savedThemes.default.graphs.dark.map((graph) => ({ ...graph })),
      background: {
        dark: { ...initialWorkspace.savedThemes.default.background.dark },
        light: { ...initialWorkspace.savedThemes.default.background.light },
        variant: initialWorkspace.savedThemes.default.background.dark.variant,
        dotColor: initialWorkspace.savedThemes.default.background.dark.dotColor,
        dotOpacity: initialWorkspace.savedThemes.default.background.dark.dotOpacity,
        gridSize: initialWorkspace.savedThemes.default.background.dark.gridSize,
        glowOpacity: initialWorkspace.savedThemes.default.background.dark.glowOpacity,
        scanlineOpacity: initialWorkspace.savedThemes.default.background.dark.scanlineOpacity,
      },
      shell: {
        ...initialWorkspace.savedThemes.default.shell,
        dividerWidth: initialWorkspace.savedThemes.default.shell.dividerWidth.dark,
        dividerStrength: initialWorkspace.savedThemes.default.shell.dividerStrength.dark,
        dividerTint: initialWorkspace.savedThemes.default.shell.dividerTint.dark,
        dividerGlow: initialWorkspace.savedThemes.default.shell.dividerGlow.dark,
      },
      typography: {
        ...initialWorkspace.savedThemes.default.typography,
        profiles: {
          ...initialWorkspace.savedThemes.default.typography.profiles,
        },
      },
      surfaces: {
        dark: {
          ...initialWorkspace.savedThemes.default.surfaces.dark,
          panel: { ...initialWorkspace.savedThemes.default.surfaces.dark.panel },
        },
        light: {
          ...initialWorkspace.savedThemes.default.surfaces.light,
        },
      },
      mode: 'dark',
    } as unknown as typeof initialWorkspace.savedThemes.default;
    delete (themeWithoutModeSplit.typography as { profiles?: unknown }).profiles;
    delete (
      themeWithoutModeSplit.background.dark as { opacity?: unknown }
    ).opacity;
    delete (
      themeWithoutModeSplit.surfaces.dark.panel as { opacity?: unknown }
    ).opacity;

    const hydratedWorkspace = hydrateSherlockThemeWorkspace({
      ...initialWorkspace,
      savedThemes: {
        ...initialWorkspace.savedThemes,
        default: themeWithoutModeSplit,
      } as unknown as typeof initialWorkspace.savedThemes,
      draftThemes: {
        ...initialWorkspace.draftThemes,
        default: themeWithoutModeSplit,
      } as unknown as typeof initialWorkspace.draftThemes,
    });

    expect(hydratedWorkspace.savedThemes.default.accent.dark).toEqual(
      initialWorkspace.savedThemes.default.accent.dark
    );
    expect(hydratedWorkspace.savedThemes.default.accent.light).toEqual(
      initialWorkspace.savedThemes.default.accent.dark
    );
    expect(hydratedWorkspace.savedThemes.default.graphs.dark).toEqual(
      initialWorkspace.savedThemes.default.graphs.dark
    );
    expect(hydratedWorkspace.savedThemes.default.graphs.light).toEqual(
      initialWorkspace.savedThemes.default.graphs.dark
    );
    expect(hydratedWorkspace.savedThemes.default.typography.profiles).toEqual(
      initialWorkspace.savedThemes.default.typography.profiles
    );
    expect(hydratedWorkspace.savedThemes.default.background.dark.opacity).toBe(1);
    expect(hydratedWorkspace.savedThemes.default.shell.dividerWidth.light).toBe(
      initialWorkspace.savedThemes.default.shell.dividerWidth.dark
    );
    expect(hydratedWorkspace.savedThemes.default.surfaces.dark.panel.opacity).toBe(1);
  });

  it('builds css vars from the active workspace theme for the requested mode', () => {
    const workspace = updateActiveDraftTheme(createInitialThemeWorkspace(), (theme) => ({
      ...theme,
      accent: {
        ...theme.accent,
        dark: { hue: 270, lightness: 0.59, chroma: 0.11 },
      },
    }));
    const cssVars = buildSherlockThemeCssVars(getActiveDraftTheme(workspace), 'dark');

    expect(cssVars['--osint-primary']).toBeDefined();
    expect(cssVars['--osint-graph-1']).toBeDefined();
    expect(cssVars['--osint-shell-toolbar-height']).toBe('64px');
    expect(cssVars['--osint-main-bg-image']).toBeTruthy();
    expect(cssVars['--osint-main-bg-color']).toBeDefined();
    expect(cssVars['--font-display-scale']).toBeDefined();
  });

  it('keeps the active display branch values when selecting the current theme template', () => {
    const initialWorkspace = updateActiveDraftTheme(createInitialThemeWorkspace(), (theme) => ({
      ...theme,
      accent: {
        ...theme.accent,
        dark: { hue: 212, lightness: 0.57, chroma: 0.08 },
      },
    }));
    const nextWorkspace = selectActiveTheme(initialWorkspace, 'default');

    expect(getDisplayTheme(nextWorkspace, 'dark').accent.hue).toBe(212);
  });
});
