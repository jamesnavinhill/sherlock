import { beforeEach, describe, expect, it } from 'vitest';
import { getDefaultModelForProvider } from '../../config/aiModels';
import { saveSystemConfig } from '../../config/systemConfig';
import { getStoredApiKey } from '../providers/keys';
import { getCachedGeminiClient, setCachedGeminiClient } from '../providers/geminiClientState';
import {
  clearRuntimeApiKey,
  getActiveRuntimeProvider,
  hasRuntimeApiKey,
  setRuntimeApiKey,
  setRuntimeApiKeyOrThrow,
} from './providerKeys';

describe('runtime provider keys', () => {
  beforeEach(() => {
    localStorage.clear();
    clearRuntimeApiKey();
    setCachedGeminiClient(null);
  });

  it('uses the active system provider when the caller omits a provider override', () => {
    saveSystemConfig({
      provider: 'OPENAI',
      modelId: getDefaultModelForProvider('OPENAI'),
    });

    const result = setRuntimeApiKey('sk-openai-test');

    expect(result.isValid).toBe(true);
    expect(getActiveRuntimeProvider()).toBe('OPENAI');
    expect(getStoredApiKey('OPENAI')).toBe('sk-openai-test');
    expect(hasRuntimeApiKey()).toBe(true);
  });

  it('resets the cached Gemini client when a Gemini key changes', () => {
    setCachedGeminiClient({ client: 'stale' });

    const result = setRuntimeApiKey('AIza-gemini-test', 'GEMINI');

    expect(result.isValid).toBe(true);
    expect(getCachedGeminiClient()).toBeNull();
  });

  it('does not reset the cached Gemini client for non-Gemini keys', () => {
    const client = { client: 'warm' };
    setCachedGeminiClient(client);

    const result = setRuntimeApiKey('sk-openai-test', 'OPENAI');

    expect(result.isValid).toBe(true);
    expect(getCachedGeminiClient()).toBe(client);
  });

  it('resets the cached Gemini client when clearing keys without a provider override', () => {
    setCachedGeminiClient({ client: 'stale' });

    clearRuntimeApiKey();

    expect(getCachedGeminiClient()).toBeNull();
  });

  it('throws for invalid keys through the stable runtime facade contract', () => {
    expect(() => setRuntimeApiKeyOrThrow('not-a-real-key', 'OPENAI')).toThrow(
      'OpenAI keys usually start with "sk-".'
    );
  });
});
