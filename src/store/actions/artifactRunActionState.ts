import {
  buildArtifactFollowUps,
  extractWorkspaceLaunchFields,
  getWorkspaceDisplayTitle,
  toFollowUpTexts,
} from '@/domain';
import type { Artifact, EntityAliasMap, Workspace, WorkspaceRun } from '@/types';
import { isLikelySameEntity } from '@/utils/entityUtils';

import type { WorkspaceState } from '../workspaceStore';

export const buildAddWorkspaceRunState = (
  state: WorkspaceState,
  workspaceRun: WorkspaceRun
): Partial<WorkspaceState> => ({
  workspaceRuns: [
    ...state.workspaceRuns.filter((existingRun) => existingRun.id !== workspaceRun.id),
    workspaceRun,
  ],
});

export const buildRemoveWorkspaceRunState = (
  state: WorkspaceState,
  workspaceRunId: string
): Partial<WorkspaceState> => ({
  workspaceRuns: state.workspaceRuns.filter((existingRun) => existingRun.id !== workspaceRunId),
});

export const buildCompleteWorkspaceRunState = (
  state: WorkspaceState,
  input: {
    artifact: Artifact;
    endTime: number;
    id: string;
    nextConfig: WorkspaceRun['config'];
  }
): Partial<WorkspaceState> => ({
  workspaceRuns: state.workspaceRuns.map((workspaceRun) =>
    workspaceRun.id === input.id
      ? {
          ...workspaceRun,
          status: 'COMPLETED',
          artifact: input.artifact,
          config: input.nextConfig || workspaceRun.config,
          workspaceId: input.artifact.workspaceId ?? workspaceRun.workspaceId,
          endTime: input.endTime,
        }
      : workspaceRun
  ),
});

export const buildFailWorkspaceRunState = (
  state: WorkspaceState,
  id: string,
  error: string
): Partial<WorkspaceState> => ({
  workspaceRuns: state.workspaceRuns.map((workspaceRun) =>
    workspaceRun.id === id ? { ...workspaceRun, status: 'FAILED', error } : workspaceRun
  ),
});

export const buildClearCompletedRunsState = (state: WorkspaceState): Partial<WorkspaceState> => ({
  workspaceRuns: state.workspaceRuns.filter(
    (workspaceRun) => workspaceRun.status === 'RUNNING' || workspaceRun.status === 'QUEUED'
  ),
});

interface BuildArtifactSavePlanInput {
  artifact: Artifact;
  artifacts: Artifact[];
  autoNormalize: boolean;
  createArtifactId: () => string;
  createWorkspaceId: () => string;
  dateOpened: string;
  entityAliases: EntityAliasMap;
  now: number;
  parentContext?: {
    summary: string;
    topic: string;
  };
  workspaces: Workspace[];
  workspaceRuns: WorkspaceRun[];
}

interface ArtifactSavePlan {
  aliasUpdates: EntityAliasMap;
  isNewWorkspace: boolean;
  savedArtifact: Artifact;
  sourceSignalId?: string;
  targetWorkspaceId: string;
  workspaces: Workspace[];
}

const findWorkspaceIdForArtifactSave = (input: {
  artifact: Artifact;
  artifacts: Artifact[];
  parentContext?: {
    summary: string;
    topic: string;
  };
  workspaces: Workspace[];
  workspaceRuns: WorkspaceRun[];
}): {
  parentArtifactId?: string;
  parentRunId?: string;
  sourceRun?: WorkspaceRun;
  sourceSignalId?: string;
  targetWorkspaceId?: string;
} => {
  const { artifact, artifacts, parentContext, workspaces, workspaceRuns } = input;
  const sourceRun = artifact.config?.sourceRunId
    ? workspaceRuns.find((workspaceRun) => workspaceRun.id === artifact.config?.sourceRunId)
    : undefined;
  const parentArtifactId = artifact.config?.parentArtifactId || sourceRun?.config?.parentArtifactId;
  const sourceSignalId = artifact.config?.sourceSignalId || sourceRun?.config?.sourceSignalId;
  const parentRunId = artifact.config?.parentRunId || sourceRun?.config?.parentRunId;
  let targetWorkspaceId = artifact.workspaceId;

  if (!targetWorkspaceId && parentArtifactId) {
    const parentArtifact = artifacts.find((entry) => entry.id === parentArtifactId);
    if (parentArtifact?.workspaceId) {
      targetWorkspaceId = parentArtifact.workspaceId;
    }
  }

  if (!targetWorkspaceId && sourceRun?.workspaceId) {
    targetWorkspaceId = sourceRun.workspaceId;
  }

  if (!targetWorkspaceId && parentContext) {
    const parentWorkspace = workspaces.find(
      (workspace) => getWorkspaceDisplayTitle(workspace) === parentContext.topic
    );
    if (parentWorkspace) {
      targetWorkspaceId = parentWorkspace.id;
    }
  }

  if (!targetWorkspaceId) {
    const identity = extractWorkspaceLaunchFields(artifact.topic);
    const existingWorkspace = workspaces.find(
      (workspace) => getWorkspaceDisplayTitle(workspace) === identity.displayTitle
    );
    if (existingWorkspace) {
      targetWorkspaceId = existingWorkspace.id;
    }
  }

  return {
    parentArtifactId,
    parentRunId,
    sourceRun,
    sourceSignalId,
    targetWorkspaceId,
  };
};

export const buildArtifactSavePlan = (input: BuildArtifactSavePlanInput): ArtifactSavePlan => {
  const resolvedWorkspace = findWorkspaceIdForArtifactSave(input);
  const workspaces = [...input.workspaces];
  let targetWorkspaceId = resolvedWorkspace.targetWorkspaceId;
  let isNewWorkspace = false;

  if (!targetWorkspaceId) {
    const identity = extractWorkspaceLaunchFields(input.artifact.topic);
    const newWorkspace: Workspace = {
      id: input.createWorkspaceId(),
      scopeId: input.artifact.config?.scopeId,
      title: identity.displayTitle,
      displayTitle: identity.displayTitle,
      launchTopic: identity.launchTopic,
      launchAngle: identity.launchAngle,
      prioritySourcesSummary: identity.prioritySourcesSummary,
      status: 'ACTIVE',
      dateOpened: input.dateOpened,
      createdAt: input.now,
      updatedAt: input.now,
      description: input.artifact.summary || `Workspace started on ${identity.displayTitle}`,
      mode: input.artifact.metadata?.workspaceMode as Workspace['mode'],
      packId: input.artifact.packId || input.artifact.config?.packId,
      purposeId: input.artifact.purposeId || input.artifact.config?.purposeId,
      labelProfileId: input.artifact.labelProfileId || input.artifact.config?.labelProfileId,
      metadata: input.artifact.metadata,
    };
    workspaces.push(newWorkspace);
    targetWorkspaceId = newWorkspace.id;
    isNewWorkspace = true;
  }

  const aliasUpdates: EntityAliasMap = {};
  const processedEntities = input.artifact.entities.map((entity) => {
    let resolvedName = input.entityAliases[entity.name] || entity.name;

    if (input.autoNormalize && resolvedName === entity.name) {
      const existingWorkspaceEntities = input.artifacts
        .filter((entry) => entry.workspaceId === targetWorkspaceId)
        .flatMap((entry) => entry.entities)
        .map((entry) => (typeof entry === 'string' ? entry : entry.name));
      const match = existingWorkspaceEntities.find((existingName) =>
        isLikelySameEntity(entity.name, existingName)
      );

      if (match && match !== entity.name) {
        resolvedName = match;
        if (!input.entityAliases[entity.name]) {
          aliasUpdates[entity.name] = match;
        }
      }
    }

    return { ...entity, name: resolvedName };
  });

  const savedArtifact: Artifact = {
    ...input.artifact,
    entities: processedEntities,
    id: input.artifact.id || input.createArtifactId(),
    createdAt: input.artifact.createdAt ?? input.now,
    config: input.artifact.config
      ? {
          ...input.artifact.config,
          sourceRunId: input.artifact.config.sourceRunId || resolvedWorkspace.sourceRun?.id,
          sourceSignalId: resolvedWorkspace.sourceSignalId,
          sourceFollowUpId:
            input.artifact.config.sourceFollowUpId ||
            resolvedWorkspace.sourceRun?.config?.sourceFollowUpId,
          parentArtifactId: resolvedWorkspace.parentArtifactId,
          parentRunId: resolvedWorkspace.parentRunId,
        }
      : undefined,
    workspaceId: targetWorkspaceId,
  };

  savedArtifact.followUps = buildArtifactFollowUps({
    existing: savedArtifact.followUps,
    leads: savedArtifact.leads,
    artifactId: savedArtifact.id,
    workspaceId: targetWorkspaceId,
    sourceSignalId: resolvedWorkspace.sourceSignalId,
    createdAt: savedArtifact.createdAt,
  });
  savedArtifact.leads = toFollowUpTexts(savedArtifact.followUps);

  return {
    aliasUpdates,
    isNewWorkspace,
    savedArtifact,
    sourceSignalId: resolvedWorkspace.sourceSignalId,
    targetWorkspaceId,
    workspaces,
  };
};

export const buildSavedArtifactState = (
  state: WorkspaceState,
  input: ArtifactSavePlan
): Partial<WorkspaceState> => {
  const nextArtifacts = [...state.artifacts];
  const existingIndex = nextArtifacts.findIndex(
    (entry) =>
      entry.id === input.savedArtifact.id ||
      (entry.topic === input.savedArtifact.topic && entry.dateStr === input.savedArtifact.dateStr)
  );
  if (existingIndex >= 0) {
    nextArtifacts[existingIndex] = input.savedArtifact;
  } else {
    nextArtifacts.push(input.savedArtifact);
  }

  const sourceFollowUpId = input.savedArtifact.config?.sourceFollowUpId;
  const artifacts = sourceFollowUpId
    ? nextArtifacts.map((entry) => ({
        ...entry,
        followUps: (entry.followUps || []).map((followUp) =>
          followUp.id === sourceFollowUpId
            ? {
                ...followUp,
                status: 'RESOLVED' as const,
                resolvedByArtifactId: input.savedArtifact.id,
                updatedAt: input.savedArtifact.createdAt ?? Date.now(),
              }
            : followUp
        ),
      }))
    : nextArtifacts;

  const headlines =
    input.sourceSignalId && input.savedArtifact.id
      ? state.headlines.map((headline) =>
          headline.id === input.sourceSignalId
            ? {
                ...headline,
                linkedArtifactId: input.savedArtifact.id,
              }
            : headline
        )
      : state.headlines;

  return {
    workspaces: input.workspaces,
    artifacts,
    headlines,
    activeWorkspaceId: input.targetWorkspaceId,
  };
};
