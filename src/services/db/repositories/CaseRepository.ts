import { and, eq, desc } from 'drizzle-orm';
import {
  getDB,
  runWriteTransaction,
  type SherlockWriteExecutor,
} from '../client';
import {
  artifactEvidence,
  artifactSections,
  cases,
  reports,
  followUps as followUpRows,
  entities,
  sources,
  leads,
} from '../schema';
import {
  buildArtifactFollowUps,
  buildArtifactSections,
  resolveWorkspaceIdentity,
  toFollowUpTexts,
  toLegacyReportArrays,
} from '../../../domain';
import type {
  ArtifactSection,
  Workspace,
  Artifact,
  Entity,
  FollowUp,
  Signal,
  WorkspaceDataBackup,
} from '@/types';
import { ChatRepository } from './ChatRepository';
import { BoardAgentRepository } from './BoardAgentRepository';
import { TaskRepository } from './TaskRepository';
import { TemplateRepository } from './TemplateRepository';
import { ManualDataRepository } from './ManualDataRepository';
import { WorkspaceBoardRepository } from './WorkspaceBoardRepository';
import { WorkspaceItemRepository } from './WorkspaceItemRepository';
import { SettingsRepository } from './SettingsRepository';
import {
  normalizeHumanText,
  normalizeTopicText,
  unwrapArrayContainer,
} from '../../../utils/textNormalization';
import { createLocalId } from '../../../utils/id';
import { getWorkspaceDataSignals } from '../../maintenance/workspaceData';
import {
  mapRowsSafely,
  parseStoredJson,
  parseStoredJsonOrUndefined,
  serializeStoredJsonOrNull,
} from './json';

interface RawReportPayload {
  summary?: string;
  entities?: unknown;
  sources?: unknown;
  agendas?: unknown;
  leads?: unknown;
  sections?: unknown;
}

interface ReportMetadataPayload {
  provenance?: Artifact['provenance'];
  [key: string]: unknown;
}

const parseRawReportPayload = (rawText: string | null): RawReportPayload => {
  if (!rawText) return {};
  const parsed = parseStoredJson<RawReportPayload | null>(rawText, null, 'artifact raw payload');
  return parsed && typeof parsed === 'object' ? parsed : {};
};

const toEntityList = (value: unknown): Entity[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): Entity | null => {
      if (typeof item === 'string') {
        return { name: item, type: 'UNKNOWN' };
      }
      if (!item || typeof item !== 'object') return null;
      const entity = item as Partial<Entity>;
      if (!entity.name || typeof entity.name !== 'string') return null;
      return {
        name: entity.name,
        type: entity.type === 'PERSON' || entity.type === 'ORGANIZATION' ? entity.type : 'UNKNOWN',
        role: typeof entity.role === 'string' ? entity.role : undefined,
        sentiment:
          entity.sentiment === 'POSITIVE' ||
          entity.sentiment === 'NEGATIVE' ||
          entity.sentiment === 'NEUTRAL'
            ? entity.sentiment
            : undefined,
      };
    })
    .filter((item): item is Entity => !!item);
};

const toStringList = (value: unknown): string[] => {
  const list = unwrapArrayContainer(value, [
    'leads',
    'agendas',
    'items',
    'results',
    'data',
    'list',
  ]);
  const items =
    list.length > 0
      ? list
      : value && typeof value === 'object' && !Array.isArray(value)
        ? [value]
        : [];

  return items.map((item) => normalizeHumanText(item).trim()).filter((item) => item.length > 0);
};

const toSourceList = (value: unknown): Artifact['sources'] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): { title: string; url: string } | null => {
      if (!item || typeof item !== 'object') return null;
      const source = item as { title?: unknown; url?: unknown; uri?: unknown };
      const title =
        typeof source.title === 'string' && source.title.trim().length > 0
          ? source.title.trim()
          : 'Untitled Source';
      const rawUrl =
        typeof source.url === 'string'
          ? source.url
          : typeof source.uri === 'string'
            ? source.uri
            : '';
      if (!rawUrl) return null;
      return { title, url: rawUrl };
    })
    .filter((item): item is { title: string; url: string } => !!item);
};

const deleteReportDependencies = async (
  reportIds: string[],
  db: SherlockWriteExecutor = getDB()
) => {
  if (reportIds.length === 0) return;
  for (const reportId of reportIds) {
    await db.delete(followUpRows).where(eq(followUpRows.artifactId, reportId));
    await db.delete(artifactSections).where(eq(artifactSections.reportId, reportId));
    await db.delete(artifactEvidence).where(eq(artifactEvidence.reportId, reportId));
    await db.delete(entities).where(eq(entities.reportId, reportId));
    await db.delete(sources).where(eq(sources.reportId, reportId));
  }
};

const mapCaseRow = (row: typeof cases.$inferSelect): Workspace => {
  const identity = resolveWorkspaceIdentity({
    title: row.title,
    displayTitle: row.displayTitle || undefined,
    launchTopic: row.launchTopic || undefined,
    launchAngle: row.launchAngle || undefined,
    prioritySourcesSummary: row.prioritySourcesSummary || undefined,
  });

  return {
    id: row.id,
    scopeId: row.scopeId || undefined,
    title: row.title,
    displayTitle: identity.displayTitle,
    launchTopic: identity.launchTopic,
    launchAngle: identity.launchAngle,
    prioritySourcesSummary: identity.prioritySourcesSummary,
    status: row.status as 'ACTIVE' | 'CLOSED',
    dateOpened: row.dateOpened,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    description: row.description || undefined,
    mode: (row.mode as Workspace['mode']) || undefined,
    packId: row.packId || undefined,
    purposeId: row.purposeId || undefined,
    labelProfileId: row.labelProfileId || undefined,
    metadata: parseStoredJsonOrUndefined<Record<string, unknown>>(
      row.metadataJson,
      `workspace metadata ${row.id}`
    ),
  };
};

export class CaseRepository {
  // --- CASES ---
  static async getAllCases(): Promise<Workspace[]> {
    const db = getDB();
    const rows = await db.select().from(cases).orderBy(desc(cases.updatedAt));

    return mapRowsSafely(rows, {
      label: 'workspace row',
      getRowId: (row) => row.id,
      mapRow: mapCaseRow,
    });
  }

  static async getCaseById(id: string): Promise<Workspace | null> {
    const db = getDB();
    const result = await db.select().from(cases).where(eq(cases.id, id));

    if (result.length === 0) return null;

    return mapCaseRow(result[0]);
  }

  static async createCase(
    caseData: Workspace,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    const createdAt = caseData.createdAt ?? Date.now();
    const updatedAt = caseData.updatedAt ?? createdAt;
    const identity = resolveWorkspaceIdentity(caseData);
    await db.insert(cases).values({
      id: caseData.id,
      scopeId: caseData.scopeId,
      title: caseData.title,
      displayTitle: identity.displayTitle,
      launchTopic: identity.launchTopic,
      launchAngle: identity.launchAngle,
      prioritySourcesSummary: identity.prioritySourcesSummary,
      status: caseData.status,
      dateOpened: caseData.dateOpened,
      description: caseData.description,
      mode: caseData.mode,
      packId: caseData.packId,
      purposeId: caseData.purposeId,
      labelProfileId: caseData.labelProfileId,
      metadataJson: serializeStoredJsonOrNull(caseData.metadata),
      createdAt,
      updatedAt,
    });
  }

  // --- REPORTS ---
  static async getAllReports(): Promise<Artifact[]> {
    const db = getDB();
    // Join reports with entities and sources would be ideal, but for now we fetch reports and hydrate
    // Drizzle's with query is powerful for this if relationships are defined, but here we'll keep it simple for now

    // Fetch all reports
    const reportRows = await db.select().from(reports).orderBy(desc(reports.createdAt));

    // This N+1 query pattern is inefficient for large datasets, but okay for MVP client-side DB
    // Optimization: Use separate queries to fetch all entities/sources and map them in memory
    const allEntities = await db.select().from(entities);
    const allSources = await db.select().from(sources);
    const allFollowUps = await db.select().from(followUpRows);
    const allSections = await db.select().from(artifactSections);
    const allEvidence = await db.select().from(artifactEvidence);

    return mapRowsSafely(reportRows, {
      label: 'artifact row',
      getRowId: (row) => row.id,
      mapRow: (row) => {
      const rawPayload = parseRawReportPayload(row.rawText);

      const reportEntities = allEntities
        .filter((e) => e.reportId === row.id)
        .map((e) => ({
          name: e.name,
          type: e.type as Entity['type'],
          role: e.role || undefined,
          sentiment: e.sentiment as Entity['sentiment'],
        }));
      const parsedEntities = toEntityList(rawPayload.entities);

      const reportSources = allSources
        .filter((s) => s.reportId === row.id)
        .map((s) => ({
          title: s.title,
          url: s.url,
        }));
      const reportFollowUps = allFollowUps
        .filter((followUp) => followUp.artifactId === row.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(
          (followUp): FollowUp => ({
            id: followUp.id,
            workspaceId: followUp.workspaceId || undefined,
            originArtifactId: followUp.artifactId,
            originSectionId: followUp.sectionId || undefined,
            sourceSignalId: followUp.sourceSignalId || undefined,
            kind: followUp.kind as FollowUp['kind'],
            title: followUp.title,
            actionText: followUp.actionText,
            status: followUp.status as FollowUp['status'],
            entityRefs: parseStoredJsonOrUndefined<string[]>(
              followUp.entityRefsJson,
              `follow-up entity refs ${followUp.id}`
            ),
            sourceRefs: parseStoredJsonOrUndefined<string[]>(
              followUp.sourceRefsJson,
              `follow-up source refs ${followUp.id}`
            ),
            resolvedByArtifactId: followUp.resolvedByArtifactId || undefined,
            metadata: parseStoredJsonOrUndefined<Record<string, unknown>>(
              followUp.metadataJson,
              `follow-up metadata ${followUp.id}`
            ),
            createdAt: followUp.createdAt,
            updatedAt: followUp.updatedAt,
          })
        );
      const parsedSources = toSourceList(rawPayload.sources);
      const parsedAgendas = toStringList(rawPayload.agendas);
      const parsedLeads = toStringList(rawPayload.leads);
      const canonicalFollowUps =
        reportFollowUps.length > 0
          ? reportFollowUps
          : buildArtifactFollowUps({
              leads: parsedLeads,
              followUps: toStringList((rawPayload as { followUps?: unknown }).followUps),
              artifactId: row.id,
              workspaceId: row.caseId || undefined,
            });
      const reportSections = allSections
        .filter((section) => section.reportId === row.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section) => ({
          id: section.id,
          kind: section.kind as NonNullable<Artifact['sections']>[number]['kind'],
          title: section.title,
          content: section.content || undefined,
          items: parseStoredJsonOrUndefined<string[]>(
            section.itemsJson,
            `artifact section items ${row.id}:${section.id}`
          ),
          order: section.sortOrder,
        }));
      const metadataPayload = row.metadataJson
        ? parseStoredJson<ReportMetadataPayload>(
            row.metadataJson,
            {},
            `artifact metadata ${row.id}`
          )
        : undefined;
      const evidenceRows = allEvidence
        .filter((evidence) => evidence.reportId === row.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((evidence) => ({
          id: evidence.id,
          kind: evidence.kind as NonNullable<Artifact['evidence']>[number]['kind'],
          title: evidence.title,
          summary: evidence.summary,
          quote: evidence.quote || undefined,
          sourceTitle: evidence.sourceTitle || undefined,
          sourceUrl: evidence.sourceUrl || undefined,
          sectionId: evidence.sectionId || undefined,
          tags: parseStoredJsonOrUndefined<string[]>(
            evidence.tagsJson,
            `artifact evidence tags ${evidence.id}`
          ),
          metadata: parseStoredJsonOrUndefined<Record<string, unknown>>(
            evidence.metadataJson,
            `artifact evidence metadata ${evidence.id}`
          ),
          order: evidence.sortOrder,
        }));

      const sections = buildArtifactSections({
        sections: reportSections.length > 0 ? reportSections : rawPayload.sections,
        summary: normalizeHumanText(row.summary, { includePriority: false }),
        agendas: parsedAgendas,
        leads: parsedLeads,
        followUps: canonicalFollowUps,
        methodology:
          typeof (rawPayload as { methodology?: unknown }).methodology === 'string'
            ? (rawPayload as { methodology?: string }).methodology
            : undefined,
        evidence: evidenceRows,
        artifactType: (row.artifactType as Artifact['artifactType']) || undefined,
      });

      const legacyArrays = toLegacyReportArrays({
        id: row.id,
        caseId: row.caseId || undefined,
        topic: normalizeTopicText(row.topic),
        dateStr: row.dateStr || undefined,
        createdAt: row.createdAt,
        summary: normalizeHumanText(row.summary, { includePriority: false }),
        rawText: row.rawText || '',
        config: parseStoredJsonOrUndefined<Artifact['config']>(
          row.configJson,
          `artifact config ${row.id}`
        ),
        entities: reportEntities.length > 0 ? reportEntities : parsedEntities,
        sources: reportSources.length > 0 ? reportSources : parsedSources,
        agendas: parsedAgendas,
        leads: toFollowUpTexts(canonicalFollowUps),
        sections,
        followUps: canonicalFollowUps,
        artifactType: (row.artifactType as Artifact['artifactType']) || undefined,
      });

      return {
        id: row.id,
        caseId: row.caseId || undefined,
        topic: normalizeTopicText(row.topic),
        dateStr: row.dateStr || undefined,
        createdAt: row.createdAt,
        summary: normalizeHumanText(row.summary, { includePriority: false }),
        rawText: row.rawText || '',
        config: parseStoredJsonOrUndefined<Artifact['config']>(
          row.configJson,
          `artifact config ${row.id}`
        ),
        artifactType: (row.artifactType as Artifact['artifactType']) || undefined,
        packId: row.packId || undefined,
        purposeId: row.purposeId || undefined,
        labelProfileId: row.labelProfileId || undefined,
        metadata: metadataPayload
          ? Object.fromEntries(
              Object.entries(metadataPayload).filter(([key]) => key !== 'provenance')
            )
          : undefined,
        entities: reportEntities.length > 0 ? reportEntities : parsedEntities,
        sources: reportSources.length > 0 ? reportSources : parsedSources,
        agendas: legacyArrays.agendas,
        leads: legacyArrays.leads,
        followUps: legacyArrays.followUps,
        sections,
        evidence: evidenceRows,
        provenance: metadataPayload?.provenance,
      };
      },
    });
  }

  static async createReport(report: Artifact, db?: SherlockWriteExecutor): Promise<void> {
    return runWriteTransaction(async (tx) => {
      const executor = db ?? tx;

      const now = report.createdAt ?? Date.now();
      if (!report.id) {
        throw new Error('Report must have an id before persistence.');
      }
      const reportId = report.id;
      const normalizedTopic = normalizeTopicText(report.topic);
      const normalizedSummary = normalizeHumanText(report.summary, {
        includePriority: false,
        fallback: 'Analysis pending...',
      });
      const canonicalFollowUps = buildArtifactFollowUps({
        existing: report.followUps,
        leads: report.leads,
        artifactId: reportId,
        workspaceId: report.caseId,
        sourceSignalId: report.config?.sourceSignalId,
        createdAt: now,
      });

      const metadataPayload: ReportMetadataPayload | undefined =
        report.metadata || report.provenance
          ? {
              ...(report.metadata || {}),
              ...(report.provenance ? { provenance: report.provenance } : {}),
            }
          : undefined;

      await executor.insert(reports).values({
        id: reportId,
        caseId: report.caseId,
        topic: normalizedTopic,
        dateStr: report.dateStr,
        summary: normalizedSummary,
        rawText: report.rawText,
        artifactType: report.artifactType,
        packId: report.packId || report.config?.packId,
        purposeId: report.purposeId || report.config?.purposeId,
        labelProfileId: report.labelProfileId || report.config?.labelProfileId,
        metadataJson: serializeStoredJsonOrNull(metadataPayload),
        configJson: serializeStoredJsonOrNull(report.config),
        createdAt: now,
      });

    // Insert Entities
    if (report.entities && report.entities.length > 0) {
      for (const entity of report.entities) {
        const entityObj =
          typeof entity === 'string' ? { name: entity, type: 'UNKNOWN' as const } : entity;

        await executor.insert(entities).values({
          id: createLocalId('ent'),
          reportId,
          name: entityObj.name,
          type: entityObj.type,
          role: entityObj.role,
          sentiment: entityObj.sentiment,
        });
      }
    }

    // Insert Sources
    if (report.sources && report.sources.length > 0) {
      for (const source of report.sources) {
        await executor.insert(sources).values({
          id: createLocalId('src'),
          reportId,
          title: source.title,
          url: source.url,
        });
      }
    }

    if (canonicalFollowUps.length > 0) {
      for (const [index, followUp] of canonicalFollowUps.entries()) {
        await executor.insert(followUpRows).values({
          id: followUp.id,
          workspaceId: followUp.workspaceId || report.caseId,
          artifactId: reportId,
          sectionId: followUp.originSectionId,
          sourceSignalId: followUp.sourceSignalId || report.config?.sourceSignalId,
          kind: followUp.kind,
          title: followUp.title,
          actionText: followUp.actionText,
          status: followUp.status,
          entityRefsJson: serializeStoredJsonOrNull(followUp.entityRefs),
          sourceRefsJson: serializeStoredJsonOrNull(followUp.sourceRefs),
          resolvedByArtifactId: followUp.resolvedByArtifactId,
          metadataJson: serializeStoredJsonOrNull(followUp.metadata),
          sortOrder: index,
          createdAt: followUp.createdAt ?? now,
          updatedAt: followUp.updatedAt ?? now,
        });
      }
    }

    if (report.sections && report.sections.length > 0) {
      for (const [index, section] of report.sections.entries()) {
        await executor.insert(artifactSections).values({
          id: section.id || `sec-${reportId}-${index}`,
          reportId,
          kind: section.kind,
          title: section.title,
          content: section.content,
          itemsJson: serializeStoredJsonOrNull(section.items),
          sortOrder: typeof section.order === 'number' ? section.order : index,
        });
      }
    }

    if (report.evidence && report.evidence.length > 0) {
      for (const [index, evidence] of report.evidence.entries()) {
        await executor.insert(artifactEvidence).values({
          id: evidence.id || `evidence-${reportId}-${index}`,
          reportId,
          kind: evidence.kind,
          title: evidence.title,
          summary: evidence.summary,
          quote: evidence.quote,
          sourceTitle: evidence.sourceTitle,
          sourceUrl: evidence.sourceUrl,
          sectionId: evidence.sectionId,
          tagsJson: serializeStoredJsonOrNull(evidence.tags),
          metadataJson: serializeStoredJsonOrNull(evidence.metadata),
          sortOrder: typeof evidence.order === 'number' ? evidence.order : index,
        });
      }
    }

    if (report.config?.sourceSignalId) {
      await executor
        .update(leads)
        .set({ linkedReportId: reportId })
        .where(eq(leads.id, report.config.sourceSignalId));
    }

    if (report.config?.sourceFollowUpId) {
      await executor
        .update(followUpRows)
        .set({
          status: 'RESOLVED',
          resolvedByArtifactId: reportId,
          updatedAt: now,
        })
        .where(eq(followUpRows.id, report.config.sourceFollowUpId));
    }

    // Update parent case timestamp
    if (report.caseId) {
      await executor.update(cases).set({ updatedAt: now }).where(eq(cases.id, report.caseId));
    }
    }, db);
  }

  static async updateReportTopic(reportId: string, topic: string): Promise<void> {
    const db = getDB();
    await db
      .update(reports)
      .set({ topic: normalizeTopicText(topic) })
      .where(eq(reports.id, reportId));
  }

  static async updateReportSummary(reportId: string, summary: string): Promise<void> {
    const db = getDB();
    await db
      .update(reports)
      .set({
        summary: normalizeHumanText(summary, {
          includePriority: false,
          fallback: 'Analysis pending...',
        }),
      })
      .where(eq(reports.id, reportId));
  }

  static async updateReportSection(
    reportId: string,
    sectionId: string,
    patch: Partial<Pick<ArtifactSection, 'title' | 'content' | 'items' | 'order'>>
  ): Promise<void> {
    const db = getDB();
    const reportRows = await db
      .select({ caseId: reports.caseId })
      .from(reports)
      .where(eq(reports.id, reportId));

    await db
      .update(artifactSections)
      .set({
        title: typeof patch.title === 'string' ? patch.title : undefined,
        content: typeof patch.content === 'string' ? patch.content : undefined,
        itemsJson:
          patch.items !== undefined ? serializeStoredJsonOrNull(patch.items) : undefined,
        sortOrder: typeof patch.order === 'number' ? patch.order : undefined,
      })
      .where(and(eq(artifactSections.reportId, reportId), eq(artifactSections.id, sectionId)));

    const caseId = reportRows[0]?.caseId;
    if (caseId) {
      await db.update(cases).set({ updatedAt: Date.now() }).where(eq(cases.id, caseId));
    }
  }

  static async appendSectionToReport(reportId: string, section: ArtifactSection): Promise<void> {
    const db = getDB();
    const existingSections = await db
      .select({ sortOrder: artifactSections.sortOrder })
      .from(artifactSections)
      .where(eq(artifactSections.reportId, reportId));
    const reportRows = await db
      .select({ caseId: reports.caseId })
      .from(reports)
      .where(eq(reports.id, reportId));
    const nextSortOrder =
      existingSections.length > 0
        ? Math.max(...existingSections.map((entry) => entry.sortOrder)) + 1
        : 0;

    await db.insert(artifactSections).values({
      id: section.id,
      reportId,
      kind: section.kind,
      title: section.title,
      content: section.content,
      itemsJson: serializeStoredJsonOrNull(section.items),
      sortOrder: typeof section.order === 'number' ? section.order : nextSortOrder,
    });

    const caseId = reportRows[0]?.caseId;
    if (caseId) {
      await db.update(cases).set({ updatedAt: Date.now() }).where(eq(cases.id, caseId));
    }
  }

  static async renameEntity(oldName: string, newName: string): Promise<void> {
    const db = getDB();
    await db.update(entities).set({ name: newName }).where(eq(entities.name, oldName));
  }

  static async resolveFollowUp(
    followUpId: string,
    patch: Pick<FollowUp, 'status' | 'resolvedByArtifactId'> & { updatedAt?: number },
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db
      .update(followUpRows)
      .set({
        status: patch.status,
        resolvedByArtifactId: patch.resolvedByArtifactId || null,
        updatedAt: patch.updatedAt ?? Date.now(),
      })
      .where(eq(followUpRows.id, followUpId));
  }

  static async deleteReport(reportId: string, db?: SherlockWriteExecutor): Promise<void> {
    return runWriteTransaction(async (tx) => {
      const executor = db ?? tx;
      await executor.delete(followUpRows).where(eq(followUpRows.artifactId, reportId));
      await executor.delete(artifactSections).where(eq(artifactSections.reportId, reportId));
      await executor.delete(artifactEvidence).where(eq(artifactEvidence.reportId, reportId));
      await executor.delete(entities).where(eq(entities.reportId, reportId));
      await executor.delete(sources).where(eq(sources.reportId, reportId));
      await executor.delete(reports).where(eq(reports.id, reportId));
    }, db);
  }

  static async unassignReportsFromCase(caseId: string): Promise<void> {
    const db = getDB();
    await db.update(reports).set({ caseId: null }).where(eq(reports.caseId, caseId));
  }

  static async deleteCase(caseId: string, db?: SherlockWriteExecutor): Promise<void> {
    return runWriteTransaction(async (tx) => {
      const executor = db ?? tx;
      await ChatRepository.deleteSessionsForWorkspace(caseId, executor);
      await BoardAgentRepository.deleteSessionsForWorkspace(caseId, executor);
      await TaskRepository.clearWorkspace(caseId, executor);
      await WorkspaceBoardRepository.deleteByWorkspace(caseId, executor);
      await WorkspaceItemRepository.deleteByWorkspace(caseId, executor);
      await executor.delete(leads).where(eq(leads.caseId, caseId));
      await ManualDataRepository.removeWorkspaceLinkedData(caseId, [], executor);
      await executor.delete(cases).where(eq(cases.id, caseId));
    }, db);
  }

  static async purgeCase(caseId: string, db?: SherlockWriteExecutor): Promise<void> {
    return runWriteTransaction(async (tx) => {
      const executor = db ?? tx;
      const reportRows = await executor
      .select({ id: reports.id })
      .from(reports)
      .where(eq(reports.caseId, caseId));
      const reportIds = reportRows.map((row) => row.id);

      await deleteReportDependencies(reportIds, executor);
      await ChatRepository.deleteSessionsForWorkspace(caseId, executor);
      await BoardAgentRepository.deleteSessionsForWorkspace(caseId, executor);
      await TaskRepository.deleteByWorkspace(caseId, executor);
      await WorkspaceBoardRepository.deleteByWorkspace(caseId, executor);
      await WorkspaceItemRepository.deleteByWorkspace(caseId, executor);
      await ManualDataRepository.removeWorkspaceLinkedData(caseId, reportIds, executor);
      await executor.delete(reports).where(eq(reports.caseId, caseId));
      await executor.delete(leads).where(eq(leads.caseId, caseId));
      await executor.delete(cases).where(eq(cases.id, caseId));
    }, db);
  }

  static async clearCaseData(db?: SherlockWriteExecutor): Promise<void> {
    return runWriteTransaction(async (tx) => {
      const executor = db ?? tx;
      await ChatRepository.clearAll(executor);
      await BoardAgentRepository.clearAll(executor);
      await TaskRepository.clearAll(executor);
      await TemplateRepository.clearAll(executor);
      await WorkspaceBoardRepository.clearAll(executor);
      await WorkspaceItemRepository.clearAll(executor);
      await ManualDataRepository.clearAll(executor);
      await executor.delete(followUpRows);
      await executor.delete(artifactSections);
      await executor.delete(artifactEvidence);
      await executor.delete(entities);
      await executor.delete(sources);
      await executor.delete(reports);
      await executor.delete(leads);
      await executor.delete(cases);
    }, db);
  }

  static async importCasesAndReports(caseData: Workspace[], reportData: Artifact[]): Promise<void> {
    await runWriteTransaction(async (tx) => {
      await this.clearCaseData(tx);
      for (const item of caseData) {
        await this.createCase(item, tx);
      }
      for (const report of reportData) {
        await this.createReport(report, tx);
      }
    });
  }

  static async replaceWorkspaceDataBackup(payload: WorkspaceDataBackup): Promise<void> {
    await runWriteTransaction(async (tx) => {
      await this.clearCaseData(tx);

      for (const workspace of payload.workspaces) {
        await this.createCase(workspace, tx);
      }
      for (const artifact of payload.artifacts) {
        await this.createReport(artifact, tx);
      }
      for (const run of payload.runs) {
        await TaskRepository.create(run, tx);
      }
      for (const session of payload.chat.sessions) {
        await ChatRepository.createSession(session, tx);
      }
      for (const message of payload.chat.messages) {
        await ChatRepository.createMessage(message, tx);
      }
      for (const action of payload.chat.actions) {
        await ChatRepository.createAction(action, tx);
      }
      for (const session of payload.boardAgent.sessions) {
        await BoardAgentRepository.createSession(session, tx);
      }
      for (const action of payload.boardAgent.actions) {
        await BoardAgentRepository.createAction(action, tx);
      }
      for (const signal of getWorkspaceDataSignals(payload.signals)) {
        await this.createSignal(signal, tx);
      }
      for (const template of payload.templates) {
        await TemplateRepository.create(template, tx);
      }
      for (const item of payload.workspaceSurface.items) {
        await WorkspaceItemRepository.create(item, tx);
      }
      for (const board of payload.workspaceSurface.boards) {
        await WorkspaceBoardRepository.createBoard(board, tx);
      }
      for (const document of payload.workspaceSurface.boardDocuments) {
        await WorkspaceBoardRepository.upsertDocument(document, tx);
      }

      await ManualDataRepository.saveAllNodes(payload.graph.manualNodes, tx);
      await ManualDataRepository.saveAllLinks(payload.graph.manualLinks, tx);
      await SettingsRepository.setSetting('hidden_nodes', [], tx);
      await SettingsRepository.setSetting('flagged_nodes', [], tx);
    });
  }

  // --- LEADS ---
  static async getSignals(): Promise<Signal[]> {
    const db = getDB();
    const rows = await db.select().from(leads);

    return mapRowsSafely(rows, {
      label: 'signal row',
      getRowId: (row) => row.id,
      mapRow: (row) => ({
        id: row.id,
        caseId: row.caseId || '',
        content: row.content,
        source: row.source || '',
        url: row.url || undefined,
        timestamp: row.timestamp || new Date().toISOString(),
        type: row.type === 'SOCIAL' || row.type === 'OFFICIAL' ? row.type : 'NEWS',
        status: row.status as Signal['status'],
        threatLevel: (row.threatLevel as Signal['threatLevel']) || 'INFO',
        linkedReportId: row.linkedReportId || undefined,
      }),
    });
  }

  static async createSignal(
    signal: Signal,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db
      .insert(leads)
      .values({
        id: signal.id,
        caseId: signal.caseId,
        content: signal.content,
        source: signal.source,
        type: signal.type,
        url: signal.url,
        status: signal.status,
        threatLevel: signal.threatLevel,
        linkedReportId: signal.linkedReportId,
        timestamp: signal.timestamp,
      })
      .onConflictDoUpdate({
        target: leads.id,
        set: {
          caseId: signal.caseId,
          content: signal.content,
          source: signal.source,
          type: signal.type,
          url: signal.url,
          status: signal.status,
          threatLevel: signal.threatLevel,
          linkedReportId: signal.linkedReportId,
          timestamp: signal.timestamp,
        },
      });
  }

  static async getHeadlines(): Promise<Signal[]> {
    return this.getSignals();
  }

  static async createHeadline(
    headline: Signal,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await this.createSignal(headline, db);
  }
}
