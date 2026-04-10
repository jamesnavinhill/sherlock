import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Artifact, Signal } from '@/types';
import { ChatInspectorPanel } from './ChatInspectorPanel';

describe('ChatInspectorPanel', () => {
  it('renders text-only artifact and signal action buttons', () => {
    const artifact: Artifact = {
      id: 'artifact-1',
      workspaceId: 'workspace-1',
      topic: 'Artifact Topic',
      summary: 'Artifact summary',
      agendas: [],
      leads: [],
      entities: [],
      sources: [],
      rawText: 'raw text',
    };
    const signal: Signal = {
      id: 'signal-1',
      workspaceId: 'workspace-1',
      content: 'Signal content',
      source: 'Signal source',
      timestamp: '2026-04-09T10:00:00.000Z',
      type: 'NEWS',
      status: 'PENDING',
      threatLevel: 'INFO',
    };

    render(
      <ChatInspectorPanel
        rightPanelOpen
        workspaceTitle="Atlas Workspace"
        rightPanelSections={{
          launchContext: false,
          recentArtifacts: true,
          recentSignals: true,
          latestRetrieval: false,
          actionLog: false,
        }}
        launchContextSummary={null}
        workspaceReports={[artifact]}
        workspaceSignals={[signal]}
        latestAssistantMessage={undefined}
        sessionActions={[]}
        expandedArtifactIds={{ 'artifact-1': true }}
        sectionScrollClassName=""
        formatDateTime={() => 'April 9, 2026'}
        onToggleSection={vi.fn()}
        onToggleArtifactCard={vi.fn()}
        onFetchArtifactSummary={vi.fn()}
        onFetchFullArtifact={vi.fn()}
        onFetchRecentSignals={vi.fn()}
      />
    );

    const summaryButton = screen.getByRole('button', { name: 'Summary' });
    const fullTextButton = screen.getByRole('button', { name: 'Full Text' });
    const pinToChatButton = screen.getByRole('button', { name: 'Pin To Chat' });

    expect(summaryButton.querySelector('svg')).toBeNull();
    expect(fullTextButton.querySelector('svg')).toBeNull();
    expect(pinToChatButton.querySelector('svg')).toBeNull();
  });
});
