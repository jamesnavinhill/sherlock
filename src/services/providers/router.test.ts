import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvestigationReport } from '../../types';

const {
    mockGeminiInvestigate,
    mockGeminiChat,
    mockOpenRouterInvestigate,
    mockOpenRouterChat,
    mockOpenAIInvestigate,
    mockOpenAIChat,
    mockAnthropicInvestigate,
    mockAnthropicChat,
    mockNoopFeed,
    mockNoopLive,
    mockGeminiTts,
} = vi.hoisted(() => ({
    mockGeminiInvestigate: vi.fn(),
    mockGeminiChat: vi.fn(),
    mockOpenRouterInvestigate: vi.fn(),
    mockOpenRouterChat: vi.fn(),
    mockOpenAIInvestigate: vi.fn(),
    mockOpenAIChat: vi.fn(),
    mockAnthropicInvestigate: vi.fn(),
    mockAnthropicChat: vi.fn(),
    mockNoopFeed: vi.fn().mockResolvedValue([]),
    mockNoopLive: vi.fn().mockResolvedValue([]),
    mockGeminiTts: vi.fn().mockResolvedValue('audio-data'),
}));

vi.mock('./geminiProvider', () => ({
    geminiProvider: {
        provider: 'GEMINI',
        investigate: mockGeminiInvestigate,
        chat: mockGeminiChat,
        scanAnomalies: mockNoopFeed,
        getLiveIntel: mockNoopLive,
        generateAudioBriefing: mockGeminiTts,
    },
}));

vi.mock('./openRouterProvider', () => ({
    openRouterProvider: {
        provider: 'OPENROUTER',
        investigate: mockOpenRouterInvestigate,
        chat: mockOpenRouterChat,
        scanAnomalies: mockNoopFeed,
        getLiveIntel: mockNoopLive,
    },
}));

vi.mock('./openAIProvider', () => ({
    openAIProvider: {
        provider: 'OPENAI',
        investigate: mockOpenAIInvestigate,
        chat: mockOpenAIChat,
        scanAnomalies: mockNoopFeed,
        getLiveIntel: mockNoopLive,
    },
}));

vi.mock('./anthropicProvider', () => ({
    anthropicProvider: {
        provider: 'ANTHROPIC',
        investigate: mockAnthropicInvestigate,
        chat: mockAnthropicChat,
        scanAnomalies: mockNoopFeed,
        getLiveIntel: mockNoopLive,
    },
}));

import {
    chatWithProviderRouter,
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
        mockGeminiChat.mockResolvedValue({
            content: 'ok',
            citations: [],
            rawText: '{}',
            provider: 'GEMINI',
            modelId: 'gemini-3-flash-preview',
        });
        mockOpenRouterInvestigate.mockResolvedValue(reportFixture);
        mockOpenRouterChat.mockResolvedValue({
            content: 'ok',
            citations: [],
            rawText: '{}',
            provider: 'OPENROUTER',
            modelId: 'stepfun/step-3.5-flash:free',
        });
        mockOpenAIInvestigate.mockResolvedValue(reportFixture);
        mockOpenAIChat.mockResolvedValue({
            content: 'ok',
            citations: [],
            rawText: '{}',
            provider: 'OPENAI',
            modelId: 'gpt-4.1-mini',
        });
        mockAnthropicInvestigate.mockResolvedValue(reportFixture);
        mockAnthropicChat.mockResolvedValue({
            content: 'ok',
            citations: [],
            rawText: '{}',
            provider: 'ANTHROPIC',
            modelId: 'claude-3-5-haiku-latest',
        });
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

    it('dispatches chat to the selected provider adapter', async () => {
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

        await chatWithProviderRouter({
            workspace: {
                id: 'case-1',
                title: 'Workspace Alpha',
                status: 'ACTIVE',
                dateOpened: '2026-04-03',
            },
            messages: [{ role: 'user', content: 'Summarize the workspace.' }],
            workspaceSummary: 'One workspace',
            recentArtifacts: [],
            recentHeadlines: [],
            retrievedContext: [],
        });

        expect(mockOpenAIChat).toHaveBeenCalledTimes(1);
        expect(mockGeminiChat).not.toHaveBeenCalled();
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
