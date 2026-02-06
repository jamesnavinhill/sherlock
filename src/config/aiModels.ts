export type AIProvider = 'GEMINI' | 'OPENROUTER';

export interface AIModelOption {
    id: string;
    name: string;
    description: string;
    provider: AIProvider;
}

export const DEFAULT_MODEL_ID = 'gemini-3-flash-preview';

export const AI_MODELS: AIModelOption[] = [
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Most capable', provider: 'GEMINI' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Fast and balanced', provider: 'GEMINI' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Advanced reasoning', provider: 'GEMINI' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Cost effective', provider: 'GEMINI' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', description: 'High throughput', provider: 'GEMINI' },
    { id: 'stepfun/step-3.5-flash:free', name: 'StepFun Step-3.5-Flash', description: 'OpenRouter free tier', provider: 'OPENROUTER' },
    { id: 'arcee-ai/trinity-large-preview:free', name: 'Arcee Trinity Large Preview', description: 'OpenRouter free tier', provider: 'OPENROUTER' },
    { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'TNGTech DeepSeek R1T2 Chimera', description: 'OpenRouter free tier', provider: 'OPENROUTER' },
    { id: 'tngtech/deepseek-r1t-chimera:free', name: 'TNGTech DeepSeek R1T Chimera', description: 'OpenRouter free tier', provider: 'OPENROUTER' },
    { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 0528', description: 'OpenRouter free tier', provider: 'OPENROUTER' },
    { id: 'z-ai/glm-4.5-air:free', name: 'Z.ai GLM 4.5 Air', description: 'OpenRouter free tier', provider: 'OPENROUTER' },
    { id: 'openrouter/pony-alpha', name: 'OpenRouter Pony Alpha', description: 'OpenRouter preview model', provider: 'OPENROUTER' },
];

export const getModelOptionById = (modelId: string): AIModelOption | undefined => {
    return AI_MODELS.find((model) => model.id === modelId);
};

export const getModelProvider = (modelId: string): AIProvider => {
    const model = getModelOptionById(modelId);
    if (model) return model.provider;

    if (modelId.startsWith('gemini-')) return 'GEMINI';
    if (modelId.includes('/')) return 'OPENROUTER';
    return 'GEMINI';
};

export const isGeminiModel = (modelId: string): boolean => getModelProvider(modelId) === 'GEMINI';
export const isOpenRouterModel = (modelId: string): boolean => getModelProvider(modelId) === 'OPENROUTER';

export const getModelDisplayName = (modelId: string): string => {
    return getModelOptionById(modelId)?.name || modelId;
};
