import React, { useRef, useState } from 'react';
import {
    Settings as SettingsIcon,
    Shield,
    Palette,
    Type,
    Database,
    Trash2,
    Download,
    Upload,
    Check,
    Layout,
    Key,
    Save,
    RefreshCw,
    AlertTriangle,
    Compass,
    Cpu,
    X,
    Brain,
    Workflow
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
    type ThemeSurfaceScale,
    type ThemeSurfaceSettings
} from '../../../utils/themeSurfaces';
import { getAllScopes, getScopeById } from '../../../data/presets';
import type { AIProvider } from '../../../config/aiModels';
import {
    AI_PROVIDERS,
    DEFAULT_MODEL_ID,
    getDefaultModelForProvider,
    getModelProvider,
    getProviderOptionById,
    getModelOptionById,
    getRuntimeReadyModelsForProvider,
    isProviderRuntimeReady
} from '../../../config/aiModels';
import { loadSystemConfig, saveSystemConfig } from '../../../config/systemConfig';
import {
    clearApiKey as clearProviderApiKey,
    getStoredApiKey,
    hasApiKey as hasProviderApiKey,
    setApiKey as setProviderApiKey,
    validateApiKey
} from '../../../services/providers/keys';
import {
    buildWorkspaceDataBackup,
    normalizeWorkspaceDataBackup,
} from '../../../services/maintenance/workspaceData';
import { clearStoredActiveWorkspaceId } from '../../../utils/localStorage';

interface SettingsProps {
    themeColor: string;
    themeMode: 'dark' | 'light';
    onAccentChange: (settings: { hue: number; lightness: number; chroma: number }) => void;
    accentSettings: { hue: number; lightness: number; chroma: number };
    themeSurfaceSettings: ThemeSurfaceSettings;
    onThemeSurfaceSettingsChange: (settings: ThemeSurfaceSettings) => void;
    onStartCase: (request: InvestigationLaunchRequest) => void;
    onClose: () => void;
}

const TABS = [
    { id: 'GENERAL', label: 'General', icon: SettingsIcon },
    { id: 'AI', label: 'AI', icon: Cpu },
    { id: 'SCOPES', label: 'Scopes', icon: Compass },
    { id: 'TEMPLATES', label: 'Templates', icon: Layout },
    { id: 'THEME', label: 'Theme', icon: Palette }
];

export const Settings: React.FC<SettingsProps> = ({
    themeColor,
    themeMode,
    onAccentChange,
    accentSettings,
    themeSurfaceSettings,
    onThemeSurfaceSettingsChange,
    onStartCase,
    onClose
}) => {
    const {
        artifacts,
        workspaces,
        workspaceRuns,
        chatSessions,
        chatMessagesBySessionId,
        chatActionsBySessionId,
        headlines,
        templates,
        manualNodes,
        manualLinks,
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
    const [searchDepth, setSearchDepth] = useState<'STANDARD' | 'DEEP'>(initialConfig.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD');
    const [thinkingBudget, setThinkingBudget] = useState(typeof initialConfig.thinkingBudget === 'number' ? initialConfig.thinkingBudget : 0);

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [themeSections, setThemeSections] = useState({
        accent: true,
        fonts: true,
        darkSurfaces: true,
        lightSurfaces: true,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeProvider = isProviderRuntimeReady(selectedProvider) ? selectedProvider : 'GEMINI';
    const selectableModels = getRuntimeReadyModelsForProvider(activeProvider);
    const activeModelId = selectableModels.some((model) => model.id === selectedModel)
        ? selectedModel
        : (selectableModels[0]?.id ?? getDefaultModelForProvider(activeProvider));
    const selectedModelMeta = getModelOptionById(activeModelId);
    const activeProviderMeta = getProviderOptionById(activeProvider);
    const supportsThinkingBudget = !!selectedModelMeta?.capabilities.supportsThinkingBudget;

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
            persona: existingConfig.persona || 'general-investigator',
            autoNormalizeEntities: autoResolve,
            quietMode
        };

        saveSystemConfig(config, { theme: themeColor, themeMode, themeSurfaceSettings });

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
            headlines,
            manualNodes,
            manualLinks,
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
                if (confirm('This will overwrite your current workspace data. Provider keys, theme settings, and other local app preferences will stay as-is. Continue?')) {
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
        if (confirm('CRITICAL WARNING: This will permanently delete all saved workspace data, including artifacts, runs, chat history, graph data, templates, and saved signals. Local theme settings, provider defaults, and API keys will stay untouched. Proceed?')) {
            await clearWorkspaceData();
            clearStoredActiveWorkspaceId();
            alert('Workspace data purged.');
        }
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
                [surfaceKey]: settings,
            },
        });
    };

    const handleResetThemeSettings = () => {
        onAccentChange(DEFAULT_ACCENT_SETTINGS);
        onThemeSurfaceSettingsChange(DEFAULT_THEME_SURFACE_SETTINGS);
    };

    const getSurfacePickerBounds = (mode: keyof ThemeSurfaceSettings, surfaceKey: keyof ThemeSurfaceScale) => {
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

    const renderThemeSurfaceSection = (mode: keyof ThemeSurfaceSettings) => {
        const surfaceEntries: Array<{ key: keyof ThemeSurfaceScale; label: string }> = [
            { key: 'background', label: 'Workspace Background' },
            { key: 'panel', label: 'Panel Background' },
            { key: 'surface', label: 'Raised Surface' },
        ];

        return (
            <div className="space-y-6 px-3 pb-3 pt-1">
                {surfaceEntries.map(({ key, label }) => {
                    const current = themeSurfaceSettings[mode][key];
                    const pickerBounds = getSurfacePickerBounds(mode, key);
                    return (
                        <div key={key} className="space-y-3 border-t border-zinc-800/80 pt-5 first:border-t-0 first:pt-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-4 w-4 rounded-sm border border-zinc-700 shadow-[0_0_8px_rgba(255,255,255,0.08)]"
                                        style={{ background: buildAccentColor(current) }}
                                    />
                                    <label className="block text-[10px] text-zinc-500 font-mono uppercase">{label}</label>
                                </div>
                                <div className="text-[10px] text-zinc-500 font-mono">{buildAccentColor(current)}</div>
                            </div>
                            <AccentPicker
                                hue={current.hue}
                                lightness={current.lightness}
                                chroma={current.chroma}
                                showPreview={false}
                                lightnessMin={pickerBounds.lightnessMin}
                                lightnessMax={pickerBounds.lightnessMax}
                                chromaMax={pickerBounds.chromaMax}
                                onChange={(settings) => handleThemeSurfaceChange(mode, key, settings)}
                            />
                        </div>
                    );
                })}
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
                <p className="text-[10px] text-zinc-500 font-mono leading-relaxed max-w-sm">{description}</p>
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
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">Operational Preferences</h3>
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

            <div className="space-y-8">
                {renderMaintenance()}
            </div>
        </div>
    );

    const renderAI = () => (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12">
                <section className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <Key className="w-4 h-4 text-osint-primary" />
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">Access Credentials</h3>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800 p-6 space-y-4 h-full">
                        <div className="space-y-2">
                            <label className="block text-[10px] text-zinc-500 font-mono uppercase">Google Gemini API Key</label>
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
                            <label className="block text-[10px] text-zinc-500 font-mono uppercase">OpenRouter API Key</label>
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
                            <label className="block text-[10px] text-zinc-500 font-mono uppercase">OpenAI API Key</label>
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
                            <label className="block text-[10px] text-zinc-500 font-mono uppercase">Anthropic API Key</label>
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

                        <p className="text-[9px] text-zinc-600 font-mono italic pt-2">Keys are stored locally in your browser.</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <Cpu className="w-4 h-4 text-osint-primary" />
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">Model Selection</h3>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800 p-6 space-y-6 h-full">
                        <div>
                            <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-2">Active Provider</label>
                            <OsintSelect
                                ariaLabel="Active provider"
                                value={selectedProvider}
                                onChange={(value) => {
                                    const nextProvider = value as AIProvider;
                                    setSelectedProvider(nextProvider);
                                    const fallbackModel = getRuntimeReadyModelsForProvider(nextProvider)[0]?.id || getDefaultModelForProvider(nextProvider);
                                    setSelectedModel(fallbackModel);
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
                            <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-2">Active Model</label>
                            <OsintSelect
                                ariaLabel="Active model"
                                value={activeModelId}
                                onChange={setSelectedModel}
                                triggerClassName="rounded-none py-3 pl-3 pr-8 text-xs font-mono"
                                options={selectableModels.map((model) => ({
                                    value: model.id,
                                    label: `${model.name} (${model.id})`,
                                }))}
                            />
                            <p className="text-[10px] text-zinc-500 font-mono mt-2">
                                Provider: <span className="text-zinc-300">{selectedModelMeta?.provider || activeProvider}</span>
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-1">
                                Capabilities: thinking {supportsThinkingBudget ? 'enabled' : 'not available'}, web search {activeProviderMeta?.capabilities.supportsWebSearch ? 'enabled' : 'not available'}, TTS {activeProviderMeta?.capabilities.supportsTts ? 'enabled' : 'not available'}.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-zinc-800 space-y-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <Workflow className="w-3 h-3 text-osint-primary" />
                                <label className="text-[10px] text-zinc-500 font-mono uppercase">Search Depth</label>
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

                        <div className="pt-2 space-y-2">
                            <div className="flex items-center space-x-2">
                                <Brain className={`w-3 h-3 ${supportsThinkingBudget ? 'text-osint-primary' : 'text-zinc-600'}`} />
                                <label className="text-[10px] text-zinc-500 font-mono uppercase">Thinking Budget ({supportsThinkingBudget ? thinkingBudget : 0})</label>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={8192}
                                step={512}
                                value={supportsThinkingBudget ? thinkingBudget : 0}
                                onChange={(event) => setThinkingBudget(Number(event.target.value))}
                                disabled={!supportsThinkingBudget}
                                className="w-full accent-[var(--osint-primary)] disabled:opacity-40"
                            />
                            <p className="text-[9px] text-zinc-600 font-mono italic">
                                {supportsThinkingBudget
                                    ? 'Applied by selected model.'
                                    : `${activeProviderMeta?.label || activeProvider} does not support thinking budgets.`}
                            </p>
                        </div>
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
                    <h3 className="text-lg font-bold text-white font-mono uppercase tracking-widest">Data Management</h3>
                </div>
                <p className="mt-5 max-w-2xl text-xs font-mono leading-relaxed text-zinc-500">
                    Sherlock stores workspace data locally in your browser. Exports and restores include workspaces, artifacts, runs, chat history, saved signals, manual graph data, and templates. Theme preferences, provider defaults, and API keys stay local to this device and are not part of workspace backups.
                </p>

                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={handleExportData}
                        className="group flex h-14 items-center justify-between gap-4 border border-zinc-800 bg-black/60 px-5 text-left transition-all hover:border-osint-primary/50 hover:bg-zinc-900"
                    >
                        <div className="min-w-0 text-xs font-bold text-white font-mono uppercase">Export Workspace Data</div>
                        <Download className="h-5 w-5 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-osint-primary" />
                    </button>

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex h-14 items-center justify-between gap-4 border border-zinc-800 bg-black/60 px-5 text-left transition-all hover:border-osint-primary/50 hover:bg-zinc-900"
                    >
                        <div className="min-w-0 text-xs font-bold text-white font-mono uppercase">Restore Backup</div>
                        <Upload className="h-5 w-5 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-osint-primary" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
                </div>
            </section>

            <section className="osint-danger-panel flex h-full flex-col border p-8">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 osint-danger-text" />
                    <h3 className="text-lg font-bold osint-danger-text font-mono uppercase tracking-widest">System Purge</h3>
                </div>
                <p className="mt-5 max-w-2xl text-xs font-mono leading-relaxed osint-danger-text">
                    The purge protocol will permanently delete all local workspace data, including runs, chat history, saved signals, templates, and manual graph data. This action cannot be reversed.
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
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
                                <label className="block text-[10px] text-zinc-500 font-mono uppercase">Custom Accent</label>
                            </div>
                            <button
                                onClick={handleResetThemeSettings}
                                className="px-3 py-1 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white font-mono text-[10px] uppercase transition-colors"
                            >
                                Reset Theme
                            </button>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">{buildAccentColor(accentSettings)}</div>
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
                    title="Fonts"
                    icon={Type}
                    isOpen={themeSections.fonts}
                    onToggle={() => toggleThemeSection('fonts')}
                    className="mb-0"
                >
                    <div className="space-y-4 px-3 pb-3 pt-1">
                        <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4">
                            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">Placeholder</div>
                            <div className="mt-3 text-lg font-bold text-white">Font controls land here next</div>
                            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                                This card is reserved for future font-family and typography presets so visual controls stay grouped under Theme.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="border border-zinc-800 bg-black px-4 py-3">
                                <div className="text-[10px] font-mono uppercase text-zinc-500">UI Text</div>
                                <div className="mt-2 text-sm text-zinc-300">System Sans</div>
                            </div>
                            <div className="border border-zinc-800 bg-black px-4 py-3">
                                <div className="text-[10px] font-mono uppercase text-zinc-500">Data Text</div>
                                <div className="mt-2 font-mono text-sm text-zinc-300">JetBrains Mono</div>
                            </div>
                            <div className="border border-dashed border-zinc-800 bg-black px-4 py-3">
                                <div className="text-[10px] font-mono uppercase text-zinc-500">Status</div>
                                <div className="mt-2 text-sm text-zinc-500">Coming Soon</div>
                            </div>
                        </div>
                    </div>
                </Accordion>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <Accordion
                    title="Dark Theme Surfaces"
                    icon={Palette}
                    isOpen={themeSections.darkSurfaces}
                    onToggle={() => toggleThemeSection('darkSurfaces')}
                    className="mb-0"
                >
                    {renderThemeSurfaceSection('dark')}
                </Accordion>

                <Accordion
                    title="Light Theme Surfaces"
                    icon={Palette}
                    isOpen={themeSections.lightSurfaces}
                    onToggle={() => toggleThemeSection('lightSurfaces')}
                    className="mb-0"
                >
                    {renderThemeSurfaceSection('light')}
                </Accordion>
            </div>
        </div>
    );

    return (
        <div className="h-full w-full bg-black relative flex flex-col overflow-hidden">
            <header className="h-20 px-8 bg-zinc-900/45 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between relative z-20 flex-shrink-0 shadow-[inset_0_-1px_0_rgba(39,39,42,0.8)]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/70 to-transparent pointer-events-none" />
                <div className="h-full flex items-center space-x-8">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`h-full px-2 font-mono text-xs uppercase tracking-widest font-bold transition-all border-b-2 flex items-center space-x-2 ${activeTab === tab.id ? 'border-osint-primary text-osint-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <tab.icon className="w-3 h-3" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                <div className="h-full flex items-center gap-2">
                    <button
                        onClick={handleSaveConfiguration}
                        disabled={isSaving || (activeTab !== 'GENERAL' && activeTab !== 'AI' && activeTab !== 'THEME')}
                        className="osint-button-primary flex items-center px-4 py-2 font-mono text-xs font-bold uppercase disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {isSaving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Configuration'}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 border border-zinc-700 bg-zinc-900/60 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-osint-primary"
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
                                    ? getScopeById(t.scopeId)
                                      || getAllScopes(customScopes).find((scope) => scope.id === t.scopeId)
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
        </div>
    );
};
