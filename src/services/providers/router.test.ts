import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvestigationReport } from '../../types';

const {
    mockGeminiInvestigate,
    mockOpenRouterInvestigate,
    mockOpenAIInvestigate,
    mockAnthropicInvestigate,
    mockNoopFeed,
    mockNoopLive,
    mockGeminiTts,
} = vi.hoisted(() => ({
    mockGeminiInvestigate: vi.fn(),
    mockOpenRouterInvestigate: vi.fn(),
    mockOpenAIInvestigate: vi.fn(),
    mockAnthropicInvestigate: vi.fn(),
    mockNoopFeed: vi.fn().mockResolvedValue([]),
    mockNoopLive: vi.fn().mockResolvedValue([]),
    mockGeminiTts: vi.fn().mockResolvedValue('audio-data'),
}));

vi.mock('./geminiProvider', () => ({
    geminiProvider: {
        provider: 'GEMINI',
        investigate: mockGeminiInvestigate,
        scanAnomalies: mockNoopFeed,
        getLiveIntel: mockNoopLive,
        generateAudioBriefing: mockGeminiTts,
    },
}));

vi.mock('./openRouterProvider', () => ({
    openRouterProvider: {
        provider: 'OPENROUTER',
        investigate: mockOpenRouterInvestigate,
        scanAnomalies: mockNoopFeed,
        getLiveIntel: mockNoopLive,
    },
}));

vi.mock('./openAIProvider', () => ({
    openAIProvider: {
        provider: 'OPENAI',
        investigate: mockOpenAIInvestigate,
        scanAnomalies: mockNoopFeed,
        getLiveIntel: mockNoopLive,
    },
}));

vi.mock('./anthropicProvider', () => ({
    anthropicProvider: {
        provider: 'ANTHROPIC',
        investigate: mockAnthropicInvestigate,
        scanAnomalies: mockNoopFeed,
        getLiveIntel: mockNoopLive,
    },
}));

import {
    generateAudioBriefingWithProviderRouter,
    getRegisteredProviders,
    investigateWithProviderRouter,
} from './index';

const reportFixture: InvestigationReport = {
    topic: 'fixture',
    summary: 'ok',
    agendas: [],
    leads: [],
    entities: [],
    sources: [],
    rawText: '{}',
};

describe('provider router', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();

        mockGeminiInvestigate.mockResolvedValue(reportFixture);
        mockOpenRouterInvestigate.mockResolvedValue(reportFixture);
        mockOpenAIInvestigate.mockResolvedValue(reportFixture);
        mockAnthropicInvestigate.mockResolvedValue(reportFixture);
    });

    it('dispatches investigate to selected provider adapter', async () => {
        localStorage.setItem(
            'sherlock_config',
            JSON.stringify({
                provider: 'OPENROUTER',
                modelId: 'stepfun/step-3.5-flash:free',
                persona: 'general-investigator',
                searchDepth: 'STANDARD',
                thinkingBudget: 0,
            })
        );

        await investigateWithProviderRouter({ topic: 'test target' });

        expect(mockOpenRouterInvestigate).toHaveBeenCalledTimes(1);
        expect(mockGeminiInvestigate).not.toHaveBeenCalled();
    });

    it('rejects TTS when provider capability does not support it', async () => {
        localStorage.setItem(
            'sherlock_config',
            JSON.stringify({
                provider: 'OPENAI',
                modelId: 'gpt-4.1-mini',
                persona: 'general-investigator',
                searchDepth: 'STANDARD',
                thinkingBudget: 0,
            })
        );

        await expect(
            generateAudioBriefingWithProviderRouter({ text: 'brief me' })
        ).rejects.toThrow(/does not support TTS/i);
    });

    it('lists every registered provider', () => {
        expect(getRegisteredProviders().sort()).toEqual([
            'ANTHROPIC',
            'GEMINI',
            'OPENAI',
            'OPENROUTER',
        ]);
    });
});
