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

  it('renders duplicate leads and next steps only once when they have the same content', () => {
    const artifact: Artifact = {
      topic: 'Duplicate Follow Ups',
      summary: 'Summary',
      agendas: [],
      leads: [
        "Audit 'OMEGAMCP' source code for potential telemetry or backdoors.",
        "Track the adoption of 'Agent File' (.af) formats.",
      ],
      followUps: [
        {
          id: 'follow-up-1',
          kind: 'TASK',
          title: "Audit 'OMEGAMCP'",
          actionText: "Audit 'OMEGAMCP' source code for potential telemetry or backdoors.",
          status: 'OPEN',
        },
        {
          id: 'follow-up-2',
          kind: 'TASK',
          title: "Track 'Agent File' formats",
          actionText: "Track the adoption of 'Agent File' (.af) formats.",
          status: 'OPEN',
        },
      ],
      sections: [
        {
          id: 'summary',
          kind: 'EXECUTIVE_SUMMARY',
          title: 'Executive Summary',
          content: 'Summary',
          order: 0,
        },
        {
          id: 'next-steps',
          kind: 'NEXT_STEPS',
          title: 'Next Steps',
          items: [
            "Audit 'OMEGAMCP' source code for potential telemetry or backdoors.",
            "Track the adoption of 'Agent File' (.af) formats.",
          ],
          order: 1,
        },
        {
          id: 'leads',
          kind: 'LEADS',
          title: 'Leads',
          items: [
            "Audit 'OMEGAMCP' source code for potential telemetry or backdoors.",
            "Track the adoption of 'Agent File' (.af) formats.",
          ],
          order: 2,
        },
      ],
      artifactType: 'BRIEF',
      entities: [],
      sources: [],
      rawText: 'raw',
    };

    const content = buildArtifactBoardContent(artifact);

    expect(content).toContain('Next Steps');
    expect(content).not.toContain('\n\nLeads\n');
  });
});
