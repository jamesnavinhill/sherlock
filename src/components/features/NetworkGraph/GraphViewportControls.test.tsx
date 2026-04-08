import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GraphViewportControls } from './GraphViewportControls';

describe('GraphViewportControls', () => {
  it('keeps the controls grouped without an outer border', () => {
    const { container } = render(
      <GraphViewportControls
        isLocked={false}
        showHiddenNodes={false}
        showSingletons={true}
        showFlaggedOnly={false}
        onToggleHiddenNodes={vi.fn()}
        onToggleLock={vi.fn()}
        onToggleSingletons={vi.fn()}
        onToggleFlaggedOnly={vi.fn()}
        onZoom={vi.fn()}
      />
    );

    screen.getByTitle('Hide Singletons');
    const group = container.querySelector('.pointer-events-auto');
    expect(group).toBeTruthy();
    expect(group?.className).not.toContain(' border ');
    expect(group?.className).not.toContain('border ');
  });
});
