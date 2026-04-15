import { describe, expect, it } from 'vitest';

import { getRailAccordionClassName } from './chrome';

describe('getRailAccordionClassName', () => {
  it('keeps closed sections compact and open sections flexible', () => {
    expect(getRailAccordionClassName({ isOpen: false })).toBe('mb-0 shrink-0');
    expect(getRailAccordionClassName({ isOpen: true })).toBe('mb-0 flex min-h-0 flex-1 flex-col');
  });
});
