import { fireEvent, render, screen } from '@testing-library/react';
import { ArrowUpRight, FileText } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { LibraryRailEntry } from './LibraryRailEntry';

describe('LibraryRailEntry', () => {
  it('keeps secondary actions interactive when the primary entry uses href navigation', () => {
    const onQueue = vi.fn();

    render(
      <LibraryRailEntry
        entry={{
          id: 'artifact-1',
          title: 'Atlas Research Brief',
          description: 'Saved artifact summary.',
          href: '/artifacts/atlas-research-brief',
          actions: [
            {
              id: 'queue',
              label: 'Queue',
              icon: FileText,
              onClick: onQueue,
            },
            {
              id: 'source',
              label: 'Source',
              icon: ArrowUpRight,
              href: 'https://example.com/source',
            },
          ],
        }}
      />
    );

    expect(screen.getByRole('link', { name: /Atlas Research Brief/i })).toHaveAttribute(
      'href',
      '/artifacts/atlas-research-brief'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Queue' }));
    expect(onQueue).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Source' })).toHaveAttribute(
      'href',
      'https://example.com/source'
    );
  });
});
