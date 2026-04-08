import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui/GlobalSearch', () => ({
  GlobalSearch: () => <div data-testid="global-search" />,
}));

vi.mock('@/components/ui/OsintSelect', () => ({
  OsintSelect: () => <div data-testid="timeline-workspace-select" />,
}));

import { TimelineToolbar } from './TimelineToolbar';

describe('TimelineToolbar', () => {
  it('orders the right-side actions as filters, save view, export, then panel toggle', () => {
    render(
      <TimelineToolbar
        activeWorkspace={{ id: 'ws-1', title: 'Atlas Workspace', status: 'ACTIVE', dateOpened: '2026-04-08' }}
        workspaces={[]}
        filters={{ range: 'ALL', tracks: ['SIGNAL', 'RUN', 'ARTIFACT', 'ITEM'] }}
        leftPanelOpen
        rightPanelOpen={false}
        showExportMenu={false}
        showFilters={false}
        timelineSnapshotAvailable
        canSaveCurrentView
        exportMenuRef={{ current: null }}
        filterMenuRef={{ current: null }}
        onToggleLeftPanel={vi.fn()}
        onToggleRightPanel={vi.fn()}
        onWorkspaceChange={vi.fn()}
        onToggleExportMenu={vi.fn()}
        onToggleFilters={vi.fn()}
        onSaveView={vi.fn()}
        onCloseFilters={vi.fn()}
        onClearFilters={vi.fn()}
        onRangeChange={vi.fn()}
        onToggleTrackFilter={vi.fn()}
        onExportTimelineMarkdown={vi.fn()}
        onExportTimelineJson={vi.fn()}
        onSaveTimelineArtifact={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    const rightActionButtons = buttons.slice(-4);

    expect(rightActionButtons[0]).toHaveAttribute('aria-label', 'Timeline filters');
    expect(rightActionButtons[0]).not.toHaveTextContent(/filters/i);
    expect(rightActionButtons[1]).toHaveTextContent(/save view/i);
    expect(rightActionButtons[2]).toHaveTextContent(/export/i);
    expect(rightActionButtons[3]).toHaveAttribute('title', 'Toggle event details');
  });
});
