export interface AccentSettings {
  hue: number;
  lightness: number;
  chroma: number;
}

export const DEFAULT_ACCENT_SETTINGS: AccentSettings = {
  hue: 160,
  lightness: 0.75,
  chroma: 0.15,
};

export const buildAccentColor = ({ hue, lightness, chroma }: AccentSettings): string =>
  `oklch(${lightness} ${chroma} ${hue})`;

export const parseOklch = (value: string): AccentSettings | null => {
  const match = value.match(/oklch\(\s*([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s*\)/i);
  if (!match) return null;

  const lightness = Number(match[1]);
  const chroma = Number(match[2]);
  const hue = Number(match[3]);

  if ([lightness, chroma, hue].some((value) => Number.isNaN(value))) {
    return null;
  }

  return { hue, lightness, chroma };
};