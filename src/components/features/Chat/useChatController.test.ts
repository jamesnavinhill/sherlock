import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.fn();
const { useChatFeatureState } = vi.hoisted(() => ({
  useChatFeatureState: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/store/selectors/chatSelectors', () => ({
  useChatFeatureState,
}));

import { useChatController } from './useChatController';

describe('useChatController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as Window & { innerWidth: number }).innerWidth = 1280;

    useChatFeatureState.mockReturnValue({
      artifacts: [],
      workspaces: [
        {
          id: 'ws-1',
          title: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-06',
        },
      ],
      chatActionsBySessionId: {},
      chatGenerationStatus: 'IDLE',
      chatMessagesBySessionId: {},
      chatSessions: [],
      createChatSession: vi.fn(),
      createWorkspaceItem: vi.fn(),
      updateChatSession: vi.fn(),
      activeWorkspaceId: 'ws-1',
      activeChatSessionId: null,
      addChatAction: vi.fn(),
      addChatMessage: vi.fn(),
      addToast: vi.fn(),
      saveArtifact: vi.fn(),
      appendSectionToArtifact: vi.fn(),
      customScopes: [],
      deleteChatSession: vi.fn(),
      ensureWorkspaceBoard: vi.fn(),
      headlines: [],
      partialAssistantOutput: '',
      queueBoardPlacement: vi.fn(),
      renameChatSession: vi.fn(),
      setActiveWorkspaceId: vi.fn(),
      setActiveChatSessionId: vi.fn(),
      setChatGenerationStatus: vi.fn(),
      setPartialAssistantOutput: vi.fn(),
      themeMode: 'dark',
      updateChatMessage: vi.fn(),
      workspaceItems: [],
    });
  });

  it('defaults to the sessions rail open, context rail closed, and all sections collapsed on desktop', () => {
    const { result } = renderHook(() =>
      useChatController({
        onLaunchInvestigation: vi.fn(),
      })
    );

    expect(result.current.leftPanelOpen).toBe(true);
    expect(result.current.rightPanelOpen).toBe(false);
    expect(result.current.leftPanelSections).toEqual({
      sessions: false,
      workspace: false,
    });
    expect(result.current.rightPanelSections).toEqual({
      launchContext: false,
      recentArtifacts: false,
      recentSignals: false,
      latestRetrieval: false,
      actionLog: false,
    });
  });

  it('controls new-project modal state through controller menu handlers', () => {
    const { result } = renderHook(() =>
      useChatController({
        onLaunchInvestigation: vi.fn(),
      })
    );

    act(() => {
      result.current.setShowNewMenu(true);
      result.current.handleStartNewProject();
    });

    expect(result.current.showNewMenu).toBe(false);
    expect(result.current.showNewProjectModal).toBe(true);
  });

  it('opens shared upload routing state before committing chat uploads', () => {
    const createWorkspaceItem = vi.fn();
    useChatFeatureState.mockReturnValue({
      artifacts: [],
      workspaces: [
        {
          id: 'ws-1',
          title: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-06',
        },
      ],
      chatActionsBySessionId: {},
      chatGenerationStatus: 'IDLE',
      chatMessagesBySessionId: {},
      chatSessions: [],
      createChatSession: vi.fn(),
      createWorkspaceItem,
      updateChatSession: vi.fn(),
      activeWorkspaceId: 'ws-1',
      activeChatSessionId: null,
      addChatAction: vi.fn(),
      addChatMessage: vi.fn(),
      addToast: vi.fn(),
      saveArtifact: vi.fn(),
      appendSectionToArtifact: vi.fn(),
      customScopes: [],
      deleteChatSession: vi.fn(),
      ensureWorkspaceBoard: vi.fn(),
      headlines: [],
      partialAssistantOutput: '',
      queueBoardPlacement: vi.fn(),
      renameChatSession: vi.fn(),
      setActiveWorkspaceId: vi.fn(),
      setActiveChatSessionId: vi.fn(),
      setChatGenerationStatus: vi.fn(),
      setPartialAssistantOutput: vi.fn(),
      themeMode: 'dark',
      updateChatMessage: vi.fn(),
      workspaceItems: [],
    });

    const { result } = renderHook(() =>
      useChatController({
        onLaunchInvestigation: vi.fn(),
      })
    );

    act(() => {
      result.current.handleFileUpload({
        target: {
          files: [new File(['Atlas findings'], 'atlas-notes.md', { type: 'text/markdown' })],
          value: 'atlas-notes.md',
        },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.uploadDialogState).toEqual(
      expect.objectContaining({
        route: 'WORKSPACE_ITEM',
        targetWorkspaceId: 'ws-1',
      })
    );
    expect(createWorkspaceItem).not.toHaveBeenCalled();
  });
});
