import { render, screen } from '@testing-library/react';
import { MessageSquare } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { InspectorActionRow } from './InspectorActionRow';

describe('InspectorActionRow', () => {
  it('renders visible action labels by default', () => {
    render(
      <InspectorActionRow
        actions={[
          {
            id: 'open-chat',
            label: 'Open In Chat',
            icon: MessageSquare,
            onClick: vi.fn(),
          },
        ]}
      />
    );

    expect(screen.getByRole('button', { name: 'Open In Chat' })).toBeInTheDocument();
    expect(screen.getByText('Open In Chat')).toBeInTheDocument();
  });

  it('keeps icon-only actions accessible without rendering visible text', () => {
    render(
      <InspectorActionRow
        actions={[
          {
            id: 'open-chat',
            label: 'Chat',
            icon: MessageSquare,
            iconOnly: true,
            onClick: vi.fn(),
          },
        ]}
      />
    );

    expect(screen.getByRole('button', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.queryByText('Chat')).not.toBeInTheDocument();
  });

  it('supports thin grid layouts with explicit columns', () => {
    const { container } = render(
      <InspectorActionRow
        actions={[
          {
            id: 'chat',
            label: 'Chat',
            icon: MessageSquare,
            onClick: vi.fn(),
          },
          {
            id: 'open',
            label: 'Open',
            icon: MessageSquare,
            onClick: vi.fn(),
          },
        ]}
        layout="grid"
        density="thin"
        gridColumns={3}
      />
    );

    expect(container.firstChild).toHaveStyle({
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    });
    expect(screen.getByRole('button', { name: 'Chat' }).className).toContain('h-6');
  });

  it('renders a short visible label while preserving the full accessible label', () => {
    render(
      <InspectorActionRow
        actions={[
          {
            id: 'open-chat',
            label: 'Open Workspace Chat',
            shortLabel: 'Chat',
            icon: MessageSquare,
            onClick: vi.fn(),
          },
        ]}
      />
    );

    expect(screen.getByRole('button', { name: 'Open Workspace Chat' })).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.queryByText('Open Workspace Chat')).not.toBeInTheDocument();
  });
});
