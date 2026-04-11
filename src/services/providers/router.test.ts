import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Artifact } from '../../types';
import * as aiModels from '../../config/aiModels';

const {
  mockGeminiInvestigate,
  mockGeminiChat,
  mockGeminiStreamChat,
  mockGeminiBoardAgent,
  mockGeminiStreamBoardAgent,
  mockOpenRouterInvestigate,
  mockOpenRouterChat,
  mockOpenRouterStreamChat,
  mockOpenRouterBoardAgent,
  mockOpenRouterStreamBoardAgent,
  mockOpenAIInvestigate,
  mockOpenAIChat,
  mockOpenAIStreamChat,
  mockOpenAIBoardAgent,
  mockOpenAIStreamBoardAgent,
  mockAnthropicInvestigate,
  mockAnthropicChat,
  mockAnthropicStreamChat,
  mockAnthropicBoardAgent,
  mockAnthropicStreamBoardAgent,
  mockNoopFeed,
  mockNoopLive,
  mockGeminiTts,
} = vi.hoisted(() => ({
  mockGeminiInvestigate: vi.fn(),
  mockGeminiChat: vi.fn(),
  mockGeminiStreamChat: vi.fn(),
  mockGeminiBoardAgent: vi.fn(),
  mockGeminiStreamBoardAgent: vi.fn(),
  mockOpenRouterInvestigate: vi.fn(),
  mockOpenRouterChat: vi.fn(),
  mockOpenRouterStreamChat: vi.fn(),
  mockOpenRouterBoardAgent: vi.fn(),
  mockOpenRouterStreamBoardAgent: vi.fn(),
  mockOpenAIInvestigate: vi.fn(),
  mockOpenAIChat: vi.fn(),
  mockOpenAIStreamChat: vi.fn(),
  mockOpenAIBoardAgent: vi.fn(),
  mockOpenAIStreamBoardAgent: vi.fn(),
  mockAnthropicInvestigate: vi.fn(),
  mockAnthropicChat: vi.fn(),
  mockAnthropicStreamChat: vi.fn(),
  mockAnthropicBoardAgent: vi.fn(),
  mockAnthropicStreamBoardAgent: vi.fn(),
  mockNoopFeed: vi.fn().mockResolvedValue([]),
  mockNoopLive: vi.fn().mockResolvedValue([]),
  mockGeminiTts: vi.fn().mockResolvedValue('audio-data'),
}));

vi.mock('./geminiProvider', () => ({
  geminiProvider: {
    provider: 'GEMINI',
    investigate: mockGeminiInvestigate,
    chat: mockGeminiChat,
    streamChat: mockGeminiStreamChat,
    boardAgent: mockGeminiBoardAgent,
    streamBoardAgent: mockGeminiStreamBoardAgent,
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
    streamChat: mockOpenRouterStreamChat,
    boardAgent: mockOpenRouterBoardAgent,
    streamBoardAgent: mockOpenRouterStreamBoardAgent,
    scanAnomalies: mockNoopFeed,
    getLiveIntel: mockNoopLive,
  },
}));

vi.mock('./openAIProvider', () => ({
  openAIProvider: {
    provider: 'OPENAI',
    investigate: mockOpenAIInvestigate,
    chat: mockOpenAIChat,
    streamChat: mockOpenAIStreamChat,
    boardAgent: mockOpenAIBoardAgent,
    streamBoardAgent: mockOpenAIStreamBoardAgent,
    scanAnomalies: mockNoopFeed,
    getLiveIntel: mockNoopLive,
  },
}));

vi.mock('./anthropicProvider', () => ({
  anthropicProvider: {
    provider: 'ANTHROPIC',
    investigate: mockAnthropicInvestigate,
    chat: mockAnthropicChat,
    streamChat: mockAnthropicStreamChat,
    boardAgent: mockAnthropicBoardAgent,
    streamBoardAgent: mockAnthropicStreamBoardAgent,
    scanAnomalies: mockNoopFeed,
    getLiveIntel: mockNoopLive,
  },
}));

import {
  chatWithProviderRouter,
  boardAgentWithProviderRouter,
  generateAudioBriefingWithProviderRouter,
  getLiveIntelWithProviderRouter,
  getRegisteredProviders,
  investigateWithProviderRouter,
  streamBoardAgentWithProviderRouter,
  streamChatWithProviderRouter,
} from './index';

const reportFixture: Artifact = {
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
    mockGeminiStreamChat.mockResolvedValue({
      content: 'ok',
      citations: [],
      rawText: '<answer>ok</answer><citations></citations><title></title>',
      provider: 'GEMINI',
      modelId: 'gemini-3-flash-preview',
    });
    mockGeminiBoardAgent.mockResolvedValue({
      message: 'ok',
      actions: [],
      rawText: '{}',
      provider: 'GEMINI',
      modelId: 'gemini-3-flash-preview',
    });
    mockGeminiStreamBoardAgent.mockResolvedValue({
      message: 'ok',
      actions: [],
      rawText: '<message>ok</message>',
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
    mockOpenRouterStreamChat.mockResolvedValue({
      content: 'ok',
      citations: [],
      rawText: '<answer>ok</answer><citations></citations><title></title>',
      provider: 'OPENROUTER',
      modelId: 'stepfun/step-3.5-flash:free',
    });
    mockOpenRouterBoardAgent.mockResolvedValue({
      message: 'ok',
      actions: [],
      rawText: '{}',
      provider: 'OPENROUTER',
      modelId: 'stepfun/step-3.5-flash:free',
    });
    mockOpenRouterStreamBoardAgent.mockResolvedValue({
      message: 'ok',
      actions: [],
      rawText: '<message>ok</message>',
      provider: 'OPENROUTER',
      modelId: 'stepfun/step-3.5-flash:free',
    });
    mockOpenAIInvestigate.mockResolvedValue(reportFixture);
    mockOpenAIChat.mockResolvedValue({
      content: 'ok',
      citations: [],
      rawText: '{}',
      provider: 'OPENAI',
      modelId: 'gpt-5.4-mini',
    });
    mockOpenAIStreamChat.mockResolvedValue({
      content: 'ok',
      citations: [],
      rawText: '<answer>ok</answer><citations></citations><title></title>',
      provider: 'OPENAI',
      modelId: 'gpt-5.4-mini',
    });
    mockOpenAIBoardAgent.mockResolvedValue({
      message: 'ok',
      actions: [],
      rawText: '{}',
      provider: 'OPENAI',
      modelId: 'gpt-5.4-mini',
    });
    mockOpenAIStreamBoardAgent.mockResolvedValue({
      message: 'ok',
      actions: [],
      rawText: '<message>ok</message>',
      provider: 'OPENAI',
      modelId: 'gpt-5.4-mini',
    });
    mockAnthropicInvestigate.mockResolvedValue(reportFixture);
    mockAnthropicChat.mockResolvedValue({
      content: 'ok',
      citations: [],
      rawText: '{}',
      provider: 'ANTHROPIC',
      modelId: 'claude-sonnet-4-6',
    });
    mockAnthropicStreamChat.mockResolvedValue({
      content: 'ok',
      citations: [],
      rawText: '<answer>ok</answer><citations></citations><title></title>',
      provider: 'ANTHROPIC',
      modelId: 'claude-sonnet-4-6',
    });
    mockAnthropicBoardAgent.mockResolvedValue({
      message: 'ok',
      actions: [],
      rawText: '{}',
      provider: 'ANTHROPIC',
      modelId: 'claude-sonnet-4-6',
    });
    mockAnthropicStreamBoardAgent.mockResolvedValue({
      message: 'ok',
      actions: [],
      rawText: '<message>ok</message>',
      provider: 'ANTHROPIC',
      modelId: 'claude-sonnet-4-6',
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
        modelId: 'gpt-5.4-mini',
        persona: 'general-investigator',
        searchDepth: 'STANDARD',
        thinkingBudget: 0,
      })
    );

    await expect(generateAudioBriefingWithProviderRouter({ text: 'brief me' })).rejects.toThrow(
      /TTS/i
    );
  });

  it('rejects chat when the selected model is not runtime-enabled', async () => {
    const capabilitiesSpy = vi.spyOn(aiModels, 'getEffectiveModelCapabilities').mockReturnValue({
      supportsThinkingBudget: false,
      supportsStructuredOutput: true,
      supportsWebSearch: false,
      supportsToolUse: false,
      runtimeStatus: 'PLANNED',
    });

    localStorage.setItem(
      'sherlock_config',
      JSON.stringify({
        provider: 'OPENAI',
        modelId: 'gpt-5.4-mini',
        persona: 'general-investigator',
        searchDepth: 'STANDARD',
        thinkingBudget: 0,
      })
    );

    try {
      await expect(
        chatWithProviderRouter({
          workspace: {
            id: 'case-1',
            title: 'Workspace Alpha',
            status: 'ACTIVE',
            dateOpened: '2026-04-03',
          },
          messages: [{ role: 'user', content: 'Summarize the workspace.' }],
          workspaceSummary: 'One workspace',
          recentArtifacts: [],
          recentSignals: [],
          retrievedContext: [],
        })
      ).rejects.toThrow(/CHAT is unavailable/i);
    } finally {
      capabilitiesSpy.mockRestore();
    }
  });

  it('rejects live intel when the provider is not runtime-enabled', async () => {
    const providerSpy = vi.spyOn(aiModels, 'getProviderOptionById').mockReturnValue({
      id: 'GEMINI',
      label: 'Google Gemini',
      description: 'Primary default provider',
      defaultModelId: 'gemini-3-flash-preview',
      capabilities: {
        supportsThinkingBudget: true,
        supportsTts: true,
        supportsWebSearch: true,
        runtimeStatus: 'PLANNED',
      },
    });

    try {
      await expect(getLiveIntelWithProviderRouter({ topic: 'watch this' })).rejects.toThrow(
        /LIVE_INTEL is unavailable/i
      );
    } finally {
      providerSpy.mockRestore();
    }
  });

  it('dispatches chat to the selected provider adapter', async () => {
    localStorage.setItem(
      'sherlock_config',
      JSON.stringify({
        provider: 'OPENAI',
        modelId: 'gpt-5.4-mini',
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
      recentSignals: [],
      retrievedContext: [],
    });

    expect(mockOpenAIChat).toHaveBeenCalledTimes(1);
    expect(mockGeminiChat).not.toHaveBeenCalled();
  });

  it('uses workspace pack and purpose defaults for chat when request overrides are omitted', async () => {
    localStorage.setItem(
      'sherlock_config',
      JSON.stringify({
        provider: 'OPENAI',
        modelId: 'gpt-5.4-mini',
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
        scopeId: 'open-investigation',
        packId: 'open-investigation',
        purposeId: 'monitor',
      },
      messages: [{ role: 'user', content: 'Summarize the workspace.' }],
      workspaceSummary: 'One workspace',
      recentArtifacts: [],
      recentSignals: [],
      retrievedContext: [],
    });

    expect(mockOpenAIChat).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pack: expect.objectContaining({ id: 'open-investigation' }),
        purpose: expect.objectContaining({ id: 'monitor' }),
      })
    );
  });

  it('dispatches streaming chat to the selected provider adapter', async () => {
    localStorage.setItem(
      'sherlock_config',
      JSON.stringify({
        provider: 'ANTHROPIC',
        modelId: 'claude-sonnet-4-6',
        persona: 'general-investigator',
        searchDepth: 'STANDARD',
        thinkingBudget: 0,
      })
    );

    await streamChatWithProviderRouter(
      {
        workspace: {
          id: 'case-1',
          title: 'Workspace Alpha',
          status: 'ACTIVE',
          dateOpened: '2026-04-03',
        },
        messages: [{ role: 'user', content: 'Stream the workspace summary.' }],
        workspaceSummary: 'One workspace',
        recentArtifacts: [],
        recentSignals: [],
        retrievedContext: [],
      },
      {
        onEvent: vi.fn(),
      }
    );

    expect(mockAnthropicStreamChat).toHaveBeenCalledTimes(1);
    expect(mockOpenAIStreamChat).not.toHaveBeenCalled();
  });

  it('dispatches board-agent planning to the selected provider adapter', async () => {
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

    await boardAgentWithProviderRouter({
      workspace: {
        id: 'case-1',
        title: 'Workspace Alpha',
        status: 'ACTIVE',
        dateOpened: '2026-04-03',
      },
      board: {
        id: 'board-1',
        workspaceId: 'case-1',
        name: 'Primary Board',
      },
      userRequest: 'Organize the visible board',
      contextSnapshot: {
        id: 'ctx-1',
        workspaceId: 'case-1',
        boardId: 'board-1',
        request: 'Organize the visible board',
        selectedShapeIds: [],
        visibleShapeIds: [],
        parts: [],
        createdAt: 1,
      },
    });

    expect(mockOpenRouterBoardAgent).toHaveBeenCalledTimes(1);
    expect(mockGeminiBoardAgent).not.toHaveBeenCalled();
  });

  it('applies explicit pack and purpose overrides before board-agent dispatch', async () => {
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

    await boardAgentWithProviderRouter({
      workspace: {
        id: 'case-1',
        title: 'Workspace Alpha',
        status: 'ACTIVE',
        dateOpened: '2026-04-03',
        scopeId: 'open-investigation',
        packId: 'open-investigation',
        purposeId: 'deep-dive',
      },
      board: {
        id: 'board-1',
        workspaceId: 'case-1',
        name: 'Primary Board',
      },
      userRequest: 'Organize the visible board',
      contextSnapshot: {
        id: 'ctx-1',
        workspaceId: 'case-1',
        boardId: 'board-1',
        request: 'Organize the visible board',
        selectedShapeIds: [],
        visibleShapeIds: [],
        parts: [],
        createdAt: 1,
      },
      packId: 'corporate-due-diligence',
      purposeId: 'synthesis',
    });

    expect(mockOpenRouterBoardAgent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pack: expect.objectContaining({ id: 'corporate-due-diligence' }),
        purpose: expect.objectContaining({ id: 'synthesis' }),
      })
    );
  });

  it('dispatches streaming board-agent planning to the selected provider adapter', async () => {
    localStorage.setItem(
      'sherlock_config',
      JSON.stringify({
        provider: 'OPENAI',
        modelId: 'gpt-5.4-mini',
        persona: 'general-investigator',
        searchDepth: 'STANDARD',
        thinkingBudget: 0,
      })
    );

    await streamBoardAgentWithProviderRouter(
      {
        workspace: {
          id: 'case-1',
          title: 'Workspace Alpha',
          status: 'ACTIVE',
          dateOpened: '2026-04-03',
        },
        board: {
          id: 'board-1',
          workspaceId: 'case-1',
          name: 'Primary Board',
        },
        userRequest: 'Plan the next board moves',
        contextSnapshot: {
          id: 'ctx-1',
          workspaceId: 'case-1',
          boardId: 'board-1',
          request: 'Plan the next board moves',
          selectedShapeIds: [],
          visibleShapeIds: [],
          parts: [],
          createdAt: 1,
        },
      },
      {
        onEvent: vi.fn(),
      }
    );

    expect(mockOpenAIStreamBoardAgent).toHaveBeenCalledTimes(1);
    expect(mockAnthropicStreamBoardAgent).not.toHaveBeenCalled();
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
