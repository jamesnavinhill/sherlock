import { describe, expect, it } from 'vitest';

import type { Artifact, ChatSession, Signal } from '@/types';
import type { GuidedRunDraft } from '@/services/chat/guidedMode';

import {
  buildManualSetupSeed,
  getGuidedSessionState,
  getLaunchContextSummary,
  splitCollapsedFollowUpBlock,
} from './chatPageUtils';

describe('chatPageUtils', () => {
  it('splits collapsed follow-up blocks away from the primary assistant body', () => {
    const result = splitCollapsedFollowUpBlock(
      [
        'Executive summary paragraph.',
        '',
        'Supporting context.',
        '---',
        '[Priority] [RUN_ANGLE]: Investigate entity ownership',
        '',
        '[Secondary] [RUN_ANGLE]: Map related vendors',
      ].join('\n')
    );

    expect(result.primaryBody).toBe('Executive summary paragraph.\n\nSupporting context.');
    expect(result.collapsedBody).toContain('[Priority] [RUN_ANGLE]: Investigate entity ownership');
    expect(result.collapsedBody).toContain('[Secondary] [RUN_ANGLE]: Map related vendors');
  });

  it('summarizes pinned entity context from related artifacts', () => {
    const reports: Artifact[] = [
      {
        id: 'artifact-1',
        workspaceId: 'ws-1',
        topic: 'Atlas Procurement Review',
        summary: 'Summary',
        agendas: [],
        leads: [],
        entities: [{ name: 'Atlas Group', type: 'ORGANIZATION' }],
        sources: [],
        rawText: 'artifact body',
      },
      {
        id: 'artifact-2',
        workspaceId: 'ws-1',
        topic: 'Satellite Filing',
        summary: 'Summary',
        agendas: [],
        leads: [],
        entities: ['Atlas Group'] as unknown as Artifact['entities'],
        sources: [],
        rawText: 'artifact body',
      },
    ];

    expect(
      getLaunchContextSummary({
        launchContext: { entityName: 'atlas group' },
        reports,
        signals: [],
      })
    ).toEqual({
      label: 'Pinned Entity',
      title: 'atlas group',
      body: '2 saved artifact(s) mention this entity in the active workspace.',
    });
  });

  it('summarizes pinned signals from saved signal records', () => {
    const signals: Signal[] = [
      {
        id: 'signal-1',
        workspaceId: 'ws-1',
        content: 'Export restrictions expanded overnight.',
        source: 'Desk Wire',
        timestamp: '2026-04-05T00:00:00.000Z',
        type: 'NEWS',
        status: 'PENDING',
        threatLevel: 'CAUTION',
      },
    ];

    expect(
      getLaunchContextSummary({
        launchContext: { signalId: 'signal-1' },
        reports: [],
        signals,
      })
    ).toEqual({
      label: 'Pinned Signal',
      title: 'Desk Wire',
      body: 'Export restrictions expanded overnight.',
    });
  });

  it('extracts guided session metadata only when the stored payload matches the guided contract', () => {
    const guidedState = {
      mode: 'GUIDED' as const,
      step: 'CONFIG' as const,
      draft: {
        scopeId: 'scope-1',
        purposeId: 'purpose-1',
        artifactType: 'REPORT' as const,
        workspaceIntent: 'CURRENT' as const,
        topic: 'Atlas',
        angle: '',
        entities: [],
        prioritySources: '',
        provider: 'OPENAI' as const,
        modelId: 'gpt-test',
        persona: 'general-investigator',
        searchDepth: 'STANDARD' as const,
        generationMode: 'STAGED' as const,
        thinkingBudget: 16,
      },
    };

    const session: ChatSession = {
      id: 'session-1',
      workspaceId: 'ws-1',
      title: 'Guided Session',
      status: 'ACTIVE',
      metadata: { guidedState },
      createdAt: 1,
      updatedAt: 1,
    };

    expect(getGuidedSessionState(session)).toEqual(guidedState);
    expect(
      getGuidedSessionState({
        ...session,
        metadata: { guidedState: { mode: 'MANUAL' } },
      })
    ).toBeNull();
  });

  it('maps guided drafts into the manual setup seed shape', () => {
    const draft: GuidedRunDraft = {
      scopeId: 'scope-1',
      purposeId: 'purpose-1',
      artifactType: 'TIMELINE',
      workspaceIntent: 'CURRENT',
      topic: 'Track vendor changes',
      angle: 'Focus on procurement events',
      entities: [],
      prioritySources: 'Desk Wire',
      provider: 'OPENROUTER',
      modelId: 'openrouter/model',
      persona: 'general-investigator',
      searchDepth: 'DEEP',
      generationMode: 'STAGED',
      thinkingBudget: 32,
      dateRange: {
        start: '2026-01-01',
        end: '2026-03-31',
      },
    };

    expect(buildManualSetupSeed(draft)).toEqual({
      initialTopic: 'Track vendor changes',
      initialScopeId: 'scope-1',
      initialConfigOverride: {
        provider: 'OPENROUTER',
        modelId: 'openrouter/model',
        persona: 'general-investigator',
        searchDepth: 'DEEP',
        thinkingBudget: 32,
        purposeId: 'purpose-1',
        artifactType: 'TIMELINE',
      },
      initialDateRangeOverride: {
        start: '2026-01-01',
        end: '2026-03-31',
      },
    });
  });
});
