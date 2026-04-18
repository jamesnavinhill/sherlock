import { describe, expect, it } from 'vitest';
import { hydrateArtifactRow } from './artifactHydration';

describe('hydrateArtifactRow', () => {
  it('rebuilds canonical artifact state from legacy raw payloads when dependent rows are absent', () => {
    const artifact = hydrateArtifactRow({
      row: {
        id: 'artifact-1',
        workspaceId: 'workspace-1',
        topic: 'Atlas Contract Network',
        dateStr: '2026-04-18',
        summary: 'Fallback summary',
        rawText: JSON.stringify({
          entities: ['Atlas Holdings'],
          sources: [{ title: 'Registry', url: 'https://example.com/registry' }],
          agendas: ['Ownership converges on one holding company.'],
          leads: ['Trace the holding company directors.'],
          followUps: ['Pull the parent-company filing history.'],
          keyFindings: [
            {
              title: 'Ownership chain converges',
              summary: 'Registry records point to a shared parent entity.',
            },
          ],
          methodology: 'Registry review and contract cross-check.',
        }),
        artifactType: 'BRIEF',
        packId: null,
        purposeId: null,
        labelProfileId: null,
        metadataJson: JSON.stringify({
          provenance: {
            provider: 'OPENAI',
            modelId: 'gpt-test',
            generatedAt: '2026-04-18T00:00:00.000Z',
          },
          importedFrom: 'legacy-fixture',
        }),
        configJson: JSON.stringify({ modelId: 'gpt-test' }),
        createdAt: 123,
      },
      entityRows: [],
      sourceRows: [],
      followUpRows: [],
      keyFindingRows: [],
      sectionRows: [],
      evidenceRows: [],
    });

    expect(artifact.entities).toEqual([
      { name: 'Atlas Holdings', type: 'UNKNOWN' },
    ]);
    expect(artifact.sources).toEqual([
      { title: 'Registry', url: 'https://example.com/registry' },
    ]);
    expect(artifact.keyFindings).toEqual([
      expect.objectContaining({
        title: 'Ownership chain converges',
        summary: 'Registry records point to a shared parent entity.',
        originArtifactId: 'artifact-1',
      }),
    ]);
    expect(artifact.followUps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionText: 'Pull the parent-company filing history.',
        }),
      ])
    );
    expect(artifact.leads).toEqual(
      expect.arrayContaining([
        'Pull the parent-company filing history.',
      ])
    );
    expect(artifact.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'EXECUTIVE_SUMMARY' }),
        expect.objectContaining({ kind: 'KEY_FINDINGS' }),
        expect.objectContaining({ kind: 'NEXT_STEPS' }),
        expect.objectContaining({
          kind: 'METHODOLOGY',
          content: 'Registry review and contract cross-check.',
        }),
      ])
    );
    expect(artifact.provenance).toEqual(
      expect.objectContaining({
        provider: 'OPENAI',
        modelId: 'gpt-test',
      })
    );
    expect(artifact.metadata).toEqual({ importedFrom: 'legacy-fixture' });
  });
});
