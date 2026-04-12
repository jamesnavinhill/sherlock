import { describe, expect, it } from 'vitest';

import type { Artifact } from '@/types';
import { buildArtifactBoardContent } from './artifactText';

describe('buildArtifactBoardContent', () => {
  it('keeps the full report body while omitting separately surfaced key findings sections', () => {
    const artifact: Artifact = {
      topic: 'Memory Systems Comparison',
      summary: 'Executive summary body.',
      agendas: [],
      leads: ['Trace the storage consistency model.'],
      keyFindings: [
        {
          id: 'finding-1',
          title: 'Memo favors pluggable memory',
          summary: 'Memo emphasizes multi-scope retrieval.',
        },
      ],
      sections: [
        {
          id: 'summary',
          kind: 'EXECUTIVE_SUMMARY',
          title: 'Executive Summary',
          content: 'Executive summary body.',
          order: 0,
        },
        {
          id: 'findings',
          kind: 'KEY_FINDINGS',
          title: 'Key Findings',
          items: ['Memo emphasizes pluggable memory.'],
          order: 1,
        },
        {
          id: 'implications',
          kind: 'IMPLICATIONS',
          title: 'Implications',
          content: 'The runtime choice shapes recall and editability.',
          order: 2,
        },
        {
          id: 'steps',
          kind: 'NEXT_STEPS',
          title: 'Next Steps',
          items: ['Validate long-session drift.'],
          order: 3,
        },
      ],
      followUps: [],
      artifactType: 'COMPARISON',
      entities: [],
      sources: [],
      rawText: 'Full raw fallback',
    };

    const content = buildArtifactBoardContent(artifact);

    expect(content).toContain('Executive Summary');
    expect(content).toContain('Implications');
    expect(content).toContain('The runtime choice shapes recall and editability.');
    expect(content).toContain('Next Steps');
    expect(content).toContain('- Validate long-session drift.');
    expect(content).not.toContain('Key Findings');
    expect(content).not.toContain('Memo emphasizes pluggable memory.');
  });

  it('falls back to raw text when canonical sections are unavailable', () => {
    const artifact: Artifact = {
      topic: 'Fallback Report',
      summary: '',
      agendas: [],
      leads: [],
      entities: [],
      sources: [],
      rawText: 'Unstructured but complete report body.',
    };

    expect(buildArtifactBoardContent(artifact)).toBe('Unstructured but complete report body.');
  });
});
