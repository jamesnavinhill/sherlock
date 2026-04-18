import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RangeField } from './RangeField';

describe('RangeField', () => {
  it('renders label metadata and emits numeric values', () => {
    const onChange = vi.fn();

    render(
      <RangeField
        label="Divider Glow"
        value={0.4}
        min={0}
        max={1}
        step={0.05}
        onChange={onChange}
        formatValue={(value) => `${Math.round(value * 100)}%`}
        description="Tunes the shared shell divider bloom."
      />
    );

    expect(screen.getByText('Divider Glow')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('Tunes the shared shell divider bloom.')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('slider'), { target: { value: '0.65' } });
    expect(onChange).toHaveBeenCalledWith(0.65);
  });
});
