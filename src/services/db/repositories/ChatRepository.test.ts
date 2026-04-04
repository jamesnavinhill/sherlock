import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatRepository } from './ChatRepository';
import {
    chatMessageAttachments,
    chatMessages,
    chatSessions,
} from '../schema';

const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
};

vi.mock('../client', () => ({
    getDB: () => mockDb,
}));

describe('ChatRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('hydrates messages grouped by session id and preserves attachments', async () => {
        const sessionRows = [
            {
                id: 'chat-1',
                workspaceId: 'case-1',
                title: 'Atlas Chat',
                status: 'ACTIVE',
                sourceReportId: null,
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
                sourceReportId: null,
                metadataJson: JSON.stringify({ pinned: true }),
            })
        );
    });
});
