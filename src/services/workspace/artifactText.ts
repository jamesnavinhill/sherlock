import type { Artifact, ArtifactSection } from '@/types';

const SEPARATELY_SURFACED_SECTION_KINDS = new Set<ArtifactSection['kind']>(['KEY_FINDINGS']);

const normalizeSectionTitle = (section: ArtifactSection) =>
  section.title?.trim() ||
  section.kind
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const buildSectionBody = (section: ArtifactSection) => {
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

const normalizeSectionBody = (body: string) => body.replace(/\s+/g, ' ').trim().toLowerCase();

const sortSections = (sections: ArtifactSection[]) =>
  [...sections].sort(
    (left, right) => (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER)
  );

const buildTitledBlock = (title: string, body: string) => `${title}\n${body}`.trim();

export const buildArtifactBoardContent = (artifact: Artifact) => {
  const sections = sortSections(artifact.sections || []);
  const seenFollowUpBodies = new Set<string>();
  const visibleSections = sections
    .filter((section) => !SEPARATELY_SURFACED_SECTION_KINDS.has(section.kind))
    .map((section) => {
      const body = buildSectionBody(section);
      if (!body) return '';

      if (section.kind === 'LEADS' || section.kind === 'NEXT_STEPS') {
        const normalizedBody = normalizeSectionBody(body);
        if (normalizedBody && seenFollowUpBodies.has(normalizedBody)) {
          return '';
        }
        if (normalizedBody) {
          seenFollowUpBodies.add(normalizedBody);
        }
      }

      return buildTitledBlock(normalizeSectionTitle(section), body);
    })
    .filter(Boolean);

  const contentBlocks = [...visibleSections];
  const hasExecutiveSummary = sections.some(
    (section) => section.kind === 'EXECUTIVE_SUMMARY' && !!buildSectionBody(section)
  );

  if (!hasExecutiveSummary && artifact.summary.trim()) {
    contentBlocks.unshift(buildTitledBlock('Executive Summary', artifact.summary.trim()));
  }

  const leads = artifact.leads.map((lead) => lead.trim()).filter(Boolean);
  if (leads.length > 0 && !sections.some((section) => section.kind === 'LEADS')) {
    const leadBody = leads.map((lead) => `- ${lead}`).join('\n');
    const normalizedLeadBody = normalizeSectionBody(leadBody);
    if (!normalizedLeadBody || !seenFollowUpBodies.has(normalizedLeadBody)) {
      if (normalizedLeadBody) {
        seenFollowUpBodies.add(normalizedLeadBody);
      }
      contentBlocks.push(buildTitledBlock('Leads', leadBody));
    }
  }

  const followUps = (artifact.followUps || [])
    .map((followUp) => followUp.actionText.trim())
    .filter(Boolean);
  if (followUps.length > 0 && !sections.some((section) => section.kind === 'NEXT_STEPS')) {
    const followUpBody = followUps.map((followUp) => `- ${followUp}`).join('\n');
    const normalizedFollowUpBody = normalizeSectionBody(followUpBody);
    if (!normalizedFollowUpBody || !seenFollowUpBodies.has(normalizedFollowUpBody)) {
      if (normalizedFollowUpBody) {
        seenFollowUpBodies.add(normalizedFollowUpBody);
      }
      contentBlocks.push(buildTitledBlock('Follow Ups', followUpBody));
    }
  }

  if (contentBlocks.length === 0 && artifact.rawText.trim()) {
    return artifact.rawText.trim();
  }

  return contentBlocks.join('\n\n').trim() || artifact.summary.trim() || artifact.topic;
};
