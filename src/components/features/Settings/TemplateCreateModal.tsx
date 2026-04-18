import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Compass, Cpu, Layout, Lightbulb, Target, X } from 'lucide-react';

import { DEFAULT_MODEL_ID } from '../../../config/aiModels';
import { loadSystemConfig } from '../../../config/systemConfig';
import { BUILTIN_SCOPES, getAllScopes } from '../../../data/presets';
import { getDomainPackForScope, getPurposeProfileById } from '../../../domain';
import { createLocalId } from '../../../utils/id';
import { useTemplateGalleryFeatureState } from '@/store/selectors/settingsSelectors';
import { ProviderModelSelector } from '../Runs/ProviderModelSelector';
import { RuntimeConfigBehaviorControls } from '../Runs/RuntimeConfigBehaviorControls';
import { RuntimeConfigSummary } from '../Runs/RuntimeConfigSummary';
import { buildTemplateRuntimeConfig } from '../Runs/runtimeConfigMapping';
import { createRuntimeConfigFormInput } from '../Runs/runtimeConfigState';
import { useRuntimeConfigForm } from '../Runs/useRuntimeConfigForm';
import {
  SETTINGS_BUTTON_ICON_SM_CLASS,
  SETTINGS_BUTTON_MD_CLASS,
  SETTINGS_CARD_SECTION_ACTIVE_CLASS,
  SETTINGS_CARD_SECTION_INTERACTIVE_CLASS,
  SETTINGS_CARD_SECTION_SUBTLE_CLASS,
  SETTINGS_INPUT_CLASS,
  SETTINGS_MODAL_ACTION_ROW_CLASS,
  SETTINGS_MODAL_HEADER_CLASS,
  SETTINGS_MODAL_PANEL_CLASS,
  SETTINGS_SURFACE_BUTTON_CLASS,
  SETTINGS_TEXTAREA_CLASS,
} from './settingsUtils';

interface TemplateCreateModalProps {
  onClose: () => void;
}

const CREATE_STEPS = [
  { id: 0, label: 'Protocol', icon: Layout },
  { id: 1, label: 'Scope', icon: Compass },
  { id: 2, label: 'Target', icon: Target },
  { id: 3, label: 'Config', icon: Cpu },
];

export const TemplateCreateModal: React.FC<TemplateCreateModalProps> = ({ onClose }) => {
  const { addTemplate, customScopes, defaultScopeId, addToast } = useTemplateGalleryFeatureState();
  const [createStep, setCreateStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedScopeId, setSelectedScopeId] = useState('');
  const [topic, setTopic] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [persona, setPersona] = useState('');
  const [selectedPurposeId, setSelectedPurposeId] = useState('');
  const hasInitializedRef = React.useRef(false);
  const runtimeConfigForm = useRuntimeConfigForm({
    initialValue: createRuntimeConfigFormInput(loadSystemConfig()),
  });

  const allScopes = useMemo(() => getAllScopes(customScopes), [customScopes]);
  const resolvedDefaultScopeId =
    allScopes.find((scope) => scope.id === defaultScopeId)?.id ||
    allScopes[0]?.id ||
    'open-investigation';
  const selectedScope =
    allScopes.find((scope) => scope.id === selectedScopeId) || allScopes[0] || BUILTIN_SCOPES[0];
  const selectedPack = useMemo(
    () => getDomainPackForScope(selectedScope, customScopes),
    [selectedScope, customScopes]
  );
  const supportedPurposes = useMemo(
    () => selectedPack.supportedPurposeIds.map((purposeId) => getPurposeProfileById(purposeId)),
    [selectedPack]
  );
  const selectedPurpose = useMemo(
    () => getPurposeProfileById(selectedPurposeId || selectedPack.defaultPurposeId),
    [selectedPack, selectedPurposeId]
  );

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const defaultScope =
      allScopes.find((scope) => scope.id === resolvedDefaultScopeId) || allScopes[0];
    const defaultPersona =
      defaultScope?.defaultPersona || defaultScope?.personas[0]?.id || 'general-investigator';
    const parsed = loadSystemConfig();
    const nextPersona =
      parsed.persona && defaultScope?.personas.some((item) => item.id === parsed.persona)
        ? parsed.persona
        : defaultPersona;

    setSelectedScopeId(defaultScope?.id || resolvedDefaultScopeId);
    setSelectedPurposeId(
      getDomainPackForScope(defaultScope || allScopes[0], customScopes).defaultPurposeId
    );
    runtimeConfigForm.reset(createRuntimeConfigFormInput(parsed));
    setPersona(nextPersona);
  }, [allScopes, customScopes, resolvedDefaultScopeId, runtimeConfigForm]);

  useEffect(() => {
    if (!selectedScope) return;
    const defaultPersona =
      selectedScope.defaultPersona || selectedScope.personas[0]?.id || 'general-investigator';
    setPersona((current) => {
      if (selectedScope.personas.some((candidate) => candidate.id === current)) return current;
      return defaultPersona;
    });
  }, [selectedScope]);

  useEffect(() => {
    if (supportedPurposes.some((purpose) => purpose.id === selectedPurposeId)) return;
    setSelectedPurposeId(selectedPack.defaultPurposeId);
  }, [selectedPack, selectedPurposeId, supportedPurposes]);

  const closeCreateModal = () => {
    if (isCreating) return;
    onClose();
  };

  const canProceed = () => {
    if (createStep === 0) return templateName.trim().length > 0;
    if (createStep === 1) return !!selectedScope;
    if (createStep === 2) return topic.trim().length > 0;
    return true;
  };

  const handleCreateTemplate = async () => {
    if (!selectedScope || !templateName.trim() || !topic.trim()) return;
    setIsCreating(true);

    try {
      const combinedTopic = hypothesis.trim()
        ? `${topic.trim()}\n\n[HYPOTHESIS]: ${hypothesis.trim()}`
        : topic.trim();
      const baseConfig = loadSystemConfig();

      await addTemplate({
        id: createLocalId('tpl'),
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        topic: combinedTopic,
        config: buildTemplateRuntimeConfig({
          baseConfig,
          configOverride: {
            provider: runtimeConfigForm.effectiveValue.provider,
            modelId: runtimeConfigForm.effectiveValue.modelId || baseConfig.modelId || DEFAULT_MODEL_ID,
            persona,
            searchDepth: runtimeConfigForm.effectiveValue.searchDepth,
            generationMode: runtimeConfigForm.effectiveValue.generationMode,
            thinkingBudget: runtimeConfigForm.effectiveValue.thinkingBudget,
          },
          customScopes,
          scope: selectedScope,
          purposeId: selectedPurpose.id,
          artifactType: selectedPurpose.recommendedArtifactType,
        }),
        scopeId: selectedScope.id,
        packId: selectedPack.id,
        purposeId: selectedPurpose.id,
        artifactType: selectedPurpose.recommendedArtifactType,
        labelProfileId: selectedPack.labelProfileId,
        createdAt: Date.now(),
      });
      addToast('Template created successfully', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to create template', error);
      addToast('Failed to create template', 'ERROR');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`${SETTINGS_MODAL_PANEL_CLASS} w-full max-w-4xl flex flex-col max-h-[88vh] overflow-hidden`}
      >
        <div className={`${SETTINGS_MODAL_HEADER_CLASS} px-6 py-4`}>
          <div>
            <h3 className="osint-panel-title">Create Protocol Template</h3>
            <p className="osint-body-quiet mt-1">Reusable pack and purpose-aware launch setup</p>
          </div>
          <button
            onClick={closeCreateModal}
            className={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_ICON_SM_CLASS}`}
            aria-label="Close create template modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} rounded-none border-x-0 px-6 py-4 flex items-center gap-2 overflow-x-auto`}
        >
          {CREATE_STEPS.map((step) => {
            const isActive = createStep === step.id;
            const isDone = createStep > step.id;
            return (
              <div
                key={step.id}
                className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} flex items-center whitespace-nowrap px-3 py-2 osint-meta-label ${
                  isActive
                    ? 'border-osint-primary/40 bg-[var(--osint-rail-interaction-active-bg)] text-osint-primary shadow-[var(--osint-rail-interaction-shadow)]'
                    : isDone
                      ? 'text-zinc-300'
                      : 'text-zinc-500'
                }`}
              >
                {isDone ? (
                  <Check className="w-3 h-3 mr-2" />
                ) : (
                  <step.icon className="w-3 h-3 mr-2" />
                )}
                {step.label}
              </div>
            );
          })}
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {createStep === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block osint-meta-label mb-2">Protocol Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                  placeholder="e.g., Corporate Fraud Deep-Dive"
                  className={SETTINGS_INPUT_CLASS}
                  autoFocus
                />
              </div>
              <div>
                <label className="block osint-meta-label mb-2">Description (Optional)</label>
                <textarea
                  value={templateDescription}
                  onChange={(event) => setTemplateDescription(event.target.value)}
                  placeholder="Describe when and why this protocol should be used."
                  className={`${SETTINGS_TEXTAREA_CLASS} h-28`}
                />
              </div>
            </div>
          )}

          {createStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block osint-meta-label mb-2">Domain Pack</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {allScopes.map((scope) => (
                    <button
                      key={scope.id}
                      onClick={() => setSelectedScopeId(scope.id)}
                      className={`${SETTINGS_CARD_SECTION_INTERACTIVE_CLASS} p-3 text-left ${
                        selectedScopeId === scope.id
                          ? SETTINGS_CARD_SECTION_ACTIVE_CLASS
                          : 'text-zinc-400'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{scope.icon || '*'}</span>
                        <div className="min-w-0">
                          <div className="osint-meta-value truncate">{scope.name}</div>
                          <div className="osint-body-quiet mt-0.5 line-clamp-2">
                            {scope.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <label className="block osint-meta-label mb-2">Purpose</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {supportedPurposes.map((purpose) => (
                    <button
                      key={purpose.id}
                      onClick={() => setSelectedPurposeId(purpose.id)}
                      className={`${SETTINGS_CARD_SECTION_INTERACTIVE_CLASS} p-3 text-left ${
                        selectedPurpose.id === purpose.id
                          ? SETTINGS_CARD_SECTION_ACTIVE_CLASS
                          : 'text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="osint-meta-value truncate">{purpose.name}</div>
                        <div className="osint-meta-label">{purpose.recommendedArtifactType}</div>
                      </div>
                      <div className="osint-body-quiet line-clamp-2">{purpose.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {createStep === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block osint-meta-label mb-2">Launch Target</label>
                <textarea
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Enter the question, subject, or topic this template should launch with..."
                  className={`${SETTINGS_TEXTAREA_CLASS} h-32`}
                />
              </div>
              <div>
                <label className="block osint-meta-label mb-2 flex items-center">
                  <Lightbulb className="w-3 h-3 mr-2" />
                  Run Angle (Optional)
                </label>
                <textarea
                  value={hypothesis}
                  onChange={(event) => setHypothesis(event.target.value)}
                  placeholder="Capture the default lens, hypothesis, or comparison this template should carry."
                  className={`${SETTINGS_TEXTAREA_CLASS} h-24`}
                />
              </div>
            </div>
          )}

          {createStep === 3 && (
            <div className="space-y-5">
              <ProviderModelSelector
                form={runtimeConfigForm}
                browseButtonClassName={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-meta-label-strong`}
                modelBrowserActionButtonClassName={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-meta-label-strong`}
                modelBrowserCloseButtonClassName={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_ICON_SM_CLASS}`}
              />
              <div>
                <label className="block osint-meta-label mb-2">Persona</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(selectedScope?.personas || []).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setPersona(item.id)}
                      className={`${SETTINGS_CARD_SECTION_INTERACTIVE_CLASS} p-3 text-left ${
                        persona === item.id ? SETTINGS_CARD_SECTION_ACTIVE_CLASS : 'text-zinc-400'
                      }`}
                    >
                      <div className="osint-meta-value">{item.label}</div>
                      <div className="osint-body-quiet mt-1 line-clamp-2">{item.instruction}</div>
                    </button>
                  ))}
                </div>
              </div>
              <RuntimeConfigSummary
                packName={selectedPack.name}
                purposeName={selectedPurpose.name}
                artifactType={selectedPurpose.recommendedArtifactType}
                hint="Templates save the same runtime profile used by manual and guided launches."
              />
              <RuntimeConfigBehaviorControls
                form={runtimeConfigForm}
                optionButtonClassName={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-meta-label-strong`}
              />
            </div>
          )}
        </div>

        <div className={`${SETTINGS_MODAL_ACTION_ROW_CLASS} px-6 py-4`}>
          <div className="osint-meta-label">
            Step {createStep + 1} of {CREATE_STEPS.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={closeCreateModal}
              className={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-meta-label`}
            >
              Cancel
            </button>
            {createStep > 0 && (
              <button
                onClick={() => setCreateStep((current) => Math.max(0, current - 1))}
                className={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-meta-label`}
              >
                <ChevronLeft className="w-3 h-3 mr-1" />
                Back
              </button>
            )}
            {createStep < CREATE_STEPS.length - 1 ? (
              <button
                onClick={() => {
                  if (canProceed()) {
                    setCreateStep((current) => Math.min(CREATE_STEPS.length - 1, current + 1));
                  }
                }}
                disabled={!canProceed()}
                className={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-meta-label-strong disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Next
                <ChevronRight className="w-3 h-3 ml-1" />
              </button>
            ) : (
              <button
                onClick={() => {
                  void handleCreateTemplate();
                }}
                disabled={!canProceed() || isCreating}
                className={`${SETTINGS_SURFACE_BUTTON_CLASS} ${SETTINGS_BUTTON_MD_CLASS} osint-meta-label-strong disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {isCreating ? 'Creating...' : 'Create Template'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
