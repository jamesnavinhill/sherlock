import type { SherlockTheme, SherlockThemeMode } from '@/system/theme/schema';
import type { ThemeBackgroundField } from './shared';

export type ThemeBackgroundNumericField = Exclude<ThemeBackgroundField, 'variant'>;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const roundHue = (value: number) => ((Math.round(value) % 360) + 360) % 360;

const roundFixed = (value: number) => Number(value.toFixed(3));

const resolveBackgroundFieldValue = (field: ThemeBackgroundNumericField, rawValue: number) => {
  if (field === 'hue') {
    return roundHue(rawValue);
  }

  if (field === 'dotColor' || field === 'gridSize') {
    return Math.round(rawValue);
  }

  if (field === 'opacity' || field === 'dotOpacity' || field === 'glowOpacity' || field === 'scanlineOpacity') {
    return clamp(roundFixed(rawValue), 0, 1);
  }

  if (field === 'chroma') {
    return clamp(roundFixed(rawValue), 0, 0.12);
  }

  return clamp(roundFixed(rawValue), 0, 1);
};

export const updateThemeBackgroundField = (input: {
  field: ThemeBackgroundNumericField;
  mode: SherlockThemeMode;
  rawValue: number;
  theme: SherlockTheme;
}): SherlockTheme => ({
  ...input.theme,
  background: {
    ...input.theme.background,
    [input.mode]: {
      ...input.theme.background[input.mode],
      [input.field]: resolveBackgroundFieldValue(input.field, input.rawValue),
    },
  },
});
