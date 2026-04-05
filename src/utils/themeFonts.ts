export type ThemeFontRole = 'ui' | 'display' | 'label' | 'mono';

export interface ThemeFontOption {
  id: string;
  label: string;
  cssValue: string;
  category: 'sans' | 'mono';
  preview: string;
}

export interface ThemeFontSettings {
  ui: string;
  display: string;
  label: string;
  mono: string;
}

export const THEME_FONT_OPTIONS: ThemeFontOption[] = [
  {
    id: 'inter',
    label: 'Inter',
    cssValue: "'Inter', sans-serif",
    category: 'sans',
    preview: 'Operational clarity with clean neutral rhythm.',
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
    preview: 'A sharper sci-tech voice for visible headings.',
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
    id: 'sora',
    label: 'Sora',
    cssValue: "'Sora', sans-serif",
    category: 'sans',
    preview: 'Compact futurism with high-impact titles.',
  },
  {
    id: 'work-sans',
    label: 'Work Sans',
    cssValue: "'Work Sans', sans-serif",
    category: 'sans',
    preview: 'Friendly UI text with newsroom energy.',
  },
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    cssValue: "'JetBrains Mono', monospace",
    category: 'mono',
    preview: 'Dense signal readouts and dependable code texture.',
  },
  {
    id: 'ibm-plex-mono',
    label: 'IBM Plex Mono',
    cssValue: "'IBM Plex Mono', monospace",
    category: 'mono',
    preview: 'Control-room labeling with crisp structure.',
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
];

export const DEFAULT_THEME_FONT_SETTINGS: ThemeFontSettings = {
  ui: 'inter',
  display: 'space-grotesk',
  label: 'ibm-plex-mono',
  mono: 'jetbrains-mono',
};

const FONT_OPTION_IDS = new Set(THEME_FONT_OPTIONS.map((option) => option.id));

export const getThemeFontOption = (id: string): ThemeFontOption =>
  THEME_FONT_OPTIONS.find((option) => option.id === id) ||
  THEME_FONT_OPTIONS.find((option) => option.id === DEFAULT_THEME_FONT_SETTINGS.ui) ||
  THEME_FONT_OPTIONS[0];

export const getThemeFontOptionsForRole = (role: ThemeFontRole): ThemeFontOption[] => {
  if (role === 'mono') {
    return THEME_FONT_OPTIONS.filter((option) => option.category === 'mono');
  }

  if (role === 'label') {
    return THEME_FONT_OPTIONS.filter(
      (option) =>
        option.id === 'space-grotesk' ||
        option.id === 'ibm-plex-sans' ||
        option.id === 'jetbrains-mono' ||
        option.id === 'ibm-plex-mono' ||
        option.id === 'space-mono' ||
        option.id === 'public-sans'
    );
  }

  return THEME_FONT_OPTIONS.filter((option) => option.category === 'sans');
};

export const parseThemeFontSettings = (value: unknown): ThemeFontSettings | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<Record<keyof ThemeFontSettings, unknown>>;

  if (
    typeof candidate.ui !== 'string' ||
    typeof candidate.display !== 'string' ||
    typeof candidate.label !== 'string' ||
    typeof candidate.mono !== 'string'
  ) {
    return null;
  }

  if (
    !FONT_OPTION_IDS.has(candidate.ui) ||
    !FONT_OPTION_IDS.has(candidate.display) ||
    !FONT_OPTION_IDS.has(candidate.label) ||
    !FONT_OPTION_IDS.has(candidate.mono)
  ) {
    return null;
  }

  if (getThemeFontOption(candidate.mono).category !== 'mono') {
    return null;
  }

  return {
    ui: candidate.ui,
    display: candidate.display,
    label: candidate.label,
    mono: candidate.mono,
  };
};

export const buildThemeFontCssVars = (
  settings: ThemeFontSettings
): Record<string, string> => ({
  '--font-sans': getThemeFontOption(settings.ui).cssValue,
  '--font-display': getThemeFontOption(settings.display).cssValue,
  '--font-label': getThemeFontOption(settings.label).cssValue,
  '--font-mono': getThemeFontOption(settings.mono).cssValue,
});
