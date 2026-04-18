import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DateRangePicker } from './DateRangePicker';

describe('DateRangePicker', () => {
  it('renders inline fields and normalizes empty values away', () => {
    const onChange = vi.fn();

    render(
      <DateRangePicker
        label="Date Range"
        value={{ start: '2026-04-01', end: '2026-04-10' }}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith({ end: '2026-04-10', start: undefined });
  });

  it('supports popup apply and clear actions', () => {
    const onApply = vi.fn();
    const onChange = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <DateRangePicker
        label="Feed date range"
        value={{ start: '2026-04-01' }}
        onChange={onChange}
        isOpen
        onOpenChange={onOpenChange}
        onApply={onApply}
      />
    );

    expect(screen.getByRole('button', { name: /2026-04-01 - now/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith({});

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
