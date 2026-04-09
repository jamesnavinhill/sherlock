import { and, eq, desc } from 'drizzle-orm';
import {
  getDB,
  runWriteTransaction,
  type SherlockWriteExecutor,
} from '../client';
import {
  artifactEvidence,
  keyFindings as keyFindingRows,
  artifactSections,
  workspaces,
  artifacts,
  followUps as followUpRows,
  entities,
  sources,
  signals,
} from '../schema';
import {
  buildArtifactFollowUps,
  buildArtifactKeyFindings,
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
  KeyFinding,
  Signal,
  WorkspaceDataBackup,
} from '@/types';
import { ChatRepository } from './ChatRepository';
import { BoardAgentRepository } from './BoardAgentRepository';
import { WorkspaceRunRepository } from './WorkspaceRunRepository';
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
import { isAppIconId } from '@/lib/appIcons';
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
  keyFindings?: unknown;
  agendas?: unknown;
  leads?: unknown;
  sections?: unknown;
  followUps?: unknown;
  methodology?: unknown;
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
    'signals',
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

const deleteArtifactDependencies = async (
  artifactIds: string[],
  db: SherlockWriteExecutor = getDB()
) => {
  if (artifactIds.length === 0) return;
  for (const artifactId of artifactIds) {
    await db.delete(followUpRows).where(eq(followUpRows.artifactId, artifactId));
    await db.delete(keyFindingRows).where(eq(keyFindingRows.artifactId, artifactId));
    await db.delete(artifactSections).where(eq(artifactSections.artifactId, artifactId));
    await db.delete(artifactEvidence).where(eq(artifactEvidence.artifactId, artifactId));
    await db.delete(entities).where(eq(entities.artifactId, artifactId));
    await db.delete(sources).where(eq(sources.artifactId, artifactId));
  }
};

const mapWorkspaceRow = (row: typeof workspaces.$inferSelect): Workspace => {
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
    iconId: isAppIconId(row.iconId) ? row.iconId : undefined,
    metadata: parseStoredJsonOrUndefined<Record<string, unknown>>(
      row.metadataJson,
      `workspace metadata ${row.id}`
    ),
  };
};

export class WorkspaceRepository {
  // --- WORKSPACES ---
  static async getAllWorkspaces(): Promise<Workspace[]> {
    const db = getDB();
    const rows = await db.select().from(workspaces).orderBy(desc(workspaces.updatedAt));

    return mapRowsSafely(rows, {
      label: 'workspace row',
      getRowId: (row) => row.id,
      mapRow: mapWorkspaceRow,
    });
  }

  static async getWorkspaceById(id: string): Promise<Workspace | null> {
    const db = getDB();
    const result = await db.select().from(workspaces).where(eq(workspaces.id, id));

    if (result.length === 0) return null;

    return mapWorkspaceRow(result[0]);
  }

  static async createWorkspace(
    workspace: Workspace,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    const createdAt = workspace.createdAt ?? Date.now();
    const updatedAt = workspace.updatedAt ?? createdAt;
    const identity = resolveWorkspaceIdentity(workspace);
    await db.insert(workspaces).values({
      id: workspace.id,
      scopeId: workspace.scopeId,
      title: workspace.title,
      displayTitle: identity.displayTitle,
      launchTopic: identity.launchTopic,
      launchAngle: identity.launchAngle,
      prioritySourcesSummary: identity.prioritySourcesSummary,
      status: workspace.status,
      dateOpened: workspace.dateOpened,
      description: workspace.description,
      mode: workspace.mode,
      packId: workspace.packId,
      purposeId: workspace.purposeId,
      labelProfileId: workspace.labelProfileId,
      iconId: workspace.iconId,
      metadataJson: serializeStoredJsonOrNull(workspace.metadata),
      createdAt,
      updatedAt,
    });
  }

  static async updateWorkspace(
    id: string,
    patch: Partial<
      Pick<
        Workspace,
        | 'title'
        | 'displayTitle'
        | 'launchTopic'
        | 'launchAngle'
        | 'prioritySourcesSummary'
        | 'description'
        | 'status'
        | 'scopeId'
        | 'mode'
        | 'packId'
        | 'purposeId'
        | 'labelProfileId'
        | 'iconId'
        | 'metadata'
      >
    >,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    const current = await this.getWorkspaceById(id);
    if (!current) return;

    const merged = {
      ...current,
      ...patch,
      metadata:
        patch.metadata === undefined
          ? current.metadata
          : patch.metadata,
    };
    const identity = resolveWorkspaceIdentity(merged);

    await db
      .update(workspaces)
      .set({
        scopeId: merged.scopeId,
        title: merged.title,
        displayTitle: identity.displayTitle,
        launchTopic: identity.launchTopic,
        launchAngle: identity.launchAngle,
        prioritySourcesSummary: identity.prioritySourcesSummary,
        status: merged.status,
        description: merged.description,
        mode: merged.mode,
        packId: merged.packId,
        purposeId: merged.purposeId,
        labelProfileId: merged.labelProfileId,
        iconId: merged.iconId,
        metadataJson: serializeStoredJsonOrNull(merged.metadata),
        updatedAt: Date.now(),
      })
      .where(eq(workspaces.id, id));
  }

  // --- ARTIFACTS ---
  static async getAllArtifacts(): Promise<Artifact[]> {
    const db = getDB();
    // Join artifacts with entities and sources would be ideal, but for now we fetch artifacts and hydrate
    // Drizzle's with query is powerful for this if relationships are defined, but here we'll keep it simple for now

    // Fetch all artifacts
    const artifactRows = await db.select().from(artifacts).orderBy(desc(artifacts.createdAt));

    // This N+1 query pattern is inefficient for large datasets, but okay for MVP client-side DB
    // Optimization: Use separate queries to fetch all entities/sources and map them in memory
    const allEntities = await db.select().from(entities);
    const allSources = await db.select().from(sources);
    const allFollowUps = await db.select().from(followUpRows);
    const allKeyFindings = await db.select().from(keyFindingRows);
    const allSections = await db.select().from(artifactSections);
    const allEvidence = await db.select().from(artifactEvidence);

    return mapRowsSafely(artifactRows, {
      label: 'artifact row',
      getRowId: (row) => row.id,
      mapRow: (row) => {
      const rawPayload = parseRawReportPayload(row.rawText);

      const artifactEntities = allEntities
        .filter((e) => e.artifactId === row.id)
        .map((e) => ({
          name: e.name,
          type: e.type as Entity['type'],
          role: e.role || undefined,
          sentiment: e.sentiment as Entity['sentiment'],
        }));
      const parsedEntities = toEntityList(rawPayload.entities);

      const artifactSources = allSources
        .filter((s) => s.artifactId === row.id)
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
      const artifactKeyFindings = allKeyFindings
        .filter((finding) => finding.artifactId === row.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(
          (finding): KeyFinding => ({
            id: finding.id,
            workspaceId: finding.workspaceId || undefined,
            originArtifactId: finding.artifactId,
            originSectionId: finding.sectionId || undefined,
            title: finding.title,
            summary: finding.summary,
            supportRefs: parseStoredJsonOrUndefined<string[]>(
              finding.supportRefsJson,
              `key finding support refs ${finding.id}`
            ),
            metadata: parseStoredJsonOrUndefined<Record<string, unknown>>(
              finding.metadataJson,
              `key finding metadata ${finding.id}`
            ),
            createdAt: finding.createdAt,
            updatedAt: finding.updatedAt,
            order: finding.sortOrder,
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
              workspaceId: row.workspaceId || undefined,
            });
      const reportSections = allSections
        .filter((section) => section.artifactId === row.id)
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
      const canonicalKeyFindings =
        artifactKeyFindings.length > 0
          ? artifactKeyFindings
          : buildArtifactKeyFindings({
              keyFindings: rawPayload.keyFindings,
              sections: reportSections,
              legacyAgendas: parsedAgendas,
              artifactId: row.id,
              workspaceId: row.workspaceId || undefined,
              createdAt: row.createdAt,
            });
      const metadataPayload = row.metadataJson
        ? parseStoredJson<ReportMetadataPayload>(
            row.metadataJson,
            {},
            `artifact metadata ${row.id}`
          )
        : undefined;
      const evidenceRows = allEvidence
        .filter((evidence) => evidence.artifactId === row.id)
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
        keyFindings: canonicalKeyFindings,
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
        workspaceId: row.workspaceId || undefined,
        topic: normalizeTopicText(row.topic),
        dateStr: row.dateStr || undefined,
        createdAt: row.createdAt,
        summary: normalizeHumanText(row.summary, { includePriority: false }),
        rawText: row.rawText || '',
        config: parseStoredJsonOrUndefined<Artifact['config']>(
          row.configJson,
          `artifact config ${row.id}`
        ),
        entities: artifactEntities.length > 0 ? artifactEntities : parsedEntities,
        sources: artifactSources.length > 0 ? artifactSources : parsedSources,
        agendas: parsedAgendas,
        leads: toFollowUpTexts(canonicalFollowUps),
        keyFindings: canonicalKeyFindings,
        sections,
        followUps: canonicalFollowUps,
        artifactType: (row.artifactType as Artifact['artifactType']) || undefined,
      });

      return {
        id: row.id,
        workspaceId: row.workspaceId || undefined,
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
        entities: artifactEntities.length > 0 ? artifactEntities : parsedEntities,
        sources: artifactSources.length > 0 ? artifactSources : parsedSources,
        keyFindings: canonicalKeyFindings,
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

  static async createArtifact(report: Artifact, db?: SherlockWriteExecutor): Promise<void> {
    return runWriteTransaction(async (tx) => {
      const executor = db ?? tx;

      const now = report.createdAt ?? Date.now();
      if (!report.id) {
        throw new Error('Artifact must have an id before persistence.');
      }
      const artifactId = report.id;
      const normalizedTopic = normalizeTopicText(report.topic);
      const normalizedSummary = normalizeHumanText(report.summary, {
        includePriority: false,
        fallback: 'Analysis pending...',
      });
      const canonicalFollowUps = buildArtifactFollowUps({
        existing: report.followUps,
        leads: report.leads,
        artifactId,
        workspaceId: report.workspaceId,
        sourceSignalId: report.config?.sourceSignalId,
        createdAt: now,
      });
      const canonicalKeyFindings = buildArtifactKeyFindings({
        existing: report.keyFindings,
        sections: report.sections,
        legacyAgendas: report.agendas,
        artifactId,
        workspaceId: report.workspaceId,
        createdAt: now,
      });
      const canonicalSections = buildArtifactSections({
        sections: report.sections,
        summary: normalizedSummary,
        agendas: report.agendas,
        leads: report.leads,
        keyFindings: canonicalKeyFindings,
        followUps: canonicalFollowUps,
        evidence: report.evidence,
        artifactType: report.artifactType,
      });

      const metadataPayload: ReportMetadataPayload | undefined =
        report.metadata || report.provenance
          ? {
              ...(report.metadata || {}),
              ...(report.provenance ? { provenance: report.provenance } : {}),
            }
          : undefined;

      await executor.insert(artifacts).values({
        id: artifactId,
        workspaceId: report.workspaceId,
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

      // Insert entities
      if (report.entities && report.entities.length > 0) {
        for (const entity of report.entities) {
          const entityObj =
            typeof entity === 'string' ? { name: entity, type: 'UNKNOWN' as const } : entity;

          await executor.insert(entities).values({
            id: createLocalId('ent'),
            artifactId,
            name: entityObj.name,
            type: entityObj.type,
            role: entityObj.role,
            sentiment: entityObj.sentiment,
          });
        }
      }

      // Insert sources
      if (report.sources && report.sources.length > 0) {
        for (const source of report.sources) {
          await executor.insert(sources).values({
            id: createLocalId('src'),
            artifactId,
            title: source.title,
            url: source.url,
          });
        }
      }

      if (canonicalFollowUps.length > 0) {
        for (const [index, followUp] of canonicalFollowUps.entries()) {
          await executor.insert(followUpRows).values({
            id: followUp.id,
            workspaceId: followUp.workspaceId || report.workspaceId,
            artifactId,
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

      if (canonicalKeyFindings.length > 0) {
        for (const [index, finding] of canonicalKeyFindings.entries()) {
          await executor.insert(keyFindingRows).values({
            id: finding.id,
            workspaceId: finding.workspaceId || report.workspaceId,
            artifactId,
            sectionId: finding.originSectionId,
            title: finding.title,
            summary: finding.summary,
            supportRefsJson: serializeStoredJsonOrNull(finding.supportRefs),
            metadataJson: serializeStoredJsonOrNull(finding.metadata),
            sortOrder: typeof finding.order === 'number' ? finding.order : index,
            createdAt: finding.createdAt ?? now,
            updatedAt: finding.updatedAt ?? now,
          });
        }
      }

      if (canonicalSections && canonicalSections.length > 0) {
        for (const [index, section] of canonicalSections.entries()) {
          await executor.insert(artifactSections).values({
            id: section.id || `sec-${artifactId}-${index}`,
            artifactId,
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
            id: evidence.id || `evidence-${artifactId}-${index}`,
            artifactId,
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
          .update(signals)
          .set({ linkedArtifactId: artifactId })
          .where(eq(signals.id, report.config.sourceSignalId));
      }

      if (report.config?.sourceFollowUpId) {
        await executor
          .update(followUpRows)
          .set({
            status: 'RESOLVED',
            resolvedByArtifactId: artifactId,
            updatedAt: now,
          })
          .where(eq(followUpRows.id, report.config.sourceFollowUpId));
      }

      // Update parent workspace timestamp
      if (report.workspaceId) {
        await executor
          .update(workspaces)
          .set({ updatedAt: now })
          .where(eq(workspaces.id, report.workspaceId));
      }
    }, db);
  }

  static async updateArtifactTopic(artifactId: string, topic: string): Promise<void> {
    const db = getDB();
    await db
      .update(artifacts)
      .set({ topic: normalizeTopicText(topic) })
      .where(eq(artifacts.id, artifactId));
  }

  static async updateArtifactSummary(artifactId: string, summary: string): Promise<void> {
    const db = getDB();
    await db
      .update(artifacts)
      .set({
        summary: normalizeHumanText(summary, {
          includePriority: false,
          fallback: 'Analysis pending...',
        }),
      })
      .where(eq(artifacts.id, artifactId));
  }

  static async updateArtifactSection(
    artifactId: string,
    sectionId: string,
    patch: Partial<Pick<ArtifactSection, 'title' | 'content' | 'items' | 'order'>>
  ): Promise<void> {
    const db = getDB();
    const reportRows = await db
      .select({ workspaceId: artifacts.workspaceId })
      .from(artifacts)
      .where(eq(artifacts.id, artifactId));

    await db
      .update(artifactSections)
      .set({
        title: typeof patch.title === 'string' ? patch.title : undefined,
        content: typeof patch.content === 'string' ? patch.content : undefined,
        itemsJson:
          patch.items !== undefined ? serializeStoredJsonOrNull(patch.items) : undefined,
        sortOrder: typeof patch.order === 'number' ? patch.order : undefined,
      })
      .where(and(eq(artifactSections.artifactId, artifactId), eq(artifactSections.id, sectionId)));

    const workspaceId = reportRows[0]?.workspaceId;
    if (workspaceId) {
      await db.update(workspaces).set({ updatedAt: Date.now() }).where(eq(workspaces.id, workspaceId));
    }
  }

  static async appendSectionToArtifact(
    artifactId: string,
    section: ArtifactSection
  ): Promise<void> {
    const db = getDB();
    const existingSections = await db
      .select({ sortOrder: artifactSections.sortOrder })
      .from(artifactSections)
      .where(eq(artifactSections.artifactId, artifactId));
    const reportRows = await db
      .select({ workspaceId: artifacts.workspaceId })
      .from(artifacts)
      .where(eq(artifacts.id, artifactId));
    const nextSortOrder =
      existingSections.length > 0
        ? Math.max(...existingSections.map((entry) => entry.sortOrder)) + 1
        : 0;

    await db.insert(artifactSections).values({
      id: section.id,
      artifactId,
      kind: section.kind,
      title: section.title,
      content: section.content,
      itemsJson: serializeStoredJsonOrNull(section.items),
      sortOrder: typeof section.order === 'number' ? section.order : nextSortOrder,
    });

    const workspaceId = reportRows[0]?.workspaceId;
    if (workspaceId) {
      await db.update(workspaces).set({ updatedAt: Date.now() }).where(eq(workspaces.id, workspaceId));
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

  static async deleteArtifact(artifactId: string, db?: SherlockWriteExecutor): Promise<void> {
    return runWriteTransaction(async (tx) => {
      const executor = db ?? tx;
      await executor.delete(followUpRows).where(eq(followUpRows.artifactId, artifactId));
      await executor.delete(keyFindingRows).where(eq(keyFindingRows.artifactId, artifactId));
      await executor.delete(artifactSections).where(eq(artifactSections.artifactId, artifactId));
      await executor.delete(artifactEvidence).where(eq(artifactEvidence.artifactId, artifactId));
      await executor.delete(entities).where(eq(entities.artifactId, artifactId));
      await executor.delete(sources).where(eq(sources.artifactId, artifactId));
      await executor.delete(artifacts).where(eq(artifacts.id, artifactId));
    }, db);
  }

  static async unassignArtifactsFromWorkspace(workspaceId: string): Promise<void> {
    const db = getDB();
    await db.update(artifacts).set({ workspaceId: null }).where(eq(artifacts.workspaceId, workspaceId));
  }

  static async deleteWorkspace(workspaceId: string, db?: SherlockWriteExecutor): Promise<void> {
    return runWriteTransaction(async (tx) => {
      const executor = db ?? tx;
      await ChatRepository.deleteSessionsForWorkspace(workspaceId, executor);
      await BoardAgentRepository.deleteSessionsForWorkspace(workspaceId, executor);
      await WorkspaceRunRepository.clearWorkspace(workspaceId, executor);
      await WorkspaceBoardRepository.deleteByWorkspace(workspaceId, executor);
      await WorkspaceItemRepository.deleteByWorkspace(workspaceId, executor);
      await executor.delete(signals).where(eq(signals.workspaceId, workspaceId));
      await ManualDataRepository.removeWorkspaceLinkedData(workspaceId, [], executor);
      await executor.delete(workspaces).where(eq(workspaces.id, workspaceId));
    }, db);
  }

  static async purgeWorkspace(workspaceId: string, db?: SherlockWriteExecutor): Promise<void> {
    return runWriteTransaction(async (tx) => {
      const executor = db ?? tx;
      const reportRows = await executor
      .select({ id: artifacts.id })
      .from(artifacts)
      .where(eq(artifacts.workspaceId, workspaceId));
      const artifactIds = reportRows.map((row) => row.id);

      await deleteArtifactDependencies(artifactIds, executor);
      await ChatRepository.deleteSessionsForWorkspace(workspaceId, executor);
      await BoardAgentRepository.deleteSessionsForWorkspace(workspaceId, executor);
      await WorkspaceRunRepository.deleteByWorkspace(workspaceId, executor);
      await WorkspaceBoardRepository.deleteByWorkspace(workspaceId, executor);
      await WorkspaceItemRepository.deleteByWorkspace(workspaceId, executor);
      await ManualDataRepository.removeWorkspaceLinkedData(workspaceId, artifactIds, executor);
      await executor.delete(artifacts).where(eq(artifacts.workspaceId, workspaceId));
      await executor.delete(signals).where(eq(signals.workspaceId, workspaceId));
      await executor.delete(workspaces).where(eq(workspaces.id, workspaceId));
    }, db);
  }

  static async clearWorkspaceData(db?: SherlockWriteExecutor): Promise<void> {
    return runWriteTransaction(async (tx) => {
      const executor = db ?? tx;
      await ChatRepository.clearAll(executor);
      await BoardAgentRepository.clearAll(executor);
      await WorkspaceRunRepository.clearAll(executor);
      await TemplateRepository.clearAll(executor);
      await WorkspaceBoardRepository.clearAll(executor);
      await WorkspaceItemRepository.clearAll(executor);
      await ManualDataRepository.clearAll(executor);
      await executor.delete(followUpRows);
      await executor.delete(keyFindingRows);
      await executor.delete(artifactSections);
      await executor.delete(artifactEvidence);
      await executor.delete(entities);
      await executor.delete(sources);
      await executor.delete(artifacts);
      await executor.delete(signals);
      await executor.delete(workspaces);
    }, db);
  }

  static async replaceWorkspacesAndArtifacts(
    workspaces: Workspace[],
    artifacts: Artifact[]
  ): Promise<void> {
    await runWriteTransaction(async (tx) => {
      await this.clearWorkspaceData(tx);
      for (const workspace of workspaces) {
        await this.createWorkspace(workspace, tx);
      }
      for (const artifact of artifacts) {
        await this.createArtifact(artifact, tx);
      }
    });
  }

  static async replaceWorkspaceDataBackup(payload: WorkspaceDataBackup): Promise<void> {
    await runWriteTransaction(async (tx) => {
      await this.clearWorkspaceData(tx);

      for (const workspace of payload.workspaces) {
        await this.createWorkspace(workspace, tx);
      }
      for (const artifact of payload.artifacts) {
        await this.createArtifact(artifact, tx);
      }
      for (const run of payload.runs) {
        await WorkspaceRunRepository.create(run, tx);
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

  // --- SIGNALS ---
  static async getSignals(): Promise<Signal[]> {
    const db = getDB();
    const rows = await db.select().from(signals);

    return mapRowsSafely(rows, {
      label: 'signal row',
      getRowId: (row) => row.id,
      mapRow: (row) => ({
        id: row.id,
        workspaceId: row.workspaceId || '',
        content: row.content,
        source: row.source || '',
        url: row.url || undefined,
        timestamp: row.timestamp || new Date().toISOString(),
        type: row.type === 'SOCIAL' || row.type === 'OFFICIAL' ? row.type : 'NEWS',
        status: row.status as Signal['status'],
        threatLevel: (row.threatLevel as Signal['threatLevel']) || 'INFO',
        linkedArtifactId: row.linkedArtifactId || undefined,
      }),
    });
  }

  static async createSignal(
    signal: Signal,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    await db
      .insert(signals)
      .values({
        id: signal.id,
        workspaceId: signal.workspaceId,
        content: signal.content,
        source: signal.source,
        type: signal.type,
        url: signal.url,
        status: signal.status,
        threatLevel: signal.threatLevel,
        linkedArtifactId: signal.linkedArtifactId,
        timestamp: signal.timestamp,
      })
      .onConflictDoUpdate({
        target: signals.id,
        set: {
          workspaceId: signal.workspaceId,
          content: signal.content,
          source: signal.source,
          type: signal.type,
          url: signal.url,
          status: signal.status,
          threatLevel: signal.threatLevel,
          linkedArtifactId: signal.linkedArtifactId,
          timestamp: signal.timestamp,
        },
      });
  }
}
