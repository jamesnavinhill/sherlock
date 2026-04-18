import { describe, expect, it, vi } from 'vitest';

import type { Artifact, TimelineEvent, WorkspaceItem } from '@/types';
import { buildTimelineDetailActions } from './timelineDetailActions';

const baseEvent: TimelineEvent = {
  id: 'evt-1',
  occurredAt: 1712620800000,
  track: 'ARTIFACT',
  type: 'ARTIFACT_CREATED',
  workspaceId: 'ws-1',
  title: 'Atlas Brief',
  refId: 'artifact-1',
  refKind: 'ARTIFACT',
};

const selectedArtifact: Artifact = {
  id: 'artifact-1',
  workspaceId: 'ws-1',
  topic: 'Atlas Brief',
  summary: 'Summary',
  agendas: [],
  leads: [],
  entities: [],
  sources: [],
  rawText: 'raw',
};

const selectedWorkspaceItem: WorkspaceItem = {
  id: 'item-1',
  workspaceId: 'ws-1',
  kind: 'LINK',
  title: 'Example',
  url: 'https://example.com',
  createdAt: 10,
  updatedAt: 20,
};

describe('buildTimelineDetailActions', () => {
  it('uses short display labels while keeping descriptive full labels', () => {
    const actions = buildTimelineDetailActions({
      focusReference: vi.fn(),
      labelArtifactLabel: 'Report',
      onOpenArtifact: vi.fn(),
      onOpenItemSource: vi.fn(),
      onOpenWorkspaceItem: vi.fn(),
      onOpenWorkspaceChat: vi.fn(),
      onPlaceReferenceOnBoard: vi.fn().mockResolvedValue(undefined),
      relatedSignalId: 'signal-1',
      selectedArtifact,
      selectedChatSessionId: 'chat-1',
      selectedEvent: baseEvent,
      selectedWorkspaceItem,
    });

    expect(actions).toHaveLength(6);
    expect(actions.map(({ label, shortLabel }) => ({ label, shortLabel }))).toEqual([
      { label: 'Open Chat Session', shortLabel: 'Chat' },
      { label: 'Add To Board', shortLabel: 'Add' },
      { label: 'Open Item', shortLabel: 'Item' },
      { label: 'Open Source URL', shortLabel: 'Source' },
      { label: 'Open Report', shortLabel: 'Report' },
      { label: 'Focus Origin Signal', shortLabel: 'Signal' },
    ]);
  });

  it('keeps compact focus labels for timeline navigation actions', () => {
    const actions = buildTimelineDetailActions({
      focusReference: vi.fn(),
      labelArtifactLabel: 'Artifact',
      onOpenArtifact: vi.fn(),
      onOpenItemSource: vi.fn(),
      onOpenWorkspaceItem: vi.fn(),
      onOpenWorkspaceChat: vi.fn(),
      onPlaceReferenceOnBoard: vi.fn().mockResolvedValue(undefined),
      relatedSignalId: 'signal-1',
      selectedChatSessionId: 'chat-1',
      selectedEntityName: 'Atlas Holdings',
      selectedEvent: { ...baseEvent, refKind: 'RUN' },
      selectedRunId: 'run-1',
    });

    expect(actions.map(({ label, shortLabel }) => ({ label, shortLabel }))).toEqual([
      { label: 'Open Chat Session', shortLabel: 'Chat' },
      { label: 'Add To Board', shortLabel: 'Add' },
      { label: 'Focus Source Run', shortLabel: 'Run' },
      { label: 'Focus Origin Signal', shortLabel: 'Signal' },
      { label: 'Focus Entity Milestones', shortLabel: 'Entity' },
      { label: 'Focus Chat Session', shortLabel: 'Session' },
    ]);
  });
});
