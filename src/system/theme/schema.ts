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

export interface SherlockThemeModeState<T> {
  dark: T;
  light: T;
}

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

export interface SherlockThemeBackgroundLayer extends SherlockThemeTone {
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
  dividerTone: SherlockThemeModeState<SherlockThemeTone>;
  dividerWidth: SherlockThemeModeState<number>;
  dividerStrength: SherlockThemeModeState<number>;
  dividerTint: SherlockThemeModeState<number>;
  dividerGlow: SherlockThemeModeState<number>;
}

export interface SherlockThemeControlSettings {
  chrome: SherlockThemeControlChrome;
}

export interface SherlockTheme {
  accent: SherlockThemeModeState<AccentSettings>;
  graphs: SherlockThemeModeState<SherlockThemeTone[]>;
  surfaces: SherlockThemeSurfaceSettings;
  background: SherlockThemeModeState<SherlockThemeBackgroundLayer>;
  typography: ThemeFontSettings;
  radii: SherlockThemeRadiusSettings;
  shell: SherlockThemeShellSettings;
  controls: SherlockThemeControlSettings;
}

export interface ResolvedSherlockThemeShellSettings {
  sidebarWidth: number;
  railWidth: number;
  utilityWidth: number;
  toolbarHeight: number;
  contentWidth: number;
  density: number;
  surfaceOpacity: number;
  dividerTone: SherlockThemeTone;
  dividerWidth: number;
  dividerStrength: number;
  dividerTint: number;
  dividerGlow: number;
}

export interface ResolvedSherlockTheme {
  accent: AccentSettings;
  graphs: SherlockThemeTone[];
  surfaces: SherlockThemeSurfaceScale;
  background: SherlockThemeBackgroundLayer;
  typography: ThemeFontSettings;
  radii: SherlockThemeRadiusSettings;
  shell: ResolvedSherlockThemeShellSettings;
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

const cloneModeState = <T>(value: SherlockThemeModeState<T>, cloneValue: (entry: T) => T) => ({
  dark: cloneValue(value.dark),
  light: cloneValue(value.light),
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

const createModeState = <T>(dark: T, light: T): SherlockThemeModeState<T> => ({
  dark,
  light,
});

const createSharedModeState = <T>(value: T, cloneValue: (entry: T) => T): SherlockThemeModeState<T> =>
  createModeState(cloneValue(value), cloneValue(value));

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

const createBackgroundLayer = (
  tone: SherlockThemeTone,
  settings: ThemeBackgroundSettings
): SherlockThemeBackgroundLayer => ({
  ...cloneThemeTone(tone),
  variant: settings.variant === 'plain' ? 'plain' : 'dot-grid',
  dotColor: settings.dotColor,
  dotOpacity: settings.dotOpacity,
  gridSize: 20,
  glowOpacity: 0.12,
  scanlineOpacity: 0.08,
});

const cloneBackgroundLayer = (
  settings: SherlockThemeBackgroundLayer
): SherlockThemeBackgroundLayer => ({
  ...cloneThemeTone(settings),
  variant: settings.variant,
  dotColor: settings.dotColor,
  dotOpacity: settings.dotOpacity,
  gridSize: settings.gridSize,
  glowOpacity: settings.glowOpacity,
  scanlineOpacity: settings.scanlineOpacity,
});

const createSherlockThemeBackgroundSettings = (
  settings: ThemeBackgroundSettings,
  surfaces: SherlockThemeSurfaceSettings
): SherlockThemeModeState<SherlockThemeBackgroundLayer> => ({
  dark: createBackgroundLayer(surfaces.dark.shell, settings),
  light: createBackgroundLayer(surfaces.light.shell, settings),
});

const DEFAULT_DIVIDER_TONES: SherlockThemeModeState<SherlockThemeTone> = {
  dark: { hue: 250, lightness: 0.52, chroma: 0.018, opacity: 1 },
  light: { hue: 72, lightness: 0.56, chroma: 0.032, opacity: 1 },
};

const createDividerModeState = (
  width: number,
  strength: number,
  tint: number,
  glow: number,
  dividerTone = DEFAULT_DIVIDER_TONES
) => ({
  dividerTone: cloneModeState(dividerTone, cloneThemeTone),
  dividerWidth: createSharedModeState(width, (value) => value),
  dividerStrength: createSharedModeState(strength, (value) => value),
  dividerTint: createSharedModeState(tint, (value) => value),
  dividerGlow: createSharedModeState(glow, (value) => value),
});

const DEFAULT_THEME_SURFACES = createSherlockThemeSurfaceSettings(DEFAULT_THEME_SURFACE_SETTINGS);
const DEFAULT_THEME_BACKGROUND = createSherlockThemeBackgroundSettings(
  DEFAULT_THEME_BACKGROUND_SETTINGS,
  DEFAULT_THEME_SURFACES
);

export const DEFAULT_SHERLOCK_THEME: SherlockTheme = {
  accent: createSharedModeState(DEFAULT_ACCENT_SETTINGS, cloneAccentSettings),
  graphs: {
    dark: createDefaultSherlockThemeGraphs(DEFAULT_ACCENT_SETTINGS),
    light: createDefaultSherlockThemeGraphs(DEFAULT_ACCENT_SETTINGS),
  },
  surfaces: DEFAULT_THEME_SURFACES,
  background: DEFAULT_THEME_BACKGROUND,
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
    toolbarHeight: 64,
    contentWidth: 1160,
    density: 1,
    surfaceOpacity: 1,
    ...createDividerModeState(1, 0.72, 0, 0),
  },
  controls: {
    chrome: 'glass',
  },
};

const createThemeClone = (theme: SherlockTheme): SherlockTheme => ({
  accent: cloneModeState(theme.accent, cloneAccentSettings),
  graphs: cloneModeState(theme.graphs, (graphs) => graphs.map((graph) => cloneThemeTone(graph))),
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
  background: cloneModeState(theme.background, cloneBackgroundLayer),
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
  shell: {
    ...theme.shell,
    dividerTone: cloneModeState(theme.shell.dividerTone, cloneThemeTone),
    dividerWidth: { ...theme.shell.dividerWidth },
    dividerStrength: { ...theme.shell.dividerStrength },
    dividerTint: { ...theme.shell.dividerTint },
    dividerGlow: { ...theme.shell.dividerGlow },
  },
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

const BLUEBERRY_ACCENT = { hue: 293, lightness: 0.555, chroma: 0.098 };

const BLUEBERRY_SHERLOCK_THEME: SherlockTheme = {
  accent: createSharedModeState(BLUEBERRY_ACCENT, cloneAccentSettings),
  graphs: createSharedModeState(
    [
      { hue: 248, lightness: 0.475, chroma: 0.1, opacity: 1 },
      { hue: 3, lightness: 0.475, chroma: 0.1, opacity: 1 },
      { hue: 53, lightness: 0.475, chroma: 0.1, opacity: 1 },
      { hue: 291, lightness: 0.475, chroma: 0.122, opacity: 1 },
    ],
    (graphs) => graphs.map((graph) => cloneThemeTone(graph))
  ),
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
    dark: {
      hue: 0,
      lightness: 0.088,
      chroma: 0.027,
      opacity: 1,
      variant: 'dot-grid',
      dotColor: 23,
      dotOpacity: 0.42,
      gridSize: 20,
      glowOpacity: 0.12,
      scanlineOpacity: 0.08,
    },
    light: {
      hue: 74,
      lightness: 0.94,
      chroma: 0.03,
      opacity: 1,
      variant: 'dot-grid',
      dotColor: 23,
      dotOpacity: 0.42,
      gridSize: 20,
      glowOpacity: 0.12,
      scanlineOpacity: 0.08,
    },
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
    toolbarHeight: 64,
    contentWidth: 980,
    density: 1,
    surfaceOpacity: 1,
    ...createDividerModeState(1, 1, 0, 0, {
      dark: { hue: 286, lightness: 0.48, chroma: 0.018, opacity: 1 },
      light: { hue: 70, lightness: 0.58, chroma: 0.038, opacity: 1 },
    }),
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

const CUSTOM_SHERLOCK_THEME_TEMPLATES: SherlockThemeTemplate[] = [
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
    description: "Carries forward Sherlock's existing field texture.",
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

export const resolveSherlockTheme = (
  theme: SherlockTheme,
  mode: SherlockThemeMode
): ResolvedSherlockTheme => ({
  accent: cloneAccentSettings(theme.accent[mode]),
  graphs: theme.graphs[mode].map((graph) => cloneThemeTone(graph)),
  surfaces: {
    shell: cloneThemeTone(theme.surfaces[mode].shell),
    panel: cloneThemeTone(theme.surfaces[mode].panel),
    rail: cloneThemeTone(theme.surfaces[mode].rail),
    surface: cloneThemeTone(theme.surfaces[mode].surface),
  },
  background: cloneBackgroundLayer(theme.background[mode]),
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
  shell: {
    sidebarWidth: theme.shell.sidebarWidth,
    railWidth: theme.shell.railWidth,
    utilityWidth: theme.shell.utilityWidth,
    toolbarHeight: theme.shell.toolbarHeight,
    contentWidth: theme.shell.contentWidth,
    density: theme.shell.density,
    surfaceOpacity: theme.shell.surfaceOpacity,
    dividerTone: cloneThemeTone(theme.shell.dividerTone[mode]),
    dividerWidth: theme.shell.dividerWidth[mode],
    dividerStrength: theme.shell.dividerStrength[mode],
    dividerTint: theme.shell.dividerTint[mode],
    dividerGlow: theme.shell.dividerGlow[mode],
  },
  controls: { ...theme.controls },
});

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

const isSherlockThemeModeState = <T>(
  value: unknown,
  predicate: (entry: unknown) => entry is T
): value is SherlockThemeModeState<T> => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SherlockThemeModeState<T>>;
  return predicate(candidate.dark) && predicate(candidate.light);
};

const normalizeAccentModeState = (
  value: unknown,
  fallback: SherlockThemeModeState<AccentSettings>
): SherlockThemeModeState<AccentSettings> => {
  if (isAccentSettings(value)) {
    return createSharedModeState(value, cloneAccentSettings);
  }
  if (isSherlockThemeModeState(value, isAccentSettings)) {
    return cloneModeState(value, cloneAccentSettings);
  }
  return cloneModeState(fallback, cloneAccentSettings);
};

const isSherlockThemeToneLike = (value: unknown): value is SherlockThemeTone | AccentSettings =>
  isSherlockThemeTone(value) || isAccentSettings(value);

const normalizeToneModeState = (
  value: unknown,
  fallback: SherlockThemeModeState<SherlockThemeTone>
): SherlockThemeModeState<SherlockThemeTone> => {
  if (isSherlockThemeToneLike(value)) {
    const tone = normalizeSherlockThemeTone(value, fallback.dark) ?? fallback.dark;
    return createSharedModeState(tone, cloneThemeTone);
  }

  if (isSherlockThemeModeState(value, isSherlockThemeToneLike)) {
    return {
      dark: normalizeSherlockThemeTone(value.dark, fallback.dark) ?? cloneThemeTone(fallback.dark),
      light:
        normalizeSherlockThemeTone(value.light, fallback.light) ?? cloneThemeTone(fallback.light),
    };
  }

  return cloneModeState(fallback, cloneThemeTone);
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

const normalizeGraphs = (
  value: unknown,
  fallback: SherlockThemeTone[]
): SherlockThemeTone[] | null => {
  if (!isSherlockThemeGraphs(value)) {
    return null;
  }

  return value.map(
    (graph, index) =>
      normalizeSherlockThemeTone(graph, fallback[index]) ?? cloneThemeTone(fallback[index])
  );
};

const normalizeGraphModeState = (
  value: unknown,
  fallback: SherlockThemeModeState<SherlockThemeTone[]>
): SherlockThemeModeState<SherlockThemeTone[]> => {
  if (isSherlockThemeGraphs(value)) {
    const graphs = normalizeGraphs(value, fallback.dark) ?? fallback.dark.map(cloneThemeTone);
    return createSharedModeState(graphs, (entries) => entries.map((graph) => cloneThemeTone(graph)));
  }

  if (isSherlockThemeModeState(value, isSherlockThemeGraphs)) {
    const dark = normalizeGraphs(value.dark, fallback.dark);
    const light = normalizeGraphs(value.light, fallback.light);
    if (dark && light) {
      return {
        dark,
        light,
      };
    }
  }

  return {
    dark: fallback.dark.map((graph) => cloneThemeTone(graph)),
    light: fallback.light.map((graph) => cloneThemeTone(graph)),
  };
};

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

const normalizeSurfaceScale = (
  value: unknown,
  fallback: SherlockThemeSurfaceScale
): SherlockThemeSurfaceScale | null => {
  if (!isSherlockThemeSurfaceScale(value)) {
    return null;
  }

  const shell = normalizeSherlockThemeTone(value.shell, fallback.shell);
  const panel = normalizeSherlockThemeTone(value.panel, fallback.panel);
  const rail = normalizeSherlockThemeTone(value.rail, fallback.rail);
  const surface = normalizeSherlockThemeTone(value.surface, fallback.surface);

  if (!shell || !panel || !rail || !surface) {
    return null;
  }

  return { shell, panel, rail, surface };
};

const isSherlockThemeBackgroundLayer = (value: unknown): value is SherlockThemeBackgroundLayer => {
  if (!isSherlockThemeTone(value)) return false;
  const candidate = value as Partial<SherlockThemeBackgroundLayer>;

  return (
    isSherlockThemeBackgroundVariant(candidate.variant) &&
    typeof candidate.dotColor === 'number' &&
    typeof candidate.dotOpacity === 'number' &&
    typeof candidate.gridSize === 'number' &&
    typeof candidate.glowOpacity === 'number' &&
    typeof candidate.scanlineOpacity === 'number'
  );
};

const normalizeBackgroundModeState = (
  value: unknown,
  fallback: SherlockThemeModeState<SherlockThemeBackgroundLayer>
): SherlockThemeModeState<SherlockThemeBackgroundLayer> => {
  if (value && typeof value === 'object') {
    const candidate = value as {
      dark?: unknown;
      light?: unknown;
      variant?: unknown;
      dotColor?: unknown;
      dotOpacity?: unknown;
      gridSize?: unknown;
      glowOpacity?: unknown;
      scanlineOpacity?: unknown;
    };

    if (isSherlockThemeBackgroundLayer(candidate.dark) && isSherlockThemeBackgroundLayer(candidate.light)) {
      return {
        dark: cloneBackgroundLayer(candidate.dark),
        light: cloneBackgroundLayer(candidate.light),
      };
    }

    if (
      (isSherlockThemeTone(candidate.dark) || isAccentSettings(candidate.dark)) &&
      (isSherlockThemeTone(candidate.light) || isAccentSettings(candidate.light)) &&
      isSherlockThemeBackgroundVariant(candidate.variant) &&
      typeof candidate.dotColor === 'number' &&
      typeof candidate.dotOpacity === 'number' &&
      typeof candidate.gridSize === 'number' &&
      typeof candidate.glowOpacity === 'number' &&
      typeof candidate.scanlineOpacity === 'number'
    ) {
      const darkTone = normalizeSherlockThemeTone(candidate.dark, fallback.dark);
      const lightTone = normalizeSherlockThemeTone(candidate.light, fallback.light);

      if (darkTone && lightTone) {
        return {
          dark: {
            ...darkTone,
            variant: candidate.variant,
            dotColor: candidate.dotColor,
            dotOpacity: candidate.dotOpacity,
            gridSize: candidate.gridSize,
            glowOpacity: candidate.glowOpacity,
            scanlineOpacity: candidate.scanlineOpacity,
          },
          light: {
            ...lightTone,
            variant: candidate.variant,
            dotColor: candidate.dotColor,
            dotOpacity: candidate.dotOpacity,
            gridSize: candidate.gridSize,
            glowOpacity: candidate.glowOpacity,
            scanlineOpacity: candidate.scanlineOpacity,
          },
        };
      }
    }
  }

  return {
    dark: cloneBackgroundLayer(fallback.dark),
    light: cloneBackgroundLayer(fallback.light),
  };
};

const normalizeModeNumber = (
  value: unknown,
  fallback: SherlockThemeModeState<number>
): SherlockThemeModeState<number> => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return {
      dark: value,
      light: value,
    };
  }

  if (
    value &&
    typeof value === 'object' &&
    typeof (value as SherlockThemeModeState<unknown>).dark === 'number' &&
    typeof (value as SherlockThemeModeState<unknown>).light === 'number'
  ) {
    return {
      dark: (value as SherlockThemeModeState<number>).dark,
      light: (value as SherlockThemeModeState<number>).light,
    };
  }

  return { ...fallback };
};

export const parseSherlockTheme = (value: unknown): SherlockTheme | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<SherlockTheme> & {
    shell?: Partial<SherlockThemeShellSettings>;
  };
  const typography = parseThemeFontSettings(candidate.typography);

  if (
    !candidate.surfaces ||
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
    !candidate.controls ||
    !isSherlockThemeControlChrome(candidate.controls.chrome)
  ) {
    return null;
  }

  const darkSurfaces = normalizeSurfaceScale(
    candidate.surfaces.dark,
    DEFAULT_SHERLOCK_THEME.surfaces.dark
  );
  const lightSurfaces = normalizeSurfaceScale(
    candidate.surfaces.light,
    DEFAULT_SHERLOCK_THEME.surfaces.light
  );

  if (!darkSurfaces || !lightSurfaces) {
    return null;
  }

  const accent = normalizeAccentModeState(candidate.accent, DEFAULT_SHERLOCK_THEME.accent);
  const graphs = normalizeGraphModeState(candidate.graphs, DEFAULT_SHERLOCK_THEME.graphs);
  const background = normalizeBackgroundModeState(candidate.background, {
    dark: {
      ...DEFAULT_SHERLOCK_THEME.background.dark,
      hue: darkSurfaces.shell.hue,
      lightness: darkSurfaces.shell.lightness,
      chroma: darkSurfaces.shell.chroma,
      opacity: darkSurfaces.shell.opacity,
    },
    light: {
      ...DEFAULT_SHERLOCK_THEME.background.light,
      hue: lightSurfaces.shell.hue,
      lightness: lightSurfaces.shell.lightness,
      chroma: lightSurfaces.shell.chroma,
      opacity: lightSurfaces.shell.opacity,
    },
  });

  return cloneSherlockTheme({
    accent,
    graphs,
    surfaces: {
      dark: darkSurfaces,
      light: lightSurfaces,
    },
    background,
    typography,
    radii: candidate.radii,
    shell: {
      sidebarWidth: candidate.shell.sidebarWidth,
      railWidth: candidate.shell.railWidth,
      utilityWidth: candidate.shell.utilityWidth,
      toolbarHeight: candidate.shell.toolbarHeight,
      contentWidth: candidate.shell.contentWidth,
      density: candidate.shell.density,
      surfaceOpacity: candidate.shell.surfaceOpacity,
      dividerTone: normalizeToneModeState(
        candidate.shell.dividerTone,
        DEFAULT_SHERLOCK_THEME.shell.dividerTone
      ),
      dividerWidth: normalizeModeNumber(
        candidate.shell.dividerWidth,
        DEFAULT_SHERLOCK_THEME.shell.dividerWidth
      ),
      dividerStrength: normalizeModeNumber(
        candidate.shell.dividerStrength,
        DEFAULT_SHERLOCK_THEME.shell.dividerStrength
      ),
      dividerTint: normalizeModeNumber(
        candidate.shell.dividerTint,
        DEFAULT_SHERLOCK_THEME.shell.dividerTint
      ),
      dividerGlow: normalizeModeNumber(
        candidate.shell.dividerGlow,
        DEFAULT_SHERLOCK_THEME.shell.dividerGlow
      ),
    },
    controls: candidate.controls,
  });
};
