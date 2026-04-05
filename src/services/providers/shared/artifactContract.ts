import { buildArtifactFollowUps, buildArtifactSections, toFollowUpTexts } from '../../../domain';
import type { Artifact, ArtifactEvidence, ArtifactProvenance } from '../../../types';
import type { ArtifactNormalizationOptions, StructuredArtifactPayload } from '../types';
import { toDisplayText } from './jsonParsing';
import {
  dedupeSources,
  extractSourcesFromText,
  normalizeEntities,
  normalizeStringList,
} from './normalizers';

const normalizeEvidenceKind = (value: unknown): ArtifactEvidence['kind'] => {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (
    normalized === 'SOURCE' ||
    normalized === 'QUOTE' ||
    normalized === 'FINDING' ||
    normalized === 'DATA_POINT' ||
    normalized === 'TIMELINE_EVENT' ||
    normalized === 'METHOD'
  ) {
    return normalized;
  }
  return 'SOURCE';
};

const normalizeEvidence = (value: unknown): ArtifactEvidence[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index): ArtifactEvidence | null => {
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Record<string, unknown>;
      const title = toDisplayText(record.title).trim();
      const summary = toDisplayText(
        record.summary ?? record.content ?? record.snippet ?? record.description ?? record.claim
      ).trim();
      if (!title && !summary) return null;

      const tags = Array.isArray(record.tags)
        ? record.tags.filter(
            (tag): tag is string => typeof tag === 'string' && tag.trim().length > 0
          )
        : undefined;

      return {
        id:
          toDisplayText(record.id).trim() ||
          `evidence-${normalizeEvidenceKind(record.kind).toLowerCase()}-${index}`,
        kind: normalizeEvidenceKind(record.kind),
        title: title || summary.slice(0, 72),
        summary: summary || title,
        quote: toDisplayText(record.quote).trim() || undefined,
        sourceTitle:
          toDisplayText(record.sourceTitle ?? record.source_name ?? record.source).trim() ||
          undefined,
        sourceUrl: toDisplayText(record.sourceUrl ?? record.url ?? record.uri).trim() || undefined,
        sectionId: toDisplayText(record.sectionId).trim() || undefined,
        tags,
        metadata:
          record.metadata && typeof record.metadata === 'object'
            ? (record.metadata as Record<string, unknown>)
            : undefined,
        order: typeof record.order === 'number' ? record.order : index,
      };
    })
    .filter((entry): entry is ArtifactEvidence => !!entry);
};

export const buildArtifactFromPayload = (
  payload: StructuredArtifactPayload,
  rawText: string,
  options: ArtifactNormalizationOptions
): Artifact => {
  const agendas = normalizeStringList(payload.agendas);
  const leads = normalizeStringList(payload.leads);
  const followUpTexts = normalizeStringList(payload.followUps);
  const summary = toDisplayText(payload.summary).trim() || 'Analysis pending...';
  const methodology = toDisplayText(payload.methodology).trim() || undefined;
  const payloadEvidence = normalizeEvidence(payload.evidence);
  const evidence = [...payloadEvidence, ...(options.extraEvidence || [])].sort(
    (left, right) => (left.order ?? 0) - (right.order ?? 0)
  );

  const modelSources = Array.isArray(payload.sources)
    ? dedupeSources(
        payload.sources.map((source) => ({
          title: source.title,
          url: source.url,
          uri: source.uri,
        }))
      )
    : [];

  const evidenceSources = dedupeSources(
    evidence.map((item) => ({
      title: item.sourceTitle || item.title,
      url: item.sourceUrl,
    }))
  );

  const textFallbackSources = extractSourcesFromText(
    [rawText, summary, methodology || '', ...leads, ...followUpTexts].join('\n')
  );

  const canonicalFollowUps = buildArtifactFollowUps({
    leads,
    followUps: followUpTexts,
  });
  const legacyFollowUpTexts = toFollowUpTexts(canonicalFollowUps);

  const sources = dedupeSources([
    ...(options.extraSources || []),
    ...modelSources,
    ...evidenceSources,
    ...textFallbackSources,
  ]);

  const sections = buildArtifactSections({
    sections: payload.sections,
    summary,
    agendas,
    leads,
    followUps: canonicalFollowUps,
    evidence,
    methodology,
    artifactType: options.artifactType,
  });

  const provenance: ArtifactProvenance = {
    provider: options.provider,
    modelId: options.modelId,
    generatedAt: new Date().toISOString(),
    requestId: options.requestId,
    warnings: options.warnings?.length ? options.warnings : undefined,
    citations: options.citations?.length ? options.citations : undefined,
    usage: options.usage,
    search: options.searchMetadata,
    metadata: options.extraMetadata,
  };

  return {
    topic: options.topic,
    dateStr: new Date().toLocaleDateString(),
    summary,
    entities: normalizeEntities(payload.entities),
    agendas,
    leads: legacyFollowUpTexts.length > 0 ? legacyFollowUpTexts : leads,
    followUps: canonicalFollowUps,
    sections,
    evidence,
    artifactType: options.artifactType,
    sources,
    provenance,
    rawText,
    packId: options.pack.id,
    purposeId: options.purpose.id,
    labelProfileId: options.labelProfileId,
    metadata: {
      packName: options.pack.name,
      purposeName: options.purpose.name,
      scopeId: options.scopeId,
      workspaceMode: options.pack.workspaceMode,
      warnings: options.warnings,
      ...options.extraMetadata,
    },
    config: {
      provider: options.provider,
      modelId: options.modelId,
      persona: options.extraMetadata?.persona as string | undefined,
      searchDepth: options.extraMetadata?.searchDepth as 'STANDARD' | 'DEEP' | undefined,
      thinkingBudget: options.extraMetadata?.thinkingBudget as number | undefined,
      scopeId: options.scopeId,
      scopeName: options.scopeName,
      packId: options.pack.id,
      packName: options.pack.name,
      purposeId: options.purpose.id,
      purposeName: options.purpose.name,
      artifactType: options.artifactType,
      labelProfileId: options.labelProfileId,
      generationMode: options.generationMode,
    },
  };
};
