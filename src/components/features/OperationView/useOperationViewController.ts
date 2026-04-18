import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type {
  Artifact,
  ChatOpenRequest,
  WorkspaceTemplate,
  FollowUp,
  InvestigationLaunchRequest,
  InvestigationRunConfig,
  InvestigationScope,
  SystemConfig,
  Workspace,
  WorkspaceRun,
} from '@/types';
import { useOperationFeatureState } from '@/store/selectors/operationSelectors';
import type { ArtifactRouteState } from '@/app/routes';
import {
  getWorkspaceDisplayTitle,
  getFollowUpText,
  getLabelProfileById,
  sanitizeDisplayTitle,
  stripLegacyWorkspacePrefix,
} from '@/domain';
import {
  resolveRuntimeScope,
  toRuntimeConfigOverride,
} from '@/components/features/Runs/runtimeConfigMapping';
import { buildOperationWorkspacePanelData } from './operationWorkspacePanelData';
import { useOperationViewInspectorState } from './useOperationViewInspectorState';

interface OperationViewControllerOptions {
  artifactRouteState?: ArtifactRouteState;
  onNavigate: (id: string) => void;
  onInvestigateHeadline?: (request: InvestigationLaunchRequest) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
  onSelectArtifact?: (artifactId: string) => void;
  artifactOverride?: Artifact | null;
  run: WorkspaceRun | null;
}

export function useOperationViewController({
  artifactRouteState,
  onNavigate,
  onInvestigateHeadline,
  onOpenChat,
  onSelectArtifact,
  artifactOverride = null,
  run,
}: OperationViewControllerOptions) {
  const navigate = useNavigate();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    artifacts: false,
    findings: false,
    entities: false,
    followUps: false,
    evidence: false,
    sources: false,
    headlines: false,
  });
  const [leadToAnalyze, setLeadToAnalyze] = useState<{
    text: string;
    sourceFollowUpId?: string;
    context?: { topic: string; summary: string };
    inheritedConfig?: Partial<SystemConfig>;
    inheritedScopeId?: string;
    inheritedDateRange?: InvestigationRunConfig['dateRangeOverride'];
    parentArtifactId?: string;
  } | null>(null);
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const {
    workspaces: allWorkspaces,
    artifacts,
    headlines: allHeadlines,
    addToast,
    addTemplate,
    updateArtifactSection,
    updateArtifactTitle,
    updateArtifactSummary,
    renameEntityAcrossArtifacts,
    activeWorkspaceId: selectedWorkspaceId,
    setActiveWorkspaceId,
    ensureWorkspaceBoard,
    flaggedNodeIds,
    queueBoardPlacement,
    toggleFlag,
    customScopes,
  } = useOperationFeatureState();

  const artifact = run?.artifact ?? artifactOverride;
  const status = run?.status ?? null;
  const effectiveWorkspaceId = selectedWorkspaceId ?? artifact?.workspaceId ?? null;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setLeftPanelOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (
      selectedWorkspaceId &&
      selectedWorkspaceId !== 'ALL' &&
      !allWorkspaces.find((workspace) => workspace.id === effectiveWorkspaceId)
    ) {
      // Keep the dependency seam explicit even though re-sync is store-driven today.
    }
  }, [allWorkspaces, effectiveWorkspaceId, selectedWorkspaceId]);

  const activeWorkspace = useMemo(
    () =>
      (allWorkspaces.find((workspace) => workspace.id === effectiveWorkspaceId) || null) as
        | Workspace
        | null,
    [allWorkspaces, effectiveWorkspaceId]
  );

  const workspaceArtifacts = useMemo(
    () => artifacts.filter((entry) => entry.workspaceId === effectiveWorkspaceId),
    [artifacts, effectiveWorkspaceId]
  );

  const headlines = useMemo(() => {
    if (!effectiveWorkspaceId) return [];
    return allHeadlines.filter((headline) => headline.workspaceId === effectiveWorkspaceId);
  }, [effectiveWorkspaceId, allHeadlines]);

  const labelProfile = useMemo(
    () =>
      getLabelProfileById(
        artifact?.labelProfileId || artifact?.config?.labelProfileId || activeWorkspace?.labelProfileId
      ),
    [activeWorkspace?.labelProfileId, artifact?.config?.labelProfileId, artifact?.labelProfileId]
  );

  const resolveScope = (scopeId?: string): InvestigationScope | undefined =>
    resolveRuntimeScope(scopeId, customScopes);

  const toConfigOverride = (config?: InvestigationRunConfig) => toRuntimeConfigOverride(config);

  const toggleDossierSection = (section: string) => {
    setOpenSections((prev) =>
      Object.fromEntries(
        Object.keys(prev).map((key) => [key, key === section ? !prev[section] : false])
      )
    );
  };

  const handleWorkspaceSelect = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);

    if (workspaceId !== 'ALL' && workspaceId !== '') {
      const rootArtifact =
        workspaceArtifacts.find((entry) => entry.workspaceId === workspaceId && !entry.config?.parentArtifactId) ||
        artifacts.find((entry) => entry.workspaceId === workspaceId && !entry.config?.parentArtifactId) ||
        artifacts.find((entry) => entry.workspaceId === workspaceId);
      if (!rootArtifact?.id) return;
      if (onSelectArtifact) {
        onSelectArtifact(rootArtifact.id);
        } else {
        onNavigate(rootArtifact.id);
      }
    }
  };

  const handleSaveTemplate = () => {
    if (!artifact) return;
    setShowSaveTemplateModal(true);
    setTemplateName(
      `${activeWorkspace ? getWorkspaceDisplayTitle(activeWorkspace) : stripLegacyWorkspacePrefix(labelProfile.workspaceLabel)}: ${sanitizeDisplayTitle(artifact.topic)}`
    );
  };

  const executeSaveTemplate = () => {
    if (!artifact || !templateName.trim()) return;

    const newTemplate: WorkspaceTemplate = {
      id: `tpl-${Date.now()}`,
      name: templateName.trim(),
      topic: artifact.topic,
      config: artifact.config || {},
      createdAt: Date.now(),
    };

    addTemplate(newTemplate);
    setShowSaveTemplateModal(false);
    addToast('Template saved successfully', 'SUCCESS');
  };

  const workspacePanelData = useMemo(
    () =>
      buildOperationWorkspacePanelData({
        activeWorkspace,
        artifacts: workspaceArtifacts,
      }),
    [activeWorkspace, workspaceArtifacts]
  );

  const handleFollowUpClick = (followUp: string | FollowUp) => {
    const parentContext = artifact
      ? { topic: artifact.topic, summary: artifact.summary }
      : activeWorkspace
        ? {
            topic: activeWorkspace.title,
            summary:
              activeWorkspace.description ||
              `Investigating follow-up within ${activeWorkspace.title}`,
          }
        : undefined;

    setLeadToAnalyze({
      text: typeof followUp === 'string' ? followUp : getFollowUpText(followUp),
      sourceFollowUpId: typeof followUp === 'string' ? undefined : followUp.id,
      context: parentContext,
      inheritedConfig: toConfigOverride(artifact?.config),
      inheritedScopeId: artifact?.config?.scopeId,
      inheritedDateRange: artifact?.config?.dateRangeOverride,
      parentArtifactId: artifact?.id,
    });
  };

  const {
    handleEntityClick,
    handleHeadlineClick,
    handleHeadlineInvestigate,
    handleInvestigateEntity,
    handleOpenEntityChat,
    handleOpenHeadlineChat,
    handleOpenArtifactChat,
    handleOpenArtifactInspector,
    handleOpenWorkspaceBoard,
    handlePlaceEntityOnBoard,
    handlePlaceHeadlineOnBoard,
    handlePlaceArtifactOnBoard,
    inspectorMode,
    rightPanelOpen,
    selectedEntity,
    selectedHeadline,
    setRightPanelOpen,
    setSelectedEntity,
  } = useOperationViewInspectorState({
    activeWorkspace,
    artifactRouteState,
    closeLeftPanelForMobile: () => {
      if (window.innerWidth <= 1024) {
        setLeftPanelOpen(false);
      }
    },
    effectiveWorkspaceId,
    ensureWorkspaceBoard,
    navigate,
    onInvestigateHeadline,
    onInvestigateEntity: (entityName) => handleFollowUpClick(entityName),
    onOpenChat,
    queueBoardPlacement,
    artifact,
    resolveScope,
    toConfigOverride,
  });

  const handleTitleSave = async (newTitle: string) => {
    if (!artifact) return;
    if (artifact.id) {
      await updateArtifactTitle(artifact.id, newTitle);
    }
    if (artifact.id) onNavigate(artifact.id);
  };

  const handleArtifactBodySave = async (
    summary: string,
    sectionId?: string,
    options?: { syncSummary?: boolean }
  ) => {
    if (!artifact?.id) return;

    if (options?.syncSummary ?? true) {
      await updateArtifactSummary(artifact.id, summary);
    }
    if (sectionId) {
      await updateArtifactSection(artifact.id, sectionId, {
        content: summary,
      });
    }
    addToast('Artifact updated.', 'SUCCESS');
  };

  const handleEntityNameSave = async (newName: string) => {
    if (!selectedEntity) return;
    const oldName = selectedEntity.name;
    await renameEntityAcrossArtifacts(oldName, newName);

    if (flaggedNodeIds.includes(oldName)) {
      toggleFlag(oldName);
      toggleFlag(newName);
    }

    setSelectedEntity({ ...selectedEntity, name: newName });
  };

  const handleFlagEntity = (entityName: string) => {
    toggleFlag(entityName);
  };

  const isRunRunning = run && (status === 'RUNNING' || status === 'QUEUED');
  const isRunFailed = run && status === 'FAILED';
  const statusText = run
    ? run.parentContext
      ? `SUB-NETWORK: "${run.topic}"`
      : `TARGET: "${run.topic}"`
    : '';
  const showPlaceholder = !artifact;

  return {
    activeWorkspace,
    workspaceArtifacts,
    allWorkspaces,
    workspacePanelData,
    executeSaveTemplate,
    handleWorkspaceSelect,
    handleEntityClick,
    handleEntityNameSave,
    handleFlagEntity,
    handleHeadlineClick,
    handleHeadlineInvestigate,
    handleInvestigateEntity,
    handleFollowUpClick,
    handleOpenEntityChat,
    handleOpenHeadlineChat,
    handleOpenArtifactInspector,
    handleOpenArtifactChat,
    handleOpenWorkspaceBoard,
    handlePlaceEntityOnBoard,
    handlePlaceHeadlineOnBoard,
    handlePlaceArtifactOnBoard,
    handleArtifactBodySave,
    handleSaveTemplate,
    handleTitleSave,
    headlines,
    inspectorMode,
    isNewWorkspaceModalOpen,
    isRunFailed,
    isRunRunning,
    labelProfile,
    leadToAnalyze,
    leftPanelOpen,
    onNavigate,
    openSections,
    artifact,
    resolveScope,
    rightPanelOpen,
    selectedWorkspaceId,
    selectedEntity,
    selectedHeadline,
    addToast,
    setIsNewWorkspaceModalOpen,
    setLeadToAnalyze,
    setLeftPanelOpen,
    setRightPanelOpen,
    setShowSaveTemplateModal,
    setTemplateName,
    showPlaceholder,
    showSaveTemplateModal,
    status,
    statusText,
    templateName,
    toConfigOverride,
    toggleDossierSection,
  };
}
