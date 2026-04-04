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
});
