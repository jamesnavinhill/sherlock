import type { GraphNodeSubtype } from '../types';
import type { AccentSettings } from './accent';
import { buildAccentColor } from './accent';

export type EntityTone = 'person' | 'organization' | 'concept' | 'source' | 'unknown';

const wrapHue = (value: number): number => {
  const wrapped = value % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const createShiftedAccent = (
  accent: AccentSettings,
  hueOffset: number,
  overrides?: Partial<AccentSettings>
): AccentSettings => ({
  hue: wrapHue(accent.hue + hueOffset),
  lightness: overrides?.lightness ?? clamp(accent.lightness, 0.58, 0.72),
  chroma: overrides?.chroma ?? clamp(accent.chroma, 0.1, 0.18),
});

export const getEntityTone = (type?: string | null): EntityTone => {
  switch (type as GraphNodeSubtype | undefined) {
    case 'PERSON':
      return 'person';
    case 'ORGANIZATION':
      return 'organization';
    case 'CONCEPT':
      return 'concept';
    case 'SOURCE':
      return 'source';
    default:
      return 'unknown';
  }
};

export const getEntityToneClass = (type?: string | null): string =>
  `entity-tone-${getEntityTone(type)}`;

export const getEntityToneCssVar = (type?: string | null): string =>
  `var(--entity-${getEntityTone(type)})`;

export const buildEntityPaletteCssVars = (accent: AccentSettings): Record<string, string> => ({
  '--entity-person': buildAccentColor(createShiftedAccent(accent, -28)),
  '--entity-organization': buildAccentColor(createShiftedAccent(accent, 36)),
  '--entity-concept': buildAccentColor(createShiftedAccent(accent, 84)),
  '--entity-source': buildAccentColor(createShiftedAccent(accent, 156)),
  '--entity-unknown': buildAccentColor(
    createShiftedAccent(accent, 0, {
      lightness: clamp(accent.lightness + 0.04, 0.62, 0.78),
      chroma: clamp(accent.chroma * 0.18, 0.01, 0.03),
    })
  ),
});
