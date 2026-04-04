import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useWorkspaceStore } from '../../../store/caseStore';

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
        onOpenEntityChat,
    }: {
        onInvestigate: (topic: string) => void;
        onOpenEntityChat?: (entityName: string) => void;
    }) => (
        <>
            <button data-testid="network-investigate-entity" onClick={() => onInvestigate('Atlas Holdings')}>
                Investigate Entity
            </button>
            <button data-testid="network-open-chat" onClick={() => onOpenEntityChat?.('Atlas Holdings')}>
                Open Entity Chat
            </button>
        </>
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

        useWorkspaceStore.setState({
            activeWorkspaceId: 'case-1',
            activeScope: 'open-investigation',
            workspaces: [
                {
                    id: 'case-1',
                    title: 'Operation: Atlas',
                    status: 'ACTIVE',
                    dateOpened: '2026-02-07',
                    description: 'Entity mapping case',
                },
            ],
            artifacts: [
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
                onOpenChat={vi.fn()}
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

    it('opens workspace chat with entity grounding from graph inspector', () => {
        const onOpenChat = vi.fn();

        render(
            <NetworkGraph
                onOpenReport={vi.fn()}
                onInvestigateEntity={vi.fn()}
                onOpenChat={onOpenChat}
            />
        );

        fireEvent.click(screen.getByTestId('network-open-chat'));

        expect(onOpenChat).toHaveBeenCalledWith({
            workspaceId: 'case-1',
            launchContext: {
                entityName: 'Atlas Holdings',
            },
        });
    });
});
