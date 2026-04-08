import { createLocalId } from '@/utils/id';
import { loadSystemConfig } from '@/config/systemConfig';
import { WorkspaceRepository } from '@/services/db/repositories/WorkspaceRepository';
import { WorkspaceRunRepository } from '@/services/db/repositories/WorkspaceRunRepository';

import {
  buildAddWorkspaceRunState,
  buildArtifactSavePlan,
  buildClearCompletedRunsState,
  buildCompleteWorkspaceRunState,
  buildFailWorkspaceRunState,
  buildRemoveWorkspaceRunState,
  buildSavedArtifactState,
} from './artifactRunActionState';
import type { WorkspaceState } from '../workspaceStore';
import type { WorkspaceStoreApi } from './shared';

export const createArtifactRunActions = ({
  get,
  set,
}: WorkspaceStoreApi): Pick<
  WorkspaceState,
  | 'appendSectionToArtifact'
  | 'updateArtifactSummary'
  | 'updateArtifactSection'
  | 'addWorkspaceRun'
  | 'addRun'
  | 'completeWorkspaceRun'
  | 'completeRun'
  | 'failRun'
  | 'clearCompletedRuns'
  | 'saveArtifact'
  | 'updateArtifactTitle'
  | 'renameEntityAcrossArtifacts'
  | 'deleteArtifact'
> => ({
  appendSectionToArtifact: async (artifactId, section) => {
    await WorkspaceRepository.appendSectionToArtifact(artifactId, section);
    set((state) => ({
      artifacts: state.artifacts.map((artifact) =>
        artifact.id === artifactId
          ? {
              ...artifact,
              sections: [...(artifact.sections || []), section],
            }
          : artifact
      ),
    }));
  },
  updateArtifactSummary: async (artifactId, summary) => {
    await WorkspaceRepository.updateArtifactSummary(artifactId, summary);
    set((state) => ({
      artifacts: state.artifacts.map((artifact) =>
        artifact.id === artifactId ? { ...artifact, summary } : artifact
      ),
    }));
  },
  updateArtifactSection: async (artifactId, sectionId, patch) => {
    await WorkspaceRepository.updateArtifactSection(artifactId, sectionId, patch);
    set((state) => ({
      artifacts: state.artifacts.map((artifact) =>
        artifact.id !== artifactId
          ? artifact
          : {
              ...artifact,
              sections: (artifact.sections || []).map((section) =>
                section.id === sectionId ? { ...section, ...patch } : section
              ),
            }
      ),
    }));
  },
  addWorkspaceRun: async (workspaceRun) => {
    set((state) => buildAddWorkspaceRunState(state, workspaceRun));

    try {
      await WorkspaceRunRepository.create(workspaceRun);
    } catch (error) {
      set((state) => buildRemoveWorkspaceRunState(state, workspaceRun.id));
      throw error;
    }
  },
  addRun: async (run) => get().addWorkspaceRun(run),
  completeWorkspaceRun: async (id, artifact) => {
    const existingRun = get().workspaceRuns.find((run) => run.id === id);
    const nextConfig = existingRun?.config
      ? {
          ...existingRun.config,
          producedArtifactId: artifact.id,
        }
      : existingRun?.config;

    await WorkspaceRunRepository.updateStatus(id, 'COMPLETED');
    if (artifact.workspaceId) {
      await WorkspaceRunRepository.updateWorkspace(id, artifact.workspaceId);
    }
    if (nextConfig) {
      await WorkspaceRunRepository.updateConfig(id, nextConfig);
    }

    set((state) =>
      buildCompleteWorkspaceRunState(state, {
        artifact,
        endTime: Date.now(),
        id,
        nextConfig,
      })
    );
  },
  completeRun: async (id, artifact) => get().completeWorkspaceRun(id, artifact),
  failRun: async (id, error) => {
    await WorkspaceRunRepository.updateStatus(id, 'FAILED', error);
    set((state) => buildFailWorkspaceRunState(state, id, error));
  },
  clearCompletedRuns: async () => {
    const runsToRemove = get().workspaceRuns.filter(
      (workspaceRun) => workspaceRun.status === 'COMPLETED' || workspaceRun.status === 'FAILED'
    );
    await Promise.all(
      runsToRemove.map((workspaceRun) => WorkspaceRunRepository.delete(workspaceRun.id))
    );
    set((state) => buildClearCompletedRunsState(state));
  },
  saveArtifact: async (artifact, parentContext) => {
    const state = get();
    const autoNormalize = loadSystemConfig().autoNormalizeEntities ?? true;
    const now = Date.now();
    const artifactSavePlan = buildArtifactSavePlan({
      artifact,
      artifacts: state.artifacts,
      autoNormalize,
      createArtifactId: () => createLocalId('rep'),
      createWorkspaceId: () => createLocalId('workspace'),
      dateOpened: new Date(now).toLocaleDateString(),
      entityAliases: state.entityAliases,
      now,
      parentContext,
      workspaces: state.workspaces,
      workspaceRuns: state.workspaceRuns,
    });

    const aliasEntries = Object.entries(artifactSavePlan.aliasUpdates);
    if (aliasEntries.length > 0) {
      await state.setEntityAliases({
        ...state.entityAliases,
        ...artifactSavePlan.aliasUpdates,
      });
    }

    if (artifactSavePlan.isNewWorkspace) {
      const workspaceToSave = artifactSavePlan.workspaces.find(
        (workspace) => workspace.id === artifactSavePlan.targetWorkspaceId
      );
      if (workspaceToSave) {
        await WorkspaceRepository.createWorkspace(workspaceToSave);
      }
    }
    await WorkspaceRepository.createArtifact(artifactSavePlan.savedArtifact);

    set((current) => buildSavedArtifactState(current, artifactSavePlan));

    return artifactSavePlan.savedArtifact;
  },
  updateArtifactTitle: async (artifactId, title) => {
    await WorkspaceRepository.updateArtifactTopic(artifactId, title);
    set((state) => ({
      artifacts: state.artifacts.map((artifact) =>
        artifact.id === artifactId ? { ...artifact, topic: title } : artifact
      ),
    }));
  },
  renameEntityAcrossArtifacts: async (oldName, newName) => {
    await WorkspaceRepository.renameEntity(oldName, newName);
    set((state) => ({
      artifacts: state.artifacts.map((artifact) => ({
        ...artifact,
        entities: (artifact.entities || []).map((entity) =>
          entity.name !== oldName ? entity : { ...entity, name: newName }
        ),
      })),
    }));
  },
  deleteArtifact: async (artifactId) => {
    await WorkspaceRepository.deleteArtifact(artifactId);
    set((state) => ({
      artifacts: state.artifacts.filter((artifact) => artifact.id !== artifactId),
    }));
  },
});
