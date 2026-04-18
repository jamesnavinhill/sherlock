import type { Artifact, InvestigationLaunchRequest, WorkspaceRun } from '@/types';

const findArtifactById = (artifacts: Artifact[], artifactId?: string) =>
  artifactId ? artifacts.find((artifact) => artifact.id === artifactId) : undefined;

const findRunById = (runs: WorkspaceRun[], runId?: string) =>
  runId ? runs.find((run) => run.id === runId) : undefined;

const findRunProducingArtifact = (runs: WorkspaceRun[], artifactId?: string) => {
  if (!artifactId) return undefined;

  return runs.find(
    (run) => run.artifact?.id === artifactId || run.config?.producedArtifactId === artifactId
  );
};

const findArtifactProducedByRun = (artifacts: Artifact[], run?: WorkspaceRun) => {
  if (!run) return undefined;

  const explicitArtifactId = run.config?.producedArtifactId || run.artifact?.id;
  if (explicitArtifactId) {
    return findArtifactById(artifacts, explicitArtifactId);
  }

  return undefined;
};

export const resolveLaunchLineage = (input: {
  request: InvestigationLaunchRequest;
  artifacts: Artifact[];
  runs: WorkspaceRun[];
}) => {
  let parentArtifact = findArtifactById(input.artifacts, input.request.parentArtifactId);
  let parentRun = findRunById(input.runs, input.request.parentRunId);

  if (!parentArtifact && parentRun) {
    parentArtifact = findArtifactProducedByRun(input.artifacts, parentRun);
  }

  if (!parentRun && parentArtifact) {
    parentRun =
      findRunById(input.runs, parentArtifact.config?.sourceRunId) ||
      findRunProducingArtifact(input.runs, parentArtifact.id);
  }

  return {
    parentArtifactId: input.request.parentArtifactId || parentArtifact?.id,
    parentRunId: input.request.parentRunId || parentRun?.id || parentArtifact?.config?.sourceRunId,
    sourceSignalId:
      input.request.sourceSignalId ||
      parentArtifact?.config?.sourceSignalId ||
      parentRun?.config?.sourceSignalId,
    sourceFollowUpId:
      input.request.sourceFollowUpId ||
      parentArtifact?.config?.sourceFollowUpId ||
      parentRun?.config?.sourceFollowUpId,
  };
};
