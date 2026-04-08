import { beforeEach, describe, expect, it, vi } from 'vitest';

const { buildArtifactDraftFromChatMessage } = vi.hoisted(() => ({
  buildArtifactDraftFromChatMessage: vi.fn(),
}));

vi.mock('@/services/chat/runtime', () => ({
  buildArtifactDraftFromChatMessage,
  buildArtifactAppendFromChatMessage: vi.fn(),
  buildFollowUpRunFromChatMessage: vi.fn(),
}));

import { saveChatMessageAsArtifact } from './chatTranscriptActions';

describe('chatTranscriptActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildArtifactDraftFromChatMessage.mockReturnValue({
      report: {
        topic: 'Saved artifact',
        summary: 'Draft summary',
        agendas: [],
        leads: [],
        entities: [],
        sources: [],
        rawText: 'raw',
        config: {},
      },
      action: {
        id: 'action-1',
        sessionId: 'session-1',
        type: 'CREATE_ARTIFACT_DRAFT',
        status: 'COMPLETED',
        input: {},
        result: {},
        createdAt: 1,
        updatedAt: 1,
      },
    });
  });

  it('uses the resolved workspace display title when saving chat drafts as artifacts', async () => {
    const saveArtifact = vi.fn(async (report) => ({
      ...report,
      id: 'artifact-1',
    }));
    const addChatAction = vi.fn(async () => undefined);
    const addToast = vi.fn();

    await saveChatMessageAsArtifact({
      activeSession: {
        id: 'session-1',
        workspaceId: 'ws-1',
        title: 'Atlas chat',
        createdAt: 1,
        updatedAt: 1,
      } as never,
      activeWorkspace: {
        id: 'ws-1',
        title: '[WORKSPACE]: Legacy Atlas',
        displayTitle: 'Atlas Workspace',
        status: 'ACTIVE',
        dateOpened: '2026-04-08',
      } as never,
      addChatAction,
      addToast,
      saveArtifact,
      message: {
        id: 'message-1',
        sessionId: 'session-1',
        role: 'assistant',
        content: 'Draft this into an artifact.',
        status: 'COMPLETED',
        createdAt: 1,
        updatedAt: 1,
      } as never,
    });

    expect(saveArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'Saved artifact',
      }),
      {
        topic: 'Atlas Workspace',
        summary: 'Atlas Workspace workspace',
      }
    );
  });
});
