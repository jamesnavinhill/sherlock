import { describe, expect, it } from 'vitest';

import { DEFAULT_THEME_FONT_SETTINGS } from '@/utils/themeFonts';
import {
  buildSherlockThemeCssVars,
} from './cssVars';
import {
  createDefaultSherlockThemeGraphs,
  createInitialThemeWorkspace,
} from './schema';
import {
  hydrateSherlockThemeWorkspace,
  factoryResetActiveTheme,
  getDisplayTheme,
  migrateLegacySherlockThemeWorkspace,
  revertActiveThemeDraft,
  saveActiveThemeDraft,
  selectActiveTheme,
  setThemePreviewMode,
  updateActiveDraftTheme,
} from './storage';

describe('theme workspace storage helpers', () => {
  it('migrates legacy split theme settings into a unified workspace', () => {
    const workspace = migrateLegacySherlockThemeWorkspace({
      accentSettings: { hue: 20, lightness: 0.62, chroma: 0.18 },
      themeMode: 'dark',
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

    const displayTheme = getDisplayTheme(workspace);

    expect(workspace.previewMode).toBe('dark');
    expect(displayTheme.accent).toEqual({ hue: 20, lightness: 0.62, chroma: 0.18 });
    expect(displayTheme.surfaces.dark.panel).toEqual({
      hue: 220,
      lightness: 0.14,
      chroma: 0.02,
      opacity: 1,
    });
    expect(displayTheme.background.variant).toBe('dot-grid');
    expect(displayTheme.typography.display).toBe('space-grotesk');
    expect(displayTheme.background.dark.opacity).toBe(1);
    expect(displayTheme.typography.profiles.ui.sizeAdjust).toBe(
      DEFAULT_THEME_FONT_SETTINGS.profiles.ui.sizeAdjust
    );
  });

  it('saves, reverts, and factory-resets active theme drafts', () => {
    const initialWorkspace = createInitialThemeWorkspace();
    const draftWorkspace = updateActiveDraftTheme(initialWorkspace, (theme) => ({
      ...theme,
      accent: { hue: 188, lightness: 0.64, chroma: 0.12 },
    }));

    expect(getDisplayTheme(draftWorkspace).accent.hue).toBe(188);
    expect(getDisplayTheme(revertActiveThemeDraft(draftWorkspace)).accent.hue).toBe(
      getDisplayTheme(initialWorkspace).accent.hue
    );

    const savedWorkspace = saveActiveThemeDraft(draftWorkspace);
    expect(getDisplayTheme(savedWorkspace).accent.hue).toBe(188);

    const resetWorkspace = factoryResetActiveTheme(savedWorkspace);
    expect(getDisplayTheme(resetWorkspace).accent.hue).toBe(
      getDisplayTheme(initialWorkspace).accent.hue
    );
  });

  it('hydrates pre-graph and pre-profile saved themes without discarding the rest of the workspace theme', () => {
    const initialWorkspace = createInitialThemeWorkspace();
    const themeWithoutGraphs = {
      ...initialWorkspace.savedThemes.default,
      typography: {
        ...initialWorkspace.savedThemes.default.typography,
        profiles: {
          ...initialWorkspace.savedThemes.default.typography.profiles,
        },
      },
      background: {
        ...initialWorkspace.savedThemes.default.background,
        dark: { ...initialWorkspace.savedThemes.default.background.dark },
        light: { ...initialWorkspace.savedThemes.default.background.light },
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
    } as Omit<(typeof initialWorkspace.savedThemes.default), 'graphs'>;
    delete (themeWithoutGraphs as { graphs?: unknown }).graphs;
    delete (themeWithoutGraphs.typography as { profiles?: unknown }).profiles;
    delete (themeWithoutGraphs.background.dark as { opacity?: unknown }).opacity;
    delete (themeWithoutGraphs.background.light as { opacity?: unknown }).opacity;
    delete (themeWithoutGraphs.surfaces.dark.panel as { opacity?: unknown }).opacity;

    const hydratedWorkspace = hydrateSherlockThemeWorkspace({
      ...initialWorkspace,
      savedThemes: {
        ...initialWorkspace.savedThemes,
        default: themeWithoutGraphs,
      } as unknown as typeof initialWorkspace.savedThemes,
      draftThemes: {
        ...initialWorkspace.draftThemes,
        default: themeWithoutGraphs,
      } as unknown as typeof initialWorkspace.draftThemes,
    });

    expect(hydratedWorkspace.savedThemes.default.accent).toEqual(
      initialWorkspace.savedThemes.default.accent
    );
    expect(hydratedWorkspace.savedThemes.default.graphs).toEqual(
      createDefaultSherlockThemeGraphs(initialWorkspace.savedThemes.default.accent)
    );
    expect(hydratedWorkspace.savedThemes.default.typography.profiles).toEqual(
      initialWorkspace.savedThemes.default.typography.profiles
    );
    expect(hydratedWorkspace.savedThemes.default.background.dark.opacity).toBe(1);
    expect(hydratedWorkspace.savedThemes.default.surfaces.dark.panel.opacity).toBe(1);
  });

  it('builds css vars from the active workspace theme', () => {
    const workspace = setThemePreviewMode(createInitialThemeWorkspace(), 'dark');
    const cssVars = buildSherlockThemeCssVars(getDisplayTheme(workspace));

    expect(cssVars['--osint-primary']).toBeDefined();
    expect(cssVars['--osint-graph-1']).toBeDefined();
    expect(cssVars['--osint-shell-toolbar-height']).toMatch(/px$/);
    expect(cssVars['--osint-main-bg-image']).toBeTruthy();
    expect(cssVars['--osint-main-bg-color']).toBeDefined();
    expect(cssVars['--font-display-scale']).toBeDefined();
  });

  it('keeps the current preview mode when selecting a different theme template', () => {
    const initialWorkspace = setThemePreviewMode(createInitialThemeWorkspace(), 'dark');
    const nextWorkspace = selectActiveTheme(initialWorkspace, 'default');

    expect(nextWorkspace.previewMode).toBe('dark');
    expect(getDisplayTheme(nextWorkspace).mode).toBe('dark');
  });
});
