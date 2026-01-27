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
    Compass
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
}

const TABS = [
    { id: 'GENERAL', label: 'General', icon: SettingsIcon },
    { id: 'SCOPES', label: 'Scopes', icon: Compass },
    { id: 'TEMPLATES', label: 'Templates', icon: Layout },
    { id: 'MAINTENANCE', label: 'Maintenance', icon: Database }
];

export const Settings: React.FC<SettingsProps> = ({ themeColor, onThemeChange, onAccentChange, accentSettings, onStartCase }) => {
    const { archives, cases, setArchives, setCases } = useCaseStore();
    const [activeTab, setActiveTab] = useState('GENERAL');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') ?? '');
    const [showKey, setShowKey] = useState(false);
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
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveGeneral = () => {
        setIsSaving(true);
        localStorage.setItem('GEMINI_API_KEY', apiKey);

        const config: SystemConfig = {
            autoNormalizeEntities: autoResolve,
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
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.archives && data.cases) {
                    if (confirm("This will overwrite your current database. Continue?")) {
                        setArchives(data.archives);
                        setCases(data.cases);
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

    const handleClearData = () => {
        if (confirm("CRITICAL WARNING: This will permanently delete all cases and reports. Proceed?")) {
            setArchives([]);
            setCases([]);
            localStorage.removeItem('sherlock_active_case_id');
            alert("Database purged.");
        }
    };

    const renderGeneral = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* API Key */}
            <section className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                    <Key className="w-4 h-4 text-osint-primary" />
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">Access Credentials</h3>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="block text-[10px] text-zinc-500 font-mono uppercase">Google Gemini API Key</label>
                        <div className="flex gap-2">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter API Key..."
                                className="flex-1 bg-black border border-zinc-700 text-white p-3 text-xs font-mono focus:border-osint-primary outline-none transition-colors"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="px-4 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white transition-colors text-xs font-mono"
                            >
                                {showKey ? 'HIDE' : 'SHOW'}
                            </button>
                        </div>
                        <p className="text-[9px] text-zinc-600 font-mono italic">Keys are stored locally in your browser. They are never transmitted to our servers.</p>
                    </div>
                </div>
            </section>

            {/* Appearance */}
            <section className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                    <Palette className="w-4 h-4 text-osint-primary" />
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">Visual Interface</h3>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 p-6 space-y-6">
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

            {/* Intelligence Logic */}
            <section className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                    <Shield className="w-4 h-4 text-osint-primary" />
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">Intelligence Logic</h3>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-zinc-200 font-mono">Auto-Resolve Entities</h4>
                            <p className="text-[10px] text-zinc-500 font-mono mt-1">Automatically group variations of entity names (e.g. &quot;Google Inc&quot; &amp; &quot;Google&quot;)</p>
                        </div>
                        <button
                            onClick={() => setAutoResolve(!autoResolve)}
                            className={`w-12 h-6 rounded-full relative transition-colors ${autoResolve ? 'bg-osint-primary' : 'bg-zinc-800'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoResolve ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>
            </section>

            <div className="pt-4 sticky bottom-0 bg-black/80 backdrop-blur-sm pb-6 border-t border-zinc-800 flex justify-end">
                <button
                    onClick={handleSaveGeneral}
                    disabled={isSaving}
                    className="flex items-center px-8 py-3 bg-osint-primary text-black font-mono text-sm font-bold uppercase hover:bg-white transition-all disabled:opacity-50"
                >
                    {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {isSaving ? 'Saving...' : saveSuccess ? 'Applied' : 'Apply Settings'}
                </button>
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

            {/* Header */}
            <header className="h-20 px-8 border-b border-zinc-800 flex items-center justify-between bg-black/95 backdrop-blur-md relative z-20 flex-shrink-0">
                <div className="flex items-center space-x-4">
                    <div className="bg-osint-primary/10 p-2 border border-osint-primary/30">
                        <SettingsIcon className="w-6 h-6 text-osint-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white font-mono uppercase tracking-tighter">Command Center</h1>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">System Protocols & Configuration</p>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="px-8 bg-zinc-900/50 border-b border-zinc-800 flex items-center space-x-8 relative z-20 flex-shrink-0">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-4 px-2 font-mono text-xs uppercase tracking-widest font-bold transition-all border-b-2 flex items-center space-x-2 ${activeTab === tab.id ? 'border-osint-primary text-osint-primary translate-y-[1px]' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <tab.icon className="w-3 h-3" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
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
