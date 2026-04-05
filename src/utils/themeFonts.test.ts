import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME_FONT_SETTINGS,
  buildThemeFontCssVars,
  parseThemeFontSettings,
} from './themeFonts';

describe('themeFonts', () => {
  it('accepts valid stored font settings', () => {
    expect(
      parseThemeFontSettings({
        ui: 'inter',
        display: 'space-grotesk',
        label: 'ibm-plex-mono',
        mono: 'jetbrains-mono',
      })
    ).toEqual({
      ui: 'inter',
      display: 'space-grotesk',
      label: 'ibm-plex-mono',
      mono: 'jetbrains-mono',
    });
  });

  it('rejects invalid mono selections', () => {
    expect(
      parseThemeFontSettings({
        ui: 'inter',
        display: 'space-grotesk',
        label: 'ibm-plex-mono',
        mono: 'inter',
      })
    ).toBeNull();
  });

  it('builds css vars for runtime application', () => {
    expect(buildThemeFontCssVars(DEFAULT_THEME_FONT_SETTINGS)).toMatchObject({
      '--font-sans': "'Inter', sans-serif",
      '--font-display': "'Space Grotesk', sans-serif",
      '--font-label': "'IBM Plex Mono', monospace",
      '--font-mono': "'JetBrains Mono', monospace",
    });
  });
});
