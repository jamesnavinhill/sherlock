import { describe, expect, it } from 'vitest';

import {
  createOpenRouterSettingsDraft,
  createRuntimeConfigFormInput,
  serializeOpenRouterSettingsDraft,
} from './runtimeConfigState';

describe('runtimeConfigState', () => {
  it('maps runtime config sources into the shared form input shape', () => {
    expect(
      createRuntimeConfigFormInput({
        modelId: 'gpt-5.4-mini',
        generationMode: 'SINGLE_PASS',
        searchDepth: 'DEEP',
        thinkingBudget: 2048,
      })
    ).toEqual({
      modelId: 'gpt-5.4-mini',
      searchDepth: 'DEEP',
      generationMode: 'SINGLE_PASS',
      thinkingBudget: 2048,
      provider: undefined,
    });
  });

  it('creates openrouter settings drafts from persisted config values', () => {
    expect(
      createOpenRouterSettingsDraft({
        openRouter: {
          webSearchEnabled: false,
          engine: 'exa',
          maxResults: 8,
          maxTotalResults: 18,
          searchContextSize: 'high',
          allowedDomains: ['sec.gov', 'ft.com'],
          excludedDomains: ['reddit.com'],
        },
      })
    ).toEqual({
      webSearchEnabled: false,
      engine: 'exa',
      maxResults: 8,
      maxTotalResults: 18,
      searchContextSize: 'high',
      allowedDomains: 'sec.gov, ft.com',
      excludedDomains: 'reddit.com',
    });
  });

  it('serializes settings drafts into normalized openrouter config', () => {
    expect(
      serializeOpenRouterSettingsDraft({
        webSearchEnabled: true,
        engine: 'parallel',
        maxResults: 40,
        maxTotalResults: 0,
        searchContextSize: 'low',
        allowedDomains: 'sec.gov,\nft.com',
        excludedDomains: ' reddit.com ',
      })
    ).toEqual({
      webSearchEnabled: true,
      engine: 'parallel',
      maxResults: 25,
      maxTotalResults: 1,
      searchContextSize: 'low',
      allowedDomains: ['sec.gov', 'ft.com'],
      excludedDomains: ['reddit.com'],
    });
  });
});
