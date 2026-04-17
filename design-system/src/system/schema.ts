export type ThemeMode = 'dark' | 'light';
export type FontRole = 'ui' | 'display' | 'label' | 'mono';
export type BackgroundVariant = 'plain' | 'dot-grid' | 'cross-grid' | 'scanlines';
export type ControlChrome = 'glass' | 'solid' | 'line';

export interface AccentPoint {
  hue: number;
  lightness: number;
  chroma: number;
  opacity: number;
}

export interface SurfaceScale {
  shell: AccentPoint;
  panel: AccentPoint;
  rail: AccentPoint;
  surface: AccentPoint;
}

export interface SurfaceSettings {
  dark: SurfaceScale;
  light: SurfaceScale;
}

export interface BackgroundSettings {
  dark: AccentPoint;
  light: AccentPoint;
  variant: BackgroundVariant;
  dotColor: number;
  dotOpacity: number;
  gridSize: number;
  glowOpacity: number;
  scanlineOpacity: number;
}

export interface FontOption {
  id: string;
  label: string;
  cssValue: string;
  category: 'sans' | 'mono';
  preview: string;
}

export interface FontFamilyProfile {
  sizeAdjust: number;
  weightAdjust: number;
  trackingAdjust: number;
  leadingAdjust: number;
}

export interface TypographySettings {
  ui: string;
  display: string;
  label: string;
  mono: string;
  size: number;
  weight: number;
  profiles: Record<FontRole, FontFamilyProfile>;
}

export interface RadiusSettings {
  shell: number;
  panel: number;
  control: number;
  pill: number;
}

export interface ShellSettings {
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

export interface ControlSettings {
  chrome: ControlChrome;
}

export interface StudioTheme {
  mode: ThemeMode;
  accent: AccentPoint;
  graphs: AccentPoint[];
  surfaces: SurfaceSettings;
  background: BackgroundSettings;
  typography: TypographySettings;
  radii: RadiusSettings;
  shell: ShellSettings;
  controls: ControlSettings;
}

export interface SurfacePreset {
  id: string;
  label: string;
  description: string;
  surfaces: SurfaceSettings;
}

export interface ThemeTemplate {
  id: string;
  label: string;
  description: string;
  theme: StudioTheme;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'work-sans',
    label: 'Work Sans',
    cssValue: "'Work Sans', sans-serif",
    category: 'sans',
    preview: 'Friendly UI texture with newsroom discipline.',
  },
  {
    id: 'manrope',
    label: 'Manrope',
    cssValue: "'Manrope', sans-serif",
    category: 'sans',
    preview: 'Soft geometry with strong dashboard legibility.',
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    cssValue: "'Space Grotesk', sans-serif",
    category: 'sans',
    preview: 'Sharper sci-tech voice for visible headings.',
  },
  {
    id: 'plus-jakarta-sans',
    label: 'Plus Jakarta Sans',
    cssValue: "'Plus Jakarta Sans', sans-serif",
    category: 'sans',
    preview: 'Modern editorial polish without losing precision.',
  },
  {
    id: 'public-sans',
    label: 'Public Sans',
    cssValue: "'Public Sans', sans-serif",
    category: 'sans',
    preview: 'Institutional and calm for research-heavy workflows.',
  },
  {
    id: 'ibm-plex-sans',
    label: 'IBM Plex Sans',
    cssValue: "'IBM Plex Sans', sans-serif",
    category: 'sans',
    preview: 'Technical, grounded, and quietly industrial.',
  },
  {
    id: 'inter',
    label: 'Inter',
    cssValue: "'Inter', sans-serif",
    category: 'sans',
    preview: 'Neutral, stable, and versatile across product UI.',
  },
  {
    id: 'sora',
    label: 'Sora',
    cssValue: "'Sora', sans-serif",
    category: 'sans',
    preview: 'Compact futurism with high-impact titles.',
  },
  {
    id: 'archivo',
    label: 'Archivo',
    cssValue: "'Archivo', sans-serif",
    category: 'sans',
    preview: 'Industrial sans with disciplined uppercase forms.',
  },
  {
    id: 'instrument-sans',
    label: 'Instrument Sans',
    cssValue: "'Instrument Sans', sans-serif",
    category: 'sans',
    preview: 'Quiet modernism with restrained character.',
  },
  {
    id: 'ibm-plex-mono',
    label: 'IBM Plex Mono',
    cssValue: "'IBM Plex Mono', monospace",
    category: 'mono',
    preview: 'Control-room labeling with crisp structure.',
  },
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    cssValue: "'JetBrains Mono', monospace",
    category: 'mono',
    preview: 'Dense signal readouts and dependable code texture.',
  },
  {
    id: 'space-mono',
    label: 'Space Mono',
    cssValue: "'Space Mono', monospace",
    category: 'mono',
    preview: 'Retro terminal flavor for loud metadata.',
  },
  {
    id: 'source-code-pro',
    label: 'Source Code Pro',
    cssValue: "'Source Code Pro', monospace",
    category: 'mono',
    preview: 'Readable long-form data and evidence listings.',
  },
  {
    id: 'azeret-mono',
    label: 'Azeret Mono',
    cssValue: "'Azeret Mono', monospace",
    category: 'mono',
    preview: 'Angular monospace for highly visible labels and telemetry.',
  },
];

export const FONT_ROLE_LABELS: Record<FontRole, string> = {
  ui: 'Body',
  display: 'Display',
  label: 'Labels',
  mono: 'Data Text',
};

export const SURFACE_PRESETS: SurfacePreset[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Balanced dark chrome with a warm paper light mode.',
    surfaces: {
      dark: {
        shell: { hue: 0, lightness: 0, chroma: 0, opacity: 1 },
        panel: { hue: 286, lightness: 0.141, chroma: 0.004, opacity: 1 },
        rail: { hue: 0, lightness: 0, chroma: 0, opacity: 1 },
        surface: { hue: 286, lightness: 0.21, chroma: 0.006, opacity: 1 },
      },
      light: {
        shell: { hue: 85, lightness: 0.88, chroma: 0.002, opacity: 1 },
        panel: { hue: 85, lightness: 0.9, chroma: 0.004, opacity: 1 },
        rail: { hue: 85, lightness: 0.88, chroma: 0.002, opacity: 1 },
        surface: { hue: 81, lightness: 0.975, chroma: 0.004, opacity: 1 },
      },
    },
  },
  {
    id: 'graphite',
    label: 'Graphite',
    description: 'Neutral dark chrome with restrained daylight surfaces.',
    surfaces: {
      dark: {
        shell: { hue: 220, lightness: 0.01, chroma: 0.004, opacity: 1 },
        panel: { hue: 228, lightness: 0.125, chroma: 0.01, opacity: 1 },
        rail: { hue: 220, lightness: 0.01, chroma: 0.004, opacity: 1 },
        surface: { hue: 232, lightness: 0.205, chroma: 0.012, opacity: 1 },
      },
      light: {
        shell: { hue: 220, lightness: 0.95, chroma: 0.01, opacity: 1 },
        panel: { hue: 220, lightness: 0.965, chroma: 0.012, opacity: 1 },
        rail: { hue: 220, lightness: 0.95, chroma: 0.01, opacity: 1 },
        surface: { hue: 218, lightness: 0.905, chroma: 0.016, opacity: 1 },
      },
    },
  },
  {
    id: 'cobalt',
    label: 'Cobalt',
    description: 'Cool signal-room surfaces with a crisp brighter stack.',
    surfaces: {
      dark: {
        shell: { hue: 236, lightness: 0.02, chroma: 0.02, opacity: 1 },
        panel: { hue: 244, lightness: 0.13, chroma: 0.028, opacity: 1 },
        rail: { hue: 236, lightness: 0.02, chroma: 0.02, opacity: 1 },
        surface: { hue: 248, lightness: 0.215, chroma: 0.034, opacity: 1 },
      },
      light: {
        shell: { hue: 220, lightness: 0.94, chroma: 0.03, opacity: 1 },
        panel: { hue: 224, lightness: 0.965, chroma: 0.034, opacity: 1 },
        rail: { hue: 220, lightness: 0.94, chroma: 0.03, opacity: 1 },
        surface: { hue: 220, lightness: 0.9, chroma: 0.045, opacity: 1 },
      },
    },
  },
  {
    id: 'ember',
    label: 'Ember',
    description: 'Warm control-room surfaces with richer bronze highlights.',
    surfaces: {
      dark: {
        shell: { hue: 18, lightness: 0.01, chroma: 0.01, opacity: 1 },
        panel: { hue: 28, lightness: 0.13, chroma: 0.02, opacity: 1 },
        rail: { hue: 18, lightness: 0.01, chroma: 0.01, opacity: 1 },
        surface: { hue: 32, lightness: 0.215, chroma: 0.028, opacity: 1 },
      },
      light: {
        shell: { hue: 74, lightness: 0.94, chroma: 0.03, opacity: 1 },
        panel: { hue: 70, lightness: 0.962, chroma: 0.032, opacity: 1 },
        rail: { hue: 74, lightness: 0.94, chroma: 0.03, opacity: 1 },
        surface: { hue: 64, lightness: 0.9, chroma: 0.04, opacity: 1 },
      },
    },
  },
  {
    id: 'terminal',
    label: 'Terminal',
    description: 'Slight phosphor lean with higher separation in both modes.',
    surfaces: {
      dark: {
        shell: { hue: 145, lightness: 0, chroma: 0.01, opacity: 1 },
        panel: { hue: 150, lightness: 0.12, chroma: 0.024, opacity: 1 },
        rail: { hue: 145, lightness: 0, chroma: 0.01, opacity: 1 },
        surface: { hue: 154, lightness: 0.205, chroma: 0.032, opacity: 1 },
      },
      light: {
        shell: { hue: 98, lightness: 0.935, chroma: 0.03, opacity: 1 },
        panel: { hue: 102, lightness: 0.958, chroma: 0.034, opacity: 1 },
        rail: { hue: 98, lightness: 0.935, chroma: 0.03, opacity: 1 },
        surface: { hue: 104, lightness: 0.885, chroma: 0.044, opacity: 1 },
      },
    },
  },
  {
    id: 'archive',
    label: 'Archive',
    description: 'Muted ink-on-paper palette with softer daylight warmth.',
    surfaces: {
      dark: {
        shell: { hue: 32, lightness: 0.005, chroma: 0.004, opacity: 1 },
        panel: { hue: 34, lightness: 0.12, chroma: 0.012, opacity: 1 },
        rail: { hue: 32, lightness: 0.005, chroma: 0.004, opacity: 1 },
        surface: { hue: 38, lightness: 0.19, chroma: 0.015, opacity: 1 },
      },
      light: {
        shell: { hue: 82, lightness: 0.955, chroma: 0.02, opacity: 1 },
        panel: { hue: 80, lightness: 0.972, chroma: 0.022, opacity: 1 },
        rail: { hue: 82, lightness: 0.955, chroma: 0.02, opacity: 1 },
        surface: { hue: 76, lightness: 0.91, chroma: 0.028, opacity: 1 },
      },
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Ultra-dark navy surfaces with a crystalline daylight mode.',
    surfaces: {
      dark: {
        shell: { hue: 232, lightness: 0.005, chroma: 0.015, opacity: 1 },
        panel: { hue: 232, lightness: 0.08, chroma: 0.02, opacity: 1 },
        rail: { hue: 232, lightness: 0.005, chroma: 0.015, opacity: 1 },
        surface: { hue: 232, lightness: 0.16, chroma: 0.025, opacity: 1 },
      },
      light: {
        shell: { hue: 232, lightness: 0.94, chroma: 0.015, opacity: 1 },
        panel: { hue: 232, lightness: 0.965, chroma: 0.02, opacity: 1 },
        rail: { hue: 232, lightness: 0.94, chroma: 0.015, opacity: 1 },
        surface: { hue: 232, lightness: 0.895, chroma: 0.025, opacity: 1 },
      },
    },
  },
  {
    id: 'crimson',
    label: 'Crimson',
    description: 'Deep burgundy dark chrome with a blush light mode.',
    surfaces: {
      dark: {
        shell: { hue: 350, lightness: 0.005, chroma: 0.01, opacity: 1 },
        panel: { hue: 350, lightness: 0.1, chroma: 0.015, opacity: 1 },
        rail: { hue: 350, lightness: 0.005, chroma: 0.01, opacity: 1 },
        surface: { hue: 350, lightness: 0.18, chroma: 0.02, opacity: 1 },
      },
      light: {
        shell: { hue: 350, lightness: 0.945, chroma: 0.015, opacity: 1 },
        panel: { hue: 350, lightness: 0.965, chroma: 0.02, opacity: 1 },
        rail: { hue: 350, lightness: 0.945, chroma: 0.015, opacity: 1 },
        surface: { hue: 350, lightness: 0.9, chroma: 0.025, opacity: 1 },
      },
    },
  },
];

export const BACKGROUND_VARIANTS: Array<{
  id: BackgroundVariant;
  label: string;
  description: string;
}> = [
  {
    id: 'plain',
    label: 'Plain',
    description: 'No grid, just the shell and surfaces.',
  },
  {
    id: 'dot-grid',
    label: 'Dot Grid',
    description: 'Direct carry-forward of the system workspace field.',
  },
  {
    id: 'cross-grid',
    label: 'Cross Grid',
    description: 'A cleaner linear grid for layout-heavy tuning.',
  },
  {
    id: 'scanlines',
    label: 'Scanlines',
    description: 'The CRT-style layer, canonized into the background system.',
  },
];

const createDefaultProfiles = (): Record<FontRole, FontFamilyProfile> => ({
  ui: {
    sizeAdjust: -0.1,
    weightAdjust: -140,
    trackingAdjust: 0,
    leadingAdjust: 0,
  },
  display: {
    sizeAdjust: 0,
    weightAdjust: 0,
    trackingAdjust: 0,
    leadingAdjust: 0,
  },
  label: {
    sizeAdjust: 0,
    weightAdjust: 0,
    trackingAdjust: 0,
    leadingAdjust: 0,
  },
  mono: {
    sizeAdjust: -0.1,
    weightAdjust: -100,
    trackingAdjust: 0,
    leadingAdjust: -0.1,
  },
});

export const createDefaultGraphs = (accent: AccentPoint): AccentPoint[] => [
  { hue: (accent.hue + 45) % 360, lightness: accent.lightness, chroma: accent.chroma, opacity: 1 },
  { hue: (accent.hue + 160) % 360, lightness: accent.lightness, chroma: accent.chroma, opacity: 1 },
  { hue: (accent.hue + 210) % 360, lightness: accent.lightness, chroma: accent.chroma, opacity: 1 },
  { hue: (accent.hue + 280) % 360, lightness: accent.lightness, chroma: accent.chroma, opacity: 1 },
];

const BLUEBERRY_THEME: StudioTheme = {
  mode: 'dark',
  accent: { hue: 293, lightness: 0.555, chroma: 0.098, opacity: 1 },
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
    light: SURFACE_PRESETS.find((p) => p.id === 'ember')!.surfaces.light,
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
    profiles: createDefaultProfiles(),
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

const DEFAULT_THEME_DARK_SURFACES = SURFACE_PRESETS.find((p) => p.id === 'midnight')!.surfaces.dark;

export const THEME_TEMPLATES: ThemeTemplate[] = [
  {
    id: 'blueberry',
    label: 'Blueberry',
    description: 'Your exported blueberry theme, preserved as-is for the full-theme picker.',
    theme: BLUEBERRY_THEME,
  },
];

export const DEFAULT_THEME: StudioTheme = {
  ...BLUEBERRY_THEME,
  surfaces: {
    dark: DEFAULT_THEME_DARK_SURFACES,
    light: BLUEBERRY_THEME.surfaces.light,
  },
  background: {
    ...BLUEBERRY_THEME.background,
    dark: { ...DEFAULT_THEME_DARK_SURFACES.shell },
  },
};

export const getFontOption = (id: string): FontOption =>
  FONT_OPTIONS.find((font) => font.id === id) ?? FONT_OPTIONS[0];

export const getFontOptionsForRole = (role: FontRole): FontOption[] => {
  if (role === 'mono') {
    return FONT_OPTIONS.filter((font) => font.category === 'mono');
  }

  if (role === 'label') {
    return FONT_OPTIONS.filter(
      (font) =>
        font.id === 'space-grotesk' ||
        font.id === 'ibm-plex-sans' ||
        font.id === 'public-sans' ||
        font.id === 'ibm-plex-mono' ||
        font.id === 'jetbrains-mono' ||
        font.id === 'azeret-mono'
    );
  }

  return FONT_OPTIONS.filter((font) => font.category === 'sans');
};

export const getSelectedFontIds = (theme: StudioTheme): string[] =>
  Array.from(
    new Set([
      theme.typography.ui,
      theme.typography.display,
      theme.typography.label,
      theme.typography.mono,
    ])
  );

export const cloneTheme = (theme: StudioTheme): StudioTheme => ({
  mode: theme.mode,
  accent: { ...theme.accent },
  graphs: theme.graphs
    ? theme.graphs.map((g) => ({ ...g }))
    : createDefaultGraphs(theme.accent),
  surfaces: {
    dark: {
      shell: { ...theme.surfaces.dark.shell },
      panel: { ...theme.surfaces.dark.panel },
      rail: { ...theme.surfaces.dark.rail },
      surface: { ...theme.surfaces.dark.surface },
    },
    light: {
      shell: { ...theme.surfaces.light.shell },
      panel: { ...theme.surfaces.light.panel },
      rail: { ...theme.surfaces.light.rail },
      surface: { ...theme.surfaces.light.surface },
    },
  },
  background: {
    dark: { ...theme.background.dark },
    light: { ...theme.background.light },
    variant: theme.background.variant,
    dotColor: theme.background.dotColor,
    dotOpacity: theme.background.dotOpacity,
    gridSize: theme.background.gridSize,
    glowOpacity: theme.background.glowOpacity,
    scanlineOpacity: theme.background.scanlineOpacity,
  },
  typography: {
    ...theme.typography,
    profiles: Object.fromEntries(
      Object.entries(theme.typography.profiles).map(([role, profile]) => [
        role,
        { ...profile },
      ])
    ) as Record<FontRole, FontFamilyProfile>,
  },
  radii: { ...theme.radii },
  shell: { ...theme.shell },
  controls: { ...theme.controls },
});
