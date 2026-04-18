export type ThemeFontRole = 'ui' | 'display' | 'label' | 'mono';
export type ThemeFontScaleStep =
  | '2xs'
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl';

export interface ThemeFontOption {
  id: string;
  label: string;
  cssValue: string;
  category: 'sans' | 'mono';
  preview: string;
}

export interface ThemeFontWeightScale {
  medium: number;
  semibold: number;
  bold: number;
  extrabold: number;
  label: number;
  display: number;
}

export interface ThemeFontFamilyProfile {
  sizeAdjust: number;
  weightAdjust: number;
  trackingAdjust: number;
  leadingAdjust: number;
}

export type ThemeFontRoleProfiles = Record<ThemeFontRole, ThemeFontFamilyProfile>;

export interface ThemeFontSettings {
  ui: string;
  display: string;
  label: string;
  mono: string;
  size: number;
  weight: number;
  profiles: ThemeFontRoleProfiles;
}

interface ThemeFontScaleStop {
  description: string;
  id: 'compact' | 'standard' | 'large';
  label: string;
  scale: -1 | 0 | 1;
  sizes: Record<ThemeFontScaleStep, number>;
}

interface ThemeFontWeightStop {
  description: string;
  id: 'regular' | 'balanced' | 'strong';
  label: string;
  scale: -1 | 0 | 1;
  weights: ThemeFontWeightScale;
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
  {
    id: 'azeret-mono',
    label: 'Azeret Mono',
    cssValue: "'Azeret Mono', monospace",
    category: 'mono',
    preview: 'Angular monospace for highly visible labels and telemetry.',
  },
];

const THEME_FONT_SIZE_STOPS: ThemeFontScaleStop[] = [
  {
    id: 'compact',
    label: 'Compact',
    description: 'Tighter type for dense dashboards and high-volume evidence review.',
    scale: -1,
    sizes: {
      '2xs': 0.625,
      xs: 0.6875,
      sm: 0.8125,
      base: 0.9375,
      lg: 1.0625,
      xl: 1.1875,
      '2xl': 1.45,
      '3xl': 1.85,
      '4xl': 2.2,
    },
  },
  {
    id: 'standard',
    label: 'Standard',
    description: 'Balanced hierarchy for everyday investigation and reading.',
    scale: 0,
    sizes: {
      '2xs': 0.6875,
      xs: 0.75,
      sm: 0.875,
      base: 1,
      lg: 1.125,
      xl: 1.3,
      '2xl': 1.6,
      '3xl': 2,
      '4xl': 2.4,
    },
  },
  {
    id: 'large',
    label: 'Large',
    description: 'Looser hierarchy for presentation mode and long reading sessions.',
    scale: 1,
    sizes: {
      '2xs': 0.75,
      xs: 0.8125,
      sm: 0.9375,
      base: 1.0625,
      lg: 1.1875,
      xl: 1.4,
      '2xl': 1.8,
      '3xl': 2.25,
      '4xl': 2.7,
    },
  },
];

const THEME_FONT_WEIGHT_STOPS: ThemeFontWeightStop[] = [
  {
    id: 'regular',
    label: 'Regular',
    description: 'A quieter reading weight with less chrome contrast.',
    scale: -1,
    weights: {
      medium: 460,
      semibold: 520,
      bold: 580,
      extrabold: 640,
      label: 540,
      display: 560,
    },
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Default contrast tuned for the current Sherlock visual style.',
    scale: 0,
    weights: {
      medium: 500,
      semibold: 560,
      bold: 620,
      extrabold: 680,
      label: 580,
      display: 600,
    },
  },
  {
    id: 'strong',
    label: 'Strong',
    description: 'Higher-impact weights for command-center chrome and headings.',
    scale: 1,
    weights: {
      medium: 540,
      semibold: 600,
      bold: 680,
      extrabold: 740,
      label: 620,
      display: 640,
    },
  },
];

export const DEFAULT_THEME_FONT_SETTINGS: ThemeFontSettings = {
  ui: 'work-sans',
  display: 'work-sans',
  label: 'ibm-plex-mono',
  mono: 'ibm-plex-mono',
  size: -1,
  weight: -1,
  profiles: {
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
  },
};

const FONT_OPTION_IDS = new Set(THEME_FONT_OPTIONS.map((option) => option.id));
const LEGACY_SIZE_SCALE_BY_ID = Object.fromEntries(
  THEME_FONT_SIZE_STOPS.map((option) => [option.id, option.scale])
) as Record<ThemeFontScaleStop['id'], ThemeFontScaleStop['scale']>;
const LEGACY_WEIGHT_SCALE_BY_ID = Object.fromEntries(
  THEME_FONT_WEIGHT_STOPS.map((option) => [option.id, option.scale])
) as Record<ThemeFontWeightStop['id'], ThemeFontWeightStop['scale']>;

const clampThemeFontAxis = (value: number) => Math.min(1, Math.max(-1, value));
const clampThemeFontProfileValue = (value: number, min: number, max: number, digits = 3) =>
  Math.min(max, Math.max(min, Number(value.toFixed(digits))));

export const createDefaultThemeFontProfiles = (): ThemeFontRoleProfiles => ({
  ui: { ...DEFAULT_THEME_FONT_SETTINGS.profiles.ui },
  display: { ...DEFAULT_THEME_FONT_SETTINGS.profiles.display },
  label: { ...DEFAULT_THEME_FONT_SETTINGS.profiles.label },
  mono: { ...DEFAULT_THEME_FONT_SETTINGS.profiles.mono },
});

const interpolateValue = (value: number, low: number, mid: number, high: number) => {
  const clampedValue = clampThemeFontAxis(value);

  if (clampedValue <= 0) {
    return mid + (mid - low) * clampedValue;
  }

  return mid + (high - mid) * clampedValue;
};

const formatRem = (value: number) => `${Number(value.toFixed(4)).toString()}rem`;

const normalizeThemeFontSizeValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clampThemeFontAxis(Number(value.toFixed(2)));
  }

  if (typeof value === 'string' && value in LEGACY_SIZE_SCALE_BY_ID) {
    return LEGACY_SIZE_SCALE_BY_ID[value as keyof typeof LEGACY_SIZE_SCALE_BY_ID];
  }

  return null;
};

const normalizeThemeFontWeightValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clampThemeFontAxis(Number(value.toFixed(2)));
  }

  if (typeof value === 'string' && value in LEGACY_WEIGHT_SCALE_BY_ID) {
    return LEGACY_WEIGHT_SCALE_BY_ID[value as keyof typeof LEGACY_WEIGHT_SCALE_BY_ID];
  }

  return null;
};

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
        option.id === 'public-sans' ||
        option.id === 'instrument-sans' ||
        option.id === 'jetbrains-mono' ||
        option.id === 'ibm-plex-mono' ||
        option.id === 'space-mono' ||
        option.id === 'azeret-mono'
    );
  }

  return THEME_FONT_OPTIONS.filter((option) => option.category === 'sans');
};

export const resolveThemeFontSizes = (value: number): Record<ThemeFontScaleStep, string> => {
  const compact = THEME_FONT_SIZE_STOPS[0].sizes;
  const standard = THEME_FONT_SIZE_STOPS[1].sizes;
  const large = THEME_FONT_SIZE_STOPS[2].sizes;

  return {
    '2xs': formatRem(interpolateValue(value, compact['2xs'], standard['2xs'], large['2xs'])),
    xs: formatRem(interpolateValue(value, compact.xs, standard.xs, large.xs)),
    sm: formatRem(interpolateValue(value, compact.sm, standard.sm, large.sm)),
    base: formatRem(interpolateValue(value, compact.base, standard.base, large.base)),
    lg: formatRem(interpolateValue(value, compact.lg, standard.lg, large.lg)),
    xl: formatRem(interpolateValue(value, compact.xl, standard.xl, large.xl)),
    '2xl': formatRem(interpolateValue(value, compact['2xl'], standard['2xl'], large['2xl'])),
    '3xl': formatRem(interpolateValue(value, compact['3xl'], standard['3xl'], large['3xl'])),
    '4xl': formatRem(interpolateValue(value, compact['4xl'], standard['4xl'], large['4xl'])),
  };
};

export const resolveThemeFontWeights = (value: number): ThemeFontWeightScale => {
  const regular = THEME_FONT_WEIGHT_STOPS[0].weights;
  const balanced = THEME_FONT_WEIGHT_STOPS[1].weights;
  const strong = THEME_FONT_WEIGHT_STOPS[2].weights;

  return {
    medium: Math.round(interpolateValue(value, regular.medium, balanced.medium, strong.medium)),
    semibold: Math.round(
      interpolateValue(value, regular.semibold, balanced.semibold, strong.semibold)
    ),
    bold: Math.round(interpolateValue(value, regular.bold, balanced.bold, strong.bold)),
    extrabold: Math.round(
      interpolateValue(value, regular.extrabold, balanced.extrabold, strong.extrabold)
    ),
    label: Math.round(interpolateValue(value, regular.label, balanced.label, strong.label)),
    display: Math.round(
      interpolateValue(value, regular.display, balanced.display, strong.display)
    ),
  };
};

const getScaleDescriptor = <T extends ThemeFontScaleStop | ThemeFontWeightStop>(
  value: number,
  stops: [T, T, T]
) => {
  const clampedValue = clampThemeFontAxis(value);

  if (clampedValue <= -0.66) return stops[0];
  if (clampedValue >= 0.66) return stops[2];

  return stops[1];
};

export const describeThemeFontSize = (value: number) =>
  getScaleDescriptor(value, [
    THEME_FONT_SIZE_STOPS[0],
    THEME_FONT_SIZE_STOPS[1],
    THEME_FONT_SIZE_STOPS[2],
  ]);

export const describeThemeFontWeight = (value: number) =>
  getScaleDescriptor(value, [
    THEME_FONT_WEIGHT_STOPS[0],
    THEME_FONT_WEIGHT_STOPS[1],
    THEME_FONT_WEIGHT_STOPS[2],
  ]);

const normalizeThemeFontProfile = (value: unknown): ThemeFontFamilyProfile | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ThemeFontFamilyProfile>;

  if (
    typeof candidate.sizeAdjust !== 'number' ||
    !Number.isFinite(candidate.sizeAdjust) ||
    typeof candidate.weightAdjust !== 'number' ||
    !Number.isFinite(candidate.weightAdjust) ||
    typeof candidate.trackingAdjust !== 'number' ||
    !Number.isFinite(candidate.trackingAdjust) ||
    typeof candidate.leadingAdjust !== 'number' ||
    !Number.isFinite(candidate.leadingAdjust)
  ) {
    return null;
  }

  return {
    sizeAdjust: clampThemeFontProfileValue(candidate.sizeAdjust, -0.2, 0.2, 2),
    weightAdjust: clampThemeFontProfileValue(candidate.weightAdjust, -140, 140, 0),
    trackingAdjust: clampThemeFontProfileValue(candidate.trackingAdjust, -0.1, 0.2, 3),
    leadingAdjust: clampThemeFontProfileValue(candidate.leadingAdjust, -0.2, 0.2, 2),
  };
};

const normalizeThemeFontProfiles = (value: unknown): ThemeFontRoleProfiles | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<Record<ThemeFontRole, unknown>>;
  const ui = normalizeThemeFontProfile(candidate.ui);
  const display = normalizeThemeFontProfile(candidate.display);
  const label = normalizeThemeFontProfile(candidate.label);
  const mono = normalizeThemeFontProfile(candidate.mono);

  if (!ui || !display || !label || !mono) {
    return null;
  }

  return {
    ui,
    display,
    label,
    mono,
  };
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

  const normalizedSize = normalizeThemeFontSizeValue(candidate.size);
  const normalizedWeight = normalizeThemeFontWeightValue(candidate.weight);
  const normalizedProfiles =
    normalizeThemeFontProfiles(candidate.profiles) ?? createDefaultThemeFontProfiles();

  if (candidate.size != null && normalizedSize == null) {
    return null;
  }

  if (candidate.weight != null && normalizedWeight == null) {
    return null;
  }

  return {
    ui: candidate.ui,
    display: candidate.display,
    label: candidate.label,
    mono: candidate.mono,
    size: normalizedSize ?? DEFAULT_THEME_FONT_SETTINGS.size,
    weight: normalizedWeight ?? DEFAULT_THEME_FONT_SETTINGS.weight,
    profiles: normalizedProfiles,
  };
};

const getRoleWeightBase = (role: ThemeFontRole, weights: ThemeFontWeightScale) => {
  if (role === 'display') return weights.display;
  if (role === 'label') return weights.label;
  return weights.medium;
};

const getRoleTrackingBase = (role: ThemeFontRole) => {
  if (role === 'display') return -0.02;
  if (role === 'label') return 0.14;
  if (role === 'mono') return 0.01;
  return -0.005;
};

const getRoleLeadingBase = (role: ThemeFontRole) => {
  if (role === 'display') return 1.08;
  if (role === 'label') return 1.2;
  return 1.6;
};

const buildThemeFontRoleVars = (
  settings: ThemeFontSettings,
  role: ThemeFontRole,
  weights: ThemeFontWeightScale
): Record<string, string> => {
  const profile = settings.profiles[role] ?? DEFAULT_THEME_FONT_SETTINGS.profiles[role];

  return {
    [`--font-${role}-scale`]: String(Number((1 + profile.sizeAdjust).toFixed(3))),
    [`--font-${role}-weight`]: String(
      Math.min(760, Math.max(360, getRoleWeightBase(role, weights) + Math.round(profile.weightAdjust)))
    ),
    [`--font-${role}-tracking`]: `${Number(
      (getRoleTrackingBase(role) + profile.trackingAdjust).toFixed(3)
    )}em`,
    [`--font-${role}-leading`]: String(
      Number((getRoleLeadingBase(role) + profile.leadingAdjust).toFixed(3))
    ),
  };
};

export const buildThemeFontCssVars = (
  settings: ThemeFontSettings
): Record<string, string> => {
  const sizes = resolveThemeFontSizes(settings.size);
  const weights = resolveThemeFontWeights(settings.weight);

  return {
    '--font-sans': getThemeFontOption(settings.ui).cssValue,
    '--font-display': getThemeFontOption(settings.display).cssValue,
    '--font-label': getThemeFontOption(settings.label).cssValue,
    '--font-mono': getThemeFontOption(settings.mono).cssValue,
    '--font-size-2xs': sizes['2xs'],
    '--font-size-xs': sizes.xs,
    '--font-size-sm': sizes.sm,
    '--font-size-base': sizes.base,
    '--font-size-lg': sizes.lg,
    '--font-size-xl': sizes.xl,
    '--font-size-2xl': sizes['2xl'],
    '--font-size-3xl': sizes['3xl'],
    '--font-size-4xl': sizes['4xl'],
    '--font-weight-medium': String(weights.medium),
    '--font-weight-semibold': String(weights.semibold),
    '--font-weight-bold': String(weights.bold),
    '--font-weight-extrabold': String(weights.extrabold),
    '--font-weight-label': String(weights.label),
    '--font-weight-display': String(weights.display),
    ...buildThemeFontRoleVars(settings, 'ui', weights),
    ...buildThemeFontRoleVars(settings, 'display', weights),
    ...buildThemeFontRoleVars(settings, 'label', weights),
    ...buildThemeFontRoleVars(settings, 'mono', weights),
  };
};
