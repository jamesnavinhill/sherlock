import React, { useMemo, useState } from 'react';
import { Play, Plus, Search, Trash2 } from 'lucide-react';

import type { WorkspaceTemplate } from '../../../types';
import { DEFAULT_MODEL_ID } from '../../../config/aiModels';
import { loadSystemConfig } from '../../../config/systemConfig';
import { BUILTIN_SCOPES, getAllScopes } from '../../../data/presets';
import { getDomainPackForScope, getPurposeProfileById, getStarterTemplates } from '../../../domain';
import { useTemplateGalleryFeatureState } from '@/store/selectors/settingsSelectors';
import { Accordion } from '@/components/ui/Accordion';
import { buildTemplateRuntimeConfig } from '../Runs/runtimeConfigMapping';
import { TemplateCreateModal } from './TemplateCreateModal';
import {
  SETTINGS_ACCORDION_CLASS,
  SETTINGS_BUTTON_MD_CLASS,
  SETTINGS_CARD_CLASS,
  SETTINGS_CARD_INTERACTIVE_CLASS,
  SETTINGS_SEARCH_INPUT_CLASS,
  SETTINGS_SECTION_BODY_CLASS,
  SETTINGS_SURFACE_BUTTON_CLASS,
  SETTINGS_TOOLBAR_CLASS,
} from './settingsUtils';

interface TemplateGalleryProps {
  onApply: (template: WorkspaceTemplate) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onApply }) => {
  const { templates, deleteTemplate, customScopes, defaultScopeId } =
    useTemplateGalleryFeatureState();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(true);

  const allScopes = useMemo(() => getAllScopes(customScopes), [customScopes]);
  const resolvedDefaultScopeId =
    allScopes.find((scope) => scope.id === defaultScopeId)?.id ||
    allScopes[0]?.id ||
    'open-investigation';
  const starterScope =
    allScopes.find((scope) => scope.id === resolvedDefaultScopeId) ||
    allScopes[0] ||
    BUILTIN_SCOPES[0];
  const starterPack = useMemo(
    () => getDomainPackForScope(starterScope, customScopes),
    [starterScope, customScopes]
  );
  const starterPurpose = useMemo(
    () => getPurposeProfileById(starterPack.defaultPurposeId),
    [starterPack]
  );
  const starterTemplates = useMemo<WorkspaceTemplate[]>(() => {
    const baseConfig = loadSystemConfig();
    const baseModel = baseConfig.modelId || DEFAULT_MODEL_ID;

    return getStarterTemplates(starterPack, starterPurpose).map(
      (starter) =>
        ({
          id: `builtin-${starter.id}`,
          name: `${starterPack.name}: ${starter.name}`,
          description: starter.description,
          topic: starter.hypothesis
            ? `${starter.topic}\n\n[RUN_ANGLE]: ${starter.hypothesis}`
            : starter.topic,
          config: buildTemplateRuntimeConfig({
            baseConfig,
            configOverride: {
              modelId: baseModel,
              persona: starterScope.defaultPersona || starterScope.personas[0]?.id,
              searchDepth: baseConfig.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD',
              generationMode:
                baseConfig.generationMode === 'SINGLE_PASS' ? 'SINGLE_PASS' : 'STAGED',
              thinkingBudget: typeof baseConfig.thinkingBudget === 'number'
                ? baseConfig.thinkingBudget
                : 0,
            },
            customScopes,
            scope: starterScope,
            purposeId: starter.purposeId,
            artifactType: starter.artifactType,
          }),
          scopeId: starterScope.id,
          packId: starterPack.id,
          purposeId: starter.purposeId,
          artifactType: starter.artifactType,
          labelProfileId: starterPack.labelProfileId,
          createdAt: 0,
        }) satisfies WorkspaceTemplate
    );
  }, [customScopes, starterPack, starterPurpose, starterScope]);

  const filteredTemplates = useMemo(
    () =>
      [
        ...starterTemplates.map((template) => ({ isStarter: true, template })),
        ...templates.map((template) => ({ isStarter: false, template })),
      ].filter(
        ({ template }) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.topic.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery, starterTemplates, templates]
  );

  return (
    <div className="space-y-6">
      <div className={SETTINGS_TOOLBAR_CLASS}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="search"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className={SETTINGS_SEARCH_INPUT_CLASS}
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-meta-label-strong`}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </button>
      </div>

      <Accordion
        title="Templates"
        count={filteredTemplates.length}
        isOpen={libraryOpen}
        onToggle={() => setLibraryOpen((current) => !current)}
        className={SETTINGS_ACCORDION_CLASS}
        disableActiveHeaderStyle
      >
        <div className={SETTINGS_SECTION_BODY_CLASS}>
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {filteredTemplates.map(({ isStarter, template }) => (
                <div
                  key={template.id}
                  className={`${SETTINGS_CARD_INTERACTIVE_CLASS} group flex flex-col`}
                >
                  <div className="flex-1 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span
                        className={`osint-pill-shape osint-pill-graph px-2 py-0.5 osint-meta-label-strong ${
                          isStarter ? 'osint-pill-graph-2 osint-pill-graph-emphasis' : 'osint-pill-graph-4'
                        }`}
                      >
                        {isStarter ? 'Starter' : 'Protocol'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="osint-meta-label">
                          {template.config.purposeId || template.purposeId || 'custom'}
                        </span>
                        {!isStarter ? (
                          <button
                            onClick={() => {
                              void deleteTemplate(template.id);
                            }}
                            className="text-zinc-700 transition-colors hover:text-osint-danger"
                            title="Delete Template"
                            aria-label={`Delete template ${template.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <h3 className="mb-2 osint-meta-value line-clamp-2">{template.name}</h3>
                    <p className="osint-body-small line-clamp-3">
                      {template.description || template.topic}
                    </p>
                  </div>

                  <div className="mt-auto px-4 pb-4 pt-0">
                    <button
                      onClick={() => onApply(template)}
                      className={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} w-full osint-meta-label-strong`}
                    >
                      <Play className="mr-2 h-3 w-3" />
                      {isStarter ? 'Launch Starter' : 'Launch Template'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`${SETTINGS_CARD_CLASS} osint-body-small`}>
              No templates match the current search.
            </div>
          )}
        </div>
      </Accordion>

      {showCreateModal ? <TemplateCreateModal onClose={() => setShowCreateModal(false)} /> : null}
    </div>
  );
};
