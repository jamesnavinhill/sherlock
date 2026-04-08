import type {
  AgentAction,
  ArtifactSection,
  ArtifactType,
  ChatAttachment,
  ChatMentionReference,
  ChatDraftArtifact,
  ChatMessage,
  ChatSession,
  FollowUp,
  InvestigationLaunchRequest,
  Artifact,
  Signal,
  WorkspaceContextBundle,
  WorkspaceContextSnippet,
} from '@/types';
import type { ChatStreamEvent } from '../providers/types';
import {
  buildArtifactFollowUps,
  buildArtifactSections,
  getWorkspaceDisplayTitle,
  getDomainPackById,
  getDomainPackForScope,
  getLabelProfileById,
  getPurposeProfileById,
} from '../../domain';
import { createLocalId } from '../../utils/id';
import { chatWithProviderRouter, streamChatWithProviderRouter } from '../providers';
import { WorkspaceSearchRepository } from '../db/repositories/WorkspaceSearchRepository';
import { getScopeById } from '../../data/presets';
import { getChatLaunchContextFromSession } from './launchContext';
import { mapMentionToWorkspaceContextSnippet } from './mentions';

const toProviderMessages = (messages: ChatMessage[]) =>
  messages
    .filter(
      (message) =>
        message.role === 'user' ||
        message.role === 'assistant' ||
        message.role === 'system' ||
        message.role === 'tool'
    )
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

const summarizeText = (value: string, max = 220): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}...`;
};

const deriveTitleFromContent = (value: string, fallback: string): string => {
  const cleaned = value
    .replace(/^#+\s*/gm, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return summarizeText(cleaned || fallback, 72);
};

const buildAttachments = (
  messageId: string,
  snippets: WorkspaceContextSnippet[],
  citations: string[],
  sourceCitations?: Array<{ url: string; title?: string; content?: string }>
): ChatAttachment[] => {
  const referenced = citations.length
    ? snippets.filter((snippet) => citations.includes(snippet.id))
    : snippets.slice(0, Math.min(3, snippets.length));

  const workspaceAttachments = referenced.map((snippet) => ({
    id: createLocalId('chat-attachment'),
    messageId,
    kind: snippet.kind,
    title: snippet.title,
    refId: snippet.refId,
    refKind: snippet.refKind,
    snippet: snippet.snippet,
    metadata: snippet.metadata,
    createdAt: Date.now(),
  }));

  const sourceAttachments = (sourceCitations || []).map((citation) => ({
    id: createLocalId('chat-attachment'),
    messageId,
    kind: 'SOURCE' as const,
    title: citation.title || citation.url,
    refKind: 'SOURCE',
    snippet: citation.content,
    metadata: {
      url: citation.url,
    },
    createdAt: Date.now(),
  }));

  return [...workspaceAttachments, ...sourceAttachments];
};

const createArtifactAttachment = (
  messageId: string,
  report: Pick<Artifact, 'id' | 'topic' | 'summary' | 'artifactType'>
): ChatAttachment => ({
  id: createLocalId('chat-attachment'),
  messageId,
  kind: 'REPORT',
  title: report.topic,
  refId: report.id,
  refKind: 'REPORT',
  snippet: report.summary,
  metadata: {
    artifactType: report.artifactType,
  },
  createdAt: Date.now(),
});

const createSignalAttachment = (messageId: string, signal: Signal): ChatAttachment => ({
  id: createLocalId('chat-attachment'),
  messageId,
  kind: 'SIGNAL',
  title: signal.source || signal.type,
  refId: signal.id,
  refKind: 'SIGNAL',
  snippet: signal.content,
  metadata: {
    url: signal.url,
    threatLevel: signal.threatLevel,
  },
  createdAt: Date.now(),
});

const resolveRunProfile = (
  session: ChatSession,
  workspace: WorkspaceContextBundle['workspace']
) => {
  const scope = getScopeById(workspace.scopeId || '');
  const pack =
    getDomainPackById(session.packId || workspace.packId || '') || getDomainPackForScope(scope);
  const purpose = getPurposeProfileById(
    session.purposeId || workspace.purposeId || pack.defaultPurposeId
  );
  const labelProfile = getLabelProfileById(workspace.labelProfileId || pack.labelProfileId);

  return { pack, purpose, labelProfile };
};

const mergeContextSnippets = (...groups: WorkspaceContextSnippet[][]): WorkspaceContextSnippet[] => {
  const seen = new Set<string>();
  const merged: WorkspaceContextSnippet[] = [];

  groups.flat().forEach((snippet) => {
    if (seen.has(snippet.id)) return;
    seen.add(snippet.id);
    merged.push(snippet);
  });

  return merged;
};

const buildMentionContext = (mentions: ChatMentionReference[] | undefined): WorkspaceContextSnippet[] =>
  (mentions || []).map((mention) => mapMentionToWorkspaceContextSnippet(mention));

const buildArtifactSources = (message: ChatMessage): Artifact['sources'] =>
  (message.attachments || [])
    .filter((attachment) => attachment.kind === 'SOURCE')
    .map((attachment) => {
      const url =
        typeof attachment.metadata?.url === 'string' ? attachment.metadata.url : undefined;
      return url
        ? {
            title: attachment.title,
            url,
          }
        : null;
    })
    .filter((entry): entry is { title: string; url: string } => !!entry);

const buildArtifactEvidenceFromMessage = (
  message: ChatMessage
): NonNullable<Artifact['evidence']> =>
  (message.attachments || []).map((attachment, index) => ({
    id: createLocalId('chat-evidence'),
    kind: attachment.kind === 'SOURCE' ? 'SOURCE' : 'FINDING',
    title: attachment.title,
    summary: attachment.snippet || attachment.title,
    sourceTitle: attachment.title,
    sourceUrl: typeof attachment.metadata?.url === 'string' ? attachment.metadata.url : undefined,
    metadata: attachment.metadata,
    order: index,
  }));

const buildDraftSectionsFromMessage = (message: ChatMessage): ArtifactSection[] => {
  const citationItems = (message.attachments || []).map((attachment) =>
    attachment.snippet ? `${attachment.title}: ${attachment.snippet}` : attachment.title
  );

  return buildArtifactSections({
    sections: [
      {
        kind: 'EXECUTIVE_SUMMARY',
        title: 'Chat Draft',
        content: message.content,
      },
      citationItems.length > 0
        ? {
            kind: 'EVIDENCE',
            title: 'Grounding',
            items: citationItems,
          }
        : null,
    ].filter(Boolean),
    summary: summarizeText(message.content, 320),
  });
};

export interface RunWorkspaceChatTurnParams {
  session: ChatSession;
  messages: ChatMessage[];
  query: string;
  mentions?: ChatMentionReference[];
  assistantMessageId: string;
}

export interface StreamWorkspaceChatTurnParams extends RunWorkspaceChatTurnParams {
  signal?: AbortSignal;
  onStreamEvent?: (event: ChatStreamEvent) => void;
}

export interface WorkspaceChatTurnResult {
  assistantMessageId: string;
  assistantMessage: Pick<ChatMessage, 'content' | 'citations' | 'metadata'>;
  attachments: ChatAttachment[];
  action: AgentAction;
  contextBundle: WorkspaceContextBundle;
  suggestedTitle?: string;
}

export const runWorkspaceChatTurn = async (
  params: RunWorkspaceChatTurnParams
): Promise<WorkspaceChatTurnResult> => {
  const contextBundle = await WorkspaceSearchRepository.getWorkspaceContextBundle(
    params.session.workspaceId,
    params.query,
    { limit: 6 }
  );
  const mentionedContext = buildMentionContext(params.mentions);
  const retrievedContext = mergeContextSnippets(mentionedContext, contextBundle.snippets);

  const response = await chatWithProviderRouter({
    workspace: contextBundle.workspace,
    configOverride: {
      provider: params.session.provider,
      modelId: params.session.modelId,
    },
    packId: params.session.packId || contextBundle.workspace.packId,
    purposeId: params.session.purposeId || contextBundle.workspace.purposeId,
    messages: toProviderMessages(params.messages),
    workspaceSummary: contextBundle.summary,
    recentArtifacts: contextBundle.recentArtifacts.map((artifact) => ({
      id: artifact.id,
      topic: artifact.topic,
      summary: artifact.summary,
      dateStr: artifact.dateStr,
    })),
    recentSignals: contextBundle.recentSignals.map((signal) => ({
      content: signal.content,
      sourceName: signal.source,
      timestamp: signal.timestamp,
      type: signal.type,
    })),
    mentionedContext,
    retrievedContext,
  });

  const attachments = buildAttachments(params.assistantMessageId, retrievedContext, response.citations, response.sourceCitations);
  const now = Date.now();

  return {
    assistantMessageId: params.assistantMessageId,
    assistantMessage: {
      content: response.content,
      citations: response.citations,
      metadata: {
        provider: response.provider,
        modelId: response.modelId,
        rawText: response.rawText,
        suggestedTitle: response.suggestedTitle,
        warnings: response.warnings,
        provenance: response.provenance,
      },
    },
    attachments,
    action: {
      id: createLocalId('chat-action'),
      sessionId: params.session.id,
      type: 'SEARCH_WORKSPACE',
      status: 'COMPLETED',
      input: {
        query: params.query,
      },
      result: {
        retrievedSnippetIds: retrievedContext.map((snippet) => snippet.id),
        mentionedSnippetIds: mentionedContext.map((snippet) => snippet.id),
        citedSnippetIds: response.citations,
      },
      createdAt: now,
      updatedAt: now,
    },
    contextBundle,
    suggestedTitle: response.suggestedTitle,
  };
};

export const streamWorkspaceChatTurn = async (
  params: StreamWorkspaceChatTurnParams
): Promise<WorkspaceChatTurnResult> => {
  const contextBundle = await WorkspaceSearchRepository.getWorkspaceContextBundle(
    params.session.workspaceId,
    params.query,
    { limit: 6 }
  );
  const mentionedContext = buildMentionContext(params.mentions);
  const retrievedContext = mergeContextSnippets(mentionedContext, contextBundle.snippets);

  const response = await streamChatWithProviderRouter(
    {
      workspace: contextBundle.workspace,
      configOverride: {
        provider: params.session.provider,
        modelId: params.session.modelId,
      },
      packId: params.session.packId || contextBundle.workspace.packId,
      purposeId: params.session.purposeId || contextBundle.workspace.purposeId,
      messages: toProviderMessages(params.messages),
      workspaceSummary: contextBundle.summary,
      recentArtifacts: contextBundle.recentArtifacts.map((artifact) => ({
        id: artifact.id,
        topic: artifact.topic,
        summary: artifact.summary,
        dateStr: artifact.dateStr,
      })),
      recentSignals: contextBundle.recentSignals.map((signal) => ({
        content: signal.content,
        sourceName: signal.source,
        timestamp: signal.timestamp,
        type: signal.type,
      })),
      mentionedContext,
      retrievedContext,
    },
    {
      signal: params.signal,
      onEvent: params.onStreamEvent,
    }
  );

  const attachments = buildAttachments(params.assistantMessageId, retrievedContext, response.citations, response.sourceCitations);
  const now = Date.now();

  return {
    assistantMessageId: params.assistantMessageId,
    assistantMessage: {
      content: response.content,
      citations: response.citations,
      metadata: {
        provider: response.provider,
        modelId: response.modelId,
        rawText: response.rawText,
        suggestedTitle: response.suggestedTitle,
        warnings: response.warnings,
        provenance: response.provenance,
      },
    },
    attachments,
    action: {
      id: createLocalId('chat-action'),
      sessionId: params.session.id,
      type: 'SEARCH_WORKSPACE',
      status: 'COMPLETED',
      input: {
        query: params.query,
      },
      result: {
        retrievedSnippetIds: retrievedContext.map((snippet) => snippet.id),
        mentionedSnippetIds: mentionedContext.map((snippet) => snippet.id),
        citedSnippetIds: response.citations,
      },
      createdAt: now,
      updatedAt: now,
    },
    contextBundle,
    suggestedTitle: response.suggestedTitle,
  };
};

export const fetchArtifactSummaryForChat = async (params: {
  session: ChatSession;
  reportId: string;
}): Promise<{ message: ChatMessage; action: AgentAction }> => {
  const report = await WorkspaceSearchRepository.getArtifactSummary(
    params.session.workspaceId,
    params.reportId
  );
  const now = Date.now();
  const messageId = createLocalId('chat-message');

  return {
    message: {
      id: messageId,
      sessionId: params.session.id,
      role: 'tool',
      content: `Fetched saved artifact summary for **${report.topic}**.\n\n${report.summary}`,
      status: 'COMPLETED',
      attachments: [createArtifactAttachment(messageId, report)],
      metadata: {
        actionType: 'FETCH_ARTIFACT_SUMMARY',
        reportId: report.id,
      },
      createdAt: now,
      updatedAt: now,
    },
    action: {
      id: createLocalId('chat-action'),
      sessionId: params.session.id,
      messageId,
      type: 'FETCH_ARTIFACT_SUMMARY',
      status: 'COMPLETED',
      input: {
        reportId: report.id,
      },
      result: {
        topic: report.topic,
        artifactType: report.artifactType,
      },
      createdAt: now,
      updatedAt: now,
    },
  };
};

export const fetchFullArtifactTextForChat = async (params: {
  session: ChatSession;
  reportId: string;
}): Promise<{ message: ChatMessage; action: AgentAction }> => {
  const report = await WorkspaceSearchRepository.getFullArtifactText(
    params.session.workspaceId,
    params.reportId
  );
  const now = Date.now();
  const messageId = createLocalId('chat-message');
  const sectionText = (report.sections || [])
    .map((section) => {
      const parts = [section.content || '', ...(section.items || [])].filter(Boolean);
      return parts.length > 0 ? `### ${section.title}\n${parts.join('\n')}` : '';
    })
    .filter(Boolean)
    .join('\n\n');

  return {
    message: {
      id: messageId,
      sessionId: params.session.id,
      role: 'tool',
      content: `Fetched full artifact text for **${report.topic}**.\n\n${sectionText || report.rawText || report.summary}`,
      status: 'COMPLETED',
      attachments: [
        {
          ...createArtifactAttachment(messageId, report),
          snippet: summarizeText(sectionText || report.rawText || report.summary, 280),
        },
      ],
      metadata: {
        actionType: 'FETCH_FULL_ARTIFACT_TEXT',
        reportId: report.id,
      },
      createdAt: now,
      updatedAt: now,
    },
    action: {
      id: createLocalId('chat-action'),
      sessionId: params.session.id,
      messageId,
      type: 'FETCH_FULL_ARTIFACT_TEXT',
      status: 'COMPLETED',
      input: {
        reportId: report.id,
      },
      result: {
        topic: report.topic,
        sectionCount: report.sections?.length || 0,
      },
      createdAt: now,
      updatedAt: now,
    },
  };
};

export const fetchRecentSignalsForChat = async (params: {
  session: ChatSession;
  limit?: number;
}): Promise<{ message: ChatMessage; action: AgentAction }> => {
  const signals = await WorkspaceSearchRepository.getRecentSignals(
    params.session.workspaceId,
    params.limit || 5
  );
  const now = Date.now();
  const messageId = createLocalId('chat-message');

  return {
    message: {
      id: messageId,
      sessionId: params.session.id,
      role: 'tool',
      content: signals.length
        ? `Fetched recent workspace signals.\n\n${signals
            .map(
              (signal) =>
                `- [${signal.type}] **${signal.source || signal.type}**: ${signal.content}`
            )
            .join('\n')}`
        : 'Fetched recent workspace signals.\n\nNo saved signals are available yet.',
      status: 'COMPLETED',
      attachments: signals.map((signal) => createSignalAttachment(messageId, signal)),
      metadata: {
        actionType: 'FETCH_RECENT_SIGNALS',
        count: signals.length,
      },
      createdAt: now,
      updatedAt: now,
    },
    action: {
      id: createLocalId('chat-action'),
      sessionId: params.session.id,
      messageId,
      type: 'FETCH_RECENT_SIGNALS',
      status: 'COMPLETED',
      input: {
        limit: params.limit || 5,
      },
      result: {
        signalIds: signals.map((signal) => signal.id),
      },
      createdAt: now,
      updatedAt: now,
    },
  };
};

export const buildArtifactDraftFromChatMessage = (params: {
  session: ChatSession;
  workspace: WorkspaceContextBundle['workspace'];
  message: ChatMessage;
  title?: string;
  artifactType?: ArtifactType;
}): { draft: ChatDraftArtifact; report: Artifact; action: AgentAction } => {
  const now = Date.now();
  const { purpose, labelProfile } = resolveRunProfile(params.session, params.workspace);
  const artifactType = params.artifactType || purpose.recommendedArtifactType;
  const title =
    params.title?.trim() ||
    deriveTitleFromContent(
      params.message.content,
      `${labelProfile.artifactLabel}: ${getWorkspaceDisplayTitle(params.workspace)}`
    );
  const draft: ChatDraftArtifact = {
    id: createLocalId('chat-draft'),
    workspaceId: params.workspace.id,
    sourceMessageId: params.message.id,
    title,
    content: params.message.content,
    artifactType,
    citations: params.message.citations,
    metadata: {
      sessionId: params.session.id,
      provider: params.session.provider,
      modelId: params.session.modelId,
    },
    createdAt: now,
  };
  const reportFollowUps: FollowUp[] = buildArtifactFollowUps({
    followUps: [],
  });
  const report: Artifact = {
    id: createLocalId('rep'),
    workspaceId: params.workspace.id,
    topic: draft.title,
    dateStr: new Date(now).toLocaleDateString(),
    summary: summarizeText(params.message.content, 320),
    agendas: [],
    leads: [],
    followUps: reportFollowUps,
    sections: buildDraftSectionsFromMessage(params.message),
    artifactType,
    entities: [],
    sources: buildArtifactSources(params.message),
    evidence: buildArtifactEvidenceFromMessage(params.message),
    provenance: params.message.metadata?.provenance as Artifact['provenance'],
    rawText: JSON.stringify(
      {
        sourceMessageId: params.message.id,
        content: params.message.content,
        citations: params.message.citations || [],
        attachments: params.message.attachments || [],
      },
      null,
      2
    ),
    packId: params.session.packId || params.workspace.packId,
    purposeId: params.session.purposeId || purpose.id,
    labelProfileId: params.workspace.labelProfileId || labelProfile.id,
    metadata: {
      source: 'CHAT',
      sessionId: params.session.id,
      sourceMessageId: params.message.id,
      draftArtifactId: draft.id,
    },
    config: {
      provider: params.session.provider,
      modelId: params.session.modelId,
      packId: params.session.packId || params.workspace.packId,
      purposeId: params.session.purposeId || purpose.id,
      artifactType,
      labelProfileId: params.workspace.labelProfileId || labelProfile.id,
    },
  };

  return {
    draft,
    report,
    action: {
      id: createLocalId('chat-action'),
      sessionId: params.session.id,
      messageId: params.message.id,
      type: 'CREATE_ARTIFACT_DRAFT',
      status: 'COMPLETED',
      input: {
        sourceMessageId: params.message.id,
        artifactType,
        title: draft.title,
      },
      result: {
        artifactId: report.id,
        workspaceId: params.workspace.id,
      },
      createdAt: now,
      updatedAt: now,
    },
  };
};

export const buildArtifactAppendFromChatMessage = (params: {
  session: ChatSession;
  report: Pick<Artifact, 'id' | 'topic'>;
  message: ChatMessage;
}): { section: ArtifactSection; action: AgentAction } => {
  const now = Date.now();
  const section: ArtifactSection = {
    id: createLocalId('chat-section'),
    kind: 'CUSTOM',
    title: `Chat Note ${new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    content: params.message.content,
    items:
      params.message.attachments?.map((attachment) =>
        attachment.snippet ? `${attachment.title}: ${attachment.snippet}` : attachment.title
      ) || undefined,
    order: now,
  };

  return {
    section,
    action: {
      id: createLocalId('chat-action'),
      sessionId: params.session.id,
      messageId: params.message.id,
      type: 'APPEND_NOTE_TO_ARTIFACT',
      status: 'COMPLETED',
      input: {
        reportId: params.report.id,
        reportTopic: params.report.topic,
      },
      result: {
        sectionId: section.id,
      },
      createdAt: now,
      updatedAt: now,
    },
  };
};

export const buildFollowUpRunFromChatMessage = (params: {
  session: ChatSession;
  workspace: WorkspaceContextBundle['workspace'];
  message: ChatMessage;
  topic?: string;
  workspaceIntent?: 'CURRENT' | 'NEW';
}): { request: InvestigationLaunchRequest; action: AgentAction; suggestedTopic: string } => {
  const now = Date.now();
  const { pack, purpose, labelProfile } = resolveRunProfile(params.session, params.workspace);
  const launchContext = getChatLaunchContextFromSession(params.session);
  const suggestedTopic = deriveTitleFromContent(
    params.message.content,
    `Follow up on ${labelProfile.artifactLabel.toLowerCase()}`
  );

  const request: InvestigationLaunchRequest = {
    topic: params.topic?.trim() || suggestedTopic,
    parentContext:
      (params.workspaceIntent || 'CURRENT') === 'CURRENT'
        ? {
            topic: getWorkspaceDisplayTitle(params.workspace),
            summary:
              params.workspace.description || `${getWorkspaceDisplayTitle(params.workspace)} workspace`,
          }
        : undefined,
    configOverride: {
      provider: params.session.provider,
      modelId: params.session.modelId,
    },
    packId: params.session.packId || pack.id,
    purposeId: params.session.purposeId || purpose.id,
    artifactType: purpose.recommendedArtifactType,
    labelProfileId: params.workspace.labelProfileId || pack.labelProfileId,
    launchSource: 'CHAT_FOLLOW_UP',
    sourceSignalId: launchContext?.signalId || launchContext?.headlineId,
    parentArtifactId: params.session.sourceArtifactId || launchContext?.sourceArtifactId,
    switchToView: true,
  };

  return {
    request,
    suggestedTopic: request.topic,
    action: {
      id: createLocalId('chat-action'),
      sessionId: params.session.id,
      messageId: params.message.id,
      type: 'CREATE_FOLLOW_UP_RUN',
      status: 'COMPLETED',
      input: {
        topic: request.topic,
        workspaceIntent: params.workspaceIntent || 'CURRENT',
      },
      result: {
        packId: request.packId,
        purposeId: request.purposeId,
      },
      createdAt: now,
      updatedAt: now,
    },
  };
};
