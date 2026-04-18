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
import { DateRangePicker } from '@/components/system/controls';
import type { Workspace, GraphNodeSubtype, InvestigationScope } from '@/types';
import { getAllScopes } from '../../../data/presets';
import { getDomainPackForScope, getPurposeProfileById, getWorkspaceDisplayTitle } from '../../../domain';
import {
  buildGuidedReviewMarkdown,
  GUIDED_STEP_ORDER,
  type GuidedRunDraft,
  type GuidedSessionState,
} from '../../../services/chat/guidedMode';
import { OsintSelect } from '../../ui/OsintSelect';
import { createLocalId } from '../../../utils/id';
import { ProviderModelSelector } from '../Runs/ProviderModelSelector';
import { RuntimeConfigBehaviorControls } from '../Runs/RuntimeConfigBehaviorControls';
import { useRuntimeConfigForm } from '../Runs/useRuntimeConfigForm';

interface GuidedRunBuilderProps {
  state: GuidedSessionState;
  customScopes: InvestigationScope[];
  workspace?: Workspace | null;
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
  const [draft, setDraft] = useState<GuidedRunDraft>({
    ...state.draft,
    generationMode: state.draft.generationMode === 'SINGLE_PASS' ? 'SINGLE_PASS' : 'STAGED',
  });
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
  const runtimeConfigForm = useRuntimeConfigForm({
    value: {
      provider: draft.provider,
      modelId: draft.modelId,
      searchDepth: draft.searchDepth,
      generationMode: draft.generationMode,
      thinkingBudget: draft.thinkingBudget,
    },
    onChange: (nextValue) =>
      setDraft((current) => ({
        ...current,
        ...nextValue,
      })),
  });
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
          <span className="mb-2 block osint-meta-label">
            Pack
          </span>
          <OsintSelect
            ariaLabel="Pack"
            value={draft.scopeId}
            onChange={handleScopeChange}
            triggerClassName="px-3 py-2 pr-8 osint-meta-value"
            options={allScopes.map((scope) => ({
              value: scope.id,
              label: scope.name,
            }))}
          />
        </label>
        <label className="block">
          <span className="mb-2 block osint-meta-label">
            Purpose
          </span>
          <OsintSelect
            ariaLabel="Purpose"
            value={draft.purposeId}
            onChange={(value) => {
              const nextPurpose = getPurposeProfileById(value);
              setDraft((current) => ({
                ...current,
                purposeId: nextPurpose.id,
                artifactType: nextPurpose.recommendedArtifactType,
              }));
            }}
            triggerClassName="px-3 py-2 pr-8 osint-meta-value"
            options={supportedPurposes.map((purpose) => ({
              value: purpose.id,
              label: purpose.name,
            }))}
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block osint-meta-label">
            Output Shape
          </span>
          <OsintSelect
            ariaLabel="Output shape"
            value={draft.artifactType}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                artifactType: value as GuidedRunDraft['artifactType'],
              }))
            }
            triggerClassName="px-3 py-2 pr-8 osint-meta-value"
            options={[
              selectedPurpose.recommendedArtifactType,
              'REPORT',
              'SYNTHESIS',
              'BRIEF',
              'DIGEST',
              'COMPARISON',
              'TIMELINE',
              'MONITOR_SNAPSHOT',
              'NOTE',
            ]
              .filter((value, index, array) => array.indexOf(value) === index)
              .map((artifactType) => ({
                value: artifactType,
                label: artifactType,
              }))}
          />
        </label>
        <label className="block">
          <span className="mb-2 block osint-meta-label">
            Workspace Intent
          </span>
          <OsintSelect
            ariaLabel="Workspace intent"
            value={draft.workspaceIntent}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                workspaceIntent: value as GuidedRunDraft['workspaceIntent'],
              }))
            }
            triggerClassName="px-3 py-2 pr-8 osint-meta-value"
            options={[
              {
                value: 'CURRENT',
                label: workspace ? getWorkspaceDisplayTitle(workspace) : 'Current workspace',
              },
              { value: 'NEW', label: 'New workspace' },
            ]}
          />
        </label>
      </div>
      <DateRangePicker
        value={draft.dateRange || {}}
        onChange={(nextValue) =>
          setDraft((current) => ({
            ...current,
            dateRange: nextValue.start || nextValue.end ? nextValue : undefined,
          }))
        }
        label="Date Range"
        className="md:max-w-xl"
        inputClassName="bg-black text-zinc-200"
      />
    </div>
  );

  const renderTargetStep = () => (
    <textarea
      value={draft.topic}
      onChange={(event) => setDraft((current) => ({ ...current, topic: event.target.value }))}
      placeholder="What should Sherlock analyze, compare, or monitor?"
      className="h-32 w-full resize-none border border-zinc-700 bg-black px-4 py-3 osint-body-small text-white outline-none transition focus:border-osint-primary"
    />
  );

  const renderAngleStep = () => (
    <textarea
      value={draft.angle}
      onChange={(event) => setDraft((current) => ({ ...current, angle: event.target.value }))}
      placeholder="Optional: frame the run around a hypothesis, comparison, decision, or risk."
      className="h-28 w-full resize-none border border-zinc-700 bg-black px-4 py-3 osint-body-small text-white outline-none transition focus:border-osint-primary"
    />
  );

  const renderEntitiesStep = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row">
        <input
          value={newEntityName}
          onChange={(event) => setNewEntityName(event.target.value)}
          placeholder="Entity, source, or concept"
          className="flex-1 border border-zinc-700 bg-black px-3 py-2 osint-body-small text-white outline-none focus:border-osint-primary"
        />
        <div className="md:w-48">
          <OsintSelect
            ariaLabel="Entity type"
            value={newEntityType}
            onChange={(value) => setNewEntityType(value as GraphNodeSubtype)}
            triggerClassName="px-3 py-2 pr-8 osint-meta-value"
            options={ENTITY_TYPES.map((entityType) => ({
              value: entityType,
              label: entityType,
            }))}
          />
        </div>
        <button
          type="button"
          onClick={handleAddEntity}
          className="inline-flex items-center justify-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-2 osint-meta-label-strong text-zinc-200 transition hover:border-osint-primary hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
      <div className="space-y-2">
        {draft.entities.length === 0 ? (
          <div className="border border-dashed border-zinc-800 p-3 osint-body-quiet">
            No seeded entities yet.
          </div>
        ) : (
          draft.entities.map((entity) => (
            <div
              key={entity.id}
              className="flex items-center justify-between border border-zinc-800 bg-zinc-950/70 px-3 py-2"
            >
              <div className="osint-body-small text-zinc-200">
                {entity.name} <span className="osint-meta-label text-zinc-500">{entity.type}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveEntity(entity.id)}
                className="text-zinc-500 transition osint-danger-inline"
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
      className="h-28 w-full resize-none border border-zinc-700 bg-black px-4 py-3 osint-body-small text-white outline-none transition focus:border-osint-primary"
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
                className="border border-zinc-800 bg-zinc-900/60 px-2 py-1 osint-meta-label text-zinc-300 transition hover:border-osint-primary hover:text-white"
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
          <span className="mb-2 block osint-meta-label">
            Persona
          </span>
          <OsintSelect
            ariaLabel="Persona"
            value={draft.persona}
            onChange={(value) => setDraft((current) => ({ ...current, persona: value }))}
            triggerClassName="px-3 py-2 pr-8 osint-meta-value"
            options={selectedScope.personas.map((persona) => ({
              value: persona.id,
              label: persona.label,
            }))}
          />
        </label>
      </div>
      <ProviderModelSelector form={runtimeConfigForm} />
      <RuntimeConfigBehaviorControls
        form={runtimeConfigForm}
        thinkingBudgetClassName="border border-zinc-800 bg-zinc-900/30 p-4 md:col-span-2"
      />
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-4">
      <div className="border border-zinc-800 bg-zinc-950/70 p-4 osint-body-small text-zinc-200">
        <pre className="whitespace-pre-wrap font-sans">
          {buildGuidedReviewMarkdown(draft, customScopes, workspace)}
        </pre>
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <button
          type="button"
          onClick={onLaunchRun}
          disabled={isBusy}
          className="osint-button-primary inline-flex items-center justify-center gap-2 px-4 py-2 osint-meta-label-strong disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          Launch Run
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isBusy}
          className="osint-button-primary inline-flex items-center justify-center gap-2 px-4 py-2 osint-meta-label-strong disabled:opacity-50"
        >
          <Target className="h-4 w-4" />
          Save Brief
        </button>
        <button
          type="button"
          onClick={onOpenManualSetup}
          disabled={isBusy}
          className="osint-button-primary inline-flex items-center justify-center gap-2 px-4 py-2 osint-meta-label-strong disabled:opacity-50"
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
        <div className="mb-4 flex flex-wrap items-center gap-2 osint-meta-label text-zinc-500">
          <Sparkles className="h-4 w-4 text-osint-primary" />
          Guided Run Builder
          <span className="text-zinc-700">/</span>
          <span>{state.step}</span>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {GUIDED_STEP_ORDER.map((step, index) => (
            <span
              key={step}
              className={`px-2 py-1 osint-meta-label ${
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
            className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-2 osint-meta-label text-zinc-300 transition hover:border-white hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          {state.step !== 'REVIEW' ? (
            <button
              type="button"
              onClick={() => onAdvance(draft)}
              disabled={!canAdvance || isBusy}
              className="osint-button-primary inline-flex items-center gap-2 px-4 py-2 osint-meta-label-strong disabled:opacity-50"
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
