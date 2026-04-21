import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getLabelProfileById } from '@/domain';
import type { TimelineEvent } from '@/types';
import { TimelineEventList } from './TimelineEventList';

const event: TimelineEvent = {
  id: 'event-1',
  occurredAt: Date.parse('2026-04-05T12:00:00.000Z'),
  track: 'ARTIFACT',
  type: 'ARTIFACT_CREATED',
  workspaceId: 'case-1',
  title: 'Artifact created',
  summary: 'A saved artifact entered the workspace chronology.',
  refId: 'artifact-1',
  refKind: 'ARTIFACT',
};

describe('TimelineEventList', () => {
  it('caps the event stack to the shared reading width', () => {
    render(
      <TimelineEventList
        activeWorkspace={{
          id: 'case-1',
          title: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-05',
        }}
        workspaces={[]}
        visibleEvents={[event]}
        groupedEvents={[{ label: 'April 5, 2026', events: [event] }]}
        labelProfile={getLabelProfileById()}
        effectiveSelectedEventId={null}
        artifactTitleById={new Map()}
        signalTitleById={new Map()}
        chatTitleById={new Map()}
        onClearFilters={vi.fn()}
        onSelectEvent={vi.fn()}
        onFocusReference={vi.fn()}
        onOpenArtifact={vi.fn()}
        onOpenWorkspaceChat={vi.fn()}
      />
    );

    expect(screen.getByTestId('timeline-event-list-stack')).toHaveClass(
      'mx-auto',
      'w-full',
      'max-w-4xl'
    );
  });
});
