import { useCallback, useState } from 'react';

import type { Artifact, Headline } from '@/types';
import type { GraphNode } from './GraphCanvas';
import { getEntityGraphNodeId, getReportGraphNodeId } from './networkGraphNodeIds';

export const useNetworkGraphInspectorState = () => {
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [inspectorMode, setInspectorMode] = useState<'ENTITY' | 'HEADLINE' | 'REPORT' | null>(null);
  const [selectedEntityName, setSelectedEntityName] = useState<string | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<Headline | null>(null);
  const [selectedReport, setSelectedReport] = useState<Artifact | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const clearInspectorSelection = useCallback(() => {
    setShowRightPanel(false);
    setInspectorMode(null);
    setSelectedEntityName(null);
    setSelectedHeadline(null);
    setSelectedReport(null);
    setSelectedNode(null);
  }, []);

  const handleOpenHeadlineInspector = useCallback((headline: Headline) => {
    setSelectedHeadline(headline);
    setSelectedNode(null);
    setInspectorMode('HEADLINE');
    setSelectedEntityName(null);
    setSelectedReport(null);
    setShowRightPanel(true);
  }, []);

  const handleOpenEntityInspector = useCallback((entityName: string, node: GraphNode | null = null) => {
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
  }, []);

  const handleOpenReportInspector = useCallback((report: Artifact, node: GraphNode | null = null) => {
    setSelectedReport(report);
    setSelectedNode(
      node ||
        (report.id
          ? {
              id: getReportGraphNodeId(report.id),
              type: 'REPORT',
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
  }, []);

  const handleNodeClick = useCallback(
    (node: GraphNode | null) => {
      if (!node) {
        clearInspectorSelection();
        return;
      }

      if (node.type === 'REPORT' && node.data) {
        handleOpenReportInspector(node.data, node);
      } else if (node.type === 'ENTITY') {
        handleOpenEntityInspector(node.label, node);
      }
    },
    [clearInspectorSelection, handleOpenEntityInspector, handleOpenReportInspector]
  );

  return {
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
    setInspectorMode,
    setSelectedEntityName,
    setSelectedHeadline,
    setSelectedNode,
    setSelectedReport,
    setShowRightPanel,
    showRightPanel,
  };
};
