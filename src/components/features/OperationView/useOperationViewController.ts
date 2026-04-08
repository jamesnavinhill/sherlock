import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type {
  Artifact,
  CaseTemplate,
  Entity,
  FollowUp,
  Headline,
  InvestigationLaunchRequest,
  InvestigationRunConfig,
  InvestigationScope,
  SystemConfig,
  WorkspaceRun,
} from '@/types';
import { useOperationFeatureState } from '@/store/selectors/featureSelectors';
import { buildWorkspaceBoardDocumentPath, type ArtifactRouteState } from '@/app/routes';
import {
  getWorkspaceDisplayTitle,
  getFollowUpText,
  getLabelProfileById,
  stripLegacyWorkspacePrefix,
} from '@/domain';
import {
  buildWorkspaceArtifactReference,
  buildWorkspaceEntityReference,
  buildWorkspaceHeadlineReference,
} from '@/services/workspace/library';
import {
  resolveRuntimeScope,
  toRuntimeConfigOverride,
} from '@/components/features/Runs/runtimeConfigMapping';
import { buildOperationCasePanelData } from './operationCasePanelData';

interface OperationViewControllerOptions {
  artifactRouteState?: ArtifactRouteState;
  onNavigate: (id: string) => void;
  onInvestigateHeadline?: (request: InvestigationLaunchRequest) => void;
  onOpenChat: (request: { workspaceId: string; launchContext?: Record<string, unknown> }) => void;
  onSelectCase?: (caseId: string) => void;
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
  const lastAppliedArtifactFocusKeyRef = useRef<string | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    caseInfo: false,
    reports: false,
    entities: false,
    leads: false,
    evidence: false,
    sources: false,
    headlines: false,
  });
  const [inspectorMode, setInspectorMode] = useState<'ENTITY' | 'HEADLINE' | 'REPORT' | null>(
    null
  );
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<Headline | null>(null);
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
    updateReportTitle,
    updateReportSummary,
    renameEntityAcrossReports,
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
  const effectiveCaseId = selectedCaseId ?? report?.caseId ?? null;

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

  useEffect(() => {
    if (!report) return;

    const focusKey = [
      report.id || report.topic,
      artifactRouteState?.inspector || '',
      artifactRouteState?.focusSectionId || '',
      artifactRouteState?.focusEvidenceId || '',
    ].join(':');

    const shouldOpenReportInspector =
      artifactRouteState?.inspector === 'REPORT' ||
      !!artifactRouteState?.focusSectionId ||
      !!artifactRouteState?.focusEvidenceId;

    if (shouldOpenReportInspector && lastAppliedArtifactFocusKeyRef.current !== focusKey) {
      lastAppliedArtifactFocusKeyRef.current = focusKey;
      queueMicrotask(() => {
        setSelectedEntity(null);
        setSelectedHeadline(null);
        setInspectorMode('REPORT');
        setRightPanelOpen(true);
        if (window.innerWidth <= 1024) {
          setLeftPanelOpen(false);
        }
      });
      return;
    }

    if (!inspectorMode) {
      queueMicrotask(() => {
        setInspectorMode('REPORT');
      });
    }
  }, [
    artifactRouteState?.focusEvidenceId,
    artifactRouteState?.focusSectionId,
    artifactRouteState?.inspector,
    inspectorMode,
    report,
  ]);

  const activeCase = useMemo(
    () => allCases.find((c) => c.id === effectiveCaseId) || null,
    [allCases, effectiveCaseId]
  );

  const allCaseReports = useMemo(
    () => artifacts.filter((r) => r.caseId === effectiveCaseId),
    [artifacts, effectiveCaseId]
  );

  const headlines = useMemo(() => {
    if (!effectiveCaseId) return [];
    return allHeadlines.filter((h) => h.caseId === effectiveCaseId);
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

  const handleCaseSelect = (caseId: string) => {
    setActiveWorkspaceId(caseId);

    if (caseId !== 'ALL' && caseId !== '') {
      const caseReports = artifacts.filter((r) => r.caseId === caseId);
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
      `${activeCase ? getWorkspaceDisplayTitle(activeCase) : stripLegacyWorkspacePrefix(labelProfile.workspaceLabel)}: ${report.topic}`
    );
  };

  const executeSaveTemplate = () => {
    if (!report || !templateName.trim()) return;

    const newTemplate: CaseTemplate = {
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
      buildOperationCasePanelData({
        activeCase,
        reports: allCaseReports,
      }),
    [activeCase, allCaseReports]
  );

  const handleEntityClick = (entity: Entity) => {
    setSelectedHeadline(null);
    setSelectedEntity(entity);
    setInspectorMode('ENTITY');
    setRightPanelOpen(true);
    if (window.innerWidth <= 1024) {
      setLeftPanelOpen(false);
    }
  };

  const handleHeadlineClick = (headline: Headline) => {
    setSelectedEntity(null);
    setSelectedHeadline(headline);
    setInspectorMode('HEADLINE');
    setRightPanelOpen(true);
    if (window.innerWidth <= 1024) {
      setLeftPanelOpen(false);
    }
  };

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

  const handleHeadlineInvestigate = () => {
    if (!selectedHeadline || !onInvestigateHeadline) return;

    onInvestigateHeadline({
      topic: selectedHeadline.content,
      parentContext: activeCase
        ? { topic: activeCase.title, summary: activeCase.description || '' }
        : undefined,
      configOverride: toConfigOverride(report?.config),
      scope: resolveScope(report?.config?.scopeId),
      dateRangeOverride: report?.config?.dateRangeOverride,
      launchSource: 'OPERATION_HEADLINE',
      sourceSignalId: selectedHeadline.id,
      parentArtifactId: report?.id,
    });
    setRightPanelOpen(false);
  };

  const handleOpenReportChat = () => {
    const workspaceId = effectiveCaseId || report?.caseId;
    if (!workspaceId) return;

    onOpenChat({
      workspaceId,
      launchContext: report?.id
        ? {
            sourceReportId: report.id,
          }
        : undefined,
    });
  };

  const handleOpenReportInspector = () => {
    if (!report) return;
    setSelectedEntity(null);
    setSelectedHeadline(null);
    setInspectorMode('REPORT');
    setRightPanelOpen(true);
    if (window.innerWidth <= 1024) {
      setLeftPanelOpen(false);
    }
  };

  const handleOpenWorkspaceBoard = async () => {
    const workspaceId = effectiveCaseId || report?.caseId;
    if (!workspaceId) return;

    const board = await ensureWorkspaceBoard(workspaceId);
    navigate(buildWorkspaceBoardDocumentPath(workspaceId, board.id));
  };

  const handlePlaceReferenceOnBoard = async (
    reference:
      | ReturnType<typeof buildWorkspaceArtifactReference>
      | ReturnType<typeof buildWorkspaceEntityReference>
      | ReturnType<typeof buildWorkspaceHeadlineReference>
  ) => {
    const board = await ensureWorkspaceBoard(reference.workspaceId);
    queueBoardPlacement({
      workspaceId: reference.workspaceId,
      boardId: board.id,
      item: reference,
      openInBoard: true,
    });
    navigate(buildWorkspaceBoardDocumentPath(reference.workspaceId, board.id));
  };

  const handlePlaceReportOnBoard = async () => {
    const workspaceId = effectiveCaseId || report?.caseId;
    if (!workspaceId || !report?.id) return;

    await handlePlaceReferenceOnBoard(
      buildWorkspaceArtifactReference(workspaceId, { ...report, id: report.id })
    );
  };

  const handleOpenEntityChat = (entityName: string) => {
    const workspaceId = effectiveCaseId || report?.caseId;
    if (!workspaceId) return;

    onOpenChat({
      workspaceId,
      launchContext: {
        entityName,
      },
    });
    setRightPanelOpen(false);
  };

  const handlePlaceEntityOnBoard = async (entityName: string) => {
    const workspaceId = effectiveCaseId || report?.caseId;
    if (!workspaceId) return;

    const entity =
      selectedEntity && selectedEntity.name === entityName
        ? selectedEntity
        : ({ name: entityName, type: 'UNKNOWN' } satisfies Entity);

    await handlePlaceReferenceOnBoard(buildWorkspaceEntityReference(workspaceId, entity));
    setRightPanelOpen(false);
  };

  const handleOpenHeadlineChat = () => {
    const workspaceId = effectiveCaseId || selectedHeadline?.caseId || report?.caseId;
    if (!workspaceId || !selectedHeadline) return;

    onOpenChat({
      workspaceId,
      launchContext: {
        signalId: selectedHeadline.id,
        headlineId: selectedHeadline.id,
      },
    });
    setRightPanelOpen(false);
  };

  const handlePlaceHeadlineOnBoard = async () => {
    const workspaceId = effectiveCaseId || selectedHeadline?.caseId || report?.caseId;
    if (!workspaceId || !selectedHeadline) return;

    await handlePlaceReferenceOnBoard(
      buildWorkspaceHeadlineReference(workspaceId, selectedHeadline)
    );
    setRightPanelOpen(false);
  };

  const handleTitleSave = async (newTitle: string) => {
    if (!report) return;
    if (report.id) {
      await updateReportTitle(report.id, newTitle);
    }
    if (report.id) onNavigate(report.id);
  };

  const handleReportBodySave = async (summary: string, sectionId?: string) => {
    if (!report?.id) return;

    await updateReportSummary(report.id, summary);
    if (sectionId) {
      await updateArtifactSection(report.id, sectionId, {
        content: summary,
      });
    }
    addToast('Report updated.', 'SUCCESS');
  };

  const handleEntityNameSave = async (newName: string) => {
    if (!selectedEntity) return;
    const oldName = selectedEntity.name;
    await renameEntityAcrossReports(oldName, newName);

    if (flaggedNodeIds.includes(oldName)) {
      toggleFlag(oldName);
      toggleFlag(newName);
    }

    setSelectedEntity({ ...selectedEntity, name: newName });
  };

  const handleFlagEntity = (entityName: string) => {
    toggleFlag(entityName);
  };

  const handleInvestigateEntity = (entityName: string) => {
    setRightPanelOpen(false);
    handleLeadClick(entityName);
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
