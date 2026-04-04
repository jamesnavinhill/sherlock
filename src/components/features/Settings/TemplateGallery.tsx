import React, { useEffect, useMemo, useState } from 'react';
import type { CaseTemplate } from '../../../types';
import { useWorkspaceStore } from '../../../store/caseStore';
import {
    Trash2, Play, Plus, X, ChevronLeft, ChevronRight, Check,
    Settings as SettingsIcon, Info, Search, Cpu, Target, Lightbulb, Compass,
    Briefcase, Layout, Sparkles
} from 'lucide-react';
import { OsintSelect } from '../../ui/OsintSelect';
import { BUILTIN_SCOPES, getAllScopes } from '../../../data/presets';
import { AI_MODELS, DEFAULT_MODEL_ID, getModelDisplayName, getModelProvider } from '../../../config/aiModels';
import { loadSystemConfig } from '../../../config/systemConfig';
import {
    getDomainPackForScope,
    getLabelProfileById,
    getPurposeProfileById,
    getStarterTemplates,
} from '../../../domain';

interface TemplateGalleryProps {
    onApply: (template: CaseTemplate) => void;
}

const CREATE_STEPS = [
    { id: 0, label: 'Protocol', icon: Layout },
    { id: 1, label: 'Scope', icon: Compass },
    { id: 2, label: 'Target', icon: Target },
    { id: 3, label: 'Config', icon: Cpu }
];

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onApply }) => {
    const { templates, deleteTemplate, addTemplate, customScopes, defaultScopeId, addToast } = useWorkspaceStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createStep, setCreateStep] = useState(0);
    const [isCreating, setIsCreating] = useState(false);

    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [selectedScopeId, setSelectedScopeId] = useState('');
    const [topic, setTopic] = useState('');
    const [hypothesis, setHypothesis] = useState('');
    const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
    const [persona, setPersona] = useState('');
    const [selectedPurposeId, setSelectedPurposeId] = useState('');
    const [depth, setDepth] = useState<'STANDARD' | 'DEEP'>('STANDARD');
    const [thinkingBudget, setThinkingBudget] = useState(0);
    const selectableModels = AI_MODELS.filter((model) => model.capabilities.runtimeStatus === 'ACTIVE');

    const allScopes = useMemo(() => getAllScopes(customScopes), [customScopes]);
    const resolvedDefaultScopeId = allScopes.find((scope) => scope.id === defaultScopeId)?.id || allScopes[0]?.id || 'open-investigation';
    const selectedScope = allScopes.find((scope) => scope.id === selectedScopeId) || allScopes[0] || BUILTIN_SCOPES[0];
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
    const starterScope = allScopes.find((scope) => scope.id === resolvedDefaultScopeId) || allScopes[0] || BUILTIN_SCOPES[0];
    const starterPack = useMemo(
        () => getDomainPackForScope(starterScope, customScopes),
        [starterScope, customScopes]
    );
    const starterLabelProfile = useMemo(
        () => getLabelProfileById(starterPack.labelProfileId),
        [starterPack]
    );
    const starterPurpose = useMemo(
        () => getPurposeProfileById(starterPack.defaultPurposeId),
        [starterPack]
    );
    const starterTemplates = useMemo(() => {
        const baseConfig = loadSystemConfig();
        const baseModel = baseConfig.modelId || DEFAULT_MODEL_ID;

        return getStarterTemplates(starterPack, starterPurpose).map((starter) => ({
            id: `builtin-${starter.id}`,
            name: `${starterPack.name}: ${starter.name}`,
            description: starter.description,
            topic: starter.hypothesis
                ? `${starter.topic}\n\n[RUN_ANGLE]: ${starter.hypothesis}`
                : starter.topic,
            config: {
                provider: baseConfig.provider || getModelProvider(baseModel),
                modelId: baseModel,
                persona: starterScope.defaultPersona || starterScope.personas[0]?.id,
                searchDepth: baseConfig.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD',
                thinkingBudget: typeof baseConfig.thinkingBudget === 'number' ? baseConfig.thinkingBudget : 0,
                packId: starterPack.id,
                purposeId: starter.purposeId,
                artifactType: starter.artifactType,
                labelProfileId: starterPack.labelProfileId,
            },
            scopeId: starterScope.id,
            createdAt: 0,
        } satisfies CaseTemplate));
    }, [starterPack, starterPurpose, starterScope]);

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.topic.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (!showCreateModal) return;
        if (!selectedScope) return;
        const defaultPersona = selectedScope.defaultPersona || selectedScope.personas[0]?.id || 'general-investigator';
        setPersona((current) => {
            if (selectedScope.personas.some((candidate) => candidate.id === current)) return current;
            return defaultPersona;
        });
    }, [showCreateModal, selectedScope]);

    useEffect(() => {
        if (supportedPurposes.some((purpose) => purpose.id === selectedPurposeId)) return;
        setSelectedPurposeId(selectedPack.defaultPurposeId);
    }, [selectedPack, selectedPurposeId, supportedPurposes]);

    const openCreateModal = () => {
        const defaultScope = allScopes.find((scope) => scope.id === resolvedDefaultScopeId) || allScopes[0];
        const defaultPersona = defaultScope?.defaultPersona || defaultScope?.personas[0]?.id || 'general-investigator';
        const parsed = loadSystemConfig();
        const nextModel = parsed.modelId || DEFAULT_MODEL_ID;
        const nextDepth: 'STANDARD' | 'DEEP' = parsed.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD';
        const nextThinking = typeof parsed.thinkingBudget === 'number' ? parsed.thinkingBudget : 0;
        const nextPersona = parsed.persona && defaultScope?.personas.some((item) => item.id === parsed.persona)
            ? parsed.persona
            : defaultPersona;

        setCreateStep(0);
        setTemplateName('');
        setTemplateDescription('');
        setTopic('');
        setHypothesis('');
        setSelectedScopeId(defaultScope?.id || resolvedDefaultScopeId);
        setSelectedPurposeId(getDomainPackForScope(defaultScope || allScopes[0], customScopes).defaultPurposeId);
        setSelectedModel(nextModel);
        setDepth(nextDepth);
        setThinkingBudget(nextThinking);
        setPersona(nextPersona);
        setShowCreateModal(true);
    };

    const closeCreateModal = () => {
        if (isCreating) return;
        setShowCreateModal(false);
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

            await addTemplate({
                id: `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name: templateName.trim(),
                description: templateDescription.trim() || undefined,
                topic: combinedTopic,
                config: {
                    provider: getModelProvider(selectedModel),
                    modelId: selectedModel,
                    persona,
                    searchDepth: depth,
                    thinkingBudget,
                    packId: selectedPack.id,
                    purposeId: selectedPurpose.id,
                    artifactType: selectedPurpose.recommendedArtifactType,
                    labelProfileId: selectedPack.labelProfileId,
                },
                scopeId: selectedScope.id,
                packId: selectedPack.id,
                purposeId: selectedPurpose.id,
                artifactType: selectedPurpose.recommendedArtifactType,
                labelProfileId: selectedPack.labelProfileId,
                createdAt: Date.now()
            });
            addToast('Template created successfully', 'SUCCESS');
            setShowCreateModal(false);
        } catch (error) {
            console.error('Failed to create template', error);
            addToast('Failed to create template', 'ERROR');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 p-4 border border-zinc-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="search"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black border border-zinc-700 text-white pl-10 pr-4 py-2 font-mono text-xs focus:border-osint-primary outline-none transition-colors"
                    />
                </div>
                <button
                    onClick={openCreateModal}
                    className="osint-button-primary flex items-center px-4 py-2 font-mono text-xs font-bold uppercase"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                </button>
            </div>

            {starterTemplates.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase flex items-center">
                            <Sparkles className="w-3 h-3 mr-2 text-osint-primary" />
                            Built-in Starters
                        </div>
                        <div className="text-[10px] font-mono text-zinc-600 uppercase">
                            {starterPack.name}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {starterTemplates.slice(0, 4).map((template) => (
                            <div key={template.id} className="group bg-zinc-950/70 border border-zinc-800 hover:border-osint-primary transition-all duration-300 flex flex-col">
                                <div className="p-4 flex-1">
                                    <div className="flex items-center justify-between mb-2 gap-3">
                                        <span className="text-[10px] font-mono text-osint-primary bg-osint-primary/10 px-2 py-0.5 border border-osint-primary/30 uppercase font-bold">
                                            Starter
                                        </span>
                                        <span className="text-[9px] font-mono text-zinc-600 uppercase">
                                            {template.config.purposeId}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-2 font-mono uppercase line-clamp-2">
                                        {template.name}
                                    </h3>
                                    <p className="text-zinc-500 text-[10px] leading-relaxed mb-4 line-clamp-3">
                                        {template.description}
                                    </p>
                                    <div className="text-[10px] font-mono text-zinc-600 border-t border-zinc-800 pt-3">
                                        {starterLabelProfile.workspaceLabel} starter
                                    </div>
                                </div>
                                <button
                                    onClick={() => onApply(template)}
                                    className="osint-button-primary flex items-center justify-center p-3 border-t border-zinc-800 font-mono text-[10px] font-bold uppercase"
                                >
                                    <Play className="w-3 h-3 mr-2" />
                                    Launch Starter
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 bg-zinc-900/20">
                    <Layout className="w-12 h-12 text-zinc-700 mb-4 opacity-30" />
                    <h3 className="text-zinc-500 font-mono text-xs uppercase font-bold mb-1">No Templates Found</h3>
                    <p className="text-zinc-600 font-mono text-[10px]">Save pack and purpose-aware launch setups to reuse them here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((t) => (
                        <div key={t.id} className="group bg-osint-panel border border-zinc-800 hover:border-osint-primary transition-all duration-300 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Briefcase className="w-16 h-16 text-white" />
                            </div>

                            <div className="p-5 flex-1 relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-mono text-osint-primary bg-osint-primary/10 px-2 py-0.5 border border-osint-primary/30 uppercase font-bold">
                                        Protocol
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {(t.config.purposeId || t.purposeId) && (
                                            <span className="text-[9px] font-mono text-zinc-500 uppercase">
                                                {t.config.purposeId || t.purposeId}
                                            </span>
                                        )}
                                        <span className="text-[9px] font-mono text-zinc-600">
                                            {new Date(t.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1 font-mono uppercase truncate group-hover:text-osint-primary transition-colors">
                                    {t.name}
                                </h3>
                                <p className="text-zinc-500 text-[10px] font-mono mb-4 line-clamp-2 italic">
                                    &quot;{t.topic}&quot;
                                </p>

                                <div className="space-y-2 border-t border-zinc-800 pt-4">
                                    <div className="flex items-center text-[10px] font-mono text-zinc-400 capitalize">
                                        <SettingsIcon className="w-3 h-3 mr-2 text-zinc-600" />
                                        <span>Model: {getModelDisplayName(t.config.modelId || DEFAULT_MODEL_ID)}</span>
                                    </div>
                                    <div className="flex items-center text-[10px] font-mono text-zinc-400">
                                        <Info className="w-3 h-3 mr-2 text-zinc-600" />
                                        <span>Persona: {t.config.persona?.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex border-t border-zinc-800 relative z-10">
                                <button
                                    onClick={() => onApply(t)}
                                    className="osint-button-primary flex-1 flex items-center justify-center p-3 font-mono text-[10px] font-bold uppercase"
                                >
                                    <Play className="w-3 h-3 mr-2" />
                                    Launch
                                </button>
                                <button
                                    onClick={() => { void deleteTemplate(t.id); }}
                                    className="flex-shrink-0 p-3 border-l border-zinc-800 bg-zinc-900 text-zinc-600 transition-all hover:bg-[color:var(--osint-danger-soft-bg)] hover:text-osint-danger"
                                    title="Delete Template"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-zinc-600 font-mono text-[9px] flex items-start bg-zinc-900/30 p-3 border border-zinc-800/50">
                <Info className="w-3 h-3 mr-2 flex-shrink-0 text-osint-primary" />
                Templates now capture pack, purpose, artifact, and model context. Applying one launches the matching workspace flow with those defaults prefilled.
            </p>

            {showCreateModal && (
                <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl bg-black border border-zinc-700 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest">Create Protocol Template</h3>
                                <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase">Reusable pack and purpose-aware launch setup</p>
                            </div>
                            <button
                                onClick={closeCreateModal}
                                className="p-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors"
                                aria-label="Close create template modal"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/40 flex items-center gap-2 overflow-x-auto">
                            {CREATE_STEPS.map((step) => {
                                const isActive = createStep === step.id;
                                const isDone = createStep > step.id;
                                return (
                                    <div
                                        key={step.id}
                                        className={`flex items-center px-3 py-2 border font-mono text-[10px] uppercase whitespace-nowrap ${isActive ? 'border-osint-primary text-osint-primary bg-osint-primary/10' : isDone ? 'border-zinc-700 text-zinc-300 bg-zinc-900' : 'border-zinc-800 text-zinc-500 bg-black'}`}
                                    >
                                        {isDone ? <Check className="w-3 h-3 mr-2" /> : <step.icon className="w-3 h-3 mr-2" />}
                                        {step.label}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            {createStep === 0 && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2">Protocol Name</label>
                                        <input
                                            type="text"
                                            value={templateName}
                                            onChange={(event) => setTemplateName(event.target.value)}
                                            placeholder="e.g., Corporate Fraud Deep-Dive"
                                            className="w-full bg-black border border-zinc-700 text-white p-3 font-mono text-sm focus:border-osint-primary outline-none placeholder-zinc-600"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2">Description (Optional)</label>
                                        <textarea
                                            value={templateDescription}
                                            onChange={(event) => setTemplateDescription(event.target.value)}
                                            placeholder="Describe when and why this protocol should be used."
                                            className="w-full h-28 bg-black border border-zinc-700 text-white p-3 font-mono text-sm focus:border-osint-primary outline-none resize-none placeholder-zinc-600"
                                        />
                                    </div>
                                </div>
                            )}

                            {createStep === 1 && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2">Domain Pack</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {allScopes.map((scope) => (
                                                <button
                                                    key={scope.id}
                                                    onClick={() => setSelectedScopeId(scope.id)}
                                                    className={`p-3 border text-left transition-all ${selectedScopeId === scope.id ? 'border-osint-primary bg-osint-primary/10 text-white' : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'}`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-lg">{scope.icon || '🔍'}</span>
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-mono font-bold truncate">{scope.name}</div>
                                                            <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">{scope.description}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-800">
                                        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2">Purpose</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {supportedPurposes.map((purpose) => (
                                                <button
                                                    key={purpose.id}
                                                    onClick={() => setSelectedPurposeId(purpose.id)}
                                                    className={`p-3 border text-left transition-all ${selectedPurpose.id === purpose.id ? 'border-osint-primary bg-osint-primary/10 text-white' : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'}`}
                                                >
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <div className="text-xs font-mono font-bold truncate">{purpose.name}</div>
                                                        <div className="text-[9px] font-mono text-zinc-500 uppercase">{purpose.recommendedArtifactType}</div>
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500 line-clamp-2">{purpose.description}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {createStep === 2 && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2">Launch Target</label>
                                        <textarea
                                            value={topic}
                                            onChange={(event) => setTopic(event.target.value)}
                                            placeholder="Enter the question, subject, or topic this template should launch with..."
                                            className="w-full h-32 bg-black border border-zinc-700 text-white p-3 font-mono text-sm focus:border-osint-primary outline-none resize-none placeholder-zinc-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2 flex items-center">
                                            <Lightbulb className="w-3 h-3 mr-2" />
                                            Run Angle (Optional)
                                        </label>
                                        <textarea
                                            value={hypothesis}
                                            onChange={(event) => setHypothesis(event.target.value)}
                                            placeholder="Capture the default lens, hypothesis, or comparison this template should carry."
                                            className="w-full h-24 bg-black border border-zinc-700 text-white p-3 font-mono text-sm focus:border-osint-primary outline-none resize-none placeholder-zinc-600"
                                        />
                                    </div>
                                </div>
                            )}

                            {createStep === 3 && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2">Model</label>
                                        <OsintSelect
                                            ariaLabel="Template model"
                                            value={selectedModel}
                                            onChange={setSelectedModel}
                                            triggerClassName="p-3 pr-10 font-mono text-xs"
                                            options={selectableModels.map((model) => ({
                                                value: model.id,
                                                label: `${model.name} - ${model.description}`,
                                            }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-zinc-400 uppercase mb-2">Persona</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {(selectedScope?.personas || []).map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setPersona(item.id)}
                                                    className={`p-3 border text-left transition-all ${persona === item.id ? 'border-osint-primary bg-osint-primary/10 text-white' : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'}`}
                                                >
                                                    <div className="text-xs font-mono font-bold">{item.label}</div>
                                                    <div className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{item.instruction}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="border border-zinc-800 bg-zinc-900/30 p-3">
                                        <div className="text-[10px] font-mono text-zinc-500 uppercase mb-2">Output Profile</div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-2 py-1 border border-zinc-700 text-[10px] font-mono uppercase text-white">
                                                {selectedPack.name}
                                            </span>
                                            <span className="px-2 py-1 border border-zinc-700 text-[10px] font-mono uppercase text-zinc-300">
                                                {selectedPurpose.name}
                                            </span>
                                            <span className="px-2 py-1 border border-zinc-700 text-[10px] font-mono uppercase text-zinc-300">
                                                {selectedPurpose.recommendedArtifactType}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-mono text-zinc-400 uppercase mb-2">Search Depth</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setDepth('STANDARD')}
                                                    className={`py-2 border font-mono text-xs uppercase ${depth === 'STANDARD' ? 'border-osint-primary bg-osint-primary/10 text-white' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                                                >
                                                    Standard
                                                </button>
                                                <button
                                                    onClick={() => setDepth('DEEP')}
                                                    className={`py-2 border font-mono text-xs uppercase ${depth === 'DEEP' ? 'border-osint-primary bg-osint-primary/10 text-white' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                                                >
                                                    Deep
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-mono text-zinc-400 uppercase mb-2">
                                                Thinking Budget ({thinkingBudget})
                                            </label>
                                            <input
                                                type="range"
                                                min={0}
                                                max={8192}
                                                step={512}
                                                value={thinkingBudget}
                                                onChange={(event) => setThinkingBudget(Number(event.target.value))}
                                                className="w-full accent-[var(--osint-primary)]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
                            <div className="text-[10px] text-zinc-500 font-mono uppercase">
                                Step {createStep + 1} of {CREATE_STEPS.length}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={closeCreateModal}
                                    className="px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 font-mono text-xs uppercase transition-colors"
                                >
                                    Cancel
                                </button>
                                {createStep > 0 && (
                                    <button
                                        onClick={() => setCreateStep((current) => Math.max(0, current - 1))}
                                        className="px-4 py-2 border border-zinc-700 text-zinc-300 hover:text-white hover:border-white font-mono text-xs uppercase transition-colors flex items-center"
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
                                        className="osint-button-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs font-bold uppercase flex items-center"
                                    >
                                        Next
                                        <ChevronRight className="w-3 h-3 ml-1" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { void handleCreateTemplate(); }}
                                        disabled={!canProceed() || isCreating}
                                        className="osint-button-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs font-bold uppercase"
                                    >
                                        {isCreating ? 'Creating...' : 'Create Template'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
