import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { InvestigationReport, Source, FeedItem, MonitorEvent, SystemConfig, InvestigationScope, DateRangeConfig } from '../types';
import { BUILTIN_SCOPES, getScopeById } from '../data/presets';

// --- API HARDENING UTILS ---
const cache = new Map<string, InvestigationReport>();
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

const withRetry = async <T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }
    if (retries > 0 && error.message !== 'MISSING_API_KEY') {
      console.warn(`API error, retrying in ${RETRY_DELAY}ms... (${retries} left)`);
      await wait(RETRY_DELAY);
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
};

// We do NOT initialize this globally anymore. We initialize it on demand.
let aiInstance: GoogleGenAI | null = null;

// --- KEY MANAGEMENT ---

const getEnvApiKey = (): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  return undefined;
};

export const hasApiKey = (): boolean => {
  return !!(localStorage.getItem('sherlock_api_key') || getEnvApiKey());
};

export const setApiKey = (key: string) => {
  localStorage.setItem('sherlock_api_key', key);
  aiInstance = new GoogleGenAI({ apiKey: key });
};

export const clearApiKey = () => {
  localStorage.removeItem('sherlock_api_key');
  aiInstance = null;
};

const getAI = (): GoogleGenAI => {
  if (aiInstance) return aiInstance;
  const localKey = localStorage.getItem('sherlock_api_key');
  if (localKey) {
    aiInstance = new GoogleGenAI({ apiKey: localKey });
    return aiInstance;
  }
  const envKey = getEnvApiKey();
  if (envKey) {
    aiInstance = new GoogleGenAI({ apiKey: envKey });
    return aiInstance;
  }
  throw new Error("MISSING_API_KEY");
};

// --- CONFIG ---

const DEFAULT_CONFIG: SystemConfig = {
  modelId: 'gemini-3-flash-preview',
  thinkingBudget: 0,
  persona: 'general-investigator', // Default to open investigation persona
  searchDepth: 'STANDARD'
};

const getConfig = (): SystemConfig => {
  try {
    const stored = localStorage.getItem('sherlock_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.modelId === 'gemini-2.5-flash-latest') {
        parsed.modelId = 'gemini-2.5-flash';
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error("Config load error", e);
  }
  return DEFAULT_CONFIG;
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

const isModel25 = (modelId: string): boolean => {
  return modelId.includes('2.5') || modelId.includes('2-5');
};

const extractJSON = (text: string): string => {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) return arrayMatch[0];

  return text.trim();
};

const getPersonaInstruction = (personaId: string, scope?: InvestigationScope): string => {
  // First try to find persona in scope
  if (scope) {
    const scopePersona = scope.personas.find(p => p.id === personaId);
    if (scopePersona) return scopePersona.instruction;
  }

  // Fallback to legacy personas for backwards compatibility
  switch (personaId) {
    case 'JOURNALIST':
      return "You are an award-winning investigative journalist. Focus on public interest, uncovering corruption, and verifying sources with extreme rigor. Your tone is objective but compelling.";
    case 'INTELLIGENCE_OFFICER':
      return "You are a senior intelligence analyst. Focus on threat assessment, geopolitical implications, and connecting disparate data points. Your tone is clinical, brief, and highly classified.";
    case 'CONSPIRACY_ANALYST':
      return "You are a fringe researcher looking for hidden patterns. You are skeptical of official narratives and look for deep state connections, though you must still rely on finding evidence. Your tone is urgent.";
    case 'FORENSIC_ACCOUNTANT':
      return "You are a world-class forensic accountant and OSINT investigator. Focus on financial discrepancies, money trails, and regulatory violations. Your tone is professional and evidence-based.";
    default:
      // Try to find in all built-in scopes
      for (const s of BUILTIN_SCOPES) {
        const p = s.personas.find(p => p.id === personaId);
        if (p) return p.instruction;
      }
      return "You are a versatile OSINT investigator. Adapt your approach to the subject matter. Your tone is professional and thorough.";
  }
};

// --- SCOPE-AWARE PROMPT HELPERS ---

const resolveDateRange = (dateConfig?: DateRangeConfig, overrideRange?: { start?: string; end?: string }): string => {
  // Override takes precedence if provided
  if (overrideRange?.start || overrideRange?.end) {
    const s = overrideRange.start || 'historical records';
    const e = overrideRange.end || 'present';
    return `Focus on the time period from ${s} to ${e}.`;
  }

  // Use scope's default date config
  if (!dateConfig || dateConfig.strategy === 'NONE') {
    return ''; // No date constraints
  }

  if (dateConfig.strategy === 'RELATIVE' && dateConfig.relativeYears) {
    const startYear = new Date().getFullYear() - dateConfig.relativeYears;
    return `Focus on the time period from ${startYear} to present.`;
  }

  if (dateConfig.strategy === 'ABSOLUTE' && (dateConfig.absoluteStart || dateConfig.absoluteEnd)) {
    const s = dateConfig.absoluteStart || 'historical records';
    const e = dateConfig.absoluteEnd || 'present';
    return `Focus on the time period from ${s} to ${e}.`;
  }

  return '';
};

const formatSuggestedSources = (scope: InvestigationScope): string => {
  if (!scope.suggestedSources || scope.suggestedSources.length === 0) return '';

  const sourceList = scope.suggestedSources
    .flatMap(cat => cat.sources.map(s => s.label))
    .slice(0, 10) // Limit to prevent prompt bloat
    .join(', ');

  return `SUGGESTED SOURCES: ${sourceList}`;
};

const buildInvestigationPrompt = (
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
    prompt += `\nSTRICT REQUIREMENT: Prioritize obscure filings, local reports, and deep-web sources. Cross-reference multiple sources.`;
  }

  if (parentContext) {
    prompt += `\nCONTEXT: This is a deep dive from parent investigation "${parentContext.topic}". Parent summary: "${parentContext.summary}". Build upon these findings.`;
  }

  prompt += `\n\nAnalyze thoroughly and extract entities, develop hypotheses, and identify actionable leads.`;

  return prompt;
};

export const generateAudioBriefing = async (text: string): Promise<string> => {
  const ai = getAI();
  const briefingText = text.length > 800 ? text.substring(0, 800) + "..." : text;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: `Read this investigative summary clearly and professionally: ${briefingText}`,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");
    return base64Audio;
  } catch (error) {
    console.error("TTS Generation failed:", error);
    throw error;
  }
};

export interface AnomaliesConfig {
  limit?: number;
  prioritySources?: string;
}

export const scanForAnomalies = async (
  region: string = '',
  category: string = 'All',
  dateRange?: { start?: string, end?: string },
  configOverride?: AnomaliesConfig,
  scope?: InvestigationScope
): Promise<FeedItem[]> => {
  const config = getConfig();
  const useStructuredOutput = !isModel25(config.modelId);
  const limit = configOverride?.limit || 8;
  const prioritySources = configOverride?.prioritySources || '';

  // Resolve scope - use provided or fall back to open investigation
  const activeScope = scope || getScopeById('open-investigation') || BUILTIN_SCOPES[BUILTIN_SCOPES.length - 1];

  try {
    const ai = getAI();
    const locationScope = region.trim() ? region : "globally";

    // Use scope context instead of hardcoded fraud language
    const domainContext = activeScope.domainContext;
    const objective = activeScope.investigationObjective;
    const topicScope = category !== 'All'
      ? `${category}-related issues within the scope of: ${objective}`
      : objective;

    // Use scope-aware date resolution
    const dateInstruction = resolveDateRange(activeScope.defaultDateRange, dateRange);

    let priorityInstruction = "";
    if (prioritySources.trim()) {
      priorityInstruction = `PRIORITY: Actively search for and prioritize information from these specific sources/handles: ${prioritySources}.`;
    } else if (activeScope.suggestedSources.length > 0) {
      const defaultSources = activeScope.suggestedSources
        .flatMap(cat => cat.sources.map(s => s.label))
        .slice(0, 5)
        .join(', ');
      priorityInstruction = `SUGGESTED SOURCES: Consider ${defaultSources}.`;
    }

    const jsonInstruction = useStructuredOutput ? '' : `
      CRITICAL: You MUST respond with ONLY a valid JSON array. No other text.
      Each item must have: id (string), title (string), category (string), riskLevel ("LOW" | "MEDIUM" | "HIGH")
    `;

    const response = await ai.models.generateContent({
      model: config.modelId,
      contents: `
        CONTEXT: ${domainContext}
        
        Analyze real-time news, official reports, and social media discussions to identify ${limit} potential issues related to: ${topicScope} in ${locationScope}.
        ${dateInstruction ? `TEMPORAL SCOPE: ${dateInstruction}` : ''}
        ${priorityInstruction}
        Focus on high-value findings, discrepancies, and notable developments.
        ${jsonInstruction}
      `,
      config: {
        ...(useStructuredOutput ? {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
                threatLevel: { type: Type.STRING, enum: ['INFO', 'CAUTION', 'CRITICAL'] }
              },
              required: ['id', 'title', 'category', 'riskLevel', 'threatLevel']
            }
          },
        } : {}),
        tools: [{ googleSearch: {} }],
        thinkingConfig: config.thinkingBudget > 0 ? { thinkingBudget: config.thinkingBudget } : undefined,
        safetySettings: SAFETY_SETTINGS,
      }
    });

    const rawText = response.text || "[]";
    const text = useStructuredOutput ? rawText : extractJSON(rawText);
    const items = JSON.parse(text);

    return (items as FeedItem[]).map((item) => ({
      ...item,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
  } catch (error) {
    if (error instanceof Error && error.message === 'MISSING_API_KEY') throw error;
    console.error("Failed to scan anomalies:", error);
    // Return scope-appropriate fallback items
    const fallbackCategory = activeScope.categories[1] || 'General';
    return [
      { id: '1', title: `Notable development in ${fallbackCategory}`, category: fallbackCategory, timestamp: '10:42 AM', riskLevel: 'HIGH' },
      { id: '2', title: `Emerging pattern detected`, category: activeScope.categories[2] || 'Analysis', timestamp: '09:15 AM', riskLevel: 'MEDIUM' },
      { id: '3', title: `New information surfaced`, category: activeScope.categories[0] || 'General', timestamp: '08:30 AM', riskLevel: 'HIGH' },
    ].slice(0, limit);
  }
};

export interface MonitorConfig {
  socialCount: number;
  newsCount: number;
  officialCount: number;
  prioritySources: string;
  dateRange?: { start?: string; end?: string; };
}

export const getLiveIntel = async (
  topic: string,
  monitorConfig: MonitorConfig = { socialCount: 2, newsCount: 2, officialCount: 2, prioritySources: '' },
  existingContent: string[] = [],
  scope?: InvestigationScope
): Promise<MonitorEvent[]> => {
  const config = getConfig();
  const useStructuredOutput = !isModel25(config.modelId);

  // Resolve scope context
  const activeScope = scope || getScopeById('open-investigation') || BUILTIN_SCOPES[BUILTIN_SCOPES.length - 1];

  try {
    const ai = getAI();
    const countInstruction = `Retrieve exactly: ${monitorConfig.newsCount} items of type 'NEWS', ${monitorConfig.socialCount} items of type 'SOCIAL', ${monitorConfig.officialCount} items of type 'OFFICIAL'`;
    const priorityInstruction = monitorConfig.prioritySources.trim()
      ? `PRIORITY: Prioritize ${monitorConfig.prioritySources}.`
      : formatSuggestedSources(activeScope);
    const dateInstruction = resolveDateRange(activeScope.defaultDateRange, monitorConfig.dateRange);
    const recentHistory = existingContent.slice(0, 20).join('; ');
    const dedupInstruction = recentHistory ? `CRITICAL EXCLUSION: Do NOT return items similar to: "${recentHistory}".` : "";
    const jsonInstruction = useStructuredOutput ? '' : `CRITICAL: Respond with ONLY a valid JSON array. Items: id, type, sourceName, content, timestamp, sentiment, threatLevel ("INFO" | "CAUTION" | "CRITICAL"), url (opt)`;

    const response = await ai.models.generateContent({
      model: config.modelId,
      contents: `CONTEXT: ${activeScope.domainContext}
      
Search intelligence for: "${topic}".
${countInstruction}
${priorityInstruction}
${dateInstruction ? `TEMPORAL SCOPE: ${dateInstruction}` : ''}
${dedupInstruction}
${jsonInstruction}`,
      config: {
        ...(useStructuredOutput ? {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['SOCIAL', 'NEWS', 'OFFICIAL'] },
                sourceName: { type: Type.STRING },
                content: { type: Type.STRING },
                timestamp: { type: Type.STRING },
                sentiment: { type: Type.STRING, enum: ['NEGATIVE', 'NEUTRAL', 'POSITIVE'] },
                threatLevel: { type: Type.STRING, enum: ['INFO', 'CAUTION', 'CRITICAL'] },
                url: { type: Type.STRING }
              },
              required: ['id', 'type', 'sourceName', 'content', 'timestamp', 'sentiment', 'threatLevel']
            }
          },
        } : {}),
        tools: [{ googleSearch: {} }],
        safetySettings: SAFETY_SETTINGS,
      }
    });

    const rawText = response.text || "[]";
    const text = useStructuredOutput ? rawText : extractJSON(rawText);
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error instanceof Error && error.message === 'MISSING_API_KEY') throw error;
    console.error("Live Intel failed:", error);
    const now = Date.now();
    return [
      { id: `sim-${now}-1`, type: 'NEWS', sourceName: 'News Source', content: `New developments regarding ${topic}.`, timestamp: '5m ago', sentiment: 'NEGATIVE', threatLevel: 'CAUTION' },
      { id: `sim-${now}-2`, type: 'SOCIAL', sourceName: 'Social Media', content: `Discussion emerging about ${topic}.`, timestamp: '12m ago', sentiment: 'NEGATIVE', threatLevel: 'CRITICAL' },
      { id: `sim-${now}-3`, type: 'OFFICIAL', sourceName: 'Official Source', content: 'Related announcement published.', timestamp: '1h ago', sentiment: 'NEUTRAL', threatLevel: 'INFO' },
    ];
  }
};

export const investigateTopic = async (
  topic: string,
  parentContext?: { topic: string, summary: string },
  configOverride?: Partial<SystemConfig>,
  scope?: InvestigationScope,
  dateOverride?: { start?: string; end?: string }
): Promise<InvestigationReport> => {
  const cacheKey = `investigate:${topic}:${JSON.stringify(configOverride)}:${scope?.id}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (cached) {
      console.warn(`Resource retrieved from cache: ${topic}`);
      return cached;
    }
  }

  return withRetry(async () => {
    const savedConfig = getConfig();
    const config = { ...savedConfig, ...configOverride };
    const useStructuredOutput = !isModel25(config.modelId);

    // Resolve scope - use provided or fall back to open investigation
    const activeScope = scope || getScopeById('open-investigation') || BUILTIN_SCOPES[BUILTIN_SCOPES.length - 1];

    // Use scope-aware prompt builder
    let basePrompt = buildInvestigationPrompt(topic, activeScope, config, parentContext, dateOverride);

    // Add structured output instructions if needed
    if (!useStructuredOutput) {
      basePrompt += ` CRITICAL: Respond with a JSON object only containing: summary (string), entities (array), agendas (array), leads (array).`;
    }

    basePrompt += ` Extract at least 4 actionable leads. For each entity, specify: name, type (PERSON/ORGANIZATION/UNKNOWN), role, and sentiment.`;

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: config.modelId,
      contents: basePrompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: config.thinkingBudget > 0 ? { thinkingBudget: config.thinkingBudget } : undefined,
        ...(useStructuredOutput ? {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              entities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["PERSON", "ORGANIZATION", "UNKNOWN"] },
                    role: { type: Type.STRING },
                    sentiment: { type: Type.STRING, enum: ["POSITIVE", "NEGATIVE", "NEUTRAL"] }
                  },
                  required: ["name", "type", "role", "sentiment"]
                }
              },
              agendas: { type: Type.ARRAY, items: { type: Type.STRING } },
              leads: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "entities", "agendas", "leads"]
          },
        } : {}),
        safetySettings: SAFETY_SETTINGS,
      },
    });

    const rawText = response.text || "{}";
    const jsonText = useStructuredOutput ? rawText : extractJSON(rawText);
    const data = JSON.parse(jsonText);
    const sources: Source[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk) => {
        const web = (chunk as { web?: { title?: string; uri?: string } }).web;
        if (web) sources.push({ title: web.title || "Unknown Source", url: web.uri || "#" });
      });
    }

    const report: InvestigationReport = {
      topic,
      parentTopic: parentContext?.topic,
      dateStr: new Date().toLocaleDateString(),
      summary: data.summary || "Analysis pending...",
      entities: data.entities || [],
      agendas: data.agendas || [],
      leads: data.leads || [],
      sources,
      rawText: JSON.stringify(data, null, 2)
    };

    cache.set(cacheKey, report);
    return report;
  });
};