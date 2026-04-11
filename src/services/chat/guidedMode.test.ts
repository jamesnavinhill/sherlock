import { describe, expect, it } from 'vitest';
import {
  buildGuidedReviewMarkdown,
  buildLaunchRequestFromGuidedDraft,
  createDefaultGuidedSessionState,
  getGuidedAssistantPrompt,
} from './guidedMode';

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
        modelId: 'gpt-5.4-mini',
        persona: 'general-investigator',
        searchDepth: 'DEEP',
        generationMode: 'STAGED',
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
      modelId: 'gpt-5.4-mini',
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

  it('uses the resolved workspace display title in guided prompts and review copy', () => {
    const workspace = {
      id: 'case-1',
      title: '[WORKSPACE]: Legacy Atlas',
      displayTitle: 'Atlas Workspace',
      status: 'ACTIVE',
      dateOpened: '2026-04-03',
    } as const;

    const prompt = getGuidedAssistantPrompt(
      {
        mode: 'GUIDED',
        step: 'PACK',
        draft: createDefaultGuidedSessionState(workspace).draft,
      },
      [],
      workspace
    );

    const review = buildGuidedReviewMarkdown(
      {
        ...createDefaultGuidedSessionState(workspace).draft,
        workspaceIntent: 'CURRENT',
        topic: 'Atlas procurement anomalies',
      },
      [],
      workspace
    );

    expect(prompt).toContain('Atlas Workspace');
    expect(prompt).not.toContain('[WORKSPACE]: Legacy Atlas');
    expect(review).toContain('Atlas Workspace');
    expect(review).not.toContain('[WORKSPACE]: Legacy Atlas');
  });
});
