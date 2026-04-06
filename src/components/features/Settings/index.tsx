import React, { useRef, useState } from 'react';
import {
  Shield,
  Palette,
  Type,
  Database,
  Trash2,
  Download,
  Upload,
  Check,
  Key,
  Save,
  RefreshCw,
  AlertTriangle,
  X,
  Cpu,
  Workflow,
} from 'lucide-react';
import { useWorkspaceStore } from '../../../store/caseStore';
import { TemplateGallery } from './TemplateGallery';
import { ScopeManager } from '../../ui/ScopeManager';
import { Accordion } from '../../ui/Accordion';
import { OsintSelect } from '../../ui/OsintSelect';
import type { InvestigationLaunchRequest, SystemConfig } from '../../../types';
import { AccentPicker } from '../../ui/AccentPicker';
import { DEFAULT_ACCENT_SETTINGS, buildAccentColor } from '../../../utils/accent';
import {
  DEFAULT_THEME_SURFACE_SETTINGS,
  THEME_SURFACE_PRESETS,
  type ThemeSurfaceScale,
  type ThemeSurfaceSettings,
} from '../../../utils/themeSurfaces';
import {
  DEFAULT_THEME_FONT_SETTINGS,
  THEME_FONT_OPTIONS,
  getThemeFontOption,
  getThemeFontOptionsForRole,
  type ThemeFontSettings,
} from '../../../utils/themeFonts';
import { getAllScopes, getScopeById } from '../../../data/presets';
import type { AIProvider } from '../../../config/aiModels';
import {
  AI_PROVIDERS,
  DEFAULT_MODEL_ID,
  getModelProvider,
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
import { OpenRouterModelBrowser } from '../../ui/OpenRouterModelBrowser';
import { ThinkingBudgetControl } from '../Runs/ThinkingBudgetControl';
import {
  getFallbackRuntimeModel,
  getRuntimeConfigModelState,
} from '../Runs/runtimeConfigOptions';
import {
  clamp,
  cloneThemeSurfaceSettings,
  FONT_ROLE_CARDS,
  getSurfacePreviewTone,
  SURFACE_LABELS,
  TABS,
} from './settingsUtils';

interface SettingsProps {
  themeColor: string;
  themeMode: 'dark' | 'light';
  onAccentChange: (settings: { hue: number; lightness: number; chroma: number }) => void;
  accentSettings: { hue: number; lightness: number; chroma: number };
  themeSurfaceSettings: ThemeSurfaceSettings;
  onThemeSurfaceSettingsChange: (settings: ThemeSurfaceSettings) => void;
  themeFontSettings: ThemeFontSettings;
  onThemeFontSettingsChange: (settings: ThemeFontSettings) => void;
  onStartCase: (request: InvestigationLaunchRequest) => void;
  onClose: () => void;
}


export const Settings: React.FC<SettingsProps> = ({
  themeColor,
  themeMode,
  onAccentChange,
  accentSettings,
  themeSurfaceSettings,
  onThemeSurfaceSettingsChange,
  themeFontSettings,
  onThemeFontSettingsChange,
  onStartCase,
  onClose,
}) => {
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

    const candidateKeys: Array<{ provider: AIProvider; key: string }> = [
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
      // Ensure overwrite behavior by clearing previous provider keys first.
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
      workspaces: workspaces,
      artifacts: artifacts,
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
    const a = document.createElement('a');
    a.href = url;
    a.download = `sherlock-workspace-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = normalizeWorkspaceDataBackup(JSON.parse(event.target?.result as string));
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
      const lightnessRanges: Record<keyof ThemeSurfaceScale, { min: number; max: number }> = {
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

    const lightnessRanges: Record<keyof ThemeSurfaceScale, { min: number; max: number }> = {
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
      lightness: clamp(Number(settings.lightness.toFixed(3)), bounds.lightnessMin, bounds.lightnessMax),
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

  const renderThemeSurfaceEditor = () => {
    const selectedSurface = themeSurfaceSettings[activeSurfaceMode][selectedSurfaceKey];
    const bounds = getSurfaceBounds(activeSurfaceMode, selectedSurfaceKey);
    const backgroundTone = getSurfacePreviewTone(themeSurfaceSettings[activeSurfaceMode].background);
    const panelTone = getSurfacePreviewTone(themeSurfaceSettings[activeSurfaceMode].panel);
    const surfaceTone = getSurfacePreviewTone(themeSurfaceSettings[activeSurfaceMode].surface);

    return (
      <div className="space-y-6 px-3 pb-3 pt-1">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-osint-label text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                Theme Presets
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Start from a whole-system palette, then tune only the one surface that needs it.
                Full OKLCH values stay available without keeping eighteen sliders on screen.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetThemeSettings}
              className="font-osint-label px-3 py-1 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white text-[10px] uppercase transition-colors"
            >
              Reset Theme
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {THEME_SURFACE_PRESETS.map((preset) => {
              const isActive =
                JSON.stringify(themeSurfaceSettings) === JSON.stringify(preset.settings);

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplySurfacePreset(preset.settings)}
                  className={`rounded border p-4 text-left transition-colors ${
                    isActive
                      ? 'border-osint-primary bg-osint-primary/8'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-osint-label text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                      {preset.label}
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-sm border border-zinc-700"
                        style={{ background: buildAccentColor(preset.settings.dark.panel) }}
                      />
                      <div
                        className="h-3 w-3 rounded-sm border border-zinc-700"
                        style={{ background: buildAccentColor(preset.settings.light.panel) }}
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-osint-label text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                Surface Workbench
              </div>
              <div className="mt-2 font-osint-display text-lg font-bold text-white">
                {activeSurfaceMode === 'dark' ? 'Dark' : 'Light'} mode
              </div>
            </div>
            <div className="inline-flex border border-zinc-800 bg-black">
              {(['dark', 'light'] as Array<keyof ThemeSurfaceSettings>).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setActiveSurfaceMode(mode)}
                  className={`font-osint-label px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors ${
                    activeSurfaceMode === mode
                      ? 'bg-osint-primary/12 text-osint-primary'
                      : 'text-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="space-y-4">
              <div
                className="rounded border border-zinc-800 p-5"
                style={{ background: buildAccentColor(themeSurfaceSettings[activeSurfaceMode].background) }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedSurfaceKey('background')}
                  className={`w-full rounded border p-4 text-left transition-colors ${
                    selectedSurfaceKey === 'background'
                      ? 'border-osint-primary bg-black/10'
                      : 'border-transparent bg-transparent hover:border-white/20'
                  }`}
                  style={{
                    color: backgroundTone.textColor,
                    borderColor:
                      selectedSurfaceKey === 'background'
                        ? undefined
                        : backgroundTone.borderColor,
                    backgroundColor:
                      selectedSurfaceKey === 'background'
                        ? backgroundTone.overlayColor
                        : 'transparent',
                  }}
                >
                  <div
                    className="font-osint-label text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: backgroundTone.labelColor }}
                  >
                    {SURFACE_LABELS.background}
                  </div>
                  <div className="mt-2 text-sm" style={{ color: backgroundTone.textColor }}>
                    {buildAccentColor(themeSurfaceSettings[activeSurfaceMode].background)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSurfaceKey('panel')}
                  className={`mt-4 block w-[92%] rounded border p-4 text-left transition-colors ${
                    selectedSurfaceKey === 'panel'
                      ? 'border-osint-primary'
                      : 'border-zinc-700/60 hover:border-zinc-500'
                  }`}
                  style={{
                    background: buildAccentColor(themeSurfaceSettings[activeSurfaceMode].panel),
                    color: panelTone.textColor,
                    borderColor:
                      selectedSurfaceKey === 'panel' ? undefined : panelTone.borderColor,
                  }}
                >
                  <div
                    className="font-osint-label text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: panelTone.labelColor }}
                  >
                    {SURFACE_LABELS.panel}
                  </div>
                  <div className="mt-2 text-sm" style={{ color: panelTone.textColor }}>
                    {buildAccentColor(themeSurfaceSettings[activeSurfaceMode].panel)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSurfaceKey('surface')}
                  className={`mt-4 ml-auto block w-[84%] rounded border p-4 text-left transition-colors ${
                    selectedSurfaceKey === 'surface'
                      ? 'border-osint-primary'
                      : 'border-zinc-700/60 hover:border-zinc-500'
                  }`}
                  style={{
                    background: buildAccentColor(themeSurfaceSettings[activeSurfaceMode].surface),
                    color: surfaceTone.textColor,
                    borderColor:
                      selectedSurfaceKey === 'surface' ? undefined : surfaceTone.borderColor,
                  }}
                >
                  <div
                    className="font-osint-label text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: surfaceTone.labelColor }}
                  >
                    {SURFACE_LABELS.surface}
                  </div>
                  <div className="mt-2 text-sm" style={{ color: surfaceTone.textColor }}>
                    {buildAccentColor(themeSurfaceSettings[activeSurfaceMode].surface)}
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleMatchAccentHue(activeSurfaceMode)}
                  className="font-osint-label border border-zinc-800 bg-black px-3 py-2 text-[10px] uppercase text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Accent Hue
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustModeSeparation(activeSurfaceMode, 1)}
                  className="font-osint-label border border-zinc-800 bg-black px-3 py-2 text-[10px] uppercase text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  More Contrast
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustModeSeparation(activeSurfaceMode, -1)}
                  className="font-osint-label border border-zinc-800 bg-black px-3 py-2 text-[10px] uppercase text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Softer Stack
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustModeChroma(activeSurfaceMode, 0.01)}
                  className="font-osint-label border border-zinc-800 bg-black px-3 py-2 text-[10px] uppercase text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Richer Tone
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustModeChroma(activeSurfaceMode, -0.01)}
                  className="font-osint-label border border-zinc-800 bg-black px-3 py-2 text-[10px] uppercase text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Mute Tone
                </button>
                <button
                  type="button"
                  onClick={() => handleResetSurfaceMode(activeSurfaceMode)}
                  className="font-osint-label border border-zinc-800 bg-black px-3 py-2 text-[10px] uppercase text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Reset Mode
                </button>
              </div>
            </div>

            <div className="space-y-4 rounded border border-zinc-800 bg-black p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-osint-label text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                    Active Surface
                  </div>
                  <div className="mt-2 font-osint-display text-lg font-bold text-white">
                    {SURFACE_LABELS[selectedSurfaceKey]}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded border border-zinc-700"
                    style={{ background: buildAccentColor(selectedSurface) }}
                  />
                  <div className="text-right">
                    <div className="text-xs text-zinc-300">{buildAccentColor(selectedSurface)}</div>
                    <div className="font-osint-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                      Raw OKLCH
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="block">
                  <span className="font-osint-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    Hue
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={360}
                    step={1}
                    value={selectedSurface.hue}
                    onChange={(event) =>
                      updateSelectedSurfaceField('hue', Number(event.target.value))
                    }
                    className="mt-2 w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-osint-primary"
                  />
                  <span className="mt-2 block text-[10px] text-zinc-600">0-360 degrees</span>
                </label>

                <label className="block">
                  <span className="font-osint-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    Lightness
                  </span>
                  <input
                    type="number"
                    min={bounds.lightnessMin}
                    max={bounds.lightnessMax}
                    step={0.01}
                    value={selectedSurface.lightness}
                    onChange={(event) =>
                      updateSelectedSurfaceField('lightness', Number(event.target.value))
                    }
                    className="mt-2 w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-osint-primary"
                  />
                  <span className="mt-2 block text-[10px] text-zinc-600">
                    {bounds.lightnessMin.toFixed(2)}-{bounds.lightnessMax.toFixed(2)}
                  </span>
                </label>

                <label className="block">
                  <span className="font-osint-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    Chroma
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={bounds.chromaMax}
                    step={0.01}
                    value={selectedSurface.chroma}
                    onChange={(event) =>
                      updateSelectedSurfaceField('chroma', Number(event.target.value))
                    }
                    className="mt-2 w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-osint-primary"
                  />
                  <span className="mt-2 block text-[10px] text-zinc-600">
                    0-{bounds.chromaMax.toFixed(2)}
                  </span>
                </label>
              </div>

              <div className="rounded border border-zinc-800 bg-zinc-950/70 p-4">
                <div className="font-osint-label text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  Why This View Is Smaller
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Surface tuning is now one target at a time. That keeps the page readable while
                  preserving direct OKLCH control for any individual surface.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFontSection = () => {
    const roleLabels: Record<keyof ThemeFontSettings, string> = {
      ui: 'UI',
      display: 'Display',
      label: 'Labels',
      mono: 'Data',
    };

    return (
      <div className="space-y-6 px-3 pb-3 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-osint-label text-[10px] uppercase tracking-[0.24em] text-zinc-500">
              Typography System
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              This first pass wires four font roles into the live app so we can tune character
              without scattering one-off font choices across the codebase.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFonts}
            className="font-osint-label px-3 py-1 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white text-[10px] uppercase transition-colors"
          >
            Reset Fonts
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {FONT_ROLE_CARDS.map((role) => {
            const selected = getThemeFontOption(themeFontSettings[role.key]);
            return (
              <div key={role.key} className="border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="font-osint-label text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  {role.label}
                </div>
                <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-white">{selected.label}</div>
                    <p className="mt-1 max-w-md text-sm leading-6 text-zinc-400">
                      {role.description}
                    </p>
                  </div>
                  <div className="min-w-[15rem] flex-1">
                    <OsintSelect
                      value={themeFontSettings[role.key]}
                      options={getThemeFontOptionsForRole(role.key).map((option) => ({
                        value: option.id,
                        label: option.label,
                      }))}
                      onChange={(value) =>
                        onThemeFontSettingsChange({
                          ...themeFontSettings,
                          [role.key]: value,
                        })
                      }
                      triggerClassName="p-2.5 pr-8 text-sm"
                      ariaLabel={`${role.label} font`}
                    />
                  </div>
                </div>
                <div
                  className={`mt-4 rounded border border-zinc-800 bg-black px-4 py-4 text-zinc-200 ${
                    role.key === 'label' ? 'uppercase tracking-[0.18em]' : ''
                  } ${role.key === 'mono' ? 'text-sm' : 'text-lg'}`}
                  style={{ fontFamily: selected.cssValue }}
                >
                  {role.sample}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="font-osint-label text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            Available Fonts
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {THEME_FONT_OPTIONS.map((option) => {
              const selectedRoles = Object.entries(themeFontSettings)
                .filter(([, value]) => value === option.id)
                .map(([key]) => roleLabels[key as keyof ThemeFontSettings]);

              return (
                <div key={option.id} className="border border-zinc-800 bg-black p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">{option.label}</div>
                    <div className="font-osint-label text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      {option.category}
                    </div>
                  </div>
                  <div className="mt-4 text-lg text-zinc-200" style={{ fontFamily: option.cssValue }}>
                    AaBb 314
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400" style={{ fontFamily: option.cssValue }}>
                    {option.preview}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedRoles.length > 0 ? (
                      selectedRoles.map((roleLabel) => (
                        <span
                          key={`${option.id}-${roleLabel}`}
                          className="font-osint-label border border-osint-primary/40 bg-osint-primary/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-osint-primary"
                        >
                          {roleLabel}
                        </span>
                      ))
                    ) : (
                      <span className="font-osint-label border border-zinc-800 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                        Available
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderPreferenceCard = (
    title: string,
    description: string,
    checked: boolean,
    onToggle: () => void
  ) => (
    <div className="bg-zinc-900/40 border border-zinc-800 p-6 min-h-36 flex items-center justify-between gap-6">
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-zinc-200 font-mono">{title}</h4>
        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed max-w-sm">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        data-state={checked ? 'on' : 'off'}
        className="osint-toggle"
      >
        <span className="osint-toggle-thumb" />
      </button>
    </div>
  );

  const renderGeneral = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12 space-y-12">
      <section className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-4 h-4 text-osint-primary" />
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">
            Operational Preferences
          </h3>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {renderPreferenceCard(
            'Auto-Resolve Entities',
            'Automatically group nearby variations of entity names during analysis and review.',
            autoResolve,
            () => setAutoResolve(!autoResolve)
          )}
          {renderPreferenceCard(
            'Quiet Mode',
            'Suppress non-critical system notifications while leaving core warnings and failures visible.',
            quietMode,
            () => setQuietMode(!quietMode)
          )}
        </div>
      </section>

      <div className="space-y-8">{renderMaintenance()}</div>
    </div>
  );

  const renderAI = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12">
        <section className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Key className="w-4 h-4 text-osint-primary" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">
              Access Credentials
            </h3>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 space-y-4 h-full">
            <div className="space-y-2">
              <label className="block text-[10px] text-zinc-500 font-mono uppercase">
                Google Gemini API Key
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  spellCheck={false}
                  placeholder="Enter Gemini API Key..."
                  className="flex-1 bg-black border border-zinc-700 text-white p-3 text-xs font-mono focus:border-osint-primary outline-none transition-colors"
                />
                <button
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="px-4 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white transition-colors text-xs font-mono"
                >
                  {showGeminiKey ? 'HIDE' : 'SHOW'}
                </button>
                <button
                  onClick={() => handleClearProviderKey('GEMINI')}
                  className="osint-button-danger px-4 text-xs font-mono"
                  title="Clear Gemini key"
                >
                  CLEAR
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] text-zinc-500 font-mono uppercase">
                OpenRouter API Key
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type={showOpenRouterKey ? 'text' : 'password'}
                  value={openRouterKey}
                  onChange={(e) => setOpenRouterKey(e.target.value)}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  spellCheck={false}
                  placeholder="Enter OpenRouter API Key..."
                  className="flex-1 bg-black border border-zinc-700 text-white p-3 text-xs font-mono focus:border-osint-primary outline-none transition-colors"
                />
                <button
                  onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                  className="px-4 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white transition-colors text-xs font-mono"
                >
                  {showOpenRouterKey ? 'HIDE' : 'SHOW'}
                </button>
                <button
                  onClick={() => handleClearProviderKey('OPENROUTER')}
                  className="osint-button-danger px-4 text-xs font-mono"
                  title="Clear OpenRouter key"
                >
                  CLEAR
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] text-zinc-500 font-mono uppercase">
                OpenAI API Key
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type={showOpenAIKey ? 'text' : 'password'}
                  value={openAIKey}
                  onChange={(e) => setOpenAIKey(e.target.value)}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  spellCheck={false}
                  placeholder="Enter OpenAI API Key..."
                  className="flex-1 bg-black border border-zinc-700 text-white p-3 text-xs font-mono focus:border-osint-primary outline-none transition-colors"
                />
                <button
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                  className="px-4 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white transition-colors text-xs font-mono"
                >
                  {showOpenAIKey ? 'HIDE' : 'SHOW'}
                </button>
                <button
                  onClick={() => handleClearProviderKey('OPENAI')}
                  className="osint-button-danger px-4 text-xs font-mono"
                  title="Clear OpenAI key"
                >
                  CLEAR
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] text-zinc-500 font-mono uppercase">
                Anthropic API Key
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type={showAnthropicKey ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  spellCheck={false}
                  placeholder="Enter Anthropic API Key..."
                  className="flex-1 bg-black border border-zinc-700 text-white p-3 text-xs font-mono focus:border-osint-primary outline-none transition-colors"
                />
                <button
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  className="px-4 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white transition-colors text-xs font-mono"
                >
                  {showAnthropicKey ? 'HIDE' : 'SHOW'}
                </button>
                <button
                  onClick={() => handleClearProviderKey('ANTHROPIC')}
                  className="osint-button-danger px-4 text-xs font-mono"
                  title="Clear Anthropic key"
                >
                  CLEAR
                </button>
              </div>
            </div>

            {saveError && (
              <div className="osint-danger-banner text-[10px] font-mono border px-3 py-2">
                {saveError}
              </div>
            )}

            <p className="text-[9px] text-zinc-600 font-mono italic pt-2">
              Keys are stored locally in your browser.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Cpu className="w-4 h-4 text-osint-primary" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">
              Model Selection
            </h3>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 space-y-6 h-full">
            <div>
              <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-2">
                Active Provider
              </label>
              <OsintSelect
                ariaLabel="Active provider"
                value={selectedProvider}
                onChange={(value) => {
                  const nextProvider = value as AIProvider;
                  setSelectedProvider(nextProvider);
                  setSelectedModel(getFallbackRuntimeModel(nextProvider));
                }}
                triggerClassName="rounded-none py-3 pl-3 pr-8 text-xs font-mono"
                options={AI_PROVIDERS.map((provider) => ({
                  value: provider.id,
                  label: `${provider.label}${provider.capabilities.runtimeStatus === 'PLANNED' ? ' (Phase 3)' : ''}`,
                  disabled: provider.capabilities.runtimeStatus !== 'ACTIVE',
                }))}
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-2">
                Active Model
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <OsintSelect
                    ariaLabel="Active model"
                    value={activeModelId}
                    onChange={(value) => {
                      setSelectedModel(value);
                      recordRecentModelSelection(value);
                    }}
                    triggerClassName="rounded-none py-3 pl-3 pr-8 text-xs font-mono"
                    options={selectableModels.map((model) => ({
                      value: model.id,
                      label: `${model.name} (${model.id})`,
                    }))}
                  />
                </div>
                {activeProvider === 'OPENROUTER' && (
                  <button
                    type="button"
                    onClick={() => setShowOpenRouterBrowser(true)}
                    className="border border-zinc-700 px-3 py-2 text-[10px] font-mono uppercase text-zinc-300 transition-colors hover:border-white hover:text-white"
                  >
                    Browse
                  </button>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 font-mono mt-2">
                Provider:{' '}
                <span className="text-zinc-300">
                  {selectedModelMeta?.provider || activeProvider}
                </span>
              </p>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">
                Capabilities: thinking{' '}
                {selectedModelCapabilities.supportsThinkingBudget ? 'enabled' : 'not available'},
                structured output{' '}
                {selectedModelCapabilities.supportsStructuredOutput ? 'enabled' : 'not available'},
                web search{' '}
                {selectedModelCapabilities.supportsWebSearch ? 'enabled' : 'not available'}, TTS{' '}
                {activeProviderMeta?.capabilities.supportsTts ? 'enabled' : 'not available'}.
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <Workflow className="w-3 h-3 text-osint-primary" />
                <label className="text-[10px] text-zinc-500 font-mono uppercase">
                  Search Depth
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSearchDepth('STANDARD')}
                  className={`py-2 font-mono text-xs uppercase ${searchDepth === 'STANDARD' ? 'osint-button-soft' : 'osint-button-primary'}`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setSearchDepth('DEEP')}
                  className={`py-2 font-mono text-xs uppercase ${searchDepth === 'DEEP' ? 'osint-button-soft' : 'osint-button-primary'}`}
                >
                  Deep
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <Workflow className="w-3 h-3 text-osint-primary" />
                <label className="text-[10px] text-zinc-500 font-mono uppercase">
                  Generation Mode
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGenerationMode('SINGLE_PASS')}
                  className={`py-2 font-mono text-xs uppercase ${generationMode === 'SINGLE_PASS' ? 'osint-button-soft' : 'osint-button-primary'}`}
                >
                  Single Pass
                </button>
                <button
                  onClick={() => setGenerationMode('STAGED')}
                  className={`py-2 font-mono text-xs uppercase ${generationMode === 'STAGED' ? 'osint-button-soft' : 'osint-button-primary'}`}
                >
                  Staged
                </button>
              </div>
            </div>

            {activeProvider === 'OPENROUTER' && (
              <div className="pt-4 border-t border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase">
                    OpenRouter Web Search
                  </label>
                  <button
                    type="button"
                    onClick={() => setOpenRouterWebSearchEnabled(!openRouterWebSearchEnabled)}
                    aria-pressed={openRouterWebSearchEnabled}
                    data-state={openRouterWebSearchEnabled ? 'on' : 'off'}
                    className="osint-toggle"
                  >
                    <span className="osint-toggle-thumb" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-mono uppercase text-zinc-500">
                      Engine
                    </span>
                    <OsintSelect
                      ariaLabel="OpenRouter search engine"
                      value={openRouterEngine}
                      onChange={(value) => setOpenRouterEngine(value as typeof openRouterEngine)}
                      triggerClassName="rounded-none py-3 pl-3 pr-8 text-xs font-mono"
                      options={[
                        { value: 'auto', label: 'Auto' },
                        { value: 'native', label: 'Native' },
                        { value: 'exa', label: 'Exa' },
                        { value: 'parallel', label: 'Parallel' },
                        { value: 'firecrawl', label: 'Firecrawl' },
                      ]}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-mono uppercase text-zinc-500">
                      Context Size
                    </span>
                    <OsintSelect
                      ariaLabel="OpenRouter search context size"
                      value={openRouterSearchContextSize}
                      onChange={(value) =>
                        setOpenRouterSearchContextSize(value as typeof openRouterSearchContextSize)
                      }
                      triggerClassName="rounded-none py-3 pl-3 pr-8 text-xs font-mono"
                      options={[
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                      ]}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-mono uppercase text-zinc-500">
                      Max Results
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={openRouterMaxResults}
                      onChange={(event) => setOpenRouterMaxResults(Number(event.target.value) || 1)}
                      className="w-full border border-zinc-700 bg-black px-3 py-3 text-xs font-mono text-white outline-none focus:border-osint-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-mono uppercase text-zinc-500">
                      Max Total Results
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={openRouterMaxTotalResults}
                      onChange={(event) =>
                        setOpenRouterMaxTotalResults(Number(event.target.value) || 1)
                      }
                      className="w-full border border-zinc-700 bg-black px-3 py-3 text-xs font-mono text-white outline-none focus:border-osint-primary"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-mono uppercase text-zinc-500">
                    Allowed Domains
                  </span>
                  <textarea
                    value={openRouterAllowedDomains}
                    onChange={(event) => setOpenRouterAllowedDomains(event.target.value)}
                    placeholder="arxiv.org, sec.gov"
                    className="h-20 w-full resize-none border border-zinc-700 bg-black px-3 py-3 text-xs font-mono text-white outline-none focus:border-osint-primary"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-mono uppercase text-zinc-500">
                    Excluded Domains
                  </span>
                  <textarea
                    value={openRouterExcludedDomains}
                    onChange={(event) => setOpenRouterExcludedDomains(event.target.value)}
                    placeholder="reddit.com"
                    className="h-20 w-full resize-none border border-zinc-700 bg-black px-3 py-3 text-xs font-mono text-white outline-none focus:border-osint-primary"
                  />
                </label>
              </div>
            )}

            <ThinkingBudgetControl
              providerLabel={activeProviderMeta?.label || activeProvider}
              supportsThinkingBudget={supportsThinkingBudget}
              value={thinkingBudget}
              onChange={setThinkingBudget}
              className="pt-2 space-y-2"
              labelClassName="text-[10px] text-zinc-500 font-mono uppercase mb-0 flex items-center"
              helpClassName="text-[9px] text-zinc-600 font-mono italic mt-2"
              supportedHint="Applied by selected model."
              unsupportedHint={`${
                activeProviderMeta?.label || activeProvider
              } does not support thinking budgets.`}
            />
          </div>
        </section>
      </div>
    </div>
  );

  const renderMaintenance = () => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
      <section className="flex h-full flex-col border border-zinc-800 bg-zinc-900/40 p-8">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-osint-primary" />
          <h3 className="text-lg font-bold text-white font-mono uppercase tracking-widest">
            Data Management
          </h3>
        </div>
        <p className="mt-5 max-w-2xl text-xs font-mono leading-relaxed text-zinc-500">
          Sherlock stores workspace data locally in your browser. Exports and restores include
          workspaces, artifacts, runs, chat history, saved signals, manual graph data, and
          templates. Theme preferences, provider defaults, and API keys stay local to this device
          and are not part of workspace backups.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleExportData}
            className="group flex h-14 items-center justify-between gap-4 border border-zinc-800 bg-black/60 px-5 text-left transition-all hover:border-osint-primary/50 hover:bg-zinc-900"
          >
            <div className="min-w-0 text-xs font-bold text-white font-mono uppercase">
              Export Workspace Data
            </div>
            <Download className="h-5 w-5 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-osint-primary" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex h-14 items-center justify-between gap-4 border border-zinc-800 bg-black/60 px-5 text-left transition-all hover:border-osint-primary/50 hover:bg-zinc-900"
          >
            <div className="min-w-0 text-xs font-bold text-white font-mono uppercase">
              Restore Backup
            </div>
            <Upload className="h-5 w-5 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-osint-primary" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />
        </div>
      </section>

      <section className="osint-danger-panel flex h-full flex-col border p-8">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 osint-danger-text" />
          <h3 className="text-lg font-bold osint-danger-text font-mono uppercase tracking-widest">
            System Purge
          </h3>
        </div>
        <p className="mt-5 max-w-2xl text-xs font-mono leading-relaxed osint-danger-text">
          The purge protocol will permanently delete all local workspace data, including runs, chat
          history, saved signals, templates, and manual graph data. This action cannot be reversed.
        </p>

        <div className="mt-8 flex flex-1 items-end">
          <button
            type="button"
            onClick={handleClearData}
            className="osint-button-danger inline-flex items-center px-6 py-3 font-mono text-xs font-bold uppercase"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Execute System Purge
          </button>
        </div>
      </section>
    </div>
  );

  const renderTheme = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12 space-y-6">
      <Accordion
        title="Accent"
        icon={Palette}
        isOpen={themeSections.accent}
        onToggle={() => toggleThemeSection('accent')}
        className="mb-0"
      >
        <div className="space-y-6 px-3 pb-3 pt-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded-sm border border-zinc-700 shadow-[0_0_8px_rgba(255,255,255,0.08)]"
                style={{ background: buildAccentColor(accentSettings) }}
              />
              <label className="font-osint-label block text-[10px] text-zinc-500 uppercase">
                Custom Accent
              </label>
            </div>
            <button
              onClick={handleResetThemeSettings}
              className="font-osint-label px-3 py-1 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white text-[10px] uppercase transition-colors"
            >
              Reset Theme
            </button>
          </div>
          <div className="font-osint-label text-[10px] text-zinc-500">
            {buildAccentColor(accentSettings)}
          </div>
          <AccentPicker
            hue={accentSettings.hue}
            lightness={accentSettings.lightness}
            chroma={accentSettings.chroma}
            showPreview={false}
            onChange={(settings) => onAccentChange(settings)}
          />
        </div>
      </Accordion>

      <Accordion
        title="Surface System"
        icon={Palette}
        isOpen={themeSections.surfaces}
        onToggle={() => toggleThemeSection('surfaces')}
        className="mb-0"
      >
        {renderThemeSurfaceEditor()}
      </Accordion>

      <Accordion
        title="Fonts"
        icon={Type}
        isOpen={themeSections.fonts}
        onToggle={() => toggleThemeSection('fonts')}
        className="mb-0"
      >
        {renderFontSection()}
      </Accordion>
    </div>
  );

  return (
    <div className="h-full w-full bg-black relative flex flex-col overflow-hidden">
      <header className="h-20 px-8 bg-zinc-900/45 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between relative z-20 flex-shrink-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/70 to-transparent pointer-events-none" />
        <div className="h-full flex items-center space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-osint-label h-full px-2 text-xs uppercase tracking-widest font-bold transition-all border-b-2 flex items-center space-x-2 ${activeTab === tab.id ? 'border-osint-primary text-osint-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <tab.icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="h-full flex items-center gap-2">
          <button
            onClick={handleSaveConfiguration}
            disabled={
              isSaving || (activeTab !== 'GENERAL' && activeTab !== 'AI' && activeTab !== 'THEME')
            }
            className="font-osint-label osint-button-primary flex items-center px-4 py-2 text-xs font-bold uppercase disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Configuration'}
          </button>
          <button
            onClick={onClose}
            className="osint-button-chrome p-2 text-zinc-500 hover:border-[color:var(--osint-danger-soft-border)] hover:text-[color:var(--color-osint-danger)] focus-visible:border-[color:var(--osint-danger-soft-border)] focus-visible:text-[color:var(--color-osint-danger)] focus-visible:ring-2 focus-visible:ring-osint-primary"
            title="Close Settings"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
        <div className="w-full">
          {activeTab === 'GENERAL' && renderGeneral()}
          {activeTab === 'AI' && renderAI()}
          {activeTab === 'SCOPES' && <ScopeManager />}
          {activeTab === 'TEMPLATES' && (
            <TemplateGallery
              onApply={(t) => {
                const fallbackConfig = loadSystemConfig();
                const templateModel = t.config.modelId || fallbackConfig.modelId;
                const resolvedScope = t.scopeId
                  ? getScopeById(t.scopeId) ||
                    getAllScopes(customScopes).find((scope) => scope.id === t.scopeId)
                  : undefined;

                onStartCase({
                  topic: t.topic,
                  configOverride: {
                    ...fallbackConfig,
                    ...t.config,
                    modelId: templateModel,
                    provider: t.config.provider || getModelProvider(templateModel),
                  },
                  scope: resolvedScope,
                  packId: t.config.packId || t.packId,
                  purposeId: t.config.purposeId || t.purposeId,
                  artifactType: t.config.artifactType || t.artifactType,
                  labelProfileId: t.config.labelProfileId || t.labelProfileId,
                });
              }}
            />
          )}
          {activeTab === 'THEME' && renderTheme()}
        </div>
      </main>

      <OpenRouterModelBrowser
        isOpen={showOpenRouterBrowser}
        currentModelId={activeProvider === 'OPENROUTER' ? activeModelId : undefined}
        onClose={() => setShowOpenRouterBrowser(false)}
        onSelectModel={(modelId) => setSelectedModel(modelId)}
      />
    </div>
  );
};
