import { describe, expect, it } from 'vitest';

import { getRailAccordionClassName } from './chrome';

describe('getRailAccordionClassName', () => {
  it('anchors the last collapsed section when every section is closed', () => {
    expect(
      getRailAccordionClassName({
        hasOpenSection: false,
        isLast: true,
        isOpen: false,
      })
    ).toBe('mb-0 flex min-h-0 flex-1 flex-col justify-end');
  });

  it('keeps closed non-terminal sections compact and open sections flexible', () => {
    expect(
      getRailAccordionClassName({
        hasOpenSection: false,
        isLast: false,
        isOpen: false,
      })
    ).toBe('mb-0 shrink-0');

    expect(
      getRailAccordionClassName({
        hasOpenSection: true,
        isLast: true,
        isOpen: false,
      })
    ).toBe('mb-0 shrink-0');

    expect(
      getRailAccordionClassName({
        hasOpenSection: true,
        isLast: false,
        isOpen: true,
      })
    ).toBe('mb-0 flex min-h-0 flex-1 flex-col');
  });
});
