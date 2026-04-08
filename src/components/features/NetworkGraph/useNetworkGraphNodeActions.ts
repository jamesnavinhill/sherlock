import { useCallback } from 'react';

import type { Artifact, GraphNodeSubtype, ManualConnection, ManualNode, Workspace } from '@/types';
import type { GraphNode } from './GraphCanvas';
import {
  getDeletedNodeToken,
  getEntityGraphNodeId,
  removeNodeReferences,
  replaceNodeReference,
} from './networkGraphNodeIds';

interface UseNetworkGraphNodeActionsInput {
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  clearInspectorSelection: () => void;
  flaggedNodeIds: string[];
  hiddenNodeIds: string[];
  linkSourceNode: GraphNode | null;
  manualLinks: ManualConnection[];
  manualNodes: ManualNode[];
  newNodeLabel: string;
  newNodeSubtype: GraphNodeSubtype;
  newNodeType: 'ENTITY' | 'REPORT';
  selectedNode: GraphNode | null;
  setFlaggedNodeIds: (nodeIds: string[]) => Promise<void> | void;
  setHiddenNodeIds: (nodeIds: string[]) => Promise<void> | void;
  setIsLinkingMode: (value: boolean) => void;
  setLinkSourceNode: (node: GraphNode | null) => void;
  setManualLinks: (links: ManualConnection[]) => Promise<void> | void;
  setManualNodes: (nodes: ManualNode[]) => Promise<void> | void;
  setNewNodeLabel: (value: string) => void;
  setNodePendingDeletion: (node: GraphNode | null) => void;
  setSelectedEntityName: (value: string | null) => void;
  setSelectedLeadForAnalysis: (value: { text: string; context?: { topic: string; summary: string } } | null) => void;
  setSelectedNode: (node: GraphNode | null) => void;
  setSelectedReport: (report: Artifact | null) => void;
  setShowAddNodeUI: (value: boolean) => void;
  setShowRightPanel: (value: boolean) => void;
  updateArtifactTitle: (artifactId: string, title: string) => Promise<void> | void;
  renameEntityAcrossArtifacts: (oldName: string, newName: string) => Promise<void> | void;
  workspaces: Workspace[];
  workspaceFilterId: string | null;
}

export const useNetworkGraphNodeActions = ({
  addToast,
  clearInspectorSelection,
  flaggedNodeIds,
  hiddenNodeIds,
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
  workspaceFilterId,
}: UseNetworkGraphNodeActionsInput) => {
  const handleCreateManualLink = useCallback(
    (source: GraphNode, target: GraphNode) => {
      const newLink: ManualConnection = {
        source: source.id,
        target: target.id,
        timestamp: Date.now(),
      };
      void setManualLinks([...manualLinks, newLink]);
      setLinkSourceNode(null);
      setIsLinkingMode(false);
    },
    [manualLinks, setIsLinkingMode, setLinkSourceNode, setManualLinks]
  );

  const handleCreateNode = useCallback(() => {
    if (!newNodeLabel.trim()) return;
    const id = `manual-${Date.now()}`;

    const newNode: ManualNode = {
      id,
      label: newNodeLabel.trim(),
      type: newNodeType === 'REPORT' ? 'CASE' : 'ENTITY',
      timestamp: Date.now(),
      subtype: newNodeType === 'ENTITY' ? newNodeSubtype : 'UNKNOWN',
    };

    void setManualNodes([...manualNodes, newNode]);
    setShowAddNodeUI(false);
    setNewNodeLabel('');
  }, [
    manualNodes,
    newNodeLabel,
    newNodeSubtype,
    newNodeType,
    setManualNodes,
    setNewNodeLabel,
    setShowAddNodeUI,
  ]);

  const handleLeadInvestigate = useCallback(
    (lead: string) => {
      const activeWorkspace = workspaces.find((workspace) => workspace.id === workspaceFilterId);
      const context = activeWorkspace
        ? { topic: activeWorkspace.title, summary: activeWorkspace.description || '' }
        : undefined;
      setSelectedLeadForAnalysis({ text: lead, context });
    },
    [setSelectedLeadForAnalysis, workspaceFilterId, workspaces]
  );

  const handleEntitySave = useCallback(
    async (oldName: string, newName: string) => {
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

      await renameEntityAcrossArtifacts(oldName, newName);

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
          flaggedNodeIds,
          [oldNodeId, oldName],
          newNodeId
        );
        if (nextFlaggedNodeIds !== flaggedNodeIds) {
          await setFlaggedNodeIds(nextFlaggedNodeIds);
        }

        let nextHiddenNodeIds = replaceNodeReference(hiddenNodeIds, [oldNodeId, oldName], newNodeId);
        nextHiddenNodeIds = replaceNodeReference(
          nextHiddenNodeIds,
          [oldDeletedToken],
          nextDeletedToken
        );
        if (nextHiddenNodeIds !== hiddenNodeIds) {
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
    },
    [
      addToast,
      flaggedNodeIds,
      hiddenNodeIds,
      linkSourceNode,
      manualLinks,
      manualNodes,
      renameEntityAcrossArtifacts,
      selectedNode,
      setFlaggedNodeIds,
      setHiddenNodeIds,
      setLinkSourceNode,
      setManualLinks,
      setManualNodes,
      setSelectedEntityName,
      setSelectedNode,
    ]
  );

  const handleReportSave = useCallback(
    async (report: Artifact, newTitle: string) => {
      if (report.id) {
        await updateArtifactTitle(report.id, newTitle);
      }
      setSelectedReport({ ...report, topic: newTitle });
    },
    [setSelectedReport, updateArtifactTitle]
  );

  const handleToggleFlag = useCallback(async () => {
    if (!selectedNode) return;

    const references = [selectedNode.id, selectedNode.label];
    const nextFlaggedNodeIds = flaggedNodeIds.some((value) => references.includes(value))
      ? flaggedNodeIds.filter((value) => !references.includes(value))
      : [...flaggedNodeIds.filter((value) => !references.includes(value)), selectedNode.id];

    await setFlaggedNodeIds(Array.from(new Set(nextFlaggedNodeIds)));
  }, [flaggedNodeIds, selectedNode, setFlaggedNodeIds]);

  const handleToggleHide = useCallback(async () => {
    if (!selectedNode) return;

    const references = [selectedNode.id, selectedNode.label];
    const nextHiddenNodeIds = hiddenNodeIds.some((value) => references.includes(value))
      ? hiddenNodeIds.filter((value) => !references.includes(value))
      : [...hiddenNodeIds.filter((value) => !references.includes(value)), selectedNode.id];

    await setHiddenNodeIds(Array.from(new Set(nextHiddenNodeIds)));
    setShowRightPanel(false);
  }, [hiddenNodeIds, selectedNode, setHiddenNodeIds, setShowRightPanel]);

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
        await setFlaggedNodeIds(removeNodeReferences(flaggedNodeIds, cleanupReferences));
        await setHiddenNodeIds(removeNodeReferences(hiddenNodeIds, cleanupReferences));
        addToast(`Deleted ${node.label} from the graph.`, 'SUCCESS');
      } else {
        const nextHiddenNodeIds = Array.from(
          new Set([
            ...hiddenNodeIds.filter(
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
      flaggedNodeIds,
      hiddenNodeIds,
      linkSourceNode?.id,
      manualLinks,
      manualNodes,
      setFlaggedNodeIds,
      setHiddenNodeIds,
      setLinkSourceNode,
      setManualLinks,
      setManualNodes,
    ]
  );

  const handleDeleteNode = useCallback(() => {
    if (!selectedNode) return;
    setNodePendingDeletion(selectedNode);
  }, [selectedNode, setNodePendingDeletion]);

  return {
    confirmDeleteNode,
    handleCreateManualLink,
    handleCreateNode,
    handleDeleteNode,
    handleEntitySave,
    handleLeadInvestigate,
    handleReportSave,
    handleToggleFlag,
    handleToggleHide,
  };
};
