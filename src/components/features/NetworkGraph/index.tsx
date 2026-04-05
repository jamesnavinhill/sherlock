import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Network } from 'lucide-react';
import type {
  ChatOpenRequest,
  GraphNodeSubtype,
  InvestigationLaunchRequest,
  Artifact,
  ManualConnection,
  ManualNode,
  Entity,
  Headline,
  Source,
} from '../../../types';
import { useWorkspaceStore } from '../../../store/caseStore';
import { TaskSetupModal } from '../../ui/TaskSetupModal';
import type { BreadcrumbItem } from '../../ui/Breadcrumbs';
import { EmptyState } from '../../ui/EmptyState';

// Components
import { ControlBar } from './ControlBar';
import type { GraphNode, GraphCanvasRef } from './GraphCanvas';
import { GraphCanvas } from './GraphCanvas';
import { NodeInspector } from './NodeInspector';
import { EntityResolution } from './EntityResolution';
import { detectEntityClusters } from './entityResolutionUtils';
import { DossierPanel } from '../OperationView/DossierPanel'; // REUSE
import { cleanEntityName } from '../../../utils/text';
import { getLabelProfileById } from '../../../domain';
import { getEntityToneClass } from '../../../utils/entityPalette';

const normalizeGraphId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const getEntityGraphNodeId = (entityName: string) =>
  `entity-${normalizeGraphId(cleanEntityName(entityName))}`;

const getDeletedNodeToken = (nodeId: string) => `deleted:${nodeId}`;

const replaceNodeReference = (values: string[], references: string[], nextValue: string) => {
  const shouldReplace = values.some((value) => references.includes(value));
  if (!shouldReplace) return values;

  const next = new Set(values.filter((value) => !references.includes(value)));
  next.add(nextValue);
  return Array.from(next);
};

const removeNodeReferences = (values: string[], references: string[]) =>
  values.filter((value) => !references.includes(value));

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
  // Refs
  const graphRef = useRef<GraphCanvasRef>(null);

  // Data State
  const {
    artifacts: reports,
    manualLinks,
    manualNodes,
    hiddenNodeIds: hiddenNodeIdsArray,
    workspaces,
    entityAliases: aliases,
    headlines,
    flaggedNodeIds: flaggedNodeIdsArray,
    activeWorkspaceId: filterCaseId,
    activeScope: activeScopeId,
    setManualLinks,
    setManualNodes,
    setEntityAliases: setAliases,
    updateReportTitle,
    renameEntityAcrossReports,
    setActiveWorkspaceId,
    setFlaggedNodeIds,
    setHiddenNodeIds,
    addToast,
  } = useWorkspaceStore();

  const hiddenNodeIds = useMemo(() => new Set(hiddenNodeIdsArray), [hiddenNodeIdsArray]);
  const flaggedNodeIds = useMemo(() => new Set(flaggedNodeIdsArray), [flaggedNodeIdsArray]);
  const dossierLabelProfile = useMemo(() => {
    const activeCase = workspaces.find((entry) => entry.id === filterCaseId);
    const activeReport = reports.find((entry) => entry.caseId === filterCaseId);
    return getLabelProfileById(activeCase?.labelProfileId || activeReport?.labelProfileId);
  }, [workspaces, filterCaseId, reports]);

  // Filter State
  const [showSingletons, setShowSingletons] = useState(true);
  const [showHiddenNodes, setShowHiddenNodes] = useState(false);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // UI/Panel State
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  // Inspector Selection
  const [inspectorMode, setInspectorMode] = useState<'ENTITY' | 'HEADLINE' | 'REPORT' | null>(null);
  const [selectedEntityName, setSelectedEntityName] = useState<string | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<Headline | null>(null);
  const [selectedReport, setSelectedReport] = useState<Artifact | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Linking & Add Node Logic
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [linkSourceNode, setLinkSourceNode] = useState<GraphNode | null>(null);
  const [showAddNodeUI, setShowAddNodeUI] = useState(false); // We need to keep this UI here or move to canvas?
  // Wait, the "Add Node UI" (Lines 824-851) was overlaying the canvas.
  // I should probably pass a prop to GraphCanvas to render it, OR render it here overlaying the GraphCanvas container.
  // For simplicity, I'll render the overlay here in `index.tsx` on top of `GraphCanvas`.

  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState<'ENTITY' | 'CASE'>('ENTITY');
  const [newNodeSubtype, setNewNodeSubtype] = useState<GraphNodeSubtype>('PERSON');

  // Modals
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedLeadForAnalysis, setSelectedLeadForAnalysis] = useState<{
    text: string;
    context?: { topic: string; summary: string };
  } | null>(null);
  const subtypeOptions: Array<{ value: GraphNodeSubtype; label: string; className?: string }> = [
    { value: 'PERSON', label: 'PERSON' },
    { value: 'ORGANIZATION', label: 'ORG' },
    { value: 'CONCEPT', label: 'CONCEPT' },
    { value: 'SOURCE', label: 'SOURCE', className: 'col-start-1 sm:col-start-2' },
    { value: 'UNKNOWN', label: 'UNKNOWN' },
  ];

  // Dossier Panel Accordion State
  const [dossierSections, setDossierSections] = useState<Record<string, boolean>>({
    reports: false,
    entities: false,
    headlines: false,
    leads: false,
    sources: false,
  });
  const toggleDossierSection = (section: string) => {
    setDossierSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Load Data - Migration logic for store initialization
  useEffect(() => {
    // This is only needed for the first time transitioning from localStorage to store
    // but since caseStore.ts already handles persistence, we might not need this anymore
    // if the store is already populated.
  }, []);

  // Active Workspace Persistence
  const handleCaseChange = (id: string) => {
    setActiveWorkspaceId(id);
  };

  // Compute Dossier Data
  const dossierData = useMemo(() => {
    if (!filterCaseId) return { reports: [], headlines: [], leads: [], sources: [], entities: [] };

    const activeReports =
      filterCaseId === 'ALL' ? reports : reports.filter((r) => r.caseId === filterCaseId);
    const activeHeadlines =
      filterCaseId === 'ALL' ? headlines : headlines.filter((h) => h.caseId === filterCaseId);

    const allLeads = Array.from(new Set(activeReports.flatMap((r) => r.leads || [])));

    const sourceMap = new Map<string, Source>();
    activeReports
      .flatMap((r) => r.sources || [])
      .forEach((s) => {
        if (!sourceMap.has(s.url)) sourceMap.set(s.url, s);
      });
    const allSources = Array.from(sourceMap.values());

    const entityMap = new Map<string, Entity>();
    activeReports
      .flatMap((r) => r.entities || [])
      .forEach((e) => {
        const name = typeof e === 'string' ? e : e.name;
        const type = typeof e === 'string' ? 'UNKNOWN' : e.type;
        const _clean = cleanEntityName(name);
        // We use raw name for map key to match dossier behavior, but cleaned for dedupe?
        if (
          !entityMap.has(name) ||
          (entityMap.get(name)?.type === 'UNKNOWN' && type !== 'UNKNOWN')
        ) {
          entityMap.set(name, typeof e === 'string' ? { name, type: 'UNKNOWN' } : e);
        }
      });
    const allEntities = Array.from(entityMap.values());

    return {
      reports: activeReports,
      headlines: activeHeadlines,
      leads: allLeads,
      sources: allSources,
      entities: allEntities,
    };
  }, [reports, headlines, filterCaseId]);

  const isEmpty = reports.length === 0 && manualNodes.length === 0;
  const pendingClusterCount = useMemo(
    () =>
      detectEntityClusters(
        dossierData.entities.map((entity) => entity.name),
        aliases
      ).length,
    [dossierData.entities, aliases]
  );

  const handleCreateManualLink = useCallback(
    (source: GraphNode, target: GraphNode) => {
      const newLink: ManualConnection = {
        source: source.id,
        target: target.id,
        timestamp: Date.now(),
      };
      const updatedLinks = [...manualLinks, newLink];
      setManualLinks(updatedLinks);
      setLinkSourceNode(null);
      setIsLinkingMode(false);
    },
    [manualLinks, setManualLinks]
  );

  const handleGraphStatsUpdate = useCallback(() => {}, []);

  const handleCreateNode = () => {
    if (!newNodeLabel.trim()) return;
    const id = `manual-${Date.now()}`;

    const newNode: ManualNode = {
      id,
      label: newNodeLabel.trim(),
      type: newNodeType,
      timestamp: Date.now(),
      subtype: newNodeType === 'ENTITY' ? newNodeSubtype : 'UNKNOWN',
    };

    const updatedManualNodes = [...manualNodes, newNode];
    setManualNodes(updatedManualNodes);
    setShowAddNodeUI(false);
    setNewNodeLabel('');
  };

  // Inspector Handlers
  function handleOpenHeadlineInspector(headline: Headline) {
    setSelectedHeadline(headline);
    setSelectedNode(null);
    setInspectorMode('HEADLINE');
    setShowRightPanel(true);
  }

  function handleOpenEntityInspector(entityName: string, node: GraphNode | null = null) {
    setSelectedEntityName(entityName);
    setSelectedNode(
      node || {
        id: getEntityGraphNodeId(entityName),
        type: 'ENTITY',
        label: entityName,
        connections: 0,
        subtype: 'UNKNOWN',
      }
    );
    setSelectedHeadline(null);
    setSelectedReport(null);
    setInspectorMode('ENTITY');
    setShowRightPanel(true);
  }

  function handleOpenReportInspector(report: Artifact, node: GraphNode | null = null) {
    setSelectedReport(report);
    setSelectedNode(
      node ||
        (report.id
          ? {
              id: `case-${report.id}`,
              type: 'CASE',
              label: report.topic,
              data: report,
              connections: 0,
            }
          : null)
    );
    setSelectedHeadline(null);
    setSelectedEntityName(null);
    setInspectorMode('REPORT');
    setShowRightPanel(true);
  }

  // Handlers
  const handleNodeClick = useCallback((node: GraphNode | null) => {
    if (!node) {
      // Background click
      setShowRightPanel(false);
      setInspectorMode(null);
      setSelectedEntityName(null);
      setSelectedHeadline(null);
      setSelectedReport(null);
      setSelectedNode(null);
      return;
    }

    if (node.type === 'CASE' && node.data) {
      handleOpenReportInspector(node.data, node);
    } else if (node.type === 'ENTITY') {
      handleOpenEntityInspector(node.label, node);
    }
  }, []);

  const handleLeadInvestigate = (lead: string) => {
    const activeCase = workspaces.find((c) => c.id === filterCaseId);
    const context = activeCase
      ? { topic: activeCase.title, summary: activeCase.description || '' }
      : undefined;
    setSelectedLeadForAnalysis({ text: lead, context });
  };

  // Update Handlers (Persistence)
  const handleEntitySave = async (oldName: string, newName: string) => {
    if (selectedNode?.isManual) {
      await setManualNodes(
        manualNodes.map((node) =>
          node.id === selectedNode.id ? { ...node, label: newName } : node
        )
      );
      setSelectedNode({ ...selectedNode, label: newName });
      setSelectedEntityName(newName);
      addToast(`Renamed manual node to ${newName}.`, 'SUCCESS');
      return;
    }

    if (selectedNode?.subtype === 'SOURCE') {
      addToast('Renaming source nodes from the graph is not supported yet.', 'INFO');
      return;
    }

    await renameEntityAcrossReports(oldName, newName);

    const oldNodeId = selectedNode?.id || getEntityGraphNodeId(oldName);
    const newNodeId = getEntityGraphNodeId(newName);
    const oldDeletedToken = getDeletedNodeToken(oldNodeId);
    const nextDeletedToken = getDeletedNodeToken(newNodeId);

    if (oldNodeId !== newNodeId) {
      const nextManualLinks = manualLinks.map((link) => ({
        ...link,
        source: link.source === oldNodeId ? newNodeId : link.source,
        target: link.target === oldNodeId ? newNodeId : link.target,
      }));
      if (
        nextManualLinks.some(
          (link, index) =>
            link.source !== manualLinks[index]?.source || link.target !== manualLinks[index]?.target
        )
      ) {
        await setManualLinks(nextManualLinks);
      }

      const nextFlaggedNodeIds = replaceNodeReference(
        flaggedNodeIdsArray,
        [oldNodeId, oldName],
        newNodeId
      );
      if (nextFlaggedNodeIds !== flaggedNodeIdsArray) {
        await setFlaggedNodeIds(nextFlaggedNodeIds);
      }

      let nextHiddenNodeIds = replaceNodeReference(
        hiddenNodeIdsArray,
        [oldNodeId, oldName],
        newNodeId
      );
      nextHiddenNodeIds = replaceNodeReference(
        nextHiddenNodeIds,
        [oldDeletedToken],
        nextDeletedToken
      );
      if (nextHiddenNodeIds !== hiddenNodeIdsArray) {
        await setHiddenNodeIds(nextHiddenNodeIds);
      }

      if (linkSourceNode?.id === oldNodeId) {
        setLinkSourceNode({ ...linkSourceNode, id: newNodeId, label: newName });
      }

      if (selectedNode) {
        setSelectedNode({ ...selectedNode, id: newNodeId, label: newName });
      }
    } else if (selectedNode) {
      setSelectedNode({ ...selectedNode, label: newName });
    }

    setSelectedEntityName(newName);
  };

  const handleReportSave = async (report: Artifact, newTitle: string) => {
    if (report.id) {
      await updateReportTitle(report.id, newTitle);
    }
    setSelectedReport({ ...report, topic: newTitle });
  };

  const handleToggleFlag = async () => {
    if (!selectedNode) return;

    const references = [selectedNode.id, selectedNode.label];
    const nextFlaggedNodeIds = flaggedNodeIdsArray.some((value) => references.includes(value))
      ? flaggedNodeIdsArray.filter((value) => !references.includes(value))
      : [...flaggedNodeIdsArray.filter((value) => !references.includes(value)), selectedNode.id];

    await setFlaggedNodeIds(Array.from(new Set(nextFlaggedNodeIds)));
  };

  const handleToggleHide = async () => {
    if (!selectedNode) return;

    const references = [selectedNode.id, selectedNode.label];
    const nextHiddenNodeIds = hiddenNodeIdsArray.some((value) => references.includes(value))
      ? hiddenNodeIdsArray.filter((value) => !references.includes(value))
      : [...hiddenNodeIdsArray.filter((value) => !references.includes(value)), selectedNode.id];

    await setHiddenNodeIds(Array.from(new Set(nextHiddenNodeIds)));
    setShowRightPanel(false);
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;

    const deleteMessage = selectedNode.isManual
      ? `Delete "${selectedNode.label}" and its manual links from the graph?`
      : `Remove "${selectedNode.label}" from the graph?`;
    if (!window.confirm(deleteMessage)) return;

    const nextManualLinks = manualLinks.filter(
      (link) => link.source !== selectedNode.id && link.target !== selectedNode.id
    );
    if (nextManualLinks.length !== manualLinks.length) {
      await setManualLinks(nextManualLinks);
    }

    if (selectedNode.isManual) {
      await setManualNodes(manualNodes.filter((node) => node.id !== selectedNode.id));
      const cleanupReferences = [
        selectedNode.id,
        selectedNode.label,
        getDeletedNodeToken(selectedNode.id),
        getDeletedNodeToken(selectedNode.label),
      ];
      await setFlaggedNodeIds(removeNodeReferences(flaggedNodeIdsArray, cleanupReferences));
      await setHiddenNodeIds(removeNodeReferences(hiddenNodeIdsArray, cleanupReferences));
      addToast(`Deleted ${selectedNode.label} from the graph.`, 'SUCCESS');
    } else {
      const nextHiddenNodeIds = Array.from(
        new Set([
          ...hiddenNodeIdsArray.filter(
            (value) =>
              value !== selectedNode.id &&
              value !== selectedNode.label &&
              value !== getDeletedNodeToken(selectedNode.label)
          ),
          getDeletedNodeToken(selectedNode.id),
        ])
      );
      await setHiddenNodeIds(nextHiddenNodeIds);
      addToast(`Removed ${selectedNode.label} from the graph.`, 'SUCCESS');
    }

    if (linkSourceNode?.id === selectedNode.id) {
      setLinkSourceNode(null);
    }

    setShowRightPanel(false);
    setInspectorMode(null);
    setSelectedNode(null);
    setSelectedEntityName(null);
    setSelectedHeadline(null);
    setSelectedReport(null);
  };

  const handleOpenEntityChat = (entityName: string) => {
    if (!filterCaseId || filterCaseId === 'ALL') return;
    onOpenChat({
      workspaceId: filterCaseId,
      launchContext: {
        entityName,
      },
    });
  };

  const handleOpenReportChat = (report: Artifact) => {
    if (!report.caseId || !report.id) return;
    onOpenChat({
      workspaceId: report.caseId,
      launchContext: {
        sourceReportId: report.id,
      },
    });
  };

  const handleOpenHeadlineChat = (headline: Headline) => {
    if (!headline.caseId) return;
    onOpenChat({
      workspaceId: headline.caseId,
      launchContext: {
        headlineId: headline.id,
      },
    });
  };

  return (
    <div className="w-full h-screen bg-osint-dark relative flex flex-col overflow-hidden">
      <ControlBar
        workspaces={workspaces}
        labelProfile={dossierLabelProfile}
        filterCaseId={filterCaseId || ''}
        onCaseChange={handleCaseChange}
        showLeftPanel={showLeftPanel}
        onToggleLeftPanel={() => setShowLeftPanel(!showLeftPanel)}
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
                className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs p-2 mb-2"
              />
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setNewNodeType('ENTITY')}
                  className={`flex-1 py-1 text-[10px] border ${newNodeType === 'ENTITY' ? 'bg-zinc-800 border-white text-white' : 'border-zinc-700 text-zinc-500'}`}
                >
                  ENTITY
                </button>
                <button
                  onClick={() => setNewNodeType('CASE')}
                  className={`flex-1 py-1 text-[10px] border ${newNodeType === 'CASE' ? 'bg-zinc-800 border-white text-white' : 'border-zinc-700 text-zinc-500'}`}
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
    </div>
  );
};
