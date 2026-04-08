import React from 'react';
import type { ArtifactRouteState } from '@/app/routes';
import type {
  ChatOpenRequest,
  Artifact,
  InvestigationLaunchRequest,
  WorkspaceRun,
} from '../../../types';
import type { BreadcrumbItem } from '../../ui/Breadcrumbs';
import { MatrixLoader } from '../../ui/MatrixLoader';
import { AlertOctagon } from 'lucide-react';
import { getWorkspaceDisplayTitle } from '@/domain';

// Sub-components
import { Toolbar } from './Toolbar';
import { DossierPanel } from './DossierPanel';
import { ArtifactViewer } from './ArtifactViewer';
import { InspectorPanel } from './InspectorPanel';
import { useOperationViewController } from './useOperationViewController';
import { OperationViewDialogs } from './OperationViewDialogs';

// --- PROPS ---
interface OperationViewProps {
  task: WorkspaceRun | null;
  reportOverride?: Artifact | null;
  artifactRouteState?: ArtifactRouteState;
  onBack: () => void;
  onDeepDive: (request: InvestigationLaunchRequest) => void;
  navStack: BreadcrumbItem[];
  onNavigate: (id: string) => void;
  onSelectCase?: (workspaceId: string) => void;
  onStartNewCase: (request: InvestigationLaunchRequest) => void;
  onInvestigateHeadline?: (request: InvestigationLaunchRequest) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
}

export const OperationView: React.FC<OperationViewProps> = ({
  task,
  reportOverride = null,
  artifactRouteState,
  onBack,
  onDeepDive,
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
    statusText,
    templateName,
    toggleDossierSection,
  } = useOperationViewController({
    artifactRouteState,
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
      <OperationViewDialogs
        leadToAnalyze={leadToAnalyze}
        report={report}
        isNewCaseModalOpen={isNewCaseModalOpen}
        showSaveTemplateModal={showSaveTemplateModal}
        templateName={templateName}
        onTemplateNameChange={setTemplateName}
        onCloseLeadDialog={() => setLeadToAnalyze(null)}
        onCloseNewCaseDialog={() => setIsNewCaseModalOpen(false)}
        onCloseSaveTemplateDialog={() => setShowSaveTemplateModal(false)}
        onDeepDive={onDeepDive}
        onStartNewCase={onStartNewCase}
        onExecuteSaveTemplate={executeSaveTemplate}
        resolveScope={resolveScope}
      />

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
          if (rightPanelOpen) {
            setRightPanelOpen(false);
            return;
          }
          handleOpenReportInspector();
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
        <ArtifactViewer
          report={report}
          workspaceTitle={activeCase ? getWorkspaceDisplayTitle(activeCase) : null}
          focusedSectionId={artifactRouteState?.focusSectionId}
          focusedEvidenceId={artifactRouteState?.focusEvidenceId}
          navStack={navStack}
          onNavigate={onNavigate}
          showPlaceholder={showPlaceholder}
          onStartNewCase={() => setIsNewCaseModalOpen(true)}
          onTitleSave={handleTitleSave}
          onReportBodySave={handleReportBodySave}
          onLeadOpen={handleLeadClick}
          onEntityClick={handleEntityClick}
          onNotify={addToast}
        />

        {/* Right Panel: Inspector */}
        <InspectorPanel
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          mode={inspectorMode}
          report={report}
          workspaceTitle={activeCase ? getWorkspaceDisplayTitle(activeCase) : null}
          entity={selectedEntity}
          headline={selectedHeadline}
          reports={allCaseReports}
          onEntitySave={handleEntityNameSave}
          onFlagEntity={handleFlagEntity}
          onInvestigateEntity={handleInvestigateEntity}
          onInvestigateHeadline={handleHeadlineInvestigate}
          onOpenEntityChat={handleOpenEntityChat}
          onOpenHeadlineChat={handleOpenHeadlineChat}
          onOpenReportChat={handleOpenReportChat}
          onPlaceEntityOnBoard={(entityName) => {
            void handlePlaceEntityOnBoard(entityName);
          }}
          onPlaceHeadlineOnBoard={() => {
            void handlePlaceHeadlineOnBoard();
          }}
          onPlaceReportOnBoard={() => {
            void handlePlaceReportOnBoard();
          }}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
};
