import React, { useState } from 'react';
import {
  Target,
  Lightbulb,
  User,
  Globe,
  UserCog,
  Microscope,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  X,
  AlignLeft,
  Building2,
  Plus,
  Trash2,
  Check,
  Layout,
  Compass,
  Calendar,
  Cpu,
  Sparkles,
  Shapes,
  Library,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/caseStore';
import { OsintSelect } from './OsintSelect';
import type {
  CaseTemplate,
  GraphNodeSubtype,
  InvestigationRunConfig,
  InvestigationScope,
  ManualNode,
  SystemConfig,
} from '../../types';
import { BUILTIN_SCOPES, getAllScopes, getScopeById } from '../../data/presets';
import type { AIProvider } from '../../config/aiModels';
import {
  AI_PROVIDERS,
  DEFAULT_MODEL_ID,
  getDefaultModelForProvider,
  getModelProvider,
  getProviderOptionById,
  getRuntimeReadyModelsForProvider,
} from '../../config/aiModels';
import { loadSystemConfig } from '../../config/systemConfig';
import {
  getDomainPackForScope,
  getLabelProfileById,
  getPurposeProfileById,
  getStarterTemplates,
  getTaskSetupCopy,
} from '../../domain';
import { getEntityToneClass } from '../../utils/entityPalette';

type TaskSetupConfigOverride = Partial<SystemConfig> & Partial<InvestigationRunConfig>;

interface TaskSetupModalProps {
  initialTopic: string;
  initialContext?: { topic: string; summary: string };
  initialScopeId?: string;
  initialConfigOverride?: TaskSetupConfigOverride;
  initialDateRangeOverride?: { start?: string; end?: string };
  inheritanceHint?: string;
  onCancel: () => void;
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

const createTemplateMetadata = () => {
  const createdAt = Date.now();
  return {
    id: `tmp-${createdAt}`,
    createdAt,
  };
};

export const TaskSetupModal: React.FC<TaskSetupModalProps> = ({
  initialTopic,
  initialContext,
  initialScopeId,
  initialConfigOverride,
  initialDateRangeOverride,
  inheritanceHint,
  onCancel,
  onStart,
}) => {
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
    return selectedScope?.defaultPersona || selectedScope?.personas[0]?.id || 'general-investigator';
  });
  const defaultPersona =
    selectedScope.defaultPersona || selectedScope.personas[0]?.id || 'general-investigator';
  const effectivePersona = selectedScope.personas.some((candidate) => candidate.id === persona)
    ? persona
    : defaultPersona;
  const [depth, setDepth] = useState<'STANDARD' | 'DEEP'>(
    (initialConfigOverride?.searchDepth || storedConfig.searchDepth) === 'DEEP' ? 'DEEP' : 'STANDARD'
  );
  const [thinkingBudget, setThinkingBudget] = useState(
    typeof initialConfigOverride?.thinkingBudget === 'number'
      ? initialConfigOverride.thinkingBudget
      : storedConfig.thinkingBudget ?? 0
  );

  const initialModelId = initialConfigOverride?.modelId || storedConfig.modelId || DEFAULT_MODEL_ID;
  const initialProvider = (
    initialConfigOverride?.provider || getModelProvider(initialModelId)
  ) as AIProvider;
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(initialProvider);
  const [selectedModel, setSelectedModel] = useState(() => {
    const providerModels = getRuntimeReadyModelsForProvider(initialProvider);
    return providerModels.some((model) => model.id === initialModelId)
      ? initialModelId
      : providerModels[0]?.id || getDefaultModelForProvider(initialProvider);
  });

  const selectableModels = getRuntimeReadyModelsForProvider(selectedProvider);
  const effectiveSelectedModel = selectableModels.some((model) => model.id === selectedModel)
    ? selectedModel
    : selectableModels[0]?.id || getDefaultModelForProvider(selectedProvider);
  const selectedProviderMeta = getProviderOptionById(selectedProvider);
  const supportsThinkingBudget = selectedProviderMeta?.capabilities.supportsThinkingBudget ?? false;

  const steps = [
    { id: 0, label: 'Pack', icon: Compass },
    { id: 1, label: 'Target', icon: Target },
    { id: 2, label: setupCopy.angleLabel, icon: Lightbulb },
    { id: 3, label: 'Entities', icon: Shapes },
    { id: 4, label: 'Sources', icon: Globe },
    { id: 5, label: 'Config', icon: UserCog },
  ];

  const applyTemplate = (template: CaseTemplate) => {
    const nextScopeId = template.scopeId || selectedScopeId;
    const nextScope =
      getScopeById(nextScopeId || '')
      || allScopes.find((scope) => scope.id === nextScopeId)
      || selectedScope;
    const nextPack = getDomainPackForScope(nextScope, customScopes);
    const nextPurposeId =
      template.config.purposeId || template.purposeId || nextPack.defaultPurposeId;
    const templateProvider = (
      template.config.provider || getModelProvider(template.config.modelId || effectiveSelectedModel)
    ) as AIProvider;

    setTopic(template.topic);
    setSelectedScopeId(nextScope.id);
    setSelectedPurposeId(nextPurposeId);
    setPersona(
      template.config.persona
      || nextScope.defaultPersona
      || nextScope.personas[0]?.id
      || 'general-investigator'
    );
    setDepth(template.config.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD');
    setThinkingBudget(template.config.thinkingBudget ?? 0);
    setSelectedProvider(templateProvider);
    setSelectedModel(
      template.config.modelId
      || getRuntimeReadyModelsForProvider(templateProvider)[0]?.id
      || getDefaultModelForProvider(templateProvider)
    );
  };

  const applyStarter = (starter: (typeof starterTemplates)[number]) => {
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
        provider: selectedProvider,
        persona: effectivePersona,
        searchDepth: depth,
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

  const renderStep0 = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-mono text-zinc-400 uppercase mb-3 flex items-center">
          <Compass className="w-3 h-3 mr-2" />
          Domain Pack
        </label>
        <p className="text-xs text-zinc-600 mb-3 font-mono">{setupCopy.scopeDescription}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pr-1">
          {allScopes.map((scope) => (
            <button
              key={scope.id}
              onClick={() => setSelectedScopeId(scope.id)}
              className={`flex items-start p-3 border text-left transition-all ${
                selectedScopeId === scope.id
                  ? 'border-osint-primary bg-osint-primary/10 text-white'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              <span className="text-lg mr-2 flex-shrink-0">{scope.icon || '🔍'}</span>
              <div className="min-w-0">
                <div className="text-xs font-mono font-bold truncate">{scope.name}</div>
                <div className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5">
                  {scope.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-800">
        <div>
          <label className="block text-xs font-mono text-zinc-400 uppercase mb-3 flex items-center">
            <Sparkles className="w-3 h-3 mr-2" />
            {setupCopy.purposeLabel}
          </label>
          <p className="text-xs text-zinc-600 mb-3 font-mono">{setupCopy.purposeDescription}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {supportedPurposes.map((purpose) => (
              <button
                key={purpose.id}
                onClick={() => setSelectedPurposeId(purpose.id)}
                className={`p-3 border text-left transition-all ${
                  resolvedPurposeId === purpose.id
                    ? 'border-osint-primary bg-osint-primary/10 text-white'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-xs font-mono font-bold uppercase">{purpose.name}</div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">
                    {purpose.recommendedArtifactType}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed text-zinc-500">{purpose.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-800">
        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
          <Calendar className="w-3 h-3 mr-2" />
          Temporal Scope (Optional)
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[10px] text-zinc-500 mb-1 font-mono">FROM</label>
            <input
              type="date"
              value={dateRangeStart}
              onChange={(event) => setDateRangeStart(event.target.value)}
              className="w-full bg-black border border-zinc-700 text-zinc-300 p-2 font-mono text-xs focus:border-osint-primary outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-zinc-500 mb-1 font-mono">TO</label>
            <input
              type="date"
              value={dateRangeEnd}
              onChange={(event) => setDateRangeEnd(event.target.value)}
              className="w-full bg-black border border-zinc-700 text-zinc-300 p-2 font-mono text-xs focus:border-osint-primary outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
          <AlignLeft className="w-3 h-3 mr-2" />
          {setupCopy.targetLabel}
        </label>
        <textarea
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder={setupCopy.targetPlaceholder}
          className="w-full h-32 bg-black border border-zinc-700 text-white p-3 font-mono text-sm focus:border-osint-primary outline-none resize-none placeholder-zinc-600"
          autoFocus
        />
      </div>

      <div className="space-y-3 border-t border-zinc-900 pt-4">
        <label className="block text-[10px] font-mono text-zinc-500 uppercase flex items-center">
          <Sparkles className="w-3 h-3 mr-2 text-osint-primary" />
          Pack Starters
        </label>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {starterTemplates.slice(0, 4).map((template) => (
            <button
              key={template.id}
              onClick={() => applyStarter(template)}
              className="p-3 text-left border border-zinc-800 bg-zinc-900/40 hover:border-osint-primary transition-all"
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-xs font-mono font-bold text-white uppercase">{template.name}</span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">{template.purposeId}</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {templates.length > 0 && (
        <div className="space-y-3 border-t border-zinc-900 pt-4">
          <label className="block text-[10px] font-mono text-zinc-500 uppercase flex items-center">
            <Layout className="w-3 h-3 mr-2" />
            Saved Templates
          </label>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {templates.slice(0, 4).map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="flex items-center p-2 bg-zinc-900 border border-zinc-800 hover:border-osint-primary text-zinc-400 hover:text-white transition-all text-[10px] font-mono uppercase truncate"
              >
                <Layout className="w-3 h-3 mr-2" />
                <span className="truncate">{template.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
          <Lightbulb className="w-3 h-3 mr-2" />
          {setupCopy.angleLabel} (Optional)
        </label>
        <p className="text-xs text-zinc-600 mb-3 font-mono">{setupCopy.angleDescription}</p>
        <textarea
          value={angle}
          onChange={(event) => setAngle(event.target.value)}
          placeholder={setupCopy.anglePlaceholder}
          className="w-full h-28 bg-black border border-zinc-700 text-white p-3 font-mono text-sm focus:border-osint-primary outline-none resize-none placeholder-zinc-600"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
          <User className="w-3 h-3 mr-2" />
          {setupCopy.entityLabel} (Optional)
        </label>
        <p className="text-xs text-zinc-600 mb-3 font-mono">{setupCopy.entityDescription}</p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newEntityName}
            onChange={(event) => setNewEntityName(event.target.value)}
            placeholder="Name..."
            className="flex-1 bg-black border border-zinc-700 text-white p-2 font-mono text-xs focus:border-osint-primary outline-none placeholder-zinc-600"
            onKeyDown={(event) => event.key === 'Enter' && handleAddEntity()}
          />
          <div className="w-40">
            <OsintSelect
              ariaLabel="Seed entity type"
              value={newEntityType}
              onChange={(value) => setNewEntityType(value as GraphNodeSubtype)}
              triggerClassName="p-2 pr-8 font-mono text-xs"
              options={[
                { value: 'PERSON', label: 'Person' },
                { value: 'ORGANIZATION', label: 'Organization' },
                { value: 'CONCEPT', label: 'Concept' },
                { value: 'SOURCE', label: 'Source' },
                { value: 'UNKNOWN', label: 'Unknown' },
              ]}
            />
          </div>
          <button
            onClick={handleAddEntity}
            disabled={!newEntityName.trim()}
            className="osint-button-primary px-3 py-2 font-mono text-xs font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
          {seedEntities.map((entity) => (
            <div
              key={entity.id}
              className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-2"
            >
              <div className="flex items-center space-x-2 min-w-0">
                {entity.type === 'PERSON' ? (
                  <User className={`w-3 h-3 flex-shrink-0 ${getEntityToneClass(entity.type)} entity-tone-text`} />
                ) : entity.type === 'ORGANIZATION' ? (
                  <Building2 className={`w-3 h-3 flex-shrink-0 ${getEntityToneClass(entity.type)} entity-tone-text`} />
                ) : entity.type === 'SOURCE' ? (
                  <Library className={`w-3 h-3 flex-shrink-0 ${getEntityToneClass(entity.type)} entity-tone-text`} />
                ) : (
                  <Shapes className={`w-3 h-3 flex-shrink-0 ${getEntityToneClass(entity.type)} entity-tone-text`} />
                )}
                <span className="text-sm text-zinc-300 font-mono truncate">{entity.name}</span>
                <span className="text-[10px] text-zinc-600 uppercase">{entity.type}</span>
              </div>
              <button
                onClick={() => handleRemoveEntity(entity.id)}
                className="text-zinc-600 osint-danger-inline"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {seedEntities.length === 0 && (
            <p className="text-xs text-zinc-600 font-mono italic">No seeded nodes added yet.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
          <Globe className="w-3 h-3 mr-2" />
          {setupCopy.sourceLabel} (Optional)
        </label>
        <p className="text-xs text-zinc-600 mb-3 font-mono">{setupCopy.sourceDescription}</p>
        <textarea
          value={prioritySources}
          onChange={(event) => setPrioritySources(event.target.value)}
          placeholder={setupCopy.sourcePlaceholder}
          className="w-full h-24 bg-black border border-zinc-700 text-white p-3 font-mono text-sm focus:border-osint-primary outline-none resize-none placeholder-zinc-600"
        />
      </div>

      {selectedScope.suggestedSources.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-zinc-800">
          <label className="block text-[10px] font-mono text-zinc-500 uppercase">
            Suggested Source Libraries
          </label>
          <div className="space-y-3">
            {selectedScope.suggestedSources.slice(0, 4).map((category) => (
              <div key={category.name}>
                <div className="text-[10px] font-mono text-zinc-500 uppercase mb-2">
                  {category.name}
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.sources.slice(0, 5).map((source) => (
                    <button
                      key={source.label}
                      onClick={() => appendSuggestedSources([source.label])}
                      className="px-2 py-1 border border-zinc-800 bg-zinc-900/50 text-[10px] font-mono text-zinc-400 hover:text-white hover:border-osint-primary transition-colors"
                    >
                      {source.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 border border-zinc-700 text-[10px] font-mono uppercase text-white">
            {selectedPack.name}
          </span>
          <span className="px-2 py-1 border border-zinc-700 text-[10px] font-mono uppercase text-zinc-300">
            {selectedPurpose.name}
          </span>
          <span className="px-2 py-1 border border-zinc-700 text-[10px] font-mono uppercase text-zinc-300">
            {selectedArtifactType}
          </span>
        </div>
        <p className="text-[10px] text-zinc-500 font-mono uppercase">
          {inheritanceHint || setupCopy.configHint}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 auto-rows-fr">
        <section className="border border-zinc-800 bg-zinc-900/30 p-4 h-full flex flex-col">
          <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
            <UserCog className="w-3 h-3 mr-2" />
            Agent Persona
          </label>
          <p className="text-[10px] text-zinc-600 mb-3 font-mono">
            Personas tailored for {selectedScope?.name || 'this pack'}
          </p>
          <OsintSelect
            ariaLabel="Agent persona"
            value={effectivePersona}
            onChange={setPersona}
            triggerClassName="mt-auto p-2 pr-8 font-mono text-xs"
            options={(selectedScope?.personas || []).map((item) => ({
              value: item.id,
              label: item.label,
            }))}
          />
        </section>

        <section className="border border-zinc-800 bg-zinc-900/30 p-4 h-full flex flex-col">
          <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
            <Cpu className="w-3 h-3 mr-2" />
            Provider
          </label>
          <p className="text-[10px] text-zinc-600 mb-3 font-mono">
            Choose the AI backend for this run.
          </p>
          <OsintSelect
            ariaLabel="Provider"
            value={selectedProvider}
            onChange={(value) => {
              const provider = value as AIProvider;
              setSelectedProvider(provider);
              setSelectedModel(
                getRuntimeReadyModelsForProvider(provider)[0]?.id
                || getDefaultModelForProvider(provider)
              );
            }}
            triggerClassName="mt-auto p-2 pr-8 font-mono text-xs"
            options={AI_PROVIDERS
              .filter((provider) => provider.capabilities.runtimeStatus === 'ACTIVE')
              .map((provider) => ({
                value: provider.id,
                label: provider.label,
              }))}
          />
        </section>

        <section className="border border-zinc-800 bg-zinc-900/30 p-4 h-full flex flex-col">
          <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
            <Cpu className="w-3 h-3 mr-2" />
            Model
          </label>
          <p className="text-[10px] text-zinc-600 mb-2 font-mono">
            Selected provider: {selectedProviderMeta?.label || selectedProvider}
          </p>
          <OsintSelect
            ariaLabel="Model"
            value={effectiveSelectedModel}
            onChange={setSelectedModel}
            triggerClassName="p-2 pr-8 font-mono text-xs"
            options={selectableModels.map((model) => ({
              value: model.id,
              label: `${model.name} - ${model.description}`,
            }))}
          />
          <p className="text-[10px] text-zinc-600 mt-2 font-mono">
            Capabilities: thinking budget {supportsThinkingBudget ? 'available' : 'not available'},
            web search {selectedProviderMeta?.capabilities.supportsWebSearch ? 'available' : 'not available'}.
          </p>
        </section>

        <section className="border border-zinc-800 bg-zinc-900/30 p-4 h-full flex flex-col">
          <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
            <Microscope className="w-3 h-3 mr-2" />
            Scan Depth
          </label>
          <p className="text-[10px] text-zinc-600 mb-3 font-mono">
            Controls breadth, synthesis depth, and investigative rigor.
          </p>
          <div className="flex border border-zinc-700 mt-auto">
            <button
              onClick={() => setDepth('STANDARD')}
              className={`flex-1 py-2 text-xs font-mono uppercase ${
                depth === 'STANDARD'
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'bg-black text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setDepth('DEEP')}
              className={`flex-1 py-2 text-xs font-mono uppercase ${
                depth === 'DEEP'
                  ? 'bg-osint-primary/20 text-osint-primary font-bold border-l border-zinc-700'
                  : 'bg-black text-zinc-500 hover:text-zinc-300 border-l border-zinc-700'
              }`}
            >
              Deep
            </button>
          </div>
        </section>
      </div>

      <div className="border border-zinc-800 bg-zinc-900/30 p-4">
        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
          <Cpu className="w-3 h-3 mr-2" />
          Thinking Budget ({supportsThinkingBudget ? thinkingBudget : 0})
        </label>
        <input
          type="range"
          min={0}
          max={8192}
          step={512}
          value={supportsThinkingBudget ? thinkingBudget : 0}
          onChange={(event) => setThinkingBudget(Number(event.target.value))}
          disabled={!supportsThinkingBudget}
          className="w-full accent-[var(--osint-primary)] disabled:opacity-40"
        />
        <p className="text-[10px] text-zinc-600 mt-2 font-mono">
          {supportsThinkingBudget
            ? 'Controls reasoning budget for compatible models.'
            : `${selectedProviderMeta?.label || selectedProvider} ignores this setting.`}
        </p>
      </div>

      <div className="pt-6 border-t border-zinc-800">
        <label className="flex items-center space-x-3 cursor-pointer group">
          <div
            onClick={() => setSaveAsTemplate(!saveAsTemplate)}
            data-state={saveAsTemplate ? 'on' : 'off'}
            className="osint-check-toggle w-5 h-5 group-hover:border-zinc-500"
          >
            {saveAsTemplate && <Check className="w-3 h-3" />}
          </div>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
            {setupCopy.templateLabel}
          </span>
        </label>

        {saveAsTemplate && (
          <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
            <input
              type="text"
              placeholder="Enter Template Name..."
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              className="w-full bg-black border border-zinc-700 text-white p-2 font-mono text-xs focus:border-osint-primary outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-osint-panel w-full max-w-5xl h-full sm:h-auto max-h-[95vh] border border-zinc-600 shadow-2xl flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-zinc-700 bg-black">
          <div className="flex items-center space-x-2 text-white font-mono uppercase font-bold tracking-wider">
            <Target className="w-5 h-5 text-osint-primary" />
            <span>{setupCopy.title}</span>
          </div>
          <button onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  className={`flex flex-col items-center space-y-1 transition-all ${
                    step.id === currentStep
                      ? 'text-osint-primary'
                      : step.id < currentStep
                        ? 'text-green-500 cursor-pointer hover:text-green-400'
                        : 'text-zinc-600'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      step.id === currentStep
                        ? 'border-osint-primary bg-osint-primary/20'
                        : step.id < currentStep
                          ? 'border-green-500 bg-green-500/20'
                          : 'border-zinc-700'
                    }`}
                  >
                    {step.id < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono uppercase hidden sm:block max-w-24 text-center">
                    {step.label}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-2 ${
                      step.id < currentStep ? 'bg-green-500' : 'bg-zinc-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {initialContext && (
          <div className="mx-6 mt-2 bg-zinc-900/50 border-l-2 border-osint-primary p-3">
            <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Parent Context</div>
            <div className="text-xs text-zinc-300 font-mono">{initialContext.topic}</div>
          </div>
        )}

        <div className="p-6 min-h-[240px] flex-1 overflow-y-auto custom-scrollbar">
          {currentStep === 0 && renderStep0()}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white font-mono text-xs uppercase transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white font-mono text-xs uppercase transition-colors"
            >
              Cancel
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="osint-button-primary flex items-center px-6 py-2 font-bold font-mono text-xs uppercase disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="osint-button-primary px-6 py-2 font-bold font-mono text-xs uppercase flex items-center"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                {setupCopy.executeLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
