import { render, screen } from '@testing-library/react';
import { FileText } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import type { LabelProfile, TimelineEvent } from '@/types';
import { TimelineInspectorPanel } from './TimelineInspectorPanel';

const baseEvent: TimelineEvent = {
  id: 'artifact-evt',
  occurredAt: 1712620800000,
  track: 'ARTIFACT',
  type: 'ARTIFACT_CREATED',
  workspaceId: 'ws-1',
  title: 'Atlas Brief',
  summary: 'Fresh artifact snapshot.',
  refId: 'artifact-1',
  refKind: 'ARTIFACT',
  metadata: {
    mentionCount: 4,
    threshold: 3,
    source: 'Desk',
  },
  badges: ['Pinned'],
};

const labelProfile: LabelProfile = {
  id: 'default',
  workspaceLabel: 'Workspace',
  workspaceLabelPlural: 'Workspaces',
  artifactLabel: 'Artifact',
  artifactLabelPlural: 'Artifacts',
  detailViewLabel: 'Detail View',
  followUpLabel: 'Follow-up',
  anomalyLabel: 'Anomaly',
  signalLabel: 'Signal',
  archiveLabel: 'Archive',
};

describe('TimelineInspectorPanel', () => {
  it('renders timeline metadata inside the shared global inspector', () => {
    render(
      <TimelineInspectorPanel
        isOpen
        selectedEvent={baseEvent}
        detailSections={{ summary: true, context: true }}
        detailActions={[
          {
            id: 'open-artifact',
            label: 'Open Artifact',
            icon: FileText,
            onClick: vi.fn(),
          },
        ]}
        activeWorkspace={{
          id: 'ws-1',
          title: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-05',
        }}
        selectedChatSession={{
          id: 'chat-1',
          workspaceId: 'ws-1',
          title: 'Workspace Chat',
          status: 'ACTIVE',
          createdAt: 10,
          updatedAt: 20,
        }}
        selectedEntityName="Atlas Holdings"
        selectedArtifact={{
          id: 'artifact-1',
          workspaceId: 'ws-1',
          topic: 'Atlas Brief',
          summary: 'Summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: 'raw',
        }}
        parentArtifact={null}
        relatedSignal={{
          id: 'signal-1',
          workspaceId: 'ws-1',
          content: 'Desk signal',
          source: 'Desk',
          timestamp: '2026-04-05T00:00:00.000Z',
          type: 'NEWS',
          status: 'PENDING',
          threatLevel: 'INFO',
        }}
        selectedRun={{
          id: 'run-1',
          topic: 'Atlas workflow',
          status: 'COMPLETED',
          startTime: 10,
          endTime: 20,
          workspaceId: 'ws-1',
        }}
        selectedWorkspaceItem={null}
        selectedChatLaunchContext={{ entityName: 'Atlas Holdings' }}
        selectedChatAction={{
          id: 'action-1',
          sessionId: 'chat-1',
          type: 'SEARCH_WORKSPACE',
          status: 'COMPLETED',
          createdAt: 10,
          updatedAt: 20,
          input: { query: 'Atlas' },
        }}
        labelProfile={labelProfile}
        onToggleSummary={vi.fn()}
        onToggleContext={vi.fn()}
      />
    );

    expect(screen.getAllByText('Atlas Brief')).toHaveLength(2);
    expect(screen.getByText('Open Artifact')).toBeInTheDocument();
    expect(screen.getByText('Event Context')).toBeInTheDocument();
    expect(screen.getAllByText('Atlas Holdings')).toHaveLength(2);
    expect(screen.getByText('Desk signal')).toBeInTheDocument();
    expect(screen.getByText('Pinned')).toBeInTheDocument();
  });

  it('shows the shared inspector empty state when no event is selected', () => {
    render(
      <TimelineInspectorPanel
        isOpen
        selectedEvent={null}
        detailSections={{ summary: false, context: false }}
        detailActions={[]}
        activeWorkspace={null}
        selectedChatSession={null}
        selectedEntityName={null}
        selectedArtifact={null}
        parentArtifact={null}
        relatedSignal={null}
        selectedRun={null}
        selectedWorkspaceItem={null}
        selectedChatLaunchContext={null}
        selectedChatAction={null}
        labelProfile={labelProfile}
        onToggleSummary={vi.fn()}
        onToggleContext={vi.fn()}
      />
    );

    expect(screen.getByText('Select An Event')).toBeInTheDocument();
  });
});
