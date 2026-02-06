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
  ChevronDown,
} from 'lucide-react';
import { useCaseStore } from '../../store/caseStore';
import type { CaseTemplate, SystemConfig, ManualNode, InvestigationScope } from '../../types';
import { BUILTIN_SCOPES, getScopeById, getAllScopes } from '../../data/presets';
import { AI_MODELS, DEFAULT_MODEL_ID, getModelProvider } from '../../config/aiModels';
import { loadSystemConfig } from '../../config/systemConfig';

interface TaskSetupModalProps {
  initialTopic: string;
  initialContext?: { topic: string; summary: string };
  initialScopeId?: string;
  onCancel: () => void;
  onStart: (
    topic: string,
    configOverride: Partial<SystemConfig>,
    preseededEntities?: ManualNode[],
    scope?: InvestigationScope,
    dateRange?: { start?: string; end?: string }
  ) => void;
}

const STEPS = [
  { id: 0, label: 'Scope', icon: Compass },
  { id: 1, label: 'Target', icon: Target },
  { id: 2, label: 'Hypothesis', icon: Lightbulb },
  { id: 3, label: 'Key Figures', icon: User },
  { id: 4, label: 'Sources', icon: Globe },
  { id: 5, label: 'Config', icon: UserCog },
];

interface KeyFigure {
  id: string;
  name: string;
  type: 'PERSON' | 'ORGANIZATION';
}

export const TaskSetupModal: React.FC<TaskSetupModalProps> = ({
  initialTopic,
  initialContext,
  initialScopeId,
  onCancel,
  onStart,
}) => {
  const { templates, addTemplate, customScopes, defaultScopeId } = useCaseStore();
  const storedConfig = loadSystemConfig();
  const [currentStep, setCurrentStep] = useState(0);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Step 0: Scope Selection
  const allScopes = getAllScopes(customScopes);
  const [selectedScopeId, setSelectedScopeId] = useState(initialScopeId || defaultScopeId);
  const selectedScope =
    getScopeById(selectedScopeId) ||
    allScopes.find((s) => s.id === selectedScopeId) ||
    BUILTIN_SCOPES[0];

  // Step 0: Date Range
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');

  // Step 1: Target
  const [topic, setTopic] = useState(initialTopic);

  // Step 2: Hypothesis
  const [hypothesis, setHypothesis] = useState('');

  // Step 3: Key Figures
  const [keyFigures, setKeyFigures] = useState<KeyFigure[]>([]);
  const [newFigureName, setNewFigureName] = useState('');
  const [newFigureType, setNewFigureType] = useState<'PERSON' | 'ORGANIZATION'>('PERSON');

  // Step 4: Sources
  const [prioritySources, setPrioritySources] = useState('');

  // Step 5: Config - persona now uses scope personas
  const [persona, setPersona] = useState<string>(() => {
    // Default to scope's default persona or first persona
    return (
      selectedScope?.defaultPersona || selectedScope?.personas[0]?.id || 'general-investigator'
    );
  });
  const [depth, setDepth] = useState<'STANDARD' | 'DEEP'>(
    storedConfig.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD'
  );
  const [thinkingBudget, setThinkingBudget] = useState(storedConfig.thinkingBudget ?? 0);
  const [selectedModel, setSelectedModel] = useState(storedConfig.modelId ?? DEFAULT_MODEL_ID);
  const selectableModels = AI_MODELS.filter((model) => model.capabilities.runtimeStatus === 'ACTIVE');

  const applyTemplate = (t: CaseTemplate) => {
    setTopic(t.topic);
    if (t.config.persona) setPersona(t.config.persona);
    if (t.config.searchDepth) setDepth(t.config.searchDepth);
    if (t.config.thinkingBudget !== undefined) setThinkingBudget(t.config.thinkingBudget);
    if (t.config.modelId) setSelectedModel(t.config.modelId);
    if (t.scopeId) setSelectedScopeId(t.scopeId);
  };

  const handleAddFigure = () => {
    if (!newFigureName.trim()) return;
    const newFigure: KeyFigure = {
      id: `fig-${Date.now()}`,
      name: newFigureName.trim(),
      type: newFigureType,
    };
    setKeyFigures([...keyFigures, newFigure]);
    setNewFigureName('');
  };

  const handleRemoveFigure = (id: string) => {
    setKeyFigures(keyFigures.filter((f) => f.id !== id));
  };

  const handleStart = () => {
    // Convert keyFigures to ManualNodes
    const preseededEntities: ManualNode[] = keyFigures.map((f) => ({
      id: f.id,
      label: f.name,
      type: 'ENTITY' as const,
      subtype: f.type,
      timestamp: Date.now(),
    }));

    // Build the full topic including hypothesis if provided
    let fullTopic = topic;
    if (hypothesis.trim()) {
      fullTopic = `${topic}\n\n[HYPOTHESIS]: ${hypothesis.trim()}`;
    }

    // Build date range if specified
    const dateRange =
      dateRangeStart || dateRangeEnd
        ? { start: dateRangeStart || undefined, end: dateRangeEnd || undefined }
        : undefined;

    onStart(
      fullTopic,
      {
        provider: getModelProvider(selectedModel),
        persona,
        searchDepth: depth,
        thinkingBudget,
        modelId: selectedModel,
      },
      preseededEntities.length > 0 ? preseededEntities : undefined,
      selectedScope,
      dateRange
    );

    if (saveAsTemplate && templateName.trim()) {
      addTemplate({
        id: `tmp-${Date.now()}`,
        name: templateName.trim(),
        topic: topic,
        config: { provider: getModelProvider(selectedModel), persona, searchDepth: depth, thinkingBudget, modelId: selectedModel },
        scopeId: selectedScopeId,
        createdAt: Date.now(),
      });
    }
  };

  const canProceed = () => {
    if (currentStep === 0) return !!selectedScopeId;
    if (currentStep === 1) return topic.trim().length > 0;
    return true;
  };

  const nextStep = () => {
    if (currentStep < 5 && canProceed()) {
      setCurrentStep(currentStep + 1);
      // When leaving scope step, update persona to match scope default
      if (currentStep === 0 && selectedScope) {
        setPersona(selectedScope.defaultPersona || selectedScope.personas[0]?.id || persona);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // --- STEP RENDERS ---
  const renderStep0 = () => (
    <div className="space-y-5">
      {/* Scope Selection */}
      <div>
        <label className="block text-xs font-mono text-zinc-400 uppercase mb-3 flex items-center">
          <Compass className="w-3 h-3 mr-2" />
          Investigation Scope
        </label>
        <div className="grid grid-cols-2 gap-2 pr-1">
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

      {/* Date Range */}
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
              onChange={(e) => setDateRangeStart(e.target.value)}
              className="w-full bg-black border border-zinc-700 text-zinc-300 p-2 font-mono text-xs focus:border-osint-primary outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-zinc-500 mb-1 font-mono">TO</label>
            <input
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              className="w-full bg-black border border-zinc-700 text-zinc-300 p-2 font-mono text-xs focus:border-osint-primary outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
          <AlignLeft className="w-3 h-3 mr-2" />
          Investigation Target / Query
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter the subject, entity, or question to investigate..."
          className="w-full h-32 bg-black border border-zinc-700 text-white p-3 font-mono text-sm focus:border-osint-primary outline-none resize-none placeholder-zinc-600"
          autoFocus
        />
      </div>

      {templates.length > 0 && (
        <div className="pt-2 border-t border-zinc-900">
          <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-2">
            Load From Template
          </label>
          <div className="grid grid-cols-2 gap-2">
            {templates.slice(0, 4).map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className="flex items-center p-2 bg-zinc-900 border border-zinc-800 hover:border-osint-primary text-zinc-400 hover:text-white transition-all text-[10px] font-mono uppercase truncate"
              >
                <Layout className="w-3 h-3 mr-2" />
                <span className="truncate">{t.name}</span>
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
          Working Hypothesis (Optional)
        </label>
        <p className="text-xs text-zinc-600 mb-3 font-mono">
          What do you suspect? This helps guide the investigation focus.
        </p>
        <textarea
          value={hypothesis}
          onChange={(e) => setHypothesis(e.target.value)}
          placeholder="E.g., 'Company X may be funneling funds through shell entities...'"
          className="w-full h-24 bg-black border border-zinc-700 text-white p-3 font-mono text-sm focus:border-osint-primary outline-none resize-none placeholder-zinc-600"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
          <User className="w-3 h-3 mr-2" />
          Key Figures (Optional)
        </label>
        <p className="text-xs text-zinc-600 mb-3 font-mono">
          Pre-seed entities of interest. These will be added to the network graph.
        </p>

        {/* Add Figure Form */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newFigureName}
            onChange={(e) => setNewFigureName(e.target.value)}
            placeholder="Name..."
            className="flex-1 bg-black border border-zinc-700 text-white p-2 font-mono text-xs focus:border-osint-primary outline-none placeholder-zinc-600"
            onKeyDown={(e) => e.key === 'Enter' && handleAddFigure()}
          />
          <select
            value={newFigureType}
            onChange={(e) => setNewFigureType(e.target.value as 'PERSON' | 'ORGANIZATION')}
            className="bg-black border border-zinc-700 text-zinc-300 p-2 font-mono text-xs focus:border-osint-primary outline-none"
          >
            <option value="PERSON">Person</option>
            <option value="ORGANIZATION">Org</option>
          </select>
          <button
            onClick={handleAddFigure}
            disabled={!newFigureName.trim()}
            className="px-3 py-2 bg-osint-primary text-black font-mono text-xs font-bold uppercase hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Figure List */}
        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
          {keyFigures.map((figure) => (
            <div
              key={figure.id}
              className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-2"
            >
              <div className="flex items-center space-x-2">
                {figure.type === 'PERSON' ? (
                  <User className="w-3 h-3 text-osint-primary" />
                ) : (
                  <Building2 className="w-3 h-3 text-osint-primary" />
                )}
                <span className="text-sm text-zinc-300 font-mono">{figure.name}</span>
                <span className="text-[10px] text-zinc-600 uppercase">{figure.type}</span>
              </div>
              <button
                onClick={() => handleRemoveFigure(figure.id)}
                className="text-zinc-600 hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {keyFigures.length === 0 && (
            <p className="text-xs text-zinc-600 font-mono italic">No key figures added yet.</p>
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
          Priority Sources (Optional)
        </label>
        <p className="text-xs text-zinc-600 mb-3 font-mono">
          Domains or handles to prioritize in the investigation.
        </p>
        <textarea
          value={prioritySources}
          onChange={(e) => setPrioritySources(e.target.value)}
          placeholder="nytimes.com, @DOJ, sec.gov..."
          className="w-full h-20 bg-black border border-zinc-700 text-white p-3 font-mono text-sm focus:border-osint-primary outline-none resize-none placeholder-zinc-600"
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      {/* Persona Select */}
      <div>
        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
          <UserCog className="w-3 h-3 mr-2" />
          Agent Persona
        </label>
        <p className="text-[10px] text-zinc-600 mb-2 font-mono">
          Personas tailored for {selectedScope?.name || 'this scope'}
        </p>
        <select
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          className="w-full bg-black border border-zinc-700 text-zinc-300 p-2 font-mono text-xs focus:border-osint-primary outline-none"
        >
          {selectedScope?.personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Model Select */}
      <div>
        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
          <Cpu className="w-3 h-3 mr-2" />
          AI Model
        </label>
        <p className="text-[10px] text-zinc-600 mb-2 font-mono">
          Override global default for this investigation
        </p>
        <div className="relative">
          <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-black border border-zinc-700 text-zinc-300 p-2 pr-8 font-mono text-xs focus:border-osint-primary outline-none appearance-none cursor-pointer"
          >
            {selectableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Depth Select */}
      <div>
        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
          <Microscope className="w-3 h-3 mr-2" />
          Scan Depth
        </label>
        <div className="flex border border-zinc-700">
          <button
            onClick={() => setDepth('STANDARD')}
            className={`flex-1 py-2 text-xs font-mono uppercase ${depth === 'STANDARD' ? 'bg-zinc-800 text-white font-bold' : 'bg-black text-zinc-500 hover:text-zinc-300'}`}
          >
            Standard
          </button>
          <button
            onClick={() => setDepth('DEEP')}
            className={`flex-1 py-2 text-xs font-mono uppercase ${depth === 'DEEP' ? 'bg-osint-primary/20 text-osint-primary font-bold border-l border-zinc-700' : 'bg-black text-zinc-500 hover:text-zinc-300 border-l border-zinc-700'}`}
          >
            Deep Dive
          </button>
        </div>
        {/* Save as Template Toggle */}
        <div className="pt-6 border-t border-zinc-800">
          <label className="flex items-center space-x-3 cursor-pointer group">
            <div
              onClick={() => setSaveAsTemplate(!saveAsTemplate)}
              className={`w-5 h-5 border flex items-center justify-center transition-all ${saveAsTemplate ? 'bg-osint-primary border-osint-primary' : 'bg-black border-zinc-700 group-hover:border-zinc-500'}`}
            >
              {saveAsTemplate && <Check className="w-3 h-3 text-black" />}
            </div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
              Store as Reusable Protocol (Template)
            </span>
          </label>

          {saveAsTemplate && (
            <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
              <input
                type="text"
                placeholder="Enter Template Name..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full bg-black border border-zinc-700 text-white p-2 font-mono text-xs focus:border-osint-primary outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-osint-panel w-full max-w-4xl border border-zinc-600 shadow-2xl flex flex-col relative">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-700 bg-black">
          <div className="flex items-center space-x-2 text-white font-mono uppercase font-bold tracking-wider">
            <Target className="w-5 h-5 text-osint-primary" />
            <span>Initialize Operation</span>
          </div>
          <button onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
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
                  <span className="text-[10px] font-mono uppercase hidden sm:block">
                    {step.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
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

        {/* Context Banner */}
        {initialContext && (
          <div className="mx-6 mt-2 bg-zinc-900/50 border-l-2 border-osint-primary p-3">
            <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Parent Context</div>
            <div className="text-xs text-zinc-300 font-mono">{initialContext.topic}</div>
          </div>
        )}

        {/* Step Content */}
        <div className="p-6 min-h-[200px]">
          {currentStep === 0 && renderStep0()}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>

        {/* Footer */}
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

            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="tasksetup-next-button flex items-center px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold font-mono text-xs uppercase transition-colors disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="px-6 py-2 bg-white hover:bg-zinc-200 text-black font-bold font-mono text-xs uppercase flex items-center transition-colors shadow-[0_0_15px_-5px_rgba(255,255,255,0.5)]"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Execute Task
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
