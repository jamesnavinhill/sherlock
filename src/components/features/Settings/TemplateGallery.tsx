import React, { useState } from 'react';
import type { CaseTemplate } from '../../../types';
import { useCaseStore } from '../../../store/caseStore';
import {
    Trash2, Play,
    Settings as SettingsIcon, Info, Search,
    Briefcase, Layout
} from 'lucide-react';

interface TemplateGalleryProps {
    onApply: (template: CaseTemplate) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onApply }) => {
    const { templates, deleteTemplate } = useCaseStore();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.topic.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 p-4 border border-zinc-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="search"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black border border-zinc-700 text-white pl-10 pr-4 py-2 font-mono text-xs focus:border-osint-primary outline-none transition-colors"
                    />
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-500 uppercase">
                    <Layout className="w-3 h-3" />
                    <span>{templates.length} Saved Protocols</span>
                </div>
            </div>

            {filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 bg-zinc-900/20">
                    <Layout className="w-12 h-12 text-zinc-700 mb-4 opacity-30" />
                    <h3 className="text-zinc-500 font-mono text-xs uppercase font-bold mb-1">No Templates Found</h3>
                    <p className="text-zinc-600 font-mono text-[10px]">Save investigation parameters to reuse them here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((t) => (
                        <div key={t.id} className="group bg-osint-panel border border-zinc-800 hover:border-osint-primary transition-all duration-300 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Briefcase className="w-16 h-16 text-white" />
                            </div>

                            <div className="p-5 flex-1 relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-mono text-osint-primary bg-osint-primary/10 px-2 py-0.5 border border-osint-primary/30 uppercase font-bold">
                                        Protocol
                                    </span>
                                    <span className="text-[9px] font-mono text-zinc-600">
                                        {new Date(t.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1 font-mono uppercase truncate group-hover:text-osint-primary transition-colors">
                                    {t.name}
                                </h3>
                                <p className="text-zinc-500 text-[10px] font-mono mb-4 line-clamp-2 italic">
                                    &quot;{t.topic}&quot;
                                </p>

                                <div className="space-y-2 border-t border-zinc-800 pt-4">
                                    <div className="flex items-center text-[10px] font-mono text-zinc-400 capitalize">
                                        <SettingsIcon className="w-3 h-3 mr-2 text-zinc-600" />
                                        <span>Model: {t.config.modelId?.replace('gemini-', '')}</span>
                                    </div>
                                    <div className="flex items-center text-[10px] font-mono text-zinc-400">
                                        <Info className="w-3 h-3 mr-2 text-zinc-600" />
                                        <span>Persona: {t.config.persona?.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex border-t border-zinc-800 relative z-10">
                                <button
                                    onClick={() => onApply(t)}
                                    className="flex-1 flex items-center justify-center p-3 bg-zinc-900 hover:bg-osint-primary text-zinc-400 hover:text-black font-mono text-[10px] font-bold uppercase transition-all"
                                >
                                    <Play className="w-3 h-3 mr-2" />
                                    Launch
                                </button>
                                <button
                                    onClick={() => deleteTemplate(t.id)}
                                    className="flex-shrink-0 p-3 border-l border-zinc-800 bg-zinc-900 hover:bg-red-900/50 text-zinc-600 hover:text-red-500 transition-all"
                                    title="Delete Template"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-zinc-600 font-mono text-[9px] flex items-start bg-zinc-900/30 p-3 border border-zinc-800/50">
                <Info className="w-3 h-3 mr-2 flex-shrink-0 text-osint-primary" />
                Case templates store topics, model configurations, and reasoning budgets. Applying a template will redirect you to the Investigation workspace with parameters pre-filled.
            </p>
        </div>
    );
};
