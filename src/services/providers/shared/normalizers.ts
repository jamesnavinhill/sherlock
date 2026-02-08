import type { FeedItem, InvestigationReport, MonitorEvent, Source } from '../../../types';
import { toDisplayText } from './jsonParsing';
import {
    getCaseInsensitiveField,
    normalizeHumanText,
    unwrapArrayContainer,
} from '../../../utils/textNormalization';

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
    const list = unwrapArrayContainer(value, ['leads', 'agendas', 'items', 'results', 'data', 'list']);
    const items =
        list.length > 0
            ? list
            : value && typeof value === 'object' && !Array.isArray(value)
              ? [value]
              : [];

    return items
        .map((item) => normalizeHumanText(item).trim())
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
    const list = unwrapArrayContainer(value, ['items', 'results', 'data', 'signals', 'feed']);
    const items =
        list.length > 0
            ? list
            : value && typeof value === 'object' && !Array.isArray(value)
              ? [value]
              : [];

    return items.map((item, index) => {
        const record = item as Record<string, unknown>;
        const rawRiskLevel = normalizeHumanText(getCaseInsensitiveField(record, 'riskLevel')).toUpperCase();
        const riskLevel = rawRiskLevel === 'LOW' || rawRiskLevel === 'MEDIUM' || rawRiskLevel === 'HIGH'
            ? rawRiskLevel
            : 'MEDIUM';

        return {
            id: normalizeHumanText(getCaseInsensitiveField(record, 'id'))
                || `${idPrefix}-${Date.now()}-${index}`,
            title: normalizeHumanText(
                getCaseInsensitiveField(record, 'title')
                ?? getCaseInsensitiveField(record, 'headline')
                ?? getCaseInsensitiveField(record, 'name'),
                { includePriority: false, fallback: 'Untitled signal' }
            ),
            category: normalizeHumanText(getCaseInsensitiveField(record, 'category'), {
                includePriority: false,
                fallback: fallbackCategory,
            }),
            riskLevel,
            timestamp: normalizeHumanText(
                getCaseInsensitiveField(record, 'timestamp')
                ?? getCaseInsensitiveField(record, 'publishedAt')
                ?? getCaseInsensitiveField(record, 'time'),
                { includePriority: false, fallback: now }
            ),
        };
    });
};

export const normalizeLiveEvents = (value: unknown, idPrefix: string): MonitorEvent[] => {
    const list = unwrapArrayContainer(value, ['events', 'items', 'results', 'data', 'signals']);
    const items =
        list.length > 0
            ? list
            : value && typeof value === 'object' && !Array.isArray(value)
              ? [value]
              : [];

    return items.map((item, index) => {
        const record = item as Record<string, unknown>;
        const rawType = normalizeHumanText(
            getCaseInsensitiveField(record, 'type') ?? getCaseInsensitiveField(record, 'eventType')
        ).toUpperCase();
        const type = rawType === 'SOCIAL' || rawType === 'NEWS' || rawType === 'OFFICIAL'
            ? rawType
            : 'NEWS';

        const rawSentiment = normalizeHumanText(getCaseInsensitiveField(record, 'sentiment')).toUpperCase();
        const sentiment = rawSentiment === 'NEGATIVE' || rawSentiment === 'NEUTRAL' || rawSentiment === 'POSITIVE'
            ? rawSentiment
            : 'NEUTRAL';

        const rawThreatLevel = normalizeHumanText(
            getCaseInsensitiveField(record, 'threatLevel')
            ?? getCaseInsensitiveField(record, 'severity')
            ?? getCaseInsensitiveField(record, 'riskLevel')
        ).toUpperCase();
        const threatLevel = rawThreatLevel === 'INFO' || rawThreatLevel === 'CAUTION' || rawThreatLevel === 'CRITICAL'
            ? rawThreatLevel
            : 'INFO';

        return {
            id: normalizeHumanText(
                getCaseInsensitiveField(record, 'id')
                ?? getCaseInsensitiveField(record, 'eventId'),
                { includePriority: false, fallback: `${idPrefix}-${Date.now()}-${index}` }
            ),
            type,
            sourceName: normalizeHumanText(
                getCaseInsensitiveField(record, 'sourceName')
                ?? getCaseInsensitiveField(record, 'source')
                ?? getCaseInsensitiveField(record, 'publisher')
                ?? getCaseInsensitiveField(record, 'origin'),
                { includePriority: false, fallback: 'Unknown Source' }
            ),
            content: normalizeHumanText(
                getCaseInsensitiveField(record, 'content')
                ?? getCaseInsensitiveField(record, 'description')
                ?? getCaseInsensitiveField(record, 'summary')
                ?? getCaseInsensitiveField(record, 'headline')
                ?? getCaseInsensitiveField(record, 'title')
                ?? record,
                { includePriority: false }
            ),
            timestamp: normalizeHumanText(
                getCaseInsensitiveField(record, 'timestamp')
                ?? getCaseInsensitiveField(record, 'publishedAt')
                ?? getCaseInsensitiveField(record, 'time')
                ?? getCaseInsensitiveField(record, 'date'),
                { includePriority: false, fallback: 'now' }
            ),
            sentiment,
            threatLevel,
            url: normalizeHumanText(
                getCaseInsensitiveField(record, 'url')
                ?? getCaseInsensitiveField(record, 'link')
                ?? getCaseInsensitiveField(record, 'sourceUrl'),
                { includePriority: false }
            ) || undefined,
        };
    });
};
