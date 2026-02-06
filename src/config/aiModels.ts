export type AIProvider = 'GEMINI' | 'OPENROUTER' | 'OPENAI' | 'ANTHROPIC';
export type ProviderRuntimeStatus = 'ACTIVE' | 'PLANNED';

export interface ProviderCapabilities {
    supportsThinkingBudget: boolean;
    supportsTts: boolean;
    supportsWebSearch: boolean;
    runtimeStatus: ProviderRuntimeStatus;
}

export interface AIProviderOption {
    id: AIProvider;
    label: string;
    description: string;
    defaultModelId: string;
    capabilities: ProviderCapabilities;
}

export interface ModelCapabilities {
    supportsThinkingBudget: boolean;
    supportsStructuredOutput: boolean;
    supportsWebSearch: boolean;
    runtimeStatus: ProviderRuntimeStatus;
}

export interface AIModelOption {
    id: string;
    name: string;
    description: string;
    provider: AIProvider;
    capabilities: ModelCapabilities;
}

export const DEFAULT_PROVIDER: AIProvider = 'GEMINI';
export const DEFAULT_MODEL_ID = 'gemini-3-flash-preview';

const DEFAULT_MODELS_BY_PROVIDER: Record<AIProvider, string> = {
    GEMINI: DEFAULT_MODEL_ID,
    OPENROUTER: 'stepfun/step-3.5-flash:free',
    OPENAI: 'gpt-4.1-mini',
    ANTHROPIC: 'claude-3-5-haiku-latest',
};

export const AI_PROVIDERS: AIProviderOption[] = [
    {
        id: 'GEMINI',
        label: 'Google Gemini',
        description: 'Primary default provider',
        defaultModelId: DEFAULT_MODELS_BY_PROVIDER.GEMINI,
        capabilities: {
            supportsThinkingBudget: true,
            supportsTts: true,
            supportsWebSearch: true,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'OPENROUTER',
        label: 'OpenRouter',
        description: 'Aggregator for third-party models',
        defaultModelId: DEFAULT_MODELS_BY_PROVIDER.OPENROUTER,
        capabilities: {
            supportsThinkingBudget: false,
            supportsTts: false,
            supportsWebSearch: false,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'OPENAI',
        label: 'OpenAI',
        description: 'Direct provider adapter',
        defaultModelId: DEFAULT_MODELS_BY_PROVIDER.OPENAI,
        capabilities: {
            supportsThinkingBudget: false,
            supportsTts: false,
            supportsWebSearch: false,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'ANTHROPIC',
        label: 'Anthropic',
        description: 'Direct provider adapter',
        defaultModelId: DEFAULT_MODELS_BY_PROVIDER.ANTHROPIC,
        capabilities: {
            supportsThinkingBudget: false,
            supportsTts: false,
            supportsWebSearch: false,
            runtimeStatus: 'ACTIVE',
        },
    },
];

export const AI_MODELS: AIModelOption[] = [
    {
        id: 'gemini-3-pro-preview',
        name: 'Gemini 3 Pro',
        description: 'Most capable',
        provider: 'GEMINI',
        capabilities: {
            supportsThinkingBudget: true,
            supportsStructuredOutput: true,
            supportsWebSearch: true,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash',
        description: 'Fast and balanced',
        provider: 'GEMINI',
        capabilities: {
            supportsThinkingBudget: true,
            supportsStructuredOutput: true,
            supportsWebSearch: true,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Advanced reasoning',
        provider: 'GEMINI',
        capabilities: {
            supportsThinkingBudget: true,
            supportsStructuredOutput: false,
            supportsWebSearch: true,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Cost effective',
        provider: 'GEMINI',
        capabilities: {
            supportsThinkingBudget: true,
            supportsStructuredOutput: false,
            supportsWebSearch: true,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash-Lite',
        description: 'High throughput',
        provider: 'GEMINI',
        capabilities: {
            supportsThinkingBudget: true,
            supportsStructuredOutput: false,
            supportsWebSearch: true,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'stepfun/step-3.5-flash:free',
        name: 'StepFun Step-3.5-Flash',
        description: 'OpenRouter free tier',
        provider: 'OPENROUTER',
        capabilities: {
            supportsThinkingBudget: false,
            supportsStructuredOutput: false,
            supportsWebSearch: false,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'arcee-ai/trinity-large-preview:free',
        name: 'Arcee Trinity Large Preview',
        description: 'OpenRouter free tier',
        provider: 'OPENROUTER',
        capabilities: {
            supportsThinkingBudget: false,
            supportsStructuredOutput: false,
            supportsWebSearch: false,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'tngtech/deepseek-r1t2-chimera:free',
        name: 'TNGTech DeepSeek R1T2 Chimera',
        description: 'OpenRouter free tier',
        provider: 'OPENROUTER',
        capabilities: {
            supportsThinkingBudget: false,
            supportsStructuredOutput: false,
            supportsWebSearch: false,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'tngtech/deepseek-r1t-chimera:free',
        name: 'TNGTech DeepSeek R1T Chimera',
        description: 'OpenRouter free tier',
        provider: 'OPENROUTER',
        capabilities: {
            supportsThinkingBudget: false,
            supportsStructuredOutput: false,
            supportsWebSearch: false,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'deepseek/deepseek-r1-0528:free',
        name: 'DeepSeek R1 0528',
        description: 'OpenRouter free tier',
        provider: 'OPENROUTER',
        capabilities: {
            supportsThinkingBudget: false,
            supportsStructuredOutput: false,
            supportsWebSearch: false,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'z-ai/glm-4.5-air:free',
        name: 'Z.ai GLM 4.5 Air',
        description: 'OpenRouter free tier',
        provider: 'OPENROUTER',
        capabilities: {
            supportsThinkingBudget: false,
            supportsStructuredOutput: false,
            supportsWebSearch: false,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'openrouter/pony-alpha',
        name: 'OpenRouter Pony Alpha',
        description: 'OpenRouter preview model',
        provider: 'OPENROUTER',
        capabilities: {
            supportsThinkingBudget: false,
            supportsStructuredOutput: false,
            supportsWebSearch: false,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'gpt-4.1-mini',
        name: 'GPT-4.1 Mini',
        description: 'OpenAI fast general model',
        provider: 'OPENAI',
        capabilities: {
            supportsThinkingBudget: false,
            supportsStructuredOutput: true,
            supportsWebSearch: false,
            runtimeStatus: 'ACTIVE',
        },
    },
    {
        id: 'claude-3-5-haiku-latest',
        name: 'Claude 3.5 Haiku',
        description: 'Anthropic fast general model',
        provider: 'ANTHROPIC',
        capabilities: {
            supportsThinkingBudget: false,
            supportsStructuredOutput: true,
            supportsWebSearch: false,
            runtimeStatus: 'ACTIVE',
        },
    },
];

export const getProviderOptionById = (provider: AIProvider): AIProviderOption | undefined => {
    return AI_PROVIDERS.find((option) => option.id === provider);
};

export const getDefaultModelForProvider = (provider: AIProvider): string => {
    return DEFAULT_MODELS_BY_PROVIDER[provider] || DEFAULT_MODEL_ID;
};

export const getModelOptionById = (modelId: string): AIModelOption | undefined => {
    return AI_MODELS.find((model) => model.id === modelId);
};

export const getModelsForProvider = (provider: AIProvider): AIModelOption[] => {
    return AI_MODELS.filter((model) => model.provider === provider);
};

export const getRuntimeReadyModelsForProvider = (provider: AIProvider): AIModelOption[] => {
    return getModelsForProvider(provider).filter((model) => model.capabilities.runtimeStatus === 'ACTIVE');
};

export const isProviderRuntimeReady = (provider: AIProvider): boolean => {
    return getProviderOptionById(provider)?.capabilities.runtimeStatus === 'ACTIVE';
};

export const getModelProvider = (modelId: string): AIProvider => {
    const model = getModelOptionById(modelId);
    if (model) return model.provider;

    if (modelId.startsWith('gemini-')) return 'GEMINI';
    if (modelId.startsWith('gpt-') || modelId.startsWith('o1-') || modelId.startsWith('o3-')) return 'OPENAI';
    if (modelId.startsWith('claude-')) return 'ANTHROPIC';
    if (modelId.includes('/')) return 'OPENROUTER';
    return DEFAULT_PROVIDER;
};

export const isGeminiModel = (modelId: string): boolean => getModelProvider(modelId) === 'GEMINI';
export const isOpenRouterModel = (modelId: string): boolean => getModelProvider(modelId) === 'OPENROUTER';

export const getModelDisplayName = (modelId: string): string => {
    return getModelOptionById(modelId)?.name || modelId;
};
