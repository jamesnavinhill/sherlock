import { describe, expect, it, vi } from 'vitest';
import type { ChatAttachment, ChatMessage } from '@/types';
import { buildWorkspaceExcerptItemFromAttachment } from './promotions';

describe('workspace promotions', () => {
  it('builds a canonical excerpt item from a chat attachment with provenance', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-05T12:00:00.000Z'));

    const message: ChatMessage = {
      id: 'msg-1',
      sessionId: 'chat-1',
      role: 'assistant',
      content: 'Expanded answer body',
      status: 'COMPLETED',
      citations: ['CTX-1'],
      createdAt: 1,
      updatedAt: 1,
    };
    const attachment: ChatAttachment = {
      id: 'att-1',
      messageId: 'msg-1',
      kind: 'SOURCE',
      title: 'Registry Filing',
      snippet: 'Filing confirms the ownership transfer.',
      metadata: {
        url: 'https://example.test/filing',
      },
      createdAt: 1,
    };

    const item = buildWorkspaceExcerptItemFromAttachment({
      workspaceId: 'case-1',
      sessionId: 'chat-1',
      message,
      attachment,
    });

    expect(item.kind).toBe('EXCERPT');
    expect(item.title).toBe('Registry Filing Excerpt');
    expect(item.textContent).toBe('Filing confirms the ownership transfer.');
    expect(item.url).toBe('https://example.test/filing');
    expect(item.provenance).toMatchObject({
      source: 'CHAT',
      sourceMessageId: 'msg-1',
      sourceSessionId: 'chat-1',
      description: 'Promoted from a chat retrieval excerpt.',
    });
    expect(item.metadata).toMatchObject({
      attachmentKind: 'SOURCE',
      citationIds: ['CTX-1'],
      messageRole: 'assistant',
    });

    vi.useRealTimers();
  });

  it('falls back to the message body when an attachment has no snippet', () => {
    const message: ChatMessage = {
      id: 'msg-2',
      sessionId: 'chat-2',
      role: 'assistant',
      content: 'This answer contains the only available excerpt text for promotion.',
      status: 'COMPLETED',
      createdAt: 2,
      updatedAt: 2,
    };
    const attachment: ChatAttachment = {
      id: 'att-2',
      messageId: 'msg-2',
      kind: 'REPORT',
      title: 'Audit Memo',
      refId: 'rep-9',
      refKind: 'REPORT',
      createdAt: 2,
    };

    const item = buildWorkspaceExcerptItemFromAttachment({
      workspaceId: 'case-2',
      sessionId: 'chat-2',
      message,
      attachment,
    });

    expect(item.textContent).toContain('only available excerpt text');
    expect(item.provenance?.sourceReportId).toBe('rep-9');
  });
});
