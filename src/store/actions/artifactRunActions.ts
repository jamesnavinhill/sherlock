import type { Entity, Workspace } from '@/types';
import { isLikelySameEntity } from '@/utils/entityUtils';
import { createLocalId } from '@/utils/id';
import { loadSystemConfig } from '@/config/systemConfig';
import {
  buildArtifactFollowUps,
  extractWorkspaceLaunchFields,
  getWorkspaceDisplayTitle,
  toFollowUpTexts,
} from '@/domain';
import { CaseRepository } from '@/services/db/repositories/CaseRepository';
import { TaskRepository } from '@/services/db/repositories/TaskRepository';

import type { WorkspaceState } from '../caseStore';
import type { WorkspaceStoreApi } from './shared';

export const createArtifactRunActions = ({
  get,
  set,
}: WorkspaceStoreApi): Pick<
  WorkspaceState,
  | 'appendSectionToReport'
  | 'updateArtifactSummary'
  | 'updateReportSummary'
  | 'updateArtifactSection'
  | 'addWorkspaceRun'
  | 'addTask'
  | 'completeWorkspaceRun'
  | 'completeTask'
  | 'failTask'
  | 'clearCompletedTasks'
  | 'saveArtifact'
  | 'archiveReport'
  | 'updateArtifactTitle'
  | 'updateReportTitle'
  | 'renameEntityAcrossArtifacts'
  | 'renameEntityAcrossReports'
  | 'deleteArtifact'
  | 'deleteReport'
> => ({
  appendSectionToReport: async (reportId, section) => {
    await CaseRepository.appendSectionToReport(reportId, section);
    set((state) => ({
      artifacts: state.artifacts.map((artifact) =>
        artifact.id === reportId
          ? {
              ...artifact,
              sections: [...(artifact.sections || []), section],
            }
          : artifact
      ),
    }));
  },
  updateArtifactSummary: async (artifactId, summary) => {
    await CaseRepository.updateReportSummary(artifactId, summary);
    set((state) => ({
      artifacts: state.artifacts.map((artifact) =>
        artifact.id === artifactId ? { ...artifact, summary } : artifact
      ),
    }));
  },
  updateReportSummary: async (reportId, summary) => get().updateArtifactSummary(reportId, summary),
  updateArtifactSection: async (artifactId, sectionId, patch) => {
    await CaseRepository.updateReportSection(artifactId, sectionId, patch);
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
    set((state) => ({
      workspaceRuns: [
        ...state.workspaceRuns.filter((existingRun) => existingRun.id !== workspaceRun.id),
        workspaceRun,
      ],
    }));

    try {
      await TaskRepository.create(workspaceRun);
    } catch (error) {
      set((state) => ({
        workspaceRuns: state.workspaceRuns.filter((existingRun) => existingRun.id !== workspaceRun.id),
      }));
      throw error;
    }
  },
  addTask: async (task) => get().addWorkspaceRun(task),
  completeWorkspaceRun: async (id, artifact) => {
    const existingTask = get().workspaceRuns.find((task) => task.id === id);
    const nextConfig = existingTask?.config
      ? {
          ...existingTask.config,
          producedArtifactId: artifact.id,
        }
      : existingTask?.config;

    await TaskRepository.updateStatus(id, 'COMPLETED');
    if (artifact.caseId) {
      await TaskRepository.updateWorkspace(id, artifact.caseId);
    }
    if (nextConfig) {
      await TaskRepository.updateConfig(id, nextConfig);
    }

    set((state) => ({
      workspaceRuns: state.workspaceRuns.map((workspaceRun) =>
        workspaceRun.id === id
          ? {
              ...workspaceRun,
              status: 'COMPLETED',
              report: artifact,
              config: nextConfig || workspaceRun.config,
              workspaceId: artifact.caseId ?? workspaceRun.workspaceId,
              endTime: Date.now(),
            }
          : workspaceRun
      ),
    }));
  },
  completeTask: async (id, report) => get().completeWorkspaceRun(id, report),
  failTask: async (id, error) => {
    await TaskRepository.updateStatus(id, 'FAILED', error);
    set((state) => ({
      workspaceRuns: state.workspaceRuns.map((workspaceRun) =>
        workspaceRun.id === id ? { ...workspaceRun, status: 'FAILED', error } : workspaceRun
      ),
    }));
  },
  clearCompletedTasks: async () => {
    const tasksToRemove = get().workspaceRuns.filter(
      (workspaceRun) => workspaceRun.status === 'COMPLETED' || workspaceRun.status === 'FAILED'
    );
    await Promise.all(tasksToRemove.map((workspaceRun) => TaskRepository.delete(workspaceRun.id)));
    set((state) => ({
      workspaceRuns: state.workspaceRuns.filter(
        (workspaceRun) => workspaceRun.status === 'RUNNING' || workspaceRun.status === 'QUEUED'
      ),
    }));
  },
  saveArtifact: async (artifact, parentContext) => {
    const state = get();
    const artifacts = [...state.artifacts];
    const workspaces = [...state.workspaces];
    const sourceRun = artifact.config?.sourceRunId
      ? state.workspaceRuns.find((workspaceRun) => workspaceRun.id === artifact.config?.sourceRunId)
      : undefined;
    const parentArtifactId = artifact.config?.parentArtifactId || sourceRun?.config?.parentArtifactId;
    const sourceSignalId = artifact.config?.sourceSignalId || sourceRun?.config?.sourceSignalId;
    const parentRunId = artifact.config?.parentRunId || sourceRun?.config?.parentRunId;
    let targetWorkspaceId = artifact.caseId;
    let isNewWorkspace = false;

    if (!targetWorkspaceId && parentArtifactId) {
      const parentArtifact = artifacts.find((entry) => entry.id === parentArtifactId);
      if (parentArtifact?.caseId) {
        targetWorkspaceId = parentArtifact.caseId;
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
      if (existingWorkspace) targetWorkspaceId = existingWorkspace.id;
    }

    if (!targetWorkspaceId) {
      const now = Date.now();
      const newWorkspaceId = createLocalId('workspace');
      const identity = extractWorkspaceLaunchFields(artifact.topic);
      const newWorkspace: Workspace = {
        id: newWorkspaceId,
        scopeId: artifact.config?.scopeId,
        title: identity.displayTitle,
        displayTitle: identity.displayTitle,
        launchTopic: identity.launchTopic,
        launchAngle: identity.launchAngle,
        prioritySourcesSummary: identity.prioritySourcesSummary,
        status: 'ACTIVE',
        dateOpened: new Date().toLocaleDateString(),
        createdAt: now,
        updatedAt: now,
        description: artifact.summary || `Workspace started on ${identity.displayTitle}`,
        mode: artifact.metadata?.workspaceMode as Workspace['mode'],
        packId: artifact.packId || artifact.config?.packId,
        purposeId: artifact.purposeId || artifact.config?.purposeId,
        labelProfileId: artifact.labelProfileId || artifact.config?.labelProfileId,
        metadata: artifact.metadata,
      };
      workspaces.push(newWorkspace);
      targetWorkspaceId = newWorkspaceId;
      isNewWorkspace = true;
    }

    const autoNormalize = loadSystemConfig().autoNormalizeEntities ?? true;

    const processedEntities: Entity[] = artifact.entities.map((entity) => {
      const name = entity.name;
      let resolvedName = state.entityAliases[name] || name;

      if (autoNormalize && resolvedName === name) {
        const existingWorkspaceEntities = artifacts
          .filter((entry) => entry.caseId === targetWorkspaceId)
          .flatMap((entry) => entry.entities)
          .map((entry) => (typeof entry === 'string' ? entry : entry.name));

        const match = existingWorkspaceEntities.find((existingName) =>
          isLikelySameEntity(name, existingName)
        );

        if (match && match !== name) {
          resolvedName = match;
          state.addAlias(name, match);
        }
      }

      return { ...entity, name: resolvedName };
    });

    const savedArtifact = {
      ...artifact,
      entities: processedEntities,
      id: artifact.id || createLocalId('rep'),
      createdAt: artifact.createdAt ?? Date.now(),
      config: artifact.config
        ? {
            ...artifact.config,
            sourceRunId: artifact.config.sourceRunId || sourceRun?.id,
            sourceSignalId,
            sourceFollowUpId:
              artifact.config.sourceFollowUpId || sourceRun?.config?.sourceFollowUpId,
            parentArtifactId,
            parentRunId,
          }
        : undefined,
      caseId: targetWorkspaceId,
    };

    savedArtifact.followUps = buildArtifactFollowUps({
      existing: savedArtifact.followUps,
      leads: savedArtifact.leads,
      artifactId: savedArtifact.id,
      workspaceId: targetWorkspaceId,
      sourceSignalId,
      createdAt: savedArtifact.createdAt,
    });
    savedArtifact.leads = toFollowUpTexts(savedArtifact.followUps);

    if (isNewWorkspace) {
      const workspaceToSave = workspaces.find((workspace) => workspace.id === targetWorkspaceId);
      if (workspaceToSave) {
        await CaseRepository.createCase(workspaceToSave);
      }
    }
    await CaseRepository.createReport(savedArtifact);

    const existingIndex = artifacts.findIndex(
      (entry) =>
        entry.id === savedArtifact.id ||
        (entry.topic === savedArtifact.topic && entry.dateStr === savedArtifact.dateStr)
    );
    if (existingIndex >= 0) {
      artifacts[existingIndex] = savedArtifact;
    } else {
      artifacts.push(savedArtifact);
    }

    let nextArtifacts = artifacts;
    if (sourceSignalId && savedArtifact.id) {
      const matchingHeadline = state.headlines.find((headline) => headline.id === sourceSignalId);
      if (matchingHeadline) {
        const updatedHeadline = {
          ...matchingHeadline,
          linkedReportId: savedArtifact.id,
        };

        set((current) => ({
          headlines: current.headlines.map((headline) =>
            headline.id === sourceSignalId ? updatedHeadline : headline
          ),
        }));
      }
    }

    const sourceFollowUpId = savedArtifact.config?.sourceFollowUpId;
    if (sourceFollowUpId && savedArtifact.id) {
      nextArtifacts = nextArtifacts.map((entry) => ({
        ...entry,
        followUps: (entry.followUps || []).map((followUp) =>
          followUp.id === sourceFollowUpId
            ? {
                ...followUp,
                status: 'RESOLVED',
                resolvedByArtifactId: savedArtifact.id,
                updatedAt: Date.now(),
              }
            : followUp
        ),
      }));
    }

    set({
      workspaces,
      artifacts: nextArtifacts,
      activeWorkspaceId: targetWorkspaceId,
    });

    return savedArtifact;
  },
  archiveReport: async (report, parentContext) => get().saveArtifact(report, parentContext),
  updateArtifactTitle: async (artifactId, title) => {
    await CaseRepository.updateReportTopic(artifactId, title);
    set((state) => ({
      artifacts: state.artifacts.map((artifact) =>
        artifact.id === artifactId ? { ...artifact, topic: title } : artifact
      ),
    }));
  },
  updateReportTitle: async (reportId, title) => get().updateArtifactTitle(reportId, title),
  renameEntityAcrossArtifacts: async (oldName, newName) => {
    await CaseRepository.renameEntity(oldName, newName);
    set((state) => ({
      artifacts: state.artifacts.map((artifact) => ({
        ...artifact,
        entities: (artifact.entities || []).map((entity) =>
          entity.name !== oldName ? entity : { ...entity, name: newName }
        ),
      })),
    }));
  },
  renameEntityAcrossReports: async (oldName, newName) =>
    get().renameEntityAcrossArtifacts(oldName, newName),
  deleteArtifact: async (artifactId) => {
    await CaseRepository.deleteReport(artifactId);
    set((state) => ({
      artifacts: state.artifacts.filter((artifact) => artifact.id !== artifactId),
    }));
  },
  deleteReport: async (reportId) => get().deleteArtifact(reportId),
});
