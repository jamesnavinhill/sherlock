import React, { useState, useRef } from 'react';
import {
    Settings as SettingsIcon,
    Shield,
    Palette,
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
    ChevronDown,
    X,
    Brain,
    Workflow
} from 'lucide-react';
import { useCaseStore } from '../../../store/caseStore';
import { BackgroundMatrixRain } from '../../ui/BackgroundMatrixRain';
import { TemplateGallery } from './TemplateGallery';
import { ScopeManager } from '../../ui/ScopeManager';
import type { SystemConfig } from '../../../types';
import { AccentPicker } from '../../ui/AccentPicker';
import { buildAccentColor } from '../../../utils/accent';
import { AI_MODELS, DEFAULT_MODEL_ID, getModelOptionById } from '../../../config/aiModels';

interface SettingsProps {
    themeColor: string;
    onThemeChange: (color: string) => void;
    themeMode: 'dark' | 'light';
    onThemeModeChange: (mode: 'dark' | 'light') => void;
    onAccentChange: (settings: { hue: number; lightness: number; chroma: number }) => void;
    accentSettings: { hue: number; lightness: number; chroma: number };
    onStartCase: (topic: string, config: SystemConfig) => void;
    onClose: () => void;
}

const loadStoredConfig = (): Partial<SystemConfig> => {
    const configStr = localStorage.getItem('sherlock_config');
    if (!configStr) return {};

    try {
        return JSON.parse(configStr) as Partial<SystemConfig>;
    } catch {
        return {};
    }
};

const TABS = [
    { id: 'GENERAL', label: 'General', icon: SettingsIcon },
    { id: 'AI', label: 'AI', icon: Cpu },
    { id: 'SCOPES', label: 'Scopes', icon: Compass },
    { id: 'TEMPLATES', label: 'Templates', icon: Layout },
    { id: 'MAINTENANCE', label: 'Maintenance', icon: Database }
];

export const Settings: React.FC<SettingsProps> = ({ themeColor, onThemeChange, themeMode, onThemeModeChange, onAccentChange, accentSettings, onStartCase, onClose }) => {
    const { archives, cases, importCaseData, clearCaseData } = useCaseStore();

    const initialConfig = loadStoredConfig();

    const [activeTab, setActiveTab] = useState('GENERAL');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') ?? localStorage.getItem('sherlock_api_key') ?? '');
    const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem('OPENROUTER_API_KEY') ?? '');
    const [openAIKey, setOpenAIKey] = useState(() => localStorage.getItem('OPENAI_API_KEY') ?? '');
    const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem('ANTHROPIC_API_KEY') ?? '');

    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
    const [showOpenAIKey, setShowOpenAIKey] = useState(false);
    const [showAnthropicKey, setShowAnthropicKey] = useState(false);

    const [autoResolve, setAutoResolve] = useState(initialConfig.autoNormalizeEntities ?? true);
    const [quietMode, setQuietMode] = useState(initialConfig.quietMode ?? false);
    const [selectedModel, setSelectedModel] = useState(initialConfig.modelId ?? DEFAULT_MODEL_ID);
    const [searchDepth, setSearchDepth] = useState<'STANDARD' | 'DEEP'>(initialConfig.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD');
    const [thinkingBudget, setThinkingBudget] = useState(typeof initialConfig.thinkingBudget === 'number' ? initialConfig.thinkingBudget : 0);

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedModelMeta = getModelOptionById(selectedModel);

    const handleSaveConfiguration = () => {
        setIsSaving(true);

        const gemini = apiKey.trim();
        const openRouter = openRouterKey.trim();
        const openAI = openAIKey.trim();
        const anthropic = anthropicKey.trim();

        if (gemini) {
            localStorage.setItem('GEMINI_API_KEY', gemini);
            localStorage.setItem('sherlock_api_key', gemini);
        } else {
            localStorage.removeItem('GEMINI_API_KEY');
            localStorage.removeItem('sherlock_api_key');
        }

        if (openRouter) localStorage.setItem('OPENROUTER_API_KEY', openRouter);
        else localStorage.removeItem('OPENROUTER_API_KEY');

        if (openAI) localStorage.setItem('OPENAI_API_KEY', openAI);
        else localStorage.removeItem('OPENAI_API_KEY');

        if (anthropic) localStorage.setItem('ANTHROPIC_API_KEY', anthropic);
        else localStorage.removeItem('ANTHROPIC_API_KEY');

        const existingConfig = loadStoredConfig();
        const config: SystemConfig = {
            modelId: selectedModel,
            searchDepth,
            thinkingBudget,
            persona: existingConfig.persona || 'general-investigator',
            autoNormalizeEntities: autoResolve,
            quietMode
        };

        localStorage.setItem('sherlock_config', JSON.stringify({ ...existingConfig, ...config, theme: themeColor, themeMode }));

        setTimeout(() => {
            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        }, 800);
    };

    const handleExportData = () => {
        const data = {
            archives,
            cases,
            config: {
                modelId: selectedModel,
                searchDepth,
                thinkingBudget,
                autoNormalizeEntities: autoResolve,
                quietMode,
                theme: themeColor,
                themeMode
            } as SystemConfig & { theme?: string; themeMode?: 'dark' | 'light' },
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sherlock-export-${new Date().toISOString().split('T')[0]}.json`;
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
                const data = JSON.parse(event.target?.result as string);
                if (data.archives && data.cases) {
                    if (confirm('This will overwrite your current database. Continue?')) {
                        await importCaseData({ cases: data.cases, archives: data.archives });
                        if (data.config?.theme) onThemeChange(data.config.theme);
                        if (data.config?.themeMode === 'light' || data.config?.themeMode === 'dark') {
                            onThemeModeChange(data.config.themeMode);
                        }
                        alert('Data imported successfully.');
                    }
                } else {
                    alert('Invalid backup file format.');
                }
            } catch {
                alert('Failed to parse JSON file.');
            }
        };
        reader.readAsText(file);
    };

    const handleClearData = async () => {
        if (confirm('CRITICAL WARNING: This will permanently delete all cases and reports. Proceed?')) {
            await clearCaseData();
            localStorage.removeItem('sherlock_active_case_id');
            alert('Database purged.');
        }
    };

    const renderGeneral = () => (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-8">
                <section className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <Palette className="w-4 h-4 text-osint-primary" />
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">Visual Interface</h3>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800 p-6 space-y-6 h-full">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-[10px] text-zinc-500 font-mono uppercase">Accent Color</label>
                                <div className="text-[10px] text-zinc-500 font-mono">{buildAccentColor(accentSettings)}</div>
                            </div>
                            <AccentPicker
                                hue={accentSettings.hue}
                                lightness={accentSettings.lightness}
                                chroma={accentSettings.chroma}
                                onChange={(settings) => onAccentChange(settings)}
                            />
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <Shield className="w-4 h-4 text-osint-primary" />
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">Intelligence & Alerts</h3>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800 p-6 h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <h4 className="text-sm font-bold text-zinc-200 font-mono">Auto-Resolve Entities</h4>
                                <p className="text-[10px] text-zinc-500 font-mono mt-1">Automatically group variations of entity names</p>
                            </div>
                            <button
                                onClick={() => setAutoResolve(!autoResolve)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${autoResolve ? 'bg-zinc-200' : 'bg-zinc-800'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoResolve ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="my-4 border-t border-zinc-800" />
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <h4 className="text-sm font-bold text-zinc-200 font-mono">Quiet Mode</h4>
                                <p className="text-[10px] text-zinc-500 font-mono mt-1">Suppress non-critical system notifications</p>
                            </div>
                            <button
                                onClick={() => setQuietMode(!quietMode)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${quietMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${quietMode ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </section>
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
                            <div className="flex gap-2">
                                <input
                                    type={showGeminiKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter Gemini API Key..."
                                    className="flex-1 bg-black border border-zinc-700 text-white p-3 text-xs font-mono focus:border-osint-primary outline-none transition-colors"
                                />
                                <button
                                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                                    className="px-4 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white transition-colors text-xs font-mono"
                                >
                                    {showGeminiKey ? 'HIDE' : 'SHOW'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] text-zinc-500 font-mono uppercase">OpenRouter API Key</label>
                            <div className="flex gap-2">
                                <input
                                    type={showOpenRouterKey ? 'text' : 'password'}
                                    value={openRouterKey}
                                    onChange={(e) => setOpenRouterKey(e.target.value)}
                                    placeholder="Enter OpenRouter API Key..."
                                    className="flex-1 bg-black border border-zinc-700 text-white p-3 text-xs font-mono focus:border-osint-primary outline-none transition-colors"
                                />
                                <button
                                    onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                                    className="px-4 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white transition-colors text-xs font-mono"
                                >
                                    {showOpenRouterKey ? 'HIDE' : 'SHOW'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] text-zinc-500 font-mono uppercase">OpenAI API Key</label>
                            <div className="flex gap-2">
                                <input
                                    type={showOpenAIKey ? 'text' : 'password'}
                                    value={openAIKey}
                                    onChange={(e) => setOpenAIKey(e.target.value)}
                                    placeholder="Enter OpenAI API Key..."
                                    className="flex-1 bg-black border border-zinc-700 text-white p-3 text-xs font-mono focus:border-osint-primary outline-none transition-colors"
                                />
                                <button
                                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                                    className="px-4 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white transition-colors text-xs font-mono"
                                >
                                    {showOpenAIKey ? 'HIDE' : 'SHOW'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] text-zinc-500 font-mono uppercase">Anthropic API Key</label>
                            <div className="flex gap-2">
                                <input
                                    type={showAnthropicKey ? 'text' : 'password'}
                                    value={anthropicKey}
                                    onChange={(e) => setAnthropicKey(e.target.value)}
                                    placeholder="Enter Anthropic API Key..."
                                    className="flex-1 bg-black border border-zinc-700 text-white p-3 text-xs font-mono focus:border-osint-primary outline-none transition-colors"
                                />
                                <button
                                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                                    className="px-4 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white transition-colors text-xs font-mono"
                                >
                                    {showAnthropicKey ? 'HIDE' : 'SHOW'}
                                </button>
                            </div>
                        </div>

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
                            <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-2">Active Model</label>
                            <div className="relative">
                                <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 text-zinc-300 text-xs font-mono py-3 pl-3 pr-8 rounded-none outline-none appearance-none cursor-pointer hover:border-osint-primary"
                                >
                                    {AI_MODELS.map((model) => (
                                        <option key={model.id} value={model.id}>{model.name} ({model.id})</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-mono mt-2">
                                Provider: <span className="text-zinc-300">{selectedModelMeta?.provider || 'GEMINI'}</span>
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
                                    className={`py-2 border font-mono text-xs uppercase ${searchDepth === 'STANDARD' ? 'border-osint-primary bg-osint-primary/10 text-white' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Standard
                                </button>
                                <button
                                    onClick={() => setSearchDepth('DEEP')}
                                    className={`py-2 border font-mono text-xs uppercase ${searchDepth === 'DEEP' ? 'border-osint-primary bg-osint-primary/10 text-white' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Deep
                                </button>
                            </div>
                        </div>

                        <div className="pt-2 space-y-2">
                            <div className="flex items-center space-x-2">
                                <Brain className="w-3 h-3 text-osint-primary" />
                                <label className="text-[10px] text-zinc-500 font-mono uppercase">Thinking Budget ({thinkingBudget})</label>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={8192}
                                step={512}
                                value={thinkingBudget}
                                onChange={(event) => setThinkingBudget(Number(event.target.value))}
                                className="w-full accent-[var(--osint-primary)]"
                            />
                            <p className="text-[9px] text-zinc-600 font-mono italic">Primarily applied by Gemini reasoning models.</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );

    const renderMaintenance = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="bg-zinc-900/40 border border-zinc-800 p-8 space-y-6">
                <div className="flex items-center space-x-3 mb-2">
                    <Database className="w-5 h-5 text-osint-primary" />
                    <h3 className="text-lg font-bold text-white font-mono uppercase tracking-widest">Data Management</h3>
                </div>
                <p className="text-zinc-500 text-xs font-mono leading-relaxed max-w-2xl">
                    Sherlock operates as a client-side laboratory. All evidence, case files, and intelligence reports are stored exclusively within your browser&apos;s persistent storage. We recommend regular exports to ensure data stability.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <button
                        onClick={handleExportData}
                        className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 hover:border-white transition-all group"
                    >
                        <div className="text-left">
                            <span className="block text-xs font-bold text-white font-mono uppercase">Export Dossier</span>
                            <span className="text-[10px] text-zinc-500 font-mono">Create localized JSON backup</span>
                        </div>
                        <Download className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 hover:border-white transition-all group"
                    >
                        <div className="text-left">
                            <span className="block text-xs font-bold text-white font-mono uppercase">Restore Backup</span>
                            <span className="text-[10px] text-zinc-500 font-mono">Import previous JSON dossier</span>
                        </div>
                        <Upload className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
                </div>
            </section>

            <section className="bg-red-900/10 border border-red-900/30 p-8 space-y-6">
                <div className="flex items-center space-x-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="text-lg font-bold text-red-500 font-mono uppercase tracking-widest">System Purge</h3>
                </div>
                <p className="text-red-900/60 text-xs font-mono leading-relaxed max-w-2xl">
                    The purge protocol will permanently delete all local intelligence records, cases, and active task history. This action cannot be reversed.
                </p>
                <button
                    onClick={handleClearData}
                    className="flex items-center px-6 py-3 bg-red-600 text-white font-mono text-xs font-bold uppercase hover:bg-red-500 transition-all shadow-[0_4px_20px_rgba(220,38,38,0.2)]"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Execute System Purge
                </button>
            </section>
        </div>
    );

    return (
        <div className="h-full w-full bg-black relative flex flex-col overflow-hidden">
            <BackgroundMatrixRain />

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
                        disabled={isSaving || (activeTab !== 'GENERAL' && activeTab !== 'AI')}
                        className="flex items-center px-4 py-2 bg-white text-black border border-white font-mono text-xs font-bold uppercase hover:bg-osint-primary hover:border-osint-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_-5px_rgba(255,255,255,0.45)]"
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
                    {activeTab === 'TEMPLATES' && <TemplateGallery onApply={(t) => onStartCase(t.topic, t.config)} />}
                    {activeTab === 'MAINTENANCE' && renderMaintenance()}
                </div>
            </main>
        </div>
    );
};
