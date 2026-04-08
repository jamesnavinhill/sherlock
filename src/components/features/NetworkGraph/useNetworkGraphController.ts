import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type {
  Artifact,
  ChatOpenRequest,
  InvestigationLaunchRequest,
  Headline,
} from '@/types';
import { useNetworkGraphFeatureState } from '@/store/selectors/networkGraphSelectors';
import { getLabelProfileById } from '@/domain';

import { detectEntityClusters } from './entityResolutionUtils';
import { buildNetworkGraphDossierData } from './networkGraphDossierData';
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
import { useNetworkGraphNodeActions } from './useNetworkGraphNodeActions';

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
    activeWorkspaceId: filterWorkspaceId,
    activeScope: activeScopeId,
    setManualLinks,
    setManualNodes,
    setEntityAliases: setAliases,
    updateArtifactTitle,
    renameEntityAcrossArtifacts,
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
    const activeWorkspace = workspaces.find((entry) => entry.id === filterWorkspaceId);
    const activeReport = reports.find((entry) => entry.workspaceId === filterWorkspaceId);
    return getLabelProfileById(activeWorkspace?.labelProfileId || activeReport?.labelProfileId);
  }, [workspaces, filterWorkspaceId, reports]);

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

  const handleWorkspaceChange = (id: string) => {
    setActiveWorkspaceId(id);
  };

  const dossierData = useMemo(
    () =>
      buildNetworkGraphDossierData({
        filterWorkspaceId,
        headlines,
        reports,
      }),
    [filterWorkspaceId, headlines, reports]
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

  const handleGraphStatsUpdate = useCallback(() => {}, []);
  const {
    confirmDeleteNode,
    handleCreateManualLink,
    handleCreateNode,
    handleDeleteNode,
    handleEntitySave,
    handleLeadInvestigate,
    handleReportSave,
    handleToggleFlag,
    handleToggleHide,
  } = useNetworkGraphNodeActions({
    addToast,
    clearInspectorSelection,
    flaggedNodeIds: flaggedNodeIdsArray,
    hiddenNodeIds: hiddenNodeIdsArray,
    linkSourceNode,
    manualLinks,
    manualNodes,
    newNodeLabel,
    newNodeSubtype,
    newNodeType,
    selectedNode,
    setFlaggedNodeIds,
    setHiddenNodeIds,
    setIsLinkingMode,
    setLinkSourceNode,
    setManualLinks,
    setManualNodes,
    setNewNodeLabel,
    setNodePendingDeletion,
    setSelectedEntityName,
    setSelectedLeadForAnalysis,
    setSelectedNode,
    setSelectedReport,
    setShowAddNodeUI,
    setShowRightPanel,
    updateArtifactTitle,
    renameEntityAcrossArtifacts,
    workspaces,
    workspaceFilterId: filterWorkspaceId,
  });

  const handleOpenEntityChat = (entityName: string) =>
    openEntityGraphChat({
      entityName,
      onOpenChat,
      workspaceId: filterWorkspaceId,
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
      workspaceId: filterWorkspaceId,
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
