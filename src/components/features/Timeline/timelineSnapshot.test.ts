import { describe, expect, it } from 'vitest';
import type { TimelineEvent, Workspace } from '@/types';
import {
  buildTimelineSnapshot,
  buildTimelineSnapshotArtifact,
  buildTimelineSnapshotMarkdown,
} from './timelineSnapshot';

const workspace: Workspace = {
  id: 'case-1',
  title: 'Atlas Workspace',
  status: 'ACTIVE',
  dateOpened: '2026-04-03',
  packId: 'corporate-intelligence',
  purposeId: 'deep-dive',
  labelProfileId: 'workspace',
};

const events: TimelineEvent[] = [
  {
    id: 'event-1',
    occurredAt: Date.parse('2026-04-03T10:00:00.000Z'),
    track: 'RUN',
    type: 'RUN_STARTED',
    workspaceId: 'case-1',
    title: 'Atlas supplier run',
    summary: 'Workspace run started from a saved signal.',
    refId: 'run-1',
    refKind: 'RUN',
    badges: ['RUNNING', 'BRIEF'],
  },
  {
    id: 'event-2',
    occurredAt: Date.parse('2026-04-03T11:00:00.000Z'),
    track: 'ARTIFACT',
    type: 'ARTIFACT_CREATED',
    workspaceId: 'case-1',
    title: 'Atlas supplier brief',
    summary: 'Saved artifact created from a follow-up artifact run.',
    refId: 'rep-1',
    refKind: 'ARTIFACT',
    badges: ['BRIEF'],
  },
];

describe('timelineSnapshot', () => {
  it('builds a snapshot with query metadata', () => {
    const snapshot = buildTimelineSnapshot({
      workspace,
      events,
      filters: {
        range: '30D',
        tracks: ['RUN', 'ARTIFACT'],
      },
      search: 'atlas',
      focusedTrack: 'ARTIFACT',
      focusedRefId: 'rep-1',
      generatedAt: '2026-04-03T12:00:00.000Z',
    });

    expect(snapshot.metadata).toEqual({
      generatedAt: '2026-04-03T12:00:00.000Z',
      range: '30D',
      tracks: ['RUN', 'ARTIFACT'],
      search: 'atlas',
      focusedTrack: 'ARTIFACT',
      focusedRefId: 'rep-1',
    });
    expect(snapshot.events).toHaveLength(2);
  });

  it('renders markdown and saves a TIMELINE artifact snapshot', () => {
    const snapshot = buildTimelineSnapshot({
      workspace,
      events,
      filters: {
        range: 'ALL',
        tracks: ['RUN', 'ARTIFACT'],
      },
      search: '',
      generatedAt: '2026-04-03T12:00:00.000Z',
    });

    const markdown = buildTimelineSnapshotMarkdown(snapshot);
    const artifact = buildTimelineSnapshotArtifact(snapshot);

    expect(markdown).toContain('# Timeline Snapshot: Atlas Workspace');
    expect(markdown).toContain('Atlas supplier brief');
    expect(artifact.artifactType).toBe('TIMELINE');
    expect(artifact.workspaceId).toBe('case-1');
    expect(artifact.sections?.find((section) => section.kind === 'TIMELINE')?.items).toHaveLength(
      2
    );
    expect(artifact.metadata).toEqual(
      expect.objectContaining({
        visibleEventCount: 2,
      })
    );
  });
});
