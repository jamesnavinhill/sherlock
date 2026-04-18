export interface AccentSettings {
  hue: number;
  lightness: number;
  chroma: number;
}

export type AccentColorPoint = AccentSettings & { opacity?: number };

export const DEFAULT_ACCENT_SETTINGS: AccentSettings = {
  hue: 340,
  lightness: 0.57,
  chroma: 0.09,
};

export const buildAccentColor = ({ hue, lightness, chroma, opacity }: AccentColorPoint): string => {
  const base = `${lightness} ${chroma} ${hue}`;
  if (typeof opacity === 'number' && opacity < 1) {
    return `oklch(${base} / ${opacity})`;
  }
  return `oklch(${base})`;
};

export const parseOklch = (value: string): AccentSettings | null => {
  const match = value.match(
    /oklch\(\s*([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s*\)/i
  );
  if (!match) return null;

  const lightness = Number(match[1]);
  const chroma = Number(match[2]);
  const hue = Number(match[3]);

  if ([lightness, chroma, hue].some((value) => Number.isNaN(value))) {
    return null;
  }

  return { hue, lightness, chroma };
};
