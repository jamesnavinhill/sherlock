import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DockPanel } from './DockPanel';

describe('DockPanel', () => {
  it('renders placement metadata and hidden state when closed', () => {
    render(
      <DockPanel placement="right" isOpen={false}>
        <div>Theme Summary</div>
      </DockPanel>
    );

    const panel = screen.getByText('Theme Summary').closest('aside');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel).toHaveAttribute('data-placement', 'right');
    expect(panel).toHaveAttribute('data-state', 'closed');
    expect(panel?.className).toContain('pointer-events-none');
    expect(panel?.className).toContain('translate-x-full');
  });

  it('applies theme-backed dock width variables', () => {
    render(
      <DockPanel placement="left" isOpen widthValue="min(var(--osint-shell-rail-width),calc(100vw-1rem))">
        <div>Library</div>
      </DockPanel>
    );

    const panel = screen.getByText('Library').closest('aside');
    expect(panel).toHaveStyle({
      '--osint-dock-width': 'min(var(--osint-shell-rail-width),calc(100vw-1rem))',
    });
    expect(panel?.className).toContain('w-[var(--osint-dock-width)]');
  });
});
