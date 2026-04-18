import type { AccentSettings } from '@/utils/accent';
import { DEFAULT_ACCENT_SETTINGS } from '@/utils/accent';
import {
  DEFAULT_THEME_BACKGROUND_SETTINGS,
  THEME_SURFACE_PRESETS,
  type ThemeBackgroundSettings,
  type ThemeSurfacePreset,
  type ThemeSurfaceSettings,
} from '@/system/theme/legacy/splitTheme';
import {
  createDefaultThemeFontProfiles,
  DEFAULT_THEME_FONT_SETTINGS,
  parseThemeFontSettings,
  THEME_FONT_OPTIONS,
  type ThemeFontOption,
  type ThemeFontRole,
  type ThemeFontSettings,
} from '@/utils/themeFonts';
import { DEFAULT_THEME_SURFACE_SETTINGS } from '@/system/theme/legacy/splitTheme';

export type SherlockThemeMode = 'dark' | 'light';
export type SherlockThemeBackgroundVariant = 'plain' | 'dot-grid' | 'cross-grid' | 'scanlines';
export type SherlockThemeControlChrome = 'glass' | 'solid' | 'line';
export const SHERLOCK_THEME_GRAPH_COUNT = 4;

export interface SherlockThemeTone extends AccentSettings {
  opacity: number;
}

export interface SherlockThemeSurfaceScale {
  shell: SherlockThemeTone;
  panel: SherlockThemeTone;
  rail: SherlockThemeTone;
  surface: SherlockThemeTone;
}

export interface SherlockThemeSurfaceSettings {
  dark: SherlockThemeSurfaceScale;
  light: SherlockThemeSurfaceScale;
}

export interface SherlockThemeBackgroundSettings {
  dark: SherlockThemeTone;
  light: SherlockThemeTone;
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
  graphs: SherlockThemeTone[];
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
export const SHERLOCK_THEME_CUSTOM_TEMPLATE_IDS = ['custom-1', 'custom-2'] as const;

const cloneAccentSettings = (settings: AccentSettings): AccentSettings => ({
  hue: settings.hue,
  lightness: settings.lightness,
  chroma: settings.chroma,
});

export const createThemeTone = (settings: AccentSettings, opacity = 1): SherlockThemeTone => ({
  hue: settings.hue,
  lightness: settings.lightness,
  chroma: settings.chroma,
  opacity,
});

const cloneThemeTone = (settings: SherlockThemeTone): SherlockThemeTone => ({
  hue: settings.hue,
  lightness: settings.lightness,
  chroma: settings.chroma,
  opacity: settings.opacity,
});

const wrapHue = (value: number) => ((Math.round(value) % 360) + 360) % 360;

export const createDefaultSherlockThemeGraphs = (
  accent: AccentSettings
): SherlockThemeTone[] =>
  [45, 160, 210, 280].map((hueOffset) => ({
    hue: wrapHue(accent.hue + hueOffset),
    lightness: accent.lightness,
    chroma: accent.chroma,
    opacity: 1,
  }));

const createSurfaceScaleFromLegacy = (
  settings: ThemeSurfaceSettings['dark']
): SherlockThemeSurfaceScale => ({
  shell: createThemeTone(settings.background),
  panel: createThemeTone(settings.panel),
  rail: createThemeTone(settings.background),
  surface: createThemeTone(settings.surface),
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
  dark: cloneThemeTone(surfaces.dark.shell),
  light: cloneThemeTone(surfaces.light.shell),
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
  typography: {
    ...DEFAULT_THEME_FONT_SETTINGS,
    profiles: createDefaultThemeFontProfiles(),
  },
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
  graphs: theme.graphs.map((graph) => cloneThemeTone(graph)),
  surfaces: {
    dark: {
      shell: cloneThemeTone(theme.surfaces.dark.shell),
      panel: cloneThemeTone(theme.surfaces.dark.panel),
      rail: cloneThemeTone(theme.surfaces.dark.rail),
      surface: cloneThemeTone(theme.surfaces.dark.surface),
    },
    light: {
      shell: cloneThemeTone(theme.surfaces.light.shell),
      panel: cloneThemeTone(theme.surfaces.light.panel),
      rail: cloneThemeTone(theme.surfaces.light.rail),
      surface: cloneThemeTone(theme.surfaces.light.surface),
    },
  },
  background: {
    dark: cloneThemeTone(theme.background.dark),
    light: cloneThemeTone(theme.background.light),
    variant: theme.background.variant,
    dotColor: theme.background.dotColor,
    dotOpacity: theme.background.dotOpacity,
    gridSize: theme.background.gridSize,
    glowOpacity: theme.background.glowOpacity,
    scanlineOpacity: theme.background.scanlineOpacity,
  },
  typography: {
    ...theme.typography,
    profiles: {
      ui: { ...theme.typography.profiles.ui },
      display: { ...theme.typography.profiles.display },
      label: { ...theme.typography.profiles.label },
      mono: { ...theme.typography.profiles.mono },
    },
  },
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

const BLUEBERRY_SHERLOCK_THEME: SherlockTheme = {
  mode: 'dark',
  accent: { hue: 293, lightness: 0.555, chroma: 0.098 },
  graphs: [
    { hue: 248, lightness: 0.475, chroma: 0.1, opacity: 1 },
    { hue: 3, lightness: 0.475, chroma: 0.1, opacity: 1 },
    { hue: 53, lightness: 0.475, chroma: 0.1, opacity: 1 },
    { hue: 291, lightness: 0.475, chroma: 0.122, opacity: 1 },
  ],
  surfaces: {
    dark: {
      shell: { hue: 0, lightness: 0.088, chroma: 0.027, opacity: 1 },
      panel: { hue: 286, lightness: 0.134, chroma: 0.005, opacity: 1 },
      rail: { hue: 0, lightness: 0.088, chroma: 0.027, opacity: 1 },
      surface: { hue: 286, lightness: 0.35, chroma: 0.006, opacity: 1 },
    },
    light: {
      shell: { hue: 74, lightness: 0.94, chroma: 0.03, opacity: 1 },
      panel: { hue: 70, lightness: 0.962, chroma: 0.032, opacity: 1 },
      rail: { hue: 74, lightness: 0.94, chroma: 0.03, opacity: 1 },
      surface: { hue: 64, lightness: 0.9, chroma: 0.04, opacity: 1 },
    },
  },
  background: {
    dark: { hue: 0, lightness: 0.088, chroma: 0.027, opacity: 1 },
    light: { hue: 74, lightness: 0.94, chroma: 0.03, opacity: 1 },
    variant: 'dot-grid',
    dotColor: 23,
    dotOpacity: 0.42,
    gridSize: 20,
    glowOpacity: 0.12,
    scanlineOpacity: 0.08,
  },
  typography: {
    ui: 'plus-jakarta-sans',
    display: 'plus-jakarta-sans',
    label: 'ibm-plex-mono',
    mono: 'source-code-pro',
    size: -0.15,
    weight: -0.1,
    profiles: createDefaultThemeFontProfiles(),
  },
  radii: {
    shell: 0,
    panel: 3,
    control: 4,
    pill: 2,
  },
  shell: {
    sidebarWidth: 220,
    railWidth: 300,
    utilityWidth: 360,
    toolbarHeight: 72,
    contentWidth: 980,
    density: 1,
    surfaceOpacity: 1,
    dividerWidth: 1,
    dividerStrength: 1,
    dividerTint: 0,
    dividerGlow: 0,
  },
  controls: {
    chrome: 'glass',
  },
};

export const DEFAULT_SHERLOCK_THEME_TEMPLATE: SherlockThemeTemplate = {
  id: 'default',
  label: 'Default',
  description: 'Sherlock default theme with balanced light editing and strong dark chrome.',
  theme: DEFAULT_SHERLOCK_THEME,
};

const CUSTOM_SHERLOCK_THEME_TEMPLATES: SherlockThemeTemplate[] =
  [
    { id: 'custom-1', label: 'Suyra' },
    { id: 'custom-2', label: 'Arctic' },
  ].map(({ id, label }) => ({
    id,
    label,
    description: 'Editable custom theme slot.',
    theme: createThemeClone(DEFAULT_SHERLOCK_THEME),
  }));

export const SHERLOCK_THEME_LIBRARY_TEMPLATES: SherlockThemeTemplate[] = [
  DEFAULT_SHERLOCK_THEME_TEMPLATE,
  {
    id: 'blueberry',
    label: 'Blueberry',
    description: 'A richer signal-room palette preserved from the canon full-theme library.',
    theme: BLUEBERRY_SHERLOCK_THEME,
  },
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

const isSherlockThemeTone = (value: unknown): value is SherlockThemeTone => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SherlockThemeTone>;

  return (
    typeof candidate.hue === 'number' &&
    Number.isFinite(candidate.hue) &&
    typeof candidate.lightness === 'number' &&
    Number.isFinite(candidate.lightness) &&
    typeof candidate.chroma === 'number' &&
    Number.isFinite(candidate.chroma) &&
    typeof candidate.opacity === 'number' &&
    Number.isFinite(candidate.opacity)
  );
};

const normalizeSherlockThemeTone = (
  value: unknown,
  fallback?: SherlockThemeTone | null
): SherlockThemeTone | null => {
  if (isSherlockThemeTone(value)) {
    return cloneThemeTone(value);
  }
  if (isAccentSettings(value)) {
    return createThemeTone(value);
  }
  return fallback ? cloneThemeTone(fallback) : null;
};

const isSherlockThemeBackgroundVariant = (
  value: unknown
): value is SherlockThemeBackgroundVariant =>
  value === 'plain' || value === 'dot-grid' || value === 'cross-grid' || value === 'scanlines';

const isSherlockThemeControlChrome = (value: unknown): value is SherlockThemeControlChrome =>
  value === 'glass' || value === 'solid' || value === 'line';

const isSherlockThemeGraphs = (value: unknown): value is SherlockThemeTone[] =>
  Array.isArray(value) &&
  value.length === SHERLOCK_THEME_GRAPH_COUNT &&
  value.every((entry) => isSherlockThemeTone(entry) || isAccentSettings(entry));

const isSherlockThemeSurfaceScale = (value: unknown): value is SherlockThemeSurfaceScale => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SherlockThemeSurfaceScale>;

  return (
    (isSherlockThemeTone(candidate.shell) || isAccentSettings(candidate.shell)) &&
    (isSherlockThemeTone(candidate.panel) || isAccentSettings(candidate.panel)) &&
    (isSherlockThemeTone(candidate.rail) || isAccentSettings(candidate.rail)) &&
    (isSherlockThemeTone(candidate.surface) || isAccentSettings(candidate.surface))
  );
};

export const parseSherlockTheme = (value: unknown): SherlockTheme | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<SherlockTheme>;
  const typography = parseThemeFontSettings(candidate.typography);

  if (
    !isSherlockThemeMode(candidate.mode) ||
    !isAccentSettings(candidate.accent) ||
    !candidate.surfaces ||
    !isSherlockThemeSurfaceScale(candidate.surfaces.dark) ||
    !isSherlockThemeSurfaceScale(candidate.surfaces.light) ||
    !candidate.background ||
    !isSherlockThemeBackgroundVariant(candidate.background.variant) ||
    typeof candidate.background.dotColor !== 'number' ||
    typeof candidate.background.dotOpacity !== 'number' ||
    typeof candidate.background.gridSize !== 'number' ||
    typeof candidate.background.glowOpacity !== 'number' ||
    typeof candidate.background.scanlineOpacity !== 'number' ||
    !typography ||
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

  const darkShell = normalizeSherlockThemeTone(candidate.surfaces.dark.shell);
  const darkPanel = normalizeSherlockThemeTone(candidate.surfaces.dark.panel);
  const darkRail = normalizeSherlockThemeTone(candidate.surfaces.dark.rail);
  const darkSurface = normalizeSherlockThemeTone(candidate.surfaces.dark.surface);
  const lightShell = normalizeSherlockThemeTone(candidate.surfaces.light.shell);
  const lightPanel = normalizeSherlockThemeTone(candidate.surfaces.light.panel);
  const lightRail = normalizeSherlockThemeTone(candidate.surfaces.light.rail);
  const lightSurface = normalizeSherlockThemeTone(candidate.surfaces.light.surface);

  if (
    !darkShell ||
    !darkPanel ||
    !darkRail ||
    !darkSurface ||
    !lightShell ||
    !lightPanel ||
    !lightRail ||
    !lightSurface
  ) {
    return null;
  }

  const backgroundDark = normalizeSherlockThemeTone(candidate.background.dark, darkShell);
  const backgroundLight = normalizeSherlockThemeTone(candidate.background.light, lightShell);

  if (!backgroundDark || !backgroundLight) {
    return null;
  }

  const surfaces: SherlockThemeSurfaceSettings = {
    dark: {
      shell: darkShell,
      panel: darkPanel,
      rail: darkRail,
      surface: darkSurface,
    },
    light: {
      shell: lightShell,
      panel: lightPanel,
      rail: lightRail,
      surface: lightSurface,
    },
  };

  return cloneSherlockTheme({
    mode: candidate.mode,
    accent: candidate.accent,
    graphs: isSherlockThemeGraphs(candidate.graphs)
      ? candidate.graphs.map(
          (graph, index) =>
            normalizeSherlockThemeTone(graph, DEFAULT_SHERLOCK_THEME.graphs[index]) ??
            cloneThemeTone(DEFAULT_SHERLOCK_THEME.graphs[index])
        )
      : createDefaultSherlockThemeGraphs(candidate.accent),
    surfaces,
    background: {
      dark: backgroundDark,
      light: backgroundLight,
      variant: candidate.background.variant,
      dotColor: candidate.background.dotColor,
      dotOpacity: candidate.background.dotOpacity,
      gridSize: candidate.background.gridSize,
      glowOpacity: candidate.background.glowOpacity,
      scanlineOpacity: candidate.background.scanlineOpacity,
    },
    typography,
    radii: candidate.radii,
    shell: candidate.shell,
    controls: candidate.controls,
  });
};
