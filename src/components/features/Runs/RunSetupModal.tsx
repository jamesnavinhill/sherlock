import React from 'react';
import {
  Target,
  Lightbulb,
  User,
  Globe,
  UserCog,
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
  Sparkles,
  Shapes,
  Library,
} from 'lucide-react';
import { DateRangePicker } from '@/components/system/controls';
import { OsintSelect } from '@/components/ui/OsintSelect';
import type { GraphNodeSubtype, InvestigationScope, ManualNode } from '@/types';
import { getEntityToneClass } from '@/utils/entityPalette';
import { ProviderModelSelector } from './ProviderModelSelector';
import { RuntimeConfigBehaviorControls } from './RuntimeConfigBehaviorControls';
import { RuntimeConfigSummary } from './RuntimeConfigSummary';
import {
  type RunSetupConfigOverride,
  useRunSetupState,
} from './useRunSetupState';

export type { RunSetupConfigOverride } from './useRunSetupState';

export interface RunSetupModalProps {
  initialTopic: string;
  initialContext?: { topic: string; summary: string };
  initialScopeId?: string;
  initialConfigOverride?: RunSetupConfigOverride;
  initialDateRangeOverride?: { start?: string; end?: string };
  inheritanceHint?: string;
  onCancel: () => void;
  onStart: (
    topic: string,
    configOverride: RunSetupConfigOverride,
    preseededEntities?: ManualNode[],
    scope?: InvestigationScope,
    dateRange?: { start?: string; end?: string }
  ) => void;
}

const STEP_ICONS = [Compass, Target, Lightbulb, Shapes, Globe, UserCog] as const;

export const RunSetupModal: React.FC<RunSetupModalProps> = ({
  initialTopic,
  initialContext,
  initialScopeId,
  initialConfigOverride,
  initialDateRangeOverride,
  inheritanceHint,
  onCancel,
  onStart,
}) => {
  const {
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
    newEntityName,
    newEntityType,
    nextStep,
    prevStep,
    prioritySources,
    resolvedPurposeId,
    runtimeConfigForm,
    saveAsTemplate,
    seedEntities,
    selectedArtifactType,
    selectedPack,
    selectedPurpose,
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
  } = useRunSetupState({
    initialTopic,
    initialScopeId,
    initialConfigOverride,
    initialDateRangeOverride,
    onStart,
  });

  const renderStep0 = () => (
    <div className="space-y-5">
      <div>
        <label className="mb-3 flex items-center osint-meta-label">
          <Compass className="w-3 h-3 mr-2" />
          Domain Pack
        </label>
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
                <div className="truncate osint-panel-title">{scope.name}</div>
                <div className="mt-0.5 line-clamp-2 osint-body-quiet">
                  {scope.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-800">
        <div>
          <label className="mb-3 flex items-center osint-meta-label">
            <Sparkles className="w-3 h-3 mr-2" />
            {setupCopy.purposeLabel}
          </label>
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
                  <div className="osint-panel-title">{purpose.name}</div>
                  <span className="osint-meta-label">
                    {purpose.recommendedArtifactType}
                  </span>
                </div>
                <p className="osint-body-quiet">{purpose.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-800">
        <label className="mb-2 flex items-center osint-meta-label">
          <Calendar className="w-3 h-3 mr-2" />
          Temporal Scope
        </label>
        <DateRangePicker
          value={{ start: dateRangeStart, end: dateRangeEnd }}
          onChange={(nextValue) => {
            setDateRangeStart(nextValue.start || '');
            setDateRangeEnd(nextValue.end || '');
          }}
          className="mt-3"
          inputClassName="bg-black p-2 text-zinc-300"
        />
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <label className="mb-2 flex items-center osint-meta-label">
          <AlignLeft className="w-3 h-3 mr-2" />
          {setupCopy.targetLabel}
        </label>
        <textarea
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder={setupCopy.targetPlaceholder}
          className="w-full h-32 bg-black border border-zinc-700 p-3 osint-body-small text-white focus:border-osint-primary outline-none resize-none placeholder-zinc-600"
          autoFocus
        />
      </div>

      <div className="space-y-3 border-t border-zinc-900 pt-4">
        <label className="flex items-center osint-meta-label">
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
                <span className="osint-meta-label-strong text-white">
                  {template.name}
                </span>
                <span className="osint-meta-label">
                  {template.purposeId}
                </span>
              </div>
              <p className="osint-body-quiet">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {templates.length > 0 && (
        <div className="space-y-3 border-t border-zinc-900 pt-4">
          <label className="flex items-center osint-meta-label">
            <Layout className="w-3 h-3 mr-2" />
            Saved Templates
          </label>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {templates.slice(0, 4).map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="flex items-center bg-zinc-900 border border-zinc-800 p-2 osint-meta-label text-zinc-400 hover:border-osint-primary hover:text-white transition-all truncate"
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
        <label className="mb-2 flex items-center osint-meta-label">
          <Lightbulb className="w-3 h-3 mr-2" />
          {setupCopy.angleLabel} (Optional)
        </label>
        <p className="mb-3 osint-body-quiet">{setupCopy.angleDescription}</p>
        <textarea
          value={angle}
          onChange={(event) => setAngle(event.target.value)}
          placeholder={setupCopy.anglePlaceholder}
          className="w-full h-28 bg-black border border-zinc-700 p-3 osint-body-small text-white focus:border-osint-primary outline-none resize-none placeholder-zinc-600"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-2 flex items-center osint-meta-label">
          <User className="w-3 h-3 mr-2" />
          {setupCopy.entityLabel} (Optional)
        </label>
        <p className="mb-3 osint-body-quiet">{setupCopy.entityDescription}</p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newEntityName}
            onChange={(event) => setNewEntityName(event.target.value)}
            placeholder="Name..."
            className="flex-1 bg-black border border-zinc-700 p-2 osint-body-small text-white focus:border-osint-primary outline-none placeholder-zinc-600"
            onKeyDown={(event) => event.key === 'Enter' && handleAddEntity()}
          />
          <div className="w-40">
            <OsintSelect
              ariaLabel="Seed entity type"
              value={newEntityType}
              onChange={(value) => setNewEntityType(value as GraphNodeSubtype)}
              triggerClassName="p-2 pr-8 osint-meta-value"
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
            className="osint-button-primary px-3 py-2 osint-meta-label-strong disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <User
                    className={`w-3 h-3 flex-shrink-0 ${getEntityToneClass(entity.type)} entity-tone-text`}
                  />
                ) : entity.type === 'ORGANIZATION' ? (
                  <Building2
                    className={`w-3 h-3 flex-shrink-0 ${getEntityToneClass(entity.type)} entity-tone-text`}
                  />
                ) : entity.type === 'SOURCE' ? (
                  <Library
                    className={`w-3 h-3 flex-shrink-0 ${getEntityToneClass(entity.type)} entity-tone-text`}
                  />
                ) : (
                  <Shapes
                    className={`w-3 h-3 flex-shrink-0 ${getEntityToneClass(entity.type)} entity-tone-text`}
                  />
                )}
                <span className="truncate osint-body-small text-zinc-300">{entity.name}</span>
                <span className="osint-meta-label text-zinc-600">{entity.type}</span>
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
            <p className="osint-body-quiet italic">No seeded nodes added yet.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-2 flex items-center osint-meta-label">
          <Globe className="w-3 h-3 mr-2" />
          {setupCopy.sourceLabel} (Optional)
        </label>
        <p className="mb-3 osint-body-quiet">{setupCopy.sourceDescription}</p>
        <textarea
          value={prioritySources}
          onChange={(event) => setPrioritySources(event.target.value)}
          placeholder={setupCopy.sourcePlaceholder}
          className="w-full h-24 bg-black border border-zinc-700 p-3 osint-body-small text-white focus:border-osint-primary outline-none resize-none placeholder-zinc-600"
        />
      </div>

      {selectedScope.suggestedSources.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-zinc-800">
          <label className="block osint-meta-label">
            Suggested Source Libraries
          </label>
          <div className="space-y-3">
            {selectedScope.suggestedSources.slice(0, 4).map((category) => (
              <div key={category.name}>
                <div className="mb-2 osint-meta-label">
                  {category.name}
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.sources.slice(0, 5).map((source) => (
                    <button
                      key={source.label}
                      onClick={() => appendSuggestedSources([source.label])}
                      className="border border-zinc-800 bg-zinc-900/50 px-2 py-1 osint-meta-label text-zinc-400 hover:text-white hover:border-osint-primary transition-colors"
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
      <RuntimeConfigSummary
        packName={selectedPack.name}
        purposeName={selectedPurpose.name}
        artifactType={selectedArtifactType}
        hint={inheritanceHint || setupCopy.configHint}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 auto-rows-fr">
        <section className="border border-zinc-800 bg-zinc-900/30 p-4 h-full flex flex-col">
          <label className="mb-2 flex items-center osint-meta-label">
            <UserCog className="w-3 h-3 mr-2" />
            Agent Persona
          </label>
          <p className="mb-3 osint-body-quiet">
            Personas tailored for {selectedScope?.name || 'this pack'}
          </p>
          <OsintSelect
            ariaLabel="Agent persona"
            value={effectivePersona}
            onChange={setPersona}
            triggerClassName="mt-auto p-2 pr-8 osint-meta-value"
            options={(selectedScope?.personas || []).map((item) => ({
              value: item.id,
              label: item.label,
            }))}
          />
        </section>
      </div>

      <ProviderModelSelector
        form={runtimeConfigForm}
        providerHint="Choose the AI backend for this run."
      />

      <RuntimeConfigBehaviorControls form={runtimeConfigForm} />

      <div className="pt-6 border-t border-zinc-800">
        <label className="flex items-center space-x-3 cursor-pointer group">
          <div
            onClick={() => setSaveAsTemplate(!saveAsTemplate)}
            data-state={saveAsTemplate ? 'on' : 'off'}
            className="osint-check-toggle w-5 h-5 group-hover:border-zinc-500"
          >
            {saveAsTemplate && <Check className="w-3 h-3" />}
          </div>
          <span className="osint-meta-label text-zinc-400">
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
              className="w-full bg-black border border-zinc-700 p-2 osint-body-small text-white focus:border-osint-primary outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-osint-panel w-full max-w-5xl h-full sm:h-auto max-h-[95vh] border border-zinc-600 shadow-2xl flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-zinc-700 bg-black">
            <div className="flex items-center space-x-2 osint-meta-label-strong text-white">
              <Target className="w-5 h-5 text-osint-primary" />
              <span>{setupCopy.title}</span>
            </div>
            <button onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 pt-2 pb-2">
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
                      {(() => {
                        const StepIcon = STEP_ICONS[step.id];
                        return step.id < currentStep ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <StepIcon className="w-4 h-4" />
                        );
                      })()}
                    </div>
                    <span className="hidden max-w-24 text-center sm:block osint-meta-label">
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
              <div className="mb-1 osint-meta-label text-zinc-500">
                Parent Context
              </div>
              <div className="osint-body-small text-zinc-300">{initialContext.topic}</div>
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
              className="flex items-center px-4 py-2 border border-zinc-700 osint-meta-label text-zinc-400 hover:text-white hover:border-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </button>

            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-zinc-700 osint-meta-label text-zinc-400 hover:text-white hover:border-white transition-colors"
              >
                Cancel
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="osint-button-primary flex items-center px-6 py-2 osint-meta-label-strong disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  className="osint-button-primary flex items-center px-6 py-2 osint-meta-label-strong"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {setupCopy.executeLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

    </>
  );
};
