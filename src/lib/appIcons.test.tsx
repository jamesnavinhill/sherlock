import { describe, expect, it } from 'vitest';
import {
  APP_ICON_OPTIONS,
  buildAppIconSvgDataUrl,
  getAppIconPack,
  isAppIconId,
  resolveAppIconColor,
} from './appIcons';

describe('appIcons', () => {
  it('resolves css variable colors before generating icon svg data urls', () => {
    document.documentElement.style.setProperty('--entity-person', '#38bdf8');
    document.documentElement.style.setProperty('--osint-dark', '#09090b');

    expect(resolveAppIconColor('var(--entity-person)')).toBe('#38bdf8');
    expect(
      resolveAppIconColor('color-mix(in oklab, var(--entity-person) 28%, var(--osint-dark))')
    ).toBe('color-mix(in oklab, #38bdf8 28%, #09090b)');

    const dataUrl = buildAppIconSvgDataUrl('user', {
      color: 'var(--entity-person)',
      size: 24,
      strokeWidth: 1.9,
    });
    const svgMarkup = decodeURIComponent(dataUrl.split(',')[1] || '');

    expect(svgMarkup).toContain('#38bdf8');
    expect(svgMarkup).not.toContain('var(--entity-person)');
  });

  it('supports icons from the new local tabler and pixel-art packs', () => {
    expect(isAppIconId('tabler:world')).toBe(true);
    expect(isAppIconId('pixel:robot')).toBe(true);
    expect(getAppIconPack('tabler:world')).toBe('tabler');
    expect(getAppIconPack('pixel:robot')).toBe('pixelart');

    const tablerMarkup = decodeURIComponent(
      buildAppIconSvgDataUrl('tabler:world', {
        color: '#f4f4f5',
        size: 24,
        strokeWidth: 1.75,
      }).split(',')[1] || ''
    );
    const pixelMarkup = decodeURIComponent(
      buildAppIconSvgDataUrl('pixel:robot', {
        color: '#f4f4f5',
        size: 24,
      }).split(',')[1] || ''
    );

    expect(tablerMarkup).toContain('<svg');
    expect(tablerMarkup).toContain('#f4f4f5');
    expect(pixelMarkup).toContain('<svg');
    expect(pixelMarkup).toContain('#f4f4f5');
  });

  it('publishes searchable option metadata for the picker', () => {
    const tablerRobot = APP_ICON_OPTIONS.find((option) => option.id === 'tabler:robot');
    const pixelRobot = APP_ICON_OPTIONS.find((option) => option.id === 'pixel:robot-face');

    expect(tablerRobot?.searchText).toContain('tabler');
    expect(tablerRobot?.searchText).toContain('agent');
    expect(pixelRobot?.searchText).toContain('pixel art');
    expect(pixelRobot?.searchText).toContain('assistant');
  });

  it('deduplicates visible picker labels within a pack', () => {
    const pixelScriptMatches = APP_ICON_OPTIONS.filter(
      (option) => option.pack === 'pixelart' && option.label === 'Script Text'
    );

    expect(pixelScriptMatches).toHaveLength(1);
  });

  it('ships the full pixel-art pack and a large tabler catalogue', () => {
    const pixelArtCount = APP_ICON_OPTIONS.filter((option) => option.pack === 'pixelart').length;
    const tablerCount = APP_ICON_OPTIONS.filter((option) => option.pack === 'tabler').length;

    expect(pixelArtCount).toBeGreaterThanOrEqual(1000);
    expect(tablerCount).toBeGreaterThanOrEqual(100);
    expect(APP_ICON_OPTIONS.some((option) => option.id === 'pixel:ai-user-circle')).toBe(true);
    expect(APP_ICON_OPTIONS.some((option) => option.id === 'tabler:timeline-event')).toBe(true);
  });
});
