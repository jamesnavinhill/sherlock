import {
  cloneSherlockTheme,
  createDefaultSherlockThemeGraphs,
  createInitialSavedThemes,
  createInitialThemeWorkspace,
  createThemeTone,
  DEFAULT_SHERLOCK_THEME_TEMPLATE,
  DEFAULT_SHERLOCK_THEME,
  parseSherlockTheme,
  SHERLOCK_THEME_CUSTOM_TEMPLATE_IDS,
  SHERLOCK_THEME_TEMPLATE_IDS,
  type LegacySherlockThemeState,
  type SherlockTheme,
  type SherlockThemeMode,
  type SherlockThemeWorkspaceState,
} from './schema';
import { buildSherlockThemeCssText } from './cssVars';
import { parseThemeFontSettings } from '@/utils/themeFonts';

export const SHERLOCK_THEME_WORKSPACE_SETTING_KEY = 'theme_workspace';

const serializeTheme = (theme: SherlockTheme) => JSON.stringify(theme);

const hydrateThemeMap = (
  value: Record<string, unknown> | undefined,
  fallback: Record<string, SherlockTheme>
) =>
  Object.fromEntries(
    SHERLOCK_THEME_TEMPLATE_IDS.map((themeId) => {
      const parsed = parseSherlockTheme(value?.[themeId]);
      return [themeId, parsed ?? cloneSherlockTheme(fallback[themeId])];
    })
  ) as Record<string, SherlockTheme>;

export const hydrateSherlockThemeWorkspace = (
  value: Partial<SherlockThemeWorkspaceState> | null | undefined
): SherlockThemeWorkspaceState => {
  const defaultSavedThemes = createInitialSavedThemes();
  const savedThemes = hydrateThemeMap(value?.savedThemes as Record<string, unknown>, defaultSavedThemes);
  const draftThemes = hydrateThemeMap(value?.draftThemes as Record<string, unknown>, savedThemes);
  const activeThemeId =
    value?.activeThemeId && SHERLOCK_THEME_TEMPLATE_IDS.includes(value.activeThemeId)
      ? value.activeThemeId
      : DEFAULT_SHERLOCK_THEME_TEMPLATE.id;
  const previewMode =
    value?.previewMode === 'dark' || value?.previewMode === 'light'
      ? value.previewMode
      : draftThemes[activeThemeId]?.mode ?? savedThemes[activeThemeId]?.mode ?? DEFAULT_SHERLOCK_THEME.mode;

  return {
    version: 1,
    activeThemeId,
    previewMode,
    savedThemes,
    draftThemes,
  };
};

export const migrateLegacySherlockThemeWorkspace = (
  legacy: LegacySherlockThemeState | null | undefined
): SherlockThemeWorkspaceState => {
  const workspace = createInitialThemeWorkspace();
  const activeTheme = cloneSherlockTheme(workspace.savedThemes[workspace.activeThemeId]);

  if (legacy?.accentSettings) {
    activeTheme.accent = { ...legacy.accentSettings };
    activeTheme.graphs = createDefaultSherlockThemeGraphs(activeTheme.accent);
  }

  if (legacy?.themeSurfaceSettings) {
    activeTheme.surfaces = {
      dark: {
        shell: createThemeTone(legacy.themeSurfaceSettings.dark.background),
        panel: createThemeTone(legacy.themeSurfaceSettings.dark.panel),
        rail: createThemeTone(legacy.themeSurfaceSettings.dark.background),
        surface: createThemeTone(legacy.themeSurfaceSettings.dark.surface),
      },
      light: {
        shell: createThemeTone(legacy.themeSurfaceSettings.light.background),
        panel: createThemeTone(legacy.themeSurfaceSettings.light.panel),
        rail: createThemeTone(legacy.themeSurfaceSettings.light.background),
        surface: createThemeTone(legacy.themeSurfaceSettings.light.surface),
      },
    };
    activeTheme.background.dark = { ...activeTheme.surfaces.dark.shell };
    activeTheme.background.light = { ...activeTheme.surfaces.light.shell };
  }

  if (legacy?.themeBackgroundSettings) {
    activeTheme.background.variant =
      legacy.themeBackgroundSettings.variant === 'plain' ? 'plain' : 'dot-grid';
    activeTheme.background.dotColor = legacy.themeBackgroundSettings.dotColor;
    activeTheme.background.dotOpacity = legacy.themeBackgroundSettings.dotOpacity;
  }

  if (legacy?.themeFontSettings) {
    activeTheme.typography =
      parseThemeFontSettings(legacy.themeFontSettings) ?? activeTheme.typography;
  }

  if (legacy?.themeMode) {
    activeTheme.mode = legacy.themeMode;
  }

  workspace.previewMode = activeTheme.mode;
  workspace.savedThemes[workspace.activeThemeId] = cloneSherlockTheme(activeTheme);
  workspace.draftThemes[workspace.activeThemeId] = cloneSherlockTheme(activeTheme);
  return workspace;
};

export const getActiveDraftTheme = (workspace: SherlockThemeWorkspaceState): SherlockTheme =>
  cloneSherlockTheme(
    workspace.draftThemes[workspace.activeThemeId] ?? workspace.savedThemes[workspace.activeThemeId]
  );

export const getActiveSavedTheme = (workspace: SherlockThemeWorkspaceState): SherlockTheme =>
  cloneSherlockTheme(
    workspace.savedThemes[workspace.activeThemeId] ?? workspace.draftThemes[workspace.activeThemeId]
  );

export const getDisplayTheme = (workspace: SherlockThemeWorkspaceState): SherlockTheme => ({
  ...getActiveDraftTheme(workspace),
  mode: workspace.previewMode,
});

export const isActiveThemeDirty = (workspace: SherlockThemeWorkspaceState): boolean =>
  serializeTheme(getActiveDraftTheme(workspace)) !== serializeTheme(getActiveSavedTheme(workspace));

export const cloneSherlockThemeWorkspace = (
  workspace: SherlockThemeWorkspaceState
): SherlockThemeWorkspaceState => ({
  version: workspace.version,
  activeThemeId: workspace.activeThemeId,
  previewMode: workspace.previewMode,
  savedThemes: Object.fromEntries(
    Object.entries(workspace.savedThemes).map(([id, theme]) => [id, cloneSherlockTheme(theme)])
  ) as Record<string, SherlockTheme>,
  draftThemes: Object.fromEntries(
    Object.entries(workspace.draftThemes).map(([id, theme]) => [id, cloneSherlockTheme(theme)])
  ) as Record<string, SherlockTheme>,
});

export const updateActiveDraftTheme = (
  workspace: SherlockThemeWorkspaceState,
  updater: (theme: SherlockTheme) => SherlockTheme
): SherlockThemeWorkspaceState => {
  const nextWorkspace = cloneSherlockThemeWorkspace(workspace);
  const currentTheme =
    nextWorkspace.draftThemes[nextWorkspace.activeThemeId] ??
    nextWorkspace.savedThemes[nextWorkspace.activeThemeId] ??
    cloneSherlockTheme(DEFAULT_SHERLOCK_THEME);
  const nextTheme = cloneSherlockTheme(updater(cloneSherlockTheme(currentTheme)));
  nextWorkspace.draftThemes[nextWorkspace.activeThemeId] = nextTheme;
  return nextWorkspace;
};

export const selectActiveTheme = (
  workspace: SherlockThemeWorkspaceState,
  themeId: string
): SherlockThemeWorkspaceState => {
  if (!SHERLOCK_THEME_TEMPLATE_IDS.includes(themeId)) {
    return workspace;
  }

  const nextWorkspace = cloneSherlockThemeWorkspace(workspace);
  nextWorkspace.activeThemeId = themeId;
  return nextWorkspace;
};

export const setThemePreviewMode = (
  workspace: SherlockThemeWorkspaceState,
  previewMode: SherlockThemeMode
): SherlockThemeWorkspaceState => {
  const nextWorkspace = updateActiveDraftTheme(workspace, (theme) => ({ ...theme, mode: previewMode }));
  nextWorkspace.previewMode = previewMode;
  return nextWorkspace;
};

export const saveActiveThemeDraft = (
  workspace: SherlockThemeWorkspaceState
): SherlockThemeWorkspaceState => {
  const nextWorkspace = cloneSherlockThemeWorkspace(workspace);
  const activeDraft = getActiveDraftTheme(nextWorkspace);
  nextWorkspace.savedThemes[nextWorkspace.activeThemeId] = cloneSherlockTheme(activeDraft);
  nextWorkspace.draftThemes[nextWorkspace.activeThemeId] = cloneSherlockTheme(activeDraft);
  nextWorkspace.previewMode = activeDraft.mode;
  return nextWorkspace;
};

export const revertActiveThemeDraft = (
  workspace: SherlockThemeWorkspaceState
): SherlockThemeWorkspaceState => {
  const nextWorkspace = cloneSherlockThemeWorkspace(workspace);
  const savedTheme = getActiveSavedTheme(nextWorkspace);
  nextWorkspace.draftThemes[nextWorkspace.activeThemeId] = cloneSherlockTheme(savedTheme);
  nextWorkspace.previewMode = savedTheme.mode;
  return nextWorkspace;
};

export const factoryResetActiveTheme = (
  workspace: SherlockThemeWorkspaceState
): SherlockThemeWorkspaceState => {
  const factoryThemes = createInitialSavedThemes();
  const factoryTheme =
    factoryThemes[workspace.activeThemeId] ?? factoryThemes[DEFAULT_SHERLOCK_THEME_TEMPLATE.id];
  const nextWorkspace = cloneSherlockThemeWorkspace(workspace);
  nextWorkspace.savedThemes[nextWorkspace.activeThemeId] = cloneSherlockTheme(factoryTheme);
  nextWorkspace.draftThemes[nextWorkspace.activeThemeId] = cloneSherlockTheme(factoryTheme);
  nextWorkspace.previewMode = factoryTheme.mode;
  return nextWorkspace;
};

export const factoryResetAllThemes = (
  workspace: SherlockThemeWorkspaceState
): SherlockThemeWorkspaceState => {
  const factoryThemes = createInitialSavedThemes();
  const nextWorkspace = cloneSherlockThemeWorkspace(workspace);
  nextWorkspace.savedThemes = Object.fromEntries(
    Object.entries(factoryThemes).map(([id, theme]) => [id, cloneSherlockTheme(theme)])
  ) as Record<string, SherlockTheme>;
  nextWorkspace.draftThemes = Object.fromEntries(
    Object.entries(factoryThemes).map(([id, theme]) => [id, cloneSherlockTheme(theme)])
  ) as Record<string, SherlockTheme>;
  nextWorkspace.activeThemeId = DEFAULT_SHERLOCK_THEME_TEMPLATE.id;
  nextWorkspace.previewMode = factoryThemes[DEFAULT_SHERLOCK_THEME_TEMPLATE.id].mode;
  return nextWorkspace;
};

export const forkActiveThemeToNextCustomSlot = (
  workspace: SherlockThemeWorkspaceState
): SherlockThemeWorkspaceState => {
  const nextWorkspace = cloneSherlockThemeWorkspace(workspace);
  const destinationThemeId =
    SHERLOCK_THEME_CUSTOM_TEMPLATE_IDS.find((themeId) => themeId !== workspace.activeThemeId) ??
    SHERLOCK_THEME_CUSTOM_TEMPLATE_IDS[0];
  const activeDraft = getActiveDraftTheme(nextWorkspace);

  nextWorkspace.savedThemes[destinationThemeId] = cloneSherlockTheme(activeDraft);
  nextWorkspace.draftThemes[destinationThemeId] = cloneSherlockTheme(activeDraft);
  nextWorkspace.activeThemeId = destinationThemeId;
  nextWorkspace.previewMode = activeDraft.mode;
  return nextWorkspace;
};

export const exportSherlockThemeJson = (theme: SherlockTheme): string =>
  JSON.stringify(theme, null, 2);

export const exportSherlockResolvedCss = (theme: SherlockTheme): string =>
  buildSherlockThemeCssText(theme);
