import { desc, eq, inArray } from 'drizzle-orm';
import type { Signal, Artifact, WorkspaceContextBundle, WorkspaceContextSnippet } from '@/types';
import { resolveWorkspaceIdentity } from '@/domain';
import { getDB } from '../client';
import {
  artifactEvidence,
  artifactSections,
  cases,
  entities,
  leads,
  reports,
  sources,
  workspaceItems,
} from '../schema';
import { CaseRepository } from './CaseRepository';
import { parseStoredJson, parseStoredJsonOrUndefined } from './json';

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

const toSnippet = (value: string, max = 280): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}...`;
};

const scoreCandidate = (query: string, fields: string[], timestamp = 0, title = ''): number => {
  const lowerQuery = query.trim().toLowerCase();
  const tokens = tokenize(query);
  const haystack = fields.join(' ').toLowerCase();
  const lowerTitle = title.toLowerCase();

  let score = 0;
  if (!lowerQuery && !tokens.length) {
    score += 5;
  }
  if (lowerQuery && lowerTitle.includes(lowerQuery)) {
    score += 80;
  }
  if (lowerQuery && haystack.includes(lowerQuery)) {
    score += 40;
  }

  for (const token of tokens) {
    if (lowerTitle.includes(token)) score += 18;
    if (haystack.includes(token)) score += 8;
  }

  if (timestamp > 0) {
    score += Math.max(0, 14 - Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)));
  }

  return score;
};

const toRecentArtifact = (row: typeof reports.$inferSelect): Artifact => ({
  id: row.id,
  caseId: row.caseId || undefined,
  topic: row.topic,
  dateStr: row.dateStr || undefined,
  summary: row.summary || 'No summary available.',
  agendas: [],
  leads: [],
  entities: [],
  sources: [],
  rawText: row.rawText || '',
  artifactType: (row.artifactType as Artifact['artifactType']) || undefined,
  packId: row.packId || undefined,
  purposeId: row.purposeId || undefined,
  labelProfileId: row.labelProfileId || undefined,
  metadata: parseStoredJsonOrUndefined<Record<string, unknown>>(
    row.metadataJson,
    `workspace search artifact metadata ${row.id}`
  ),
  config: parseStoredJsonOrUndefined<Artifact['config']>(
    row.configJson,
    `workspace search artifact config ${row.id}`
  ),
});

export class WorkspaceSearchRepository {
  static async getWorkspaceContextBundle(
    workspaceId: string,
    query: string,
    options?: { limit?: number }
  ): Promise<WorkspaceContextBundle> {
    const db = getDB();
    const workspaceRows = await db.select().from(cases).where(eq(cases.id, workspaceId));
    const workspace = workspaceRows[0];

    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} was not found.`);
    }

    const workspaceIdentity = resolveWorkspaceIdentity({
      title: workspace.title,
      displayTitle: workspace.displayTitle || undefined,
      launchTopic: workspace.launchTopic || undefined,
      launchAngle: workspace.launchAngle || undefined,
      prioritySourcesSummary: workspace.prioritySourcesSummary || undefined,
    });

    const reportRows = await db
      .select()
      .from(reports)
      .where(eq(reports.caseId, workspaceId))
      .orderBy(desc(reports.createdAt));
    const reportIds = reportRows.map((row) => row.id);
    const sectionRows = reportIds.length
      ? await db
          .select()
          .from(artifactSections)
          .where(inArray(artifactSections.reportId, reportIds))
      : [];
    const evidenceRows = reportIds.length
      ? await db
          .select()
          .from(artifactEvidence)
          .where(inArray(artifactEvidence.reportId, reportIds))
      : [];
    const entityRows = reportIds.length
      ? await db.select().from(entities).where(inArray(entities.reportId, reportIds))
      : [];
    const sourceRows = reportIds.length
      ? await db.select().from(sources).where(inArray(sources.reportId, reportIds))
      : [];
    const signalRows = await db
      .select()
      .from(leads)
      .where(eq(leads.caseId, workspaceId))
      .orderBy(desc(leads.timestamp));
    const workspaceItemRows = await db
      .select()
      .from(workspaceItems)
      .where(eq(workspaceItems.workspaceId, workspaceId))
      .orderBy(desc(workspaceItems.updatedAt));

    const reportById = new Map(reportRows.map((row) => [row.id, row]));
    const candidates: WorkspaceContextSnippet[] = [];

    reportRows.forEach((row) => {
      const content = [row.summary || '', row.rawText || ''].filter(Boolean).join('\n');
      const score = scoreCandidate(
        query,
        [row.topic, row.summary || '', row.rawText || ''],
        row.createdAt,
        row.topic
      );

      candidates.push({
        id: `CTX-REPORT-${row.id}`,
        kind: 'REPORT',
        title: row.topic,
        snippet: toSnippet(content || row.topic),
        refId: row.id,
        refKind: 'REPORT',
        score,
        timestamp: row.createdAt,
        metadata: {
          artifactType: row.artifactType || undefined,
          dateStr: row.dateStr || undefined,
        },
      });
    });

    sectionRows.forEach((row) => {
      const parent = row.reportId ? reportById.get(row.reportId) : undefined;
      const items = parseStoredJson<string[]>(
        row.itemsJson,
        [],
        `workspace search section items ${row.reportId || 'unknown'}:${row.id}`
      );
      const content = [row.content || '', ...items].join('\n');
      candidates.push({
        id: `CTX-SECTION-${row.id}`,
        kind: 'SECTION',
        title: `${parent?.topic || 'Artifact'}: ${row.title}`,
        snippet: toSnippet(content || row.title),
        refId: row.reportId || undefined,
        refKind: 'REPORT',
        score: scoreCandidate(
          query,
          [row.title, content, parent?.topic || ''],
          parent?.createdAt || 0,
          row.title
        ),
        timestamp: parent?.createdAt,
        metadata: {
          sectionId: row.id,
          sectionKind: row.kind,
        },
      });
    });

    evidenceRows.forEach((row) => {
      const parent = row.reportId ? reportById.get(row.reportId) : undefined;
      const content = [row.summary, row.quote || '', row.sourceTitle || '', row.sourceUrl || '']
        .filter(Boolean)
        .join('\n');
      candidates.push({
        id: `CTX-EVIDENCE-${row.id}`,
        kind: 'SECTION',
        title: `${parent?.topic || 'Artifact'}: ${row.title}`,
        snippet: toSnippet(content || row.title),
        refId: row.reportId || undefined,
        refKind: 'REPORT',
        score: scoreCandidate(
          query,
          [row.title, row.summary, row.quote || '', row.sourceTitle || '', parent?.topic || ''],
          parent?.createdAt || 0,
          row.title
        ),
        timestamp: parent?.createdAt,
        metadata: {
          evidenceId: row.id,
          evidenceKind: row.kind,
          sourceUrl: row.sourceUrl || undefined,
        },
      });
    });

    entityRows.forEach((row) => {
      const parent = row.reportId ? reportById.get(row.reportId) : undefined;
      const descriptor = [row.name, row.role || '', row.type].filter(Boolean).join(' | ');
      candidates.push({
        id: `CTX-ENTITY-${row.id}`,
        kind: 'ENTITY',
        title: `${row.name}${parent ? ` (${parent.topic})` : ''}`,
        snippet: descriptor,
        refId: row.reportId || undefined,
        refKind: 'REPORT',
        score: scoreCandidate(
          query,
          [row.name, row.role || '', row.type, parent?.topic || ''],
          parent?.createdAt || 0,
          row.name
        ),
        timestamp: parent?.createdAt,
        metadata: {
          entityName: row.name,
          entityType: row.type,
          role: row.role || undefined,
        },
      });
    });

    sourceRows.forEach((row) => {
      const parent = row.reportId ? reportById.get(row.reportId) : undefined;
      candidates.push({
        id: `CTX-SOURCE-${row.id}`,
        kind: 'SOURCE',
        title: row.title,
        snippet: toSnippet(row.url),
        refId: row.reportId || undefined,
        refKind: 'REPORT',
        score: scoreCandidate(
          query,
          [row.title, row.url, parent?.topic || ''],
          parent?.createdAt || 0,
          row.title
        ),
        timestamp: parent?.createdAt,
        metadata: {
          url: row.url,
        },
      });
    });

    signalRows.forEach((row) => {
      const parsedTimestamp = row.timestamp ? Date.parse(row.timestamp) : 0;
      candidates.push({
        id: `CTX-SIGNAL-${row.id}`,
        kind: 'SIGNAL',
        title: row.source || row.type || 'Signal',
        snippet: toSnippet(row.content),
        refId: row.id,
        refKind: 'SIGNAL',
        score: scoreCandidate(
          query,
          [row.content, row.source || '', row.type || ''],
          Number.isNaN(parsedTimestamp) ? 0 : parsedTimestamp,
          row.source || row.type || ''
        ),
        timestamp: Number.isNaN(parsedTimestamp) ? undefined : parsedTimestamp,
        metadata: {
          signalType: row.type || undefined,
          threatLevel: row.threatLevel || undefined,
          linkedReportId: row.linkedReportId || undefined,
        },
      });
    });

    workspaceItemRows.forEach((row) => {
      const timestamp = row.updatedAt || row.createdAt;
      const content = [row.description || '', row.textContent || '', row.url || '']
        .filter(Boolean)
        .join('\n');

      candidates.push({
        id: `CTX-WORKSPACE-ITEM-${row.id}`,
        kind: row.kind as WorkspaceContextSnippet['kind'],
        title: row.title,
        snippet: toSnippet(content || row.title),
        refId: row.id,
        refKind: row.kind,
        score: scoreCandidate(
          query,
          [
            row.title,
            row.description || '',
            row.textContent || '',
            row.url || '',
            row.fileName || '',
            row.tagsJson || '',
          ],
          timestamp,
          row.title
        ),
        timestamp,
        metadata: {
          workspaceItemKind: row.kind,
          mimeType: row.mimeType || undefined,
          fileName: row.fileName || undefined,
          url: row.url || undefined,
        },
      });
    });

    const snippets = candidates
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, options?.limit ?? 6);

    const recentArtifacts = reportRows.slice(0, 4).map(toRecentArtifact);
    const recentSignals: Signal[] = signalRows.slice(0, 5).map((row) => ({
      id: row.id,
      caseId: row.caseId || workspaceId,
      content: row.content,
      source: row.source || '',
      url: row.url || undefined,
      timestamp: row.timestamp || new Date().toISOString(),
      type: row.type === 'SOCIAL' || row.type === 'OFFICIAL' ? row.type : 'NEWS',
      status: row.status as 'PENDING' | 'INVESTIGATED' | 'FLAGGED',
      threatLevel: row.threatLevel as 'INFO' | 'CAUTION' | 'CRITICAL',
      linkedReportId: row.linkedReportId || undefined,
    }));

    const summaryParts = [
      workspace.description || `${workspaceIdentity.displayTitle} workspace`,
      workspaceIdentity.launchAngle ? `Angle: ${workspaceIdentity.launchAngle}` : null,
      workspaceIdentity.prioritySourcesSummary
        ? `Priority sources: ${workspaceIdentity.prioritySourcesSummary}`
        : null,
      reportRows.length ? `${reportRows.length} saved artifacts` : 'No saved artifacts yet',
      signalRows.length ? `${signalRows.length} saved signals` : 'No saved signals yet',
    ].filter((part): part is string => !!part);

    return {
      workspace: {
        id: workspace.id,
        scopeId: workspace.scopeId || undefined,
        title: workspace.title,
        displayTitle: workspaceIdentity.displayTitle,
        launchTopic: workspaceIdentity.launchTopic,
        launchAngle: workspaceIdentity.launchAngle,
        prioritySourcesSummary: workspaceIdentity.prioritySourcesSummary,
        status: workspace.status as 'ACTIVE' | 'CLOSED',
        dateOpened: workspace.dateOpened,
        description: workspace.description || undefined,
        mode: (workspace.mode as WorkspaceContextBundle['workspace']['mode']) || undefined,
        packId: workspace.packId || undefined,
        purposeId: workspace.purposeId || undefined,
        labelProfileId: workspace.labelProfileId || undefined,
        metadata: parseStoredJsonOrUndefined<Record<string, unknown>>(
          workspace.metadataJson,
          `workspace search metadata ${workspace.id}`
        ),
      },
      summary: summaryParts.join(' | '),
      recentArtifacts,
      recentSignals,
      snippets,
    };
  }

  static async searchWorkspace(
    workspaceId: string,
    query: string,
    options?: { limit?: number }
  ): Promise<WorkspaceContextSnippet[]> {
    const bundle = await this.getWorkspaceContextBundle(workspaceId, query, options);
    return bundle.snippets;
  }

  static async getArtifactSummary(
    workspaceId: string,
    reportId: string
  ): Promise<Pick<Artifact, 'id' | 'topic' | 'summary' | 'dateStr' | 'artifactType'>> {
    const report = await this.getWorkspaceReport(workspaceId, reportId);
    return {
      id: report.id,
      topic: report.topic,
      summary: report.summary,
      dateStr: report.dateStr,
      artifactType: report.artifactType,
    };
  }

  static async getFullArtifactText(workspaceId: string, reportId: string): Promise<Artifact> {
    return this.getWorkspaceReport(workspaceId, reportId);
  }

  static async getRecentSignals(workspaceId: string, limit = 5): Promise<Signal[]> {
    const signals = await CaseRepository.getSignals();
    return signals
      .filter((signal) => signal.caseId === workspaceId)
      .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
      .slice(0, limit);
  }

  private static async getWorkspaceReport(
    workspaceId: string,
    reportId: string
  ): Promise<Artifact> {
    const reports = await CaseRepository.getAllReports();
    const report = reports.find((entry) => entry.id === reportId && entry.caseId === workspaceId);

    if (!report || !report.id) {
      throw new Error(`Artifact ${reportId} was not found in workspace ${workspaceId}.`);
    }

    return report;
  }
}
