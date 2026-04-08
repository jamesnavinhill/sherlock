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

describe('useSettingsController', () => {
  let runtimeState: Record<string, unknown>;

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
    useSettingsThemeState.mockReturnValue({
      activeSurfaceMode: 'dark',
      selectedSurfaceKey: null,
      themeSections: {},
      getSurfaceBounds: vi.fn(),
      setActiveSurfaceMode: vi.fn(),
      setSelectedSurfaceKey: vi.fn(),
      toggleThemeSection: vi.fn(),
      handleResetThemeSettings: vi.fn(),
      handleResetFonts: vi.fn(),
      handleApplySurfacePreset: vi.fn(),
      handleResetSurfaceMode: vi.fn(),
      handleMatchAccentHue: vi.fn(),
      handleAdjustModeChroma: vi.fn(),
      handleAdjustModeSeparation: vi.fn(),
      updateSelectedSurfaceField: vi.fn(),
    });
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
        accentSettings: { hue: 20, lightness: 60, chroma: 0.2 },
        onAccentChange: vi.fn(),
        onThemeFontSettingsChange: vi.fn(),
        onThemeSurfaceSettingsChange: vi.fn(),
        themeColor: 'oklch(62% 0.2 20)',
        themeFontSettings: {} as never,
        themeMode: 'dark',
        themeSurfaceSettings: {} as never,
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
        accentSettings: { hue: 20, lightness: 60, chroma: 0.2 },
        onAccentChange: vi.fn(),
        onThemeFontSettingsChange: vi.fn(),
        onThemeSurfaceSettingsChange: vi.fn(),
        themeColor: 'oklch(62% 0.2 20)',
        themeFontSettings: {} as never,
        themeMode: 'dark',
        themeSurfaceSettings: {} as never,
      })
    );

    act(() => {
      result.current.handleSaveConfiguration();
      vi.advanceTimersByTime(800);
    });

    expect(saveSystemConfig).toHaveBeenCalledTimes(1);
    expect(result.current.saveSuccess).toBe(true);
  });
});
