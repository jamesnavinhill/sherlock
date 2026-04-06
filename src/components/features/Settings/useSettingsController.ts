import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { useWorkspaceStore } from '../../../store/caseStore';
import type { SystemConfig } from '../../../types';
import { DEFAULT_ACCENT_SETTINGS } from '../../../utils/accent';
import {
  DEFAULT_THEME_SURFACE_SETTINGS,
  type ThemeSurfaceScale,
  type ThemeSurfaceSettings,
} from '../../../utils/themeSurfaces';
import {
  DEFAULT_THEME_FONT_SETTINGS,
  type ThemeFontSettings,
} from '../../../utils/themeFonts';
import type { AIProvider } from '../../../config/aiModels';
import {
  DEFAULT_MODEL_ID,
  getModelOptionById,
  recordRecentModelSelection,
  isProviderRuntimeReady,
} from '../../../config/aiModels';
import { loadSystemConfig, saveSystemConfig } from '../../../config/systemConfig';
import {
  clearApiKey as clearProviderApiKey,
  getStoredApiKey,
  hasApiKey as hasProviderApiKey,
  setApiKey as setProviderApiKey,
  validateApiKey,
} from '../../../services/providers/keys';
import {
  buildWorkspaceDataBackup,
  normalizeWorkspaceDataBackup,
} from '../../../services/maintenance/workspaceData';
import { clearStoredActiveWorkspaceId } from '../../../utils/localStorage';
import { getRuntimeConfigModelState } from '../Runs/runtimeConfigOptions';
import { clamp, cloneThemeSurfaceSettings } from './settingsUtils';

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
  const {
    artifacts,
    workspaces,
    workspaceRuns,
    chatSessions,
    chatMessagesBySessionId,
    chatActionsBySessionId,
    boardAgentSessions,
    boardAgentActionsBySessionId,
    headlines,
    templates,
    manualNodes,
    manualLinks,
    workspaceItems,
    workspaceBoards,
    workspaceBoardDocuments,
    customScopes,
    importWorkspaceData,
    clearWorkspaceData,
  } = useWorkspaceStore();

  const initialConfig = loadSystemConfig();

  const [activeTab, setActiveTab] = useState('GENERAL');
  const [geminiKey, setGeminiKey] = useState(() => getStoredApiKey('GEMINI') ?? '');
  const [openRouterKey, setOpenRouterKey] = useState(() => getStoredApiKey('OPENROUTER') ?? '');
  const [openAIKey, setOpenAIKey] = useState(() => getStoredApiKey('OPENAI') ?? '');
  const [anthropicKey, setAnthropicKey] = useState(() => getStoredApiKey('ANTHROPIC') ?? '');

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  const [autoResolve, setAutoResolve] = useState(initialConfig.autoNormalizeEntities ?? true);
  const [quietMode, setQuietMode] = useState(initialConfig.quietMode ?? false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(
    isProviderRuntimeReady(initialConfig.provider) ? initialConfig.provider : 'GEMINI'
  );
  const [selectedModel, setSelectedModel] = useState(initialConfig.modelId ?? DEFAULT_MODEL_ID);
  const [searchDepth, setSearchDepth] = useState<'STANDARD' | 'DEEP'>(
    initialConfig.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD'
  );
  const [thinkingBudget, setThinkingBudget] = useState(
    typeof initialConfig.thinkingBudget === 'number' ? initialConfig.thinkingBudget : 0
  );
  const [generationMode, setGenerationMode] = useState<'SINGLE_PASS' | 'STAGED'>(
    initialConfig.generationMode === 'SINGLE_PASS' ? 'SINGLE_PASS' : 'STAGED'
  );
  const [openRouterWebSearchEnabled, setOpenRouterWebSearchEnabled] = useState(
    initialConfig.openRouter?.webSearchEnabled !== false
  );
  const [openRouterEngine, setOpenRouterEngine] = useState<
    'auto' | 'native' | 'exa' | 'firecrawl' | 'parallel'
  >(initialConfig.openRouter?.engine || 'auto');
  const [openRouterMaxResults, setOpenRouterMaxResults] = useState(
    initialConfig.openRouter?.maxResults || 5
  );
  const [openRouterMaxTotalResults, setOpenRouterMaxTotalResults] = useState(
    initialConfig.openRouter?.maxTotalResults || 15
  );
  const [openRouterSearchContextSize, setOpenRouterSearchContextSize] = useState<
    'low' | 'medium' | 'high'
  >(initialConfig.openRouter?.searchContextSize || 'medium');
  const [openRouterAllowedDomains, setOpenRouterAllowedDomains] = useState(
    (initialConfig.openRouter?.allowedDomains || []).join(', ')
  );
  const [openRouterExcludedDomains, setOpenRouterExcludedDomains] = useState(
    (initialConfig.openRouter?.excludedDomains || []).join(', ')
  );
  const [showOpenRouterBrowser, setShowOpenRouterBrowser] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [themeSections, setThemeSections] = useState({
    accent: true,
    fonts: true,
    surfaces: true,
  });
  const [activeSurfaceMode, setActiveSurfaceMode] =
    useState<keyof ThemeSurfaceSettings>(themeMode);
  const [selectedSurfaceKey, setSelectedSurfaceKey] =
    useState<keyof ThemeSurfaceScale>('panel');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProvider = isProviderRuntimeReady(selectedProvider) ? selectedProvider : 'GEMINI';
  const {
    activeModelId,
    providerMeta: activeProviderMeta,
    selectableModels,
    selectedModelCapabilities,
    supportsThinkingBudget,
  } = getRuntimeConfigModelState(activeProvider, selectedModel);
  const selectedModelMeta = getModelOptionById(activeModelId);

  const toggleThemeSection = (section: keyof typeof themeSections) => {
    setThemeSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const handleClearProviderKey = (provider: AIProvider) => {
    clearProviderApiKey(provider);
    setSaveError('');
    setSaveSuccess(false);

    if (provider === 'GEMINI') setGeminiKey('');
    if (provider === 'OPENROUTER') setOpenRouterKey('');
    if (provider === 'OPENAI') setOpenAIKey('');
    if (provider === 'ANTHROPIC') setAnthropicKey('');
  };

  const handleSaveConfiguration = () => {
    setIsSaving(true);
    setSaveError('');

    const gemini = geminiKey.trim();
    const openRouter = openRouterKey.trim();
    const openAI = openAIKey.trim();
    const anthropic = anthropicKey.trim();

    const candidateKeys: Array<{ key: string; provider: AIProvider }> = [
      { provider: 'GEMINI', key: gemini },
      { provider: 'OPENROUTER', key: openRouter },
      { provider: 'OPENAI', key: openAI },
      { provider: 'ANTHROPIC', key: anthropic },
    ];

    for (const candidate of candidateKeys) {
      if (!candidate.key) continue;
      const validation = validateApiKey(candidate.provider, candidate.key);
      if (!validation.isValid) {
        setSaveError(validation.message || `Invalid ${candidate.provider} API key.`);
        setIsSaving(false);
        return;
      }
    }

    for (const candidate of candidateKeys) {
      clearProviderApiKey(candidate.provider);

      if (!candidate.key) continue;

      const saveResult = setProviderApiKey(candidate.provider, candidate.key);
      if (!saveResult.isValid) {
        setSaveError(saveResult.message || `Failed to store ${candidate.provider} API key.`);
        setIsSaving(false);
        return;
      }

      const persistedKey = getStoredApiKey(candidate.provider);
      if (persistedKey !== candidate.key) {
        setSaveError(`Failed to persist ${candidate.provider} API key. Please try again.`);
        setIsSaving(false);
        return;
      }
    }

    if (!hasProviderApiKey(activeProvider)) {
      setSaveError(`Missing ${activeProvider} API key. Add one or switch active provider.`);
      setIsSaving(false);
      return;
    }

    const existingConfig = loadSystemConfig();
    const config: SystemConfig = {
      provider: activeProvider,
      modelId: activeModelId,
      searchDepth,
      thinkingBudget: supportsThinkingBudget ? thinkingBudget : 0,
      generationMode,
      openRouter: {
        webSearchEnabled: openRouterWebSearchEnabled,
        engine: openRouterEngine,
        maxResults: openRouterMaxResults,
        maxTotalResults: openRouterMaxTotalResults,
        searchContextSize: openRouterSearchContextSize,
        allowedDomains: openRouterAllowedDomains
          .split(/[\n,]/)
          .map((entry) => entry.trim())
          .filter(Boolean),
        excludedDomains: openRouterExcludedDomains
          .split(/[\n,]/)
          .map((entry) => entry.trim())
          .filter(Boolean),
      },
      persona: existingConfig.persona || 'general-investigator',
      autoNormalizeEntities: autoResolve,
      quietMode,
    };

    saveSystemConfig(config, {
      theme: themeColor,
      themeMode,
      themeSurfaceSettings,
      themeFontSettings,
    });
    recordRecentModelSelection(activeModelId);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 800);
  };

  const handleExportData = () => {
    const data = buildWorkspaceDataBackup({
      workspaces,
      artifacts,
      runs: workspaceRuns,
      chatSessions,
      chatMessagesBySessionId,
      chatActionsBySessionId,
      boardAgentSessions,
      boardAgentActionsBySessionId,
      signals: headlines,
      manualNodes,
      manualLinks,
      workspaceItems,
      workspaceBoards,
      workspaceBoardDocuments: Object.values(workspaceBoardDocuments),
      templates,
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sherlock-workspace-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const data = normalizeWorkspaceDataBackup(JSON.parse(loadEvent.target?.result as string));
        if (
          confirm(
            'This will overwrite your current workspace data. Provider keys, theme settings, and other local app preferences will stay as-is. Continue?'
          )
        ) {
          await importWorkspaceData(data);
          clearStoredActiveWorkspaceId();
          alert('Workspace data imported successfully.');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to parse JSON file.';
        alert(message);
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    if (
      confirm(
        'CRITICAL WARNING: This will permanently delete all saved workspace data, including artifacts, runs, chat history, research boards, workspace library items, graph data, templates, and saved signals. Local theme settings, provider defaults, and API keys will stay untouched. Proceed?'
      )
    ) {
      await clearWorkspaceData();
      clearStoredActiveWorkspaceId();
      alert('Workspace data purged.');
    }
  };

  const handleResetThemeSettings = () => {
    onAccentChange(DEFAULT_ACCENT_SETTINGS);
    onThemeSurfaceSettingsChange(DEFAULT_THEME_SURFACE_SETTINGS);
  };

  const handleResetFonts = () => {
    onThemeFontSettingsChange(DEFAULT_THEME_FONT_SETTINGS);
  };

  const getSurfaceBounds = (
    mode: keyof ThemeSurfaceSettings,
    surfaceKey: keyof ThemeSurfaceScale
  ) => {
    if (mode === 'dark') {
      const lightnessRanges: Record<keyof ThemeSurfaceScale, { max: number; min: number }> = {
        background: { min: 0, max: 0.14 },
        panel: { min: 0, max: 0.22 },
        surface: { min: 0, max: 0.32 },
      };

      return {
        lightnessMin: lightnessRanges[surfaceKey].min,
        lightnessMax: lightnessRanges[surfaceKey].max,
        chromaMax: 0.06,
      };
    }

    const lightnessRanges: Record<keyof ThemeSurfaceScale, { max: number; min: number }> = {
      background: { min: 0.88, max: 1 },
      panel: { min: 0.9, max: 1 },
      surface: { min: 0.82, max: 0.98 },
    };

    return {
      lightnessMin: lightnessRanges[surfaceKey].min,
      lightnessMax: lightnessRanges[surfaceKey].max,
      chromaMax: 0.08,
    };
  };

  const clampSurfaceSettings = (
    mode: keyof ThemeSurfaceSettings,
    surfaceKey: keyof ThemeSurfaceScale,
    settings: ThemeSurfaceScale[keyof ThemeSurfaceScale]
  ) => {
    const bounds = getSurfaceBounds(mode, surfaceKey);

    return {
      hue: ((Math.round(settings.hue) % 360) + 360) % 360,
      lightness: clamp(
        Number(settings.lightness.toFixed(3)),
        bounds.lightnessMin,
        bounds.lightnessMax
      ),
      chroma: clamp(Number(settings.chroma.toFixed(3)), 0, bounds.chromaMax),
    };
  };

  const handleThemeSurfaceChange = (
    mode: keyof ThemeSurfaceSettings,
    surfaceKey: keyof ThemeSurfaceScale,
    settings: ThemeSurfaceScale[keyof ThemeSurfaceScale]
  ) => {
    onThemeSurfaceSettingsChange({
      ...themeSurfaceSettings,
      [mode]: {
        ...themeSurfaceSettings[mode],
        [surfaceKey]: clampSurfaceSettings(mode, surfaceKey, settings),
      },
    });
  };

  const updateModeSurfaces = (
    mode: keyof ThemeSurfaceSettings,
    updater: (scale: ThemeSurfaceScale) => ThemeSurfaceScale
  ) => {
    const nextScale = updater(themeSurfaceSettings[mode]);

    onThemeSurfaceSettingsChange({
      ...themeSurfaceSettings,
      [mode]: {
        background: clampSurfaceSettings(mode, 'background', nextScale.background),
        panel: clampSurfaceSettings(mode, 'panel', nextScale.panel),
        surface: clampSurfaceSettings(mode, 'surface', nextScale.surface),
      },
    });
  };

  const updateSelectedSurfaceField = (
    field: keyof ThemeSurfaceScale[keyof ThemeSurfaceScale],
    rawValue: number
  ) => {
    const current = themeSurfaceSettings[activeSurfaceMode][selectedSurfaceKey];
    handleThemeSurfaceChange(activeSurfaceMode, selectedSurfaceKey, {
      ...current,
      [field]: rawValue,
    });
  };

  const handleApplySurfacePreset = (preset: ThemeSurfaceSettings) => {
    onThemeSurfaceSettingsChange(cloneThemeSurfaceSettings(preset));
  };

  const handleResetSurfaceMode = (mode: keyof ThemeSurfaceSettings) => {
    onThemeSurfaceSettingsChange({
      ...themeSurfaceSettings,
      [mode]: cloneThemeSurfaceSettings(DEFAULT_THEME_SURFACE_SETTINGS)[mode],
    });
  };

  const handleMatchAccentHue = (mode: keyof ThemeSurfaceSettings) => {
    updateModeSurfaces(mode, (scale) => ({
      background: { ...scale.background, hue: accentSettings.hue },
      panel: { ...scale.panel, hue: accentSettings.hue },
      surface: { ...scale.surface, hue: accentSettings.hue },
    }));
  };

  const handleAdjustModeChroma = (mode: keyof ThemeSurfaceSettings, delta: number) => {
    updateModeSurfaces(mode, (scale) => ({
      background: {
        ...scale.background,
        chroma: scale.background.chroma + delta * 0.6,
      },
      panel: {
        ...scale.panel,
        chroma: scale.panel.chroma + delta,
      },
      surface: {
        ...scale.surface,
        chroma: scale.surface.chroma + delta,
      },
    }));
  };

  const handleAdjustModeSeparation = (mode: keyof ThemeSurfaceSettings, direction: 1 | -1) => {
    if (mode === 'dark') {
      updateModeSurfaces(mode, (scale) => ({
        background: {
          ...scale.background,
          lightness: scale.background.lightness - direction * 0.006,
        },
        panel: {
          ...scale.panel,
          lightness: scale.panel.lightness + direction * 0.012,
        },
        surface: {
          ...scale.surface,
          lightness: scale.surface.lightness + direction * 0.02,
        },
      }));
      return;
    }

    updateModeSurfaces(mode, (scale) => ({
      background: {
        ...scale.background,
        lightness: scale.background.lightness + direction * 0.008,
      },
      panel: {
        ...scale.panel,
        lightness: scale.panel.lightness + direction * 0.012,
      },
      surface: {
        ...scale.surface,
        lightness: scale.surface.lightness - direction * 0.015,
      },
    }));
  };

  return {
    activeModelId,
    activeProvider,
    activeProviderMeta,
    activeSurfaceMode,
    activeTab,
    anthropicKey,
    autoResolve,
    customScopes,
    fileInputRef,
    geminiKey,
    generationMode,
    getSurfaceBounds,
    handleAdjustModeChroma,
    handleAdjustModeSeparation,
    handleApplySurfacePreset,
    handleClearData,
    handleClearProviderKey,
    handleExportData,
    handleImportJSON,
    handleMatchAccentHue,
    handleResetFonts,
    handleResetSurfaceMode,
    handleResetThemeSettings,
    handleSaveConfiguration,
    handleThemeSurfaceChange,
    isSaving,
    openAIKey,
    openRouterAllowedDomains,
    openRouterEngine,
    openRouterExcludedDomains,
    openRouterKey,
    openRouterMaxResults,
    openRouterMaxTotalResults,
    openRouterSearchContextSize,
    openRouterWebSearchEnabled,
    quietMode,
    saveError,
    saveSuccess,
    searchDepth,
    selectableModels,
    selectedModel,
    selectedModelCapabilities,
    selectedModelMeta,
    selectedProvider,
    selectedSurfaceKey,
    setActiveSurfaceMode,
    setActiveTab,
    setAnthropicKey,
    setAutoResolve,
    setGeminiKey,
    setGenerationMode,
    setOpenAIKey,
    setOpenRouterAllowedDomains,
    setOpenRouterBrowser: setShowOpenRouterBrowser,
    setOpenRouterEngine,
    setOpenRouterExcludedDomains,
    setOpenRouterKey,
    setOpenRouterMaxResults,
    setOpenRouterMaxTotalResults,
    setOpenRouterSearchContextSize,
    setOpenRouterWebSearchEnabled,
    setQuietMode,
    setSelectedModel,
    setSelectedProvider,
    setSelectedSurfaceKey,
    setShowAnthropicKey,
    setShowGeminiKey,
    setShowOpenAIKey,
    setShowOpenRouterKey,
    setThinkingBudget,
    setSearchDepth,
    showAnthropicKey,
    showGeminiKey,
    showOpenAIKey,
    showOpenRouterBrowser,
    showOpenRouterKey,
    supportsThinkingBudget,
    themeSections,
    thinkingBudget,
    toggleThemeSection,
    updateSelectedSurfaceField,
  };
};
