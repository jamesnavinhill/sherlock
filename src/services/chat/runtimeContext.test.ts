import { describe, expect, it } from 'vitest';
import type { InvestigationScope, WorkspaceContextBundle } from '@/types';
import {
  buildWorkspaceChatRouterRequest,
  resolveGuidedRuntimeProfile,
  resolveWorkspaceChatRunProfile,
} from './runtimeContext';

describe('chat runtime context', () => {
  it('prefers session pack and purpose overrides for workspace chat profiles', () => {
    const profile = resolveWorkspaceChatRunProfile(
      {
        packId: 'corporate-due-diligence',
        purposeId: 'monitor',
      },
      {
        scopeId: 'open-investigation',
        packId: 'open-investigation',
        purposeId: 'deep-dive',
        labelProfileId: 'research',
      }
    );

    expect(profile.scope.id).toBe('open-investigation');
    expect(profile.pack.id).toBe('corporate-due-diligence');
    expect(profile.purpose.id).toBe('monitor');
    expect(profile.labelProfile.id).toBe('research');
  });

  it('resolves guided runtime profiles against custom scopes', () => {
    const customScope: InvestigationScope = {
      id: 'vendor-watch',
      name: 'Vendor Watch',
      description: 'Track vendor risk',
      domainContext: 'Supply chain and contracting',
      investigationObjective: 'Watch vendors',
      categories: ['Vendors'],
      personas: [
        {
          id: 'watcher',
          label: 'Watcher',
          instruction: 'Watch vendors carefully.',
        },
      ],
      suggestedSources: [],
      labelProfileId: 'monitoring',
      supportedPurposeIds: ['monitor'],
      defaultPurposeId: 'monitor',
      defaultArtifactType: 'MONITOR_SNAPSHOT',
    };

    const profile = resolveGuidedRuntimeProfile(
      {
        scopeId: 'vendor-watch',
      },
      [customScope]
    );

    expect(profile.scope.id).toBe('vendor-watch');
    expect(profile.pack.id).toBe('vendor-watch');
    expect(profile.purpose.id).toBe('monitor');
    expect(profile.labelProfile.id).toBe('monitoring');
    expect(profile.setupCopy.executeLabel).toBe('Start Monitor');
  });

  it('builds provider-router requests from workspace chat context bundles', () => {
    const contextBundle: WorkspaceContextBundle = {
      workspace: {
        id: 'case-1',
        title: 'Atlas Workspace',
        status: 'ACTIVE',
        dateOpened: '2026-04-08',
        scopeId: 'open-investigation',
        packId: 'open-investigation',
        purposeId: 'deep-dive',
      },
      summary: 'Workspace summary',
      recentArtifacts: [
        {
          id: 'rep-1',
          topic: 'Atlas Summary',
          summary: 'Saved report summary',
          dateStr: '2026-04-07',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: '{}',
        },
      ],
      recentSignals: [
        {
          id: 'sig-1',
          workspaceId: 'case-1',
          content: 'Signal content',
          source: 'Registry',
          timestamp: '5m ago',
          type: 'NEWS',
          status: 'PENDING',
          threatLevel: 'INFO',
        },
      ],
      snippets: [],
    };

    const request = buildWorkspaceChatRouterRequest({
      session: {
        provider: 'OPENAI',
        modelId: 'gpt-5.4-mini',
        packId: 'corporate-due-diligence',
        purposeId: 'latest-findings',
      },
      contextBundle,
      messages: [{ role: 'user', content: 'What changed?' }],
      mentionedContext: [],
      retrievedContext: [],
    });

    expect(request.configOverride).toEqual({
      provider: 'OPENAI',
      modelId: 'gpt-5.4-mini',
    });
    expect(request.packId).toBe('corporate-due-diligence');
    expect(request.purposeId).toBe('latest-findings');
    expect(request.recentSignals).toEqual([
      expect.objectContaining({
        content: 'Signal content',
        sourceName: 'Registry',
      }),
    ]);
    expect(request.recentArtifacts).toEqual([
      expect.objectContaining({
        id: 'rep-1',
        topic: 'Atlas Summary',
      }),
    ]);
  });
});
