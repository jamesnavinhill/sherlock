import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { saveSystemConfig } = vi.hoisted(() => ({
  saveSystemConfig: vi.fn(),
}));

const { useSettingsScopeState } = vi.hoisted(() => ({
  useSettingsScopeState: vi.fn(),
}));

const { useSettingsRuntimeState } = vi.hoisted(() => ({
  useSettingsRuntimeState: vi.fn(),
}));

const { useSettingsDataState } = vi.hoisted(() => ({
  useSettingsDataState: vi.fn(),
}));

const { useSettingsThemeState } = vi.hoisted(() => ({
  useSettingsThemeState: vi.fn(),
}));

vi.mock('@/config/systemConfig', () => ({
  DEFAULT_SYSTEM_CONFIG: {
    provider: 'OPENAI',
    modelId: 'gpt-test',
    searchDepth: 'STANDARD',
    generationMode: 'SINGLE_PASS',
    thinkingBudget: 1024,
    persona: 'general-investigator',
    autoNormalizeEntities: true,
    quietMode: false,
    openRouter: {
      webSearchEnabled: true,
      engine: 'auto',
      maxResults: 5,
      maxTotalResults: 15,
      searchContextSize: 'medium',
      allowedDomains: [],
      excludedDomains: [],
    },
  },
  loadSystemConfig: () => ({
    provider: 'OPENAI',
    modelId: 'gpt-test',
    searchDepth: 'STANDARD',
    generationMode: 'SINGLE_PASS',
    thinkingBudget: 1024,
    persona: 'general-investigator',
    autoNormalizeEntities: true,
    quietMode: false,
    openRouter: {
      webSearchEnabled: true,
      engine: 'auto',
      maxResults: 5,
      maxTotalResults: 15,
      searchContextSize: 'medium',
      allowedDomains: [],
      excludedDomains: [],
    },
  }),
  migrateSystemConfig: (value: unknown) => value,
  saveSystemConfig,
}));

vi.mock('@/store/selectors/settingsSelectors', () => ({
  useSettingsScopeState,
}));

vi.mock('./useSettingsRuntimeState', () => ({
  useSettingsRuntimeState,
}));

vi.mock('./useSettingsDataState', () => ({
  useSettingsDataState,
}));

vi.mock('./useSettingsThemeState', () => ({
  useSettingsThemeState,
}));

import { useSettingsController } from './useSettingsController';
import { createInitialThemeWorkspace } from '@/system/theme/schema';

describe('useSettingsController', () => {
  let runtimeState: Record<string, unknown>;
  let themeState: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    useSettingsScopeState.mockReturnValue({ customScopes: [] });
    runtimeState = {
      persistProviderKeys: vi.fn(() => null),
      form: {
        effectiveValue: {
          provider: 'OPENAI',
          modelId: 'gpt-test',
          searchDepth: 'STANDARD',
          thinkingBudget: 1024,
          generationMode: 'SINGLE_PASS',
        },
      },
      openRouterWebSearchEnabled: true,
      openRouterEngine: 'auto',
      openRouterMaxResults: 5,
      openRouterMaxTotalResults: 15,
      openRouterSearchContextSize: 'medium',
      openRouterAllowedDomains: 'example.com',
      openRouterExcludedDomains: 'bad.example',
    };
    useSettingsRuntimeState.mockReturnValue(runtimeState);
    useSettingsDataState.mockReturnValue({
      autoResolve: true,
      quietMode: false,
    });
    themeState = {
      activeTheme: createInitialThemeWorkspace().draftThemes.default,
      activeThemeId: 'default',
      exportResolvedCss: ':root {}',
      exportThemeJson: '{}',
      forkActiveTheme: vi.fn(),
      resetActiveThemeFactory: vi.fn(),
      resetAllThemeFactories: vi.fn(),
      revertActiveTheme: vi.fn(),
      saveActiveTheme: vi.fn(),
      savedTheme: createInitialThemeWorkspace().savedThemes.default,
      selectTheme: vi.fn(),
      themeMode: 'dark',
      themeDirty: false,
      themeWorkspace: createInitialThemeWorkspace(),
      updateTheme: vi.fn(),
    };
    useSettingsThemeState.mockReturnValue(themeState);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('surfaces provider-key validation errors without saving', () => {
    useSettingsRuntimeState.mockReturnValueOnce({
      ...runtimeState,
      persistProviderKeys: vi.fn(() => 'Missing OPENAI API key.'),
      form: {
        effectiveValue: {
          provider: 'OPENAI',
          modelId: 'gpt-test',
          searchDepth: 'STANDARD',
          thinkingBudget: 1024,
          generationMode: 'SINGLE_PASS',
        },
      },
      openRouterWebSearchEnabled: true,
      openRouterEngine: 'auto',
      openRouterMaxResults: 5,
      openRouterMaxTotalResults: 15,
      openRouterSearchContextSize: 'medium',
      openRouterAllowedDomains: '',
      openRouterExcludedDomains: '',
    });

    const { result } = renderHook(() =>
      useSettingsController({
        onThemeWorkspaceChange: vi.fn(),
        themeMode: 'dark',
        themeWorkspace: createInitialThemeWorkspace(),
      })
    );

    act(() => {
      result.current.handleSaveConfiguration();
    });

    expect(result.current.saveError).toBe('Missing OPENAI API key.');
    expect(saveSystemConfig).not.toHaveBeenCalled();
  });

  it('persists config and marks save success when validation passes', () => {
    const { result } = renderHook(() =>
      useSettingsController({
        onThemeWorkspaceChange: vi.fn(),
        themeMode: 'dark',
        themeWorkspace: createInitialThemeWorkspace(),
      })
    );

    act(() => {
      result.current.handleSaveConfiguration();
      vi.advanceTimersByTime(800);
    });

    expect(saveSystemConfig).toHaveBeenCalledTimes(1);
    expect(saveSystemConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'OPENAI',
        modelId: 'gpt-test',
      }),
      expect.anything()
    );
    expect(result.current.saveSuccess).toBe(true);
  });
});
