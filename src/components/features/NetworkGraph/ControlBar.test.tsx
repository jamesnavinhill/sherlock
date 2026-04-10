import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ControlBar } from './ControlBar';

describe('ControlBar', () => {
  it('renders a visible library toggle button', () => {
    render(
      <ControlBar
        workspaces={[]}
        filterWorkspaceId=""
        onWorkspaceChange={vi.fn()}
        showLeftPanel
        onToggleLeftPanel={vi.fn()}
        showRightPanel={false}
        onToggleRightPanel={vi.fn()}
        isLinkingMode={false}
        onToggleLinkingMode={vi.fn()}
        onShowAddNode={vi.fn()}
        onShowResolution={vi.fn()}
        pendingClusterCount={0}
      />
    );

    const toggle = screen.getByRole('button', { name: 'Toggle Library Panel' });
    expect(toggle).toBeInTheDocument();
    expect(toggle.className).not.toContain('hidden');
  });
});
