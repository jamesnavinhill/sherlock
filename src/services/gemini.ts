import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { InvestigationReport, Source, FeedItem, MonitorEvent, SystemConfig, InvestigationScope, DateRangeConfig } from '../types';
import { BUILTIN_SCOPES, getScopeById } from '../data/presets';
import { DEFAULT_MODEL_ID, isGeminiModel, isOpenRouterModel } from '../config/aiModels';

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
type Provider = 'GEMINI' | 'OPENROUTER';

const getEnvApiKey = (provider: Provider): string | undefined => {
  const env = (typeof import.meta !== 'undefined' ? (import.meta.env as Record<string, string | undefined>) : undefined);

  if (provider === 'GEMINI') {
    return env?.VITE_GEMINI_API_KEY || env?.API_KEY || (typeof process !== 'undefined' ? process.env?.API_KEY : undefined);
  }

  return env?.VITE_OPENROUTER_API_KEY || env?.OPENROUTER_API_KEY || (typeof process !== 'undefined' ? process.env?.OPENROUTER_API_KEY : undefined);
};

const toDisplayText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(toDisplayText).filter(Boolean).join(' ').trim();
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.text === 'string') return record.text;
    if (typeof record.content === 'string') return record.content;
    if (record.content) {
      const nested = toDisplayText(record.content);
      if (nested) return nested;
    }
    return JSON.stringify(value);
  }
  return '';
};

const getGeminiApiKey = (): string | undefined => {
  return localStorage.getItem('GEMINI_API_KEY')
    || localStorage.getItem('sherlock_api_key')
    || getEnvApiKey('GEMINI');
};

const getOpenRouterApiKey = (): string | undefined => {
  return localStorage.getItem('OPENROUTER_API_KEY')
    || getEnvApiKey('OPENROUTER');
};

export const hasApiKey = (): boolean => {
  return !!(getGeminiApiKey() || getOpenRouterApiKey());
};

export const setApiKey = (key: string) => {
  const normalized = key.trim();
  if (!normalized) return;

  if (normalized.startsWith('sk-or-')) {
    localStorage.setItem('OPENROUTER_API_KEY', normalized);
    aiInstance = null;
    return;
  }

  localStorage.setItem('GEMINI_API_KEY', normalized);
  localStorage.setItem('sherlock_api_key', normalized);
  aiInstance = new GoogleGenAI({ apiKey: normalized });
};

export const clearApiKey = () => {
  localStorage.removeItem('sherlock_api_key');
  localStorage.removeItem('GEMINI_API_KEY');
  localStorage.removeItem('OPENROUTER_API_KEY');
  aiInstance = null;
};

const getAI = (): GoogleGenAI => {
  if (aiInstance) return aiInstance;
  const key = getGeminiApiKey();
  if (!key) throw new Error("MISSING_API_KEY");

  aiInstance = new GoogleGenAI({ apiKey: key });
  return aiInstance;
};

const getOpenRouterKey = (): string => {
  const key = getOpenRouterApiKey();
  if (!key) throw new Error("MISSING_API_KEY");
  return key;
};

// --- CONFIG ---

const DEFAULT_CONFIG: SystemConfig = {
  modelId: DEFAULT_MODEL_ID,
  thinkingBudget: 0,
  persona: 'general-investigator', // Default to open investigation persona
  searchDepth: 'STANDARD'
};

const getConfig = (): SystemConfig => {
  try {
    const stored = localStorage.getItem('sherlock_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old model names to correct API identifiers
      if (parsed.modelId === 'gemini-2.5-flash-latest') {
        parsed.modelId = 'gemini-2.5-flash';
      }
      if (parsed.modelId === 'gemini-3-flash') {
        parsed.modelId = 'gemini-3-flash-preview';
      }
      if (parsed.modelId === 'gemini-3-pro') {
        parsed.modelId = 'gemini-3-pro-preview';
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
  return isGeminiModel(modelId) && (modelId.includes('2.5') || modelId.includes('2-5'));
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

const extractBalancedJsonCandidates = (text: string): string[] => {
  const candidates: string[] = [];
  const limit = Math.min(text.length, 20000);
  const input = text.slice(0, limit);

  for (let i = 0; i < input.length; i++) {
    const start = input[i];
    if (start !== '{' && start !== '[') continue;
    const endChar = start === '{' ? '}' : ']';

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let j = i; j < input.length; j++) {
      const ch = input[j];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === start) depth++;
      if (ch === endChar) depth--;

      if (depth === 0) {
        candidates.push(input.slice(i, j + 1));
        i = j;
        break;
      }
    }
  }

  return candidates;
};

const parseJsonWithFallback = (raw: string): unknown => {
  const trimmed = raw.trim();
  const candidates = [
    trimmed,
    extractJSON(trimmed),
    ...Array.from(trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)).map(match => match[1].trim()),
    ...extractBalancedJsonCandidates(trimmed),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try next candidate
    }
  }

  throw new Error('Failed to parse JSON payload from model response');
};

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const normalizeOpenRouterContent = (content: unknown): string => toDisplayText(content).trim();

const queryOpenRouter = async (
  modelId: string,
  prompt: string,
  options?: { expectJson?: boolean; maxTokens?: number }
): Promise<string> => {
  const key = getOpenRouterKey();

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
      'X-Title': 'Sherlock AI',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
      ...(options?.expectJson ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  const rawBody = await response.text();
  let payload: {
    error?: { message?: string };
    choices?: Array<{
      message?: { content?: unknown; reasoning?: unknown; refusal?: unknown };
      text?: unknown;
      finish_reason?: string;
    }>;
  } = {};

  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    if (!response.ok) {
      throw new Error(`OpenRouter request failed with status ${response.status}`);
    }
  }

  if (!response.ok) {
    const message = payload.error?.message || `OpenRouter request failed with status ${response.status}`;
    throw new Error(message);
  }

  const firstChoice = payload.choices?.[0];
  const content = normalizeOpenRouterContent(firstChoice?.message?.content)
    || normalizeOpenRouterContent(firstChoice?.message?.reasoning)
    || normalizeOpenRouterContent(firstChoice?.message?.refusal)
    || normalizeOpenRouterContent(firstChoice?.text)
    || normalizeOpenRouterContent(payload);

  if (!content) {
    throw new Error(`OpenRouter returned an empty response (finish_reason: ${firstChoice?.finish_reason || 'unknown'})`);
  }

  return content;
};

const URL_PATTERN = /https?:\/\/[^\s<>"'`)\]}]+/gi;

const sanitizeUrl = (value: string): string | null => {
  const cleaned = value.trim().replace(/[),.;\]}]+$/, '');
  try {
    const parsed = new URL(cleaned);
    if (!parsed.hostname) return null;
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return null;
  }
};

const normalizeSource = (source: { title?: unknown; url?: unknown; uri?: unknown }): Source | null => {
  const rawUrl = typeof source.url === 'string' ? source.url : (typeof source.uri === 'string' ? source.uri : '');
  const url = sanitizeUrl(rawUrl);
  if (!url) return null;

  const title = typeof source.title === 'string' && source.title.trim().length > 0
    ? source.title.trim()
    : 'Untitled Source';

  return { title, url };
};

const dedupeSources = (sources: Array<{ title?: unknown; url?: unknown; uri?: unknown }>): Source[] => {
  const unique = new Map<string, Source>();
  sources.forEach((source) => {
    const normalized = normalizeSource(source);
    if (!normalized) return;
    const key = normalized.url.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, normalized);
    }
  });
  return Array.from(unique.values());
};

const extractSourcesFromGrounding = (response: unknown): Source[] => {
  const result: Source[] = [];
  const candidates = (response as {
    candidates?: Array<{
      groundingMetadata?: {
        groundingChunks?: Array<{ web?: { title?: string; uri?: string } }>
      }
    }>
  }).candidates || [];

  candidates.forEach(candidate => {
    const chunks = candidate.groundingMetadata?.groundingChunks || [];
    chunks.forEach(chunk => {
      const normalized = normalizeSource(chunk.web || {});
      if (normalized) result.push(normalized);
    });
  });

  return dedupeSources(result);
};

const extractSourcesFromText = (text: string): Source[] => {
  const matches = text.match(URL_PATTERN) || [];
  return dedupeSources(matches.map(url => ({ title: 'Referenced Source', url })));
};

const normalizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toDisplayText(item).trim())
    .filter((item) => item.length > 0);
};

const normalizeEntities = (value: unknown): InvestigationReport['entities'] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (typeof entry === 'string') {
        return { name: entry, type: 'UNKNOWN' as const };
      }

      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Record<string, unknown>;
      const name = toDisplayText(record.name).trim();
      if (!name) return null;

      const rawType = toDisplayText(record.type).toUpperCase();
      const type = rawType === 'PERSON' || rawType === 'ORGANIZATION' || rawType === 'UNKNOWN'
        ? (rawType as 'PERSON' | 'ORGANIZATION' | 'UNKNOWN')
        : 'UNKNOWN';

      const role = toDisplayText(record.role).trim() || undefined;
      const rawSentiment = toDisplayText(record.sentiment).toUpperCase();
      const sentiment = rawSentiment === 'POSITIVE' || rawSentiment === 'NEGATIVE' || rawSentiment === 'NEUTRAL'
        ? (rawSentiment as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL')
        : undefined;

      return { name, type, role, sentiment };
    })
    .filter((entity): entity is NonNullable<typeof entity> => !!entity);
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
  const useStructuredOutput = isGeminiModel(config.modelId) && !isModel25(config.modelId);
  const limit = configOverride?.limit || 8;
  const prioritySources = configOverride?.prioritySources || '';

  // Resolve scope - use provided or fall back to open investigation
  const activeScope = scope || getScopeById('open-investigation') || BUILTIN_SCOPES[BUILTIN_SCOPES.length - 1];

  try {
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

    const basePrompt = `
      CONTEXT: ${domainContext}
      
      Analyze real-time news, official reports, and social media discussions to identify ${limit} potential issues related to: ${topicScope} in ${locationScope}.
      ${dateInstruction ? `TEMPORAL SCOPE: ${dateInstruction}` : ''}
      ${priorityInstruction}
      Focus on high-value findings, discrepancies, and notable developments.
      CRITICAL: Return ONLY a valid JSON array.
      Each item MUST include: id, title, category, riskLevel ("LOW" | "MEDIUM" | "HIGH").
    `;

    if (isOpenRouterModel(config.modelId)) {
      const rawText = await withRetry(() => queryOpenRouter(config.modelId, basePrompt, { maxTokens: 1800 }));
      const parsed = parseJsonWithFallback(rawText);
      const items = Array.isArray(parsed) ? parsed : [];
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return items.map((item, index) => {
        const risk = item?.riskLevel === 'LOW' || item?.riskLevel === 'MEDIUM' || item?.riskLevel === 'HIGH'
          ? item.riskLevel
          : 'MEDIUM';
        return {
          id: typeof item?.id === 'string' ? item.id : `feed-${Date.now()}-${index}`,
          title: typeof item?.title === 'string' ? item.title : 'Untitled signal',
          category: typeof item?.category === 'string' ? item.category : (activeScope.categories[0] || 'General'),
          riskLevel: risk,
          timestamp: now,
        } as FeedItem;
      });
    }

    const ai = getAI();
    const jsonInstruction = useStructuredOutput ? '' : `
      CRITICAL: You MUST respond with ONLY a valid JSON array. No other text.
      Each item must have: id (string), title (string), category (string), riskLevel ("LOW" | "MEDIUM" | "HIGH")
    `;

    const response = await ai.models.generateContent({
      model: config.modelId,
      contents: `${basePrompt}\n${jsonInstruction}`,
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
    const items = useStructuredOutput ? JSON.parse(rawText) : parseJsonWithFallback(rawText);

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
  const useStructuredOutput = isGeminiModel(config.modelId) && !isModel25(config.modelId);

  // Resolve scope context
  const activeScope = scope || getScopeById('open-investigation') || BUILTIN_SCOPES[BUILTIN_SCOPES.length - 1];

  try {
    const countInstruction = `Retrieve exactly: ${monitorConfig.newsCount} items of type 'NEWS', ${monitorConfig.socialCount} items of type 'SOCIAL', ${monitorConfig.officialCount} items of type 'OFFICIAL'`;
    const priorityInstruction = monitorConfig.prioritySources.trim()
      ? `PRIORITY: Prioritize ${monitorConfig.prioritySources}.`
      : formatSuggestedSources(activeScope);
    const dateInstruction = resolveDateRange(activeScope.defaultDateRange, monitorConfig.dateRange);
    const recentHistory = existingContent.slice(0, 20).join('; ');
    const dedupInstruction = recentHistory ? `CRITICAL EXCLUSION: Do NOT return items similar to: "${recentHistory}".` : "";
    const basePrompt = `CONTEXT: ${activeScope.domainContext}

Search intelligence for: "${topic}".
${countInstruction}
${priorityInstruction}
${dateInstruction ? `TEMPORAL SCOPE: ${dateInstruction}` : ''}
${dedupInstruction}
CRITICAL: Respond with ONLY a valid JSON array.
Items must include: id, type ("SOCIAL" | "NEWS" | "OFFICIAL"), sourceName, content, timestamp, sentiment ("NEGATIVE" | "NEUTRAL" | "POSITIVE"), threatLevel ("INFO" | "CAUTION" | "CRITICAL"), url (optional).`;

    if (isOpenRouterModel(config.modelId)) {
      const rawText = await withRetry(() => queryOpenRouter(config.modelId, basePrompt, { maxTokens: 2200 }));
      const parsed = parseJsonWithFallback(rawText);
      if (!Array.isArray(parsed)) return [];

      return parsed.map((item, index) => {
        const type = item?.type === 'SOCIAL' || item?.type === 'NEWS' || item?.type === 'OFFICIAL' ? item.type : 'NEWS';
        const sentiment = item?.sentiment === 'NEGATIVE' || item?.sentiment === 'NEUTRAL' || item?.sentiment === 'POSITIVE'
          ? item.sentiment
          : 'NEUTRAL';
        const threatLevel = item?.threatLevel === 'INFO' || item?.threatLevel === 'CAUTION' || item?.threatLevel === 'CRITICAL'
          ? item.threatLevel
          : 'INFO';

        return {
          id: typeof item?.id === 'string' ? item.id : `sim-${Date.now()}-${index}`,
          type,
          sourceName: typeof item?.sourceName === 'string' ? item.sourceName : 'Unknown Source',
          content: typeof item?.content === 'string' ? item.content : '',
          timestamp: typeof item?.timestamp === 'string' ? item.timestamp : 'now',
          sentiment,
          threatLevel,
          url: typeof item?.url === 'string' ? item.url : undefined,
        } as MonitorEvent;
      });
    }

    const ai = getAI();
    const jsonInstruction = useStructuredOutput ? '' : `CRITICAL: Respond with ONLY a valid JSON array. Items: id, type, sourceName, content, timestamp, sentiment, threatLevel ("INFO" | "CAUTION" | "CRITICAL"), url (opt)`;

    const response = await ai.models.generateContent({
      model: config.modelId,
      contents: `${basePrompt}\n${jsonInstruction}`,
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
    const parsed = useStructuredOutput ? JSON.parse(rawText) : parseJsonWithFallback(rawText);
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
    const useStructuredOutput = isGeminiModel(config.modelId) && !isModel25(config.modelId);

    // Resolve scope - use provided or fall back to open investigation
    const activeScope = scope || getScopeById('open-investigation') || BUILTIN_SCOPES[BUILTIN_SCOPES.length - 1];

    // Use scope-aware prompt builder
    let basePrompt = buildInvestigationPrompt(topic, activeScope, config, parentContext, dateOverride);

    // Add structured output instructions if needed
    if (!useStructuredOutput) {
      basePrompt += ` CRITICAL: Respond with a JSON object only containing: summary (string), entities (array), agendas (array), leads (array), sources (array of {title, url}).`;
    }

    basePrompt += ` Extract at least 4 actionable leads. For each entity, specify: name, type (PERSON/ORGANIZATION/UNKNOWN), role, and sentiment. Include 3-8 unique sources and provide each source as { "title": "...", "url": "https://..." }.`;

    let rawText = "{}";
    let groundingSources: Source[] = [];

    if (isOpenRouterModel(config.modelId)) {
      rawText = await queryOpenRouter(config.modelId, `${basePrompt}\nCRITICAL: Respond with JSON only.`, { maxTokens: 3200 });
    } else {
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
                leads: { type: Type.ARRAY, items: { type: Type.STRING } },
                sources: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      url: { type: Type.STRING }
                    },
                    required: ["title", "url"]
                  }
                }
              },
              required: ["summary", "entities", "agendas", "leads", "sources"]
            },
          } : {}),
          safetySettings: SAFETY_SETTINGS,
        },
      });

      rawText = response.text || "{}";
      groundingSources = extractSourcesFromGrounding(response);
    }

    const parsedData = useStructuredOutput && isGeminiModel(config.modelId) ? JSON.parse(rawText) : parseJsonWithFallback(rawText);
    const data = (parsedData && typeof parsedData === 'object' ? parsedData : {}) as {
      summary?: string;
      entities?: InvestigationReport['entities'];
      agendas?: string[];
      leads?: string[];
      sources?: Array<{ title?: string; url?: string; uri?: string }>;
    };

    const modelSources = Array.isArray(data.sources)
      ? dedupeSources(data.sources.map(source => ({
        title: source.title,
        url: source.url,
        uri: source.uri
      })))
      : [];
    const textFallbackSources = extractSourcesFromText([
      rawText,
      toDisplayText(data.summary) || '',
      ...normalizeStringList(data.leads)
    ].join('\n'));

    const sources = dedupeSources([
      ...groundingSources,
      ...modelSources,
      ...textFallbackSources
    ]);

    const report: InvestigationReport = {
      topic,
      parentTopic: parentContext?.topic,
      dateStr: new Date().toLocaleDateString(),
      summary: toDisplayText(data.summary).trim() || "Analysis pending...",
      entities: normalizeEntities(data.entities),
      agendas: normalizeStringList(data.agendas),
      leads: normalizeStringList(data.leads),
      sources,
      rawText: JSON.stringify(data, null, 2),
      config: {
        modelId: config.modelId,
        persona: config.persona,
        searchDepth: config.searchDepth,
        thinkingBudget: config.thinkingBudget,
      }
    };

    cache.set(cacheKey, report);
    return report;
  });
};
