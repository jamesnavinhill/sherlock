import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type {
  Artifact,
  ChatOpenRequest,
  InvestigationLaunchRequest,
  ManualConnection,
  ManualNode,
  Headline,
} from '@/types';
import { useNetworkGraphFeatureState } from '@/store/selectors/featureSelectors';
import { getLabelProfileById } from '@/domain';

import { detectEntityClusters } from './entityResolutionUtils';
import type { GraphNode } from './GraphCanvas';
import { buildNetworkGraphDossierData } from './networkGraphDossierData';
import {
  getDeletedNodeToken,
  getEntityGraphNodeId,
  removeNodeReferences,
  replaceNodeReference,
} from './networkGraphNodeIds';
import {
  openEntityGraphChat,
  openHeadlineGraphChat,
  openReportGraphChat,
  placeEntityOnWorkspaceBoard,
  placeHeadlineOnWorkspaceBoard,
  placeReportOnWorkspaceBoard,
} from './networkGraphWorkspaceHandoffs';
import { useNetworkGraphUiState } from './useNetworkGraphUiState';
import { useNetworkGraphInspectorState } from './useNetworkGraphInspectorState';

interface NetworkGraphControllerOptions {
  onInvestigateEntity?: (request: InvestigationLaunchRequest) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
}

export function useNetworkGraphController({
  onOpenChat,
}: NetworkGraphControllerOptions) {
  const navigate = useNavigate();
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
    ensureWorkspaceBoard,
    queueBoardPlacement,
    addToast,
  } = useNetworkGraphFeatureState();

  const hiddenNodeIds = useMemo(() => new Set(hiddenNodeIdsArray), [hiddenNodeIdsArray]);
  const flaggedNodeIds = useMemo(() => new Set(flaggedNodeIdsArray), [flaggedNodeIdsArray]);
  const dossierLabelProfile = useMemo(() => {
    const activeCase = workspaces.find((entry) => entry.id === filterCaseId);
    const activeReport = reports.find((entry) => entry.caseId === filterCaseId);
    return getLabelProfileById(activeCase?.labelProfileId || activeReport?.labelProfileId);
  }, [workspaces, filterCaseId, reports]);

  const {
    dossierSections,
    isLinkingMode,
    isLocked,
    linkSourceNode,
    newNodeLabel,
    newNodeSubtype,
    newNodeType,
    nodePendingDeletion,
    selectedLeadForAnalysis,
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
    setShowSingletons,
    showAddNodeUI,
    showFlaggedOnly,
    showHiddenNodes,
    showLeftPanel,
    showResolutionModal,
    showSingletons,
    subtypeOptions,
    toggleDossierSection,
  } = useNetworkGraphUiState();
  const {
    clearInspectorSelection,
    handleNodeClick,
    handleOpenEntityInspector,
    handleOpenHeadlineInspector,
    handleOpenReportInspector,
    inspectorMode,
    selectedEntityName,
    selectedHeadline,
    selectedNode,
    selectedReport,
    setSelectedEntityName,
    setSelectedNode,
    setSelectedReport,
    setShowRightPanel,
    showRightPanel,
  } = useNetworkGraphInspectorState();

  const handleCaseChange = (id: string) => {
    setActiveWorkspaceId(id);
  };

  const dossierData = useMemo(
    () =>
      buildNetworkGraphDossierData({
        filterCaseId,
        headlines,
        reports,
      }),
    [filterCaseId, headlines, reports]
  );

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
    [manualLinks, setIsLinkingMode, setLinkSourceNode, setManualLinks]
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

  const handleLeadInvestigate = (lead: string) => {
    const activeCase = workspaces.find((c) => c.id === filterCaseId);
    const context = activeCase
      ? { topic: activeCase.title, summary: activeCase.description || '' }
      : undefined;
    setSelectedLeadForAnalysis({ text: lead, context });
  };

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

  const confirmDeleteNode = useCallback(
    async (node: GraphNode) => {
      const nextManualLinks = manualLinks.filter(
        (link) => link.source !== node.id && link.target !== node.id
      );
      if (nextManualLinks.length !== manualLinks.length) {
        await setManualLinks(nextManualLinks);
      }

      if (node.isManual) {
        await setManualNodes(manualNodes.filter((manualNode) => manualNode.id !== node.id));
        const cleanupReferences = [
          node.id,
          node.label,
          getDeletedNodeToken(node.id),
          getDeletedNodeToken(node.label),
        ];
        await setFlaggedNodeIds(removeNodeReferences(flaggedNodeIdsArray, cleanupReferences));
        await setHiddenNodeIds(removeNodeReferences(hiddenNodeIdsArray, cleanupReferences));
        addToast(`Deleted ${node.label} from the graph.`, 'SUCCESS');
      } else {
        const nextHiddenNodeIds = Array.from(
          new Set([
            ...hiddenNodeIdsArray.filter(
              (value) =>
                value !== node.id &&
                value !== node.label &&
                value !== getDeletedNodeToken(node.label)
            ),
            getDeletedNodeToken(node.id),
          ])
        );
        await setHiddenNodeIds(nextHiddenNodeIds);
        addToast(`Removed ${node.label} from the graph.`, 'SUCCESS');
      }

      if (linkSourceNode?.id === node.id) {
        setLinkSourceNode(null);
      }

      clearInspectorSelection();
    },
    [
      addToast,
      clearInspectorSelection,
      flaggedNodeIdsArray,
      hiddenNodeIdsArray,
      linkSourceNode?.id,
      manualLinks,
      manualNodes,
      setFlaggedNodeIds,
      setHiddenNodeIds,
      setManualLinks,
      setManualNodes,
      setLinkSourceNode,
    ]
  );

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    setNodePendingDeletion(selectedNode);
  };

  const handleOpenEntityChat = (entityName: string) =>
    openEntityGraphChat({
      entityName,
      onOpenChat,
      workspaceId: filterCaseId,
    });

  const handleOpenReportChat = (report: Artifact) =>
    openReportGraphChat({
      onOpenChat,
      report,
    });

  const handleOpenHeadlineChat = (headline: Headline) =>
    openHeadlineGraphChat({
      headline,
      onOpenChat,
    });

  const handlePlaceEntityOnBoard = async (entityName: string) =>
    placeEntityOnWorkspaceBoard({
      ensureWorkspaceBoard,
      entityName,
      navigate,
      queueBoardPlacement,
      workspaceId: filterCaseId,
    });

  const handlePlaceReportOnBoard = async (report: Artifact) =>
    placeReportOnWorkspaceBoard({
      ensureWorkspaceBoard,
      navigate,
      queueBoardPlacement,
      report,
    });

  const handlePlaceHeadlineOnBoard = async (headline: Headline) =>
    placeHeadlineOnWorkspaceBoard({
      ensureWorkspaceBoard,
      headline,
      navigate,
      queueBoardPlacement,
    });

  return {
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
    headlines,
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
  };
}
