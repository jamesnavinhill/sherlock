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
  onSelectCase?: (workspaceId: string) => void;
  reportOverride?: Artifact | null;
  task: WorkspaceRun | null;
}

export function useOperationViewController({
  artifactRouteState,
  onNavigate,
  onInvestigateHeadline,
  onOpenChat,
  onSelectCase,
  reportOverride = null,
  task,
}: OperationViewControllerOptions) {
  const navigate = useNavigate();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    caseInfo: false,
    reports: false,
    entities: false,
    leads: false,
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
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const {
    workspaces: allCases,
    artifacts,
    headlines: allHeadlines,
    addToast,
    addTemplate,
    updateArtifactSection,
    updateArtifactTitle,
    updateArtifactSummary,
    renameEntityAcrossArtifacts,
    activeWorkspaceId: selectedCaseId,
    setActiveWorkspaceId,
    ensureWorkspaceBoard,
    flaggedNodeIds,
    queueBoardPlacement,
    toggleFlag,
    customScopes,
  } = useOperationFeatureState();

  const report = task?.report ?? reportOverride;
  const status = task?.status ?? null;
  const effectiveCaseId = selectedCaseId ?? report?.workspaceId ?? null;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setLeftPanelOpen(false);
      } else {
        setLeftPanelOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedCaseId && selectedCaseId !== 'ALL' && !allCases.find((c) => c.id === effectiveCaseId)) {
      // Keep the dependency seam explicit even though re-sync is store-driven today.
    }
  }, [allCases, effectiveCaseId, selectedCaseId]);

  const activeCase = useMemo(
    () => (allCases.find((c) => c.id === effectiveCaseId) || null) as Workspace | null,
    [allCases, effectiveCaseId]
  );

  const allCaseReports = useMemo(
    () => artifacts.filter((r) => r.workspaceId === effectiveCaseId),
    [artifacts, effectiveCaseId]
  );

  const headlines = useMemo(() => {
    if (!effectiveCaseId) return [];
    return allHeadlines.filter((h) => h.workspaceId === effectiveCaseId);
  }, [effectiveCaseId, allHeadlines]);

  const labelProfile = useMemo(
    () =>
      getLabelProfileById(
        report?.labelProfileId || report?.config?.labelProfileId || activeCase?.labelProfileId
      ),
    [activeCase?.labelProfileId, report?.config?.labelProfileId, report?.labelProfileId]
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

  const handleCaseSelect = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);

    if (workspaceId !== 'ALL' && workspaceId !== '') {
      const caseReports = artifacts.filter((r) => r.workspaceId === workspaceId);
      if (caseReports.length > 0) {
        const rootReport = caseReports.find((r) => !r.config?.parentArtifactId) || caseReports[0];
        if (!rootReport.id) return;
        if (onSelectCase) {
          onSelectCase(rootReport.id);
        } else {
          onNavigate(rootReport.id);
        }
      }
    }
  };

  const handleSaveTemplate = () => {
    if (!report) return;
    setShowSaveTemplateModal(true);
    setTemplateName(
      `${activeCase ? getWorkspaceDisplayTitle(activeCase) : stripLegacyWorkspacePrefix(labelProfile.workspaceLabel)}: ${sanitizeDisplayTitle(report.topic)}`
    );
  };

  const executeSaveTemplate = () => {
    if (!report || !templateName.trim()) return;

    const newTemplate: WorkspaceTemplate = {
      id: `tpl-${Date.now()}`,
      name: templateName.trim(),
      topic: report.topic,
      config: report.config || {},
      createdAt: Date.now(),
    };

    addTemplate(newTemplate);
    setShowSaveTemplateModal(false);
    addToast('Template saved successfully', 'SUCCESS');
  };

  const casePanelData = useMemo(
    () =>
      buildOperationWorkspacePanelData({
        activeCase,
        reports: allCaseReports,
      }),
    [activeCase, allCaseReports]
  );

  const handleLeadClick = (lead: string | FollowUp) => {
    const parentContext = report
      ? { topic: report.topic, summary: report.summary }
      : activeCase
        ? {
            topic: activeCase.title,
            summary: activeCase.description || `Investigating lead within ${activeCase.title}`,
          }
        : undefined;

    setLeadToAnalyze({
      text: typeof lead === 'string' ? lead : getFollowUpText(lead),
      sourceFollowUpId: typeof lead === 'string' ? undefined : lead.id,
      context: parentContext,
      inheritedConfig: toConfigOverride(report?.config),
      inheritedScopeId: report?.config?.scopeId,
      inheritedDateRange: report?.config?.dateRangeOverride,
      parentArtifactId: report?.id,
    });
  };

  const {
    handleEntityClick,
    handleHeadlineClick,
    handleHeadlineInvestigate,
    handleInvestigateEntity,
    handleOpenEntityChat,
    handleOpenHeadlineChat,
    handleOpenReportChat,
    handleOpenReportInspector,
    handleOpenWorkspaceBoard,
    handlePlaceEntityOnBoard,
    handlePlaceHeadlineOnBoard,
    handlePlaceReportOnBoard,
    inspectorMode,
    rightPanelOpen,
    selectedEntity,
    selectedHeadline,
    setRightPanelOpen,
    setSelectedEntity,
  } = useOperationViewInspectorState({
    activeWorkspace: activeCase,
    artifactRouteState,
    closeLeftPanelForMobile: () => {
      if (window.innerWidth <= 1024) {
        setLeftPanelOpen(false);
      }
    },
    effectiveWorkspaceId: effectiveCaseId,
    ensureWorkspaceBoard,
    navigate,
    onInvestigateHeadline,
    onInvestigateEntity: (entityName) => handleLeadClick(entityName),
    onOpenChat,
    queueBoardPlacement,
    report,
    resolveScope,
    toConfigOverride,
  });

  const handleTitleSave = async (newTitle: string) => {
    if (!report) return;
    if (report.id) {
      await updateArtifactTitle(report.id, newTitle);
    }
    if (report.id) onNavigate(report.id);
  };

  const handleReportBodySave = async (summary: string, sectionId?: string) => {
    if (!report?.id) return;

    await updateArtifactSummary(report.id, summary);
    if (sectionId) {
      await updateArtifactSection(report.id, sectionId, {
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

  const isTaskRunning = task && (status === 'RUNNING' || status === 'QUEUED');
  const isTaskFailed = task && status === 'FAILED';
  const statusText = task
    ? task.parentContext
      ? `SUB-NETWORK: "${task.topic}"`
      : `TARGET: "${task.topic}"`
    : '';
  const showPlaceholder = !report || (selectedCaseId === 'ALL' && status !== 'RUNNING');

  return {
    activeCase,
    allCaseReports,
    allCases,
    casePanelData,
    executeSaveTemplate,
    handleCaseSelect,
    handleEntityClick,
    handleEntityNameSave,
    handleFlagEntity,
    handleHeadlineClick,
    handleHeadlineInvestigate,
    handleInvestigateEntity,
    handleLeadClick,
    handleOpenEntityChat,
    handleOpenHeadlineChat,
    handleOpenReportInspector,
    handleOpenReportChat,
    handleOpenWorkspaceBoard,
    handlePlaceEntityOnBoard,
    handlePlaceHeadlineOnBoard,
    handlePlaceReportOnBoard,
    handleReportBodySave,
    handleSaveTemplate,
    handleTitleSave,
    headlines,
    inspectorMode,
    isNewCaseModalOpen,
    isTaskFailed,
    isTaskRunning,
    labelProfile,
    leadToAnalyze,
    leftPanelOpen,
    onNavigate,
    openSections,
    report,
    resolveScope,
    rightPanelOpen,
    selectedCaseId,
    selectedEntity,
    selectedHeadline,
    addToast,
    setIsNewCaseModalOpen,
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
