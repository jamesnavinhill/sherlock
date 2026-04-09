import type {
  ArtifactEvidence,
  ArtifactSection,
  ArtifactSectionKind,
  ArtifactType,
  Artifact,
  FollowUp,
  KeyFinding,
  LabelProfile,
  PurposeProfile,
} from '../types';
import { createLocalId } from '../utils/id';

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

const inferFollowUpKind = (value: string): FollowUp['kind'] => {
  const normalized = value.trim();
  if (!normalized) return 'NEXT_STEP';
  if (normalized.endsWith('?')) return 'QUESTION';
  const lower = normalized.toLowerCase();
  if (lower.startsWith('investigate ') || lower.startsWith('review ') || lower.startsWith('check ')) {
    return 'TASK';
  }
  if (lower.startsWith('determine ') || lower.startsWith('whether ')) {
    return 'QUESTION';
  }
  if (lower.includes('hypothesis')) return 'HYPOTHESIS';
  if (lower.includes('gap') || lower.includes('missing')) return 'GAP';
  return 'NEXT_STEP';
};

export const getFollowUpText = (followUp: FollowUp): string => followUp.actionText || followUp.title;

export const getKeyFindingText = (finding: KeyFinding): string => finding.summary || finding.title;

export const getArtifactFollowUps = (artifact: Pick<Artifact, 'followUps' | 'leads'>): FollowUp[] => {
  if (artifact.followUps && artifact.followUps.length > 0) {
    return artifact.followUps;
  }

  return (artifact.leads || []).map((lead, index) => ({
    id: `follow-up-legacy-${index}`,
    kind: inferFollowUpKind(lead),
    title: lead.slice(0, 96),
    actionText: lead,
    status: 'OPEN',
  }));
};

export const toFollowUpTexts = (followUps: FollowUp[] | undefined): string[] =>
  (followUps || []).map(getFollowUpText).filter((entry) => entry.trim().length > 0);

export const toKeyFindingTexts = (keyFindings: KeyFinding[] | undefined): string[] =>
  (keyFindings || [])
    .map(getKeyFindingText)
    .filter((entry) => entry.trim().length > 0);

export const buildArtifactFollowUps = (options: {
  leads?: string[];
  followUps?: string[];
  existing?: FollowUp[] | string[];
  artifactId?: string;
  workspaceId?: string;
  sourceSignalId?: string;
  createdAt?: number;
}): FollowUp[] => {
  const existingFollowUps =
    options.existing?.filter(
      (followUp): followUp is FollowUp =>
        !!followUp && typeof followUp === 'object' && !Array.isArray(followUp)
    ) || [];

  if (existingFollowUps.length > 0) {
    return existingFollowUps.map((followUp, index) => ({
      ...followUp,
      id:
        followUp.id ||
        (options.artifactId
          ? `${options.artifactId}-follow-up-${index}`
          : createLocalId('follow-up')),
      workspaceId: followUp.workspaceId || options.workspaceId,
      originArtifactId: followUp.originArtifactId || options.artifactId,
      sourceSignalId: followUp.sourceSignalId || options.sourceSignalId,
      status: followUp.status || 'OPEN',
      createdAt: followUp.createdAt ?? options.createdAt,
      updatedAt: followUp.updatedAt ?? options.createdAt,
      title: followUp.title || getFollowUpText(followUp).slice(0, 96),
      actionText: getFollowUpText(followUp),
    }));
  }

  const textItems = [
    ...(options.followUps || []),
    ...(options.followUps?.length ? [] : options.leads || []),
  ]
    .map((entry) => entry.trim())
    .filter(Boolean);

  return textItems.map((text, index) => ({
    id:
      options.artifactId
        ? `${options.artifactId}-follow-up-${index}`
        : createLocalId('follow-up'),
    workspaceId: options.workspaceId,
    originArtifactId: options.artifactId,
    sourceSignalId: options.sourceSignalId,
    kind: inferFollowUpKind(text),
    title: text.slice(0, 96),
    actionText: text,
    status: 'OPEN',
    createdAt: options.createdAt,
    updatedAt: options.createdAt,
  }));
};

const normalizeSupportRefs = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => normalizeText(entry))
    .filter((entry) => entry.length > 0);
};

const normalizeKeyFindingRecord = (value: unknown, index: number): KeyFinding | null => {
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
    return {
      id: createLocalId('finding'),
      title: text.slice(0, 96),
      summary: text,
      order: index,
    };
  }

  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const title =
    normalizeText(record.title ?? record.label ?? record.heading ?? record.name) ||
    normalizeText(record.summary ?? record.content ?? record.text);
  const summary =
    normalizeText(record.summary ?? record.content ?? record.text ?? record.description ?? record.finding) ||
    title;

  if (!title && !summary) return null;

  return {
    id: normalizeText(record.id) || createLocalId('finding'),
    workspaceId: normalizeText(record.workspaceId) || undefined,
    originArtifactId: normalizeText(record.originArtifactId ?? record.artifactId) || undefined,
    originSectionId: normalizeText(record.originSectionId ?? record.sectionId) || undefined,
    title: title || summary.slice(0, 96),
    summary: summary || title,
    supportRefs: normalizeSupportRefs(record.supportRefs ?? record.supportingRefs ?? record.support),
    createdAt: typeof record.createdAt === 'number' ? record.createdAt : undefined,
    updatedAt: typeof record.updatedAt === 'number' ? record.updatedAt : undefined,
    order: typeof record.order === 'number' ? record.order : index,
    metadata:
      record.metadata && typeof record.metadata === 'object'
        ? (record.metadata as Record<string, unknown>)
        : undefined,
  };
};

const buildKeyFindingSectionFallbacks = (
  sections: ArtifactSection[] | undefined,
  legacyAgendas: string[] | undefined
): Array<string | Record<string, unknown>> => {
  const findingSection = getSectionByKinds(sections, ['KEY_FINDINGS']);
  if (findingSection) {
    const sectionItems = (findingSection.items || []).map((item) => item.trim()).filter(Boolean);
    if (sectionItems.length > 0) {
      return sectionItems;
    }
    if (findingSection.content?.trim()) {
      return [
        {
          title: findingSection.title,
          summary: findingSection.content.trim(),
          sectionId: findingSection.id,
        },
      ];
    }
  }

  return (legacyAgendas || []).map((entry) => entry.trim()).filter(Boolean);
};

export const buildArtifactKeyFindings = (options: {
  keyFindings?: unknown;
  existing?: KeyFinding[] | unknown[];
  sections?: ArtifactSection[];
  legacyAgendas?: string[];
  artifactId?: string;
  workspaceId?: string;
  createdAt?: number;
}): KeyFinding[] => {
  const existingKeyFindings =
    options.existing?.filter(
      (finding): finding is KeyFinding =>
        !!finding && typeof finding === 'object' && !Array.isArray(finding)
    ) || [];
  const useExistingKeyFindings = !Array.isArray(options.keyFindings) && existingKeyFindings.length > 0;

  const explicitRecords = Array.isArray(options.keyFindings)
    ? options.keyFindings
    : useExistingKeyFindings
      ? existingKeyFindings
      : buildKeyFindingSectionFallbacks(options.sections, options.legacyAgendas);

  return explicitRecords
    .map((entry, index) =>
      useExistingKeyFindings
        ? ({
            ...entry,
            id:
              entry.id ||
              (options.artifactId
                ? `${options.artifactId}-finding-${index}`
                : createLocalId('finding')),
            workspaceId: entry.workspaceId || options.workspaceId,
            originArtifactId: entry.originArtifactId || options.artifactId,
            createdAt: entry.createdAt ?? options.createdAt,
            updatedAt: entry.updatedAt ?? options.createdAt,
            order: entry.order ?? index,
          } satisfies KeyFinding)
        : normalizeKeyFindingRecord(entry, index)
    )
    .filter((finding): finding is KeyFinding => !!finding)
    .map((finding, index) => ({
      ...finding,
      id:
        finding.id ||
        (options.artifactId
          ? `${options.artifactId}-finding-${index}`
          : createLocalId('finding')),
      workspaceId: finding.workspaceId || options.workspaceId,
      originArtifactId: finding.originArtifactId || options.artifactId,
      title: finding.title || getKeyFindingText(finding).slice(0, 96),
      summary: getKeyFindingText(finding),
      createdAt: finding.createdAt ?? options.createdAt,
      updatedAt: finding.updatedAt ?? options.createdAt,
      order: finding.order ?? index,
    }));
};

export const getArtifactKeyFindings = (
  artifact: Pick<Artifact, 'keyFindings' | 'sections' | 'agendas'>
): KeyFinding[] => {
  if (artifact.keyFindings && artifact.keyFindings.length > 0) {
    return artifact.keyFindings;
  }

  return buildArtifactKeyFindings({
    sections: artifact.sections,
    legacyAgendas: artifact.agendas,
  });
};

const ensureUniqueSectionIds = (sections: ArtifactSection[]): ArtifactSection[] => {
  const seenIds = new Map<string, number>();

  return sections.map((section, index) => {
    const baseId =
      normalizeText(section.id) ||
      `section-${section.kind.toLowerCase()}-${section.order ?? index}`;
    const duplicateCount = seenIds.get(baseId) ?? 0;
    seenIds.set(baseId, duplicateCount + 1);

    return {
      ...section,
      id: duplicateCount === 0 ? baseId : `${baseId}-${duplicateCount}`,
    };
  });
};

export const normalizeArtifactSectionKind = (value: unknown): ArtifactSectionKind => {
  const raw = normalizeText(value)
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
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
    normalizeText(record.content ?? record.text ?? record.summary ?? record.description) ||
    undefined;
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

  return ensureUniqueSectionIds(
    value
      .map((entry, index) => normalizeSectionRecord(entry, index))
      .filter((section): section is ArtifactSection => !!section)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );
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
  followUps?: string[] | FollowUp[];
  methodology?: string;
  evidence?: ArtifactEvidence[];
  keyFindings?: string[] | KeyFinding[];
  artifactType?: ArtifactType;
}): ArtifactSection[] => {
  const followUpTexts = Array.isArray(options.followUps)
    ? typeof options.followUps[0] === 'string'
      ? (options.followUps as string[])
      : toFollowUpTexts(options.followUps as FollowUp[])
    : [];
  const keyFindingTexts = Array.isArray(options.keyFindings)
    ? typeof options.keyFindings[0] === 'string'
      ? (options.keyFindings as string[])
      : toKeyFindingTexts(options.keyFindings as KeyFinding[])
    : [];
  const normalizedSections = normalizeArtifactSections(options.sections);
  if (normalizedSections.length > 0) {
    const existingKinds = new Set(normalizedSections.map((section) => section.kind));
    const augmentedSections = [...normalizedSections];

    if (keyFindingTexts.length > 0) {
      const findingSectionIndex = augmentedSections.findIndex((section) => section.kind === 'KEY_FINDINGS');
      const findingSectionOrder =
        findingSectionIndex >= 0
          ? (augmentedSections[findingSectionIndex].order ?? findingSectionIndex)
          : augmentedSections.length;
      const findingSection =
        createSection('KEY_FINDINGS', findingSectionOrder, {
          title:
            findingSectionIndex >= 0
              ? augmentedSections[findingSectionIndex].title
              : undefined,
          items: keyFindingTexts,
        }) || null;

      if (findingSection) {
        if (findingSectionIndex >= 0) {
          findingSection.id = augmentedSections[findingSectionIndex].id;
          augmentedSections[findingSectionIndex] = findingSection;
        } else {
          augmentedSections.push(findingSection);
        }
      }
    }

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

    if (
      !existingKinds.has('NEXT_STEPS') &&
      !existingKinds.has('LEADS') &&
      (followUpTexts.length || options.leads?.length)
    ) {
      const section = createSection('NEXT_STEPS', augmentedSections.length, {
        items: followUpTexts.length ? followUpTexts : options.leads,
      });
      if (section) augmentedSections.push(section);
    }

    return ensureUniqueSectionIds(augmentedSections);
  }

  const derivedSections = [
    createSection('EXECUTIVE_SUMMARY', 0, { content: options.summary }),
    createSection('KEY_FINDINGS', 1, { items: keyFindingTexts }),
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
    createSection('NEXT_STEPS', 6, { items: followUpTexts }),
  ].filter((section): section is ArtifactSection => !!section);

  if (derivedSections.length > 0) return ensureUniqueSectionIds(derivedSections);

  return ensureUniqueSectionIds(
    options.summary
      ? [
          {
            id: 'section-executive_summary-0',
            kind: 'EXECUTIVE_SUMMARY',
            title: SECTION_TITLES.EXECUTIVE_SUMMARY,
            content: options.summary,
            order: 0,
          },
        ]
      : []
  );
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

export const toLegacyReportArrays = (
  report: Artifact
): Pick<Artifact, 'agendas' | 'leads' | 'followUps'> => {
  const leadItems = getSectionItemsByKinds(report.sections, ['LEADS', 'NEXT_STEPS']);
  const anomalyItems = getSectionItemsByKinds(report.sections, ['ANOMALIES']);
  const canonicalFollowUps = getArtifactFollowUps(report);
  const followUpTexts = toFollowUpTexts(canonicalFollowUps);

  return {
    agendas: report.agendas?.length ? report.agendas : anomalyItems,
    leads: report.leads?.length ? report.leads : followUpTexts.length ? followUpTexts : leadItems,
    followUps: canonicalFollowUps.length ? canonicalFollowUps : buildArtifactFollowUps({ leads: leadItems }),
  };
};
