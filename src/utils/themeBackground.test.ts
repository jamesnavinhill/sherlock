import { describe, expect, it } from 'vitest';

import {
  DEFAULT_THEME_BACKGROUND_SETTINGS,
  buildThemeBackgroundCssVars,
  buildThemeBackgroundImage,
  parseThemeBackgroundSettings,
} from './themeBackground';

describe('themeBackground', () => {
  it('parses and clamps valid settings', () => {
    expect(
      parseThemeBackgroundSettings({
        variant: 'grid',
        dotColor: 144,
        dotOpacity: 1.4,
      })
    ).toEqual({
      variant: 'grid',
      dotColor: 100,
      dotOpacity: 1,
    });
  });

  it('rejects invalid settings', () => {
    expect(parseThemeBackgroundSettings({ variant: 'noise' })).toBeNull();
  });

  it('builds css vars for plain and grid backgrounds', () => {
    expect(buildThemeBackgroundImage(DEFAULT_THEME_BACKGROUND_SETTINGS)).toContain(
      'radial-gradient('
    );
    expect(
      buildThemeBackgroundCssVars({
        variant: 'plain',
        dotColor: 26,
        dotOpacity: 0.2,
      })
    ).toMatchObject({
      '--osint-main-bg-image': 'none',
      '--osint-main-bg-dot-opacity': '0.2',
    });
  });
});
