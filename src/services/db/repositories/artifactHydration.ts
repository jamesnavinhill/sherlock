import {
  buildArtifactFollowUps,
  buildArtifactKeyFindings,
  buildArtifactSections,
} from '../../../domain';
import type { Artifact, Entity, FollowUp, KeyFinding } from '@/types';
import {
  normalizeHumanText,
  normalizeTopicText,
} from '../../../utils/textNormalization';
import { parseStoredJson, parseStoredJsonOrUndefined } from './json';
import {
  type ArtifactMetadataPayload,
  buildLegacyArtifactArrays,
  parseLegacyArtifactPayload,
} from './artifactCompatibility';

interface ArtifactRow {
  id: string;
  workspaceId: string | null;
  topic: string;
  dateStr: string | null;
  summary: string | null;
  rawText: string | null;
  artifactType: string | null;
  packId: string | null;
  purposeId: string | null;
  labelProfileId: string | null;
  metadataJson: string | null;
  configJson: string | null;
  createdAt: number;
}

interface EntityRow {
  artifactId: string | null;
  name: string;
  type: string;
  role: string | null;
  sentiment: string | null;
}

interface SourceRow {
  artifactId: string | null;
  title: string;
  url: string;
}

interface FollowUpRow {
  id: string;
  workspaceId: string | null;
  artifactId: string;
  sectionId: string | null;
  sourceSignalId: string | null;
  kind: string;
  title: string;
  actionText: string;
  status: string;
  entityRefsJson: string | null;
  sourceRefsJson: string | null;
  resolvedByArtifactId: string | null;
  metadataJson: string | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

interface KeyFindingRow {
  id: string;
  workspaceId: string | null;
  artifactId: string;
  sectionId: string | null;
  title: string;
  summary: string;
  supportRefsJson: string | null;
  metadataJson: string | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

interface ArtifactSectionRow {
  id: string;
  artifactId: string;
  kind: string;
  title: string;
  content: string | null;
  itemsJson: string | null;
  sortOrder: number;
}

interface ArtifactEvidenceRow {
  id: string;
  artifactId: string;
  kind: string;
  title: string;
  summary: string;
  quote: string | null;
  sourceTitle: string | null;
  sourceUrl: string | null;
  sectionId: string | null;
  tagsJson: string | null;
  metadataJson: string | null;
  sortOrder: number;
}

interface ArtifactHydrationInput {
  row: ArtifactRow;
  entityRows: EntityRow[];
  sourceRows: SourceRow[];
  followUpRows: FollowUpRow[];
  keyFindingRows: KeyFindingRow[];
  sectionRows: ArtifactSectionRow[];
  evidenceRows: ArtifactEvidenceRow[];
}

export const hydrateArtifactRow = ({
  row,
  entityRows,
  sourceRows,
  followUpRows,
  keyFindingRows,
  sectionRows,
  evidenceRows,
}: ArtifactHydrationInput): Artifact => {
  const parsedLegacyPayload = parseLegacyArtifactPayload(row.rawText);

  const persistedEntities: Entity[] = entityRows.map((entity) => ({
    name: entity.name,
    type: entity.type as Entity['type'],
    role: entity.role || undefined,
    sentiment: entity.sentiment as Entity['sentiment'],
  }));

  const persistedSources = sourceRows.map((source) => ({
    title: source.title,
    url: source.url,
  }));

  const persistedFollowUps = followUpRows
    .sort((left, right) => left.sortOrder - right.sortOrder)
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

  const persistedKeyFindings = keyFindingRows
    .sort((left, right) => left.sortOrder - right.sortOrder)
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

  const persistedSections = sectionRows
    .sort((left, right) => left.sortOrder - right.sortOrder)
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

  const persistedEvidence = evidenceRows
    .sort((left, right) => left.sortOrder - right.sortOrder)
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

  const canonicalFollowUps =
    persistedFollowUps.length > 0
      ? persistedFollowUps
      : buildArtifactFollowUps({
          leads: parsedLegacyPayload.leads,
          followUps: parsedLegacyPayload.followUpTexts,
          artifactId: row.id,
          workspaceId: row.workspaceId || undefined,
        });

  const canonicalKeyFindings =
    persistedKeyFindings.length > 0
      ? persistedKeyFindings
      : buildArtifactKeyFindings({
          keyFindings: parsedLegacyPayload.rawPayload.keyFindings,
          sections: persistedSections,
          legacyAgendas: parsedLegacyPayload.agendas,
          artifactId: row.id,
          workspaceId: row.workspaceId || undefined,
          createdAt: row.createdAt,
        });

  const normalizedSummary = normalizeHumanText(row.summary, {
    includePriority: false,
  });
  const sections = buildArtifactSections({
    sections:
      persistedSections.length > 0
        ? persistedSections
        : parsedLegacyPayload.rawPayload.sections,
    summary: normalizedSummary,
    agendas: parsedLegacyPayload.agendas,
    leads: parsedLegacyPayload.leads,
    keyFindings: canonicalKeyFindings,
    followUps: canonicalFollowUps,
    methodology: parsedLegacyPayload.methodology,
    evidence: persistedEvidence,
    artifactType: (row.artifactType as Artifact['artifactType']) || undefined,
  });

  const metadataPayload = row.metadataJson
    ? parseStoredJson<ArtifactMetadataPayload>(
        row.metadataJson,
        {},
        `artifact metadata ${row.id}`
      )
    : undefined;
  const config = parseStoredJsonOrUndefined<Artifact['config']>(
    row.configJson,
    `artifact config ${row.id}`
  );

  const artifact: Artifact = {
    id: row.id,
    workspaceId: row.workspaceId || undefined,
    topic: normalizeTopicText(row.topic),
    dateStr: row.dateStr || undefined,
    createdAt: row.createdAt,
    summary: normalizedSummary,
    rawText: row.rawText || '',
    config,
    artifactType: (row.artifactType as Artifact['artifactType']) || undefined,
    packId: row.packId || undefined,
    purposeId: row.purposeId || undefined,
    labelProfileId: row.labelProfileId || undefined,
    metadata: metadataPayload
      ? Object.fromEntries(
          Object.entries(metadataPayload).filter(
            ([key]) => key !== 'provenance'
          )
        )
      : undefined,
    entities:
      persistedEntities.length > 0
        ? persistedEntities
        : parsedLegacyPayload.entities,
    sources:
      persistedSources.length > 0
        ? persistedSources
        : parsedLegacyPayload.sources,
    keyFindings: canonicalKeyFindings,
    agendas: [],
    leads: [],
    followUps: canonicalFollowUps,
    sections,
    evidence: persistedEvidence,
    provenance: metadataPayload?.provenance,
  };

  return {
    ...artifact,
    ...buildLegacyArtifactArrays(artifact),
  };
};
