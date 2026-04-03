import type {
    AgentAction,
    ChatAttachment,
    ChatMessage,
    ChatSession,
    WorkspaceContextBundle,
} from '@/types';
import { createLocalId } from '../../utils/id';
import { chatWithProviderRouter } from '../providers';
import { WorkspaceSearchRepository } from '../db/repositories/WorkspaceSearchRepository';

const toProviderMessages = (messages: ChatMessage[]) =>
    messages
        .filter((message) => message.role === 'user' || message.role === 'assistant' || message.role === 'system')
        .map((message) => ({
            role: message.role,
            content: message.content,
        }));

const buildAttachments = (
    messageId: string,
    contextBundle: WorkspaceContextBundle,
    citations: string[]
): ChatAttachment[] => {
    const referenced = citations.length
        ? contextBundle.snippets.filter((snippet) => citations.includes(snippet.id))
        : contextBundle.snippets.slice(0, Math.min(3, contextBundle.snippets.length));

    return referenced.map((snippet) => ({
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
};

export interface RunWorkspaceChatTurnParams {
    session: ChatSession;
    messages: ChatMessage[];
    query: string;
    assistantMessageId: string;
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
        recentHeadlines: contextBundle.recentHeadlines.map((headline) => ({
            content: headline.content,
            sourceName: headline.source,
            timestamp: headline.timestamp,
            type: headline.type,
        })),
        retrievedContext: contextBundle.snippets,
    });

    const attachments = buildAttachments(params.assistantMessageId, contextBundle, response.citations);
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
                retrievedSnippetIds: contextBundle.snippets.map((snippet) => snippet.id),
                citedSnippetIds: response.citations,
            },
            createdAt: now,
            updatedAt: now,
        },
        contextBundle,
        suggestedTitle: response.suggestedTitle,
    };
};
