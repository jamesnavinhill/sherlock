import { describe, expect, it } from 'vitest';

import { createInitialThemeWorkspace } from '@/system/theme/schema';
import {
  exportSherlockThemeJson,
  getActiveDraftTheme,
  updateActiveDraftTheme,
} from '@/system/theme/storage';
import { updateThemeBackgroundField } from './backgroundState';

describe('theme workbench background state helper', () => {
  it('writes grid and pattern fields into the active mode branch only', () => {
    const initialWorkspace = createInitialThemeWorkspace();
    const initialTheme = getActiveDraftTheme(initialWorkspace);
    const initialLight = initialTheme.background.light;

    const nextWorkspace = updateActiveDraftTheme(initialWorkspace, (theme) =>
      updateThemeBackgroundField({
        theme,
        mode: 'dark',
        field: 'dotColor',
        rawValue: 41.6,
      })
    );

    const nextTheme = getActiveDraftTheme(nextWorkspace);

    expect(nextTheme.background.dark.dotColor).toBe(42);
    expect(nextTheme.background.light).toEqual(initialLight);
    expect(Object.prototype.hasOwnProperty.call(nextTheme.background, 'dotColor')).toBe(false);
  });

  it('clamps numeric fields to the valid background ranges', () => {
    const initialTheme = getActiveDraftTheme(createInitialThemeWorkspace());

    const nextTheme = updateThemeBackgroundField({
      theme: updateThemeBackgroundField({
        theme: updateThemeBackgroundField({
          theme: initialTheme,
          mode: 'light',
          field: 'hue',
          rawValue: 721,
        }),
        mode: 'light',
        field: 'chroma',
        rawValue: 0.5,
      }),
      mode: 'light',
      field: 'dotOpacity',
      rawValue: 1.5,
    });

    expect(nextTheme.background.light.hue).toBe(1);
    expect(nextTheme.background.light.chroma).toBe(0.12);
    expect(nextTheme.background.light.dotOpacity).toBe(1);
  });

  it('preserves updated mode-scoped background fields in exported theme json', () => {
    const nextWorkspace = updateActiveDraftTheme(createInitialThemeWorkspace(), (theme) =>
      updateThemeBackgroundField({
        theme,
        mode: 'dark',
        field: 'gridSize',
        rawValue: 33.2,
      })
    );

    const exported = JSON.parse(exportSherlockThemeJson(getActiveDraftTheme(nextWorkspace))) as {
      background: {
        dark: { gridSize: number };
        light: { gridSize: number };
      };
    };

    expect(exported.background.dark.gridSize).toBe(33);
    expect(exported.background.light.gridSize).toBe(
      getActiveDraftTheme(createInitialThemeWorkspace()).background.light.gridSize
    );
  });
});
