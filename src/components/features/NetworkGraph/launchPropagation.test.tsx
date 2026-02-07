import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useCaseStore } from '../../../store/caseStore';

vi.mock('./ControlBar', () => ({
    ControlBar: () => null,
}));

vi.mock('./GraphCanvas', () => ({
    GraphCanvas: () => null,
}));

vi.mock('./EntityResolution', () => ({
    EntityResolution: () => null,
    detectEntityClusters: () => [],
}));

vi.mock('../OperationView/DossierPanel', () => ({
    DossierPanel: () => null,
}));

vi.mock('./NodeInspector', () => ({
    NodeInspector: ({
        onInvestigate,
    }: {
        onInvestigate: (topic: string) => void;
    }) => (
        <button data-testid="network-investigate-entity" onClick={() => onInvestigate('Atlas Holdings')}>
            Investigate Entity
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
            data-testid="network-modal-start"
            onClick={() =>
                onStart(
                    'Entity follow-up from graph',
                    {
                        provider: 'OPENROUTER',
                        modelId: 'stepfun/step-3.5-flash:free',
                        persona: 'general-investigator',
                        searchDepth: 'DEEP',
                        thinkingBudget: 0,
                    },
                    undefined,
                    undefined,
                    { start: '2024-11-01', end: '2025-01-31' }
                )
            }
        >
            Start Graph Modal
        </button>
    ),
}));

import { NetworkGraph } from './index';

describe('NetworkGraph launch propagation', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();

        useCaseStore.setState({
            activeCaseId: 'case-1',
            activeScope: 'open-investigation',
            cases: [
                {
                    id: 'case-1',
                    title: 'Operation: Atlas',
                    status: 'ACTIVE',
                    dateOpened: '2026-02-07',
                    description: 'Entity mapping case',
                },
            ],
            archives: [
                {
                    id: 'report-1',
                    caseId: 'case-1',
                    topic: 'Atlas baseline',
                    summary: 'Summary',
                    agendas: [],
                    leads: [],
                    entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
                    sources: [],
                    rawText: '{}',
                },
            ],
            manualNodes: [],
            manualLinks: [],
            hiddenNodeIds: [],
            flaggedNodeIds: [],
            headlines: [],
            entityAliases: {},
        });
    });

    it('dispatches unified launch request for entity investigate from graph flow', () => {
        const onInvestigateEntity = vi.fn();

        render(
            <NetworkGraph
                onOpenReport={vi.fn()}
                onInvestigateEntity={onInvestigateEntity}
            />
        );

        fireEvent.click(screen.getByTestId('network-investigate-entity'));
        fireEvent.click(screen.getByTestId('network-modal-start'));

        expect(onInvestigateEntity).toHaveBeenCalledTimes(1);
        expect(onInvestigateEntity).toHaveBeenCalledWith(
            expect.objectContaining({
                topic: 'Entity follow-up from graph',
                launchSource: 'NETWORK_GRAPH',
                parentContext: {
                    topic: 'Operation: Atlas',
                    summary: 'Entity mapping case',
                },
                configOverride: expect.objectContaining({
                    provider: 'OPENROUTER',
                    modelId: 'stepfun/step-3.5-flash:free',
                }),
                dateRangeOverride: {
                    start: '2024-11-01',
                    end: '2025-01-31',
                },
            })
        );
    });
});
