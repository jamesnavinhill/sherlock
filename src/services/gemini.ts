import { GoogleGenAI, Type, Schema, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { InvestigationReport, Source, FeedItem, MonitorEvent, SystemConfig, InvestigatorPersona, Entity } from '../types';

// We do NOT initialize this globally anymore. We initialize it on demand.
let aiInstance: GoogleGenAI | null = null;

// --- KEY MANAGEMENT ---

// Helper to get environment API key (Vite uses import.meta.env with VITE_ prefix)
const getEnvApiKey = (): string | undefined => {
  // Primary: Vite's import.meta.env (works in production builds)
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  // Fallback: process.env shim from vite.config.ts (for backwards compatibility)
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

  // 1. Check LocalStorage (User provided - takes priority)
  const localKey = localStorage.getItem('sherlock_api_key');
  if (localKey) {
    aiInstance = new GoogleGenAI({ apiKey: localKey });
    return aiInstance;
  }

  // 2. Check Environment (Developer provided via .env file)
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
      // Migration: If user has invalid model stored, switch to default or mapped valid one
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

// Standard Safety Settings for OSINT (Permissive for research, blocking only egregious harm)
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// Gemini 2.5 models don't support tools + responseMimeType together
// For these models, we use prompt-based JSON instructions instead
const isModel25 = (modelId: string): boolean => {
  return modelId.includes('2.5') || modelId.includes('2-5');
};

// Helper to extract JSON from text that might include markdown code blocks or other text
const extractJSON = (text: string): string => {
  // Try to find JSON in code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find a JSON object (starts with { and ends with })
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  // Try to find a JSON array (starts with [ and ends with ])
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  // Last resort: return trimmed text and let JSON.parse fail with a clear error
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

/**
 * Generates an audio briefing from text using Gemini TTS.
 * Returns the raw PCM base64 string.
 */
export const generateAudioBriefing = async (text: string): Promise<string> => {
  const ai = getAI();

  // Truncate if too long to save bandwidth/latency for the demo
  const briefingText = text.length > 800 ? text.substring(0, 800) + "..." : text;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: `Read this investigative summary clearly and professionally: ${briefingText}`,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore has a good neutral/professional tone
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

/**
 * Scans for current trending topics.
 */
export interface AnomaliesConfig {
  limit?: number;
  prioritySources?: string;
}

/**
 * Scans for current trending topics.
 */
export const scanForAnomalies = async (
  region: string = '',
  category: string = 'All',
  dateRange?: { start?: string, end?: string },
  configOverride?: AnomaliesConfig
): Promise<FeedItem[]> => {
  const config = getConfig();
  const useStructuredOutput = !isModel25(config.modelId);

  // Defaults
  const limit = configOverride?.limit || 8;
  const prioritySources = configOverride?.prioritySources || '';

  try {
    const ai = getAI();
    const locationScope = region.trim() ? region : "the United States";
    const topicScope = category !== 'All'
      ? `${category} related fraud, waste, and abuse`
      : "government spending fraud, misuse of federal grants, or wasteful allocation of funds";

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

    // For 2.5 models, we add JSON format instructions to the prompt
    const jsonInstruction = useStructuredOutput ? '' : `
      
      CRITICAL: You MUST respond with ONLY a valid JSON array. No other text.
      Each item must have: id (string), title (string), category (string), riskLevel ("LOW" | "MEDIUM" | "HIGH")
      Example: [{"id": "1", "title": "Example Fraud Case", "category": "Grants", "riskLevel": "HIGH"}]
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
        // Only use structured output on models that support it with tools
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
                riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] }
              },
              required: ['id', 'title', 'category', 'riskLevel']
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
    // Fallback data
    return [
      { id: '1', title: 'Unaccounted PPP Loans in Tech Sector', category: 'Grant Fraud', timestamp: '10:42 AM', riskLevel: 'HIGH' },
      { id: '2', title: 'Infrastructure Project Cost Overruns', category: 'Public Spending', timestamp: '09:15 AM', riskLevel: 'MEDIUM' },
      { id: '3', title: 'Suspicious Green Energy Subsidies', category: 'Federal Grants', timestamp: '08:30 AM', riskLevel: 'HIGH' },
      { id: '4', title: 'Defense Contractor Overbilling', category: 'Defense', timestamp: '08:15 AM', riskLevel: 'HIGH' },
      { id: '5', title: 'Education Dept Software Glitch', category: 'Education', timestamp: '07:45 AM', riskLevel: 'LOW' },
      // Limit fallback if needed, but array slice is easy enough if crucial
    ].slice(0, limit);
  }
};

export interface MonitorConfig {
  socialCount: number;
  newsCount: number;
  officialCount: number;
  prioritySources: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

/**
 * Fetches live "stream" data for a specific case topic.
 */
export const getLiveIntel = async (
  topic: string,
  monitorConfig: MonitorConfig = { socialCount: 2, newsCount: 2, officialCount: 2, prioritySources: '' },
  existingContent: string[] = []
): Promise<MonitorEvent[]> => {
  const config = getConfig();
  const useStructuredOutput = !isModel25(config.modelId);

  try {
    const ai = getAI();

    const countInstruction = `
      You must retrieve exactly:
      - ${monitorConfig.newsCount} items of type 'NEWS'
      - ${monitorConfig.socialCount} items of type 'SOCIAL'
      - ${monitorConfig.officialCount} items of type 'OFFICIAL'
    `;

    let priorityInstruction = "";
    if (monitorConfig.prioritySources.trim()) {
      priorityInstruction = `PRIORITY: Actively search for and prioritize information from these specific sources/handles: ${monitorConfig.prioritySources}.`;
    }

    let dateInstruction = "";
    if (monitorConfig.dateRange?.start || monitorConfig.dateRange?.end) {
      const s = monitorConfig.dateRange.start || "the past";
      const e = monitorConfig.dateRange.end || "now";
      dateInstruction = `TEMPORAL CONSTRAINT: Only retrieve information relevant to the period between ${s} and ${e}. Ignore recent real-time events if they fall outside this window.`;
    }

    // Pass the last 20 items to avoid token limits while still preventing recent dupes
    const recentHistory = existingContent.slice(0, 20).join('; ');
    const dedupInstruction = recentHistory
      ? `CRITICAL EXCLUSION: Do NOT return any items with content similar to these recently seen items: "${recentHistory}". Find NEW information.`
      : "";

    // For 2.5 models, we add JSON format instructions to the prompt
    const jsonInstruction = useStructuredOutput ? '' : `
      
      CRITICAL: You MUST respond with ONLY a valid JSON array. No other text.
      Each item must have: id (string), type ("SOCIAL"|"NEWS"|"OFFICIAL"), sourceName (string), content (string), timestamp (string), sentiment ("NEGATIVE"|"NEUTRAL"|"POSITIVE"), url (string - optional)
    `;

    const response = await ai.models.generateContent({
      model: config.modelId,
      contents: `
        Search for intelligence regarding: "${topic}".
        
        ${countInstruction}
        ${priorityInstruction}
        ${dateInstruction}
        ${dedupInstruction}
        ${jsonInstruction}
      `,
      config: {
        // Only use structured output on models that support it with tools
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
                url: { type: Type.STRING }
              },
              required: ['id', 'type', 'sourceName', 'content', 'timestamp', 'sentiment']
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
    // Simplified fallback
    return [
      { id: `sim-${now}-1`, type: 'NEWS', sourceName: 'Financial Times', content: `New allegations surface regarding ${topic} audits.`, timestamp: '5m ago', sentiment: 'NEGATIVE' },
      { id: `sim-${now}-2`, type: 'SOCIAL', sourceName: 'Twitter @WatchDog_01', content: `Just saw the leaked docs on ${topic}. This is huge. #corruption`, timestamp: '12m ago', sentiment: 'NEGATIVE' },
      { id: `sim-${now}-3`, type: 'OFFICIAL', sourceName: 'DOJ.gov', content: 'Press release: Investigation formally opened into related contracting entities.', timestamp: '1h ago', sentiment: 'NEUTRAL' },
    ];
  }
};

/**
 * Performs a deep dive investigation with optional config overrides.
 */
export const investigateTopic = async (
  topic: string,
  parentContext?: { topic: string, summary: string },
  configOverride?: Partial<SystemConfig>
): Promise<InvestigationReport> => {

  // Merge defaults with saved config, then apply overrides for this run
  const savedConfig = getConfig();
  const config = { ...savedConfig, ...configOverride };
  const useStructuredOutput = !isModel25(config.modelId);

  const personaInstruction = getPersonaInstruction(config.persona);

  let basePrompt = `
    ${personaInstruction}
    
    Your mission: Investigate the target "${topic}" for potential fraud, waste, or abuse during the 2020-2025 period.
  `;

  if (config.searchDepth === 'DEEP') {
    basePrompt += `
    STRICT REQUIREMENT: You must prioritize obscure government filings, local news reports from smaller jurisdictions, and deep-dive investigative journalism over mainstream headlines. Dig for the details others missed.
    `;
  }

  if (parentContext) {
    basePrompt += `
    CONTEXT: This is a DEEP DIVE sub-investigation stemming from a larger case file regarding "${parentContext.topic}".
    The parent case summary is: "${parentContext.summary}".
    
    Your goal is to specifically drill down into "${topic}" as it relates to the parent case, but also uncover independent malfeasance.
    `;
  }

  basePrompt += `
    1. SEARCH STRATEGY: 
       - Query databases like USASpending.gov, Grants.gov, and SAM.gov (via Google Search) for contract/grant details related to "${topic}".
       - Search X (formerly Twitter) for specific mentions of "${topic}" in the context of fraud or waste.
       - Look for leadership connections, subsidiary entities, and previous legal issues.
    
    2. ANALYZE & FORMAT:
       - Identify hidden agendas, conflicts of interest, or "pay-to-play" schemes.
       - Extract key entities with their role and sentiment.
       - Generate at least 4 follow-up leads (must always be an even number for display purposes).

    Important: Be objective but skeptical. Dig deep into the numbers.
  `;

  // For 2.5 models, we add JSON format instructions to the prompt
  if (!useStructuredOutput) {
    basePrompt += `
    
    CRITICAL: You MUST respond with ONLY a valid JSON object. No other text.
    The JSON must have these fields:
    - summary: string (your investigation summary)
    - entities: array of {name: string, type: "PERSON"|"ORGANIZATION"|"UNKNOWN", role: string, sentiment: "POSITIVE"|"NEGATIVE"|"NEUTRAL"}
    - agendas: array of strings (hidden agendas found)
    - leads: array of strings (at least 4 follow-up investigation leads - must always be an even count)
    `;
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: config.modelId,
      contents: basePrompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Add thinking budget if applicable
        thinkingConfig: config.thinkingBudget > 0 ? { thinkingBudget: config.thinkingBudget } : undefined,
        // Only use structured output on models that support it with tools
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

    // Extract sources
    const sources: Source[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Unknown Source",
            url: chunk.web.uri || "#"
          });
        }
      });
    }

    return {
      topic: topic,
      parentTopic: parentContext?.topic,
      dateStr: new Date().toLocaleDateString(),
      summary: data.summary || "Analysis pending...",
      entities: data.entities || [],
      agendas: data.agendas || [],
      leads: data.leads || [],
      sources: sources,
      rawText: JSON.stringify(data, null, 2)
    };

  } catch (error: any) {
    if (error.message === 'MISSING_API_KEY') throw error;
    console.error("Investigation failed:", error);
    throw error;
  }
};