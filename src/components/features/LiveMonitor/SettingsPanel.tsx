import React from 'react';
import { MonitorConfig } from '../../../services/gemini';
import {
    Settings2, X, Trash2, Newspaper, MessageSquare,
    Landmark, Calendar, Save
} from 'lucide-react';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    config: MonitorConfig;
    onConfigChange: (config: MonitorConfig) => void;
    onClearFeed: () => void;
    autoSave: boolean;
    onAutoSaveChange: (value: boolean) => void;
}

/**
 * Configuration panel for the Live Monitor scanner settings.
 * Controls batch sizes, date ranges, priority sources, and auto-save.
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isOpen,
    onClose,
    config,
    onConfigChange,
    onClearFeed,
    autoSave,
    onAutoSaveChange
}) => {
    if (!isOpen) return null;

    const updateConfig = (updates: Partial<MonitorConfig>) => {
        onConfigChange({ ...config, ...updates });
    };

    return (
        <div className="absolute top-20 right-6 z-50 w-96 bg-osint-panel border border-zinc-700 shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-black">
                <h3 className="text-white font-mono font-bold uppercase text-sm flex items-center">
                    <Settings2 className="w-4 h-4 mr-2 text-osint-primary" />
                    Scanner Config
                </h3>
                <button onClick={onClose} className="text-zinc-500 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-5 space-y-5">

                {/* Counts */}
                <div>
                    <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-3">Batch Size Configuration</label>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-zinc-300 font-mono">
                                <Newspaper className="w-3 h-3 mr-2" /> News
                            </div>
                            <input
                                type="range" min="0" max="10" step="1"
                                value={config.newsCount}
                                onChange={(e) => updateConfig({ newsCount: parseInt(e.target.value) })}
                                className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-osint-primary"
                            />
                            <span className="text-xs font-mono w-4 text-right">{config.newsCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-zinc-300 font-mono">
                                <MessageSquare className="w-3 h-3 mr-2" /> Social
                            </div>
                            <input
                                type="range" min="0" max="10" step="1"
                                value={config.socialCount}
                                onChange={(e) => updateConfig({ socialCount: parseInt(e.target.value) })}
                                className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-osint-primary"
                            />
                            <span className="text-xs font-mono w-4 text-right">{config.socialCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-zinc-300 font-mono">
                                <Landmark className="w-3 h-3 mr-2" /> Official
                            </div>
                            <input
                                type="range" min="0" max="10" step="1"
                                value={config.officialCount}
                                onChange={(e) => updateConfig({ officialCount: parseInt(e.target.value) })}
                                className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-osint-primary"
                            />
                            <span className="text-xs font-mono w-4 text-right">{config.officialCount}</span>
                        </div>
                    </div>
                </div>

                {/* Date Range */}
                <div>
                    <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-2 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" /> Temporal Constraints
                    </label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <input
                                type="date"
                                value={config.dateRange?.start || ''}
                                onChange={(e) => updateConfig({ dateRange: { ...config.dateRange, start: e.target.value } })}
                                className="w-full bg-black border border-zinc-700 text-zinc-300 p-2 text-xs font-mono focus:border-osint-primary outline-none"
                                placeholder="Start Date"
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                type="date"
                                value={config.dateRange?.end || ''}
                                onChange={(e) => updateConfig({ dateRange: { ...config.dateRange, end: e.target.value } })}
                                className="w-full bg-black border border-zinc-700 text-zinc-300 p-2 text-xs font-mono focus:border-osint-primary outline-none"
                                placeholder="End Date"
                            />
                        </div>
                    </div>
                </div>

                {/* Priority Sources */}
                <div>
                    <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-2">Priority Sources / Handles</label>
                    <textarea
                        value={config.prioritySources}
                        onChange={(e) => updateConfig({ prioritySources: e.target.value })}
                        placeholder="@elonmusk, nytimes.com, dod.gov"
                        className="w-full h-20 bg-black border border-zinc-700 text-xs text-zinc-300 p-2 font-mono focus:border-osint-primary outline-none resize-none placeholder-zinc-700"
                    />
                    <p className="text-[9px] text-zinc-600 mt-1 font-mono">Comma separated list of domains or handles to prioritize.</p>
                </div>

                {/* Auto-Save Toggle */}
                <div className="flex items-center justify-between">
                    <label className="text-[10px] text-zinc-500 font-mono uppercase flex items-center">
                        <Save className="w-3 h-3 mr-2" /> Auto-Save Headlines
                    </label>
                    <button
                        onClick={() => onAutoSaveChange(!autoSave)}
                        className={`w-8 h-4 rounded-full p-0.5 transition-colors ${autoSave ? 'bg-osint-primary' : 'bg-zinc-700'}`}
                    >
                        <div className={`w-3 h-3 bg-black rounded-full shadow-md transform transition-transform ${autoSave ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                    <button
                        onClick={onClearFeed}
                        className="text-xs font-mono text-red-500 hover:text-red-400 flex items-center uppercase"
                    >
                        <Trash2 className="w-3 h-3 mr-1" /> Clear Feed
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-white text-black text-xs font-mono font-bold uppercase hover:bg-zinc-200"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};
