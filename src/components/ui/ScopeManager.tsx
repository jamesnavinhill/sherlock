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
import { Accordion } from './Accordion';
import {
  SETTINGS_CARD_CLASS,
  SETTINGS_INPUT_CLASS,
  SETTINGS_SEARCH_INPUT_CLASS,
  SETTINGS_SECTION_BODY_CLASS,
  SETTINGS_TEXTAREA_CLASS,
} from '@/components/features/Settings/settingsUtils';

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
  const [libraryOpen, setLibraryOpen] = useState(true);

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
      <div className="osint-panel-shell flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 p-4 border border-zinc-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="search"
            placeholder="Search scopes..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className={SETTINGS_SEARCH_INPUT_CLASS}
          />
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="osint-surface-button flex items-center px-4 py-2 osint-meta-label-strong"
        >
          <Plus className="w-3 h-3 mr-1" />
          New Scope
        </button>
      </div>

      <Accordion
        title="Scopes"
        count={filteredScopes.length}
        isOpen={libraryOpen}
        onToggle={() => setLibraryOpen((current) => !current)}
        disableActiveHeaderStyle
      >
        <div className={SETTINGS_SECTION_BODY_CLASS}>
          {showCreateForm && (
            <div
              className={`${SETTINGS_CARD_CLASS} space-y-4 animate-in slide-in-from-top-2 duration-200`}
            >
              <div className="flex items-center justify-between">
                <h4 className="osint-meta-value">
                  {editingScope ? 'Edit Scope' : 'Create Custom Scope'}
                </h4>
                <button onClick={resetForm} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="mb-1 block osint-meta-label">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder="e.g., Supply Chain Analysis"
                  className={SETTINGS_INPUT_CLASS}
                />
              </div>

              <div>
                <label className="mb-1 block osint-meta-label">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                  placeholder="Brief description of this scope or pack..."
                  className={`${SETTINGS_TEXTAREA_CLASS} h-16`}
                />
              </div>

              <div>
                <label className="mb-1 block osint-meta-label">Categories (comma-separated)</label>
                <input
                  type="text"
                  value={formCategories}
                  onChange={(event) => setFormCategories(event.target.value)}
                  placeholder="e.g., Finance, Contracts, Compliance"
                  className={SETTINGS_INPUT_CLASS}
                />
              </div>

              <div>
                <label className="mb-1 block osint-meta-label">Domain Context</label>
                <textarea
                  value={formDomainContext}
                  onChange={(event) => setFormDomainContext(event.target.value)}
                  placeholder="Provide context about this domain, workflow, or monitoring area..."
                  className={`${SETTINGS_TEXTAREA_CLASS} h-20`}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={resetForm}
                  className="osint-surface-button px-4 py-2 osint-meta-label text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formName.trim()}
                  className="osint-surface-button flex items-center px-4 py-2 osint-meta-label-strong disabled:opacity-50"
                >
                  <Save className="w-3 h-3 mr-1" />
                  {editingScope ? 'Save Changes' : 'Create Scope'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
            {filteredScopes.map((scope) => {
              const expanded = expandedScopeIds.includes(scope.id);

              return (
                <div
                  key={scope.id}
                  className={`${SETTINGS_CARD_CLASS} overflow-hidden transition-all ${
                    activeScopeId === scope.id
                      ? 'border-osint-primary/50 bg-osint-primary/5'
                      : 'hover:border-zinc-600'
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
                          <span className="osint-meta-value">{scope.name}</span>
                          {activeScopeId === scope.id && (
                            <span className="border border-osint-primary/40 bg-osint-primary/10 px-1.5 py-0.5 osint-meta-label text-osint-primary">
                              Active
                            </span>
                          )}
                          {defaultScopeId === scope.id && (
                            <span className="inline-flex items-center gap-1 border border-osint-primary/30 px-1.5 py-0.5 osint-meta-label text-osint-primary">
                              <Star className="w-3 h-3 fill-current" />
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-2 osint-body-quiet line-clamp-3">
                          {scope.description}
                        </p>
                      </div>

                      {expanded ? (
                        <ChevronUp className="mt-1 h-4 w-4 flex-shrink-0 text-zinc-500" />
                      ) : (
                        <ChevronDown className="mt-1 h-4 w-4 flex-shrink-0 text-zinc-500" />
                      )}
                    </div>
                  </button>

                  {expanded && (
                    <div className="animate-in slide-in-from-top-1 space-y-4 border-t border-zinc-800 px-5 pb-3 pt-4 duration-150">
                      {scope.categories && scope.categories.length > 0 && (
                        <div>
                          <div className="mb-1 osint-meta-label">Categories</div>
                          <div className="flex flex-wrap gap-1">
                            {scope.categories.map((category) => (
                              <span
                                key={category}
                                className="bg-zinc-800 px-2 py-0.5 osint-body-quiet text-zinc-300"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {scope.personas && scope.personas.length > 0 && (
                        <div>
                          <div className="mb-1 osint-meta-label">Personas</div>
                          <div className="flex flex-wrap gap-1">
                            {scope.personas.map((persona) => (
                              <span
                                key={persona.id}
                                className={`px-2 py-0.5 osint-body-quiet ${
                                  persona.id === scope.defaultPersona
                                    ? 'bg-osint-primary/20 text-osint-primary'
                                    : 'bg-zinc-800 text-zinc-300'
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
                              className="osint-surface-button flex items-center px-2 py-1 osint-meta-label text-zinc-400"
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Set Active
                            </button>
                          )}
                          {defaultScopeId !== scope.id && (
                            <button
                              onClick={() => setDefaultScope(scope.id)}
                              className="osint-surface-button flex items-center px-2 py-1 osint-meta-label text-zinc-400"
                            >
                              <Star className="mr-1 h-3 w-3" />
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
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(scope)}
                              className="osint-danger-inline p-1 text-zinc-500"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
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
      </Accordion>

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
