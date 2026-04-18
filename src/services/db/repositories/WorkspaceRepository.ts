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
  resolveWorkspaceIdentity,
} from '../../../domain';
import type {
  ArtifactSection,
  Workspace,
  Artifact,
  FollowUp,
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
} from '../../../utils/textNormalization';
import { getWorkspaceDataSignals } from '../../maintenance/workspaceData';
import { isAppIconId } from '@/lib/appIcons';
import {
  mapRowsSafely,
  parseStoredJsonOrUndefined,
  serializeStoredJsonOrNull,
} from './json';
import { hydrateArtifactRow } from './artifactHydration';
import {
  buildArtifactPersistencePlan,
  persistArtifactPlan,
} from './artifactPersistence';

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
    const artifactRows = await db.select().from(artifacts).orderBy(desc(artifacts.createdAt));
    const allEntities = await db.select().from(entities);
    const allSources = await db.select().from(sources);
    const allFollowUps = await db.select().from(followUpRows);
    const allKeyFindings = await db.select().from(keyFindingRows);
    const allSections = await db.select().from(artifactSections);
    const allEvidence = await db.select().from(artifactEvidence);
    const groupRowsByArtifactId = <
      TRow extends { artifactId: string | null | undefined }
    >(
      rows: TRow[]
    ) =>
      rows.reduce<Map<string, TRow[]>>((acc, row) => {
        if (!row.artifactId) return acc;
        const next = acc.get(row.artifactId) || [];
        next.push(row);
        acc.set(row.artifactId, next);
        return acc;
      }, new Map<string, TRow[]>());

    const entitiesByArtifactId = groupRowsByArtifactId(allEntities);
    const sourcesByArtifactId = groupRowsByArtifactId(allSources);
    const followUpsByArtifactId = groupRowsByArtifactId(allFollowUps);
    const keyFindingsByArtifactId = groupRowsByArtifactId(allKeyFindings);
    const sectionsByArtifactId = groupRowsByArtifactId(allSections);
    const evidenceByArtifactId = groupRowsByArtifactId(allEvidence);

    return mapRowsSafely(artifactRows, {
      label: 'artifact row',
      getRowId: (row) => row.id,
      mapRow: (row) =>
        hydrateArtifactRow({
          row,
          entityRows: entitiesByArtifactId.get(row.id) || [],
          sourceRows: sourcesByArtifactId.get(row.id) || [],
          followUpRows: followUpsByArtifactId.get(row.id) || [],
          keyFindingRows: keyFindingsByArtifactId.get(row.id) || [],
          sectionRows: sectionsByArtifactId.get(row.id) || [],
          evidenceRows: evidenceByArtifactId.get(row.id) || [],
        }),
    });
  }

  static async createArtifact(report: Artifact, db?: SherlockWriteExecutor): Promise<void> {
    return runWriteTransaction(async (tx) => {
      const executor = db ?? tx;
      const plan = buildArtifactPersistencePlan(report);
      await persistArtifactPlan(plan, executor);
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
