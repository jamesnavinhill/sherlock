import { useState } from 'react';

import { useWorkspaceStore } from '@/store/caseStore';
import { BUILTIN_SCOPES, getAllScopes, getScopeById } from '@/data/presets';
import type { AIProvider } from '@/config/aiModels';
import {
  DEFAULT_MODEL_ID,
  getCompactModelChoicesForProvider,
  getDefaultModelForProvider,
  getEffectiveModelCapabilities,
  getModelProvider,
  getProviderOptionById,
  getRuntimeReadyModelsForProvider,
  recordRecentModelSelection,
} from '@/config/aiModels';
import { loadSystemConfig } from '@/config/systemConfig';
import {
  getDomainPackForScope,
  getLabelProfileById,
  getPurposeProfileById,
  getStarterTemplates,
  getTaskSetupCopy,
  type StarterPromptTemplate,
} from '@/domain';
import type {
  CaseTemplate,
  GraphNodeSubtype,
  InvestigationRunConfig,
  InvestigationScope,
  ManualNode,
  SystemConfig,
} from '@/types';

import { createTemplateMetadata } from './taskSetupUtils';

export type TaskSetupConfigOverride = Partial<SystemConfig> & Partial<InvestigationRunConfig>;

interface UseTaskSetupStateInput {
  initialTopic: string;
  initialScopeId?: string;
  initialConfigOverride?: TaskSetupConfigOverride;
  initialDateRangeOverride?: { start?: string; end?: string };
  onStart: (
    topic: string,
    configOverride: TaskSetupConfigOverride,
    preseededEntities?: ManualNode[],
    scope?: InvestigationScope,
    dateRange?: { start?: string; end?: string }
  ) => void;
}

interface SeedEntity {
  id: string;
  name: string;
  type: GraphNodeSubtype;
}

export const useTaskSetupState = ({
  initialTopic,
  initialScopeId,
  initialConfigOverride,
  initialDateRangeOverride,
  onStart,
}: UseTaskSetupStateInput) => {
  const { templates, addTemplate, customScopes, defaultScopeId } = useWorkspaceStore();
  const storedConfig = loadSystemConfig();
  const allScopes = getAllScopes(customScopes);

  const [currentStep, setCurrentStep] = useState(0);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedScopeId, setSelectedScopeId] = useState(initialScopeId || defaultScopeId);
  const [dateRangeStart, setDateRangeStart] = useState(initialDateRangeOverride?.start || '');
  const [dateRangeEnd, setDateRangeEnd] = useState(initialDateRangeOverride?.end || '');
  const [topic, setTopic] = useState(initialTopic);
  const [angle, setAngle] = useState('');
  const [seedEntities, setSeedEntities] = useState<SeedEntity[]>([]);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<GraphNodeSubtype>('PERSON');
  const [prioritySources, setPrioritySources] = useState('');

  const selectedScope =
    getScopeById(selectedScopeId) ||
    allScopes.find((scope) => scope.id === selectedScopeId) ||
    BUILTIN_SCOPES[0];
  const selectedPack = getDomainPackForScope(selectedScope, customScopes);
  const supportedPurposes = selectedPack.supportedPurposeIds.map((purposeId) =>
    getPurposeProfileById(purposeId)
  );
  const [selectedPurposeId, setSelectedPurposeId] = useState(
    initialConfigOverride?.purposeId || selectedPack.defaultPurposeId
  );
  const resolvedPurposeId = supportedPurposes.some((purpose) => purpose.id === selectedPurposeId)
    ? selectedPurposeId
    : selectedPack.defaultPurposeId;
  const selectedPurpose = getPurposeProfileById(resolvedPurposeId);
  const selectedArtifactType = selectedPurpose.recommendedArtifactType;
  const labelProfile = getLabelProfileById(selectedPack.labelProfileId);
  const setupCopy = getTaskSetupCopy(selectedPack, selectedPurpose, labelProfile);
  const starterTemplates = getStarterTemplates(selectedPack, selectedPurpose);

  const [persona, setPersona] = useState<string>(() => {
    return (
      selectedScope?.defaultPersona || selectedScope?.personas[0]?.id || 'general-investigator'
    );
  });
  const defaultPersona =
    selectedScope.defaultPersona || selectedScope.personas[0]?.id || 'general-investigator';
  const effectivePersona = selectedScope.personas.some((candidate) => candidate.id === persona)
    ? persona
    : defaultPersona;
  const [depth, setDepth] = useState<'STANDARD' | 'DEEP'>(
    (initialConfigOverride?.searchDepth || storedConfig.searchDepth) === 'DEEP'
      ? 'DEEP'
      : 'STANDARD'
  );
  const [generationMode, setGenerationMode] = useState<'SINGLE_PASS' | 'STAGED'>(
    initialConfigOverride?.generationMode === 'SINGLE_PASS'
      ? 'SINGLE_PASS'
      : storedConfig.generationMode === 'SINGLE_PASS'
        ? 'SINGLE_PASS'
        : 'STAGED'
  );
  const [thinkingBudget, setThinkingBudget] = useState(
    typeof initialConfigOverride?.thinkingBudget === 'number'
      ? initialConfigOverride.thinkingBudget
      : (storedConfig.thinkingBudget ?? 0)
  );

  const initialModelId = initialConfigOverride?.modelId || storedConfig.modelId || DEFAULT_MODEL_ID;
  const initialProvider = (initialConfigOverride?.provider ||
    getModelProvider(initialModelId)) as AIProvider;
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(initialProvider);
  const [showOpenRouterBrowser, setShowOpenRouterBrowser] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    const providerModels =
      initialProvider === 'OPENROUTER'
        ? getCompactModelChoicesForProvider(initialProvider, initialModelId)
        : getRuntimeReadyModelsForProvider(initialProvider);
    return providerModels.some((model) => model.id === initialModelId) ||
      (initialProvider === 'OPENROUTER' && getModelProvider(initialModelId) === 'OPENROUTER')
      ? initialModelId
      : providerModels[0]?.id || getDefaultModelForProvider(initialProvider);
  });

  const selectableModels =
    selectedProvider === 'OPENROUTER'
      ? getCompactModelChoicesForProvider(selectedProvider, selectedModel)
      : getRuntimeReadyModelsForProvider(selectedProvider);
  const effectiveSelectedModel =
    selectedProvider === 'OPENROUTER'
      ? getModelProvider(selectedModel) === 'OPENROUTER'
        ? selectedModel
        : selectableModels[0]?.id || getDefaultModelForProvider(selectedProvider)
      : selectableModels.some((model) => model.id === selectedModel)
        ? selectedModel
        : selectableModels[0]?.id || getDefaultModelForProvider(selectedProvider);
  const selectedProviderMeta = getProviderOptionById(selectedProvider);
  const selectedModelCapabilities = getEffectiveModelCapabilities(effectiveSelectedModel);
  const supportsThinkingBudget = selectedModelCapabilities.supportsThinkingBudget;

  const steps = [
    { id: 0, label: 'Pack' },
    { id: 1, label: 'Target' },
    { id: 2, label: setupCopy.angleLabel },
    { id: 3, label: 'Entities' },
    { id: 4, label: 'Sources' },
    { id: 5, label: 'Config' },
  ];

  const applyTemplate = (template: CaseTemplate) => {
    const nextScopeId = template.scopeId || selectedScopeId;
    const nextScope =
      getScopeById(nextScopeId || '') ||
      allScopes.find((scope) => scope.id === nextScopeId) ||
      selectedScope;
    const nextPack = getDomainPackForScope(nextScope, customScopes);
    const nextPurposeId =
      template.config.purposeId || template.purposeId || nextPack.defaultPurposeId;
    const templateProvider = (template.config.provider ||
      getModelProvider(template.config.modelId || effectiveSelectedModel)) as AIProvider;

    setTopic(template.topic);
    setSelectedScopeId(nextScope.id);
    setSelectedPurposeId(nextPurposeId);
    setPersona(
      template.config.persona ||
        nextScope.defaultPersona ||
        nextScope.personas[0]?.id ||
        'general-investigator'
    );
    setDepth(template.config.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD');
    setGenerationMode(template.config.generationMode === 'SINGLE_PASS' ? 'SINGLE_PASS' : 'STAGED');
    setThinkingBudget(template.config.thinkingBudget ?? 0);
    setSelectedProvider(templateProvider);
    const templateProviderModels =
      templateProvider === 'OPENROUTER'
        ? getCompactModelChoicesForProvider(templateProvider, template.config.modelId)
        : getRuntimeReadyModelsForProvider(templateProvider);
    setSelectedModel(
      template.config.modelId ||
        templateProviderModels[0]?.id ||
        getDefaultModelForProvider(templateProvider)
    );
  };

  const applyStarter = (starter: StarterPromptTemplate) => {
    setSelectedPurposeId(starter.purposeId);
    setTopic(starter.topic);
    setAngle(starter.hypothesis || '');
    setPrioritySources(starter.prioritySources || '');
  };

  const handleAddEntity = () => {
    if (!newEntityName.trim()) return;

    setSeedEntities((current) => [
      ...current,
      {
        id: `seed-${Date.now()}`,
        name: newEntityName.trim(),
        type: newEntityType,
      },
    ]);
    setNewEntityName('');
    setNewEntityType('PERSON');
  };

  const handleRemoveEntity = (id: string) => {
    setSeedEntities((current) => current.filter((entity) => entity.id !== id));
  };

  const appendSuggestedSources = (entries: string[]) => {
    const current = prioritySources
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...current, ...entries]));
    setPrioritySources(merged.join(', '));
  };

  const handleProviderChange = (provider: AIProvider) => {
    const nextProviderModels =
      provider === 'OPENROUTER'
        ? getCompactModelChoicesForProvider(provider)
        : getRuntimeReadyModelsForProvider(provider);
    setSelectedProvider(provider);
    setSelectedModel(nextProviderModels[0]?.id || getDefaultModelForProvider(provider));
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    recordRecentModelSelection(modelId);
  };

  const handleStart = () => {
    const preseededEntities: ManualNode[] = seedEntities.map((entity) => ({
      id: entity.id,
      label: entity.name,
      type: 'ENTITY',
      subtype: entity.type,
      timestamp: Date.now(),
    }));

    let fullTopic = topic;
    if (angle.trim()) {
      fullTopic = `${topic}\n\n[RUN_ANGLE]: ${angle.trim()}`;
    }
    if (prioritySources.trim()) {
      fullTopic = `${fullTopic}\n\n[PRIORITY_SOURCES]: ${prioritySources.trim()}`;
    }

    const dateRange =
      dateRangeStart || dateRangeEnd
        ? { start: dateRangeStart || undefined, end: dateRangeEnd || undefined }
        : undefined;

    onStart(
      fullTopic,
      {
        provider: selectedProvider,
        persona: effectivePersona,
        searchDepth: depth,
        generationMode,
        thinkingBudget: supportsThinkingBudget ? thinkingBudget : 0,
        modelId: effectiveSelectedModel,
        scopeId: selectedScope.id,
        scopeName: selectedScope.name,
        packId: selectedPack.id,
        packName: selectedPack.name,
        purposeId: selectedPurpose.id,
        purposeName: selectedPurpose.name,
        artifactType: selectedArtifactType,
        labelProfileId: labelProfile.id,
      },
      preseededEntities.length > 0 ? preseededEntities : undefined,
      selectedScope,
      dateRange
    );
    recordRecentModelSelection(effectiveSelectedModel);

    if (saveAsTemplate && templateName.trim()) {
      const templateMetadata = createTemplateMetadata();
      void addTemplate({
        id: templateMetadata.id,
        name: templateName.trim(),
        topic,
        config: {
          provider: selectedProvider,
          persona: effectivePersona,
          searchDepth: depth,
          generationMode,
          thinkingBudget: supportsThinkingBudget ? thinkingBudget : 0,
          modelId: effectiveSelectedModel,
          packId: selectedPack.id,
          purposeId: selectedPurpose.id,
          artifactType: selectedArtifactType,
          labelProfileId: labelProfile.id,
        },
        scopeId: selectedScope.id,
        createdAt: templateMetadata.createdAt,
      });
    }
  };

  const canProceed = () => {
    if (currentStep === 0) return !!selectedScopeId && !!resolvedPurposeId;
    if (currentStep === 1) return topic.trim().length > 0;
    return true;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep((step) => step + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };

  return {
    allScopes,
    angle,
    appendSuggestedSources,
    applyStarter,
    applyTemplate,
    canProceed,
    currentStep,
    dateRangeEnd,
    dateRangeStart,
    depth,
    effectivePersona,
    effectiveSelectedModel,
    generationMode,
    handleAddEntity,
    handleModelChange,
    handleProviderChange,
    handleRemoveEntity,
    handleStart,
    labelProfile,
    newEntityName,
    newEntityType,
    nextStep,
    persona,
    prevStep,
    prioritySources,
    resolvedPurposeId,
    saveAsTemplate,
    seedEntities,
    selectedArtifactType,
    selectedModel,
    selectedModelCapabilities,
    selectedPack,
    selectedProvider,
    selectedProviderMeta,
    selectedPurpose,
    selectedPurposeId,
    selectedScope,
    selectedScopeId,
    selectableModels,
    setAngle,
    setCurrentStep,
    setDateRangeEnd,
    setDateRangeStart,
    setDepth,
    setGenerationMode,
    setNewEntityName,
    setNewEntityType,
    setPersona,
    setPrioritySources,
    setSaveAsTemplate,
    setSelectedModel,
    setSelectedPurposeId,
    setSelectedScopeId,
    setShowOpenRouterBrowser,
    setTemplateName,
    setThinkingBudget,
    setTopic,
    setupCopy,
    showOpenRouterBrowser,
    starterTemplates,
    steps,
    supportedPurposes,
    supportsThinkingBudget,
    templateName,
    templates,
    thinkingBudget,
    topic,
  };
};
