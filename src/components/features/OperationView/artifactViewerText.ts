import { getArtifactSectionTitle } from '@/domain';
import type { Artifact, ArtifactSection, LabelProfile } from '@/types';

const SEPARATELY_SURFACED_SECTION_KINDS = new Set<ArtifactSection['kind']>([
  'KEY_FINDINGS',
  'LEADS',
  'NEXT_STEPS',
]);

const normalizeText = (value?: string | null) => value?.replace(/\s+/g, ' ').trim() || '';

const normalizeComparableText = (value?: string | null) => normalizeText(value).toLowerCase();

const normalizeComparableLine = (line: string) => line.replace(/\s+/g, ' ').trim().toLowerCase();

const normalizeHeading = (line: string) =>
  line
    .replace(/^#+\s*/, '')
    .replace(/:$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const stripLeadingSectionTitle = (body: string, title: string) => {
  const trimmedBody = body.trim();
  const trimmedTitle = title.trim();

  if (!trimmedBody || !trimmedTitle) return trimmedBody;
  if (!trimmedBody.startsWith(trimmedTitle)) return trimmedBody;

  return trimmedBody.slice(trimmedTitle.length).replace(/^\s+/, '').trim();
};

const buildSectionBodyText = (section: ArtifactSection) => {
  const segments: string[] = [];
  const content = section.content?.trim();
  if (content) {
    segments.push(content);
  }

  const items = (section.items || []).map((item) => item.trim()).filter(Boolean);
  if (items.length > 0) {
    segments.push(items.map((item) => `- ${item}`).join('\n'));
  }

  return segments.join('\n\n').trim();
};

const buildTitledBlock = (title: string, body: string) => `${title}\n${body}`.trim();

const trimAtSeparatelySurfacedHeading = (body: string, headings: Set<string>) => {
  const rawLines = body.replace(/\r\n/g, '\n').split('\n');
  const cutoffIndex = rawLines.findIndex((line) => headings.has(normalizeHeading(line)));

  if (cutoffIndex === -1) return body.trim();

  return rawLines.slice(0, cutoffIndex).join('\n').trim();
};

const getComparableLineEntries = (text: string) =>
  text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((raw, index) => ({
      index,
      normalized: normalizeComparableLine(raw),
    }))
    .filter((entry) => entry.normalized.length > 0);

const trimRedundantBodyPrefix = (existingText: string, body: string) => {
  const comparableExistingLines = getComparableLineEntries(existingText).map((entry) => entry.normalized);
  const comparableBodyLines = getComparableLineEntries(body);

  if (comparableExistingLines.length === 0 || comparableBodyLines.length === 0) {
    return body.trim();
  }

  const maxOverlap = Math.min(comparableExistingLines.length, comparableBodyLines.length);
  const rawBodyLines = body.replace(/\r\n/g, '\n').split('\n');

  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    const existingSuffix = comparableExistingLines.slice(-overlap).join('\n');
    const bodyPrefix = comparableBodyLines
      .slice(0, overlap)
      .map((entry) => entry.normalized)
      .join('\n');

    if (existingSuffix !== bodyPrefix) continue;

    const trimThroughIndex = comparableBodyLines[overlap - 1]?.index ?? -1;
    return rawBodyLines.slice(trimThroughIndex + 1).join('\n').trim();
  }

  return body.trim();
};

export interface ArtifactViewerBodyBlock {
  title?: string;
  body: string;
}

const renderNonRedundantBlock = (
  existingText: string,
  title: string,
  body: string
): ArtifactViewerBodyBlock | null => {
  const trimmedBody = body.trim();
  if (!trimmedBody) return null;

  const normalizedExistingText = normalizeComparableText(existingText);
  const normalizedBody = normalizeComparableText(trimmedBody);
  const normalizedBlock = normalizeComparableText(buildTitledBlock(title, trimmedBody));

  if (
    (normalizedBody && normalizedExistingText.includes(normalizedBody)) ||
    (normalizedBlock && normalizedExistingText.includes(normalizedBlock))
  ) {
    return null;
  }

  const uniqueBody = trimRedundantBodyPrefix(existingText, trimmedBody);
  if (!uniqueBody) return null;

  const normalizedTitle = normalizeComparableText(title);
  const existingContainsTitle = normalizedTitle.length > 0 && normalizedExistingText.includes(normalizedTitle);

  if (uniqueBody !== trimmedBody && existingContainsTitle) {
    return {
      body: uniqueBody,
    };
  }

  return {
    title,
    body: uniqueBody,
  };
};

export const buildArtifactViewerBodyBlocks = ({
  artifact,
  orderedSections,
  labelProfile,
}: {
  artifact: Artifact | null;
  orderedSections: ArtifactSection[];
  labelProfile?: LabelProfile;
}) => {
  if (!artifact) return [];

  const blocks: Array<{ title: string; body: string }> = [];
  const executiveSummaryTitle = getArtifactSectionTitle(
    'EXECUTIVE_SUMMARY',
    labelProfile,
    'Executive Summary'
  );
  const separatelySurfacedHeadings = new Set<string>([
    'key findings',
    'leads',
    'next steps',
    'follow up questions',
    'follow-up questions',
    'follow ups',
    'follow-ups',
    normalizeHeading(getArtifactSectionTitle('KEY_FINDINGS', labelProfile, 'Key Findings')),
    normalizeHeading(getArtifactSectionTitle('LEADS', labelProfile, 'Leads')),
    normalizeHeading(getArtifactSectionTitle('NEXT_STEPS', labelProfile, 'Next Steps')),
  ]);
  const hasExecutiveSummary = orderedSections.some(
    (section) => section.kind === 'EXECUTIVE_SUMMARY' && buildSectionBodyText(section).length > 0
  );

  if (!hasExecutiveSummary && artifact.summary.trim()) {
    blocks.push({
      title: getArtifactSectionTitle('EXECUTIVE_SUMMARY', labelProfile, 'Executive Summary'),
      body: artifact.summary.trim(),
    });
  }

  orderedSections
    .filter((section) => !SEPARATELY_SURFACED_SECTION_KINDS.has(section.kind))
    .forEach((section) => {
      const rawBody = buildSectionBodyText(section);
      const body =
        section.kind === 'EXECUTIVE_SUMMARY'
          ? trimAtSeparatelySurfacedHeading(rawBody, separatelySurfacedHeadings)
          : rawBody;
      if (!body) return;

      blocks.push({
        title: getArtifactSectionTitle(section.kind, labelProfile, section.title),
        body,
      });
    });

  const renderedBlocks = blocks.reduce<ArtifactViewerBodyBlock[]>((acc, block) => {
    const existingText = acc
      .map((entry) => (entry.title ? buildTitledBlock(entry.title, entry.body) : entry.body))
      .join('\n\n')
      .trim();
    const rendered = renderNonRedundantBlock(existingText, block.title, block.body);
    if (rendered) {
      acc.push(rendered);
    }
    return acc;
  }, []);

  if (renderedBlocks.length > 0) {
    const firstBlock = renderedBlocks[0];
    renderedBlocks[0] = {
      title:
        normalizeComparableText(firstBlock.title) === normalizeComparableText(executiveSummaryTitle)
          ? undefined
          : firstBlock.title,
      body: stripLeadingSectionTitle(firstBlock.body, executiveSummaryTitle),
    };
  }

  return renderedBlocks.filter((block) => block.body.trim());
};

export const buildArtifactViewerBody = (args: {
  artifact: Artifact | null;
  orderedSections: ArtifactSection[];
  labelProfile?: LabelProfile;
}) => {
  const blocks = buildArtifactViewerBodyBlocks(args);

  return (
    blocks
      .map((block) => (block.title ? buildTitledBlock(block.title, block.body) : block.body))
      .join('\n\n')
      .trim() || args.artifact?.summary.trim() || ''
  );
};
