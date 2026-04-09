import React, { useEffect, useRef } from 'react';
import { Network } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { ChatOpenRequest, InvestigationLaunchRequest, Artifact } from '../../../types';
import type { NetworkRouteState } from '@/app/routes';
import type { BreadcrumbItem } from '../../ui/Breadcrumbs';
import { EmptyState } from '../../ui/EmptyState';

// Components
import { ControlBar } from './ControlBar';
import type { GraphCanvasRef } from './GraphCanvas';
import { GraphCanvas } from './GraphCanvas';
import { GraphViewportControls } from './GraphViewportControls';
import { NodeInspector } from './NodeInspector';
import { DossierPanel } from '../OperationView/DossierPanel'; // REUSE
import { useNetworkGraphController } from './useNetworkGraphController';
import { NetworkGraphDialogs } from './NetworkGraphDialogs';
import { getEntityGraphNodeId } from './networkGraphNodeIds';
import { addNetworkEntityFocusListener } from '@/services/workspace/workspaceSurfaceFocus';

interface NetworkGraphProps {
  onOpenReport: (report: Artifact) => void;
  onInvestigateEntity: (request: InvestigationLaunchRequest) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
  routeState?: NetworkRouteState;
  onBack?: () => void;
  navStack?: BreadcrumbItem[];
  onNavigate?: (id: string) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  onOpenReport,
  onInvestigateEntity,
  onOpenChat,
  routeState,
  onBack: _onBack,
  navStack: _navStack,
  onNavigate: _onNavigate,
}) => {
  const [searchParams] = useSearchParams();
  const graphRef = useRef<GraphCanvasRef>(null);
  const {
    activeScopeId,
    aliases,
    confirmDeleteNode,
    dossierData,
    dossierLabelProfile,
    dossierSections,
    filterWorkspaceId,
    flaggedNodeIds,
    handleWorkspaceChange,
    handleCreateManualLink,
    handleCreateNode,
    handleDeleteNode,
    handleEntitySave,
    handleGraphStatsUpdate,
    handleLeadInvestigate,
    handleNodeClick,
    handleOpenEntityChat,
    handleOpenEntityInspector,
    handleOpenHeadlineChat,
    handleOpenHeadlineInspector,
    handleOpenReportChat,
    handleOpenReportInspector,
    handlePlaceEntityOnBoard,
    handlePlaceHeadlineOnBoard,
    handlePlaceReportOnBoard,
    handleReportSave,
    handleToggleFlag,
    handleToggleHide,
    hiddenNodeIds,
    inspectorMode,
    isEmpty,
    isLinkingMode,
    isLocked,
    linkSourceNode,
    manualLinks,
    manualNodes,
    newNodeLabel,
    newNodeSubtype,
    newNodeType,
    nodePendingDeletion,
    pendingClusterCount,
    reports,
    selectedEntityName,
    selectedHeadline,
    selectedLeadForAnalysis,
    selectedNode,
    selectedReport,
    setAliases,
    setIsLinkingMode,
    setIsLocked,
    setLinkSourceNode,
    setNewNodeLabel,
    setNewNodeSubtype,
    setNewNodeType,
    setNodePendingDeletion,
    setSelectedLeadForAnalysis,
    setShowAddNodeUI,
    setShowFlaggedOnly,
    setShowHiddenNodes,
    setShowLeftPanel,
    setShowResolutionModal,
    setShowRightPanel,
    setShowSingletons,
    showAddNodeUI,
    showFlaggedOnly,
    showHiddenNodes,
    showLeftPanel,
    showResolutionModal,
    showRightPanel,
    showSingletons,
    subtypeOptions,
    toggleDossierSection,
    workspaces,
  } = useNetworkGraphController({
    onInvestigateEntity,
    onOpenChat,
  });

  useEffect(
    () =>
      addNetworkEntityFocusListener(({ workspaceId, entityName }) => {
        if (!workspaceId || workspaceId !== filterWorkspaceId) return;
        handleOpenEntityInspector(entityName);
        graphRef.current?.focusNode(getEntityGraphNodeId(entityName));
      }),
    [filterWorkspaceId, handleOpenEntityInspector]
  );

  useEffect(() => {
    const focusEntity = routeState?.focusEntity || searchParams.get('focusEntity') || '';
    if (!focusEntity || !filterWorkspaceId) return;
    handleOpenEntityInspector(focusEntity);
    graphRef.current?.focusNode(getEntityGraphNodeId(focusEntity));
  }, [filterWorkspaceId, handleOpenEntityInspector, routeState?.focusEntity, searchParams]);

  return (
    <div className="w-full h-screen bg-osint-dark relative flex flex-col overflow-hidden">
      <ControlBar
        workspaces={workspaces}
        filterWorkspaceId={filterWorkspaceId || ''}
        onWorkspaceChange={handleWorkspaceChange}
        showLeftPanel={showLeftPanel}
        onToggleLeftPanel={() => setShowLeftPanel(!showLeftPanel)}
        showRightPanel={showRightPanel}
        onToggleRightPanel={() => setShowRightPanel(!showRightPanel)}
        isLinkingMode={isLinkingMode}
        onToggleLinkingMode={() => setIsLinkingMode(!isLinkingMode)}
        onShowAddNode={() => setShowAddNodeUI(true)}
        onShowResolution={() => setShowResolutionModal(true)}
        pendingClusterCount={pendingClusterCount}
      />

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Dossier Panel (Reused) */}
        <DossierPanel
          isOpen={showLeftPanel}
          overlayOnDesktop
          showHeaderSummary={false}
          activeCase={workspaces.find((workspace) => workspace.id === filterWorkspaceId) || null}
          labelProfile={dossierLabelProfile}
          reports={dossierData.reports}
          entities={dossierData.entities}
          leads={dossierData.leads}
          sources={dossierData.sources}
          headlines={dossierData.headlines}
          openSections={dossierSections}
          toggleSection={toggleDossierSection}
          onNavigate={(id) => {
            // Dossier click handling: Open Inspector if possible
            const r = reports.find((x) => x.id === id);
            if (r) handleOpenReportInspector(r);
          }}
          onEntityClick={(e) => handleOpenEntityInspector(e.name)}
          onLeadClick={handleLeadInvestigate}
          onHeadlineClick={handleOpenHeadlineInspector}
        />

        {/* Main Graph Canvas */}
        <div className="flex-1 relative z-0">
          {isEmpty ? (
            <div className="absolute inset-0 bg-osint-dark animate-in fade-in duration-700">
              <EmptyState
                icon={Network}
                title="Graph Empty"
                description="No intelligence nodes or link vectors have been saved for this workspace yet. Save artifacts or add a manual node to begin mapping relationships."
                action={{
                  label: 'Add Manual Node',
                  onClick: () => setShowAddNodeUI(true),
                }}
                panelClassName="max-w-xl"
              />
            </div>
          ) : (
            <>
              <GraphCanvas
                ref={graphRef}
                reports={reports}
                manualLinks={manualLinks}
                manualNodes={manualNodes}
                workspaces={workspaces}
                aliases={aliases}
                hiddenNodeIds={hiddenNodeIds}
                flaggedNodeIds={flaggedNodeIds}
                filterWorkspaceId={filterWorkspaceId || ''}
                showSingletons={showSingletons}
                showHiddenNodes={showHiddenNodes}
                showFlaggedOnly={showFlaggedOnly}
                isLinkingMode={isLinkingMode}
                linkSourceNode={linkSourceNode}
                isLocked={isLocked}
                onNodeClick={handleNodeClick}
                onSetLinkSource={setLinkSourceNode}
                onCreateManualLink={handleCreateManualLink}
                onStatsUpdate={handleGraphStatsUpdate}
              />
              <GraphViewportControls
                showSingletons={showSingletons}
                onToggleSingletons={() => setShowSingletons(!showSingletons)}
                showHiddenNodes={showHiddenNodes}
                onToggleHiddenNodes={() => setShowHiddenNodes(!showHiddenNodes)}
                showFlaggedOnly={showFlaggedOnly}
                onToggleFlaggedOnly={() => setShowFlaggedOnly(!showFlaggedOnly)}
                onZoom={(dir) =>
                  dir === 'IN' ? graphRef.current?.zoomIn() : graphRef.current?.zoomOut()
                }
                isLocked={isLocked}
                onToggleLock={() => setIsLocked(!isLocked)}
              />
            </>
          )}
        </div>

        {/* Right Panel: Inspector */}
        <NodeInspector
          isOpen={showRightPanel}
          onClose={() => setShowRightPanel(false)}
          mode={inspectorMode}
          selectedNode={selectedNode}
          selectedEntity={selectedEntityName}
          selectedHeadline={selectedHeadline}
          selectedReport={selectedReport}
          reports={reports}
          hiddenNodeIds={hiddenNodeIds}
          flaggedNodeIds={flaggedNodeIds}
          onEntitySave={handleEntitySave}
          onReportSave={handleReportSave}
          onToggleFlag={handleToggleFlag}
          onToggleHide={handleToggleHide}
          onDeleteNode={handleDeleteNode}
          onInvestigate={handleLeadInvestigate}
          onOpenReport={onOpenReport}
          onOpenEntityChat={handleOpenEntityChat}
          onOpenReportChat={handleOpenReportChat}
          onOpenHeadlineChat={handleOpenHeadlineChat}
          onPlaceEntityOnBoard={(entityName) => {
            void handlePlaceEntityOnBoard(entityName);
          }}
          onPlaceReportOnBoard={(report) => {
            void handlePlaceReportOnBoard(report);
          }}
          onPlaceHeadlineOnBoard={(headline) => {
            void handlePlaceHeadlineOnBoard(headline);
          }}
        />
      </div>

      <NetworkGraphDialogs
        selectedLeadForAnalysis={selectedLeadForAnalysis}
        activeScopeId={activeScopeId}
        showAddNodeUI={showAddNodeUI}
        newNodeLabel={newNodeLabel}
        newNodeType={newNodeType}
        newNodeSubtype={newNodeSubtype}
        subtypeOptions={subtypeOptions}
        showResolutionModal={showResolutionModal}
        aliases={aliases}
        allEntityNames={dossierData.entities?.map((entity) => entity.name) || []}
        nodePendingDeletion={nodePendingDeletion}
        onInvestigateEntity={onInvestigateEntity}
        onCloseLeadModal={() => setSelectedLeadForAnalysis(null)}
        onCloseAddNode={() => setShowAddNodeUI(false)}
        onCreateNode={handleCreateNode}
        onNodeLabelChange={setNewNodeLabel}
        onNodeTypeChange={setNewNodeType}
        onNodeSubtypeChange={setNewNodeSubtype}
        onCloseResolution={() => setShowResolutionModal(false)}
        onSaveAliases={(newAliases) => {
          void setAliases(newAliases);
        }}
        onCloseNodeDeletion={() => setNodePendingDeletion(null)}
        onConfirmDeleteNode={async () => {
          if (!nodePendingDeletion) {
            return;
          }

          await confirmDeleteNode(nodePendingDeletion);
          setNodePendingDeletion(null);
        }}
      />
    </div>
  );
};
