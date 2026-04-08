import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getCompactModelChoicesForProvider,
  getOpenRouterCatalogSnapshot,
  getRecentModelSelections,
  recordRecentModelSelection,
  refreshOpenRouterModelCatalog,
  resolveModelSelection,
} from './aiModels';

describe('aiModels catalog and selection', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('falls back to the bundled OpenRouter snapshot when no cached catalog exists', () => {
    const snapshot = getOpenRouterCatalogSnapshot();

    expect(snapshot.source).toBe('OPENROUTER_SNAPSHOT');
    expect(snapshot.isFresh).toBe(false);
    expect(snapshot.models.some((model) => model.id === 'openrouter/free')).toBe(true);
  });

  it('refreshes, normalizes, and caches the OpenRouter live catalog', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 'zeta/model',
            name: 'Zeta Model',
            description: 'Live catalog entry',
            context_length: '64000',
            architecture: { input_modalities: ['image'] },
            top_provider: { max_completion_tokens: '8192' },
            supported_parameters: ['reasoning', 'response_format', 'tools'],
          },
        ],
      }),
    } as Response);

    const refreshed = await refreshOpenRouterModelCatalog({ force: true });
    const snapshot = getOpenRouterCatalogSnapshot();

    expect(refreshed.source).toBe('OPENROUTER_LIVE');
    expect(refreshed.models).toHaveLength(1);
    expect(refreshed.models[0]).toMatchObject({
      id: 'zeta/model',
      contextLength: 64000,
      maxCompletionTokens: 8192,
      supportedParameters: ['reasoning', 'response_format', 'tools'],
    });
    expect(refreshed.models[0].capabilities).toMatchObject({
      supportsThinkingBudget: true,
      supportsStructuredOutput: true,
      supportsToolUse: true,
      supportsVision: true,
      supportsWebSearch: true,
    });
    expect(snapshot.source).toBe('OPENROUTER_LIVE');
    expect(snapshot.isFresh).toBe(true);
    expect(snapshot.models.map((model) => model.id)).toEqual(['zeta/model']);
  });

  it('preserves manual OpenRouter selections across recent-choice helpers', () => {
    recordRecentModelSelection('acme/manual-model');

    const recentSelections = getRecentModelSelections('OPENROUTER');
    const compactChoices = getCompactModelChoicesForProvider('OPENROUTER', 'acme/manual-model');

    expect(recentSelections.map((model) => model.id)).toContain('acme/manual-model');
    expect(compactChoices.map((model) => model.id)).toContain('acme/manual-model');
    expect(resolveModelSelection('OPENROUTER', 'acme/manual-model')).toBe('acme/manual-model');
  });
});
