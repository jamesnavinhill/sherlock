import type { ThemeFontFamilyProfile, ThemeFontRole } from '@/utils/themeFonts';
import type {
  SherlockTheme,
  SherlockThemeMode,
  SherlockThemeSurfaceScale,
} from '@/system/theme/schema';

export type ThemeWorkbenchTab = 'theme' | 'type' | 'shell' | 'export';
export type ThemeStructureKey = keyof SherlockThemeSurfaceScale;
export type ThemeSurfaceField = keyof SherlockThemeSurfaceScale['shell'];
export type ThemeGraphField = keyof SherlockTheme['graphs'][number];
export type ThemeBackgroundField =
  | keyof SherlockTheme['background']['dark']
  | 'dotColor'
  | 'dotOpacity'
  | 'gridSize'
  | 'glowOpacity'
  | 'scanlineOpacity';
export type ThemeFontProfileField = keyof ThemeFontFamilyProfile;

export const WORKBENCH_TABS: Array<{ id: ThemeWorkbenchTab; label: string }> = [
  { id: 'theme', label: 'Theme' },
  { id: 'type', label: 'Type' },
  { id: 'shell', label: 'Shell' },
  { id: 'export', label: 'Export' },
];

export const STRUCTURE_LABELS: Record<ThemeStructureKey, string> = {
  shell: 'Shell',
  panel: 'Panel',
  rail: 'Rail',
  surface: 'Surface',
};

export const FONT_ROLE_LABELS: Record<ThemeFontRole, string> = {
  ui: 'UI Text',
  display: 'Display',
  label: 'Labels',
  mono: 'Data Text',
};

export const THEME_FONT_ROLES: ThemeFontRole[] = ['ui', 'display', 'label', 'mono'];

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getSurfaceBounds = (mode: SherlockThemeMode, surfaceKey: ThemeStructureKey) => {
  if (mode === 'dark') {
    const lightnessRanges: Record<ThemeStructureKey, { max: number; min: number }> = {
      shell: { min: 0, max: 0.16 },
      panel: { min: 0, max: 0.24 },
      rail: { min: 0, max: 0.2 },
      surface: { min: 0, max: 0.34 },
    };

    return {
      lightnessMin: lightnessRanges[surfaceKey].min,
      lightnessMax: lightnessRanges[surfaceKey].max,
      chromaMax: 0.08,
    };
  }

  const lightnessRanges: Record<ThemeStructureKey, { max: number; min: number }> = {
    shell: { min: 0.88, max: 1 },
    panel: { min: 0.9, max: 1 },
    rail: { min: 0.88, max: 1 },
    surface: { min: 0.84, max: 0.98 },
  };

  return {
    lightnessMin: lightnessRanges[surfaceKey].min,
    lightnessMax: lightnessRanges[surfaceKey].max,
    chromaMax: 0.1,
  };
};

export const getTone = (lightness: number) =>
  lightness >= 0.72
    ? {
        borderColor: 'rgba(82, 63, 40, 0.24)',
        textColor: 'rgba(26, 22, 18, 0.84)',
      }
    : {
        borderColor: 'rgba(255, 255, 255, 0.12)',
        textColor: 'rgba(255, 255, 255, 0.84)',
      };
