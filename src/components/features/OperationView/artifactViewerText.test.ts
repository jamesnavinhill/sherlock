import { describe, expect, it } from 'vitest';

import type { Artifact } from '@/types';
import { buildArtifactViewerBody } from './artifactViewerText';

describe('buildArtifactViewerBody', () => {
  it('stops the executive summary before separately surfaced key findings and leads content', () => {
    const artifact: Artifact = {
      topic: 'Redundant Viewer Content',
      summary: 'Fallback summary',
      agendas: [],
      leads: [],
      followUps: [],
      entities: [],
      sources: [],
      rawText: 'raw',
      sections: [
        {
          id: 'summary',
          kind: 'EXECUTIVE_SUMMARY',
          title: 'Executive Summary',
          content:
            'Core summary.\n\nImplications\nThe runtime choice shapes recall and editability.\n\nKey Findings\n- Memo favors pluggable memory.\n\nLeads\n- Validate long-session drift.',
          order: 0,
        },
        {
          id: 'implications',
          kind: 'IMPLICATIONS',
          title: 'Implications',
          content: 'The runtime choice shapes recall and editability.',
          order: 1,
        },
        {
          id: 'findings',
          kind: 'KEY_FINDINGS',
          title: 'Key Findings',
          items: ['Memo favors pluggable memory.'],
          order: 2,
        },
        {
          id: 'leads',
          kind: 'LEADS',
          title: 'Leads',
          items: ['Validate long-session drift.'],
          order: 3,
        },
        {
          id: 'appendix',
          kind: 'CUSTOM',
          title: 'Appendix',
          content: 'Supporting notes for the case team.',
          order: 4,
        },
      ],
      artifactType: 'BRIEF',
    };

    const body = buildArtifactViewerBody({
      report: artifact,
      orderedSections: artifact.sections || [],
    });

    expect(body).toContain('Core summary.');
    expect(body).toContain('Appendix\nSupporting notes for the case team.');
    expect(body.match(/Implications/g)).toHaveLength(1);
    expect(body).not.toContain('Key Findings');
    expect(body).not.toContain('Memo favors pluggable memory.');
    expect(body).not.toContain('Leads');
    expect(body).not.toContain('Validate long-session drift.');
  });

  it('does not append legacy leads into the executive summary when they are surfaced elsewhere', () => {
    const artifact: Artifact = {
      topic: 'Legacy Leads Hidden',
      summary: 'Fallback summary',
      agendas: [],
      leads: ['Validate long-session drift.'],
      followUps: [],
      entities: [],
      sources: [],
      rawText: 'raw',
      sections: [
        {
          id: 'summary',
          kind: 'EXECUTIVE_SUMMARY',
          title: 'Executive Summary',
          content: 'Core summary.',
          order: 0,
        },
      ],
      artifactType: 'BRIEF',
    };

    const body = buildArtifactViewerBody({
      report: artifact,
      orderedSections: artifact.sections || [],
    });

    expect(body).toContain('Core summary.');
    expect(body).not.toContain('Leads');
    expect(body).not.toContain('Validate long-session drift.');
  });

  it('prepends the artifact summary when no executive summary section exists', () => {
    const artifact: Artifact = {
      topic: 'Summary Fallback',
      summary: 'Stored summary text.',
      agendas: [],
      leads: [],
      followUps: [],
      entities: [],
      sources: [],
      rawText: 'raw',
      sections: [
        {
          id: 'implications',
          kind: 'IMPLICATIONS',
          title: 'Implications',
          content: 'Implications body.',
          order: 0,
        },
      ],
      artifactType: 'REPORT',
    };

    const body = buildArtifactViewerBody({
      report: artifact,
      orderedSections: artifact.sections || [],
    });

    expect(body.startsWith('Stored summary text.')).toBe(true);
    expect(body).toContain('Implications\nImplications body.');
  });
});
