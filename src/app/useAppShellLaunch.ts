import { useCallback, type MutableRefObject } from 'react';
import type { NavigateFunction } from 'react-router-dom';

import type {
  Artifact,
  FollowUp,
  InvestigationLaunchRequest,
  InvestigationRunConfig,
  InvestigationScope,
  ManualNode,
  SystemConfig,
  WorkspaceRun,
} from '@/types';
import { hasApiKey, runWorkspaceInvestigation } from '@/services/runtime';
import { normalizeTopicText } from '@/utils/textNormalization';
import { loadSystemConfig } from '@/config/systemConfig';
import { resolveLaunchLineage } from '@/services/lineage/relationships';
import { buildRunPath, buildWorkspaceArtifactPath } from '@/app/routes';
import {
  resolveRuntimeLaunchFields,
  resolveRuntimeScope,
  toRuntimeConfigOverride,
} from '@/components/features/Runs/runtimeConfigMapping';
import {
  buildLaunchRunConfig,
  buildWorkspaceRun,
  mergeArchivedReportRunConfig,
  mergePreseededEntities,
} from '@/app/appShellLaunchHelpers';
import { createLocalId } from '@/utils/id';

interface UseAppShellLaunchInput {
  navigate: NavigateFunction;
  locationPathRef: MutableRefObject<string>;
  artifacts: Artifact[];
  customScopes: InvestigationScope[];
  workspaceRuns: WorkspaceRun[];
  addRun: (workspaceRun: WorkspaceRun) => Promise<void>;
  addToast: (message: string, type?: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  saveArtifact: (
    artifact: Artifact,
    parentContext?: { topic: string; summary: string }
  ) => Promise<Artifact>;
  completeRun: (id: string, artifact: Artifact) => Promise<void>;
  failRun: (id: string, error: string) => Promise<void>;
  manualNodes: ManualNode[];
  setManualNodes: (nodes: ManualNode[]) => void;
  setActiveRunId: (id: string | null) => void;
  setShowApiKeyPrompt: (value: boolean) => void;
}

export const useAppShellLaunch = ({
  navigate,
  locationPathRef,
  artifacts,
  customScopes,
  workspaceRuns,
  addRun,
  addToast,
  saveArtifact,
  completeRun,
  failRun,
  manualNodes,
  setManualNodes,
  setActiveRunId,
  setShowApiKeyPrompt,
}: UseAppShellLaunchInput) => {
  const resolveScopeById = useCallback(
    (scopeId?: string): InvestigationScope | undefined =>
      resolveRuntimeScope(scopeId, customScopes),
    [customScopes]
  );

  const addPreseededEntitiesToGraph = useCallback(
    async (runId: string, preseededEntities?: InvestigationRunConfig['preseededEntities']) => {
      const nextNodes = mergePreseededEntities({
        existingNodes: manualNodes,
        preseededEntities,
        runId,
      });
      if (nextNodes.length !== manualNodes.length) {
        setManualNodes(nextNodes);
      }
    },
    [manualNodes, setManualNodes]
  );

  const runInvestigationTask = useCallback(
    async (
      taskId: string,
      launchRequest: InvestigationLaunchRequest,
      runConfig: InvestigationRunConfig
    ) => {
      try {
        let artifact = await runWorkspaceInvestigation(
          launchRequest.topic,
          launchRequest.parentContext,
          launchRequest.configOverride,
          launchRequest.scope,
          launchRequest.dateRangeOverride,
          runConfig
        );

        artifact = mergeArchivedReportRunConfig(artifact, runConfig, taskId);
        artifact = await saveArtifact(artifact, launchRequest.parentContext);

        if (launchRequest.preseededEntities?.length) {
          await addPreseededEntitiesToGraph(taskId, launchRequest.preseededEntities);
        }

        await completeRun(taskId, artifact);

        if (
          artifact.id &&
          artifact.workspaceId &&
          locationPathRef.current === buildRunPath(taskId)
        ) {
          navigate(buildWorkspaceArtifactPath(artifact.workspaceId, artifact.id), {
            replace: true,
          });
        }

        if (!loadSystemConfig().quietMode) {
          addToast(`Run complete: ${launchRequest.topic}`, 'SUCCESS');
        }
      } catch (error: unknown) {
        console.error(`Task ${taskId} failed`, error);
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        await failRun(taskId, message);
        addToast(`Run failed: ${launchRequest.topic}`, 'ERROR');
      }
    },
    [addPreseededEntitiesToGraph, addToast, completeRun, failRun, locationPathRef, navigate, saveArtifact]
  );

  const launchInvestigation = useCallback(
    (request: InvestigationLaunchRequest) => {
      void (async () => {
        const switchToView = request.switchToView ?? true;
        const storedConfig = loadSystemConfig();
        const {
          artifactType,
          effectiveConfig,
          labelProfileId,
          pack: effectivePack,
          purpose: effectivePurpose,
          scope: effectiveScope,
        } = resolveRuntimeLaunchFields({
          baseConfig: storedConfig,
          configOverride: request.configOverride as
            | (Partial<SystemConfig> & Partial<InvestigationRunConfig>)
            | undefined,
          customScopes,
          scope: request.scope,
          artifactType: request.artifactType,
          labelProfileId: request.labelProfileId,
          purposeId: request.purposeId,
        });
        const normalizedTopic = normalizeTopicText(request.topic);

        if (!hasApiKey(effectiveConfig.provider)) {
          setShowApiKeyPrompt(true);
          addToast(`Missing ${effectiveConfig.provider} API key. Add it to continue.`, 'ERROR');
          return;
        }

        const derivedLineage = resolveLaunchLineage({
          request,
          artifacts,
          runs: workspaceRuns,
        });

        const launchRequest: InvestigationLaunchRequest = {
          ...request,
          topic: normalizedTopic,
          switchToView,
          scope: effectiveScope,
          packId: effectivePack.id,
          purposeId: effectivePurpose.id,
          artifactType,
          labelProfileId,
          sourceSignalId: derivedLineage.sourceSignalId,
          sourceFollowUpId: derivedLineage.sourceFollowUpId,
          parentArtifactId: derivedLineage.parentArtifactId,
          parentRunId: derivedLineage.parentRunId,
        };

        const runConfig = buildLaunchRunConfig({
          artifactType,
          effectiveConfig,
          effectivePack,
          effectivePurpose,
          effectiveScope,
          labelProfileId,
          launchRequest,
        });

        const newTaskId = createLocalId('task');
      const newTask = buildWorkspaceRun({
          launchRequest,
          runConfig,
          runId: newTaskId,
        });

        try {
          const addRunPromise = addRun(newTask);
          if (!storedConfig.quietMode) {
            addToast(`Launching run: ${launchRequest.topic}`, 'INFO');
          }

          if (switchToView) {
            setActiveRunId(newTaskId);
            navigate(buildRunPath(newTaskId));
          }

          await addRunPromise;
          void runInvestigationTask(newTaskId, launchRequest, runConfig);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to launch run.';
          addToast(message, 'ERROR');
          setActiveRunId(null);
        }
      })();
    },
    [
      addRun,
      addToast,
      artifacts,
      customScopes,
      navigate,
      runInvestigationTask,
      setActiveRunId,
      setShowApiKeyPrompt,
      workspaceRuns,
    ]
  );

  const handleBatchInvestigate = useCallback(
    (followUps: FollowUp[], parentArtifact: Artifact) => {
      const parentContext = { topic: parentArtifact.topic, summary: parentArtifact.summary };
      const inheritedScope = resolveScopeById(parentArtifact.config?.scopeId);

      followUps.forEach((followUp, index) => {
        setTimeout(() => {
          launchInvestigation({
            topic: followUp.actionText,
            parentContext,
            configOverride: toRuntimeConfigOverride(parentArtifact.config),
            scope: inheritedScope,
            dateRangeOverride: parentArtifact.config?.dateRangeOverride,
            switchToView: false,
            launchSource: 'FULL_SPECTRUM',
            sourceFollowUpId: followUp.id,
            parentArtifactId: parentArtifact.id,
          });
        }, index * 200);
      });
    },
    [launchInvestigation, resolveScopeById]
  );

  return {
    launchInvestigation,
    handleBatchInvestigate,
  };
};
