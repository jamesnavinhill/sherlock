import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import { AppView } from '@/types';

vi.mock('./RunManager', () => ({
  RunManager: () => <div>Run Manager</div>,
}));

import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('places Files ahead of Viewer in the primary navigation', () => {
    render(
      <Sidebar
        currentView={AppView.FILES}
        onChangeView={vi.fn()}
        isCollapsed={false}
        toggleCollapse={vi.fn()}
        workspaceRuns={[]}
        activeTaskId={null}
        onSelectTask={vi.fn()}
        onClearCompleted={vi.fn()}
        themeMode="dark"
        onToggleTheme={vi.fn()}
      />
    );

    const nav = screen.getByRole('navigation');
    const labels = within(nav)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'));

    expect(labels.slice(0, 2)).toEqual(['Files', 'Viewer']);
  });
});
