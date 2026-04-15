import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.fn();
const selectorState = vi.hoisted(() => ({
  useOperationFeatureState: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/store/selectors/operationSelectors', () => ({
  useOperationFeatureState: selectorState.useOperationFeatureState,
}));

import { useOperationViewController } from './useOperationViewController';

describe('useOperationViewController', () => {
  let baseState: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    (window as Window & { innerWidth: number }).innerWidth = 1280;
    baseState = {
      workspaces: [],
      artifacts: [],
      headlines: [],
      addToast: vi.fn(),
      addTemplate: vi.fn(),
      updateArtifactSection: vi.fn(async () => undefined),
      updateArtifactTitle: vi.fn(async () => undefined),
      updateArtifactSummary: vi.fn(async () => undefined),
      renameEntityAcrossArtifacts: vi.fn(async () => undefined),
      activeWorkspaceId: 'ws-1',
      setActiveWorkspaceId: vi.fn(),
      ensureWorkspaceBoard: vi.fn(async () => ({ id: 'board-1' })),
      queueBoardPlacement: vi.fn(),
      customScopes: [],
      flaggedNodeIds: [],
      toggleFlag: vi.fn(),
    };
    selectorState.useOperationFeatureState.mockReturnValue(baseState);
  });

  it('defaults the workspace rail and its sections collapsed', () => {
    const { result } = renderHook(() =>
      useOperationViewController({
        onNavigate: vi.fn(),
        onOpenChat: vi.fn(),
        task: null,
      })
    );

    expect(result.current.leftPanelOpen).toBe(false);
    expect(result.current.openSections).toEqual({
      caseInfo: false,
      reports: false,
      findings: false,
      entities: false,
      leads: false,
      evidence: false,
      sources: false,
      headlines: false,
    });
  });

  it('routes flag actions through selector-owned toggle handlers', () => {
    const toggleFlag = vi.fn();
    selectorState.useOperationFeatureState.mockReturnValue({
      ...baseState,
      toggleFlag,
    });

    const { result } = renderHook(() =>
      useOperationViewController({
        onNavigate: vi.fn(),
        onOpenChat: vi.fn(),
        task: null,
      })
    );

    act(() => {
      result.current.handleFlagEntity('Atlas Holdings');
    });

    expect(toggleFlag).toHaveBeenCalledWith('Atlas Holdings');
  });

  it('saves templates and uses selector toast feedback', async () => {
    const addTemplate = vi.fn();
    const addToast = vi.fn();

    selectorState.useOperationFeatureState.mockReturnValue({
      ...baseState,
      addTemplate,
      addToast,
    });

    const { result } = renderHook(() =>
      useOperationViewController({
        onNavigate: vi.fn(),
        onOpenChat: vi.fn(),
        task: null,
        reportOverride: {
          id: 'artifact-1',
          topic: 'Atlas Report',
          summary: 'Summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: 'raw',
          config: {},
        },
      })
    );

    act(() => {
      result.current.handleSaveTemplate();
    });

    expect(result.current.templateName.length).toBeGreaterThan(0);

    await act(async () => {
      await result.current.executeSaveTemplate();
    });

    expect(addTemplate).toHaveBeenCalledTimes(1);
    expect(addToast).toHaveBeenCalledWith('Template saved successfully', 'SUCCESS');
  });

  it('saves the unified report body to both summary and executive summary section state', async () => {
    const updateArtifactSummary = vi.fn(async () => undefined);
    const updateArtifactSection = vi.fn(async () => undefined);
    const addToast = vi.fn();

    selectorState.useOperationFeatureState.mockReturnValue({
      ...baseState,
      updateArtifactSummary,
      updateArtifactSection,
      addToast,
    });

    const { result } = renderHook(() =>
      useOperationViewController({
        onNavigate: vi.fn(),
        onOpenChat: vi.fn(),
        task: null,
        reportOverride: {
          id: 'artifact-1',
          topic: 'Atlas Report',
          summary: 'Summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: 'raw',
          sections: [
            {
              id: 'section-executive_summary-0',
              kind: 'EXECUTIVE_SUMMARY',
              title: 'Executive Summary',
              content: 'Summary',
              order: 0,
            },
          ],
          config: {},
        },
      })
    );

    await act(async () => {
      await result.current.handleReportBodySave(
        'Expanded report body for editing.',
        'section-executive_summary-0'
      );
    });

    expect(updateArtifactSummary).toHaveBeenCalledWith(
      'artifact-1',
      'Expanded report body for editing.'
    );
    expect(updateArtifactSection).toHaveBeenCalledWith(
      'artifact-1',
      'section-executive_summary-0',
      {
        content: 'Expanded report body for editing.',
      }
    );
    expect(addToast).toHaveBeenCalledWith('Artifact updated.', 'SUCCESS');
  });

  it('saves non-summary document sections without overwriting the artifact summary', async () => {
    const updateArtifactSummary = vi.fn(async () => undefined);
    const updateArtifactSection = vi.fn(async () => undefined);
    const addToast = vi.fn();

    selectorState.useOperationFeatureState.mockReturnValue({
      ...baseState,
      updateArtifactSummary,
      updateArtifactSection,
      addToast,
    });

    const { result } = renderHook(() =>
      useOperationViewController({
        onNavigate: vi.fn(),
        onOpenChat: vi.fn(),
        task: null,
        reportOverride: {
          id: 'artifact-1',
          topic: 'Atlas Report',
          summary: 'Summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: 'raw',
          sections: [
            {
              id: 'section-executive_summary-0',
              kind: 'EXECUTIVE_SUMMARY',
              title: 'Executive Summary',
              content: 'Summary',
              order: 0,
            },
            {
              id: 'section-methodology-1',
              kind: 'METHODOLOGY',
              title: 'Methodology',
              content: 'Method notes',
              order: 1,
            },
          ],
          config: {},
        },
      })
    );

    await act(async () => {
      await result.current.handleReportBodySave('Expanded methodology details.', 'section-methodology-1', {
        syncSummary: false,
      });
    });

    expect(updateArtifactSummary).not.toHaveBeenCalled();
    expect(updateArtifactSection).toHaveBeenCalledWith(
      'artifact-1',
      'section-methodology-1',
      {
        content: 'Expanded methodology details.',
      }
    );
    expect(addToast).toHaveBeenCalledWith('Artifact updated.', 'SUCCESS');
  });

  it('does not show the placeholder when a routed artifact is present even if the workspace selector is on ALL', () => {
    selectorState.useOperationFeatureState.mockReturnValue({
      ...baseState,
      activeWorkspaceId: 'ALL',
    });

    const { result } = renderHook(() =>
      useOperationViewController({
        onNavigate: vi.fn(),
        onOpenChat: vi.fn(),
        task: null,
        reportOverride: {
          id: 'artifact-1',
          workspaceId: 'ws-1',
          topic: 'Atlas Report',
          summary: 'Summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: 'raw',
          config: {},
        },
      })
    );

    expect(result.current.showPlaceholder).toBe(false);
    expect(result.current.report?.id).toBe('artifact-1');
  });

  it('uses canonical chat and board handoff payloads for report and headline actions', async () => {
    const onOpenChat = vi.fn();
    const queueBoardPlacement = vi.fn();

    selectorState.useOperationFeatureState.mockReturnValue({
      ...baseState,
      queueBoardPlacement,
      ensureWorkspaceBoard: vi.fn(async () => ({ id: 'board-1' })),
    });

    const { result } = renderHook(() =>
      useOperationViewController({
        onNavigate: vi.fn(),
        onOpenChat,
        task: null,
        reportOverride: {
          id: 'artifact-1',
          workspaceId: 'ws-1',
          topic: 'Atlas Report',
          summary: 'Summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: 'raw',
          config: {},
        },
      })
    );

    act(() => {
      result.current.handleOpenReportChat();
      result.current.handleHeadlineClick({
        id: 'signal-1',
        workspaceId: 'ws-1',
        content: 'Headline text',
        source: 'Ledger',
        timestamp: '2026-04-08T00:00:00.000Z',
        type: 'NEWS',
        status: 'PENDING',
        threatLevel: 'INFO',
      });
    });

    act(() => {
      result.current.handleOpenHeadlineChat();
    });

    await act(async () => {
      await result.current.handlePlaceReportOnBoard();
    });

    expect(onOpenChat.mock.calls).toEqual([
      [
        {
          workspaceId: 'ws-1',
          launchContext: {
            sourceArtifactId: 'artifact-1',
          },
        },
      ],
      [
        {
          workspaceId: 'ws-1',
          launchContext: {
            signalId: 'signal-1',
            headlineId: 'signal-1',
          },
        },
      ],
    ]);
    expect(queueBoardPlacement).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      boardId: 'board-1',
      item: {
        workspaceId: 'ws-1',
        refKind: 'ARTIFACT',
        refId: 'artifact-1',
        title: 'Atlas Report',
        metadata: {
          artifactType: undefined,
        },
      },
      openInBoard: true,
      mode: undefined,
    });
    expect(navigateMock).toHaveBeenCalledWith('/workspaces/ws-1/board/board-1');
  });
});
