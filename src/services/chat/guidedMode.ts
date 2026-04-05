import type {
  ArtifactType,
  Workspace,
  ChatDraftArtifact,
  GraphNodeSubtype,
  InvestigationLaunchRequest,
  Artifact,
  InvestigationRunConfig,
  InvestigationScope,
  ManualNode,
  SystemConfig,
} from '@/types';
import { getAllScopes, getScopeById } from '../../data/presets';
import {
  buildArtifactSections,
  getDomainPackForScope,
  getLabelProfileById,
  getPurposeProfileById,
  getTaskSetupCopy,
} from '../../domain';
import { loadSystemConfig } from '../../config/systemConfig';
import { getDefaultModelForProvider, getModelProvider } from '../../config/aiModels';
import { createLocalId } from '../../utils/id';

export type GuidedStepId =
  | 'PACK'
  | 'TARGET'
  | 'ANGLE'
  | 'ENTITIES'
  | 'SOURCES'
  | 'CONFIG'
  | 'REVIEW';

export interface GuidedEntityInput {
  id: string;
  name: string;
  type: GraphNodeSubtype;
}

export interface GuidedRunDraft {
  scopeId: string;
  purposeId: string;
  artifactType: ArtifactType;
  workspaceIntent: 'CURRENT' | 'NEW';
  topic: string;
  angle: string;
  entities: GuidedEntityInput[];
  prioritySources: string;
  provider: SystemConfig['provider'];
  modelId: string;
  persona: string;
  searchDepth: SystemConfig['searchDepth'];
  generationMode: 'SINGLE_PASS' | 'STAGED';
  thinkingBudget: number;
  dateRange?: { start?: string; end?: string };
}

export interface GuidedSessionState {
  mode: 'GUIDED';
  step: GuidedStepId;
  draft: GuidedRunDraft;
  completedAt?: number;
}

export const GUIDED_STEP_ORDER: GuidedStepId[] = [
  'PACK',
  'TARGET',
  'ANGLE',
  'ENTITIES',
  'SOURCES',
  'CONFIG',
  'REVIEW',
];

const resolveScope = (
  scopeId: string | undefined,
  customScopes: InvestigationScope[]
): InvestigationScope => {
  return (
    getScopeById(scopeId || '') ||
    getAllScopes(customScopes).find((scope) => scope.id === scopeId) ||
    getAllScopes(customScopes)[0]
  );
};

const resolveDomainProfile = (draft: GuidedRunDraft, customScopes: InvestigationScope[]) => {
  const scope = resolveScope(draft.scopeId, customScopes);
  const pack = getDomainPackForScope(scope, customScopes);
  const purpose = getPurposeProfileById(draft.purposeId || pack.defaultPurposeId);
  const labelProfile = getLabelProfileById(pack.labelProfileId);
  const setupCopy = getTaskSetupCopy(pack, purpose, labelProfile);

  return { scope, pack, purpose, labelProfile, setupCopy };
};

export const createDefaultGuidedSessionState = (
  workspace?: Workspace | null,
  customScopes: InvestigationScope[] = []
): GuidedSessionState => {
  const systemConfig = loadSystemConfig();
  const scope = resolveScope(workspace?.scopeId, customScopes);
  const pack = getDomainPackForScope(scope, customScopes);
  const purpose = getPurposeProfileById(workspace?.purposeId || pack.defaultPurposeId);
  const provider = systemConfig.provider || getModelProvider(systemConfig.modelId);
  const modelId = systemConfig.modelId || getDefaultModelForProvider(provider);

  return {
    mode: 'GUIDED',
    step: 'PACK',
    draft: {
      scopeId: scope.id,
      purposeId: purpose.id,
      artifactType: purpose.recommendedArtifactType,
      workspaceIntent: 'CURRENT',
      topic: '',
      angle: '',
      entities: [],
      prioritySources: '',
      provider,
      modelId,
      persona:
        scope.defaultPersona ||
        scope.personas[0]?.id ||
        systemConfig.persona ||
        'general-investigator',
      searchDepth: systemConfig.searchDepth === 'DEEP' ? 'DEEP' : 'STANDARD',
      generationMode: systemConfig.generationMode === 'SINGLE_PASS' ? 'SINGLE_PASS' : 'STAGED',
      thinkingBudget: systemConfig.thinkingBudget ?? 0,
      dateRange: undefined,
    },
  };
};

export const isGuidedSessionState = (value: unknown): value is GuidedSessionState => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<GuidedSessionState>;
  return record.mode === 'GUIDED' && typeof record.step === 'string' && !!record.draft;
};

export const getNextGuidedStep = (step: GuidedStepId): GuidedStepId => {
  const index = GUIDED_STEP_ORDER.indexOf(step);
  return GUIDED_STEP_ORDER[Math.min(index + 1, GUIDED_STEP_ORDER.length - 1)];
};

export const getPreviousGuidedStep = (step: GuidedStepId): GuidedStepId => {
  const index = GUIDED_STEP_ORDER.indexOf(step);
  return GUIDED_STEP_ORDER[Math.max(index - 1, 0)];
};

export const getGuidedAssistantPrompt = (
  state: GuidedSessionState,
  customScopes: InvestigationScope[],
  workspace?: Workspace | null
): string => {
  const { pack, purpose, labelProfile, setupCopy } = resolveDomainProfile(
    state.draft,
    customScopes
  );

  switch (state.step) {
    case 'PACK':
      return `Let's shape this run for **${workspace?.title || labelProfile.workspaceLabel}**.\n\nChoose the pack, purpose, output type, and whether the result should stay in the current workspace or branch into a new one.`;
    case 'TARGET':
      return `Now define the core target.\n\nAdd the ${setupCopy.targetLabel.toLowerCase()} so Sherlock knows exactly what question, topic, or entity to work on.`;
    case 'ANGLE':
      return `Add optional direction for the run.\n\nA strong ${setupCopy.angleLabel.toLowerCase()} helps Sherlock emphasize the right lens without changing the core target.`;
    case 'ENTITIES':
      return `Seed the most important people, organizations, sources, or concepts.\n\nThese become early anchors for retrieval and later follow-up work.`;
    case 'SOURCES':
      return `Set any source priorities.\n\nYou can keep this empty, or name domains, handles, registries, and publications Sherlock should privilege.`;
    case 'CONFIG':
      return `Finish the runtime profile.\n\nReview provider, model, persona, and scan depth before we turn this into a launch-ready run config.`;
    case 'REVIEW':
      return `The guided brief is ready.\n\n${buildGuidedReviewMarkdown(state.draft, customScopes, workspace)}`;
    default:
      return `Guided mode is ready for **${pack.name} / ${purpose.name}**.`;
  }
};

export const summarizeGuidedStep = (
  step: GuidedStepId,
  draft: GuidedRunDraft,
  customScopes: InvestigationScope[]
): string => {
  const { scope, purpose, labelProfile } = resolveDomainProfile(draft, customScopes);

  switch (step) {
    case 'PACK':
      return `Pack: **${scope.name}**\nPurpose: **${purpose.name}**\nOutput: **${draft.artifactType}**\nWorkspace intent: **${draft.workspaceIntent}**`;
    case 'TARGET':
      return `Target: ${draft.topic.trim() || 'Not set yet.'}`;
    case 'ANGLE':
      return draft.angle.trim()
        ? `${labelProfile.artifactLabel} angle: ${draft.angle.trim()}`
        : 'No additional angle was added.';
    case 'ENTITIES':
      return draft.entities.length > 0
        ? `Seeded entities: ${draft.entities.map((entity) => `\`${entity.name}\` (${entity.type})`).join(', ')}`
        : 'No entities were seeded.';
    case 'SOURCES':
      return draft.prioritySources.trim()
        ? `Priority sources: ${draft.prioritySources.trim()}`
        : 'No explicit source priorities were added.';
    case 'CONFIG':
      return `Provider: **${draft.provider}**\nModel: **${draft.modelId}**\nPersona: **${draft.persona}**\nDepth: **${draft.searchDepth}**\nGeneration: **${draft.generationMode}**`;
    case 'REVIEW':
      return buildGuidedReviewMarkdown(draft, customScopes);
    default:
      return '';
  }
};

const buildGuidedTopic = (draft: GuidedRunDraft): string => {
  let topic = draft.topic.trim();
  if (draft.angle.trim()) {
    topic = `${topic}\n\n[RUN_ANGLE]: ${draft.angle.trim()}`;
  }
  if (draft.prioritySources.trim()) {
    topic = `${topic}\n\n[PRIORITY_SOURCES]: ${draft.prioritySources.trim()}`;
  }
  return topic;
};

const buildPreseededEntities = (draft: GuidedRunDraft): ManualNode[] | undefined => {
  const entities = draft.entities.map((entity) => ({
    id: entity.id,
    label: entity.name,
    type: 'ENTITY' as const,
    subtype: entity.type,
    timestamp: Date.now(),
  }));

  return entities.length > 0 ? entities : undefined;
};

export const buildLaunchRequestFromGuidedDraft = (
  draft: GuidedRunDraft,
  customScopes: InvestigationScope[],
  workspace?: Workspace | null
): InvestigationLaunchRequest => {
  const { pack, purpose, labelProfile } = resolveDomainProfile(draft, customScopes);
  const scope = resolveScope(draft.scopeId, customScopes);
  const configOverride: Partial<SystemConfig> & Partial<InvestigationRunConfig> = {
    provider: draft.provider,
    modelId: draft.modelId,
    persona: draft.persona,
    searchDepth: draft.searchDepth,
    generationMode: draft.generationMode,
    thinkingBudget: draft.thinkingBudget,
    scopeId: scope.id,
    scopeName: scope.name,
    packId: pack.id,
    packName: pack.name,
    purposeId: purpose.id,
    purposeName: purpose.name,
    artifactType: draft.artifactType,
    labelProfileId: labelProfile.id,
  };

  return {
    topic: buildGuidedTopic(draft),
    parentContext:
      draft.workspaceIntent === 'CURRENT' && workspace
        ? {
            topic: workspace.title,
            summary: workspace.description || `${workspace.title} workspace`,
          }
        : undefined,
    configOverride,
    scope,
    packId: pack.id,
    purposeId: purpose.id,
    artifactType: draft.artifactType,
    labelProfileId: labelProfile.id,
    dateRangeOverride:
      draft.dateRange?.start || draft.dateRange?.end
        ? {
            start: draft.dateRange.start || undefined,
            end: draft.dateRange.end || undefined,
          }
        : undefined,
    preseededEntities: buildPreseededEntities(draft),
    switchToView: true,
    launchSource: 'CHAT_GUIDED_RUN',
  };
};

export const buildGuidedReviewMarkdown = (
  draft: GuidedRunDraft,
  customScopes: InvestigationScope[],
  workspace?: Workspace | null
): string => {
  const { pack, purpose, labelProfile } = resolveDomainProfile(draft, customScopes);
  const entityLine =
    draft.entities.length > 0
      ? draft.entities.map((entity) => `${entity.name} (${entity.type})`).join(', ')
      : 'None';
  const sourceLine = draft.prioritySources.trim() || 'Default pack sources';
  const dateLine =
    draft.dateRange?.start || draft.dateRange?.end
      ? `${draft.dateRange.start || 'Open'} to ${draft.dateRange.end || 'Open'}`
      : 'Open date range';

  return [
    `- Workspace intent: **${draft.workspaceIntent === 'CURRENT' ? workspace?.title || 'Current workspace' : 'New workspace'}**`,
    `- Pack: **${pack.name}**`,
    `- Purpose: **${purpose.name}**`,
    `- Output shape: **${draft.artifactType}**`,
    `- Target: ${draft.topic.trim() || 'Not set'}`,
    `- Angle: ${draft.angle.trim() || 'No extra angle'}`,
    `- Entities: ${entityLine}`,
    `- Sources: ${sourceLine}`,
    `- Dates: ${dateLine}`,
    `- Runtime: **${draft.provider} / ${draft.modelId} / ${draft.searchDepth} / ${draft.generationMode}**`,
    `- Persona: **${draft.persona}**`,
    `- Label profile: **${labelProfile.workspaceLabel} / ${labelProfile.artifactLabel}**`,
  ].join('\n');
};

export const buildArtifactDraftFromGuidedDraft = (
  draft: GuidedRunDraft,
  customScopes: InvestigationScope[],
  workspace?: Workspace | null
): { draftArtifact: ChatDraftArtifact; report: Artifact } => {
  const now = Date.now();
  const { pack, purpose, labelProfile } = resolveDomainProfile(draft, customScopes);
  const title = `${labelProfile.artifactLabel} Brief: ${draft.topic.trim() || purpose.name}`;
  const content = buildGuidedReviewMarkdown(draft, customScopes, workspace);
  const draftArtifact: ChatDraftArtifact = {
    id: createLocalId('guided-draft'),
    workspaceId: workspace?.id || createLocalId('workspace'),
    sourceMessageId: createLocalId('guided-source'),
    title,
    content,
    artifactType: draft.artifactType,
    metadata: {
      source: 'GUIDED_CHAT',
      packId: pack.id,
      purposeId: purpose.id,
    },
    createdAt: now,
  };

  return {
    draftArtifact,
    report: {
      id: createLocalId('rep'),
      caseId: workspace?.id,
      topic: title,
      dateStr: new Date(now).toLocaleDateString(),
      summary: `Guided run brief for ${draft.topic.trim() || purpose.name}`,
      agendas: [],
      leads: [],
      followUps: [],
      sections: buildArtifactSections({
        sections: [
          {
            kind: 'EXECUTIVE_SUMMARY',
            title: 'Guided Brief',
            content,
          },
          {
            kind: 'NEXT_STEPS',
            title: 'Next Steps',
            items: ['Launch the run when ready.', 'Adjust inputs manually if the target changes.'],
          },
        ],
        summary: content,
        artifactType: draft.artifactType,
      }),
      artifactType: draft.artifactType,
      entities: [],
      sources: [],
      rawText: JSON.stringify({ draft, review: content }, null, 2),
      packId: pack.id,
      purposeId: purpose.id,
      labelProfileId: labelProfile.id,
      metadata: {
        source: 'GUIDED_CHAT',
        workspaceIntent: draft.workspaceIntent,
      },
      config: buildLaunchRequestFromGuidedDraft(draft, customScopes, workspace)
        .configOverride as InvestigationRunConfig,
    },
  };
};
