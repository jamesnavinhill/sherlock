import { describe, expect, it } from 'vitest';
import type { ChatOpenRequest, ChatSession } from '@/types';
import {
    areChatLaunchContextsEqual,
    buildLaunchContextPrimer,
    findReusableChatSession,
    getChatLaunchContextFromSession,
} from './launchContext';

const buildSession = (overrides: Partial<ChatSession>): ChatSession => ({
    id: overrides.id || 'chat-session-1',
    workspaceId: overrides.workspaceId || 'case-1',
    title: overrides.title || 'Untitled Chat',
    status: overrides.status || 'ACTIVE',
    sourceReportId: overrides.sourceReportId,
    packId: overrides.packId,
    purposeId: overrides.purposeId,
    provider: overrides.provider,
    modelId: overrides.modelId,
    metadata: overrides.metadata,
    createdAt: overrides.createdAt || 1,
    updatedAt: overrides.updatedAt || 1,
});

describe('chat launch context helpers', () => {
    it('compares launch contexts by report, entity, and headline identity', () => {
        expect(
            areChatLaunchContextsEqual(
                { sourceReportId: 'report-1', entityName: 'Atlas', headlineId: 'headline-1' },
                { sourceReportId: 'report-1', entityName: 'Atlas', headlineId: 'headline-1' }
            )
        ).toBe(true);

        expect(
            areChatLaunchContextsEqual(
                { sourceReportId: 'report-1' },
                { sourceReportId: 'report-2' }
            )
        ).toBe(false);
    });

    it('reuses exact launch-context sessions before generic workspace sessions', () => {
        const request: ChatOpenRequest = {
            workspaceId: 'case-1',
            launchContext: {
                sourceReportId: 'report-1',
            },
        };

        const genericSession = buildSession({
            id: 'generic-session',
            updatedAt: 30,
        });
        const matchingSession = buildSession({
            id: 'matching-session',
            updatedAt: 10,
            sourceReportId: 'report-1',
            metadata: {
                launchContext: {
                    sourceReportId: 'report-1',
                },
            },
        });

        expect(findReusableChatSession([genericSession, matchingSession], request)?.id).toBe('matching-session');
        expect(getChatLaunchContextFromSession(matchingSession)).toEqual({ sourceReportId: 'report-1' });
    });

    it('reuses an exact requested session before other workspace sessions', () => {
        const request: ChatOpenRequest = {
            workspaceId: 'case-1',
            sessionId: 'chat-session-2',
        };

        const olderSession = buildSession({
            id: 'chat-session-1',
            updatedAt: 10,
        });
        const exactSession = buildSession({
            id: 'chat-session-2',
            updatedAt: 1,
        });

        expect(findReusableChatSession([olderSession, exactSession], request)?.id).toBe('chat-session-2');
    });

    it('skips guided sessions when opening a generic workspace chat', () => {
        const request: ChatOpenRequest = {
            workspaceId: 'case-1',
        };

        const guidedSession = buildSession({
            id: 'guided-session',
            updatedAt: 50,
            metadata: {
                sessionMode: 'GUIDED',
            },
        });
        const standardSession = buildSession({
            id: 'standard-session',
            updatedAt: 25,
        });

        expect(findReusableChatSession([guidedSession, standardSession], request)?.id).toBe('standard-session');
    });

    it('builds a primer for entity launches with related artifact attachments', () => {
        const primer = buildLaunchContextPrimer({
            session: buildSession({ id: 'chat-entity' }),
            launchContext: {
                entityName: 'Atlas Holdings',
            },
            reports: [
                {
                    id: 'report-1',
                    caseId: 'case-1',
                    topic: 'Atlas baseline',
                    summary: 'Atlas Holdings appears in the procurement flow.',
                    agendas: [],
                    leads: [],
                    entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
                    sources: [],
                    rawText: 'Atlas Holdings owns the bidding shell.',
                },
            ],
            headlines: [],
        });

        expect(primer?.content).toContain('Pinned entity context');
        expect(primer?.attachments).toHaveLength(1);
        expect(primer?.attachments?.[0].refId).toBe('report-1');
    });
});
