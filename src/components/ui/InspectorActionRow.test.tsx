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
});
