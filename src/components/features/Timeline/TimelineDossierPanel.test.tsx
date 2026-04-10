import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { TimelineEvent } from '@/types';
import { TimelineDossierPanel } from './TimelineDossierPanel';

const buildEvent = (overrides: Partial<TimelineEvent>): TimelineEvent => ({
  id: overrides.id || 'event-1',
  occurredAt: overrides.occurredAt || 10,
  track: overrides.track || 'RUN',
  type: overrides.type || 'RUN_COMPLETED',
  workspaceId: overrides.workspaceId || 'ws-1',
  title: overrides.title || 'Atlas Run',
  ...overrides,
});

describe('TimelineDossierPanel', () => {
  it('renders shared library sections and preserves focus navigation actions', () => {
    const onToggleSection = vi.fn();
    const onSetTrackFocus = vi.fn();
    const onFocusReference = vi.fn();

    render(
      <TimelineDossierPanel
        isOpen
        workspaceTitle="Atlas Workspace"
        labelProfile={{ artifactLabel: 'Artifact', artifactLabelPlural: 'Artifacts' }}
        dossierSections={{
          events: true,
          runs: true,
          artifacts: false,
          signals: false,
          entities: false,
          chats: false,
        }}
        allTimelineEvents={[
          buildEvent({ id: 'run-evt', refId: 'run-1' }),
          buildEvent({
            id: 'artifact-evt',
            track: 'ARTIFACT',
            type: 'ARTIFACT_CREATED',
            refId: 'artifact-1',
            title: 'Atlas Brief',
          }),
        ]}
        runItems={[buildEvent({ id: 'run-evt', refId: 'run-1' })]}
        artifactItems={[]}
        signalItems={[]}
        entityItems={[]}
        chatSessionItems={[]}
        focusedTrack="RUN"
        onToggleSection={onToggleSection}
        onSetTrackFocus={onSetTrackFocus}
        onFocusReference={onFocusReference}
      />
    );

    expect(screen.getByText('Atlas Workspace')).toBeInTheDocument();
    expect(screen.getByText(/latest activity/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/timeline events across runs, artifacts, signals, entities, and chats/i)
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Runs \(1\)/i }));
    expect(onSetTrackFocus).toHaveBeenCalledWith('RUN');

    fireEvent.click(screen.getByRole('button', { name: 'Atlas Run' }));
    expect(onFocusReference).toHaveBeenCalledWith('RUN', 'run-1');
  });
});
