import { eq } from 'drizzle-orm';
import {
  buildArtifactFollowUps,
  buildArtifactKeyFindings,
  buildArtifactSections,
} from '../../../domain';
import type { Artifact } from '@/types';
import type { SherlockWriteExecutor } from '../client';
import {
  artifactEvidence,
  artifactSections,
  artifacts,
  entities,
  followUps as followUpRows,
  keyFindings as keyFindingRows,
  signals,
  sources,
  workspaces,
} from '../schema';
import {
  normalizeHumanText,
  normalizeTopicText,
} from '../../../utils/textNormalization';
import { createLocalId } from '../../../utils/id';
import { serializeStoredJsonOrNull } from './json';
import type { ArtifactMetadataPayload } from './artifactCompatibility';

export interface ArtifactPersistencePlan {
  artifactId: string;
  workspaceId?: string;
  now: number;
  artifactRow: typeof artifacts.$inferInsert;
  entityRows: Array<typeof entities.$inferInsert>;
  sourceRows: Array<typeof sources.$inferInsert>;
  followUpRows: Array<typeof followUpRows.$inferInsert>;
  keyFindingRows: Array<typeof keyFindingRows.$inferInsert>;
  sectionRows: Array<typeof artifactSections.$inferInsert>;
  evidenceRows: Array<typeof artifactEvidence.$inferInsert>;
  sourceSignalId?: string;
  sourceFollowUpId?: string;
}

export const buildArtifactPersistencePlan = (
  artifact: Artifact
): ArtifactPersistencePlan => {
  if (!artifact.id) {
    throw new Error('Artifact must have an id before persistence.');
  }

  const artifactId = artifact.id;
  const now = artifact.createdAt ?? Date.now();
  const normalizedTopic = normalizeTopicText(artifact.topic);
  const normalizedSummary = normalizeHumanText(artifact.summary, {
    includePriority: false,
    fallback: 'Analysis pending...',
  });
  const canonicalFollowUps = buildArtifactFollowUps({
    existing: artifact.followUps,
    leads: artifact.leads,
    artifactId,
    workspaceId: artifact.workspaceId,
    sourceSignalId: artifact.config?.sourceSignalId,
    createdAt: now,
  });
  const canonicalKeyFindings = buildArtifactKeyFindings({
    existing: artifact.keyFindings,
    sections: artifact.sections,
    legacyAgendas: artifact.agendas,
    artifactId,
    workspaceId: artifact.workspaceId,
    createdAt: now,
  });
  const canonicalSections = buildArtifactSections({
    sections: artifact.sections,
    summary: normalizedSummary,
    agendas: artifact.agendas,
    leads: artifact.leads,
    keyFindings: canonicalKeyFindings,
    followUps: canonicalFollowUps,
    evidence: artifact.evidence,
    artifactType: artifact.artifactType,
  });

  const metadataPayload: ArtifactMetadataPayload | undefined =
    artifact.metadata || artifact.provenance
      ? {
          ...(artifact.metadata || {}),
          ...(artifact.provenance ? { provenance: artifact.provenance } : {}),
        }
      : undefined;

  return {
    artifactId,
    workspaceId: artifact.workspaceId,
    now,
    artifactRow: {
      id: artifactId,
      workspaceId: artifact.workspaceId,
      topic: normalizedTopic,
      dateStr: artifact.dateStr,
      summary: normalizedSummary,
      rawText: artifact.rawText,
      artifactType: artifact.artifactType,
      packId: artifact.packId || artifact.config?.packId,
      purposeId: artifact.purposeId || artifact.config?.purposeId,
      labelProfileId:
        artifact.labelProfileId || artifact.config?.labelProfileId,
      metadataJson: serializeStoredJsonOrNull(metadataPayload),
      configJson: serializeStoredJsonOrNull(artifact.config),
      createdAt: now,
    },
    entityRows: (artifact.entities || []).map((entity) => {
      const entityRecord =
        typeof entity === 'string'
          ? { name: entity, type: 'UNKNOWN' as const }
          : entity;

      return {
        id: createLocalId('ent'),
        artifactId,
        name: entityRecord.name,
        type: entityRecord.type,
        role: entityRecord.role,
        sentiment: entityRecord.sentiment,
      };
    }),
    sourceRows: (artifact.sources || []).map((source) => ({
      id: createLocalId('src'),
      artifactId,
      title: source.title,
      url: source.url,
    })),
    followUpRows: canonicalFollowUps.map((followUp, index) => ({
      id: followUp.id,
      workspaceId: followUp.workspaceId || artifact.workspaceId,
      artifactId,
      sectionId: followUp.originSectionId,
      sourceSignalId:
        followUp.sourceSignalId || artifact.config?.sourceSignalId,
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
    })),
    keyFindingRows: canonicalKeyFindings.map((finding, index) => ({
      id: finding.id,
      workspaceId: finding.workspaceId || artifact.workspaceId,
      artifactId,
      sectionId: finding.originSectionId,
      title: finding.title,
      summary: finding.summary,
      supportRefsJson: serializeStoredJsonOrNull(finding.supportRefs),
      metadataJson: serializeStoredJsonOrNull(finding.metadata),
      sortOrder: typeof finding.order === 'number' ? finding.order : index,
      createdAt: finding.createdAt ?? now,
      updatedAt: finding.updatedAt ?? now,
    })),
    sectionRows: canonicalSections.map((section, index) => ({
      id: section.id || `sec-${artifactId}-${index}`,
      artifactId,
      kind: section.kind,
      title: section.title,
      content: section.content,
      itemsJson: serializeStoredJsonOrNull(section.items),
      sortOrder: typeof section.order === 'number' ? section.order : index,
    })),
    evidenceRows: (artifact.evidence || []).map((evidence, index) => ({
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
    })),
    sourceSignalId: artifact.config?.sourceSignalId,
    sourceFollowUpId: artifact.config?.sourceFollowUpId,
  };
};

export const persistArtifactPlan = async (
  plan: ArtifactPersistencePlan,
  executor: SherlockWriteExecutor
): Promise<void> => {
  await executor.insert(artifacts).values(plan.artifactRow);

  for (const entityRow of plan.entityRows) {
    await executor.insert(entities).values(entityRow);
  }

  for (const sourceRow of plan.sourceRows) {
    await executor.insert(sources).values(sourceRow);
  }

  for (const followUpRow of plan.followUpRows) {
    await executor.insert(followUpRows).values(followUpRow);
  }

  for (const keyFindingRow of plan.keyFindingRows) {
    await executor.insert(keyFindingRows).values(keyFindingRow);
  }

  for (const sectionRow of plan.sectionRows) {
    await executor.insert(artifactSections).values(sectionRow);
  }

  for (const evidenceRow of plan.evidenceRows) {
    await executor.insert(artifactEvidence).values(evidenceRow);
  }

  if (plan.sourceSignalId) {
    await executor
      .update(signals)
      .set({ linkedArtifactId: plan.artifactId })
      .where(eq(signals.id, plan.sourceSignalId));
  }

  if (plan.sourceFollowUpId) {
    await executor
      .update(followUpRows)
      .set({
        status: 'RESOLVED',
        resolvedByArtifactId: plan.artifactId,
        updatedAt: plan.now,
      })
      .where(eq(followUpRows.id, plan.sourceFollowUpId));
  }

  if (plan.workspaceId) {
    await executor
      .update(workspaces)
      .set({ updatedAt: plan.now })
      .where(eq(workspaces.id, plan.workspaceId));
  }
};
