import { useState } from 'react';

import { useTaskSetupFeatureState } from '@/store/selectors/featureSelectors';
import { BUILTIN_SCOPES, getAllScopes, getScopeById } from '@/data/presets';
import type { AIProvider } from '@/config/aiModels';
import {
  DEFAULT_MODEL_ID,
  getModelProvider,
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
import { getFallbackRuntimeModel } from './runtimeConfigOptions';
import { useRuntimeConfigForm } from './useRuntimeConfigForm';

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
  const { templates, addTemplate, customScopes, defaultScopeId } = useTaskSetupFeatureState();
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
  const initialModelId = initialConfigOverride?.modelId || storedConfig.modelId || DEFAULT_MODEL_ID;
  const initialProvider = (initialConfigOverride?.provider ||
    getModelProvider(initialModelId)) as AIProvider;
  const runtimeConfigForm = useRuntimeConfigForm({
    initialValue: {
      provider: initialProvider,
      modelId: initialModelId,
      searchDepth:
        (initialConfigOverride?.searchDepth || storedConfig.searchDepth) === 'DEEP'
          ? 'DEEP'
          : 'STANDARD',
      generationMode:
        initialConfigOverride?.generationMode === 'SINGLE_PASS'
          ? 'SINGLE_PASS'
          : storedConfig.generationMode === 'SINGLE_PASS'
            ? 'SINGLE_PASS'
            : 'STAGED',
      thinkingBudget:
        typeof initialConfigOverride?.thinkingBudget === 'number'
          ? initialConfigOverride.thinkingBudget
          : (storedConfig.thinkingBudget ?? 0),
    },
  });

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
      getModelProvider(template.config.modelId || runtimeConfigForm.activeModelId)) as AIProvider;

    setTopic(template.topic);
    setSelectedScopeId(nextScope.id);
    setSelectedPurposeId(nextPurposeId);
    setPersona(
      template.config.persona ||
        nextScope.defaultPersona ||
        nextScope.personas[0]?.id ||
        'general-investigator'
    );
    runtimeConfigForm.reset({
      provider: templateProvider,
      modelId: template.config.modelId || getFallbackRuntimeModel(templateProvider),
      searchDepth: template.config.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD',
      generationMode: template.config.generationMode === 'SINGLE_PASS' ? 'SINGLE_PASS' : 'STAGED',
      thinkingBudget: template.config.thinkingBudget ?? 0,
    });
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
        provider: runtimeConfigForm.effectiveValue.provider,
        persona: effectivePersona,
        searchDepth: runtimeConfigForm.effectiveValue.searchDepth,
        generationMode: runtimeConfigForm.effectiveValue.generationMode,
        thinkingBudget: runtimeConfigForm.effectiveValue.thinkingBudget,
        modelId: runtimeConfigForm.effectiveValue.modelId,
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

    if (saveAsTemplate && templateName.trim()) {
      const templateMetadata = createTemplateMetadata();
      void addTemplate({
        id: templateMetadata.id,
        name: templateName.trim(),
        topic,
        config: {
          provider: runtimeConfigForm.effectiveValue.provider,
          persona: effectivePersona,
          searchDepth: runtimeConfigForm.effectiveValue.searchDepth,
          generationMode: runtimeConfigForm.effectiveValue.generationMode,
          thinkingBudget: runtimeConfigForm.effectiveValue.thinkingBudget,
          modelId: runtimeConfigForm.effectiveValue.modelId,
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
    effectivePersona,
    handleAddEntity,
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
    runtimeConfigForm,
    saveAsTemplate,
    seedEntities,
    selectedArtifactType,
    selectedPack,
    selectedPurpose,
    selectedPurposeId,
    selectedScope,
    selectedScopeId,
    setAngle,
    setCurrentStep,
    setDateRangeEnd,
    setDateRangeStart,
    setNewEntityName,
    setNewEntityType,
    setPersona,
    setPrioritySources,
    setSaveAsTemplate,
    setSelectedPurposeId,
    setSelectedScopeId,
    setTemplateName,
    setTopic,
    setupCopy,
    starterTemplates,
    steps,
    supportedPurposes,
    templateName,
    templates,
    topic,
  };
};
