import { beforeEach, describe, expect, it } from 'vitest';
import type { AIProvider } from '../../config/aiModels';
import {
    clearApiKey,
    getApiKeyOrThrow,
    getStoredApiKey,
    hasApiKey,
    setApiKey,
    validateApiKey,
} from './keys';

describe('provider keys', () => {
    beforeEach(() => {
        localStorage.clear();
        clearApiKey();
    });

    it('validates key formats by provider', () => {
        const cases: Array<{ provider: AIProvider; valid: string; invalid: string }> = [
            { provider: 'GEMINI', valid: 'AIza-example', invalid: 'sk-invalid' },
            { provider: 'OPENROUTER', valid: 'sk-or-v1-example', invalid: 'sk-example' },
            { provider: 'OPENAI', valid: 'sk-example', invalid: 'sk-ant-example' },
            { provider: 'ANTHROPIC', valid: 'sk-ant-example', invalid: 'AIza-example' },
        ];

        cases.forEach(({ provider, valid, invalid }) => {
            expect(validateApiKey(provider, valid).isValid).toBe(true);
            expect(validateApiKey(provider, invalid).isValid).toBe(false);
        });
    });

    it('stores and reads keys per provider, with Gemini legacy alias compatibility', () => {
        expect(setApiKey('GEMINI', 'AIza-live-gemini').isValid).toBe(true);
        expect(setApiKey('OPENROUTER', 'sk-or-v1-live-openrouter').isValid).toBe(true);
        expect(setApiKey('OPENAI', 'sk-live-openai').isValid).toBe(true);
        expect(setApiKey('ANTHROPIC', 'sk-ant-live-anthropic').isValid).toBe(true);

        expect(getStoredApiKey('GEMINI')).toBe('AIza-live-gemini');
        expect(getStoredApiKey('OPENROUTER')).toBe('sk-or-v1-live-openrouter');
        expect(getStoredApiKey('OPENAI')).toBe('sk-live-openai');
        expect(getStoredApiKey('ANTHROPIC')).toBe('sk-ant-live-anthropic');

        expect(localStorage.getItem('sherlock_api_key')).toBe('AIza-live-gemini');
        expect(hasApiKey('GEMINI')).toBe(true);
        expect(hasApiKey('OPENROUTER')).toBe(true);
        expect(hasApiKey('OPENAI')).toBe(true);
        expect(hasApiKey('ANTHROPIC')).toBe(true);

        expect(getApiKeyOrThrow('GEMINI')).toBe('AIza-live-gemini');
        expect(getApiKeyOrThrow('OPENROUTER')).toBe('sk-or-v1-live-openrouter');
    });

    it('clears provider keys and bulk clear removes all local keys', () => {
        setApiKey('GEMINI', 'AIza-live-gemini');
        setApiKey('OPENAI', 'sk-live-openai');

        clearApiKey('GEMINI');
        expect(getStoredApiKey('GEMINI')).toBeUndefined();
        expect(localStorage.getItem('sherlock_api_key')).toBeNull();

        clearApiKey();
        expect(getStoredApiKey('OPENAI')).toBeUndefined();
        expect(localStorage.getItem('OPENROUTER_API_KEY')).toBeNull();
        expect(localStorage.getItem('ANTHROPIC_API_KEY')).toBeNull();
    });

    it('overwrites existing keys for each provider', () => {
        localStorage.setItem('GEMINI_API_KEY', 'AIza-old-gemini');
        localStorage.setItem('sherlock_api_key', 'AIza-legacy-old-gemini');
        localStorage.setItem('OPENROUTER_API_KEY', 'sk-or-v1-old-openrouter');
        localStorage.setItem('OPENAI_API_KEY', 'sk-old-openai');
        localStorage.setItem('ANTHROPIC_API_KEY', 'sk-ant-old-anthropic');

        expect(setApiKey('GEMINI', 'AIza-new-gemini').isValid).toBe(true);
        expect(setApiKey('OPENROUTER', 'sk-or-v1-new-openrouter').isValid).toBe(true);
        expect(setApiKey('OPENAI', 'sk-new-openai').isValid).toBe(true);
        expect(setApiKey('ANTHROPIC', 'sk-ant-new-anthropic').isValid).toBe(true);

        expect(localStorage.getItem('GEMINI_API_KEY')).toBe('AIza-new-gemini');
        expect(localStorage.getItem('sherlock_api_key')).toBe('AIza-new-gemini');
        expect(localStorage.getItem('OPENROUTER_API_KEY')).toBe('sk-or-v1-new-openrouter');
        expect(localStorage.getItem('OPENAI_API_KEY')).toBe('sk-new-openai');
        expect(localStorage.getItem('ANTHROPIC_API_KEY')).toBe('sk-ant-new-anthropic');
    });
});
