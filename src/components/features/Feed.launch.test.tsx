import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Feed } from './Feed';
import { useCaseStore } from '../../store/caseStore';

vi.mock('../ui/BackgroundMatrixRain', () => ({
    BackgroundMatrixRain: () => null,
}));

describe('Feed launch propagation', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();

        useCaseStore.setState({
            feedItems: [],
            feedConfig: {
                limit: 8,
                prioritySources: '',
                autoRefresh: false,
                refreshInterval: 60000,
            },
            activeScope: 'custom-scope',
            customScopes: [
                {
                    id: 'custom-scope',
                    name: 'Custom Scope',
                    description: 'Test',
                    domainContext: 'Test context',
                    investigationObjective: 'Test objective',
                    suggestedSources: [],
                    categories: ['Finance', 'Procurement'],
                    personas: [
                        {
                            id: 'general-investigator',
                            label: 'General Investigator',
                            instruction: 'Investigate.',
                        },
                    ],
                },
            ],
        });
    });

    it('dispatches unified launch request from dashboard search', () => {
        const onInvestigate = vi.fn();
        render(<Feed onInvestigate={onInvestigate} />);

        const searchInput = screen.getByPlaceholderText('Search...');
        fireEvent.change(searchInput, { target: { value: 'Atlas Holdings procurement trail' } });
        fireEvent.submit(searchInput.closest('form') as HTMLFormElement);

        expect(onInvestigate).toHaveBeenCalledTimes(1);
        expect(onInvestigate).toHaveBeenCalledWith(
            expect.objectContaining({
                topic: 'Atlas Holdings procurement trail',
                launchSource: 'FEED_SEARCH',
                scope: expect.objectContaining({ id: 'custom-scope' }),
            })
        );
    });
});
