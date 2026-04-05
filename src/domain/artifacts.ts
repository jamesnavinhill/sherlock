import type {
  ArtifactEvidence,
  ArtifactSection,
  ArtifactSectionKind,
  ArtifactType,
  Artifact,
  LabelProfile,
  PurposeProfile,
} from '../types';

const SECTION_TITLES: Record<ArtifactSectionKind, string> = {
  EXECUTIVE_SUMMARY: 'Executive Summary',
  KEY_FINDINGS: 'Key Findings',
  ANOMALIES: 'Anomalies',
  LEADS: 'Leads',
  EVIDENCE: 'Evidence',
  TIMELINE: 'Timeline',
  METHODOLOGY: 'Methodology',
  LITERATURE_REVIEW: 'Literature Review',
  IMPLICATIONS: 'Implications',
  NEXT_STEPS: 'Next Steps',
  CUSTOM: 'Section',
};

const SECTION_ALIASES: Record<string, ArtifactSectionKind> = {
  EXEC_SUMMARY: 'EXECUTIVE_SUMMARY',
  EXECUTIVE: 'EXECUTIVE_SUMMARY',
  SUMMARY: 'EXECUTIVE_SUMMARY',
  FINDINGS: 'KEY_FINDINGS',
  HIGHLIGHTS: 'KEY_FINDINGS',
  RISKS: 'ANOMALIES',
  AGENDA: 'ANOMALIES',
  ACTIONS: 'LEADS',
  FOLLOW_UPS: 'LEADS',
  FOLLOWUPS: 'LEADS',
  FOLLOW_UP: 'LEADS',
  NEXTSTEP: 'NEXT_STEPS',
  NEXTSTEPS: 'NEXT_STEPS',
};

const normalizeText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(normalizeText).filter(Boolean).join(' ').trim();
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.title === 'string') return record.title.trim();
    if (typeof record.content === 'string') return record.content.trim();
    if (typeof record.text === 'string') return record.text.trim();
  }

  return '';
};

const normalizeItems = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeText).filter((entry) => entry.length > 0);
};

const ensureUniqueSectionIds = (sections: ArtifactSection[]): ArtifactSection[] => {
  const seenIds = new Map<string, number>();

  return sections.map((section, index) => {
    const baseId =
      normalizeText(section.id) || `section-${section.kind.toLowerCase()}-${section.order ?? index}`;
    const duplicateCount = seenIds.get(baseId) ?? 0;
    seenIds.set(baseId, duplicateCount + 1);

    return {
      ...section,
      id: duplicateCount === 0 ? baseId : `${baseId}-${duplicateCount}`,
    };
  });
};

export const normalizeArtifactSectionKind = (value: unknown): ArtifactSectionKind => {
  const raw = normalizeText(value).replace(/[\s-]+/g, '_').toUpperCase();
  if (
    raw === 'EXECUTIVE_SUMMARY' ||
    raw === 'KEY_FINDINGS' ||
    raw === 'ANOMALIES' ||
    raw === 'LEADS' ||
    raw === 'EVIDENCE' ||
    raw === 'TIMELINE' ||
    raw === 'METHODOLOGY' ||
    raw === 'LITERATURE_REVIEW' ||
    raw === 'IMPLICATIONS' ||
    raw === 'NEXT_STEPS' ||
    raw === 'CUSTOM'
  ) {
    return raw;
  }

  return SECTION_ALIASES[raw] || 'CUSTOM';
};

const normalizeSectionRecord = (value: unknown, index: number): ArtifactSection | null => {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const kind = normalizeArtifactSectionKind(
    record.kind ?? record.type ?? record.sectionType ?? record.name
  );
  const items = normalizeItems(record.items ?? record.bullets ?? record.points);
  const content =
    normalizeText(record.content ?? record.text ?? record.summary ?? record.description) || undefined;
  const title =
    normalizeText(record.title ?? record.label ?? record.heading) || SECTION_TITLES[kind];

  if (!content && items.length === 0) return null;

  return {
    id: normalizeText(record.id) || `section-${kind.toLowerCase()}-${index}`,
    kind,
    title,
    content,
    items: items.length > 0 ? items : undefined,
    order: typeof record.order === 'number' ? record.order : index,
  };
};

export const normalizeArtifactSections = (value: unknown): ArtifactSection[] => {
  if (!Array.isArray(value)) return [];

  return ensureUniqueSectionIds(value
    .map((entry, index) => normalizeSectionRecord(entry, index))
    .filter((section): section is ArtifactSection => !!section)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
};

const createSection = (
  kind: ArtifactSectionKind,
  order: number,
  options: { content?: string; items?: string[]; title?: string }
): ArtifactSection | null => {
  const content = options.content?.trim();
  const items = (options.items || []).map((entry) => entry.trim()).filter(Boolean);
  if (!content && items.length === 0) return null;

  return {
    id: `section-${kind.toLowerCase()}-${order}`,
    kind,
    title: options.title || SECTION_TITLES[kind],
    content: content || undefined,
    items: items.length > 0 ? items : undefined,
    order,
  };
};

export const buildArtifactSections = (options: {
  sections?: unknown;
  summary?: string;
  agendas?: string[];
  leads?: string[];
  followUps?: string[];
  methodology?: string;
  evidence?: ArtifactEvidence[];
  findings?: string[];
  artifactType?: ArtifactType;
}): ArtifactSection[] => {
  const normalizedSections = normalizeArtifactSections(options.sections);
  if (normalizedSections.length > 0) {
    const existingKinds = new Set(normalizedSections.map((section) => section.kind));
    const augmentedSections = [...normalizedSections];

    if (!existingKinds.has('EXECUTIVE_SUMMARY') && options.summary?.trim()) {
      const section = createSection('EXECUTIVE_SUMMARY', augmentedSections.length, {
        content: options.summary,
      });
      if (section) augmentedSections.push(section);
    }

    if (!existingKinds.has('METHODOLOGY') && options.methodology?.trim()) {
      const section = createSection('METHODOLOGY', augmentedSections.length, {
        content: options.methodology,
      });
      if (section) augmentedSections.push(section);
    }

    if (!existingKinds.has('EVIDENCE') && options.evidence?.length) {
      const section = createSection('EVIDENCE', augmentedSections.length, {
        items: options.evidence.map((entry) =>
          entry.sourceTitle
            ? `${entry.title}: ${entry.summary} (${entry.sourceTitle})`
            : `${entry.title}: ${entry.summary}`
        ),
      });
      if (section) augmentedSections.push(section);
    }

    if (!existingKinds.has('NEXT_STEPS') && (options.followUps?.length || options.leads?.length)) {
      const section = createSection('NEXT_STEPS', augmentedSections.length, {
        items: options.followUps?.length ? options.followUps : options.leads,
      });
      if (section) augmentedSections.push(section);
    }

    return ensureUniqueSectionIds(augmentedSections);
  }

  const derivedSections = [
    createSection('EXECUTIVE_SUMMARY', 0, { content: options.summary }),
    createSection('KEY_FINDINGS', 1, { items: options.findings }),
    createSection('ANOMALIES', 2, { items: options.agendas }),
    createSection('LEADS', 3, { items: options.leads }),
    createSection('EVIDENCE', 4, {
      items: options.evidence?.map((entry) =>
        entry.sourceTitle
          ? `${entry.title}: ${entry.summary} (${entry.sourceTitle})`
          : `${entry.title}: ${entry.summary}`
      ),
    }),
    createSection('METHODOLOGY', 5, { content: options.methodology }),
    createSection('NEXT_STEPS', 6, { items: options.followUps }),
  ].filter((section): section is ArtifactSection => !!section);

  if (derivedSections.length > 0) return ensureUniqueSectionIds(derivedSections);

  return ensureUniqueSectionIds(options.summary
    ? [
        {
          id: 'section-executive_summary-0',
          kind: 'EXECUTIVE_SUMMARY',
          title: SECTION_TITLES.EXECUTIVE_SUMMARY,
          content: options.summary,
          order: 0,
        },
      ]
    : []);
};

export const getArtifactSectionTitle = (
  kind: ArtifactSectionKind,
  labelProfile?: LabelProfile,
  fallbackTitle?: string
): string => {
  if (kind === 'ANOMALIES' && labelProfile?.anomalyLabel) {
    return labelProfile.anomalyLabel;
  }

  if ((kind === 'LEADS' || kind === 'NEXT_STEPS') && labelProfile?.followUpLabel) {
    return labelProfile.followUpLabel;
  }

  return fallbackTitle || SECTION_TITLES[kind];
};

export const orderArtifactSections = (
  sections: ArtifactSection[] | undefined,
  purpose?: PurposeProfile
): ArtifactSection[] => {
  if (!sections || sections.length === 0) return [];

  const purposeOrder = purpose?.defaultSectionKinds || [];

  return [...sections].sort((left, right) => {
    const leftIndex = purposeOrder.indexOf(left.kind);
    const rightIndex = purposeOrder.indexOf(right.kind);

    if (leftIndex !== -1 || rightIndex !== -1) {
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    }

    return (left.order ?? 0) - (right.order ?? 0);
  });
};

export const getSectionByKinds = (
  sections: ArtifactSection[] | undefined,
  kinds: ArtifactSectionKind[]
): ArtifactSection | undefined => {
  if (!sections || sections.length === 0) return undefined;
  return sections.find((section) => kinds.includes(section.kind));
};

export const getSectionItemsByKinds = (
  sections: ArtifactSection[] | undefined,
  kinds: ArtifactSectionKind[]
): string[] => {
  if (!sections || sections.length === 0) return [];

  return sections
    .filter((section) => kinds.includes(section.kind))
    .flatMap((section) => section.items || [])
    .filter((entry) => entry.trim().length > 0);
};

export const getSectionContentByKinds = (
  sections: ArtifactSection[] | undefined,
  kinds: ArtifactSectionKind[]
): string => {
  const section = getSectionByKinds(sections, kinds);
  return section?.content?.trim() || '';
};

export const toLegacyReportArrays = (report: Artifact): Pick<Artifact, 'agendas' | 'leads' | 'followUps'> => {
  const leadItems = getSectionItemsByKinds(report.sections, ['LEADS', 'NEXT_STEPS']);
  const anomalyItems = getSectionItemsByKinds(report.sections, ['ANOMALIES', 'KEY_FINDINGS']);

  return {
    agendas: report.agendas?.length ? report.agendas : anomalyItems,
    leads: report.leads?.length ? report.leads : leadItems,
    followUps: report.followUps?.length ? report.followUps : leadItems,
  };
};
