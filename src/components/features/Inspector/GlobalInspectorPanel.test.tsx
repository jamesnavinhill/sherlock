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

  it('marks the shell as hidden when closed', () => {
    render(<GlobalInspectorPanel isOpen={false} title="Atlas Holdings" />);

    const panel = screen.getByText('Atlas Holdings').closest('aside');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel?.getAttribute('data-state')).toBe('closed');
    expect(panel?.className).toContain('pointer-events-none');
  });

  it('defaults to the shared rail width token', () => {
    render(<GlobalInspectorPanel isOpen title="Atlas Holdings" />);

    const panel = screen.getByText('Atlas Holdings').closest('aside');
    expect(panel).toHaveStyle({
      '--osint-dock-width': 'min(var(--osint-shell-rail-width),calc(100vw - 1rem))',
    });
  });

  it('renders a shared footer when provided', () => {
    render(
      <GlobalInspectorPanel
        isOpen
        title="Atlas Holdings"
        footer={<div>Footer Actions</div>}
      />
    );

    expect(screen.getByText('Footer Actions')).toBeInTheDocument();
  });

  it('can place tabs in the header action slot', () => {
    render(
      <GlobalInspectorPanel
        isOpen
        title="Atlas Holdings"
        tabs={[
          { id: 'inspector', label: 'Inspector' },
          { id: 'agent', label: 'Agent' },
        ]}
        activeTabId="inspector"
        onTabChange={vi.fn()}
        tabsPlacement="header"
        headerActionsPlacement="top"
      />
    );

    expect(screen.getByRole('button', { name: 'Inspector' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agent' })).toBeInTheDocument();
  });
});
