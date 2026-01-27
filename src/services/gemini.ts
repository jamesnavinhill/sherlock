import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { InvestigationReport, Source, FeedItem, MonitorEvent, SystemConfig, InvestigatorPersona } from '../types';

// --- API HARDENING UTILS ---
const cache = new Map<string, any>();
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

const withRetry = async <T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
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
  persona: 'FORENSIC_ACCOUNTANT',
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

const getPersonaInstruction = (persona: InvestigatorPersona): string => {
  switch (persona) {
    case 'JOURNALIST':
      return "You are an award-winning investigative journalist. Focus on public interest, uncovering corruption, and verifying sources with extreme rigor. Your tone is objective but compelling.";
    case 'INTELLIGENCE_OFFICER':
      return "You are a senior intelligence analyst. Focus on threat assessment, geopolitical implications, and connecting disparate data points. Your tone is clinical, brief, and highly classified.";
    case 'CONSPIRACY_ANALYST':
      return "You are a fringe researcher looking for hidden patterns. You are skeptical of official narratives and look for deep state connections, though you must still rely on finding evidence. Your tone is urgent.";
    case 'FORENSIC_ACCOUNTANT':
    default:
      return "You are a world-class forensic accountant and OSINT investigator. Focus on financial discrepancies, money trails, and regulatory violations. Your tone is professional and evidence-based.";
  }
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
  configOverride?: AnomaliesConfig
): Promise<FeedItem[]> => {
  const config = getConfig();
  const useStructuredOutput = !isModel25(config.modelId);
  const limit = configOverride?.limit || 8;
  const prioritySources = configOverride?.prioritySources || '';

  try {
    const ai = getAI();
    const locationScope = region.trim() ? region : "the United States";
    const topicScope = category !== 'All' ? `${category} related fraud, waste, and abuse` : "government spending fraud, misuse of federal grants, or wasteful allocation of funds";

    let dateInstruction = "between 2020 and 2025";
    if (dateRange?.start || dateRange?.end) {
      const s = dateRange.start || "2020-01-01";
      const e = dateRange.end || new Date().toISOString().split('T')[0];
      dateInstruction = `specifically between ${s} and ${e}`;
    }

    let priorityInstruction = "";
    if (prioritySources.trim()) {
      priorityInstruction = `PRIORITY: Actively search for and prioritize information from these specific sources/handles: ${prioritySources}.`;
    }

    const jsonInstruction = useStructuredOutput ? '' : `
      CRITICAL: You MUST respond with ONLY a valid JSON array. No other text.
      Each item must have: id (string), title (string), category (string), riskLevel ("LOW" | "MEDIUM" | "HIGH")
    `;

    const response = await ai.models.generateContent({
      model: config.modelId,
      contents: `
        Analyze real-time news, official government reports, and social media discussions to identify ${limit} potential instances of ${topicScope} in ${locationScope} ${dateInstruction}.
        ${priorityInstruction}
        Focus on high-value discrepancies, suspicious contracts, or public outcry.
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

    return items.map((item: any) => ({
      ...item,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
  } catch (error: any) {
    if (error.message === 'MISSING_API_KEY') throw error;
    console.error("Failed to scan anomalies:", error);
    return [
      { id: '1', title: 'Unaccounted PPP Loans in Tech Sector', category: 'Grant Fraud', timestamp: '10:42 AM', riskLevel: 'HIGH' },
      { id: '2', title: 'Infrastructure Project Cost Overruns', category: 'Public Spending', timestamp: '09:15 AM', riskLevel: 'MEDIUM' },
      { id: '3', title: 'Suspicious Green Energy Subsidies', category: 'Federal Grants', timestamp: '08:30 AM', riskLevel: 'HIGH' },
      { id: '4', title: 'Defense Contractor Overbilling', category: 'Defense', timestamp: '08:15 AM', riskLevel: 'HIGH' },
      { id: '5', title: 'Education Dept Software Glitch', category: 'Education', timestamp: '07:45 AM', riskLevel: 'LOW' },
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
  existingContent: string[] = []
): Promise<MonitorEvent[]> => {
  const config = getConfig();
  const useStructuredOutput = !isModel25(config.modelId);
  try {
    const ai = getAI();
    const countInstruction = `Retrieve exactly: ${monitorConfig.newsCount} items of type 'NEWS', ${monitorConfig.socialCount} items of type 'SOCIAL', ${monitorConfig.officialCount} items of type 'OFFICIAL'`;
    let priorityInstruction = monitorConfig.prioritySources.trim() ? `PRIORITY: Prioritize ${monitorConfig.prioritySources}.` : "";
    let dateInstruction = (monitorConfig.dateRange?.start || monitorConfig.dateRange?.end) ? `TEMPORAL CONSTRAINT: Focus on ${monitorConfig.dateRange.start || "past"} to ${monitorConfig.dateRange.end || "now"}.` : "";
    const recentHistory = existingContent.slice(0, 20).join('; ');
    const dedupInstruction = recentHistory ? `CRITICAL EXCLUSION: Do NOT return items similar to: "${recentHistory}".` : "";
    const jsonInstruction = useStructuredOutput ? '' : `CRITICAL: Respond with ONLY a valid JSON array. Items: id, type, sourceName, content, timestamp, sentiment, threatLevel ("INFO" | "CAUTION" | "CRITICAL"), url (opt)`;

    const response = await ai.models.generateContent({
      model: config.modelId,
      contents: `Search intelligence for: "${topic}". ${countInstruction} ${priorityInstruction} ${dateInstruction} ${dedupInstruction} ${jsonInstruction}`,
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
    return JSON.parse(text);
  } catch (error: any) {
    if (error.message === 'MISSING_API_KEY') throw error;
    console.error("Live Intel failed:", error);
    const now = Date.now();
    return [
      { id: `sim-${now}-1`, type: 'NEWS', sourceName: 'Financial Times', content: `New allegations surface regarding ${topic} audits.`, timestamp: '5m ago', sentiment: 'NEGATIVE', threatLevel: 'CAUTION' },
      { id: `sim-${now}-2`, type: 'SOCIAL', sourceName: 'Twitter @WatchDog_01', content: `Just saw the leaked docs on ${topic}.`, timestamp: '12m ago', sentiment: 'NEGATIVE', threatLevel: 'CRITICAL' },
      { id: `sim-${now}-3`, type: 'OFFICIAL', sourceName: 'DOJ.gov', content: 'Investigation formally opened into related entities.', timestamp: '1h ago', sentiment: 'NEUTRAL', threatLevel: 'INFO' },
    ];
  }
};

export const investigateTopic = async (
  topic: string,
  parentContext?: { topic: string, summary: string },
  configOverride?: Partial<SystemConfig>
): Promise<InvestigationReport> => {
  const cacheKey = `investigate:${topic}:${JSON.stringify(configOverride)}`;
  if (cache.has(cacheKey)) {
    console.log(`Resource retrieved from cache: ${topic}`);
    return cache.get(cacheKey);
  }

  return withRetry(async () => {
    const savedConfig = getConfig();
    const config = { ...savedConfig, ...configOverride };
    const useStructuredOutput = !isModel25(config.modelId);
    const personaInstruction = getPersonaInstruction(config.persona);

    let basePrompt = `${personaInstruction} Mission: Investigate target "${topic}" for potential fraud/waste/abuse (2020-2025).`;
    if (config.searchDepth === 'DEEP') basePrompt += ` STRICT REQUIREMENT: Prioritize obscure filings and local reports.`;
    if (parentContext) basePrompt += ` CONTEXT: Deep dive from "${parentContext.topic}". Parent summary: "${parentContext.summary}".`;
    basePrompt += ` 1. SEARCH: USASpending.gov, SAM.gov, SAM.gov via Google. Look for hidden agendas. 2. ANALYZE: Extract entities, roles, sentiments. Gen at least 4 leads.`;
    if (!useStructuredOutput) basePrompt += ` CRITICAL: JSON object only with: summary, entities[], agendas[], leads[].`;

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
      chunks.forEach((chunk: any) => {
        if (chunk.web) sources.push({ title: chunk.web.title || "Unknown Source", url: chunk.web.uri || "#" });
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