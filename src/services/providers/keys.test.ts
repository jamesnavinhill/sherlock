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
      { provider: 'OPENROUTER', valid: 'sk-or-x', invalid: 'sk-example' },
      { provider: 'OPENAI', valid: 'sk-example', invalid: 'sk-ant-example' },
      { provider: 'ANTHROPIC', valid: 'sk-ant-example', invalid: 'AIza-example' },
    ];

    cases.forEach(({ provider, valid, invalid }) => {
      expect(validateApiKey(provider, valid).isValid).toBe(true);
      expect(validateApiKey(provider, invalid).isValid).toBe(false);
    });
  });

  it('stores and reads keys per provider, with Gemini legacy alias compatibility', () => {
    expect(setApiKey('GEMINI', 'AIza-test').isValid).toBe(true);
    expect(setApiKey('OPENROUTER', 'sk-or-test').isValid).toBe(true);
    expect(setApiKey('OPENAI', 'sk-test').isValid).toBe(true);
    expect(setApiKey('ANTHROPIC', 'sk-ant-test').isValid).toBe(true);

    expect(getStoredApiKey('GEMINI')).toBe('AIza-test');
    expect(getStoredApiKey('OPENROUTER')).toBe('sk-or-test');
    expect(getStoredApiKey('OPENAI')).toBe('sk-test');
    expect(getStoredApiKey('ANTHROPIC')).toBe('sk-ant-test');

    expect(localStorage.getItem('sherlock_api_key')).toBe('AIza-test');
    expect(hasApiKey('GEMINI')).toBe(true);
    expect(hasApiKey('OPENROUTER')).toBe(true);
    expect(hasApiKey('OPENAI')).toBe(true);
    expect(hasApiKey('ANTHROPIC')).toBe(true);

    expect(getApiKeyOrThrow('GEMINI')).toBe('AIza-test');
    expect(getApiKeyOrThrow('OPENROUTER')).toBe('sk-or-test');
  });

  it('clears provider keys and bulk clear removes all local keys', () => {
    setApiKey('GEMINI', 'AIza-test');
    setApiKey('OPENAI', 'sk-test');

    clearApiKey('GEMINI');
    expect(getStoredApiKey('GEMINI')).toBeUndefined();
    expect(localStorage.getItem('sherlock_api_key')).toBeNull();

    clearApiKey();
    expect(getStoredApiKey('OPENAI')).toBeUndefined();
    expect(localStorage.getItem('OPENROUTER_API_KEY')).toBeNull();
    expect(localStorage.getItem('ANTHROPIC_API_KEY')).toBeNull();
  });

  it('overwrites existing keys for each provider', () => {
    localStorage.setItem('GEMINI_API_KEY', 'AIza-old');
    localStorage.setItem('sherlock_api_key', 'AIza-legacy-old');
    localStorage.setItem('OPENROUTER_API_KEY', 'sk-or-old');
    localStorage.setItem('OPENAI_API_KEY', 'sk-old');
    localStorage.setItem('ANTHROPIC_API_KEY', 'sk-ant-old');

    expect(setApiKey('GEMINI', 'AIza-new').isValid).toBe(true);
    expect(setApiKey('OPENROUTER', 'sk-or-new').isValid).toBe(true);
    expect(setApiKey('OPENAI', 'sk-new').isValid).toBe(true);
    expect(setApiKey('ANTHROPIC', 'sk-ant-new').isValid).toBe(true);

    expect(localStorage.getItem('GEMINI_API_KEY')).toBe('AIza-new');
    expect(localStorage.getItem('sherlock_api_key')).toBe('AIza-new');
    expect(localStorage.getItem('OPENROUTER_API_KEY')).toBe('sk-or-new');
    expect(localStorage.getItem('OPENAI_API_KEY')).toBe('sk-new');
    expect(localStorage.getItem('ANTHROPIC_API_KEY')).toBe('sk-ant-new');
  });
});
