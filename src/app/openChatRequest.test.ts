import { describe, expect, it, vi } from 'vitest';

import type { ChatMessage, ChatSession } from '@/types';
import { openWorkspaceChatRequest } from './openChatRequest';

describe('openWorkspaceChatRequest', () => {
  it('reuses an existing launch-context session before creating a new one', async () => {
    const navigate = vi.fn();
    const addChatMessage = vi.fn();
    const addToast = vi.fn();
    const createChatSession = vi.fn();
    const setActiveChatSessionId = vi.fn();
    const setActiveWorkspaceId = vi.fn();

    const existingSession: ChatSession = {
      id: 'session-1',
      workspaceId: 'ws-1',
      title: 'Atlas Brief',
      status: 'ACTIVE',
      packId: 'pack-1',
      purposeId: 'purpose-1',
      metadata: {
        launchContext: {
          sourceArtifactId: 'rep-1',
        },
      },
      createdAt: 100,
      updatedAt: 200,
    };

    await openWorkspaceChatRequest({
      addChatMessage,
      addToast,
      artifacts: [],
      chatMessagesBySessionId: {
        'session-1': [],
      },
      chatSessions: [existingSession],
      createChatSession,
      headlines: [],
      navigate,
      request: {
        workspaceId: 'ws-1',
        launchContext: {
          sourceArtifactId: 'rep-1',
        },
      },
      setActiveChatSessionId,
      setActiveWorkspaceId,
      workspaceItems: [],
      workspaces: [
        {
          id: 'ws-1',
          title: 'Atlas Workspace',
          displayTitle: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-07',
          packId: 'pack-1',
          purposeId: 'purpose-1',
        },
      ],
    });

    expect(createChatSession).not.toHaveBeenCalled();
    expect(setActiveWorkspaceId).toHaveBeenCalledWith('ws-1');
    expect(setActiveChatSessionId).toHaveBeenCalledWith('session-1');
    expect(navigate).toHaveBeenCalledWith('/workspaces/ws-1/chat/session-1');
  });

  it('creates a chat session and appends a launch primer when needed', async () => {
    const navigate = vi.fn();
    const addToast = vi.fn();
    const addChatMessage = vi.fn().mockResolvedValue(undefined);
    const setActiveChatSessionId = vi.fn();
    const setActiveWorkspaceId = vi.fn();
    const createdSession: ChatSession = {
      id: 'session-2',
      workspaceId: 'ws-1',
      title: 'Atlas Brief',
      status: 'ACTIVE',
      packId: 'pack-1',
      purposeId: 'purpose-1',
      metadata: {},
      createdAt: 100,
      updatedAt: 100,
    };
    const createChatSession = vi.fn().mockResolvedValue(createdSession);

    await openWorkspaceChatRequest({
      addChatMessage,
      addToast,
      artifacts: [
        {
          id: 'rep-1',
          workspaceId: 'ws-1',
          topic: 'Atlas Brief',
          summary: 'Brief summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: '',
        },
      ],
      chatMessagesBySessionId: {} as Record<string, ChatMessage[]>,
      chatSessions: [],
      createChatSession,
      headlines: [],
      navigate,
      request: {
        workspaceId: 'ws-1',
        launchContext: {
          workspaceItemId: 'item-1',
        },
      },
      setActiveChatSessionId,
      setActiveWorkspaceId,
      workspaceItems: [
        {
          id: 'item-1',
          workspaceId: 'ws-1',
          kind: 'NOTE',
          title: 'Atlas Note',
          textContent: 'Saved note body',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      workspaces: [
        {
          id: 'ws-1',
          title: 'Atlas Workspace',
          displayTitle: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-07',
          packId: 'pack-1',
          purposeId: 'purpose-1',
        },
      ],
    });

    expect(createChatSession).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        title: 'Atlas Note',
        sourceArtifactId: undefined,
      })
    );
    expect(addChatMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-2',
        role: 'tool',
        attachments: [expect.objectContaining({ refId: 'item-1', refKind: 'WORKSPACE_ITEM' })],
      })
    );
    expect(navigate).toHaveBeenCalledWith('/workspaces/ws-1/chat/session-2');
  });
});
