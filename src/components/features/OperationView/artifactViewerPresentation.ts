import type {
  Artifact,
  ArtifactEvidence,
  ArtifactSection,
  ArtifactSectionKind,
  ArtifactType,
  PurposeProfile,
} from '@/types';
import { orderArtifactSections } from '@/domain';

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

export const getArtifactTypeLabel = (artifactType?: ArtifactType) =>
  ARTIFACT_TYPE_LABELS[artifactType || 'REPORT'];

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
  const visibleEvidence = (report?.evidence || []).filter((entry) =>
    entry.summary.replace(/\s+/g, ' ').trim().length > 0
  );
  const evidenceBySectionId = visibleEvidence.reduce<Record<string, ArtifactEvidence[]>>((acc, evidence) => {
    if (!evidence.sectionId) return acc;
    acc[evidence.sectionId] = [...(acc[evidence.sectionId] || []), evidence];
    return acc;
  }, {});

  return {
    artifactTypeLabel: getArtifactTypeLabel(report?.artifactType),
    evidenceBySectionId,
    orderedSections,
    visibleEvidence,
  };
};
