import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatRepository } from './ChatRepository';
import { chatMessageAttachments, chatMessages, chatSessions } from '../schema';

const { mockDb, transactionEvents, runWriteTransaction } = vi.hoisted(() => {
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
  };
  const transactionEvents: string[] = [];
  const runWriteTransaction = vi.fn(
    async (operation: (tx: typeof mockDb) => Promise<unknown>) => {
      transactionEvents.push('begin');
      try {
        const result = await operation(mockDb);
        transactionEvents.push('commit');
        return result;
      } catch (error) {
        transactionEvents.push('rollback');
        throw error;
      }
    }
  );

  return { mockDb, transactionEvents, runWriteTransaction };
});

vi.mock('../client', () => ({
  getDB: () => mockDb,
  runWriteTransaction,
}));

describe('ChatRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionEvents.length = 0;
  });

  it('hydrates messages grouped by session id and preserves attachments', async () => {
    const sessionRows = [
      {
        id: 'chat-1',
        workspaceId: 'case-1',
        title: 'Atlas Chat',
        status: 'ACTIVE',
        sourceArtifactId: null,
        packId: 'corporate-intelligence',
        purposeId: 'deep-dive',
        provider: 'OPENAI',
        modelId: 'gpt-test',
        metadataJson: JSON.stringify({ mode: 'STANDARD' }),
        createdAt: 1,
        updatedAt: 2,
      },
    ];
    const messageRows = [
      {
        id: 'msg-1',
        sessionId: 'chat-1',
        role: 'assistant',
        content: 'Atlas summary',
        status: 'COMPLETED',
        citationsJson: JSON.stringify(['CTX-1']),
        metadataJson: JSON.stringify({ provider: 'OPENAI' }),
        error: null,
        createdAt: 10,
        updatedAt: 11,
      },
    ];
    const attachmentRows = [
      {
        id: 'att-1',
        messageId: 'msg-1',
        kind: 'REPORT',
        title: 'Atlas Brief',
        refId: 'rep-1',
        refKind: 'REPORT',
        snippet: 'Saved artifact summary',
        metadataJson: JSON.stringify({ artifactType: 'BRIEF' }),
        createdAt: 12,
      },
    ];

    mockDb.select.mockImplementation(() => ({
      from: (table: unknown) => {
        if (table === chatSessions) {
          return {
            orderBy: vi.fn().mockResolvedValue(sessionRows),
          };
        }

        if (table === chatMessages) {
          return {
            where: vi.fn(() => ({
              orderBy: vi.fn().mockResolvedValue(messageRows),
            })),
          };
        }

        if (table === chatMessageAttachments) {
          return {
            where: vi.fn(() => ({
              orderBy: vi.fn().mockResolvedValue(attachmentRows),
            })),
          };
        }

        throw new Error('Unexpected table access.');
      },
    }));

    const sessions = await ChatRepository.getAllSessions();
    const messagesBySession = await ChatRepository.getMessagesBySessionIds(['chat-1']);

    expect(sessions[0]).toEqual(
      expect.objectContaining({
        id: 'chat-1',
        title: 'Atlas Chat',
        provider: 'OPENAI',
        metadata: { mode: 'STANDARD' },
      })
    );
    expect(messagesBySession['chat-1'][0]).toEqual(
      expect.objectContaining({
        id: 'msg-1',
        citations: ['CTX-1'],
        attachments: [
          expect.objectContaining({
            id: 'att-1',
            refId: 'rep-1',
            metadata: { artifactType: 'BRIEF' },
          }),
        ],
      })
    );
  });

  it('serializes metadata and nullable fields when creating a session', async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values });

    await ChatRepository.createSession({
      id: 'chat-2',
      workspaceId: 'case-1',
      title: 'Briefing Chat',
      status: 'ACTIVE',
      provider: 'OPENAI',
      modelId: 'gpt-test',
      metadata: { pinned: true },
      createdAt: 1,
      updatedAt: 2,
    });

    expect(mockDb.insert).toHaveBeenCalledWith(chatSessions);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'chat-2',
        workspaceId: 'case-1',
        sourceArtifactId: null,
        metadataJson: JSON.stringify({ pinned: true }),
      })
    );
  });

  it('creates messages and attachments in one transaction', async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values });

    await ChatRepository.createMessage({
      id: 'msg-2',
      sessionId: 'chat-2',
      role: 'assistant',
      content: 'Saved answer',
      status: 'COMPLETED',
      attachments: [
        {
          id: 'att-2',
          messageId: 'msg-2',
          kind: 'REPORT',
          title: 'Atlas Brief',
          refId: 'rep-1',
          createdAt: 3,
        },
      ],
      createdAt: 1,
      updatedAt: 2,
    });

    expect(runWriteTransaction).toHaveBeenCalledTimes(1);
    expect(transactionEvents).toEqual(['begin', 'commit']);
    expect(mockDb.insert).toHaveBeenCalledWith(chatMessages);
    expect(mockDb.insert).toHaveBeenCalledWith(chatMessageAttachments);
  });

  it('propagates attachment failures so the outer transaction can roll back', async () => {
    const failure = new Error('attachment insert failed');
    const values = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(failure);
    mockDb.insert.mockReturnValue({ values });

    await expect(
      ChatRepository.createMessage({
        id: 'msg-3',
        sessionId: 'chat-3',
        role: 'assistant',
        content: 'Saved answer',
        status: 'COMPLETED',
        attachments: [
          {
            id: 'att-3',
            messageId: 'msg-3',
            kind: 'REPORT',
            title: 'Atlas Brief',
            refId: 'rep-1',
            createdAt: 3,
          },
        ],
        createdAt: 1,
        updatedAt: 2,
      })
    ).rejects.toThrow('attachment insert failed');

    expect(runWriteTransaction).toHaveBeenCalledTimes(1);
    expect(transactionEvents).toEqual(['begin', 'rollback']);
  });
});
