import type { FeedItem, InvestigationScope, MonitorEvent } from '../../../types';
import { ProviderError } from './errors';
import { normalizeFeedItems, normalizeLiveEvents } from './normalizers';

const getCurrentTimeLabel = (): string =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const normalizeScanResultPayload = (
  value: unknown,
  scope: InvestigationScope
): FeedItem[] => {
  return normalizeFeedItems(value, scope.categories[0] || 'General', getCurrentTimeLabel(), 'feed');
};

export const normalizeLiveIntelPayload = (value: unknown): MonitorEvent[] => {
  return normalizeLiveEvents(value, 'sim');
};

export const withSimulatedProviderFallback = async <T>(
  run: () => Promise<T>,
  buildFallback: () => T
): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ProviderError && error.code === 'MISSING_API_KEY') {
      throw error;
    }

    return buildFallback();
  }
};
