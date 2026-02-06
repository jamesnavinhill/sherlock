import { BUILTIN_SCOPES } from '../../../data/presets';
import type { DateRangeConfig, InvestigationScope, SystemConfig } from '../../../types';
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
    dateOverride?: { start?: string; end?: string }
): string => {
    const personaInstruction = getPersonaInstruction(config.persona, scope);
    const dateInstruction = resolveDateRange(scope.defaultDateRange, dateOverride);
    const sourcesInstruction = formatSuggestedSources(scope);

    let prompt = `${personaInstruction}

INVESTIGATION CONTEXT: ${scope.domainContext}
OBJECTIVE: ${scope.investigationObjective}
TARGET: "${topic}"
${dateInstruction ? `TEMPORAL SCOPE: ${dateInstruction}` : ''}
${sourcesInstruction}
`;

    if (config.searchDepth === 'DEEP') {
        prompt += '\nSTRICT REQUIREMENT: Prioritize obscure filings, local reports, and deep-web sources. Cross-reference multiple sources.';
    }

    if (parentContext) {
        prompt += `\nCONTEXT: This is a deep dive from parent investigation "${parentContext.topic}". Parent summary: "${parentContext.summary}". Build upon these findings.`;
    }

    prompt += '\n\nAnalyze thoroughly and extract entities, develop hypotheses, and identify actionable leads.';

    return prompt;
};

export const buildAnomalyPrompt = (params: {
    region: string;
    category: string;
    limit: number;
    prioritySources: string;
    scope: InvestigationScope;
    dateRange?: { start?: string; end?: string };
}): string => {
    const { region, category, limit, prioritySources, scope, dateRange } = params;

    const locationScope = region.trim() ? region : 'globally';
    const objective = scope.investigationObjective;
    const topicScope = category !== 'All' ? `${category}-related issues within the scope of: ${objective}` : objective;
    const dateInstruction = resolveDateRange(scope.defaultDateRange, dateRange);

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
    existingContent: string[];
}): string => {
    const { topic, monitorConfig, scope, existingContent } = params;

    const countInstruction = `Retrieve exactly: ${monitorConfig.newsCount} items of type 'NEWS', ${monitorConfig.socialCount} items of type 'SOCIAL', ${monitorConfig.officialCount} items of type 'OFFICIAL'`;
    const priorityInstruction = monitorConfig.prioritySources.trim()
        ? `PRIORITY: Prioritize ${monitorConfig.prioritySources}.`
        : formatSuggestedSources(scope);
    const dateInstruction = resolveDateRange(scope.defaultDateRange, monitorConfig.dateRange);
    const recentHistory = existingContent.slice(0, 20).join('; ');
    const dedupInstruction = recentHistory
        ? `CRITICAL EXCLUSION: Do NOT return items similar to: "${recentHistory}".`
        : '';

    return `CONTEXT: ${scope.domainContext}

Search intelligence for: "${topic}".
${countInstruction}
${priorityInstruction}
${dateInstruction ? `TEMPORAL SCOPE: ${dateInstruction}` : ''}
${dedupInstruction}
CRITICAL: Respond with ONLY a valid JSON array.
Items must include: id, type ("SOCIAL" | "NEWS" | "OFFICIAL"), sourceName, content, timestamp, sentiment ("NEGATIVE" | "NEUTRAL" | "POSITIVE"), threatLevel ("INFO" | "CAUTION" | "CRITICAL"), url (optional).`;
};
