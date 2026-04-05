import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  ChatOpenRequest,
  Artifact,
  CaseTemplate,
  Entity,
  FollowUp,
  Headline,
  InvestigationLaunchRequest,
  InvestigationRunConfig,
  InvestigationScope,
  Source,
  SystemConfig,
  WorkspaceRun,
} from '../../../types';
import { useWorkspaceStore } from '../../../store/caseStore';
import { buildWorkspaceBoardDocumentPath } from '../../../app/routes';
import { BackgroundMatrixRain } from '../../ui/BackgroundMatrixRain';
import type { BreadcrumbItem } from '../../ui/Breadcrumbs';
import { MatrixLoader } from '../../ui/MatrixLoader';
import { TaskSetupModal } from '../../ui/TaskSetupModal';
import { AlertOctagon, Layout } from 'lucide-react';
import { getAllScopes, getScopeById } from '../../../data/presets';
import { getLabelProfileById, stripLegacyWorkspacePrefix } from '../../../domain';
import { getArtifactFollowUps, getFollowUpText } from '../../../domain';
import {
  buildWorkspaceArtifactReference,
  buildWorkspaceEntityReference,
  buildWorkspaceHeadlineReference,
} from '../../../services/workspace/library';

// Sub-components
import { Toolbar } from './Toolbar';
import { DossierPanel } from './DossierPanel';
import { ReportViewer } from './ReportViewer';
import { InspectorPanel } from './InspectorPanel';

// --- PROPS ---
interface OperationViewProps {
  task: WorkspaceRun | null;
  reportOverride?: Artifact | null;
  onBack: () => void;
  onDeepDive: (request: InvestigationLaunchRequest) => void;
  onBatchDeepDive: (followUps: FollowUp[], currentReport: Artifact) => void;
  navStack: BreadcrumbItem[];
  onNavigate: (id: string) => void;
  onSelectCase?: (caseId: string) => void;
  onStartNewCase: (request: InvestigationLaunchRequest) => void;
  onInvestigateHeadline?: (request: InvestigationLaunchRequest) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
}

export const OperationView: React.FC<OperationViewProps> = ({
  task,
  reportOverride = null,
  onBack,
  onDeepDive,
  onBatchDeepDive,
  navStack,
  onNavigate,
  onSelectCase,
  onStartNewCase,
  onInvestigateHeadline,
  onOpenChat,
}) => {
  const navigate = useNavigate();
  // Panel visibility
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Responsive logic
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

  // Accordion State for Workspace Dossier
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    caseInfo: false,
    reports: false,
    entities: false,
    leads: false,
    evidence: false,
    sources: false,
    headlines: false, // Default closed
  });

  const toggleDossierSection = (section: string) => {
    setOpenSections((prev) =>
      Object.fromEntries(
        Object.keys(prev).map((key) => [key, key === section ? !prev[section] : false])
      )
    );
  };

  // Selection State for Inspector
  const [inspectorMode, setInspectorMode] = useState<'ENTITY' | 'HEADLINE' | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<Headline | null>(null);

  // Pre-Investigation Modal State
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
    addTemplate,
    updateReportTitle,
    renameEntityAcrossReports,
    activeWorkspaceId: selectedCaseId,
    setActiveWorkspaceId,
    ensureWorkspaceBoard,
    queueBoardPlacement,
    customScopes,
  } = useWorkspaceStore();

  const report = task?.report ?? reportOverride;
  const status = task?.status ?? null;
  const effectiveCaseId = selectedCaseId ?? report?.caseId ?? null;

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

  const resolveScope = (scopeId?: string): InvestigationScope | undefined => {
    if (!scopeId) return undefined;
    return (
      getScopeById(scopeId) || getAllScopes(customScopes).find((scope) => scope.id === scopeId)
    );
  };

  const toConfigOverride = (config?: InvestigationRunConfig): Partial<SystemConfig> | undefined => {
    if (!config) return undefined;
    return {
      provider: config.provider,
      modelId: config.modelId,
      persona: config.persona,
      searchDepth: config.searchDepth,
      generationMode: config.generationMode,
      thinkingBudget: config.thinkingBudget,
    };
  };

  // Removed redundant effects, case switching now handled by store action in Toolbar/index
  // No-op for now to keep structure clean during migration
  useEffect(() => {
    if (selectedCaseId && selectedCaseId !== 'ALL' && !activeCase) {
      // Re-sync if necessary
    }
  }, [selectedCaseId, activeCase]);

  // Handle case selection from dropdown
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
      `${stripLegacyWorkspacePrefix(activeCase?.title || labelProfile.workspaceLabel)}: ${report.topic}`
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
    // Maybe add a toast here if available via store
    useWorkspaceStore.getState().addToast('Template saved successfully', 'SUCCESS');
  };

  // --- Workspace-wide Data Aggregation ---
  const casePanelData = useMemo(() => {
    if (!activeCase || allCaseReports.length === 0) {
      return {
        caseInfo: activeCase,
        reports: [],
        entities: [],
        leads: [],
        sources: [],
      };
    }

    const entityMap = new Map<string, Entity>();
    allCaseReports
      .flatMap((r) => r.entities || [])
      .forEach((e) => {
        const name = typeof e === 'string' ? e : e.name;
        const type = typeof e === 'string' ? 'UNKNOWN' : e.type;
        if (
          !entityMap.has(name) ||
          (entityMap.get(name)?.type === 'UNKNOWN' && type !== 'UNKNOWN')
        ) {
          entityMap.set(name, typeof e === 'string' ? { name, type: 'UNKNOWN' } : e);
        }
      });
    const allEntities = Array.from(entityMap.values());
    const allLeads = Array.from(
      new Set(
        allCaseReports.flatMap((artifact) =>
          getArtifactFollowUps(artifact).map((followUp) => getFollowUpText(followUp))
        )
      )
    );
    const sourceMap = new Map<string, Source>();
    allCaseReports
      .flatMap((r) => r.sources || [])
      .forEach((s) => {
        if (!sourceMap.has(s.url)) {
          sourceMap.set(s.url, s);
        }
      });
    const allSources = Array.from(sourceMap.values());

    return {
      caseInfo: activeCase,
      reports: allCaseReports,
      entities: allEntities,
      leads: allLeads,
      sources: allSources,
    };
  }, [activeCase, allCaseReports]);

  const handleEntityClick = (entity: Entity) => {
    setSelectedEntity(entity);
    setInspectorMode('ENTITY');
    setRightPanelOpen(true);
    // Mobile: Close left panel if open to show content/inspector
    if (window.innerWidth <= 1024) {
      setLeftPanelOpen(false);
    }
  };

  const handleHeadlineClick = (headline: Headline) => {
    setSelectedHeadline(headline);
    setInspectorMode('HEADLINE');
    setRightPanelOpen(true);
    // Mobile: Close left panel if open
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
    // Trigger reload by navigating to same report
    if (report.id) onNavigate(report.id);
  };

  const handleEntityNameSave = async (newName: string) => {
    if (!selectedEntity) return;
    const oldName = selectedEntity.name;
    await renameEntityAcrossReports(oldName, newName);

    // Update flagged nodes if entity was flagged
    if (useWorkspaceStore.getState().flaggedNodeIds.includes(oldName)) {
      useWorkspaceStore.getState().toggleFlag(oldName);
      useWorkspaceStore.getState().toggleFlag(newName);
    }

    // Update selected entity state
    setSelectedEntity({ ...selectedEntity, name: newName });
  };

  const handleFlagEntity = (entityName: string) => {
    useWorkspaceStore.getState().toggleFlag(entityName);
  };

  const handleInvestigateEntity = (entityName: string) => {
    setRightPanelOpen(false);
    handleLeadClick(entityName);
  };

  // --- RENDER LOADING/ERROR STATES ---
  if (task && (status === 'RUNNING' || status === 'QUEUED')) {
    const statusText = task.parentContext
      ? `SUB-NETWORK: "${task.topic}"`
      : `TARGET: "${task.topic}"`;
    return <MatrixLoader statusText={statusText} onRunInBackground={onBack} />;
  }

  if (task && status === 'FAILED') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen">
        <AlertOctagon className="w-16 h-16 text-osint-danger mb-4" />
        <h2 className="text-xl text-white font-bold mb-2">OPERATION FAILED</h2>
        <p className="text-zinc-500 font-mono mb-6">
          {task.error || 'Signal interrupted during data acquisition.'}
        </p>
        <button
          onClick={onBack}
          className="osint-button-primary mt-4 px-4 py-2 font-mono uppercase"
        >
          Return to Base
        </button>
      </div>
    );
  }

  const showPlaceholder = !report || (selectedCaseId === 'ALL' && status !== 'RUNNING');

  return (
    <div className="w-full h-screen bg-black relative flex flex-col overflow-hidden">
      <BackgroundMatrixRain />

      {/* Pre-Investigation Modal */}
      {leadToAnalyze && report && (
        <TaskSetupModal
          initialTopic={leadToAnalyze.text}
          initialContext={leadToAnalyze.context}
          initialScopeId={leadToAnalyze.inheritedScopeId}
          initialConfigOverride={leadToAnalyze.inheritedConfig}
          initialDateRangeOverride={leadToAnalyze.inheritedDateRange}
          inheritanceHint="Inherited from parent report. Change settings below to override this run."
          onCancel={() => setLeadToAnalyze(null)}
          onStart={(topic, configOverride, preseededEntities, scope, dateRange) => {
            onDeepDive({
              topic,
              parentContext: leadToAnalyze.context,
              configOverride: {
                ...(leadToAnalyze.inheritedConfig || {}),
                ...(configOverride || {}),
              },
              preseededEntities,
              scope: scope || resolveScope(leadToAnalyze.inheritedScopeId),
              dateRangeOverride: dateRange || leadToAnalyze.inheritedDateRange,
              launchSource: 'OPERATION_LEAD_MODAL',
              sourceFollowUpId: leadToAnalyze.sourceFollowUpId,
              parentArtifactId: leadToAnalyze.parentArtifactId,
            });
            setLeadToAnalyze(null);
          }}
        />
      )}

      {/* Start New Workspace Modal */}
      {isNewCaseModalOpen && (
        <TaskSetupModal
          initialTopic=""
          onCancel={() => setIsNewCaseModalOpen(false)}
          onStart={(topic, configOverride, preseededEntities, scope, dateRange) => {
            onStartNewCase({
              topic,
              configOverride,
              preseededEntities,
              scope,
              dateRangeOverride: dateRange,
              launchSource: 'OPERATION_NEW_CASE',
            });
            setIsNewCaseModalOpen(false);
          }}
        />
      )}

      {/* Toolbar */}
      <Toolbar
        activeCase={activeCase}
        allCases={allCases}
        selectedCaseId={selectedCaseId}
        report={report}
        allCaseReports={allCaseReports}
        labelProfile={labelProfile}
        leftPanelOpen={leftPanelOpen}
        onToggleLeftPanel={() => {
          setLeftPanelOpen(!leftPanelOpen);
          if (window.innerWidth <= 1024) setRightPanelOpen(false);
        }}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={() => {
          setRightPanelOpen((current) => !current);
          if (window.innerWidth <= 1024) setLeftPanelOpen(false);
        }}
        onSelectCase={handleCaseSelect}
        onStartNewCase={() => setIsNewCaseModalOpen(true)}
        onSaveTemplate={handleSaveTemplate}
        onOpenChat={handleOpenReportChat}
        onOpenBoard={() => {
          void handleOpenWorkspaceBoard();
        }}
        onPlaceReportOnBoard={
          report?.id
            ? () => {
                void handlePlaceReportOnBoard();
              }
            : undefined
        }
      />

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-osint-primary"></div>
            <div className="p-6">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest mb-4 flex items-center">
                <Layout className="w-4 h-4 mr-2 text-osint-primary" />
                Save as Protocol Template
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase">
                    Protocol Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Financial Audit Protocol"
                    className="w-full bg-black border border-zinc-800 p-3 text-xs font-mono text-white focus:border-osint-primary outline-none transition-colors"
                    autoFocus
                  />
                </div>
                <div className="p-3 bg-zinc-800/50 border border-zinc-800">
                  <div className="text-[9px] text-zinc-500 font-mono uppercase mb-1">
                    Investigation Target
                  </div>
                  <div className="text-xs text-zinc-300 font-mono truncate">
                    &quot;{report?.topic}&quot;
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowSaveTemplateModal(false)}
                    className="flex-1 py-2 text-xs font-mono text-zinc-500 hover:text-white transition-colors uppercase border border-zinc-800 hover:border-zinc-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeSaveTemplate}
                    className="osint-button-primary flex-1 py-2 text-xs font-mono font-bold uppercase"
                  >
                    Save Protocol
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Backdrop for Panels */}
      {(leftPanelOpen || rightPanelOpen) && (
        <div
          className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
          onClick={() => {
            setLeftPanelOpen(false);
            setRightPanelOpen(false);
          }}
        />
      )}

      {/* 3-PANEL LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Panel: Dossier */}
        <DossierPanel
          isOpen={leftPanelOpen}
          activeCase={activeCase}
          labelProfile={labelProfile}
          reports={casePanelData.reports}
          entities={casePanelData.entities}
          leads={casePanelData.leads}
          sources={casePanelData.sources}
          headlines={headlines}
          openSections={openSections}
          toggleSection={toggleDossierSection}
          onNavigate={onNavigate}
          onEntityClick={handleEntityClick}
          onLeadClick={handleLeadClick}
          onHeadlineClick={handleHeadlineClick}
          activeReportId={report?.id}
        />

        {/* Center: Report Viewer */}
        <ReportViewer
          report={report}
          navStack={navStack}
          onNavigate={onNavigate}
          showPlaceholder={showPlaceholder}
          onStartNewCase={() => setIsNewCaseModalOpen(true)}
          onTitleSave={handleTitleSave}
          onDeepDive={(followUp) => {
            if (report) {
              onDeepDive({
                topic: getFollowUpText(followUp),
                parentContext: { topic: report.topic, summary: report.summary },
                configOverride: toConfigOverride(report.config),
                scope: resolveScope(report.config?.scopeId),
                dateRangeOverride: report.config?.dateRangeOverride,
                launchSource: 'OPERATION_DEEP_DIVE',
                sourceFollowUpId: followUp.id,
                parentArtifactId: report.id,
              });
            }
          }}
          onBatchDeepDive={(followUps) => {
            if (report) {
              onBatchDeepDive(followUps, report);
            }
          }}
          onEntityClick={handleEntityClick}
        />

        {/* Right Panel: Inspector */}
        <InspectorPanel
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          mode={inspectorMode}
          entity={selectedEntity}
          headline={selectedHeadline}
          reports={allCaseReports}
          onEntitySave={handleEntityNameSave}
          onFlagEntity={handleFlagEntity}
          onInvestigateEntity={handleInvestigateEntity}
          onInvestigateHeadline={handleHeadlineInvestigate}
          onOpenEntityChat={handleOpenEntityChat}
          onOpenHeadlineChat={handleOpenHeadlineChat}
          onPlaceEntityOnBoard={(entityName) => {
            void handlePlaceEntityOnBoard(entityName);
          }}
          onPlaceHeadlineOnBoard={() => {
            void handlePlaceHeadlineOnBoard();
          }}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
};
