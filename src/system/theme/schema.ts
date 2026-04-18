import type { AccentSettings } from '@/utils/accent';
import { DEFAULT_ACCENT_SETTINGS } from '@/utils/accent';
import {
  DEFAULT_THEME_BACKGROUND_SETTINGS,
  type ThemeBackgroundSettings,
} from '@/utils/themeBackground';
import {
  DEFAULT_THEME_FONT_SETTINGS,
  THEME_FONT_OPTIONS,
  type ThemeFontOption,
  type ThemeFontRole,
  type ThemeFontSettings,
} from '@/utils/themeFonts';
import {
  DEFAULT_THEME_SURFACE_SETTINGS,
  THEME_SURFACE_PRESETS,
  type ThemeSurfacePreset,
  type ThemeSurfaceSettings,
} from '@/utils/themeSurfaces';

export type SherlockThemeMode = 'dark' | 'light';
export type SherlockThemeBackgroundVariant = 'plain' | 'dot-grid' | 'cross-grid' | 'scanlines';
export type SherlockThemeControlChrome = 'glass' | 'solid' | 'line';
export const SHERLOCK_THEME_GRAPH_COUNT = 4;

export interface SherlockThemeSurfaceScale {
  shell: AccentSettings;
  panel: AccentSettings;
  rail: AccentSettings;
  surface: AccentSettings;
}

export interface SherlockThemeSurfaceSettings {
  dark: SherlockThemeSurfaceScale;
  light: SherlockThemeSurfaceScale;
}

export interface SherlockThemeBackgroundSettings {
  dark: AccentSettings;
  light: AccentSettings;
  variant: SherlockThemeBackgroundVariant;
  dotColor: number;
  dotOpacity: number;
  gridSize: number;
  glowOpacity: number;
  scanlineOpacity: number;
}

export interface SherlockThemeRadiusSettings {
  shell: number;
  panel: number;
  control: number;
  pill: number;
}

export interface SherlockThemeShellSettings {
  sidebarWidth: number;
  railWidth: number;
  utilityWidth: number;
  toolbarHeight: number;
  contentWidth: number;
  density: number;
  surfaceOpacity: number;
  dividerWidth: number;
  dividerStrength: number;
  dividerTint: number;
  dividerGlow: number;
}

export interface SherlockThemeControlSettings {
  chrome: SherlockThemeControlChrome;
}

export interface SherlockTheme {
  mode: SherlockThemeMode;
  accent: AccentSettings;
  graphs: AccentSettings[];
  surfaces: SherlockThemeSurfaceSettings;
  background: SherlockThemeBackgroundSettings;
  typography: ThemeFontSettings;
  radii: SherlockThemeRadiusSettings;
  shell: SherlockThemeShellSettings;
  controls: SherlockThemeControlSettings;
}

export interface SherlockThemeTemplate {
  id: string;
  label: string;
  description: string;
  theme: SherlockTheme;
}

export interface SherlockThemeWorkspaceState {
  version: 1;
  activeThemeId: string;
  previewMode: SherlockThemeMode;
  savedThemes: Record<string, SherlockTheme>;
  draftThemes: Record<string, SherlockTheme>;
}

export interface LegacySherlockThemeState {
  accentSettings?: AccentSettings | null;
  themeBackgroundSettings?: ThemeBackgroundSettings | null;
  themeFontSettings?: ThemeFontSettings | null;
  themeMode?: SherlockThemeMode | null;
  themeSurfaceSettings?: ThemeSurfaceSettings | null;
}

export const SHERLOCK_THEME_WORKSPACE_VERSION = 1;
export const SHERLOCK_THEME_CUSTOM_TEMPLATE_IDS = ['custom-1', 'custom-2', 'custom-3'] as const;

const cloneAccentSettings = (settings: AccentSettings): AccentSettings => ({
  hue: settings.hue,
  lightness: settings.lightness,
  chroma: settings.chroma,
});

const wrapHue = (value: number) => ((Math.round(value) % 360) + 360) % 360;

export const createDefaultSherlockThemeGraphs = (
  accent: AccentSettings
): AccentSettings[] =>
  [45, 160, 210, 280].map((hueOffset) => ({
    hue: wrapHue(accent.hue + hueOffset),
    lightness: accent.lightness,
    chroma: accent.chroma,
  }));

const createSurfaceScaleFromLegacy = (
  settings: ThemeSurfaceSettings['dark']
): SherlockThemeSurfaceScale => ({
  shell: cloneAccentSettings(settings.background),
  panel: cloneAccentSettings(settings.panel),
  rail: cloneAccentSettings(settings.background),
  surface: cloneAccentSettings(settings.surface),
});

const createSherlockThemeSurfaceSettings = (
  settings: ThemeSurfaceSettings
): SherlockThemeSurfaceSettings => ({
  dark: createSurfaceScaleFromLegacy(settings.dark),
  light: createSurfaceScaleFromLegacy(settings.light),
});

const createSherlockThemeBackgroundSettings = (
  settings: ThemeBackgroundSettings,
  surfaces: SherlockThemeSurfaceSettings
): SherlockThemeBackgroundSettings => ({
  dark: cloneAccentSettings(surfaces.dark.shell),
  light: cloneAccentSettings(surfaces.light.shell),
  variant: settings.variant === 'plain' ? 'plain' : 'dot-grid',
  dotColor: settings.dotColor,
  dotOpacity: settings.dotOpacity,
  gridSize: 20,
  glowOpacity: 0.12,
  scanlineOpacity: 0.08,
});

export const DEFAULT_SHERLOCK_THEME: SherlockTheme = {
  mode: 'light',
  accent: cloneAccentSettings(DEFAULT_ACCENT_SETTINGS),
  graphs: createDefaultSherlockThemeGraphs(DEFAULT_ACCENT_SETTINGS),
  surfaces: createSherlockThemeSurfaceSettings(DEFAULT_THEME_SURFACE_SETTINGS),
  background: createSherlockThemeBackgroundSettings(
    DEFAULT_THEME_BACKGROUND_SETTINGS,
    createSherlockThemeSurfaceSettings(DEFAULT_THEME_SURFACE_SETTINGS)
  ),
  typography: { ...DEFAULT_THEME_FONT_SETTINGS },
  radii: {
    shell: 0,
    panel: 6,
    control: 6,
    pill: 999,
  },
  shell: {
    sidebarWidth: 224,
    railWidth: 304,
    utilityWidth: 360,
    toolbarHeight: 80,
    contentWidth: 1160,
    density: 1,
    surfaceOpacity: 1,
    dividerWidth: 1,
    dividerStrength: 0.72,
    dividerTint: 0,
    dividerGlow: 0,
  },
  controls: {
    chrome: 'glass',
  },
};

const createThemeClone = (theme: SherlockTheme): SherlockTheme => ({
  mode: theme.mode,
  accent: cloneAccentSettings(theme.accent),
  graphs: theme.graphs.map((graph) => cloneAccentSettings(graph)),
  surfaces: {
    dark: {
      shell: cloneAccentSettings(theme.surfaces.dark.shell),
      panel: cloneAccentSettings(theme.surfaces.dark.panel),
      rail: cloneAccentSettings(theme.surfaces.dark.rail),
      surface: cloneAccentSettings(theme.surfaces.dark.surface),
    },
    light: {
      shell: cloneAccentSettings(theme.surfaces.light.shell),
      panel: cloneAccentSettings(theme.surfaces.light.panel),
      rail: cloneAccentSettings(theme.surfaces.light.rail),
      surface: cloneAccentSettings(theme.surfaces.light.surface),
    },
  },
  background: {
    dark: cloneAccentSettings(theme.background.dark),
    light: cloneAccentSettings(theme.background.light),
    variant: theme.background.variant,
    dotColor: theme.background.dotColor,
    dotOpacity: theme.background.dotOpacity,
    gridSize: theme.background.gridSize,
    glowOpacity: theme.background.glowOpacity,
    scanlineOpacity: theme.background.scanlineOpacity,
  },
  typography: { ...theme.typography },
  radii: { ...theme.radii },
  shell: { ...theme.shell },
  controls: { ...theme.controls },
});

const createThemeFromSurfacePreset = (preset: ThemeSurfacePreset): SherlockTheme => {
  const surfaces = createSherlockThemeSurfaceSettings(preset.settings);
  return {
    ...createThemeClone(DEFAULT_SHERLOCK_THEME),
    surfaces,
    background: createSherlockThemeBackgroundSettings(DEFAULT_THEME_BACKGROUND_SETTINGS, surfaces),
  };
};

export const DEFAULT_SHERLOCK_THEME_TEMPLATE: SherlockThemeTemplate = {
  id: 'default',
  label: 'Default',
  description: 'Sherlock default theme with balanced light editing and strong dark chrome.',
  theme: DEFAULT_SHERLOCK_THEME,
};

const CUSTOM_SHERLOCK_THEME_TEMPLATES: SherlockThemeTemplate[] =
  SHERLOCK_THEME_CUSTOM_TEMPLATE_IDS.map((id, index) => ({
    id,
    label: `Custom ${index + 1}`,
    description: 'Editable custom theme slot.',
    theme: createThemeClone(DEFAULT_SHERLOCK_THEME),
  }));

export const SHERLOCK_THEME_LIBRARY_TEMPLATES: SherlockThemeTemplate[] = [
  DEFAULT_SHERLOCK_THEME_TEMPLATE,
  ...THEME_SURFACE_PRESETS.map((preset) => ({
    id: preset.id,
    label: preset.label,
    description: preset.description,
    theme: createThemeFromSurfacePreset(preset),
  })),
  ...CUSTOM_SHERLOCK_THEME_TEMPLATES,
];

export const SHERLOCK_THEME_TEMPLATE_IDS = SHERLOCK_THEME_LIBRARY_TEMPLATES.map(
  (template) => template.id
);

export const SHERLOCK_THEME_BACKGROUND_VARIANTS: Array<{
  id: SherlockThemeBackgroundVariant;
  label: string;
  description: string;
}> = [
  {
    id: 'plain',
    label: 'Plain',
    description: 'No field texture beyond the shell and surfaces.',
  },
  {
    id: 'dot-grid',
    label: 'Dot Grid',
    description: 'Carries forward Sherlock’s existing field texture.',
  },
  {
    id: 'cross-grid',
    label: 'Cross Grid',
    description: 'A cleaner linear grid for layout-heavy surfaces.',
  },
  {
    id: 'scanlines',
    label: 'Scanlines',
    description: 'A restrained CRT line pass over the page background.',
  },
];

export const SHERLOCK_THEME_CONTROL_CHROME_OPTIONS: Array<{
  id: SherlockThemeControlChrome;
  label: string;
  description: string;
}> = [
  {
    id: 'glass',
    label: 'Glass',
    description: 'Translucent controls that lean on surface depth.',
  },
  {
    id: 'solid',
    label: 'Solid',
    description: 'Denser controls with stronger body fill.',
  },
  {
    id: 'line',
    label: 'Line',
    description: 'Minimal chrome that keeps fills restrained.',
  },
];

export const SHERLOCK_THEME_FONT_OPTIONS = THEME_FONT_OPTIONS;

export const getSherlockThemeFontOptionsForRole = (
  role: ThemeFontRole
): ThemeFontOption[] => {
  if (role === 'mono') {
    return SHERLOCK_THEME_FONT_OPTIONS.filter((option) => option.category === 'mono');
  }

  if (role === 'label') {
    return SHERLOCK_THEME_FONT_OPTIONS.filter(
      (option) =>
        option.id === 'space-grotesk' ||
        option.id === 'ibm-plex-sans' ||
        option.id === 'jetbrains-mono' ||
        option.id === 'ibm-plex-mono' ||
        option.id === 'space-mono' ||
        option.id === 'public-sans'
    );
  }

  return SHERLOCK_THEME_FONT_OPTIONS.filter((option) => option.category === 'sans');
};

export const cloneSherlockTheme = (theme: SherlockTheme): SherlockTheme => createThemeClone(theme);

export const createInitialSavedThemes = (): Record<string, SherlockTheme> =>
  Object.fromEntries(
    SHERLOCK_THEME_LIBRARY_TEMPLATES.map((template) => [template.id, cloneSherlockTheme(template.theme)])
  ) as Record<string, SherlockTheme>;

export const createInitialThemeWorkspace = (): SherlockThemeWorkspaceState => {
  const savedThemes = createInitialSavedThemes();

  return {
    version: SHERLOCK_THEME_WORKSPACE_VERSION,
    activeThemeId: DEFAULT_SHERLOCK_THEME_TEMPLATE.id,
    previewMode: DEFAULT_SHERLOCK_THEME.mode,
    savedThemes,
    draftThemes: Object.fromEntries(
      Object.entries(savedThemes).map(([id, theme]) => [id, cloneSherlockTheme(theme)])
    ) as Record<string, SherlockTheme>,
  };
};

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

const isSherlockThemeMode = (value: unknown): value is SherlockThemeMode =>
  value === 'dark' || value === 'light';

const isSherlockThemeBackgroundVariant = (
  value: unknown
): value is SherlockThemeBackgroundVariant =>
  value === 'plain' || value === 'dot-grid' || value === 'cross-grid' || value === 'scanlines';

const isSherlockThemeControlChrome = (value: unknown): value is SherlockThemeControlChrome =>
  value === 'glass' || value === 'solid' || value === 'line';

const isSherlockThemeGraphs = (value: unknown): value is AccentSettings[] =>
  Array.isArray(value) &&
  value.length === SHERLOCK_THEME_GRAPH_COUNT &&
  value.every((entry) => isAccentSettings(entry));

const isSherlockThemeSurfaceScale = (value: unknown): value is SherlockThemeSurfaceScale => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SherlockThemeSurfaceScale>;

  return (
    isAccentSettings(candidate.shell) &&
    isAccentSettings(candidate.panel) &&
    isAccentSettings(candidate.rail) &&
    isAccentSettings(candidate.surface)
  );
};

const isThemeFontSettings = (value: unknown): value is ThemeFontSettings => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ThemeFontSettings>;
  return (
    typeof candidate.ui === 'string' &&
    typeof candidate.display === 'string' &&
    typeof candidate.label === 'string' &&
    typeof candidate.mono === 'string' &&
    typeof candidate.size === 'number' &&
    typeof candidate.weight === 'number'
  );
};

export const parseSherlockTheme = (value: unknown): SherlockTheme | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<SherlockTheme>;

  if (
    !isSherlockThemeMode(candidate.mode) ||
    !isAccentSettings(candidate.accent) ||
    !candidate.surfaces ||
    !isSherlockThemeSurfaceScale(candidate.surfaces.dark) ||
    !isSherlockThemeSurfaceScale(candidate.surfaces.light) ||
    !candidate.background ||
    !isAccentSettings(candidate.background.dark) ||
    !isAccentSettings(candidate.background.light) ||
    !isSherlockThemeBackgroundVariant(candidate.background.variant) ||
    typeof candidate.background.dotColor !== 'number' ||
    typeof candidate.background.dotOpacity !== 'number' ||
    typeof candidate.background.gridSize !== 'number' ||
    typeof candidate.background.glowOpacity !== 'number' ||
    typeof candidate.background.scanlineOpacity !== 'number' ||
    !isThemeFontSettings(candidate.typography) ||
    !candidate.radii ||
    typeof candidate.radii.shell !== 'number' ||
    typeof candidate.radii.panel !== 'number' ||
    typeof candidate.radii.control !== 'number' ||
    typeof candidate.radii.pill !== 'number' ||
    !candidate.shell ||
    typeof candidate.shell.sidebarWidth !== 'number' ||
    typeof candidate.shell.railWidth !== 'number' ||
    typeof candidate.shell.utilityWidth !== 'number' ||
    typeof candidate.shell.toolbarHeight !== 'number' ||
    typeof candidate.shell.contentWidth !== 'number' ||
    typeof candidate.shell.density !== 'number' ||
    typeof candidate.shell.surfaceOpacity !== 'number' ||
    typeof candidate.shell.dividerWidth !== 'number' ||
    typeof candidate.shell.dividerStrength !== 'number' ||
    typeof candidate.shell.dividerTint !== 'number' ||
    typeof candidate.shell.dividerGlow !== 'number' ||
    !candidate.controls ||
    !isSherlockThemeControlChrome(candidate.controls.chrome)
  ) {
    return null;
  }

  return cloneSherlockTheme({
    mode: candidate.mode,
    accent: candidate.accent,
    graphs: isSherlockThemeGraphs(candidate.graphs)
      ? candidate.graphs.map((graph) => cloneAccentSettings(graph))
      : createDefaultSherlockThemeGraphs(candidate.accent),
    surfaces: candidate.surfaces,
    background: candidate.background,
    typography: candidate.typography,
    radii: candidate.radii,
    shell: candidate.shell,
    controls: candidate.controls,
  });
};
