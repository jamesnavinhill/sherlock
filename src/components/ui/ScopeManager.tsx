import React, { useState } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  Search,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { BUILTIN_SCOPES, getAllScopes } from '../../data/presets';
import type { InvestigationScope } from '../../types';
import { ConfirmDialog } from './ConfirmDialog';

interface ScopeManagerProps {
  onClose?: () => void;
}

export const ScopeManager: React.FC<ScopeManagerProps> = ({ onClose: _onClose }) => {
  const {
    customScopes,
    activeScope: activeScopeId,
    defaultScopeId,
    setActiveScope,
    setDefaultScope,
    addScope,
    deleteScope,
  } = useWorkspaceStore();

  const allScopes = getAllScopes(customScopes);
  const [expandedScopeIds, setExpandedScopeIds] = useState<string[]>(() =>
    allScopes.map((scope) => scope.id)
  );
  const [editingScope, setEditingScope] = useState<InvestigationScope | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopePendingDeletion, setScopePendingDeletion] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategories, setFormCategories] = useState('');
  const [formDomainContext, setFormDomainContext] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormCategories('');
    setFormDomainContext('');
    setEditingScope(null);
    setShowCreateForm(false);
  };

  const startEdit = (scope: InvestigationScope) => {
    setFormName(scope.name);
    setFormDescription(scope.description || '');
    setFormCategories(scope.categories?.join(', ') || '');
    setFormDomainContext(scope.domainContext || '');
    setEditingScope(scope);
    setShowCreateForm(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;

    const categories = formCategories
      .split(',')
      .map((category) => category.trim())
      .filter(Boolean);

    const newScope: InvestigationScope = {
      id: editingScope?.id || `custom-${Date.now()}`,
      name: formName.trim(),
      description: formDescription.trim(),
      categories,
      domainContext: formDomainContext.trim(),
      investigationObjective: editingScope?.investigationObjective || formDescription.trim(),
      personas: editingScope?.personas || BUILTIN_SCOPES[0].personas,
      suggestedSources: editingScope?.suggestedSources || [],
      defaultPersona: editingScope?.defaultPersona || 'general-investigator',
    };

    addScope(newScope);
    setExpandedScopeIds((current) =>
      current.includes(newScope.id) ? current : [...current, newScope.id]
    );
    resetForm();
  };

  const handleDelete = (scope: InvestigationScope) => {
    setScopePendingDeletion({ id: scope.id, name: scope.name });
  };

  const confirmDelete = () => {
    if (!scopePendingDeletion) return;
    const scopeId = scopePendingDeletion.id;

    deleteScope(scopeId);
    setExpandedScopeIds((current) => current.filter((id) => id !== scopeId));
    if (activeScopeId === scopeId) {
      setActiveScope(BUILTIN_SCOPES[0].id);
    }
    setScopePendingDeletion(null);
  };

  const isBuiltin = (scopeId: string) => BUILTIN_SCOPES.some((scope) => scope.id === scopeId);
  const filteredScopes = allScopes.filter((scope) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return [
      scope.name,
      scope.description,
      scope.domainContext,
      ...(scope.categories || []),
      ...(scope.personas || []).map((persona) => persona.label),
    ]
      .filter((value): value is string => typeof value === 'string')
      .some((value) => value.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 p-4 border border-zinc-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="search"
            placeholder="Search scopes..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full bg-black border border-zinc-700 text-white pl-10 pr-4 py-2 font-mono text-xs focus:border-osint-primary outline-none transition-colors"
          />
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="osint-button-primary flex items-center px-4 py-2 font-mono text-xs font-bold uppercase"
        >
          <Plus className="w-3 h-3 mr-1" />
          New Scope
        </button>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-3">
        <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Active Scope</div>
        <div className="flex items-center justify-between">
          <span className="text-white font-mono">
            {allScopes.find((scope) => scope.id === activeScopeId)?.name || 'None'}
          </span>
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

          <div>
            <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">
              Name
            </label>
            <input
              type="text"
              value={formName}
              onChange={(event) => setFormName(event.target.value)}
              placeholder="e.g., Supply Chain Analysis"
              className="w-full bg-zinc-900 border border-zinc-700 text-white p-2 font-mono text-xs focus:border-osint-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">
              Description
            </label>
            <textarea
              value={formDescription}
              onChange={(event) => setFormDescription(event.target.value)}
              placeholder="Brief description of this scope or pack..."
              className="w-full h-16 bg-zinc-900 border border-zinc-700 text-white p-2 font-mono text-xs focus:border-osint-primary outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">
              Categories (comma-separated)
            </label>
            <input
              type="text"
              value={formCategories}
              onChange={(event) => setFormCategories(event.target.value)}
              placeholder="e.g., Finance, Contracts, Compliance"
              className="w-full bg-zinc-900 border border-zinc-700 text-white p-2 font-mono text-xs focus:border-osint-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">
              Domain Context
            </label>
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
              className="osint-button-primary flex items-center px-4 py-2 font-mono text-xs font-bold uppercase disabled:opacity-50"
            >
              <Save className="w-3 h-3 mr-1" />
              {editingScope ? 'Save Changes' : 'Create Scope'}
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-3">
          {filteredScopes.map((scope) => {
            const expanded = expandedScopeIds.includes(scope.id);

            return (
              <div
                key={scope.id}
                className={`overflow-hidden border bg-zinc-950/60 transition-all ${
                  activeScopeId === scope.id
                    ? 'border-osint-primary/50 bg-osint-primary/5'
                    : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <button
                  type="button"
                  className="w-full p-5 text-left"
                  onClick={() =>
                    setExpandedScopeIds((current) =>
                      current.includes(scope.id)
                        ? current.filter((id) => id !== scope.id)
                        : [...current, scope.id]
                    )
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-white font-mono text-lg leading-none">
                          {scope.name}
                        </span>
                        {activeScopeId === scope.id && (
                          <span className="text-[9px] text-osint-primary font-mono uppercase px-1.5 py-0.5 border border-osint-primary/40 bg-osint-primary/10">
                            Active
                          </span>
                        )}
                        {defaultScopeId === scope.id && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-osint-primary font-mono uppercase px-1.5 py-0.5 border border-osint-primary/30">
                            <Star className="w-3 h-3 fill-current" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-zinc-500 line-clamp-3">
                        {scope.description}
                      </p>
                    </div>

                    {expanded ? (
                      <ChevronUp className="mt-1 w-4 h-4 flex-shrink-0 text-zinc-500" />
                    ) : (
                      <ChevronDown className="mt-1 w-4 h-4 flex-shrink-0 text-zinc-500" />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-zinc-800 px-5 pb-3 pt-4 space-y-4 animate-in slide-in-from-top-1 duration-150">
                    {scope.categories && scope.categories.length > 0 && (
                      <div>
                        <div className="text-[10px] text-zinc-600 font-mono uppercase mb-1">
                          Categories
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {scope.categories.map((category) => (
                            <span
                              key={category}
                              className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-mono"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {scope.personas && scope.personas.length > 0 && (
                      <div>
                        <div className="text-[10px] text-zinc-600 font-mono uppercase mb-1">
                          Personas
                        </div>
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

                    <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                      <div className="flex flex-wrap gap-2">
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
                            onClick={() => handleDelete(scope)}
                            className="p-1 text-zinc-500 osint-danger-inline"
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
            );
          })}
        </div>
      </div>

      {scopePendingDeletion ? (
        <ConfirmDialog
          title="Delete Custom Scope"
          description={`Delete "${scopePendingDeletion.name}"? This cannot be undone.`}
          confirmLabel="Delete Scope"
          tone="danger"
          onClose={() => setScopePendingDeletion(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </div>
  );
};
