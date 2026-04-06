import React, { useRef } from 'react';
import { Network } from 'lucide-react';
import type {
  ChatOpenRequest,
  InvestigationLaunchRequest,
  Artifact,
} from '../../../types';
import { TaskSetupModal } from '../Runs/TaskSetupModal';
import type { BreadcrumbItem } from '../../ui/Breadcrumbs';
import { EmptyState } from '../../ui/EmptyState';
import { ConfirmDialog } from '../../ui/ConfirmDialog';

// Components
import { ControlBar } from './ControlBar';
import type { GraphCanvasRef } from './GraphCanvas';
import { GraphCanvas } from './GraphCanvas';
import { NodeInspector } from './NodeInspector';
import { EntityResolution } from './EntityResolution';
import { DossierPanel } from '../OperationView/DossierPanel'; // REUSE
import { getEntityToneClass } from '../../../utils/entityPalette';
import { useNetworkGraphController } from './useNetworkGraphController';

interface NetworkGraphProps {
  onOpenReport: (report: Artifact) => void;
  onInvestigateEntity: (request: InvestigationLaunchRequest) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
  onBack?: () => void;
  navStack?: BreadcrumbItem[];
  onNavigate?: (id: string) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  onOpenReport,
  onInvestigateEntity,
  onOpenChat,
  onBack: _onBack,
  navStack: _navStack,
  onNavigate: _onNavigate,
}) => {
  const graphRef = useRef<GraphCanvasRef>(null);
  const {
    activeScopeId,
    aliases,
    confirmDeleteNode,
    dossierData,
    dossierLabelProfile,
    dossierSections,
    filterCaseId,
    flaggedNodeIds,
    handleCaseChange,
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

  return (
    <div className="w-full h-screen bg-osint-dark relative flex flex-col overflow-hidden">
      <ControlBar
        workspaces={workspaces}
        labelProfile={dossierLabelProfile}
        filterCaseId={filterCaseId || ''}
        onCaseChange={handleCaseChange}
        showLeftPanel={showLeftPanel}
        onToggleLeftPanel={() => setShowLeftPanel(!showLeftPanel)}
        showRightPanel={showRightPanel}
        onToggleRightPanel={() => setShowRightPanel(!showRightPanel)}
        showSingletons={showSingletons}
        onToggleSingletons={() => setShowSingletons(!showSingletons)}
        showHiddenNodes={showHiddenNodes}
        onToggleHiddenNodes={() => setShowHiddenNodes(!showHiddenNodes)}
        showFlaggedOnly={showFlaggedOnly}
        onToggleFlaggedOnly={() => setShowFlaggedOnly(!showFlaggedOnly)}
        isLinkingMode={isLinkingMode}
        onToggleLinkingMode={() => setIsLinkingMode(!isLinkingMode)}
        onZoom={(dir) => (dir === 'IN' ? graphRef.current?.zoomIn() : graphRef.current?.zoomOut())}
        onShowAddNode={() => setShowAddNodeUI(true)}
        onShowResolution={() => setShowResolutionModal(true)}
        pendingClusterCount={pendingClusterCount}
        isLocked={isLocked}
        onToggleLock={() => setIsLocked(!isLocked)}
      />

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Dossier Panel (Reused) */}
        <DossierPanel
          isOpen={showLeftPanel}
          activeCase={workspaces.find((c) => c.id === filterCaseId) || null}
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
            <GraphCanvas
              ref={graphRef}
              reports={reports}
              manualLinks={manualLinks}
              manualNodes={manualNodes}
              workspaces={workspaces}
              aliases={aliases}
              hiddenNodeIds={hiddenNodeIds}
              flaggedNodeIds={flaggedNodeIds}
              filterCaseId={filterCaseId || ''}
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
          )}

          {/* Add Node Overlay */}
          {showAddNodeUI && (
            <div className="absolute top-4 right-4 bg-black/90 border border-zinc-700 p-4 shadow-xl z-50 w-64">
              <h3 className="text-xs font-bold text-white mb-3">ADD MANUAL NODE</h3>
              <input
                autoFocus
                value={newNodeLabel}
                onChange={(e) => setNewNodeLabel(e.target.value)}
                placeholder="Node Label..."
                className="mb-2 w-full border border-zinc-700 bg-black px-3 py-2 text-xs font-mono text-zinc-300 outline-none transition hover:border-osint-primary focus:border-osint-primary placeholder:text-zinc-600"
              />
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setNewNodeType('ENTITY')}
                  className={`flex-1 px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-colors ${
                    newNodeType === 'ENTITY' ? 'osint-button-chrome-active' : 'osint-button-chrome'
                  }`}
                >
                  ENTITY
                </button>
                <button
                  onClick={() => setNewNodeType('CASE')}
                  className={`flex-1 px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-colors ${
                    newNodeType === 'CASE' ? 'osint-button-chrome-active' : 'osint-button-chrome'
                  }`}
                >
                  REPORT
                </button>
              </div>

              {/* Subtype Selection */}
              {newNodeType === 'ENTITY' && (
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {subtypeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setNewNodeSubtype(option.value)}
                      className={`min-w-0 px-1.5 py-1.5 text-[9px] leading-none border text-center whitespace-nowrap ${
                        newNodeSubtype === option.value
                          ? `${getEntityToneClass(option.value)} entity-tone-toggle-active`
                          : 'border-zinc-800 text-zinc-600 hover:border-zinc-600'
                      } ${option.className || ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex justify-between">
                <button
                  onClick={() => setShowAddNodeUI(false)}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNode}
                  className="osint-button-primary px-3 py-1 text-xs font-bold"
                >
                  ADD
                </button>
              </div>
            </div>
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

      {/* Modal */}
      {selectedLeadForAnalysis && (
        <TaskSetupModal
          initialTopic={selectedLeadForAnalysis.text}
          initialContext={selectedLeadForAnalysis.context}
          initialScopeId={activeScopeId || undefined}
          onCancel={() => setSelectedLeadForAnalysis(null)}
          onStart={(topic, configOverride, preseededEntities, scope, dateRange) => {
            onInvestigateEntity({
              topic,
              parentContext: selectedLeadForAnalysis.context,
              configOverride,
              preseededEntities,
              scope,
              dateRangeOverride: dateRange,
              launchSource: 'NETWORK_GRAPH',
            });
            setSelectedLeadForAnalysis(null);
          }}
        />
      )}
      {showResolutionModal && (
        <EntityResolution
          allEntities={dossierData.entities?.map((e) => e.name) || []}
          currentAliases={aliases}
          onSaveAliases={(newAliases) => {
            void setAliases(newAliases);
          }}
          onClose={() => setShowResolutionModal(false)}
        />
      )}

      {nodePendingDeletion && (
        <ConfirmDialog
          title={nodePendingDeletion.isManual ? 'Delete Manual Node' : 'Remove Graph Node'}
          description={
            nodePendingDeletion.isManual
              ? `Delete "${nodePendingDeletion.label}" and its manual links from the graph?`
              : `Remove "${nodePendingDeletion.label}" from the graph and hide it from this workspace view?`
          }
          confirmLabel={nodePendingDeletion.isManual ? 'Delete Node' : 'Remove Node'}
          tone="danger"
          onClose={() => setNodePendingDeletion(null)}
          onConfirm={() => {
            void (async () => {
              await confirmDeleteNode(nodePendingDeletion);
              setNodePendingDeletion(null);
            })();
          }}
        />
      )}
    </div>
  );
};
