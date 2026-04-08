import { describe, expect, it } from 'vitest';
import type { ChatMessage, ChatSession } from '@/types';
import { buildFollowUpRunFromChatMessage } from './runtime';
import { mapMentionToWorkspaceContextSnippet } from './mentions';

const buildSession = (overrides: Partial<ChatSession> = {}): ChatSession => ({
  id: overrides.id || 'chat-1',
  workspaceId: overrides.workspaceId || 'case-1',
  title: overrides.title || 'Workspace Chat',
  status: overrides.status || 'ACTIVE',
  sourceArtifactId: overrides.sourceArtifactId,
  packId: overrides.packId,
  purposeId: overrides.purposeId,
  provider: overrides.provider || 'OPENAI',
  modelId: overrides.modelId || 'gpt-4.1-mini',
  metadata: overrides.metadata,
  createdAt: overrides.createdAt || 1,
  updatedAt: overrides.updatedAt || 1,
});

const message: ChatMessage = {
  id: 'msg-1',
  sessionId: 'chat-1',
  role: 'assistant',
  content: 'Investigate Atlas shell vendors next.',
  status: 'COMPLETED',
  createdAt: 1,
  updatedAt: 1,
};

describe('buildFollowUpRunFromChatMessage', () => {
  it('preserves signal and artifact lineage from the chat session launch context', () => {
    const result = buildFollowUpRunFromChatMessage({
      session: buildSession({
        sourceArtifactId: 'rep-1',
        metadata: {
          launchContext: {
            sourceArtifactId: 'rep-1',
            headlineId: 'sig-1',
          },
        },
      }),
      workspace: {
        id: 'case-1',
        scopeId: 'open-investigation',
        title: 'Atlas Workspace',
        status: 'ACTIVE',
        dateOpened: '2026-04-03',
        purposeId: 'deep-dive',
      },
      message,
      workspaceIntent: 'CURRENT',
    });

    expect(result.request.parentArtifactId).toBe('rep-1');
    expect(result.request.sourceSignalId).toBe('sig-1');
    expect(result.request.launchSource).toBe('CHAT_FOLLOW_UP');
  });

  it('maps canonical mentions into retrieval snippets', () => {
    expect(
      mapMentionToWorkspaceContextSnippet({
        id: 'mention:item-1',
        workspaceId: 'case-1',
        kind: 'WORKSPACE_ITEM',
        refId: 'item-1',
        title: 'Atlas Filing Note',
        subtitle: 'NOTE',
        snippet: 'Saved note',
        metadata: {
          workspaceItemKind: 'NOTE',
        },
      })
    ).toEqual(
      expect.objectContaining({
        id: 'CTX-MENTION-WORKSPACE_ITEM-item-1',
        kind: 'NOTE',
        refId: 'item-1',
        title: 'Atlas Filing Note',
      })
    );
  });
});
