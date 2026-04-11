import { describe, expect, it } from 'vitest';

import type { WorkspaceTemplate, InvestigationScope } from '@/types';

import {
  buildLaunchRequestFromTemplate,
  buildTemplateRuntimeConfig,
  resolveRuntimeLaunchFields,
} from './runtimeConfigMapping';

const customScope: InvestigationScope = {
  id: 'custom-policy',
  name: 'Policy Watch',
  description: 'Track policy developments.',
  domainContext: 'Policy tracking domain',
  investigationObjective: 'Summarize recent policy movement',
  categories: ['policy'],
  suggestedSources: [],
  personas: [
    {
      id: 'policy-analyst',
      label: 'Policy Analyst',
      instruction: 'Focus on regulatory changes.',
    },
  ],
  defaultPersona: 'policy-analyst',
  supportedPurposeIds: ['monitor', 'synthesis'],
  defaultPurposeId: 'monitor',
  defaultArtifactType: 'MONITOR_SNAPSHOT',
  labelProfileId: 'monitoring',
};

describe('runtimeConfigMapping', () => {
  it('resolves provider-model alignment and pack defaults from shared launch fields', () => {
    const resolved = resolveRuntimeLaunchFields({
      baseConfig: {
        provider: 'GEMINI',
        modelId: 'gemini-3-flash-preview',
        persona: 'general-investigator',
        thinkingBudget: 2048,
        searchDepth: 'STANDARD',
      },
      configOverride: {
        modelId: 'gpt-5.4-mini',
      },
      customScopes: [customScope],
      scopeId: customScope.id,
    });

    expect(resolved.effectiveConfig.provider).toBe('OPENAI');
    expect(resolved.effectiveConfig.modelId).toBe('gpt-5.4-mini');
    expect(resolved.scope?.id).toBe(customScope.id);
    expect(resolved.pack.id).toBe(customScope.id);
    expect(resolved.purpose.id).toBe('monitor');
    expect(resolved.artifactType).toBe('MONITOR_SNAPSHOT');
    expect(resolved.labelProfileId).toBe('monitoring');
  });

  it('builds template config with shared artifact and label inheritance', () => {
    const config = buildTemplateRuntimeConfig({
      baseConfig: {
        provider: 'GEMINI',
        modelId: 'gemini-3-flash-preview',
        persona: 'general-investigator',
        thinkingBudget: 1024,
        searchDepth: 'STANDARD',
      },
      configOverride: {
        modelId: 'openrouter/free',
        purposeId: 'synthesis',
      },
      customScopes: [customScope],
      scopeId: customScope.id,
    });

    expect(config.provider).toBe('OPENROUTER');
    expect(config.modelId).toBe('openrouter/free');
    expect(config.packId).toBe(customScope.id);
    expect(config.purposeId).toBe('synthesis');
    expect(config.artifactType).toBe('SYNTHESIS');
    expect(config.labelProfileId).toBe('monitoring');
  });

  it('builds template launch requests with the normalized runtime config seam', () => {
    const template: WorkspaceTemplate = {
      id: 'tpl-1',
      name: 'Policy Monitor',
      topic: 'Track SEC enforcement changes',
      createdAt: 1,
      scopeId: customScope.id,
      config: {
        modelId: 'gpt-5.4-mini',
        searchDepth: 'DEEP',
      },
    };

    const request = buildLaunchRequestFromTemplate({
      customScopes: [customScope],
      fallbackConfig: {
        provider: 'GEMINI',
        modelId: 'gemini-3-flash-preview',
        persona: 'general-investigator',
        thinkingBudget: 0,
        searchDepth: 'STANDARD',
      },
      template,
    });

    expect(request.topic).toBe(template.topic);
    expect(request.scope?.id).toBe(customScope.id);
    expect(request.packId).toBe(customScope.id);
    expect(request.purposeId).toBe('monitor');
    expect(request.artifactType).toBe('MONITOR_SNAPSHOT');
    expect(request.labelProfileId).toBe('monitoring');
    expect(request.configOverride).toMatchObject({
      provider: 'OPENAI',
      modelId: 'gpt-5.4-mini',
      searchDepth: 'DEEP',
    });
  });
});
