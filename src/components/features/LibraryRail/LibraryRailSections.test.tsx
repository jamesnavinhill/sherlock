import { render, screen } from '@testing-library/react';
import { FileText } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { LibraryRailSections } from './LibraryRailSections';

describe('LibraryRailSections', () => {
  it('renders entry actions inside shared accordion sections', () => {
    render(
      <LibraryRailSections
        sections={[
          {
            id: 'artifacts',
            title: 'Artifacts',
            icon: FileText,
            isOpen: true,
            onToggle: vi.fn(),
            entries: [
              {
                id: 'artifact-1',
                title: 'Atlas Research Brief',
                description: 'Saved artifact summary.',
                actions: [
                  {
                    id: 'open',
                    label: 'Open',
                    onClick: vi.fn(),
                  },
                ],
              },
            ],
          },
        ]}
      />
    );

    expect(screen.getByText('Atlas Research Brief')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
  });
});
