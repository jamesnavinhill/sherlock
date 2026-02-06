import type { FeedItem, InvestigationReport, MonitorEvent, Source } from '../../../types';
import { toDisplayText } from './jsonParsing';

const URL_PATTERN = /https?:\/\/[^\s<>"'`)\]}]+/gi;

export const sanitizeUrl = (value: string): string | null => {
    const cleaned = value.trim().replace(/[),.;\]}]+$/, '');
    try {
        const parsed = new URL(cleaned);
        if (!parsed.hostname) return null;
        parsed.hash = '';
        return parsed.toString();
    } catch {
        return null;
    }
};

export const normalizeSource = (source: { title?: unknown; url?: unknown; uri?: unknown }): Source | null => {
    const rawUrl =
        typeof source.url === 'string'
            ? source.url
            : typeof source.uri === 'string'
              ? source.uri
              : '';

    const url = sanitizeUrl(rawUrl);
    if (!url) return null;

    const title =
        typeof source.title === 'string' && source.title.trim().length > 0
            ? source.title.trim()
            : 'Untitled Source';

    return { title, url };
};

export const dedupeSources = (
    sources: Array<{ title?: unknown; url?: unknown; uri?: unknown }>
): Source[] => {
    const unique = new Map<string, Source>();

    sources.forEach((source) => {
        const normalized = normalizeSource(source);
        if (!normalized) return;
        const key = normalized.url.toLowerCase();
        if (!unique.has(key)) unique.set(key, normalized);
    });

    return Array.from(unique.values());
};

export const extractSourcesFromGrounding = (response: unknown): Source[] => {
    const result: Source[] = [];
    const candidates =
        (response as {
            candidates?: Array<{
                groundingMetadata?: {
                    groundingChunks?: Array<{ web?: { title?: string; uri?: string } }>;
                };
            }>;
        }).candidates || [];

    candidates.forEach((candidate) => {
        const chunks = candidate.groundingMetadata?.groundingChunks || [];
        chunks.forEach((chunk) => {
            const normalized = normalizeSource(chunk.web || {});
            if (normalized) result.push(normalized);
        });
    });

    return dedupeSources(result);
};

export const extractSourcesFromText = (text: string): Source[] => {
    const matches = text.match(URL_PATTERN) || [];
    return dedupeSources(matches.map((url) => ({ title: 'Referenced Source', url })));
};

export const normalizeStringList = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => toDisplayText(item).trim())
        .filter((item) => item.length > 0);
};

export const normalizeEntities = (value: unknown): InvestigationReport['entities'] => {
    if (!Array.isArray(value)) return [];

    return value
        .map((entry) => {
            if (typeof entry === 'string') {
                return { name: entry, type: 'UNKNOWN' as const };
            }

            if (!entry || typeof entry !== 'object') return null;

            const record = entry as Record<string, unknown>;
            const name = toDisplayText(record.name).trim();
            if (!name) return null;

            const rawType = toDisplayText(record.type).toUpperCase();
            const type =
                rawType === 'PERSON' || rawType === 'ORGANIZATION' || rawType === 'UNKNOWN'
                    ? (rawType as 'PERSON' | 'ORGANIZATION' | 'UNKNOWN')
                    : 'UNKNOWN';

            const role = toDisplayText(record.role).trim() || undefined;
            const rawSentiment = toDisplayText(record.sentiment).toUpperCase();
            const sentiment =
                rawSentiment === 'POSITIVE' || rawSentiment === 'NEGATIVE' || rawSentiment === 'NEUTRAL'
                    ? (rawSentiment as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL')
                    : undefined;

            return { name, type, role, sentiment };
        })
        .filter((entity): entity is NonNullable<typeof entity> => !!entity);
};

export const normalizeFeedItems = (
    value: unknown,
    fallbackCategory: string,
    now: string,
    idPrefix: string
): FeedItem[] => {
    if (!Array.isArray(value)) return [];

    return value.map((item, index) => {
        const record = item as Record<string, unknown>;
        const riskLevel =
            record?.riskLevel === 'LOW' || record?.riskLevel === 'MEDIUM' || record?.riskLevel === 'HIGH'
                ? record.riskLevel
                : 'MEDIUM';

        return {
            id: typeof record?.id === 'string' ? record.id : `${idPrefix}-${Date.now()}-${index}`,
            title: typeof record?.title === 'string' ? record.title : 'Untitled signal',
            category: typeof record?.category === 'string' ? record.category : fallbackCategory,
            riskLevel,
            timestamp: typeof record?.timestamp === 'string' ? record.timestamp : now,
        };
    });
};

export const normalizeLiveEvents = (value: unknown, idPrefix: string): MonitorEvent[] => {
    if (!Array.isArray(value)) return [];

    return value.map((item, index) => {
        const record = item as Record<string, unknown>;
        const type =
            record?.type === 'SOCIAL' || record?.type === 'NEWS' || record?.type === 'OFFICIAL'
                ? record.type
                : 'NEWS';

        const sentiment =
            record?.sentiment === 'NEGATIVE' ||
            record?.sentiment === 'NEUTRAL' ||
            record?.sentiment === 'POSITIVE'
                ? record.sentiment
                : 'NEUTRAL';

        const threatLevel =
            record?.threatLevel === 'INFO' ||
            record?.threatLevel === 'CAUTION' ||
            record?.threatLevel === 'CRITICAL'
                ? record.threatLevel
                : 'INFO';

        return {
            id: typeof record?.id === 'string' ? record.id : `${idPrefix}-${Date.now()}-${index}`,
            type,
            sourceName: typeof record?.sourceName === 'string' ? record.sourceName : 'Unknown Source',
            content: typeof record?.content === 'string' ? record.content : '',
            timestamp: typeof record?.timestamp === 'string' ? record.timestamp : 'now',
            sentiment,
            threatLevel,
            url: typeof record?.url === 'string' ? record.url : undefined,
        };
    });
};
