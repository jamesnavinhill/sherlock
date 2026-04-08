import type {
  Artifact,
  ArtifactEvidence,
  ArtifactSection,
  ArtifactSectionKind,
  ArtifactType,
  PurposeProfile,
} from '@/types';
import {
  getSectionByKinds,
  getSectionItemsByKinds,
  orderArtifactSections,
} from '@/domain';

export interface ArtifactViewerHighlight {
  label: string;
  value: string;
}

export interface ProvenanceSummaryStat {
  label: string;
  value: string;
  tone?: 'DEFAULT' | 'WARNING' | 'ACCENT';
}

const ARTIFACT_TYPE_SECTION_ORDER: Partial<Record<ArtifactType, ArtifactSectionKind[]>> = {
  BRIEF: ['EXECUTIVE_SUMMARY', 'KEY_FINDINGS', 'IMPLICATIONS', 'NEXT_STEPS', 'EVIDENCE'],
  COMPARISON: ['EXECUTIVE_SUMMARY', 'KEY_FINDINGS', 'IMPLICATIONS', 'EVIDENCE', 'NEXT_STEPS'],
  MONITOR_SNAPSHOT: ['EXECUTIVE_SUMMARY', 'KEY_FINDINGS', 'ANOMALIES', 'NEXT_STEPS', 'EVIDENCE'],
  SYNTHESIS: ['EXECUTIVE_SUMMARY', 'KEY_FINDINGS', 'IMPLICATIONS', 'METHODOLOGY', 'EVIDENCE'],
  TIMELINE: ['EXECUTIVE_SUMMARY', 'TIMELINE', 'KEY_FINDINGS', 'IMPLICATIONS', 'NEXT_STEPS'],
};

const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  REPORT: 'Report',
  SYNTHESIS: 'Synthesis',
  BRIEF: 'Brief',
  DIGEST: 'Digest',
  COMPARISON: 'Comparison',
  TIMELINE: 'Timeline',
  MONITOR_SNAPSHOT: 'Monitor Snapshot',
  NOTE: 'Note',
};

const summarizeText = (value: string, max = 120) =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 3)).trimEnd()}...`;

const normalizeText = (value?: string | null) => value?.replace(/\s+/g, ' ').trim() || '';

const getSectionText = (
  sections: ArtifactSection[],
  kinds: ArtifactSectionKind[],
  fallback = 'Not surfaced in this artifact.'
) => {
  const section = getSectionByKinds(sections, kinds);
  const content = normalizeText(section?.content);
  if (content) {
    return summarizeText(content);
  }

  const item = getSectionItemsByKinds(sections, kinds)[0];
  if (item) {
    return summarizeText(item);
  }

  return fallback;
};

const buildHighlightsForArtifactType = (
  artifactType: ArtifactType | undefined,
  sections: ArtifactSection[],
  evidenceCount: number
): ArtifactViewerHighlight[] => {
  switch (artifactType) {
    case 'BRIEF':
      return [
        { label: 'Takeaways', value: getSectionText(sections, ['KEY_FINDINGS', 'EXECUTIVE_SUMMARY']) },
        { label: 'Implications', value: getSectionText(sections, ['IMPLICATIONS', 'ANOMALIES']) },
        { label: 'Next Actions', value: getSectionText(sections, ['NEXT_STEPS', 'LEADS']) },
      ];
    case 'COMPARISON':
      return [
        { label: 'Key Deltas', value: getSectionText(sections, ['KEY_FINDINGS', 'EXECUTIVE_SUMMARY']) },
        { label: 'Tradeoffs', value: getSectionText(sections, ['IMPLICATIONS', 'ANOMALIES']) },
        {
          label: 'Comparison Depth',
          value: evidenceCount > 0 ? `${evidenceCount} evidence rows support the comparison.` : 'No explicit evidence rows were captured.',
        },
      ];
    case 'MONITOR_SNAPSHOT':
      return [
        {
          label: 'Changed Since Prior Snapshot',
          value: getSectionText(sections, ['KEY_FINDINGS', 'EXECUTIVE_SUMMARY']),
        },
        { label: 'Watchlist', value: getSectionText(sections, ['ANOMALIES', 'LEADS']) },
        { label: 'Escalation Cues', value: getSectionText(sections, ['NEXT_STEPS', 'IMPLICATIONS']) },
      ];
    case 'TIMELINE':
      return [
        { label: 'Chronology Summary', value: getSectionText(sections, ['TIMELINE', 'EXECUTIVE_SUMMARY']) },
        { label: 'Pattern Callouts', value: getSectionText(sections, ['KEY_FINDINGS', 'IMPLICATIONS']) },
        { label: 'Next Actions', value: getSectionText(sections, ['NEXT_STEPS', 'LEADS']) },
      ];
    case 'SYNTHESIS':
      return [
        { label: 'Consensus', value: getSectionText(sections, ['KEY_FINDINGS', 'EXECUTIVE_SUMMARY']) },
        { label: 'Disagreement', value: getSectionText(sections, ['ANOMALIES', 'IMPLICATIONS']) },
        { label: 'Evidence Quality', value: getSectionText(sections, ['METHODOLOGY', 'EVIDENCE']) },
      ];
    default:
      return [
        { label: 'Summary', value: getSectionText(sections, ['EXECUTIVE_SUMMARY', 'KEY_FINDINGS']) },
        { label: 'Evidence', value: getSectionText(sections, ['EVIDENCE', 'METHODOLOGY']) },
        { label: 'Next Actions', value: getSectionText(sections, ['NEXT_STEPS', 'LEADS']) },
      ];
  }
};

export const orderArtifactViewerSections = (
  sections: ArtifactSection[] | undefined,
  purposeProfile?: PurposeProfile,
  artifactType?: ArtifactType
) => {
  const ordered = orderArtifactSections(sections, purposeProfile);
  const artifactTypeOrder = artifactType ? ARTIFACT_TYPE_SECTION_ORDER[artifactType] || [] : [];
  if (artifactTypeOrder.length === 0) return ordered;

  return [...ordered].sort((left, right) => {
    const leftIndex = artifactTypeOrder.indexOf(left.kind);
    const rightIndex = artifactTypeOrder.indexOf(right.kind);

    if (leftIndex !== -1 || rightIndex !== -1) {
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    }

    return (left.order ?? 0) - (right.order ?? 0);
  });
};

export const buildArtifactViewerPresentation = (report: Artifact | null, purposeProfile?: PurposeProfile) => {
  const orderedSections = orderArtifactViewerSections(report?.sections, purposeProfile, report?.artifactType);
  const visibleEvidence = (report?.evidence || []).filter((entry) => normalizeText(entry.summary).length > 0);
  const evidenceBySectionId = visibleEvidence.reduce<Record<string, ArtifactEvidence[]>>((acc, evidence) => {
    if (!evidence.sectionId) return acc;
    acc[evidence.sectionId] = [...(acc[evidence.sectionId] || []), evidence];
    return acc;
  }, {});

  const warningsCount = report?.provenance?.warnings?.length || 0;
  const sourcesCount = report?.sources?.length || 0;
  const citationsCount = report?.provenance?.citations?.length || 0;
  const provenanceMetadata = (report?.provenance?.metadata || {}) as Record<string, unknown>;
  const groundedCount =
    typeof provenanceMetadata.groundedClaimCount === 'number'
      ? provenanceMetadata.groundedClaimCount
      : undefined;
  const inferredCount =
    typeof provenanceMetadata.inferredClaimCount === 'number'
      ? provenanceMetadata.inferredClaimCount
      : undefined;

  const provenanceSummary: ProvenanceSummaryStat[] = [
    { label: 'Artifact Type', value: ARTIFACT_TYPE_LABELS[report?.artifactType || 'REPORT'], tone: 'ACCENT' },
    { label: 'Sources', value: String(sourcesCount) },
    { label: 'Evidence Rows', value: String(visibleEvidence.length) },
    { label: 'Citations', value: String(citationsCount) },
    {
      label: 'Warnings',
      value: String(warningsCount),
      tone: warningsCount > 0 ? 'WARNING' : 'DEFAULT',
    },
  ];

  if (groundedCount !== undefined || inferredCount !== undefined) {
    provenanceSummary.push({
      label: 'Grounded vs Inferred',
      value: `${groundedCount ?? 0} grounded / ${inferredCount ?? 0} inferred`,
      tone: 'ACCENT',
    });
  }

  return {
    artifactTypeLabel: ARTIFACT_TYPE_LABELS[report?.artifactType || 'REPORT'],
    evidenceBySectionId,
    orderedSections,
    provenanceSummary,
    readingHighlights: buildHighlightsForArtifactType(
      report?.artifactType,
      orderedSections,
      visibleEvidence.length
    ),
    visibleEvidence,
  };
};
