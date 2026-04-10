import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME_FONT_SETTINGS,
  buildThemeFontCssVars,
  parseThemeFontSettings,
  resolveThemeFontSizes,
  resolveThemeFontWeights,
} from './themeFonts';

describe('themeFonts', () => {
  it('accepts valid stored numeric font settings', () => {
    expect(
      parseThemeFontSettings({
        ui: 'space-grotesk',
        display: 'space-grotesk',
        label: 'ibm-plex-mono',
        mono: 'ibm-plex-mono',
        size: -0.4,
        weight: 0.25,
      })
    ).toEqual({
      ui: 'space-grotesk',
      display: 'space-grotesk',
      label: 'ibm-plex-mono',
      mono: 'ibm-plex-mono',
      size: -0.4,
      weight: 0.25,
    });
  });

  it('hydrates legacy preset values into slider scales', () => {
    expect(
      parseThemeFontSettings({
        ui: 'space-grotesk',
        display: 'space-grotesk',
        label: 'ibm-plex-mono',
        mono: 'ibm-plex-mono',
        size: 'compact',
        weight: 'regular',
      })
    ).toEqual({
      ui: 'space-grotesk',
      display: 'space-grotesk',
      label: 'ibm-plex-mono',
      mono: 'ibm-plex-mono',
      size: -1,
      weight: -1,
    });
  });

  it('hydrates legacy stored font settings with compact regular defaults', () => {
    expect(
      parseThemeFontSettings({
        ui: 'space-grotesk',
        display: 'space-grotesk',
        label: 'ibm-plex-mono',
        mono: 'ibm-plex-mono',
      })
    ).toEqual({
      ui: 'space-grotesk',
      display: 'space-grotesk',
      label: 'ibm-plex-mono',
      mono: 'ibm-plex-mono',
      size: -1,
      weight: -1,
    });
  });

  it('rejects invalid mono selections', () => {
    expect(
      parseThemeFontSettings({
        ui: 'space-grotesk',
        display: 'space-grotesk',
        label: 'ibm-plex-mono',
        mono: 'inter',
      })
    ).toBeNull();
  });

  it('interpolates sizes and weights for slider positions', () => {
    expect(resolveThemeFontSizes(-1).base).toBe('0.9375rem');
    expect(resolveThemeFontSizes(0).base).toBe('1rem');
    expect(resolveThemeFontWeights(-1).bold).toBe(580);
    expect(resolveThemeFontWeights(1).bold).toBe(680);
  });

  it('builds css vars for runtime application', () => {
    expect(buildThemeFontCssVars(DEFAULT_THEME_FONT_SETTINGS)).toMatchObject({
      '--font-sans': "'Work Sans', sans-serif",
      '--font-display': "'Work Sans', sans-serif",
      '--font-label': "'IBM Plex Mono', monospace",
      '--font-mono': "'IBM Plex Mono', monospace",
      '--font-size-base': '0.9375rem',
      '--font-size-3xl': '1.85rem',
      '--font-weight-bold': '580',
      '--font-weight-display': '560',
    });
  });
});
