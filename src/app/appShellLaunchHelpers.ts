import type {
  Artifact,
  InvestigationLaunchRequest,
  InvestigationRunConfig,
  InvestigationScope,
  ManualNode,
  SystemConfig,
  WorkspaceRun,
} from '@/types';

interface BuildRunConfigInput {
  artifactType: InvestigationRunConfig['artifactType'];
  effectiveConfig: SystemConfig;
  effectivePack: { id: string; name: string };
  effectivePurpose: { id: string; name: string };
  effectiveScope?: InvestigationScope;
  labelProfileId?: string;
  launchRequest: InvestigationLaunchRequest;
}

export const buildLaunchRunConfig = ({
  artifactType,
  effectiveConfig,
  effectivePack,
  effectivePurpose,
  effectiveScope,
  labelProfileId,
  launchRequest,
}: BuildRunConfigInput): InvestigationRunConfig => ({
  provider: effectiveConfig.provider,
  modelId: effectiveConfig.modelId,
  persona: effectiveConfig.persona,
  searchDepth: effectiveConfig.searchDepth,
  thinkingBudget: effectiveConfig.thinkingBudget,
  scopeId: effectiveScope?.id,
  scopeName: effectiveScope?.name,
  packId: effectivePack.id,
  packName: effectivePack.name,
  purposeId: effectivePurpose.id,
  purposeName: effectivePurpose.name,
  artifactType,
  labelProfileId,
  dateRangeOverride: launchRequest.dateRangeOverride,
  preseededEntities: launchRequest.preseededEntities,
  launchSource: launchRequest.launchSource,
  sourceSignalId: launchRequest.sourceSignalId,
  sourceFollowUpId: launchRequest.sourceFollowUpId,
  parentArtifactId: launchRequest.parentArtifactId,
  parentRunId: launchRequest.parentRunId,
});

interface BuildWorkspaceRunInput {
  launchRequest: InvestigationLaunchRequest;
  runConfig: InvestigationRunConfig;
  runId: string;
  timestamp?: number;
}

export const buildWorkspaceRun = ({
  launchRequest,
  runConfig,
  runId,
  timestamp,
}: BuildWorkspaceRunInput): WorkspaceRun => ({
  id: runId,
  topic: launchRequest.topic,
  status: 'RUNNING',
  startTime: timestamp ?? Date.now(),
  parentContext: launchRequest.parentContext,
  config: runConfig,
  launchRequest,
});

export const mergeArchivedReportRunConfig = (
  report: Artifact,
  runConfig: InvestigationRunConfig,
  runId: string
): Artifact => ({
  ...report,
  config: {
    ...(report.config || {}),
    ...runConfig,
    sourceRunId: runId,
  },
});

interface MergePreseededEntitiesInput {
  existingNodes: ManualNode[];
  preseededEntities?: ManualNode[];
  runId: string;
  timestamp?: number;
}

export const mergePreseededEntities = ({
  existingNodes,
  preseededEntities,
  runId,
  timestamp,
}: MergePreseededEntitiesInput): ManualNode[] => {
  if (!preseededEntities?.length) {
    return existingNodes;
  }

  const nextNodes = [...existingNodes];
  const seededAt = timestamp ?? Date.now();

  preseededEntities.forEach((entity, index) => {
    const nodeId = `seed-${runId}-${index}`;
    if (nextNodes.some((node) => node.id === nodeId)) return;
    nextNodes.push({
      ...entity,
      id: nodeId,
      timestamp: seededAt,
    });
  });

  return nextNodes;
};
