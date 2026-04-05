import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceSearchRepository } from './WorkspaceSearchRepository';
import {
  artifactEvidence,
  artifactSections,
  cases,
  entities,
  leads,
  reports,
  sources,
} from '../schema';

const mockDb = {
  select: vi.fn(),
};

vi.mock('../client', () => ({
  getDB: () => mockDb,
}));

describe('WorkspaceSearchRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a workspace context bundle with ranked snippets and recent signals', async () => {
    const workspaceRows = [
      {
        id: 'case-1',
        scopeId: 'corporate-intelligence',
        title: 'Atlas Workspace',
        status: 'ACTIVE',
        dateOpened: '2026-04-03',
        description: 'Counterparty monitoring',
        mode: 'RESEARCH',
        packId: 'corporate-intelligence',
        purposeId: 'deep-dive',
        labelProfileId: 'workspace',
        metadataJson: JSON.stringify({ owner: 'ops' }),
      },
    ];
    const reportRows = [
      {
        id: 'rep-1',
        caseId: 'case-1',
        topic: 'Atlas supplier brief',
        dateStr: '2026-04-03',
        summary: 'Atlas is increasing exposure.',
        rawText: 'Atlas raw detail.',
        artifactType: 'BRIEF',
        packId: 'corporate-intelligence',
        purposeId: 'deep-dive',
        labelProfileId: 'workspace',
        metadataJson: JSON.stringify({ priority: 'high' }),
        configJson: JSON.stringify({ packId: 'corporate-intelligence' }),
        createdAt: Date.parse('2026-04-03T10:00:00.000Z'),
      },
    ];
    const sectionRows = [
      {
        id: 'sec-1',
        reportId: 'rep-1',
        kind: 'KEY_FINDINGS',
        title: 'Exposure',
        content: 'Atlas exposure increased.',
        itemsJson: JSON.stringify(['Supplier concentration increased']),
      },
    ];
    const evidenceRows = [
      {
        id: 'ev-1',
        reportId: 'rep-1',
        kind: 'CLAIM',
        title: 'Supplier concentration evidence',
        summary: 'Atlas exposure increased through a smaller vendor pool.',
        quote: 'Supplier concentration increased',
        sourceTitle: 'Registry filing',
        sourceUrl: 'https://example.com/filing',
      },
    ];
    const entityRows = [
      {
        id: 'ent-1',
        reportId: 'rep-1',
        name: 'Atlas Holdings',
        role: 'Supplier',
        type: 'ORGANIZATION',
      },
    ];
    const sourceRows = [
      {
        id: 'src-1',
        reportId: 'rep-1',
        title: 'Registry filing',
        url: 'https://example.com/filing',
      },
    ];
    const headlineRows = [
      {
        id: 'head-1',
        caseId: 'case-1',
        content: 'Atlas supplier risk escalated',
        source: 'Desk',
        type: 'NEWS',
        status: 'PENDING',
        threatLevel: 'CAUTION',
        linkedReportId: 'rep-1',
        url: 'https://example.com/signal',
        timestamp: '2026-04-03T09:00:00.000Z',
      },
    ];

    mockDb.select.mockImplementation(() => ({
      from: (table: unknown) => {
        if (table === cases) {
          return {
            where: vi.fn().mockResolvedValue(workspaceRows),
          };
        }

        if (table === reports) {
          return {
            where: vi.fn(() => ({
              orderBy: vi.fn().mockResolvedValue(reportRows),
            })),
          };
        }

        if (table === artifactSections) {
          return {
            where: vi.fn().mockResolvedValue(sectionRows),
          };
        }

        if (table === artifactEvidence) {
          return {
            where: vi.fn().mockResolvedValue(evidenceRows),
          };
        }

        if (table === entities) {
          return {
            where: vi.fn().mockResolvedValue(entityRows),
          };
        }

        if (table === sources) {
          return {
            where: vi.fn().mockResolvedValue(sourceRows),
          };
        }

        if (table === leads) {
          return {
            where: vi.fn(() => ({
              orderBy: vi.fn().mockResolvedValue(headlineRows),
            })),
          };
        }

        throw new Error('Unexpected table access.');
      },
    }));

    const bundle = await WorkspaceSearchRepository.getWorkspaceContextBundle('case-1', 'atlas', {
      limit: 4,
    });

    expect(bundle.workspace).toEqual(
      expect.objectContaining({
        id: 'case-1',
        title: 'Atlas Workspace',
        metadata: { owner: 'ops' },
      })
    );
    expect(bundle.summary).toContain('1 saved artifacts');
    expect(bundle.recentArtifacts[0]).toEqual(
      expect.objectContaining({
        id: 'rep-1',
        topic: 'Atlas supplier brief',
        artifactType: 'BRIEF',
      })
    );
    expect(bundle.recentHeadlines[0]).toEqual(
      expect.objectContaining({
        id: 'head-1',
        type: 'NEWS',
        linkedReportId: 'rep-1',
      })
    );
    expect(bundle.snippets.some((snippet) => snippet.id === 'CTX-REPORT-rep-1')).toBe(true);
    expect(bundle.snippets.some((snippet) => snippet.id === 'CTX-EVIDENCE-ev-1')).toBe(true);
  });
});
