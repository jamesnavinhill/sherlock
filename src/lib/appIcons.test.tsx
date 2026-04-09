import { describe, expect, it } from 'vitest';

import { buildAppIconSvgDataUrl, resolveAppIconColor } from './appIcons';

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
});
