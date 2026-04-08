import { describe, expect, it } from 'vitest';
import { ProviderError } from './errors';
import {
  normalizeLiveIntelPayload,
  normalizeScanResultPayload,
  withSimulatedProviderFallback,
} from './situationalIntel';

describe('situational intel helpers', () => {
  it('normalizes scan payloads against scope defaults', () => {
    const items = normalizeScanResultPayload(
      [{ title: 'Flagged vendor', riskLevel: 'HIGH' }],
      {
        id: 'open-investigation',
        name: 'Open Investigation',
        description: 'Scope',
        domainContext: 'General',
        investigationObjective: 'Investigate',
        categories: ['Finance', 'Procurement'],
        personas: [],
        suggestedSources: [],
      }
    );

    expect(items).toEqual([
      expect.objectContaining({
        title: 'Flagged vendor',
        category: 'Finance',
        riskLevel: 'HIGH',
      }),
    ]);
  });

  it('normalizes live intel payloads to stable event contracts', () => {
    const events = normalizeLiveIntelPayload([
      {
        source: 'Desk',
        description: 'Wrapped event',
        severity: 'CRITICAL',
      },
    ]);

    expect(events).toEqual([
      expect.objectContaining({
        sourceName: 'Desk',
        content: 'Wrapped event',
        threatLevel: 'CRITICAL',
      }),
    ]);
  });

  it('rethrows missing api key errors and falls back on other provider failures', async () => {
    await expect(
      withSimulatedProviderFallback(
        async () => {
          throw new ProviderError({
            code: 'MISSING_API_KEY',
            provider: 'OPENAI',
            operation: 'SCAN_ANOMALIES',
            message: 'MISSING_API_KEY',
          });
        },
        () => ['fallback']
      )
    ).rejects.toThrow('MISSING_API_KEY');

    await expect(
      withSimulatedProviderFallback(
        async () => {
          throw new ProviderError({
            code: 'UPSTREAM_ERROR',
            provider: 'OPENAI',
            operation: 'SCAN_ANOMALIES',
            message: 'upstream failed',
          });
        },
        () => ['fallback']
      )
    ).resolves.toEqual(['fallback']);
  });
});
