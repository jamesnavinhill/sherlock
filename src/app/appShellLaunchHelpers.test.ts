import { describe, expect, it } from 'vitest';

import {
  buildLaunchRunConfig,
  buildWorkspaceRun,
  mergeArchivedReportRunConfig,
  mergePreseededEntities,
} from './appShellLaunchHelpers';

describe('appShellLaunchHelpers', () => {
  it('builds run config snapshots from resolved launch fields', () => {
    const runConfig = buildLaunchRunConfig({
      artifactType: 'BRIEF',
      effectiveConfig: {
        provider: 'OPENAI',
        modelId: 'gpt-test',
        persona: 'general-investigator',
        searchDepth: 'DEEP',
        thinkingBudget: 2048,
      },
      effectivePack: { id: 'corporate-intelligence', name: 'Corporate Intelligence' },
      effectivePurpose: { id: 'deep-dive', name: 'Deep Dive' },
      effectiveScope: { id: 'scope-1', name: 'Counterparty Risk' } as never,
      labelProfileId: 'workspace',
      launchRequest: {
        topic: 'Atlas',
        launchSource: 'FULL_SPECTRUM',
        sourceSignalId: 'sig-1',
      },
    });

    expect(runConfig).toEqual(
      expect.objectContaining({
        provider: 'OPENAI',
        modelId: 'gpt-test',
        packId: 'corporate-intelligence',
        purposeId: 'deep-dive',
        scopeId: 'scope-1',
        sourceSignalId: 'sig-1',
      })
    );
  });

  it('creates workspace run envelopes and merges source run ids onto archived reports', () => {
    const runConfig = {
      provider: 'OPENAI',
      modelId: 'gpt-test',
      persona: 'general-investigator',
      searchDepth: 'STANDARD',
      thinkingBudget: 1024,
    } as const;

    const run = buildWorkspaceRun({
      launchRequest: { topic: 'Atlas' },
      runConfig,
      runId: 'task-1',
      timestamp: 100,
    });

    expect(run).toEqual(
      expect.objectContaining({
        id: 'task-1',
        topic: 'Atlas',
        status: 'RUNNING',
        startTime: 100,
      })
    );

    const archived = mergeArchivedReportRunConfig(
      {
        id: 'artifact-1',
        topic: 'Atlas Report',
        summary: 'Summary',
        agendas: [],
        leads: [],
        entities: [],
        sources: [],
        rawText: 'raw',
      },
      runConfig,
      'task-1'
    );

    expect(archived.config).toEqual(
      expect.objectContaining({
        modelId: 'gpt-test',
        sourceRunId: 'task-1',
      })
    );
  });

  it('appends preseeded entities with deterministic ids and no duplicates', () => {
    const firstPass = mergePreseededEntities({
      existingNodes: [],
      preseededEntities: [
        {
          id: 'placeholder',
          label: 'Atlas Holdings',
          type: 'ENTITY',
          subtype: 'UNKNOWN',
          timestamp: 1,
        },
      ],
      runId: 'task-2',
      timestamp: 10,
    });

    expect(firstPass).toHaveLength(1);
    expect(firstPass[0]).toEqual(
      expect.objectContaining({
        id: 'seed-task-2-0',
        timestamp: 10,
      })
    );

    const secondPass = mergePreseededEntities({
      existingNodes: firstPass,
      preseededEntities: [
        {
          id: 'placeholder',
          label: 'Atlas Holdings',
          type: 'ENTITY',
          subtype: 'UNKNOWN',
          timestamp: 1,
        },
      ],
      runId: 'task-2',
      timestamp: 20,
    });

    expect(secondPass).toHaveLength(1);
  });
});
