import { describe, expect, it, vi } from 'vitest';
import type { Headline, InvestigationReport, InvestigationTask, TimelineQueryState } from '@/types';
import { buildWorkspaceTimelineEvents, filterTimelineEvents, getTrackCount } from './timelineEvents';

describe('timelineEvents', () => {
    it('builds a mixed chronology for a workspace', () => {
        const artifacts: InvestigationReport[] = [
            {
                id: 'rep-1',
                caseId: 'case-1',
                topic: 'Acme Supplier Brief',
                createdAt: 300,
                summary: 'Artifact summary',
                agendas: [],
                leads: [],
                entities: [],
                sources: [],
                rawText: 'raw',
                artifactType: 'BRIEF',
                purposeId: 'deep-dive',
            },
        ];
        const runs: InvestigationTask[] = [
            {
                id: 'run-1',
                workspaceId: 'case-1',
                topic: 'Acme Supplier Brief',
                status: 'COMPLETED',
                startTime: 100,
                endTime: 200,
            },
        ];
        const signals: Headline[] = [
            {
                id: 'sig-1',
                caseId: 'case-1',
                content: 'Supplier risk escalated',
                source: 'Reuters',
                timestamp: '2026-04-01T10:00:00.000Z',
                type: 'NEWS',
                status: 'PENDING',
                threatLevel: 'CAUTION',
            },
        ];

        const events = buildWorkspaceTimelineEvents({
            workspaceId: 'case-1',
            artifacts,
            runs,
            signals,
            chatSessions: [],
            chatActionsBySessionId: {},
        });

        expect(events.map((event) => event.type)).toEqual([
            'SIGNAL_SAVED',
            'ARTIFACT_CREATED',
            'RUN_COMPLETED',
            'RUN_STARTED',
        ]);
        expect(events.find((event) => event.type === 'RUN_COMPLETED')?.metadata?.relatedArtifactId).toBe('rep-1');
        expect(getTrackCount(events, 'RUN')).toBe(2);
    });

    it('filters by search text, track, and range', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-10T12:00:00.000Z'));

        const events = buildWorkspaceTimelineEvents({
            workspaceId: 'case-1',
            artifacts: [
                {
                    id: 'rep-1',
                    caseId: 'case-1',
                    topic: 'Quarterly Research Brief',
                    createdAt: Date.parse('2026-04-08T12:00:00.000Z'),
                    summary: 'Focus on supply chain',
                    agendas: [],
                    leads: [],
                    entities: [],
                    sources: [],
                    rawText: 'raw',
                },
            ],
            runs: [
                {
                    id: 'run-1',
                    workspaceId: 'case-1',
                    topic: 'Quarterly Research Brief',
                    status: 'COMPLETED',
                    startTime: Date.parse('2026-04-08T10:00:00.000Z'),
                    endTime: Date.parse('2026-04-08T11:00:00.000Z'),
                },
            ],
            signals: [
                {
                    id: 'sig-1',
                    caseId: 'case-1',
                    content: 'Legacy signal',
                    source: 'Archive',
                    timestamp: '2026-01-01T00:00:00.000Z',
                    type: 'NEWS',
                    status: 'PENDING',
                    threatLevel: 'INFO',
                },
            ],
            chatSessions: [],
            chatActionsBySessionId: {},
        });

        const query: TimelineQueryState = {
            workspaceId: 'case-1',
            search: 'quarterly',
            filters: {
                range: '7D',
                tracks: ['ARTIFACT', 'RUN'],
            },
            focusedTrack: 'ALL',
        };

        const filtered = filterTimelineEvents(events, query);
        expect(filtered.every((event) => event.track !== 'SIGNAL')).toBe(true);
        expect(filtered.every((event) => event.title.toLowerCase().includes('quarterly'))).toBe(true);

        vi.useRealTimers();
    });

    it('uses explicit lineage ids when present and lets related events survive focused filtering', () => {
        const events = buildWorkspaceTimelineEvents({
            workspaceId: 'case-1',
            artifacts: [
                {
                    id: 'rep-1',
                    caseId: 'case-1',
                    topic: 'Parent Artifact',
                    createdAt: 50,
                    summary: 'Parent',
                    agendas: [],
                    leads: [],
                    entities: [],
                    sources: [],
                    rawText: 'raw',
                },
                {
                    id: 'rep-2',
                    caseId: 'case-1',
                    topic: 'Child Artifact',
                    createdAt: 300,
                    summary: 'Child',
                    agendas: [],
                    leads: [],
                    entities: [],
                    sources: [],
                    rawText: 'raw',
                    config: {
                        parentArtifactId: 'rep-1',
                        sourceSignalId: 'sig-1',
                        sourceRunId: 'run-1',
                    },
                },
            ],
            runs: [
                {
                    id: 'run-1',
                    workspaceId: 'case-1',
                    topic: 'Child Artifact',
                    status: 'COMPLETED',
                    startTime: 100,
                    endTime: 200,
                    config: {
                        parentArtifactId: 'rep-1',
                        sourceSignalId: 'sig-1',
                        producedArtifactId: 'rep-2',
                    },
                },
            ],
            signals: [
                {
                    id: 'sig-1',
                    caseId: 'case-1',
                    content: 'Trigger signal',
                    source: 'Reuters',
                    timestamp: '2026-04-01T10:00:00.000Z',
                    type: 'NEWS',
                    status: 'PENDING',
                    threatLevel: 'CAUTION',
                    linkedReportId: 'rep-2',
                },
            ],
            chatSessions: [],
            chatActionsBySessionId: {},
        });

        const artifactEvent = events.find((event) => event.refId === 'rep-2');
        const runCompletedEvent = events.find((event) => event.id === 'run-complete-run-1');

        expect(artifactEvent?.parentRefId).toBe('rep-1');
        expect(runCompletedEvent?.metadata?.relatedArtifactId).toBe('rep-2');

        const focused = filterTimelineEvents(events, {
            workspaceId: 'case-1',
            search: '',
            filters: {
                range: 'ALL',
                tracks: ['SIGNAL', 'RUN', 'ARTIFACT'],
            },
            focusedTrack: 'ALL',
            focusedRefId: 'sig-1',
        });

        expect(focused.map((event) => event.refId)).toContain('sig-1');
        expect(focused.map((event) => event.refId)).toContain('run-1');
        expect(focused.map((event) => event.refId)).toContain('rep-2');
    });

    it('prefers explicit source run lineage over topic matching when linking runs to artifacts', () => {
        const events = buildWorkspaceTimelineEvents({
            workspaceId: 'case-1',
            artifacts: [
                {
                    id: 'rep-1',
                    caseId: 'case-1',
                    topic: 'Atlas Follow-up Brief',
                    createdAt: 300,
                    summary: 'Child artifact',
                    agendas: [],
                    leads: [],
                    entities: [],
                    sources: [],
                    rawText: 'raw',
                    config: {
                        sourceRunId: 'run-1',
                    },
                },
            ],
            runs: [
                {
                    id: 'run-1',
                    workspaceId: 'case-1',
                    topic: 'Run title without a matching artifact topic',
                    status: 'COMPLETED',
                    startTime: 100,
                    endTime: 200,
                },
            ],
            signals: [],
            chatSessions: [],
            chatActionsBySessionId: {},
        });

        expect(events.find((event) => event.id === 'run-complete-run-1')?.metadata?.relatedArtifactId).toBe('rep-1');
    });

    it('adds entity milestone chronology for first-seen, reappearance, and mention thresholds', () => {
        const events = buildWorkspaceTimelineEvents({
            workspaceId: 'case-1',
            artifacts: [
                {
                    id: 'rep-1',
                    caseId: 'case-1',
                    topic: 'Atlas Initial Brief',
                    createdAt: Date.parse('2026-01-01T00:00:00.000Z'),
                    summary: 'First artifact',
                    agendas: [],
                    leads: [],
                    entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
                    sources: [],
                    rawText: 'raw',
                    artifactType: 'BRIEF',
                },
                {
                    id: 'rep-2',
                    caseId: 'case-1',
                    topic: 'Atlas Update',
                    createdAt: Date.parse('2026-01-05T00:00:00.000Z'),
                    summary: 'Second artifact',
                    agendas: [],
                    leads: [],
                    entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
                    sources: [],
                    rawText: 'raw',
                    artifactType: 'DIGEST',
                },
                {
                    id: 'rep-3',
                    caseId: 'case-1',
                    topic: 'Atlas Returns',
                    createdAt: Date.parse('2026-01-20T00:00:00.000Z'),
                    summary: 'Third artifact',
                    agendas: [],
                    leads: [],
                    entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
                    sources: [],
                    rawText: 'raw',
                    artifactType: 'REPORT',
                },
            ],
            runs: [],
            signals: [],
            chatSessions: [],
            chatActionsBySessionId: {},
        });

        const entityEvents = events.filter((event) => event.track === 'ENTITY');

        expect(entityEvents.map((event) => event.type)).toEqual([
            'ENTITY_REAPPEARED',
            'ENTITY_MENTION_THRESHOLD',
            'ENTITY_FIRST_SEEN',
        ]);
        expect(entityEvents[0]?.metadata?.previousArtifactId).toBe('rep-2');
        expect(entityEvents[1]?.metadata?.threshold).toBe(3);
        expect(entityEvents[2]?.refKind).toBe('ENTITY');

        const focused = filterTimelineEvents(events, {
            workspaceId: 'case-1',
            search: '',
            filters: {
                range: 'ALL',
                tracks: ['ENTITY'],
            },
            focusedTrack: 'ENTITY',
            focusedRefId: 'Atlas Holdings',
        });

        expect(focused.map((event) => event.type)).toEqual([
            'ENTITY_REAPPEARED',
            'ENTITY_MENTION_THRESHOLD',
            'ENTITY_FIRST_SEEN',
        ]);
    });

    it('adds opt-in chat session and action events with session lineage', () => {
        const events = buildWorkspaceTimelineEvents({
            workspaceId: 'case-1',
            artifacts: [
                {
                    id: 'rep-1',
                    caseId: 'case-1',
                    topic: 'Atlas Chat Brief',
                    createdAt: 400,
                    summary: 'Saved from chat',
                    agendas: [],
                    leads: [],
                    entities: [],
                    sources: [],
                    rawText: 'raw',
                    artifactType: 'BRIEF',
                },
            ],
            runs: [],
            signals: [
                {
                    id: 'sig-1',
                    caseId: 'case-1',
                    content: 'Atlas signal',
                    source: 'Desk',
                    timestamp: '2026-04-01T00:00:00.000Z',
                    type: 'NEWS',
                    status: 'PENDING',
                    threatLevel: 'INFO',
                },
            ],
            chatSessions: [
                {
                    id: 'chat-1',
                    workspaceId: 'case-1',
                    title: 'Atlas Workspace Chat',
                    status: 'ACTIVE',
                    sourceReportId: 'rep-1',
                    metadata: {
                        launchContext: {
                            headlineId: 'sig-1',
                            sourceReportId: 'rep-1',
                        },
                    },
                    createdAt: 100,
                    updatedAt: 500,
                },
            ],
            chatActionsBySessionId: {
                'chat-1': [
                    {
                        id: 'act-search',
                        sessionId: 'chat-1',
                        type: 'SEARCH_WORKSPACE',
                        status: 'COMPLETED',
                        input: {
                            query: 'atlas exposure',
                        },
                        result: {
                            citedSnippetIds: ['snippet-1', 'snippet-2'],
                        },
                        createdAt: 200,
                        updatedAt: 200,
                    },
                    {
                        id: 'act-save',
                        sessionId: 'chat-1',
                        type: 'CREATE_ARTIFACT_DRAFT',
                        status: 'COMPLETED',
                        result: {
                            artifactId: 'rep-1',
                        },
                        createdAt: 300,
                        updatedAt: 300,
                    },
                ],
            },
        });

        expect(events.map((event) => event.type)).toEqual([
            'SIGNAL_SAVED',
            'ARTIFACT_CREATED',
            'CHAT_ARTIFACT_SAVED',
            'CHAT_SEARCHED_WORKSPACE',
            'CHAT_SESSION_STARTED',
        ]);

        const sessionEvent = events.find((event) => event.type === 'CHAT_SESSION_STARTED');
        const saveEvent = events.find((event) => event.type === 'CHAT_ARTIFACT_SAVED');

        expect(sessionEvent?.refKind).toBe('CHAT_SESSION');
        expect(sessionEvent?.metadata?.sourceSignalId).toBe('sig-1');
        expect(saveEvent?.parentRefId).toBe('chat-1');
        expect(saveEvent?.metadata?.relatedArtifactId).toBe('rep-1');

        const focused = filterTimelineEvents(events, {
            workspaceId: 'case-1',
            search: '',
            filters: {
                range: 'ALL',
                tracks: ['CHAT'],
            },
            focusedTrack: 'CHAT',
            focusedRefId: 'chat-1',
        });

        expect(focused.map((event) => event.type)).toEqual([
            'CHAT_ARTIFACT_SAVED',
            'CHAT_SEARCHED_WORKSPACE',
            'CHAT_SESSION_STARTED',
        ]);
    });
});
