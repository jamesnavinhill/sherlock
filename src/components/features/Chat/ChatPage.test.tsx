import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ChatMessage, ChatSession } from '@/types';
import { useWorkspaceStore } from '../../../store/caseStore';
import { Chat } from './ChatPage';

const { streamWorkspaceChatTurn } = vi.hoisted(() => ({
  streamWorkspaceChatTurn: vi.fn(),
}));

vi.mock('../../../services/chat/runtime', async () => {
  const actual = await vi.importActual('../../../services/chat/runtime');

  return {
    ...actual,
    streamWorkspaceChatTurn,
  };
});

vi.mock('./GuidedRunBuilder', () => ({
  GuidedRunBuilder: () => <div data-testid="guided-run-builder" />,
}));

vi.mock('../../ui/TaskSetupModal', () => ({
  TaskSetupModal: ({ onStart }: { onStart: (...args: unknown[]) => void }) => (
    <div data-testid="task-setup-modal">
      <button onClick={() => onStart('New project topic', {}, undefined, undefined, undefined)}>
        Start
      </button>
    </div>
  ),
}));

describe('Chat page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    streamWorkspaceChatTurn.mockReset();
    Element.prototype.scrollIntoView = vi.fn();
    useWorkspaceStore.setState({
      artifacts: [],
      workspaces: [],
      chatActionsBySessionId: {},
      chatGenerationStatus: 'IDLE',
      chatMessagesBySessionId: {},
      chatSessions: [],
      customScopes: [],
      headlines: [],
      activeWorkspaceId: null,
      activeChatSessionId: null,
      partialAssistantOutput: '',
    });
  });

  it('opens the project setup flow from the empty workspace state', () => {
    render(<Chat onLaunchInvestigation={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /start new project/i }));

    expect(screen.getByTestId('task-setup-modal')).toBeInTheDocument();
  });

  it('creates a session and streams the first message from the composer', async () => {
    const session: ChatSession = {
      id: 'chat-session-1',
      workspaceId: 'case-1',
      title: 'Untitled Chat',
      status: 'ACTIVE',
      createdAt: 1,
      updatedAt: 1,
    };
    const assistantMessage: ChatMessage = {
      id: 'assistant-1',
      sessionId: session.id,
      role: 'assistant',
      content: 'Grounded answer',
      status: 'COMPLETED',
      createdAt: 2,
      updatedAt: 2,
    };

    const createChatSession = vi.fn(async () => session);
    const addChatMessage = vi.fn(async () => undefined);
    const addChatAction = vi.fn(async () => undefined);
    const updateChatMessage = vi.fn(async () => undefined);
    const renameChatSession = vi.fn(async () => undefined);
    const onLaunchInvestigation = vi.fn();

    streamWorkspaceChatTurn.mockResolvedValue({
      assistantMessage,
      attachments: [],
      action: {
        id: 'action-1',
        sessionId: session.id,
        type: 'SEARCH_WORKSPACE',
        status: 'COMPLETED',
        createdAt: 3,
        updatedAt: 3,
      },
      suggestedTitle: 'Atlas Chat',
    });

    useWorkspaceStore.setState({
      workspaces: [
        {
          id: 'case-1',
          title: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-03',
          description: 'Procurement activity',
        },
      ],
      activeWorkspaceId: 'case-1',
      createChatSession,
      addChatMessage,
      addChatAction,
      updateChatMessage,
      renameChatSession,
      deleteChatSession: vi.fn(async () => undefined),
      updateChatSession: vi.fn(async () => undefined),
      addToast: vi.fn(),
      archiveReport: vi.fn(async () => ({
        id: 'report-1',
        topic: 'Draft',
        summary: 'Draft summary',
        agendas: [],
        leads: [],
        entities: [],
        sources: [],
        rawText: 'draft',
      })),
      appendSectionToReport: vi.fn(async () => undefined),
      setActiveWorkspaceId: vi.fn(),
      setActiveChatSessionId: vi.fn(),
      setChatGenerationStatus: vi.fn(),
      setPartialAssistantOutput: vi.fn(),
    });

    render(<Chat onLaunchInvestigation={onLaunchInvestigation} />);

    fireEvent.change(screen.getByPlaceholderText(/ask about atlas workspace/i), {
      target: { value: 'What changed this week?' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: /send/i }).closest('form') as HTMLFormElement
    );

    await waitFor(() => {
      expect(createChatSession).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'case-1',
        })
      );
    });

    await waitFor(() => {
      expect(streamWorkspaceChatTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          session,
          query: 'What changed this week?',
        })
      );
    });

    expect(addChatMessage).toHaveBeenCalledTimes(2);
    expect(updateChatMessage).toHaveBeenCalledWith(
      expect.any(String),
      session.id,
      expect.objectContaining({
        content: 'Grounded answer',
        status: 'COMPLETED',
      })
    );
    expect(addChatAction).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: session.id,
        type: 'SEARCH_WORKSPACE',
      })
    );
    expect(renameChatSession).toHaveBeenCalledWith(session.id, 'Atlas Chat');
    expect(onLaunchInvestigation).not.toHaveBeenCalled();
  });

  it('uses non-inverted markdown prose in light mode', () => {
    useWorkspaceStore.setState({
      workspaces: [
        {
          id: 'case-1',
          title: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-03',
          description: 'Procurement activity',
        },
      ],
      activeWorkspaceId: 'case-1',
      activeChatSessionId: 'chat-session-1',
      chatSessions: [
        {
          id: 'chat-session-1',
          workspaceId: 'case-1',
          title: 'Atlas Chat',
          status: 'ACTIVE',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      chatMessagesBySessionId: {
        'chat-session-1': [
          {
            id: 'tool-1',
            sessionId: 'chat-session-1',
            role: 'tool',
            content: 'Fetched saved artifact summary.',
            status: 'COMPLETED',
            createdAt: 2,
            updatedAt: 2,
          },
        ],
      },
      themeMode: 'light',
      createChatSession: vi.fn(async () => {
        throw new Error('not used');
      }),
      createWorkspaceItem: vi.fn(async () => undefined),
      updateChatSession: vi.fn(async () => undefined),
      addChatAction: vi.fn(async () => undefined),
      addChatMessage: vi.fn(async () => undefined),
      addToast: vi.fn(),
      archiveReport: vi.fn(async () => ({
        id: 'report-1',
        topic: 'Draft',
        summary: 'Draft summary',
        agendas: [],
        leads: [],
        entities: [],
        sources: [],
        rawText: 'draft',
      })),
      appendSectionToReport: vi.fn(async () => undefined),
      customScopes: [],
      deleteChatSession: vi.fn(async () => undefined),
      ensureWorkspaceBoard: vi.fn(async () => ({
        id: 'board-1',
        workspaceId: 'case-1',
        name: 'Atlas Board',
        sortOrder: 0,
        createdAt: 1,
        updatedAt: 1,
      })),
      headlines: [],
      partialAssistantOutput: '',
      queueBoardPlacement: vi.fn(),
      renameChatSession: vi.fn(async () => undefined),
      setActiveWorkspaceId: vi.fn(),
      setActiveChatSessionId: vi.fn(),
      setChatGenerationStatus: vi.fn(),
      setCurrentView: vi.fn(),
      setPartialAssistantOutput: vi.fn(),
      updateChatMessage: vi.fn(async () => undefined),
    });

    const { container } = render(<Chat onLaunchInvestigation={vi.fn()} />);

    const proseBlock = container.querySelector('.prose');
    expect(proseBlock).toBeTruthy();
    expect(proseBlock?.className).not.toContain('prose-invert');
  });
});
