import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type {
  Artifact,
  ChatOpenRequest,
  Entity,
  GraphNodeSubtype,
  Headline,
  InvestigationLaunchRequest,
  ManualConnection,
  ManualNode,
  Source,
} from '@/types';
import { useNetworkGraphFeatureState } from '@/store/selectors/featureSelectors';
import { buildWorkspaceBoardDocumentPath } from '@/app/routes';
import { getLabelProfileById } from '@/domain';
import { cleanEntityName } from '@/utils/text';
import {
  buildWorkspaceArtifactReference,
  buildWorkspaceEntityReference,
  buildWorkspaceHeadlineReference,
} from '@/services/workspace/library';

import { detectEntityClusters } from './entityResolutionUtils';
import type { GraphNode } from './GraphCanvas';

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

  const [showSingletons, setShowSingletons] = useState(true);
  const [showHiddenNodes, setShowHiddenNodes] = useState(false);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [inspectorMode, setInspectorMode] = useState<'ENTITY' | 'HEADLINE' | 'REPORT' | null>(null);
  const [selectedEntityName, setSelectedEntityName] = useState<string | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<Headline | null>(null);
  const [selectedReport, setSelectedReport] = useState<Artifact | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [linkSourceNode, setLinkSourceNode] = useState<GraphNode | null>(null);
  const [showAddNodeUI, setShowAddNodeUI] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState<'ENTITY' | 'CASE'>('ENTITY');
  const [newNodeSubtype, setNewNodeSubtype] = useState<GraphNodeSubtype>('PERSON');
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [nodePendingDeletion, setNodePendingDeletion] = useState<GraphNode | null>(null);
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
  const [dossierSections, setDossierSections] = useState<Record<string, boolean>>({
    reports: false,
    entities: false,
    headlines: false,
    leads: false,
    sources: false,
  });

  const toggleDossierSection = (section: string) => {
    setDossierSections((prev) =>
      Object.fromEntries(
        Object.keys(prev).map((key) => [key, key === section ? !prev[section] : false])
      )
    );
  };

  const handleCaseChange = (id: string) => {
    setActiveWorkspaceId(id);
  };

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

  const handleNodeClick = useCallback((node: GraphNode | null) => {
    if (!node) {
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

      setShowRightPanel(false);
      setInspectorMode(null);
      setSelectedNode(null);
      setSelectedEntityName(null);
      setSelectedHeadline(null);
      setSelectedReport(null);
    },
    [
      addToast,
      flaggedNodeIdsArray,
      hiddenNodeIdsArray,
      linkSourceNode?.id,
      manualLinks,
      manualNodes,
      setFlaggedNodeIds,
      setHiddenNodeIds,
      setManualLinks,
      setManualNodes,
    ]
  );

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    setNodePendingDeletion(selectedNode);
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
        signalId: headline.id,
        headlineId: headline.id,
      },
    });
  };

  const handlePlaceEntityOnBoard = async (entityName: string) => {
    if (!filterCaseId || filterCaseId === 'ALL') return;

    const board = await ensureWorkspaceBoard(filterCaseId);
    queueBoardPlacement({
      workspaceId: filterCaseId,
      boardId: board.id,
      item: buildWorkspaceEntityReference(filterCaseId, {
        name: entityName,
        type: 'UNKNOWN',
      }),
      openInBoard: true,
    });
    navigate(buildWorkspaceBoardDocumentPath(filterCaseId, board.id));
  };

  const handlePlaceReportOnBoard = async (report: Artifact) => {
    if (!report.caseId || !report.id) return;

    const board = await ensureWorkspaceBoard(report.caseId);
    queueBoardPlacement({
      workspaceId: report.caseId,
      boardId: board.id,
      item: buildWorkspaceArtifactReference(report.caseId, { ...report, id: report.id }),
      openInBoard: true,
    });
    navigate(buildWorkspaceBoardDocumentPath(report.caseId, board.id));
  };

  const handlePlaceHeadlineOnBoard = async (headline: Headline) => {
    if (!headline.caseId) return;

    const board = await ensureWorkspaceBoard(headline.caseId);
    queueBoardPlacement({
      workspaceId: headline.caseId,
      boardId: board.id,
      item: buildWorkspaceHeadlineReference(headline.caseId, headline),
      openInBoard: true,
    });
    navigate(buildWorkspaceBoardDocumentPath(headline.caseId, board.id));
  };

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
