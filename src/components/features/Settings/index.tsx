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
    X
} from 'lucide-react';
import { useCaseStore } from '../../../store/caseStore';
import { BackgroundMatrixRain } from '../../ui/BackgroundMatrixRain';
import { TemplateGallery } from './TemplateGallery';
import { ScopeManager } from '../../ui/ScopeManager';
import type { SystemConfig } from '../../../types';
import { AccentPicker } from '../../ui/AccentPicker';
import { buildAccentColor } from '../../../utils/accent';

interface SettingsProps {
    themeColor: string;
    onThemeChange: (color: string) => void;
    onAccentChange: (settings: { hue: number; lightness: number; chroma: number }) => void;
    accentSettings: { hue: number; lightness: number; chroma: number };
    onStartCase: (topic: string, config: SystemConfig) => void;
    onClose: () => void;
}

const TABS = [
    { id: 'GENERAL', label: 'General', icon: SettingsIcon },
    { id: 'SCOPES', label: 'Scopes', icon: Compass },
    { id: 'TEMPLATES', label: 'Templates', icon: Layout },
    { id: 'MAINTENANCE', label: 'Maintenance', icon: Database }
];

export const Settings: React.FC<SettingsProps> = ({ themeColor, onThemeChange, onAccentChange, accentSettings, onStartCase, onClose }) => {
    const { archives, cases, importCaseData, clearCaseData } = useCaseStore();
    const [activeTab, setActiveTab] = useState('GENERAL');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') ?? '');
    const [openAIKey, setOpenAIKey] = useState(() => localStorage.getItem('OPENAI_API_KEY') ?? '');
    const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem('ANTHROPIC_API_KEY') ?? '');
    const [showKey, setShowKey] = useState(false);
    const [showOpenAIKey, setShowOpenAIKey] = useState(false);
    const [showAnthropicKey, setShowAnthropicKey] = useState(false);
    const [autoResolve, setAutoResolve] = useState(() => {
        const configStr = localStorage.getItem('sherlock_config');
        if (!configStr) return true;
        try {
            const config: SystemConfig = JSON.parse(configStr);
            return config.autoNormalizeEntities ?? true;
        } catch (error) {
            console.error("Failed to load config", error);
            return true;
        }
    });
    const [quietMode, setQuietMode] = useState(() => {
        const configStr = localStorage.getItem('sherlock_config');
        if (!configStr) return false;
        try {
            const config: SystemConfig = JSON.parse(configStr);
            return config.quietMode ?? false;
        } catch { return false; }
    });
    const [selectedModel, setSelectedModel] = useState(() => {
        const configStr = localStorage.getItem('sherlock_config');
        if (!configStr) return 'gemini-3-flash-preview';
        try {
            const config: SystemConfig = JSON.parse(configStr);
            return config.modelId ?? 'gemini-3-flash-preview';
        } catch { return 'gemini-3-flash-preview'; }
    });

    const AVAILABLE_MODELS = [
        { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Most capable, best for complex analysis' },
        { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Fast and efficient, great balance' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Advanced reasoning, deep thinking' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Quick responses, cost effective' },
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', description: 'Low cost, high throughput' },
    ];
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveGeneral = () => {
        setIsSaving(true);
        localStorage.setItem('GEMINI_API_KEY', apiKey);
        localStorage.setItem('OPENAI_API_KEY', openAIKey);
        localStorage.setItem('ANTHROPIC_API_KEY', anthropicKey);

        const config: SystemConfig = {
            modelId: selectedModel,
            autoNormalizeEntities: autoResolve,
            quietMode,
            theme: themeColor
        } as SystemConfig & { theme?: string };
        localStorage.setItem('sherlock_config', JSON.stringify(config));

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
                autoNormalizeEntities: autoResolve,
                quietMode,
                theme: themeColor
            } as SystemConfig & { theme?: string },
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
                    if (confirm("This will overwrite your current database. Continue?")) {
                        await importCaseData({ cases: data.cases, archives: data.archives });
                        if (data.config?.theme) onThemeChange(data.config.theme);
                        alert("Data imported successfully.");
                    }
                } else {
                    alert("Invalid backup file format.");
                }
            } catch {
                alert("Failed to parse JSON file.");
            }
        };
        reader.readAsText(file);
    };

    const handleClearData = async () => {
        if (confirm("CRITICAL WARNING: This will permanently delete all cases and reports. Proceed?")) {
            await clearCaseData();
            localStorage.removeItem('sherlock_active_case_id');
            alert("Database purged.");
        }
    };

    const renderGeneral = () => (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12">
                {/* Visual Interface */}
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

                {/* API Key */}
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
                                    type={showKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter Gemini API Key..."
                                    className="flex-1 bg-black border border-zinc-700 text-white p-3 text-xs font-mono focus:border-osint-primary outline-none transition-colors"
                                />
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="px-4 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white transition-colors text-xs font-mono"
                                >
                                    {showKey ? 'HIDE' : 'SHOW'}
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

                {/* AI Model Selection - Compact dropdown style */}
                <section className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <Cpu className="w-4 h-4 text-osint-primary" />
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">AI Model</h3>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800 p-6 h-full flex flex-col justify-center">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-zinc-200 font-mono">Active Model</h4>
                                <p className="text-[10px] text-zinc-500 font-mono mt-1">Gemini model for all AI operations</p>
                            </div>
                            <div className="relative">
                                <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="bg-black border border-zinc-700 text-zinc-300 text-xs font-mono py-2 pl-3 pr-8 rounded-none outline-none appearance-none cursor-pointer hover:border-osint-primary min-w-[160px]"
                                >
                                    {AVAILABLE_MODELS.map(model => (
                                        <option key={model.id} value={model.id}>{model.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Intelligence Logic */}
                <section className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <Shield className="w-4 h-4 text-osint-primary" />
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">Intelligence Logic</h3>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800 p-6 h-full flex flex-col justify-center">
                        <div className="flex items-center justify-between">
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
                    </div>
                </section>

                {/* Notification Logic */}
                <section className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <Shield className="w-4 h-4 text-osint-primary" />
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">Alert Protocols</h3>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800 p-6 h-full flex flex-col justify-center">
                        <div className="flex items-center justify-between">
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

            {/* Unified Top Bar */}
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
                        onClick={handleSaveGeneral}
                        disabled={isSaving || activeTab !== 'GENERAL'}
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

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
                <div className="w-full">
                    {activeTab === 'GENERAL' && renderGeneral()}
                    {activeTab === 'SCOPES' && <ScopeManager />}
                    {activeTab === 'TEMPLATES' && <TemplateGallery onApply={(t) => onStartCase(t.topic, t.config)} />}
                    {activeTab === 'MAINTENANCE' && renderMaintenance()}
                </div>
            </main>
        </div>
    );
};
