import { describe, it, expect } from 'vitest';
import { cleanEntityName, truncateText, normalizeId } from './text';

describe('Text Utilities', () => {
    describe('cleanEntityName', () => {
        it('should remove type prefixes', () => {
            expect(cleanEntityName('[PERSON] John Doe')).toBe('John Doe');
            expect(cleanEntityName('[ORG] Acme Corp')).toBe('Acme Corp');
        });

        it('should remove markdown links', () => {
            expect(cleanEntityName('[Link Text](http://example.com)')).toBe('Link Text');
        });

        it('should remove bold/italic markers', () => {
            expect(cleanEntityName('**Bold User**')).toBe('Bold User');
            expect(cleanEntityName('__Italic Org__')).toBe('Italic Org');
        });

        it('should remove outer brackets', () => {
            expect(cleanEntityName('[[Brackets]]')).toBe('Brackets');
        });
    });

    describe('truncateText', () => {
        it('should truncate long text', () => {
            expect(truncateText('Hello World', 8)).toBe('Hello...');
        });

        it('should not truncate short text', () => {
            expect(truncateText('Hello', 10)).toBe('Hello');
        });
    });

    describe('normalizeId', () => {
        it('should lowercase and remove non-alphanumeric chars', () => {
            expect(normalizeId('User-Name_123!')).toBe('username123');
        });
    });
});
