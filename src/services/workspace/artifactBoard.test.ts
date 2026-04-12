import { describe, expect, it } from 'vitest';

import type { Artifact, Headline } from '@/types';
import {
  buildWorkspaceEntityRefId,
  buildWorkspaceSourceRefId,
  type WorkspaceLibraryEntry,
} from './library';
import { buildArtifactPackageEntries } from './artifactBoard';

describe('buildArtifactPackageEntries', () => {
  it('resolves artifact-related findings, entities, sources, and linked signals from the library map', () => {
    const artifact: Artifact & { id: string; workspaceId: string } = {
      id: 'artifact-1',
      workspaceId: 'ws-1',
      topic: 'Atlas Brief',
      summary: 'Summary',
      agendas: [],
      leads: [],
      keyFindings: [
        {
          id: 'finding-1',
          title: 'A finding',
          summary: 'Finding summary',
        },
      ],
      entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
      sources: [{ title: 'Registry', url: 'https://example.com/registry' }],
      rawText: 'Summary',
    };
    const signals: Headline[] = [
      {
        id: 'signal-1',
        workspaceId: 'ws-1',
        content: 'Signal content',
        source: 'Monitor',
        timestamp: '2026-04-12T12:00:00Z',
        type: 'NEWS',
        status: 'PENDING',
        threatLevel: 'INFO',
        linkedArtifactId: 'artifact-1',
      },
    ];
    const entries: WorkspaceLibraryEntry[] = [
      {
        workspaceId: 'ws-1',
        refKind: 'ARTIFACT',
        refId: 'artifact-1',
        title: 'Atlas Brief',
        kind: 'ARTIFACT',
        description: 'Summary',
        searchText: 'Atlas Brief Summary',
      },
      {
        workspaceId: 'ws-1',
        refKind: 'KEY_FINDING',
        refId: 'finding-1',
        title: 'A finding',
        kind: 'FINDING',
        description: 'Finding summary',
        searchText: 'A finding',
      },
      {
        workspaceId: 'ws-1',
        refKind: 'ENTITY',
        refId: buildWorkspaceEntityRefId('Atlas Holdings'),
        title: 'Atlas Holdings',
        kind: 'ENTITY',
        searchText: 'Atlas Holdings',
      },
      {
        workspaceId: 'ws-1',
        refKind: 'SOURCE',
        refId: buildWorkspaceSourceRefId({ title: 'Registry', url: 'https://example.com/registry' }),
        title: 'Registry',
        kind: 'SOURCE',
        searchText: 'Registry https://example.com/registry',
      },
      {
        workspaceId: 'ws-1',
        refKind: 'SIGNAL',
        refId: 'signal-1',
        title: 'Monitor',
        kind: 'SIGNAL',
        searchText: 'Monitor Signal content',
      },
    ];

    const result = buildArtifactPackageEntries({
      artifact,
      libraryMap: new Map(entries.map((entry) => [`${entry.refKind}:${entry.refId}`, entry])),
      workspaceSignals: signals,
    });

    expect(result?.artifactEntry.refId).toBe('artifact-1');
    expect(result?.findingEntries).toHaveLength(1);
    expect(result?.entityEntries).toHaveLength(1);
    expect(result?.sourceEntries).toHaveLength(1);
    expect(result?.signalEntries).toHaveLength(1);
  });
});
