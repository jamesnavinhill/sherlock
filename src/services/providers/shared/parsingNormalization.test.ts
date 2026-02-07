import { describe, expect, it } from 'vitest';
import { parseJsonWithFallback, toDisplayText } from './jsonParsing';
import {
    dedupeSources,
    normalizeEntities,
    normalizeFeedItems,
    normalizeLiveEvents,
    normalizeStringList,
    sanitizeUrl,
} from './normalizers';

describe('provider parsing utilities', () => {
    it('parses markdown-wrapped JSON payloads', () => {
        const raw = [
            'Model preamble that should be ignored',
            '```json',
            '{"summary":"ready","leads":["A"]}',
            '```',
            'Trailing note',
        ].join('\n');

        expect(parseJsonWithFallback(raw)).toEqual({
            summary: 'ready',
            leads: ['A'],
        });
    });

    it('recovers from malformed blocks by parsing a later valid candidate', () => {
        const raw = [
            '```json',
            '{invalid}',
            '```',
            'Fallback payload:',
            '[{"id":"evt-1","type":"NEWS"}]',
        ].join('\n');

        expect(parseJsonWithFallback(raw)).toEqual([{ id: 'evt-1', type: 'NEWS' }]);
    });

    it('throws a parse error when no JSON candidate is valid', () => {
        expect(() => parseJsonWithFallback('no json structure here')).toThrow(
            /PARSE_ERROR/i
        );
    });

    it('normalizes display text from nested and mixed values', () => {
        expect(toDisplayText(['alpha', { text: 'beta' }, { content: ['gamma'] }])).toBe(
            'alpha beta gamma'
        );
    });
});

describe('provider normalization utilities', () => {
    it('normalizes mixed string lists to render-safe strings', () => {
        const normalized = normalizeStringList([
            'plain',
            42,
            { text: 'inline' },
            { content: ['nested', true] },
            null,
            undefined,
        ]);

        expect(normalized).toEqual(['plain', '42', 'inline', 'nested true']);
        expect(normalized.every((entry) => typeof entry === 'string')).toBe(true);
    });

    it('normalizes entities with safe fallbacks', () => {
        const entities = normalizeEntities([
            'Raw Person',
            { name: 'Org Name', type: 'ORGANIZATION', role: 'Vendor', sentiment: 'POSITIVE' },
            { name: 'Untrusted Type', type: 'ALIEN', sentiment: 'MAYBE' },
            { name: '', type: 'PERSON' },
        ]);

        expect(entities).toEqual([
            { name: 'Raw Person', type: 'UNKNOWN' },
            {
                name: 'Org Name',
                type: 'ORGANIZATION',
                role: 'Vendor',
                sentiment: 'POSITIVE',
            },
            {
                name: 'Untrusted Type',
                type: 'UNKNOWN',
                role: undefined,
                sentiment: undefined,
            },
        ]);
    });

    it('normalizes anomaly feed items and event payloads to stable contracts', () => {
        const feed = normalizeFeedItems(
            [
                { id: 'f1', title: 'Known', category: 'Cyber', riskLevel: 'HIGH', timestamp: '08:00' },
                { title: 'Missing fields', riskLevel: 'UNKNOWN' },
            ],
            'General',
            'now',
            'feed'
        );

        const live = normalizeLiveEvents(
            [
                { id: 'e1', type: 'NEWS', sourceName: 'Desk', content: 'Update', timestamp: '1m', threatLevel: 'CRITICAL', sentiment: 'NEGATIVE' },
                { type: 'INVALID', sentiment: 'OTHER', threatLevel: 'NONE', content: 7 },
            ],
            'evt'
        );

        expect(feed).toHaveLength(2);
        expect(feed[0].riskLevel).toBe('HIGH');
        expect(feed[1].riskLevel).toBe('MEDIUM');
        expect(typeof feed[1].title).toBe('string');

        expect(live).toHaveLength(2);
        expect(live[0].type).toBe('NEWS');
        expect(live[1].type).toBe('NEWS');
        expect(live[1].sentiment).toBe('NEUTRAL');
        expect(live[1].threatLevel).toBe('INFO');
        expect(typeof live[1].content).toBe('string');
    });

    it('sanitizes and deduplicates source urls', () => {
        expect(sanitizeUrl('https://example.com/path#frag).')).toBe('https://example.com/path');
        expect(sanitizeUrl('not-a-url')).toBeNull();

        const sources = dedupeSources([
            { title: 'One', url: 'https://Example.com/a' },
            { title: 'Two', uri: 'https://example.com/a' },
            { title: 'Three', url: 'invalid' },
        ]);

        expect(sources).toEqual([{ title: 'One', url: 'https://example.com/a' }]);
    });
});
