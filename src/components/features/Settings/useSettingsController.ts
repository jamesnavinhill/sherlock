import { useState } from 'react';

import type { SystemConfig } from '@/types';
import { loadSystemConfig, migrateSystemConfig } from '@/config/systemConfig';
import { saveSystemConfig } from '@/config/systemConfig';
import type { ThemeSurfaceSettings } from '@/utils/themeSurfaces';
import type { ThemeFontSettings } from '@/utils/themeFonts';
import { useSettingsScopeState } from '@/store/selectors/featureSelectors';
import { useSettingsDataState } from './useSettingsDataState';
import { useSettingsRuntimeState } from './useSettingsRuntimeState';
import { useSettingsThemeState } from './useSettingsThemeState';

interface SettingsControllerInput {
  accentSettings: { hue: number; lightness: number; chroma: number };
  onAccentChange: (settings: { hue: number; lightness: number; chroma: number }) => void;
  onThemeFontSettingsChange: (settings: ThemeFontSettings) => void;
  onThemeSurfaceSettingsChange: (settings: ThemeSurfaceSettings) => void;
  themeColor: string;
  themeFontSettings: ThemeFontSettings;
  themeMode: 'dark' | 'light';
  themeSurfaceSettings: ThemeSurfaceSettings;
}

export const useSettingsController = ({
  accentSettings,
  onAccentChange,
  onThemeFontSettingsChange,
  onThemeSurfaceSettingsChange,
  themeColor,
  themeFontSettings,
  themeMode,
  themeSurfaceSettings,
}: SettingsControllerInput) => {
  const { customScopes } = useSettingsScopeState();
  const initialConfig = migrateSystemConfig(loadSystemConfig());
  const runtime = useSettingsRuntimeState();
  const data = useSettingsDataState({
    initialAutoResolve: initialConfig.autoNormalizeEntities ?? true,
    initialQuietMode: initialConfig.quietMode ?? false,
  });
  const theme = useSettingsThemeState({
    accentSettings,
    onAccentChange,
    onThemeFontSettingsChange,
    onThemeSurfaceSettingsChange,
    themeMode,
    themeSurfaceSettings,
  });

  const [activeTab, setActiveTab] = useState<'DATA' | 'RUNTIME' | 'SCOPES' | 'TEMPLATES' | 'THEME'>(
    'DATA'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSaveConfiguration = () => {
    setIsSaving(true);
    setSaveError('');

    const keyError = runtime.persistProviderKeys(runtime.form.effectiveValue.provider);
    if (keyError) {
      setSaveError(keyError);
      setIsSaving(false);
      return;
    }

    const config: SystemConfig = {
      provider: runtime.form.effectiveValue.provider,
      modelId: runtime.form.effectiveValue.modelId,
      searchDepth: runtime.form.effectiveValue.searchDepth,
      thinkingBudget: runtime.form.effectiveValue.thinkingBudget,
      generationMode: runtime.form.effectiveValue.generationMode,
      openRouter: {
        webSearchEnabled: runtime.openRouterWebSearchEnabled,
        engine: runtime.openRouterEngine,
        maxResults: runtime.openRouterMaxResults,
        maxTotalResults: runtime.openRouterMaxTotalResults,
        searchContextSize: runtime.openRouterSearchContextSize,
        allowedDomains: runtime.openRouterAllowedDomains
          .split(/[\n,]/)
          .map((entry) => entry.trim())
          .filter(Boolean),
        excludedDomains: runtime.openRouterExcludedDomains
          .split(/[\n,]/)
          .map((entry) => entry.trim())
          .filter(Boolean),
      },
      persona: initialConfig.persona || 'general-investigator',
      autoNormalizeEntities: data.autoResolve,
      quietMode: data.quietMode,
    };

    saveSystemConfig(config, {
      theme: themeColor,
      themeMode,
      themeSurfaceSettings,
      themeFontSettings,
    });

    window.setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 2000);
    }, 800);
  };

  const canSaveActiveTab = activeTab === 'DATA' || activeTab === 'RUNTIME' || activeTab === 'THEME';

  return {
    activeTab,
    canSaveActiveTab,
    customScopes,
    data,
    handleSaveConfiguration,
    isSaving,
    runtime,
    saveError,
    saveSuccess,
    setActiveTab,
    theme,
  };
};
