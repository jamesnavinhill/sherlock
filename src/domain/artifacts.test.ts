import { describe, expect, it } from 'vitest';
import { buildArtifactSections, normalizeArtifactSections } from './artifacts';

describe('artifacts domain helpers', () => {
    it('dedupes repeated section ids within a single normalized payload', () => {
        const sections = normalizeArtifactSections([
            {
                id: 'section-custom-0',
                kind: 'CUSTOM',
                title: 'First',
                content: 'alpha',
                order: 0,
            },
            {
                id: 'section-custom-0',
                kind: 'CUSTOM',
                title: 'Second',
                content: 'beta',
                order: 1,
            },
        ]);

        expect(sections.map((section) => section.id)).toEqual([
            'section-custom-0',
            'section-custom-0-1',
        ]);
    });

    it('keeps derived section ids stable when they are already unique', () => {
        const sections = buildArtifactSections({
            summary: 'Summary',
            findings: ['Finding'],
            leads: ['Lead'],
        });

        expect(sections.map((section) => section.id)).toEqual([
            'section-executive_summary-0',
            'section-key_findings-1',
            'section-leads-3',
        ]);
    });
});
