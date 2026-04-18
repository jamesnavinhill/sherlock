import { useState } from 'react';

import type { SystemConfig } from '@/types';
import { loadSystemConfig, migrateSystemConfig } from '@/config/systemConfig';
import { saveSystemConfig } from '@/config/systemConfig';
import { serializeOpenRouterSettingsDraft } from '@/components/features/Runs/runtimeConfigState';
import type { SherlockThemeMode, SherlockThemeWorkspaceState } from '@/system/theme/schema';
import { useSettingsScopeState } from '@/store/selectors/settingsSelectors';
import { useSettingsDataState } from './useSettingsDataState';
import { useSettingsRuntimeState } from './useSettingsRuntimeState';
import { useSettingsThemeState } from './useSettingsThemeState';

interface SettingsControllerInput {
  onThemeWorkspaceChange: (workspace: SherlockThemeWorkspaceState) => void;
  themeMode: SherlockThemeMode;
  themeWorkspace: SherlockThemeWorkspaceState;
}

export const useSettingsController = ({
  onThemeWorkspaceChange,
  themeMode,
  themeWorkspace,
}: SettingsControllerInput) => {
  const { customScopes } = useSettingsScopeState();
  const initialConfig = migrateSystemConfig(loadSystemConfig());
  const runtime = useSettingsRuntimeState();
  const data = useSettingsDataState({
    initialAutoResolve: initialConfig.autoNormalizeEntities ?? true,
    initialQuietMode: initialConfig.quietMode ?? false,
  });
  const theme = useSettingsThemeState({
    onThemeWorkspaceChange,
    themeMode,
    themeWorkspace,
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
      openRouter: serializeOpenRouterSettingsDraft({
        webSearchEnabled: runtime.openRouterWebSearchEnabled,
        engine: runtime.openRouterEngine,
        maxResults: runtime.openRouterMaxResults,
        maxTotalResults: runtime.openRouterMaxTotalResults,
        searchContextSize: runtime.openRouterSearchContextSize,
        allowedDomains: runtime.openRouterAllowedDomains,
        excludedDomains: runtime.openRouterExcludedDomains,
      }),
      persona: initialConfig.persona || 'general-investigator',
      autoNormalizeEntities: data.autoResolve,
      quietMode: data.quietMode,
    };

    saveSystemConfig(config, {
    });

    if (activeTab === 'THEME') {
      theme.saveActiveTheme();
    }

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
