import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LibraryRailSearch } from './LibraryRailSearch';
import { LibraryRailShell } from './LibraryRailShell';

describe('LibraryRailShell', () => {
  it('marks the shell as hidden when closed and preserves search accessibility', () => {
    render(
      <LibraryRailShell
        isOpen={false}
        title="Atlas Workspace"
        search={<LibraryRailSearch value="" onChange={vi.fn()} />}
      >
        <div>Library Content</div>
      </LibraryRailShell>
    );

    const panel = screen.getByText('Atlas Workspace').closest('aside');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel?.getAttribute('data-state')).toBe('closed');
    expect(panel?.className).toContain('pointer-events-none');
    expect(
      screen.getByRole('searchbox', { name: 'Search library', hidden: true })
    ).toBeInTheDocument();
  });
});
