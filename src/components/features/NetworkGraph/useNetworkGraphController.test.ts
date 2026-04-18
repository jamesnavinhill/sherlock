import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.fn();
const { useNetworkGraphFeatureState } = vi.hoisted(() => ({
  useNetworkGraphFeatureState: vi.fn(),
}));
const { useNetworkGraphUiState } = vi.hoisted(() => ({
  useNetworkGraphUiState: vi.fn(),
}));
const { useNetworkGraphInspectorState } = vi.hoisted(() => ({
  useNetworkGraphInspectorState: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/store/selectors/networkGraphSelectors', () => ({
  useNetworkGraphFeatureState,
}));

vi.mock('./useNetworkGraphUiState', () => ({
  useNetworkGraphUiState,
}));

vi.mock('./useNetworkGraphInspectorState', () => ({
  useNetworkGraphInspectorState,
}));

vi.mock('./networkGraphDossierData', () => ({
  buildNetworkGraphDossierData: () => ({
    entities: [],
    artifacts: [],
    followUps: [],
    headlines: [],
    findings: [],
    sources: [],
  }),
}));

vi.mock('./entityResolutionUtils', () => ({
  detectEntityClusters: () => [],
}));

import { useNetworkGraphController } from './useNetworkGraphController';

describe('useNetworkGraphController', () => {
  let baseState: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    baseState = {
      artifacts: [],
      manualLinks: [],
      manualNodes: [],
      hiddenNodeIds: [],
      workspaces: [],
      entityAliases: {},
      headlines: [],
      flaggedNodeIds: ['entity:atlas'],
      activeWorkspaceId: 'ws-1',
      activeScope: null,
      setManualLinks: vi.fn(),
      setManualNodes: vi.fn(),
      setEntityAliases: vi.fn(),
      updateArtifactTitle: vi.fn(),
      renameEntityAcrossArtifacts: vi.fn(async () => undefined),
      setActiveWorkspaceId: vi.fn(),
      setFlaggedNodeIds: vi.fn(async () => undefined),
      setHiddenNodeIds: vi.fn(async () => undefined),
      ensureWorkspaceBoard: vi.fn(async () => ({ id: 'board-1' })),
      queueBoardPlacement: vi.fn(),
      addToast: vi.fn(),
    };
    useNetworkGraphFeatureState.mockReturnValue(baseState);
    useNetworkGraphUiState.mockReturnValue({
      dossierSections: {},
      isLinkingMode: false,
      isLocked: false,
      linkSourceNode: null,
      newNodeLabel: '',
      newNodeSubtype: 'UNKNOWN',
      newNodeType: 'ENTITY',
      nodePendingDeletion: null,
      selectedLeadForAnalysis: null,
      setIsLinkingMode: vi.fn(),
      setIsLocked: vi.fn(),
      setLinkSourceNode: vi.fn(),
      setNewNodeLabel: vi.fn(),
      setNewNodeSubtype: vi.fn(),
      setNewNodeType: vi.fn(),
      setNodePendingDeletion: vi.fn(),
      setSelectedLeadForAnalysis: vi.fn(),
      setShowAddNodeUI: vi.fn(),
      setShowFlaggedOnly: vi.fn(),
      setShowHiddenNodes: vi.fn(),
      setShowLeftPanel: vi.fn(),
      setShowResolutionModal: vi.fn(),
      setShowSingletons: vi.fn(),
      showAddNodeUI: false,
      showFlaggedOnly: false,
      showHiddenNodes: false,
      showLeftPanel: true,
      showResolutionModal: false,
      showSingletons: false,
      subtypeOptions: [],
      toggleDossierSection: vi.fn(),
    });
    useNetworkGraphInspectorState.mockReturnValue({
      clearInspectorSelection: vi.fn(),
      handleNodeClick: vi.fn(),
      handleOpenEntityInspector: vi.fn(),
      handleOpenHeadlineInspector: vi.fn(),
      handleOpenReportInspector: vi.fn(),
      inspectorMode: null,
      selectedEntityName: null,
      selectedHeadline: null,
      selectedNode: { id: 'entity:atlas', label: 'Atlas', isManual: false, subtype: 'ORG' },
      selectedReport: null,
      setSelectedEntityName: vi.fn(),
      setSelectedNode: vi.fn(),
      setSelectedReport: vi.fn(),
      setShowRightPanel: vi.fn(),
      showRightPanel: false,
    });
  });

  it('writes flag updates through selector actions rather than direct store access', async () => {
    const setFlaggedNodeIds = vi.fn(async () => undefined);
    useNetworkGraphFeatureState.mockReturnValue({
      ...baseState,
      setFlaggedNodeIds,
    });

    const { result } = renderHook(() =>
      useNetworkGraphController({
        onOpenChat: vi.fn(),
      })
    );

    await result.current.handleToggleFlag();

    expect(setFlaggedNodeIds).toHaveBeenCalledWith([]);
  });

  it('defaults the inspector selection to the active workspace report when nothing else is selected', () => {
    const setInspectorMode = vi.fn();
    const setSelectedEntityName = vi.fn();
    const setSelectedHeadline = vi.fn();
    const setSelectedNode = vi.fn();
    const setSelectedReport = vi.fn();

    useNetworkGraphFeatureState.mockReturnValue({
      ...baseState,
      artifacts: [
        {
          id: 'report-1',
          workspaceId: 'ws-1',
          topic: 'Atlas report',
          summary: 'Summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: 'raw',
        },
      ],
    });

    useNetworkGraphInspectorState.mockReturnValue({
      clearInspectorSelection: vi.fn(),
      handleNodeClick: vi.fn(),
      handleOpenEntityInspector: vi.fn(),
      handleOpenHeadlineInspector: vi.fn(),
      handleOpenReportInspector: vi.fn(),
      inspectorMode: null,
      selectedEntityName: null,
      selectedHeadline: null,
      selectedNode: null,
      selectedReport: null,
      setInspectorMode,
      setSelectedEntityName,
      setSelectedHeadline,
      setSelectedNode,
      setSelectedReport,
      setShowRightPanel: vi.fn(),
      showRightPanel: false,
    });

    renderHook(() =>
      useNetworkGraphController({
        onOpenChat: vi.fn(),
      })
    );

    expect(setSelectedReport).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'report-1',
      })
    );
    expect(setSelectedNode).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'case-report-1',
        type: 'REPORT',
        label: 'Atlas report',
      })
    );
    expect(setSelectedEntityName).toHaveBeenCalledWith(null);
    expect(setSelectedHeadline).toHaveBeenCalledWith(null);
    expect(setInspectorMode).toHaveBeenCalledWith('REPORT');
  });
});
