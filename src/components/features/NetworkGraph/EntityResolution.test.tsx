import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EntityResolution } from './EntityResolution';

describe('EntityResolution', () => {
  it('renders through a fixed portal overlay and closes on escape', () => {
    const onClose = vi.fn();

    render(
      <EntityResolution
        allEntities={[]}
        currentAliases={{}}
        onSaveAliases={vi.fn()}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Entity Clustering')).toBeInTheDocument();
    expect(screen.getByText('Entity Clustering').closest('.fixed.inset-0')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
