import React from 'react';
import type {
  ChatOpenRequest,
  Artifact,
  FollowUp,
  InvestigationLaunchRequest,
  WorkspaceRun,
} from '../../../types';
import { BackgroundMatrixRain } from '../../ui/BackgroundMatrixRain';
import type { BreadcrumbItem } from '../../ui/Breadcrumbs';
import { MatrixLoader } from '../../ui/MatrixLoader';
import { TaskSetupModal } from '../Runs/TaskSetupModal';
import { AlertOctagon, Layout } from 'lucide-react';
import { getFollowUpText } from '../../../domain';

// Sub-components
import { Toolbar } from './Toolbar';
import { DossierPanel } from './DossierPanel';
import { ReportViewer } from './ReportViewer';
import { InspectorPanel } from './InspectorPanel';
import { useOperationViewController } from './useOperationViewController';

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
  const {
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
    handleOpenReportChat,
    handleOpenWorkspaceBoard,
    handlePlaceEntityOnBoard,
    handlePlaceHeadlineOnBoard,
    handlePlaceReportOnBoard,
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
    openSections,
    report,
    resolveScope,
    rightPanelOpen,
    selectedCaseId,
    selectedEntity,
    selectedHeadline,
    setIsNewCaseModalOpen,
    setLeadToAnalyze,
    setLeftPanelOpen,
    setRightPanelOpen,
    setShowSaveTemplateModal,
    setTemplateName,
    showPlaceholder,
    showSaveTemplateModal,
    statusText,
    templateName,
    toConfigOverride,
    toggleDossierSection,
  } = useOperationViewController({
    onNavigate,
    onInvestigateHeadline,
    onOpenChat,
    onSelectCase,
    reportOverride,
    task,
  });

  if (isTaskRunning) {
    return <MatrixLoader statusText={statusText} onRunInBackground={onBack} />;
  }

  if (isTaskFailed) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen">
        <AlertOctagon className="w-16 h-16 text-osint-danger mb-4" />
        <h2 className="text-xl text-white font-bold mb-2">OPERATION FAILED</h2>
        <p className="text-zinc-500 font-mono mb-6">
          {task?.error || 'Signal interrupted during data acquisition.'}
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
