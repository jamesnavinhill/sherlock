import { BUILTIN_SCOPES } from '../../../data/presets';
import { getLabelProfileById } from '../../../domain';
import type {
  DateRangeConfig,
  DomainPack,
  InvestigationScope,
  PurposeProfile,
  SystemConfig,
} from '../../../types';
import type { LiveIntelConfig } from '../types';

const getPersonaInstruction = (personaId: string, scope?: InvestigationScope): string => {
  if (scope) {
    const scopePersona = scope.personas.find((persona) => persona.id === personaId);
    if (scopePersona) return scopePersona.instruction;
  }

  switch (personaId) {
    case 'JOURNALIST':
      return 'You are an award-winning investigative journalist. Focus on public interest, uncovering corruption, and verifying sources with extreme rigor. Your tone is objective but compelling.';
    case 'INTELLIGENCE_OFFICER':
      return 'You are a senior intelligence analyst. Focus on threat assessment, geopolitical implications, and connecting disparate data points. Your tone is clinical, brief, and highly classified.';
    case 'CONSPIRACY_ANALYST':
      return 'You are a fringe researcher looking for hidden patterns. You are skeptical of official narratives and look for deep state connections, though you must still rely on finding evidence. Your tone is urgent.';
    case 'FORENSIC_ACCOUNTANT':
      return 'You are a world-class forensic accountant and OSINT investigator. Focus on financial discrepancies, money trails, and regulatory violations. Your tone is professional and evidence-based.';
    default:
      for (const builtinScope of BUILTIN_SCOPES) {
        const builtinPersona = builtinScope.personas.find((persona) => persona.id === personaId);
        if (builtinPersona) return builtinPersona.instruction;
      }
      return 'You are a versatile OSINT investigator. Adapt your approach to the subject matter. Your tone is professional and thorough.';
  }
};

export const resolveDateRange = (
  dateConfig?: DateRangeConfig,
  overrideRange?: { start?: string; end?: string }
): string => {
  if (overrideRange?.start || overrideRange?.end) {
    const start = overrideRange.start || 'historical records';
    const end = overrideRange.end || 'present';
    return `Focus on the time period from ${start} to ${end}.`;
  }

  if (!dateConfig || dateConfig.strategy === 'NONE') return '';

  if (dateConfig.strategy === 'RELATIVE' && dateConfig.relativeYears) {
    const startYear = new Date().getFullYear() - dateConfig.relativeYears;
    return `Focus on the time period from ${startYear} to present.`;
  }

  if (dateConfig.strategy === 'ABSOLUTE' && (dateConfig.absoluteStart || dateConfig.absoluteEnd)) {
    const start = dateConfig.absoluteStart || 'historical records';
    const end = dateConfig.absoluteEnd || 'present';
    return `Focus on the time period from ${start} to ${end}.`;
  }

  return '';
};

export const formatSuggestedSources = (scope: InvestigationScope, limit = 10): string => {
  if (!scope.suggestedSources || scope.suggestedSources.length === 0) return '';

  const sourceList = scope.suggestedSources
    .flatMap((category) => category.sources.map((source) => source.label))
    .slice(0, limit)
    .join(', ');

  return `SUGGESTED SOURCES: ${sourceList}`;
};

export const buildInvestigationPrompt = (
  topic: string,
  scope: InvestigationScope,
  config: SystemConfig,
  parentContext?: { topic: string; summary: string },
  dateOverride?: { start?: string; end?: string },
  purpose?: PurposeProfile,
  pack?: DomainPack
): string => {
  const personaInstruction = getPersonaInstruction(config.persona, scope);
  const dateInstruction = resolveDateRange(scope.defaultDateRange, dateOverride);
  const sourcesInstruction = formatSuggestedSources(scope);
  const purposeInstruction = purpose
    ? `RUN PURPOSE: ${purpose.name}. ${purpose.promptDirective}`
    : '';
  const packInstruction = pack
    ? `DOMAIN PACK: ${pack.name}. Workspace mode: ${pack.workspaceMode}.`
    : '';
  const outputInstruction = purpose
    ? `OUTPUT CONTRACT: Return a structured ${purpose.recommendedArtifactType.toLowerCase()} with sections covering ${purpose.defaultSectionKinds.join(', ')} when relevant.`
    : 'OUTPUT CONTRACT: Return a structured report with clear sections when relevant.';
  const packAddendum = pack ? getPackPromptAddendum(pack) : '';
  const purposeAddendum = purpose ? getPurposePromptAddendum(purpose) : '';

  let prompt = `${personaInstruction}

WORKSPACE CONTEXT: ${scope.domainContext}
OBJECTIVE: ${scope.investigationObjective}
TARGET: "${topic}"
${packInstruction}
${purposeInstruction}
${dateInstruction ? `TEMPORAL SCOPE: ${dateInstruction}` : ''}
${sourcesInstruction}
${outputInstruction}
${packAddendum}
${purposeAddendum}
`;

  if (config.searchDepth === 'DEEP') {
    prompt +=
      '\nSTRICT REQUIREMENT: Prioritize obscure filings, local reports, and deep-web sources. Cross-reference multiple sources.';
  }

  if (parentContext) {
    prompt += `\nCONTEXT: This run builds on parent workspace "${parentContext.topic}". Parent summary: "${parentContext.summary}". Extend, test, or refine those findings rather than repeating them.`;
  }

  prompt +=
    '\n\nAnalyze thoroughly, preserve uncertainty, distinguish evidence from inference, and make the output useful for follow-up work.';

  return prompt;
};

const getPackPromptAddendum = (pack: DomainPack): string => {
  switch (pack.id) {
    case 'scientific-research':
      return 'PACK GUIDANCE: Prioritize peer-reviewed research, reputable preprints, review articles, and institutional sources. Explicitly call out methodology quality, limitations, uncertainty, and whether findings replicate or conflict.';
    case 'ai-technology-landscape':
      return 'PACK GUIDANCE: Prioritize primary releases, official documentation, model cards, benchmark reports, repositories, and direct product announcements before commentary. Separate capability claims from verified evidence.';
    case 'policy-regulation':
      return 'PACK GUIDANCE: Prioritize primary policy texts, regulator statements, official guidance, enforcement actions, and effective dates. Be precise about jurisdiction, timing, and affected stakeholders.';
    case 'corporate-due-diligence':
      return 'PACK GUIDANCE: Prioritize filings, court records, enforcement documents, ownership data, and reputable business reporting. Surface hidden liabilities, governance concerns, and reputational exposure.';
    case 'government-fraud':
      return 'PACK GUIDANCE: Prioritize procurement records, oversight reports, grants data, enforcement actions, and primary documentation. Look for unusual spending, conflicts, weak controls, and concentrated counterparties.';
    default:
      return 'PACK GUIDANCE: Prefer primary sources first, then add credible secondary reporting only where it adds context or synthesis.';
  }
};

const getPurposePromptAddendum = (purpose: PurposeProfile): string => {
  switch (purpose.id) {
    case 'latest-findings':
      return 'PURPOSE GUIDANCE: Emphasize recency, exact dates, what changed, and why the newest developments matter. Avoid padding with older background unless it changes interpretation.';
    case 'monitor':
      return 'PURPOSE GUIDANCE: Focus on deltas, escalation thresholds, and signals worth watching next. Prefer operational clarity over exhaustive history.';
    case 'synthesis':
      return 'PURPOSE GUIDANCE: Compare sources directly, surface consensus and disagreement, and preserve uncertainty. Organize findings so a reader can quickly understand the strongest evidence.';
    case 'trend-scan':
      return 'PURPOSE GUIDANCE: Focus on directional movement, major actors, repeated patterns, and strategic implications rather than one-off details.';
    default:
      return 'PURPOSE GUIDANCE: Develop a rigorous, evidence-backed picture of the topic and leave the reader with practical follow-up paths.';
  }
};

export const buildStructuredArtifactResponseInstruction = (
  purpose: PurposeProfile,
  labelProfileId: string,
  generationMode: 'SINGLE_PASS' | 'STAGED' = 'STAGED'
): string => {
  const labelProfile = getLabelProfileById(labelProfileId);
  const followUpCount =
    purpose.id === 'deep-dive' ? '4-6' : purpose.id === 'monitor' ? '3-5' : '3-4';

  return `CRITICAL: Respond with JSON only using this shape:
{
  "summary": "string",
  "entities": [{ "name": "string", "type": "PERSON|ORGANIZATION|UNKNOWN", "role": "string", "sentiment": "POSITIVE|NEGATIVE|NEUTRAL" }],
  "agendas": ["string"],
  "leads": ["string"],
  "followUps": ["string"],
  "methodology": "string",
  "sources": [{ "title": "string", "url": "https://..." }],
  "evidence": [{ "kind": "SOURCE|QUOTE|FINDING|DATA_POINT|TIMELINE_EVENT|METHOD", "title": "string", "summary": "string", "quote": "optional string", "sourceTitle": "optional string", "sourceUrl": "optional https://..." }],
  "sections": [{ "kind": "EXECUTIVE_SUMMARY|KEY_FINDINGS|ANOMALIES|LEADS|EVIDENCE|TIMELINE|METHODOLOGY|LITERATURE_REVIEW|IMPLICATIONS|NEXT_STEPS|CUSTOM", "title": "string", "content": "optional string", "items": ["optional strings"] }]
}
Use agendas for ${labelProfile.anomalyLabel.toLowerCase()} and leads/followUps for ${labelProfile.followUpLabel.toLowerCase()} even when they are questions, comparisons, monitoring actions, or recommendations. Include ${followUpCount} follow-up items when possible. Include 3-8 unique sources. Include 3-8 evidence records tied to specific claims or observations whenever possible. ${generationMode === 'STAGED' ? 'Assume this output is part of a deeper research workflow, so emphasize evidence quality, methodology transparency, and reusable sections.' : 'Keep the output decisive but still evidence-backed and structured.'}`;
};

export const buildAnomalyPrompt = (params: {
  region: string;
  category: string;
  limit: number;
  prioritySources: string;
  scope: InvestigationScope;
  purpose?: PurposeProfile;
  pack?: DomainPack;
  dateRange?: { start?: string; end?: string };
}): string => {
  const { region, category, limit, prioritySources, scope, dateRange, purpose, pack } = params;

  const locationScope = region.trim() ? region : 'globally';
  const objective = scope.investigationObjective;
  const topicScope =
    category !== 'All' ? `${category}-related issues within the scope of: ${objective}` : objective;
  const dateInstruction = resolveDateRange(scope.defaultDateRange, dateRange);
  const packInstruction = pack ? `DOMAIN PACK: ${pack.name}.` : '';
  const purposeInstruction = purpose
    ? `RUN PURPOSE: ${purpose.name}. ${purpose.promptDirective}`
    : '';

  let priorityInstruction = '';
  if (prioritySources.trim()) {
    priorityInstruction = `PRIORITY: Actively search for and prioritize information from these specific sources/handles: ${prioritySources}.`;
  } else if (scope.suggestedSources.length > 0) {
    const defaultSources = scope.suggestedSources
      .flatMap((cat) => cat.sources.map((source) => source.label))
      .slice(0, 5)
      .join(', ');
    priorityInstruction = `SUGGESTED SOURCES: Consider ${defaultSources}.`;
  }

  return `
CONTEXT: ${scope.domainContext}
${packInstruction}
${purposeInstruction}

Analyze real-time news, official reports, and social media discussions to identify ${limit} potential issues related to: ${topicScope} in ${locationScope}.
${dateInstruction ? `TEMPORAL SCOPE: ${dateInstruction}` : ''}
${priorityInstruction}
Focus on high-value findings, discrepancies, and notable developments.
CRITICAL: Return ONLY a valid JSON array.
Each item MUST include: id, title, category, riskLevel ("LOW" | "MEDIUM" | "HIGH").
`;
};

export const buildLiveIntelPrompt = (params: {
  topic: string;
  monitorConfig: LiveIntelConfig;
  scope: InvestigationScope;
  purpose?: PurposeProfile;
  pack?: DomainPack;
  existingContent: string[];
}): string => {
  const { topic, monitorConfig, scope, existingContent, purpose, pack } = params;

  const countInstruction = `Retrieve exactly: ${monitorConfig.newsCount} items of type 'NEWS', ${monitorConfig.socialCount} items of type 'SOCIAL', ${monitorConfig.officialCount} items of type 'OFFICIAL'`;
  const priorityInstruction = monitorConfig.prioritySources.trim()
    ? `PRIORITY: Prioritize ${monitorConfig.prioritySources}.`
    : formatSuggestedSources(scope);
  const dateInstruction = resolveDateRange(scope.defaultDateRange, monitorConfig.dateRange);
  const recentHistory = existingContent.slice(0, 20).join('; ');
  const dedupInstruction = recentHistory
    ? `CRITICAL EXCLUSION: Do NOT return items similar to: "${recentHistory}".`
    : '';
  const packInstruction = pack ? `DOMAIN PACK: ${pack.name}.` : '';
  const purposeInstruction = purpose
    ? `RUN PURPOSE: ${purpose.name}. ${purpose.promptDirective}`
    : '';

  return `CONTEXT: ${scope.domainContext}
${packInstruction}
${purposeInstruction}

Search intelligence for: "${topic}".
${countInstruction}
${priorityInstruction}
${dateInstruction ? `TEMPORAL SCOPE: ${dateInstruction}` : ''}
${dedupInstruction}
CRITICAL: Respond with ONLY a valid JSON array.
Items must include: id, type ("SOCIAL" | "NEWS" | "OFFICIAL"), sourceName, content, timestamp, sentiment ("NEGATIVE" | "NEUTRAL" | "POSITIVE"), threatLevel ("INFO" | "CAUTION" | "CRITICAL"), url (optional).`;
};
