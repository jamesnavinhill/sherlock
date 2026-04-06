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

vi.mock('@/store/selectors/featureSelectors', () => ({
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
      updateReportTitle: vi.fn(async () => undefined),
      renameEntityAcrossReports: vi.fn(async () => undefined),
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

  it('saves templates and uses selector toast feedback', () => {
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

    act(() => {
      result.current.executeSaveTemplate();
    });

    expect(addTemplate).toHaveBeenCalledTimes(1);
    expect(addToast).toHaveBeenCalledWith('Template saved successfully', 'SUCCESS');
  });
});
