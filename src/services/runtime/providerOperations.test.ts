import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvestigationScope, SystemConfig } from '../../types';
import {
  generateAudioBriefingWithProviderRouter,
  getLiveIntelWithProviderRouter,
  investigateWithProviderRouter,
  scanAnomaliesWithProviderRouter,
} from '../providers';
import {
  generateAudioBriefing,
  getLiveWorkspaceIntel,
  runWorkspaceInvestigation,
  scanForDiscoveries,
} from './providerOperations';

vi.mock('../providers', () => ({
  generateAudioBriefingWithProviderRouter: vi.fn(),
  getLiveIntelWithProviderRouter: vi.fn(),
  investigateWithProviderRouter: vi.fn(),
  scanAnomaliesWithProviderRouter: vi.fn(),
}));

describe('runtime provider operations', () => {
  const scope = { id: 'open-investigation' } as InvestigationScope;
  const configOverride = {
    provider: 'OPENAI',
    modelId: 'gpt-4.1-mini',
  } as Partial<SystemConfig>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateAudioBriefingWithProviderRouter).mockResolvedValue('audio-data');
    vi.mocked(getLiveIntelWithProviderRouter).mockResolvedValue([]);
    vi.mocked(investigateWithProviderRouter).mockResolvedValue({ id: 'artifact-1' } as never);
    vi.mocked(scanAnomaliesWithProviderRouter).mockResolvedValue([]);
  });

  it('uses the shared default monitor config when no live config is provided', async () => {
    await getLiveWorkspaceIntel('Atlas');

    expect(getLiveIntelWithProviderRouter).toHaveBeenCalledWith({
      topic: 'Atlas',
      monitorConfig: {
        socialCount: 2,
        newsCount: 2,
        officialCount: 2,
        prioritySources: '',
      },
      existingContent: [],
      scope: undefined,
      packId: undefined,
      purposeId: undefined,
    });
  });

  it('passes pack and purpose overrides through investigation launches', async () => {
    await runWorkspaceInvestigation(
      'Atlas',
      { topic: 'Parent', summary: 'Context' },
      configOverride,
      scope,
      { start: '2026-04-01', end: '2026-04-08' },
      {
        packId: 'threat-intel',
        purposeId: 'deep-dive',
        artifactType: 'REPORT',
        labelProfileId: 'intel',
      }
    );

    expect(investigateWithProviderRouter).toHaveBeenCalledWith({
      topic: 'Atlas',
      parentContext: { topic: 'Parent', summary: 'Context' },
      configOverride,
      scope,
      packId: 'threat-intel',
      purposeId: 'deep-dive',
      artifactType: 'REPORT',
      labelProfileId: 'intel',
      dateOverride: { start: '2026-04-01', end: '2026-04-08' },
    });
  });

  it('forwards discovery and audio requests to the shared router boundary', async () => {
    await scanForDiscoveries(
      'EMEA',
      'Cyber',
      { start: '2026-04-01', end: '2026-04-08' },
      { limit: 4, prioritySources: 'cert.europa.eu' },
      scope,
      { packId: 'threat-intel', purposeId: 'watch' }
    );
    await generateAudioBriefing('briefing body');

    expect(scanAnomaliesWithProviderRouter).toHaveBeenCalledWith({
      region: 'EMEA',
      category: 'Cyber',
      dateRange: { start: '2026-04-01', end: '2026-04-08' },
      options: { limit: 4, prioritySources: 'cert.europa.eu' },
      scope,
      packId: 'threat-intel',
      purposeId: 'watch',
    });
    expect(generateAudioBriefingWithProviderRouter).toHaveBeenCalledWith({
      text: 'briefing body',
    });
  });
});
