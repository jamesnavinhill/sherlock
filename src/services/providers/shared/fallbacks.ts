import type { FeedItem, InvestigationScope, MonitorEvent } from '../../../types';

export const buildFallbackFeedItems = (
  scope: InvestigationScope,
  limit: number
): FeedItem[] => {
  const fallbackCategory = scope.categories[1] || 'General';

  return [
    {
      id: '1',
      title: `Notable development in ${fallbackCategory}`,
      category: fallbackCategory,
      timestamp: '10:42 AM',
      riskLevel: 'HIGH' as const,
    },
    {
      id: '2',
      title: 'Emerging pattern detected',
      category: scope.categories[2] || 'Analysis',
      timestamp: '09:15 AM',
      riskLevel: 'MEDIUM' as const,
    },
    {
      id: '3',
      title: 'New information surfaced',
      category: scope.categories[0] || 'General',
      timestamp: '08:30 AM',
      riskLevel: 'HIGH' as const,
    },
  ].slice(0, limit);
};

export const buildFallbackLiveEvents = (topic: string): MonitorEvent[] => {
  const now = Date.now();

  return [
    {
      id: `sim-${now}-1`,
      type: 'NEWS',
      sourceName: 'News Source',
      content: `New developments regarding ${topic}.`,
      timestamp: '5m ago',
      sentiment: 'NEGATIVE',
      threatLevel: 'CAUTION',
    },
    {
      id: `sim-${now}-2`,
      type: 'SOCIAL',
      sourceName: 'Social Media',
      content: `Discussion emerging about ${topic}.`,
      timestamp: '12m ago',
      sentiment: 'NEGATIVE',
      threatLevel: 'CRITICAL',
    },
    {
      id: `sim-${now}-3`,
      type: 'OFFICIAL',
      sourceName: 'Official Source',
      content: 'Related announcement published.',
      timestamp: '1h ago',
      sentiment: 'NEUTRAL',
      threatLevel: 'INFO',
    },
  ];
};
