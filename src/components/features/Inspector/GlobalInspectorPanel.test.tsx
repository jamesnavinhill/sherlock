import { render, screen } from '@testing-library/react';
import { FileText } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { GlobalInspectorPanel } from './GlobalInspectorPanel';

describe('GlobalInspectorPanel', () => {
  it('renders tabs, thin action grid, and empty state content', () => {
    render(
      <GlobalInspectorPanel
        isOpen
        title="Atlas Holdings"
        subtitle="Entity"
        tabs={[
          { id: 'inspector', label: 'Inspector' },
          { id: 'agent', label: 'Agent' },
        ]}
        activeTabId="inspector"
        onTabChange={vi.fn()}
        actionItems={[
          {
            id: 'open',
            label: 'Open',
            icon: FileText,
            onClick: vi.fn(),
          },
        ]}
        emptyState={{
          icon: FileText,
          title: 'No Item Selected',
          description: 'Choose an item to inspect.',
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'Inspector' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agent' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
    expect(screen.getByText('No Item Selected')).toBeInTheDocument();
  });
});
