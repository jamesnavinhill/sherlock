import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvestigationScope, SystemConfig } from '../../types';
import {
    ANTHROPIC_FIXTURES,
    GEMINI_FIXTURES,
    OPENAI_FIXTURES,
    OPENROUTER_FIXTURES,
} from './__fixtures__/adapterPayloads';

const { mockGeminiGenerateContent } = vi.hoisted(() => ({
    mockGeminiGenerateContent: vi.fn(),
}));

vi.mock('@google/genai', () => ({
    GoogleGenAI: class GoogleGenAIMock {
        models = {
            generateContent: mockGeminiGenerateContent,
        };
    },
    HarmBlockThreshold: { BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH' },
    HarmCategory: {
        HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
        HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
        HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    },
    Modality: { AUDIO: 'AUDIO' },
    Type: {
        OBJECT: 'OBJECT',
        ARRAY: 'ARRAY',
        STRING: 'STRING',
    },
}));

import { anthropicProvider } from './anthropicProvider';
import { geminiProvider, resetGeminiProviderClient } from './geminiProvider';
import { openAIProvider } from './openAIProvider';
import { openRouterProvider } from './openRouterProvider';

const scopeFixture: InvestigationScope = {
    id: 'open-investigation',
    name: 'Open Investigation',
    description: 'Fixture scope',
    domainContext: 'General OSINT',
    investigationObjective: 'Find risks',
    categories: ['Finance', 'Procurement'],
    personas: [
        {
            id: 'general-investigator',
            label: 'General Investigator',
            instruction: 'Investigate comprehensively.',
        },
    ],
    suggestedSources: [],
};

const makeConfig = (provider: SystemConfig['provider'], modelId: string): SystemConfig => ({
    provider,
    modelId,
    persona: 'general-investigator',
    searchDepth: 'STANDARD',
    thinkingBudget: provider === 'GEMINI' ? 1024 : 0,
    autoNormalizeEntities: true,
    quietMode: false,
});

const makeFetchResponse = (body: string, status = 200): Response =>
    ({
        ok: status >= 200 && status < 300,
        status,
        text: async () => body,
    } as Response);

const assertRenderSafeReport = (report: Awaited<ReturnType<typeof openAIProvider.investigate>>) => {
    expect(typeof report.summary).toBe('string');
    expect(Array.isArray(report.agendas)).toBe(true);
    expect(Array.isArray(report.leads)).toBe(true);
    expect(report.agendas.every((entry) => typeof entry === 'string')).toBe(true);
    expect(report.leads.every((entry) => typeof entry === 'string')).toBe(true);
    expect(report.entities.length).toBeGreaterThan(0);
    expect(report.sources.length).toBeGreaterThan(0);
};

const assertNormalizedFeedAndLive = (
    feed: Awaited<ReturnType<typeof openAIProvider.scanAnomalies>>,
    live: Awaited<ReturnType<typeof openAIProvider.getLiveIntel>>
) => {
    expect(feed.length).toBeGreaterThan(0);
    expect(feed.every((item) => typeof item.title === 'string')).toBe(true);
    expect(feed.every((item) => ['LOW', 'MEDIUM', 'HIGH'].includes(item.riskLevel))).toBe(true);

    expect(live.length).toBeGreaterThan(0);
    expect(live.every((item) => typeof item.content === 'string')).toBe(true);
    expect(live.every((item) => ['SOCIAL', 'NEWS', 'OFFICIAL'].includes(item.type))).toBe(true);
    expect(live.every((item) => ['INFO', 'CAUTION', 'CRITICAL'].includes(item.threatLevel))).toBe(
        true
    );
};

describe('provider adapter contracts', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        vi.stubGlobal('fetch', vi.fn());
        resetGeminiProviderClient();
        mockGeminiGenerateContent.mockReset();

        localStorage.setItem('GEMINI_API_KEY', 'AIza-test-gemini');
        localStorage.setItem('OPENROUTER_API_KEY', 'sk-or-v1-test-openrouter');
        localStorage.setItem('OPENAI_API_KEY', 'sk-test-openai');
        localStorage.setItem('ANTHROPIC_API_KEY', 'sk-ant-test-anthropic');
    });

    it('validates Gemini investigate/scan/live contracts with fixture payloads', async () => {
        mockGeminiGenerateContent
            .mockResolvedValueOnce(GEMINI_FIXTURES.investigate)
            .mockResolvedValueOnce(GEMINI_FIXTURES.scan)
            .mockResolvedValueOnce(GEMINI_FIXTURES.live);

        const config = makeConfig('GEMINI', 'gemini-3-flash-preview');

        const report = await geminiProvider.investigate({
            topic: 'Atlas Holdings',
            parentContext: { topic: 'Procurement Case', summary: 'Prior signals' },
            config,
            scope: scopeFixture,
        });
        const feed = await geminiProvider.scanAnomalies({
            region: 'US',
            category: 'Finance',
            config,
            scope: scopeFixture,
            options: { limit: 8, prioritySources: '' },
        });
        const live = await geminiProvider.getLiveIntel({
            topic: 'Atlas Holdings',
            config,
            scope: scopeFixture,
            monitorConfig: {
                socialCount: 2,
                newsCount: 2,
                officialCount: 1,
                prioritySources: '',
            },
            existingContent: [],
        });

        assertRenderSafeReport(report);
        assertNormalizedFeedAndLive(feed, live);
    });

    it('validates OpenRouter investigate/scan/live contracts with fixture payloads', async () => {
        const fetchMock = vi.mocked(fetch);
        fetchMock
            .mockResolvedValueOnce(makeFetchResponse(OPENROUTER_FIXTURES.investigate))
            .mockResolvedValueOnce(makeFetchResponse(OPENROUTER_FIXTURES.scan))
            .mockResolvedValueOnce(makeFetchResponse(OPENROUTER_FIXTURES.live));

        const config = makeConfig('OPENROUTER', 'stepfun/step-3.5-flash:free');

        const report = await openRouterProvider.investigate({
            topic: 'Atlas Holdings',
            parentContext: { topic: 'Procurement Case', summary: 'Prior signals' },
            config,
            scope: scopeFixture,
        });
        const feed = await openRouterProvider.scanAnomalies({
            region: 'US',
            category: 'Finance',
            config,
            scope: scopeFixture,
            options: { limit: 8, prioritySources: '' },
        });
        const live = await openRouterProvider.getLiveIntel({
            topic: 'Atlas Holdings',
            config,
            scope: scopeFixture,
            monitorConfig: {
                socialCount: 2,
                newsCount: 2,
                officialCount: 1,
                prioritySources: '',
            },
            existingContent: [],
        });

        assertRenderSafeReport(report);
        assertNormalizedFeedAndLive(feed, live);
    });

    it('validates OpenAI investigate/scan/live contracts with fixture payloads', async () => {
        const fetchMock = vi.mocked(fetch);
        fetchMock
            .mockResolvedValueOnce(makeFetchResponse(OPENAI_FIXTURES.investigate))
            .mockResolvedValueOnce(makeFetchResponse(OPENAI_FIXTURES.scan))
            .mockResolvedValueOnce(makeFetchResponse(OPENAI_FIXTURES.live));

        const config = makeConfig('OPENAI', 'gpt-4.1-mini');

        const report = await openAIProvider.investigate({
            topic: 'Atlas Holdings',
            parentContext: { topic: 'Procurement Case', summary: 'Prior signals' },
            config,
            scope: scopeFixture,
        });
        const feed = await openAIProvider.scanAnomalies({
            region: 'US',
            category: 'Finance',
            config,
            scope: scopeFixture,
            options: { limit: 8, prioritySources: '' },
        });
        const live = await openAIProvider.getLiveIntel({
            topic: 'Atlas Holdings',
            config,
            scope: scopeFixture,
            monitorConfig: {
                socialCount: 2,
                newsCount: 2,
                officialCount: 1,
                prioritySources: '',
            },
            existingContent: [],
        });

        assertRenderSafeReport(report);
        assertNormalizedFeedAndLive(feed, live);
    });

    it('validates Anthropic investigate/scan/live contracts with fixture payloads', async () => {
        const fetchMock = vi.mocked(fetch);
        fetchMock
            .mockResolvedValueOnce(makeFetchResponse(ANTHROPIC_FIXTURES.investigate))
            .mockResolvedValueOnce(makeFetchResponse(ANTHROPIC_FIXTURES.scan))
            .mockResolvedValueOnce(makeFetchResponse(ANTHROPIC_FIXTURES.live));

        const config = makeConfig('ANTHROPIC', 'claude-3-5-haiku-latest');

        const report = await anthropicProvider.investigate({
            topic: 'Atlas Holdings',
            parentContext: { topic: 'Procurement Case', summary: 'Prior signals' },
            config,
            scope: scopeFixture,
        });
        const feed = await anthropicProvider.scanAnomalies({
            region: 'US',
            category: 'Finance',
            config,
            scope: scopeFixture,
            options: { limit: 8, prioritySources: '' },
        });
        const live = await anthropicProvider.getLiveIntel({
            topic: 'Atlas Holdings',
            config,
            scope: scopeFixture,
            monitorConfig: {
                socialCount: 2,
                newsCount: 2,
                officialCount: 1,
                prioritySources: '',
            },
            existingContent: [],
        });

        assertRenderSafeReport(report);
        assertNormalizedFeedAndLive(feed, live);
    });
});
