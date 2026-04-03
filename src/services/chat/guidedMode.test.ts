import { describe, expect, it } from 'vitest';
import { buildLaunchRequestFromGuidedDraft, createDefaultGuidedSessionState } from './guidedMode';

describe('guidedMode', () => {
    it('creates a workspace-aware default guided session state', () => {
        const state = createDefaultGuidedSessionState({
            id: 'case-1',
            scopeId: 'open-investigation',
            title: 'Atlas Workspace',
            status: 'ACTIVE',
            dateOpened: '2026-04-03',
            purposeId: 'latest-findings',
        });

        expect(state.mode).toBe('GUIDED');
        expect(state.step).toBe('PACK');
        expect(state.draft.scopeId).toBe('open-investigation');
        expect(state.draft.purposeId).toBe('latest-findings');
    });

    it('maps guided draft inputs into the existing launch request shape', () => {
        const request = buildLaunchRequestFromGuidedDraft(
            {
                scopeId: 'open-investigation',
                purposeId: 'deep-dive',
                artifactType: 'REPORT',
                workspaceIntent: 'CURRENT',
                topic: 'Atlas procurement anomalies',
                angle: 'Focus on unusual vendors and payment clusters.',
                entities: [
                    {
                        id: 'entity-1',
                        name: 'Atlas Holdings',
                        type: 'ORGANIZATION',
                    },
                ],
                prioritySources: 'sec.gov, usaspending.gov',
                provider: 'OPENAI',
                modelId: 'gpt-4.1-mini',
                persona: 'general-investigator',
                searchDepth: 'DEEP',
                thinkingBudget: 1024,
                dateRange: {
                    start: '2025-01-01',
                    end: '2025-12-31',
                },
            },
            [],
            {
                id: 'case-1',
                scopeId: 'open-investigation',
                title: 'Atlas Workspace',
                status: 'ACTIVE',
                dateOpened: '2026-04-03',
                description: 'Existing workspace summary',
            }
        );

        expect(request.parentContext?.topic).toBe('Atlas Workspace');
        expect(request.topic).toContain('[RUN_ANGLE]: Focus on unusual vendors and payment clusters.');
        expect(request.topic).toContain('[PRIORITY_SOURCES]: sec.gov, usaspending.gov');
        expect(request.configOverride).toMatchObject({
            provider: 'OPENAI',
            modelId: 'gpt-4.1-mini',
            searchDepth: 'DEEP',
            artifactType: 'REPORT',
        });
        expect(request.preseededEntities?.[0]).toMatchObject({
            label: 'Atlas Holdings',
            subtype: 'ORGANIZATION',
        });
        expect(request.dateRangeOverride).toEqual({
            start: '2025-01-01',
            end: '2025-12-31',
        });
        expect(request.launchSource).toBe('CHAT_GUIDED_RUN');
    });
});
