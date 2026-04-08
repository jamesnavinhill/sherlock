import type { FeedItem, Artifact, MonitorEvent } from '../../types';
import { ProviderError } from './shared/errors';
import {
  getRegisteredProviderIds,
  resolveProviderExecutionContext,
  resolveScopedProviderRequestContext,
  resolveWorkspaceProviderRequestContext,
} from './routerContext';
import type {
  BoardAgentResponse,
  BoardAgentStreamOptions,
  LiveIntelConfig,
  RouterBoardAgentRequest,
  RouterChatRequest,
  RouterInvestigationRequest,
  RouterLiveIntelRequest,
  RouterScanRequest,
  RouterTtsRequest,
  ChatResponse,
  ChatStreamOptions,
} from './types';

const DEFAULT_MONITOR_CONFIG: LiveIntelConfig = {
  socialCount: 2,
  newsCount: 2,
  officialCount: 2,
  prioritySources: '',
};

const buildChatProviderRequest = (
  request: RouterChatRequest,
  context: Awaited<ReturnType<typeof resolveWorkspaceProviderRequestContext>>
) => ({
  workspace: request.workspace,
  config: context.config,
  pack: context.pack,
  purpose: context.purpose,
  messages: request.messages,
  workspaceSummary: request.workspaceSummary,
  recentArtifacts: request.recentArtifacts,
  recentSignals: request.recentSignals,
  mentionedContext: request.mentionedContext,
  retrievedContext: request.retrievedContext,
});

const buildBoardAgentProviderRequest = (
  request: RouterBoardAgentRequest,
  context: Awaited<ReturnType<typeof resolveWorkspaceProviderRequestContext>>
) => ({
  workspace: request.workspace,
  board: request.board,
  config: context.config,
  pack: context.pack,
  purpose: context.purpose,
  userRequest: request.userRequest,
  contextSnapshot: request.contextSnapshot,
});

export const investigateWithProviderRouter = async (
  request: RouterInvestigationRequest
): Promise<Artifact> => {
  const context = await resolveScopedProviderRequestContext({
    operation: 'INVESTIGATE',
    configOverride: request.configOverride,
    scope: request.scope,
    packId: request.packId,
    purposeId: request.purposeId,
  });

  return context.adapter.investigate({
    topic: request.topic,
    parentContext: request.parentContext,
    config: context.config,
    scope: context.scope,
    pack: context.pack,
    purpose: context.purpose,
    artifactType: request.artifactType || context.purpose.recommendedArtifactType,
    labelProfileId: request.labelProfileId || context.pack.labelProfileId,
    dateOverride: request.dateOverride,
    generationMode: request.configOverride?.generationMode || context.config.generationMode,
  });
};

export const chatWithProviderRouter = async (request: RouterChatRequest): Promise<ChatResponse> => {
  const context = await resolveWorkspaceProviderRequestContext({
    operation: 'CHAT',
    configOverride: request.configOverride,
    workspace: request.workspace,
    packId: request.packId,
    purposeId: request.purposeId,
  });

  return context.adapter.chat(buildChatProviderRequest(request, context));
};

export const streamChatWithProviderRouter = async (
  request: RouterChatRequest,
  options?: ChatStreamOptions
): Promise<ChatResponse> => {
  const context = await resolveWorkspaceProviderRequestContext({
    operation: 'CHAT',
    configOverride: request.configOverride,
    workspace: request.workspace,
    packId: request.packId,
    purposeId: request.purposeId,
  });

  return context.adapter.streamChat(buildChatProviderRequest(request, context), options);
};

export const boardAgentWithProviderRouter = async (
  request: RouterBoardAgentRequest
): Promise<BoardAgentResponse> => {
  const context = await resolveWorkspaceProviderRequestContext({
    operation: 'BOARD_AGENT',
    configOverride: request.configOverride,
    workspace: request.workspace,
    packId: request.packId,
    purposeId: request.purposeId,
  });

  return context.adapter.boardAgent(buildBoardAgentProviderRequest(request, context));
};

export const streamBoardAgentWithProviderRouter = async (
  request: RouterBoardAgentRequest,
  options?: BoardAgentStreamOptions
): Promise<BoardAgentResponse> => {
  const context = await resolveWorkspaceProviderRequestContext({
    operation: 'BOARD_AGENT',
    configOverride: request.configOverride,
    workspace: request.workspace,
    packId: request.packId,
    purposeId: request.purposeId,
  });

  return context.adapter.streamBoardAgent(buildBoardAgentProviderRequest(request, context), options);
};

export const scanAnomaliesWithProviderRouter = async (
  request: RouterScanRequest
): Promise<FeedItem[]> => {
  const context = await resolveScopedProviderRequestContext({
    operation: 'SCAN_ANOMALIES',
    scope: request.scope,
    packId: request.packId,
    purposeId: request.purposeId,
  });

  return context.adapter.scanAnomalies({
    region: request.region || '',
    category: request.category || 'All',
    dateRange: request.dateRange,
    config: context.config,
    scope: context.scope,
    pack: context.pack,
    purpose: context.purpose,
    options: request.options,
  });
};

export const getLiveIntelWithProviderRouter = async (
  request: RouterLiveIntelRequest
): Promise<MonitorEvent[]> => {
  const context = await resolveScopedProviderRequestContext({
    operation: 'LIVE_INTEL',
    scope: request.scope,
    packId: request.packId,
    purposeId: request.purposeId,
  });

  return context.adapter.getLiveIntel({
    topic: request.topic,
    config: context.config,
    scope: context.scope,
    pack: context.pack,
    purpose: context.purpose,
    monitorConfig: request.monitorConfig || DEFAULT_MONITOR_CONFIG,
    existingContent: request.existingContent || [],
  });
};

export const generateAudioBriefingWithProviderRouter = async (
  request: RouterTtsRequest
): Promise<string> => {
  const context = await resolveProviderExecutionContext('TTS');

  if (!context.adapter.generateAudioBriefing) {
    throw new ProviderError({
      code: 'UPSTREAM_ERROR',
      provider: context.adapter.provider,
      operation: 'TTS',
      message: `${context.adapter.provider} adapter is missing a TTS implementation.`,
    });
  }

  return context.adapter.generateAudioBriefing({
    text: request.text,
    config: context.config,
  });
};

export const getRegisteredProviders = (): string[] => {
  return getRegisteredProviderIds();
};
