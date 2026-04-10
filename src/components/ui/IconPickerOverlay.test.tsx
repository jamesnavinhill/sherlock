import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IconPickerOverlay } from './IconPickerOverlay';

const hasScrollableAncestor = (element: HTMLElement | null): boolean => {
  let current = element?.parentElement ?? null;
  while (current) {
    if (current.className.includes('overflow-y-auto')) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
};

describe('IconPickerOverlay', () => {
  it('surfaces pack filters and pack-aware search', () => {
    render(
      <IconPickerOverlay
        isOpen
        title="Workspace Icon"
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole('searchbox', { name: 'Search icons' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tabler' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pixel Art' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pixel Art' }));

    expect(
      screen.getByRole('button', { name: 'Select Robot Face icon from Pixel Art' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Select Shield Lock icon from Tabler' })
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search icons' }), {
      target: { value: 'script' },
    });

    expect(
      screen.getByRole('button', { name: 'Select Script Text icon from Pixel Art' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Select Robot Face icon from Pixel Art' })
    ).not.toBeInTheDocument();
  });

  it('keeps the picker content inside a scrollable modal body', () => {
    render(
      <IconPickerOverlay
        isOpen
        title="Workspace Icon"
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    expect(hasScrollableAncestor(screen.getByRole('searchbox', { name: 'Search icons' }))).toBe(true);
  });
});
