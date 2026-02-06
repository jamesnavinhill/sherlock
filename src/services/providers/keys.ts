import type { AIProvider } from '../../config/aiModels';
import { AI_PROVIDERS } from '../../config/aiModels';

export interface ApiKeyValidationResult {
    isValid: boolean;
    message?: string;
}

type ProviderKeyConfig = {
    storageKeys: string[];
    envKeys: string[];
};

const KEY_CONFIG: Record<AIProvider, ProviderKeyConfig> = {
    GEMINI: {
        storageKeys: ['GEMINI_API_KEY', 'sherlock_api_key'],
        envKeys: ['VITE_GEMINI_API_KEY', 'API_KEY'],
    },
    OPENROUTER: {
        storageKeys: ['OPENROUTER_API_KEY'],
        envKeys: ['VITE_OPENROUTER_API_KEY', 'OPENROUTER_API_KEY'],
    },
    OPENAI: {
        storageKeys: ['OPENAI_API_KEY'],
        envKeys: ['VITE_OPENAI_API_KEY', 'OPENAI_API_KEY'],
    },
    ANTHROPIC: {
        storageKeys: ['ANTHROPIC_API_KEY'],
        envKeys: ['VITE_ANTHROPIC_API_KEY', 'ANTHROPIC_API_KEY'],
    },
};

const getEnvironmentValue = (keys: string[]): string | undefined => {
    const env =
        typeof import.meta !== 'undefined'
            ? ((import.meta.env as Record<string, string | undefined>) || {})
            : {};
    const processEnv =
        typeof process !== 'undefined'
            ? ((process.env as Record<string, string | undefined>) || {})
            : {};

    for (const key of keys) {
        const value = env[key] || processEnv[key];
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
    }

    return undefined;
};

export const getStoredApiKey = (provider: AIProvider): string | undefined => {
    if (typeof localStorage === 'undefined') return undefined;
    const config = KEY_CONFIG[provider];
    for (const keyName of config.storageKeys) {
        const value = localStorage.getItem(keyName);
        if (value && value.trim().length > 0) {
            return value.trim();
        }
    }
    return undefined;
};

export const getApiKey = (provider: AIProvider): string | undefined => {
    return getStoredApiKey(provider) || getEnvironmentValue(KEY_CONFIG[provider].envKeys);
};

export const hasApiKey = (provider?: AIProvider): boolean => {
    if (provider) return !!getApiKey(provider);
    return AI_PROVIDERS.some((candidate) => !!getApiKey(candidate.id));
};

export const getApiKeyOrThrow = (provider: AIProvider): string => {
    const key = getApiKey(provider);
    if (!key) throw new Error('MISSING_API_KEY');
    return key;
};

export const inferProviderFromApiKey = (rawKey: string): AIProvider | undefined => {
    const key = rawKey.trim();
    if (!key) return undefined;
    if (key.startsWith('sk-or-') || key.startsWith('sk-or-v1-')) return 'OPENROUTER';
    if (key.startsWith('sk-ant-')) return 'ANTHROPIC';
    if (key.startsWith('AIza')) return 'GEMINI';
    if (key.startsWith('sk-')) return 'OPENAI';
    return undefined;
};

export const validateApiKey = (provider: AIProvider, rawKey: string): ApiKeyValidationResult => {
    const key = rawKey.trim();
    if (!key) return { isValid: false, message: 'API key is required.' };

    if (provider === 'GEMINI' && !key.startsWith('AIza')) {
        return { isValid: false, message: 'Gemini keys usually start with "AIza".' };
    }
    if (provider === 'OPENROUTER' && !(key.startsWith('sk-or-') || key.startsWith('sk-or-v1-'))) {
        return { isValid: false, message: 'OpenRouter keys usually start with "sk-or-".' };
    }
    if (provider === 'ANTHROPIC' && !key.startsWith('sk-ant-')) {
        return { isValid: false, message: 'Anthropic keys usually start with "sk-ant-".' };
    }
    if (provider === 'OPENAI' && (!key.startsWith('sk-') || key.startsWith('sk-or-') || key.startsWith('sk-ant-'))) {
        return { isValid: false, message: 'OpenAI keys usually start with "sk-".' };
    }

    return { isValid: true };
};

export const setApiKey = (provider: AIProvider, rawKey: string): ApiKeyValidationResult => {
    const validation = validateApiKey(provider, rawKey);
    if (!validation.isValid) return validation;

    if (typeof localStorage === 'undefined') {
        return { isValid: false, message: 'Local storage is unavailable in this environment.' };
    }

    const key = rawKey.trim();
    const config = KEY_CONFIG[provider];
    localStorage.setItem(config.storageKeys[0], key);

    // Maintain legacy alias for Gemini compatibility.
    if (provider === 'GEMINI') {
        localStorage.setItem('sherlock_api_key', key);
    }

    return { isValid: true };
};

export const clearApiKey = (provider?: AIProvider): void => {
    if (typeof localStorage === 'undefined') return;

    if (!provider) {
        (Object.keys(KEY_CONFIG) as AIProvider[]).forEach((candidate) => clearApiKey(candidate));
        return;
    }

    KEY_CONFIG[provider].storageKeys.forEach((keyName) => localStorage.removeItem(keyName));
    if (provider === 'GEMINI') {
        localStorage.removeItem('sherlock_api_key');
    }
};
