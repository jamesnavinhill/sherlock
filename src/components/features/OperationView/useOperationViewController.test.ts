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
});
