import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useCaseStore } from '../../../store/caseStore';

vi.mock('./SettingsPanel', () => ({
    SettingsPanel: () => null,
}));

vi.mock('./EventCard', () => ({
    EventCard: ({ onInvestigate }: { onInvestigate: () => void }) => (
        <button data-testid="live-event-investigate" onClick={onInvestigate}>
            Investigate Event
        </button>
    ),
}));

vi.mock('../../ui/TaskSetupModal', () => ({
    TaskSetupModal: ({
        onStart,
    }: {
        onStart: (
            topic: string,
            configOverride: Record<string, unknown>,
            preseeded?: unknown,
            scope?: unknown,
            dateRange?: { start?: string; end?: string }
        ) => void;
    }) => (
        <button
            data-testid="live-modal-start"
            onClick={() =>
                onStart(
                    'Live monitor deep dive',
                    {
                        provider: 'OPENAI',
                        modelId: 'gpt-4.1-mini',
                        persona: 'general-investigator',
                        searchDepth: 'STANDARD',
                        thinkingBudget: 0,
                    },
                    undefined,
                    undefined,
                    { start: '2025-01-01', end: '2025-02-01' }
                )
            }
        >
            Start Modal
        </button>
    ),
}));

vi.mock('../../ui/BackgroundMatrixRain', () => ({
    BackgroundMatrixRain: () => null,
}));

import { LiveMonitor } from './index';

describe('LiveMonitor launch propagation', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();

        useCaseStore.setState({
            activeScope: 'open-investigation',
            activeCaseId: 'case-1',
            cases: [
                {
                    id: 'case-1',
                    title: 'Operation: Atlas',
                    status: 'ACTIVE',
                    dateOpened: '2026-02-07',
                    description: 'Procurement shell network analysis',
                },
            ],
            headlines: [],
        });
    });

    it('dispatches unified launch request from live-event investigate flow', () => {
        const onInvestigate = vi.fn();

        render(
            <LiveMonitor
                events={[
                    {
                        id: 'event-1',
                        type: 'NEWS',
                        sourceName: 'Ledger',
                        content: 'Contract update detected',
                        timestamp: '5m ago',
                        sentiment: 'NEGATIVE',
                        threatLevel: 'CAUTION',
                    },
                ]}
                setEvents={vi.fn()}
                onInvestigate={onInvestigate}
            />
        );

        fireEvent.click(screen.getByTestId('live-event-investigate'));
        fireEvent.click(screen.getByTestId('live-modal-start'));

        expect(onInvestigate).toHaveBeenCalledTimes(1);
        expect(onInvestigate).toHaveBeenCalledWith(
            expect.objectContaining({
                topic: 'Live monitor deep dive',
                launchSource: 'LIVE_MONITOR_EVENT',
                dateRangeOverride: { start: '2025-01-01', end: '2025-02-01' },
                parentContext: {
                    topic: 'Operation: Atlas',
                    summary: 'Procurement shell network analysis',
                },
                configOverride: expect.objectContaining({
                    provider: 'OPENAI',
                    modelId: 'gpt-4.1-mini',
                }),
            })
        );
    });
});
