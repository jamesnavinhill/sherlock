import React, { useMemo, useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Cpu,
    Globe,
    Lightbulb,
    Plus,
    Shapes,
    Sparkles,
    Target,
    Trash2,
} from 'lucide-react';
import type { Case, GraphNodeSubtype, InvestigationScope } from '@/types';
import {
    AI_PROVIDERS,
    getDefaultModelForProvider,
    getProviderOptionById,
    getRuntimeReadyModelsForProvider,
} from '../../../config/aiModels';
import { getAllScopes } from '../../../data/presets';
import { getDomainPackForScope, getPurposeProfileById } from '../../../domain';
import {
    buildGuidedReviewMarkdown,
    GUIDED_STEP_ORDER,
    type GuidedRunDraft,
    type GuidedSessionState,
} from '../../../services/chat/guidedMode';
import { createLocalId } from '../../../utils/id';

interface GuidedRunBuilderProps {
    state: GuidedSessionState;
    customScopes: InvestigationScope[];
    workspace?: Case | null;
    isBusy?: boolean;
    onAdvance: (draft: GuidedRunDraft) => void;
    onBack: () => void;
    onLaunchRun: () => void;
    onSaveDraft: () => void;
    onOpenManualSetup: () => void;
}

const ENTITY_TYPES: GraphNodeSubtype[] = ['PERSON', 'ORGANIZATION', 'CONCEPT', 'SOURCE', 'UNKNOWN'];

export const GuidedRunBuilder: React.FC<GuidedRunBuilderProps> = ({
    state,
    customScopes,
    workspace,
    isBusy = false,
    onAdvance,
    onBack,
    onLaunchRun,
    onSaveDraft,
    onOpenManualSetup,
}) => {
    const [draft, setDraft] = useState<GuidedRunDraft>(state.draft);
    const [newEntityName, setNewEntityName] = useState('');
    const [newEntityType, setNewEntityType] = useState<GraphNodeSubtype>('PERSON');

    const allScopes = useMemo(() => getAllScopes(customScopes), [customScopes]);
    const selectedScope = useMemo(
        () => allScopes.find((scope) => scope.id === draft.scopeId) || allScopes[0],
        [allScopes, draft.scopeId]
    );
    const selectedPack = useMemo(
        () => getDomainPackForScope(selectedScope, customScopes),
        [customScopes, selectedScope]
    );
    const supportedPurposes = useMemo(
        () => selectedPack.supportedPurposeIds.map((purposeId) => getPurposeProfileById(purposeId)),
        [selectedPack]
    );
    const selectedPurpose = useMemo(
        () =>
            supportedPurposes.find((purpose) => purpose.id === draft.purposeId) ||
            getPurposeProfileById(selectedPack.defaultPurposeId),
        [draft.purposeId, selectedPack.defaultPurposeId, supportedPurposes]
    );
    const selectableModels = useMemo(
        () => getRuntimeReadyModelsForProvider(draft.provider),
        [draft.provider]
    );
    const providerMeta = getProviderOptionById(draft.provider);
    const currentStepIndex = GUIDED_STEP_ORDER.indexOf(state.step);

    const canAdvance = useMemo(() => {
        if (state.step === 'TARGET') {
            return draft.topic.trim().length > 0;
        }
        return true;
    }, [draft.topic, state.step]);

    const handleScopeChange = (scopeId: string) => {
        const nextScope = allScopes.find((scope) => scope.id === scopeId) || selectedScope;
        const nextPack = getDomainPackForScope(nextScope, customScopes);
        const nextPurpose = getPurposeProfileById(nextPack.defaultPurposeId);
        setDraft((current) => ({
            ...current,
            scopeId: nextScope.id,
            purposeId: nextPurpose.id,
            artifactType: nextPurpose.recommendedArtifactType,
            persona: nextScope.defaultPersona || nextScope.personas[0]?.id || current.persona,
        }));
    };

    const handleProviderChange = (provider: GuidedRunDraft['provider']) => {
        setDraft((current) => ({
            ...current,
            provider,
            modelId:
                getRuntimeReadyModelsForProvider(provider)[0]?.id || getDefaultModelForProvider(provider),
        }));
    };

    const handleAddEntity = () => {
        if (!newEntityName.trim()) return;
        setDraft((current) => ({
            ...current,
            entities: [
                ...current.entities,
                {
                    id: createLocalId('guided-entity'),
                    name: newEntityName.trim(),
                    type: newEntityType,
                },
            ],
        }));
        setNewEntityName('');
        setNewEntityType('PERSON');
    };

    const handleRemoveEntity = (entityId: string) => {
        setDraft((current) => ({
            ...current,
            entities: current.entities.filter((entity) => entity.id !== entityId),
        }));
    };

    const renderPackStep = () => (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                    <span className="mb-2 block text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                        Pack
                    </span>
                    <select
                        value={draft.scopeId}
                        onChange={(event) => handleScopeChange(event.target.value)}
                        className="w-full border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-osint-primary"
                    >
                        {allScopes.map((scope) => (
                            <option key={scope.id} value={scope.id}>
                                {scope.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="mb-2 block text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                        Purpose
                    </span>
                    <select
                        value={draft.purposeId}
                        onChange={(event) => {
                            const nextPurpose = getPurposeProfileById(event.target.value);
                            setDraft((current) => ({
                                ...current,
                                purposeId: nextPurpose.id,
                                artifactType: nextPurpose.recommendedArtifactType,
                            }));
                        }}
                        className="w-full border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-osint-primary"
                    >
                        {supportedPurposes.map((purpose) => (
                            <option key={purpose.id} value={purpose.id}>
                                {purpose.name}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                    <span className="mb-2 block text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                        Output Shape
                    </span>
                    <select
                        value={draft.artifactType}
                        onChange={(event) =>
                            setDraft((current) => ({
                                ...current,
                                artifactType: event.target.value as GuidedRunDraft['artifactType'],
                            }))
                        }
                        className="w-full border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-osint-primary"
                    >
                        {[selectedPurpose.recommendedArtifactType, 'REPORT', 'SYNTHESIS', 'BRIEF', 'DIGEST', 'COMPARISON', 'TIMELINE', 'MONITOR_SNAPSHOT', 'NOTE']
                            .filter((value, index, array) => array.indexOf(value) === index)
                            .map((artifactType) => (
                                <option key={artifactType} value={artifactType}>
                                    {artifactType}
                                </option>
                            ))}
                    </select>
                </label>
                <label className="block">
                    <span className="mb-2 block text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                        Workspace Intent
                    </span>
                    <select
                        value={draft.workspaceIntent}
                        onChange={(event) =>
                            setDraft((current) => ({
                                ...current,
                                workspaceIntent: event.target.value as GuidedRunDraft['workspaceIntent'],
                            }))
                        }
                        className="w-full border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-osint-primary"
                    >
                        <option value="CURRENT">{workspace?.title || 'Current workspace'}</option>
                        <option value="NEW">New workspace</option>
                    </select>
                </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                    <span className="mb-2 block text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                        Date From
                    </span>
                    <input
                        type="date"
                        value={draft.dateRange?.start || ''}
                        onChange={(event) =>
                            setDraft((current) => ({
                                ...current,
                                dateRange: {
                                    ...current.dateRange,
                                    start: event.target.value || undefined,
                                },
                            }))
                        }
                        className="w-full border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-osint-primary"
                    />
                </label>
                <label className="block">
                    <span className="mb-2 block text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                        Date To
                    </span>
                    <input
                        type="date"
                        value={draft.dateRange?.end || ''}
                        onChange={(event) =>
                            setDraft((current) => ({
                                ...current,
                                dateRange: {
                                    ...current.dateRange,
                                    end: event.target.value || undefined,
                                },
                            }))
                        }
                        className="w-full border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-osint-primary"
                    />
                </label>
            </div>
        </div>
    );

    const renderTargetStep = () => (
        <textarea
            value={draft.topic}
            onChange={(event) => setDraft((current) => ({ ...current, topic: event.target.value }))}
            placeholder="What should Sherlock analyze, compare, or monitor?"
            className="h-32 w-full resize-none border border-zinc-700 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-osint-primary"
        />
    );

    const renderAngleStep = () => (
        <textarea
            value={draft.angle}
            onChange={(event) => setDraft((current) => ({ ...current, angle: event.target.value }))}
            placeholder="Optional: frame the run around a hypothesis, comparison, decision, or risk."
            className="h-28 w-full resize-none border border-zinc-700 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-osint-primary"
        />
    );

    const renderEntitiesStep = () => (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row">
                <input
                    value={newEntityName}
                    onChange={(event) => setNewEntityName(event.target.value)}
                    placeholder="Entity, source, or concept"
                    className="flex-1 border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-osint-primary"
                />
                <select
                    value={newEntityType}
                    onChange={(event) => setNewEntityType(event.target.value as GraphNodeSubtype)}
                    className="border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-osint-primary"
                >
                    {ENTITY_TYPES.map((entityType) => (
                        <option key={entityType} value={entityType}>
                            {entityType}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={handleAddEntity}
                    className="inline-flex items-center justify-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono uppercase tracking-wide text-zinc-200 transition hover:border-osint-primary hover:text-white"
                >
                    <Plus className="h-4 w-4" />
                    Add
                </button>
            </div>
            <div className="space-y-2">
                {draft.entities.length === 0 ? (
                    <div className="border border-dashed border-zinc-800 p-3 text-sm text-zinc-500">
                        No seeded entities yet.
                    </div>
                ) : (
                    draft.entities.map((entity) => (
                        <div
                            key={entity.id}
                            className="flex items-center justify-between border border-zinc-800 bg-zinc-950/70 px-3 py-2"
                        >
                            <div className="text-sm text-zinc-200">
                                {entity.name} <span className="text-xs text-zinc-500">{entity.type}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveEntity(entity.id)}
                                className="text-zinc-500 transition hover:text-red-400"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderSourcesStep = () => (
        <div className="space-y-4">
            <textarea
                value={draft.prioritySources}
                onChange={(event) =>
                    setDraft((current) => ({
                        ...current,
                        prioritySources: event.target.value,
                    }))
                }
                placeholder="Domains, handles, registries, or publications to emphasize"
                className="h-28 w-full resize-none border border-zinc-700 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-osint-primary"
            />
            {selectedScope?.suggestedSources?.length ? (
                <div className="flex flex-wrap gap-2">
                    {selectedScope.suggestedSources
                        .slice(0, 3)
                        .flatMap((category) => category.sources.slice(0, 3))
                        .map((source) => (
                            <button
                                key={source.label}
                                type="button"
                                onClick={() =>
                                    setDraft((current) => ({
                                        ...current,
                                        prioritySources: [current.prioritySources, source.label]
                                            .filter(Boolean)
                                            .join(current.prioritySources ? ', ' : ''),
                                    }))
                                }
                                className="border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[11px] text-zinc-300 transition hover:border-osint-primary hover:text-white"
                            >
                                {source.label}
                            </button>
                        ))}
                </div>
            ) : null}
        </div>
    );

    const renderConfigStep = () => (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                    <span className="mb-2 block text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                        Persona
                    </span>
                    <select
                        value={draft.persona}
                        onChange={(event) =>
                            setDraft((current) => ({ ...current, persona: event.target.value }))
                        }
                        className="w-full border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-osint-primary"
                    >
                        {selectedScope.personas.map((persona) => (
                            <option key={persona.id} value={persona.id}>
                                {persona.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="mb-2 block text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                        Provider
                    </span>
                    <select
                        value={draft.provider}
                        onChange={(event) =>
                            handleProviderChange(event.target.value as GuidedRunDraft['provider'])
                        }
                        className="w-full border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-osint-primary"
                    >
                        {AI_PROVIDERS.filter((provider) => provider.capabilities.runtimeStatus === 'ACTIVE').map(
                            (provider) => (
                                <option key={provider.id} value={provider.id}>
                                    {provider.label}
                                </option>
                            )
                        )}
                    </select>
                </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                    <span className="mb-2 block text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                        Model
                    </span>
                    <select
                        value={draft.modelId}
                        onChange={(event) =>
                            setDraft((current) => ({ ...current, modelId: event.target.value }))
                        }
                        className="w-full border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-osint-primary"
                    >
                        {selectableModels.map((model) => (
                            <option key={model.id} value={model.id}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="mb-2 block text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                        Scan Depth
                    </span>
                    <select
                        value={draft.searchDepth}
                        onChange={(event) =>
                            setDraft((current) => ({
                                ...current,
                                searchDepth: event.target.value as GuidedRunDraft['searchDepth'],
                            }))
                        }
                        className="w-full border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-osint-primary"
                    >
                        <option value="STANDARD">Standard</option>
                        <option value="DEEP">Deep</option>
                    </select>
                </label>
            </div>
            <label className="block">
                <span className="mb-2 block text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                    Thinking Budget
                </span>
                <input
                    type="range"
                    min={0}
                    max={8192}
                    step={512}
                    disabled={!(providerMeta?.capabilities.supportsThinkingBudget ?? false)}
                    value={providerMeta?.capabilities.supportsThinkingBudget ? draft.thinkingBudget : 0}
                    onChange={(event) =>
                        setDraft((current) => ({
                            ...current,
                            thinkingBudget: Number(event.target.value),
                        }))
                    }
                    className="w-full accent-[var(--osint-primary)] disabled:opacity-40"
                />
            </label>
        </div>
    );

    const renderReviewStep = () => (
        <div className="space-y-4">
            <div className="border border-zinc-800 bg-zinc-950/70 p-4 text-sm leading-6 text-zinc-200">
                <pre className="whitespace-pre-wrap font-sans">
                    {buildGuidedReviewMarkdown(draft, customScopes, workspace)}
                </pre>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
                <button
                    type="button"
                    onClick={onLaunchRun}
                    disabled={isBusy}
                    className="osint-button-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wide disabled:opacity-50"
                >
                    <Sparkles className="h-4 w-4" />
                    Launch Run
                </button>
                <button
                    type="button"
                    onClick={onSaveDraft}
                    disabled={isBusy}
                    className="osint-button-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wide disabled:opacity-50"
                >
                    <Target className="h-4 w-4" />
                    Save Brief
                </button>
                <button
                    type="button"
                    onClick={onOpenManualSetup}
                    disabled={isBusy}
                    className="osint-button-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wide disabled:opacity-50"
                >
                    <Cpu className="h-4 w-4" />
                    Open Manual Setup
                </button>
            </div>
        </div>
    );

    return (
        <section className="border-t border-zinc-800 bg-zinc-950/90 px-4 py-4 sm:px-6">
            <div className="mx-auto max-w-4xl">
                <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-[0.24em] text-zinc-500">
                    <Sparkles className="h-4 w-4 text-osint-primary" />
                    Guided Run Builder
                    <span className="text-zinc-700">/</span>
                    <span>{state.step}</span>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                    {GUIDED_STEP_ORDER.map((step, index) => (
                        <span
                            key={step}
                            className={`px-2 py-1 text-[10px] font-mono uppercase ${
                                step === state.step
                                    ? 'osint-button-soft'
                                    : index < currentStepIndex
                                      ? 'osint-button-primary'
                                      : 'border-zinc-800 bg-black text-zinc-600'
                            }`}
                        >
                            {step}
                        </span>
                    ))}
                </div>

                <div className="rounded-none border border-zinc-800 bg-black/50 p-4">
                    {state.step === 'PACK' && renderPackStep()}
                    {state.step === 'TARGET' && renderTargetStep()}
                    {state.step === 'ANGLE' && renderAngleStep()}
                    {state.step === 'ENTITIES' && renderEntitiesStep()}
                    {state.step === 'SOURCES' && renderSourcesStep()}
                    {state.step === 'CONFIG' && renderConfigStep()}
                    {state.step === 'REVIEW' && renderReviewStep()}
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={currentStepIndex === 0 || isBusy}
                        className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-2 text-xs font-mono uppercase tracking-wide text-zinc-300 transition hover:border-white hover:text-white disabled:opacity-30"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </button>
                    {state.step !== 'REVIEW' ? (
                        <button
                            type="button"
                            onClick={() => onAdvance(draft)}
                            disabled={!canAdvance || isBusy}
                            className="osint-button-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wide disabled:opacity-50"
                        >
                            {state.step === 'TARGET' ? <Target className="h-4 w-4" /> : null}
                            {state.step === 'ANGLE' ? <Lightbulb className="h-4 w-4" /> : null}
                            {state.step === 'ENTITIES' ? <Shapes className="h-4 w-4" /> : null}
                            {state.step === 'SOURCES' ? <Globe className="h-4 w-4" /> : null}
                            {state.step === 'CONFIG' ? <Cpu className="h-4 w-4" /> : null}
                            Continue
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>
            </div>
        </section>
    );
};
