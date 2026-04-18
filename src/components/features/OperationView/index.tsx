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
import { PageShell } from '@/components/system/layout/PageShell';

// Sub-components
import { Toolbar } from './Toolbar';
import { WorkspaceRail } from './WorkspaceLibraryRail';
import { ArtifactViewer } from './ArtifactViewer';
import { OperationInspectorPanel } from './OperationInspectorPanel';
import { useOperationViewController } from './useOperationViewController';
import { OperationViewDialogs } from './OperationViewDialogs';

// --- PROPS ---
interface OperationViewProps {
  run: WorkspaceRun | null;
  artifactOverride?: Artifact | null;
  artifactRouteState?: ArtifactRouteState;
  onBack: () => void;
  onDeepDive: (request: InvestigationLaunchRequest) => void;
  navStack: BreadcrumbItem[];
  onNavigate: (id: string) => void;
  onSelectArtifact?: (artifactId: string) => void;
  onStartWorkspace: (request: InvestigationLaunchRequest) => void;
  onInvestigateHeadline?: (request: InvestigationLaunchRequest) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
}

export const OperationView: React.FC<OperationViewProps> = ({
  run,
  artifactOverride = null,
  artifactRouteState,
  onBack,
  onDeepDive,
  navStack,
  onNavigate,
  onSelectArtifact,
  onStartWorkspace,
  onInvestigateHeadline,
  onOpenChat,
}) => {
  const {
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
    statusText,
    templateName,
    toggleDossierSection,
  } = useOperationViewController({
    artifactRouteState,
    onNavigate,
    onInvestigateHeadline,
    onOpenChat,
    onSelectArtifact,
    artifactOverride,
    run,
  });

  const [inspectorFocusedSectionId, setInspectorFocusedSectionId] = React.useState<
    string | undefined
  >(undefined);
  const [inspectorFocusedEvidenceId, setInspectorFocusedEvidenceId] = React.useState<
    string | undefined
  >(undefined);

  React.useEffect(() => {
    setInspectorFocusedSectionId(undefined);
    setInspectorFocusedEvidenceId(undefined);
  }, [artifactRouteState?.focusEvidenceId, artifactRouteState?.focusSectionId, artifact?.id]);

  if (isRunRunning) {
    return <MatrixLoader statusText={statusText} onRunInBackground={onBack} />;
  }

  if (isRunFailed) {
    return (
      <div className="osint-shell-empty flex h-full min-h-screen flex-col items-center justify-center">
        <AlertOctagon className="w-16 h-16 text-osint-danger mb-4" />
        <h2 className="text-xl text-white font-bold mb-2">OPERATION FAILED</h2>
        <p className="text-zinc-500 font-mono mb-6">
          {run?.error || 'Signal interrupted during data acquisition.'}
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
    <PageShell
      className="osint-shell-stage h-screen w-full"
      toolbar={
        <Toolbar
          activeWorkspace={activeWorkspace}
          allWorkspaces={allWorkspaces}
          selectedWorkspaceId={selectedWorkspaceId}
          artifact={artifact}
          workspaceArtifacts={workspaceArtifacts}
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
            handleOpenArtifactInspector();
          }}
          onSelectWorkspace={handleWorkspaceSelect}
          onStartWorkspace={() => setIsNewWorkspaceModalOpen(true)}
          onSaveTemplate={handleSaveTemplate}
          onOpenChat={handleOpenArtifactChat}
          onOpenBoard={() => {
            void handleOpenWorkspaceBoard();
          }}
          onPlaceArtifactOnBoard={
            artifact?.id
              ? () => {
                  void handlePlaceArtifactOnBoard();
                }
              : undefined
          }
        />
      }
    >
      <OperationViewDialogs
        leadToAnalyze={leadToAnalyze}
        artifact={artifact}
        isNewWorkspaceModalOpen={isNewWorkspaceModalOpen}
        showSaveTemplateModal={showSaveTemplateModal}
        templateName={templateName}
        onTemplateNameChange={setTemplateName}
        onCloseLeadDialog={() => setLeadToAnalyze(null)}
        onCloseNewWorkspaceDialog={() => setIsNewWorkspaceModalOpen(false)}
        onCloseSaveTemplateDialog={() => setShowSaveTemplateModal(false)}
        onDeepDive={onDeepDive}
        onStartWorkspace={onStartWorkspace}
        onExecuteSaveTemplate={executeSaveTemplate}
        resolveScope={resolveScope}
      />

      {/* Mobile Backdrop for Panels */}
      {(leftPanelOpen || rightPanelOpen) && (
        <div
          className="osint-shell-backdrop absolute inset-0 z-20 animate-in fade-in duration-300 lg:hidden"
          onClick={() => {
            setLeftPanelOpen(false);
            setRightPanelOpen(false);
          }}
        />
      )}

      {/* 3-PANEL LAYOUT */}
      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        {/* Left Panel: Dossier */}
        <WorkspaceRail
          isOpen={leftPanelOpen}
          activeWorkspace={activeWorkspace}
          labelProfile={labelProfile}
          artifacts={workspacePanelData.artifacts}
          findings={workspacePanelData.findings}
          entities={workspacePanelData.entities}
          followUps={workspacePanelData.followUps}
          sources={workspacePanelData.sources}
          headlines={headlines}
          openSections={openSections}
          toggleSection={toggleDossierSection}
          onNavigate={onNavigate}
          onEntityClick={handleEntityClick}
          onFollowUpClick={handleFollowUpClick}
          onHeadlineClick={handleHeadlineClick}
          activeArtifactId={artifact?.id}
        />

        {/* Center: Artifact Viewer */}
        <ArtifactViewer
          artifact={artifact}
          focusedSectionId={inspectorFocusedSectionId ?? artifactRouteState?.focusSectionId}
          focusedEvidenceId={inspectorFocusedEvidenceId ?? artifactRouteState?.focusEvidenceId}
          navStack={navStack}
          onNavigate={onNavigate}
          showPlaceholder={showPlaceholder}
          onStartWorkspace={() => setIsNewWorkspaceModalOpen(true)}
          onTitleSave={handleTitleSave}
          onArtifactBodySave={handleArtifactBodySave}
          onFollowUpOpen={handleFollowUpClick}
          onEntityClick={handleEntityClick}
          onNotify={addToast}
        />

        {/* Right Panel: Inspector */}
        <OperationInspectorPanel
          isOpen={rightPanelOpen}
          mode={inspectorMode}
          artifact={artifact}
          labelProfile={labelProfile}
          workspaceTitle={activeWorkspace ? getWorkspaceDisplayTitle(activeWorkspace) : null}
          entity={selectedEntity}
          headline={selectedHeadline}
          artifacts={workspaceArtifacts}
          onEntitySave={handleEntityNameSave}
          onFlagEntity={handleFlagEntity}
          onInvestigateEntity={handleInvestigateEntity}
          onInvestigateHeadline={handleHeadlineInvestigate}
          onOpenEntityChat={handleOpenEntityChat}
          onOpenHeadlineChat={handleOpenHeadlineChat}
          onOpenArtifactChat={handleOpenArtifactChat}
          onPlaceEntityOnBoard={(entityName) => {
            void handlePlaceEntityOnBoard(entityName);
          }}
          onPlaceHeadlineOnBoard={() => {
            void handlePlaceHeadlineOnBoard();
          }}
          onPlaceArtifactOnBoard={() => {
            void handlePlaceArtifactOnBoard();
          }}
          onSelectArtifactEntity={handleEntityClick}
          onOpenArtifactFollowUp={handleFollowUpClick}
          onJumpToArtifactSection={(sectionId) => {
            setInspectorFocusedEvidenceId(undefined);
            setInspectorFocusedSectionId(sectionId);
          }}
          onJumpToArtifactEvidence={(evidenceId) => {
            setInspectorFocusedSectionId(undefined);
            setInspectorFocusedEvidenceId(evidenceId);
          }}
          onNavigate={onNavigate}
        />
      </div>
    </PageShell>
  );
};
