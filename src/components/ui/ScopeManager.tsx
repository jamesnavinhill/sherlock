import React, { useState } from 'react';
import {
    Compass, Check, Plus, Trash2, Edit2, X, Save,
    ChevronDown, ChevronUp, Star
} from 'lucide-react';
import { useCaseStore } from '../../store/caseStore';
import { BUILTIN_SCOPES, getAllScopes } from '../../data/presets';
import type { InvestigationScope } from '../../types';

interface ScopeManagerProps {
    onClose?: () => void;
}

const DEFAULT_SCOPE_ICON = '*';

export const ScopeManager: React.FC<ScopeManagerProps> = ({ onClose: _onClose }) => {
    const {
        customScopes,
        activeScope: activeScopeId,
        defaultScopeId,
        setActiveScope,
        setDefaultScope,
        addScope,
        deleteScope
    } = useCaseStore();

    const allScopes = getAllScopes(customScopes);
    const [expandedScopeId, setExpandedScopeId] = useState<string | null>(null);
    const [editingScope, setEditingScope] = useState<InvestigationScope | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formIcon, setFormIcon] = useState(DEFAULT_SCOPE_ICON);
    const [formCategories, setFormCategories] = useState('');
    const [formDomainContext, setFormDomainContext] = useState('');

    const resetForm = () => {
        setFormName('');
        setFormDescription('');
        setFormIcon(DEFAULT_SCOPE_ICON);
        setFormCategories('');
        setFormDomainContext('');
        setEditingScope(null);
        setShowCreateForm(false);
    };

    const startEdit = (scope: InvestigationScope) => {
        setFormName(scope.name);
        setFormDescription(scope.description || '');
        setFormIcon(scope.icon || DEFAULT_SCOPE_ICON);
        setFormCategories(scope.categories?.join(', ') || '');
        setFormDomainContext(scope.domainContext || '');
        setEditingScope(scope);
        setShowCreateForm(true);
    };

    const handleSave = () => {
        if (!formName.trim()) return;

        const categories = formCategories.split(',').map((category) => category.trim()).filter(Boolean);

        const newScope: InvestigationScope = {
            id: editingScope?.id || `custom-${Date.now()}`,
            name: formName.trim(),
            description: formDescription.trim(),
            icon: formIcon || DEFAULT_SCOPE_ICON,
            categories,
            domainContext: formDomainContext.trim(),
            personas: editingScope?.personas || BUILTIN_SCOPES[0].personas,
            suggestedSources: editingScope?.suggestedSources || [],
            defaultPersona: editingScope?.defaultPersona || 'general-investigator',
        };

        addScope(newScope);
        resetForm();
    };

    const handleDelete = (scopeId: string) => {
        if (!confirm('Delete this custom scope? This cannot be undone.')) return;

        deleteScope(scopeId);
        if (activeScopeId === scopeId) {
            setActiveScope(BUILTIN_SCOPES[0].id);
        }
    };

    const isBuiltin = (scopeId: string) => BUILTIN_SCOPES.some((scope) => scope.id === scopeId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Compass className="w-5 h-5 text-osint-primary" />
                    <h3 className="text-white font-mono font-bold uppercase text-sm">Scopes and Domain Packs</h3>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center px-3 py-1.5 bg-osint-primary text-black font-mono text-xs font-bold uppercase hover:bg-white transition-colors"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    New Scope
                </button>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-3">
                <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Active Scope</div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-lg">
                            {allScopes.find((scope) => scope.id === activeScopeId)?.icon || DEFAULT_SCOPE_ICON}
                        </span>
                        <span className="text-white font-mono">
                            {allScopes.find((scope) => scope.id === activeScopeId)?.name || 'None'}
                        </span>
                    </div>
                    {defaultScopeId === activeScopeId && (
                        <span className="flex items-center text-[10px] text-osint-primary font-mono">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            DEFAULT
                        </span>
                    )}
                </div>
            </div>

            {showCreateForm && (
                <div className="bg-black border border-zinc-700 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                        <h4 className="text-white font-mono font-bold text-xs uppercase">
                            {editingScope ? 'Edit Scope' : 'Create Custom Scope'}
                        </h4>
                        <button onClick={resetForm} className="text-zinc-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-6 gap-3">
                        <div className="col-span-1">
                            <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">Icon</label>
                            <input
                                type="text"
                                value={formIcon}
                                onChange={(event) => setFormIcon(event.target.value.slice(0, 2))}
                                className="w-full bg-zinc-900 border border-zinc-700 text-white p-2 text-center text-lg focus:border-osint-primary outline-none"
                                maxLength={2}
                            />
                        </div>
                        <div className="col-span-5">
                            <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">Name</label>
                            <input
                                type="text"
                                value={formName}
                                onChange={(event) => setFormName(event.target.value)}
                                placeholder="e.g., Supply Chain Analysis"
                                className="w-full bg-zinc-900 border border-zinc-700 text-white p-2 font-mono text-xs focus:border-osint-primary outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">Description</label>
                        <textarea
                            value={formDescription}
                            onChange={(event) => setFormDescription(event.target.value)}
                            placeholder="Brief description of this scope or pack..."
                            className="w-full h-16 bg-zinc-900 border border-zinc-700 text-white p-2 font-mono text-xs focus:border-osint-primary outline-none resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">Categories (comma-separated)</label>
                        <input
                            type="text"
                            value={formCategories}
                            onChange={(event) => setFormCategories(event.target.value)}
                            placeholder="e.g., Finance, Contracts, Compliance"
                            className="w-full bg-zinc-900 border border-zinc-700 text-white p-2 font-mono text-xs focus:border-osint-primary outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">Domain Context</label>
                        <textarea
                            value={formDomainContext}
                            onChange={(event) => setFormDomainContext(event.target.value)}
                            placeholder="Provide context about this domain, workflow, or monitoring area..."
                            className="w-full h-20 bg-zinc-900 border border-zinc-700 text-white p-2 font-mono text-xs focus:border-osint-primary outline-none resize-none"
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white font-mono text-xs uppercase transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!formName.trim()}
                            className="flex items-center px-4 py-2 bg-osint-primary text-black font-mono text-xs font-bold uppercase hover:bg-white transition-colors disabled:opacity-50"
                        >
                            <Save className="w-3 h-3 mr-1" />
                            {editingScope ? 'Save Changes' : 'Create Scope'}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <div className="text-[10px] text-zinc-500 font-mono uppercase">Available Scopes</div>

                {allScopes.map((scope) => (
                    <div
                        key={scope.id}
                        className={`border transition-all ${
                            activeScopeId === scope.id
                                ? 'border-osint-primary bg-osint-primary/5'
                                : 'border-zinc-800 hover:border-zinc-600'
                        }`}
                    >
                        <div
                            className="flex items-center justify-between p-3 cursor-pointer"
                            onClick={() => setExpandedScopeId(expandedScopeId === scope.id ? null : scope.id)}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-lg">{scope.icon || DEFAULT_SCOPE_ICON}</span>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-white font-mono text-sm">{scope.name}</span>
                                        {isBuiltin(scope.id) && (
                                            <span className="text-[9px] text-zinc-600 font-mono uppercase px-1 border border-zinc-700">BUILTIN</span>
                                        )}
                                        {defaultScopeId === scope.id && (
                                            <Star className="w-3 h-3 text-osint-primary fill-current" />
                                        )}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 line-clamp-1">{scope.description}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                {activeScopeId === scope.id && (
                                    <span className="text-[10px] text-osint-primary font-mono uppercase">Active</span>
                                )}
                                {expandedScopeId === scope.id ? (
                                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                                )}
                            </div>
                        </div>

                        {expandedScopeId === scope.id && (
                            <div className="px-3 pb-3 pt-0 border-t border-zinc-800 space-y-3 animate-in slide-in-from-top-1 duration-150">
                                {scope.categories && scope.categories.length > 0 && (
                                    <div>
                                        <div className="text-[10px] text-zinc-600 font-mono uppercase mb-1">Categories</div>
                                        <div className="flex flex-wrap gap-1">
                                            {scope.categories.map((category) => (
                                                <span key={category} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                                                    {category}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {scope.personas && scope.personas.length > 0 && (
                                    <div>
                                        <div className="text-[10px] text-zinc-600 font-mono uppercase mb-1">Personas</div>
                                        <div className="flex flex-wrap gap-1">
                                            {scope.personas.map((persona) => (
                                                <span
                                                    key={persona.id}
                                                    className={`px-2 py-0.5 text-[10px] font-mono ${
                                                        persona.id === scope.defaultPersona
                                                            ? 'bg-osint-primary/20 text-osint-primary'
                                                            : 'bg-zinc-800 text-zinc-400'
                                                    }`}
                                                >
                                                    {persona.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                                    <div className="flex space-x-2">
                                        {activeScopeId !== scope.id && (
                                            <button
                                                onClick={() => setActiveScope(scope.id)}
                                                className="flex items-center px-2 py-1 text-[10px] font-mono text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 uppercase"
                                            >
                                                <Check className="w-3 h-3 mr-1" />
                                                Set Active
                                            </button>
                                        )}
                                        {defaultScopeId !== scope.id && (
                                            <button
                                                onClick={() => setDefaultScope(scope.id)}
                                                className="flex items-center px-2 py-1 text-[10px] font-mono text-zinc-400 hover:text-osint-primary border border-zinc-700 hover:border-osint-primary uppercase"
                                            >
                                                <Star className="w-3 h-3 mr-1" />
                                                Set Default
                                            </button>
                                        )}
                                    </div>

                                    {!isBuiltin(scope.id) && (
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => startEdit(scope)}
                                                className="p-1 text-zinc-500 hover:text-white"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(scope.id)}
                                                className="p-1 text-zinc-500 hover:text-red-500"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
