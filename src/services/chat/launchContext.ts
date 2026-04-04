import type { ChatAttachment, ChatLaunchContext, ChatMessage, ChatOpenRequest, ChatSession, Headline, InvestigationReport } from '@/types';
import { createLocalId } from '../../utils/id';
import { cleanEntityName } from '../../utils/text';

const summarizeText = (value: string, max = 220): string => {
    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}...`;
};

const createReportAttachment = (
    messageId: string,
    report: InvestigationReport
): ChatAttachment | null => {
    if (!report.id) return null;

    return {
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
    };
};

const createHeadlineAttachment = (
    messageId: string,
    headline: Headline
): ChatAttachment => ({
    id: createLocalId('chat-attachment'),
    messageId,
    kind: 'HEADLINE',
    title: headline.source || headline.type,
    refId: headline.id,
    refKind: 'HEADLINE',
    snippet: headline.content,
    metadata: {
        url: headline.url,
        threatLevel: headline.threatLevel,
    },
    createdAt: Date.now(),
});

export const isChatLaunchContext = (value: unknown): value is ChatLaunchContext => {
    if (!value || typeof value !== 'object') return false;

    const candidate = value as Record<string, unknown>;
    return (
        candidate.sourceReportId === undefined || typeof candidate.sourceReportId === 'string'
    ) && (
        candidate.entityName === undefined || typeof candidate.entityName === 'string'
    ) && (
        candidate.headlineId === undefined || typeof candidate.headlineId === 'string'
    );
};

export const areChatLaunchContextsEqual = (
    left: ChatLaunchContext | null | undefined,
    right: ChatLaunchContext | null | undefined
): boolean =>
    (left?.sourceReportId || '') === (right?.sourceReportId || '')
    && (left?.entityName || '') === (right?.entityName || '')
    && (left?.headlineId || '') === (right?.headlineId || '');

export const getChatLaunchContextFromSession = (
    session: ChatSession | null | undefined
): ChatLaunchContext | null => {
    const metadata = session?.metadata as { launchContext?: unknown } | undefined;
    return isChatLaunchContext(metadata?.launchContext) ? metadata.launchContext : null;
};

export const hasLaunchContextPrimer = (
    messages: ChatMessage[],
    launchContext: ChatLaunchContext
): boolean =>
    messages.some((message) => {
        const metadata = message.metadata as { actionType?: unknown; launchContext?: unknown } | undefined;
        return (
            metadata?.actionType === 'PIN_LAUNCH_CONTEXT'
            && isChatLaunchContext(metadata.launchContext)
            && areChatLaunchContextsEqual(metadata.launchContext, launchContext)
        );
    });

export const isGuidedChatSession = (session: ChatSession): boolean =>
    (session.metadata as { sessionMode?: unknown } | undefined)?.sessionMode === 'GUIDED';

export const buildChatSessionMetadata = (
    metadata: Record<string, unknown> | undefined,
    launchContext: ChatLaunchContext | undefined
): Record<string, unknown> | undefined => {
    if (!launchContext) return metadata;

    return {
        ...(metadata || {}),
        launchContext,
    };
};

export const findReusableChatSession = (
    sessions: ChatSession[],
    request: ChatOpenRequest
): ChatSession | null => {
    const workspaceSessions = sessions
        .filter((session) => session.workspaceId === request.workspaceId)
        .sort((left, right) => right.updatedAt - left.updatedAt);

    if (request.sessionId) {
        return workspaceSessions.find((session) => session.id === request.sessionId) || null;
    }

    if (request.launchContext) {
        return (
            workspaceSessions.find((session) =>
                areChatLaunchContextsEqual(
                    getChatLaunchContextFromSession(session),
                    request.launchContext
                )
            ) || null
        );
    }

    const nonguidedSession = workspaceSessions.find((session) => !isGuidedChatSession(session));
    return nonguidedSession || workspaceSessions[0] || null;
};

export const buildLaunchContextPrimer = (params: {
    session: ChatSession;
    launchContext: ChatLaunchContext;
    reports: InvestigationReport[];
    headlines: Headline[];
}): ChatMessage | null => {
    const now = Date.now();
    const messageId = createLocalId('chat-message');

    if (params.launchContext.sourceReportId) {
        const report = params.reports.find((entry) => entry.id === params.launchContext.sourceReportId);
        if (!report) return null;

        const attachment = createReportAttachment(messageId, report);
        return {
            id: messageId,
            sessionId: params.session.id,
            role: 'tool',
            content: `Pinned artifact context for **${report.topic}**.\n\n${report.summary || 'No summary saved yet.'}`,
            status: 'COMPLETED',
            attachments: attachment ? [attachment] : [],
            metadata: {
                actionType: 'PIN_LAUNCH_CONTEXT',
                launchContext: params.launchContext,
            },
            createdAt: now,
            updatedAt: now,
        };
    }

    if (params.launchContext.entityName) {
        const cleanName = cleanEntityName(params.launchContext.entityName);
        const relatedReports = params.reports.filter((report) => {
            const entityMatch = (report.entities || []).some((entity) => {
                const name = typeof entity === 'string' ? entity : entity.name;
                return cleanEntityName(name) === cleanName;
            });

            if (entityMatch) return true;

            const sourceMatch = (report.sources || []).some((source) =>
                cleanEntityName(source.title) === cleanName
                || cleanEntityName(source.url || '').includes(cleanName)
            );

            if (sourceMatch) return true;

            const reportText = [
                report.summary,
                report.rawText,
                ...(report.sections || []).flatMap((section) => [
                    section.title,
                    section.content || '',
                    ...(section.items || []),
                ]),
            ]
                .filter(Boolean)
                .join(' ');

            return cleanEntityName(reportText).includes(cleanName);
        });

        const attachments = relatedReports
            .slice(0, 3)
            .map((report) => createReportAttachment(messageId, report))
            .filter((attachment): attachment is ChatAttachment => !!attachment);
        const mentionLines = relatedReports
            .slice(0, 3)
            .map((report) => `- **${report.topic}**: ${summarizeText(report.summary || report.rawText || 'No summary saved yet.')}`)
            .join('\n');

        return {
            id: messageId,
            sessionId: params.session.id,
            role: 'tool',
            content: relatedReports.length > 0
                ? `Pinned entity context for **${params.launchContext.entityName}**.\n\nFound in ${relatedReports.length} saved artifact(s):\n${mentionLines}`
                : `Pinned entity context for **${params.launchContext.entityName}**.\n\nNo direct saved artifact mentions were found yet in this workspace.`,
            status: 'COMPLETED',
            attachments,
            metadata: {
                actionType: 'PIN_LAUNCH_CONTEXT',
                launchContext: params.launchContext,
            },
            createdAt: now,
            updatedAt: now,
        };
    }

    if (params.launchContext.headlineId) {
        const headline = params.headlines.find((entry) => entry.id === params.launchContext.headlineId);
        if (!headline) return null;

        return {
            id: messageId,
            sessionId: params.session.id,
            role: 'tool',
            content: `Pinned signal context from **${headline.source || headline.type}**.\n\n${headline.content}`,
            status: 'COMPLETED',
            attachments: [createHeadlineAttachment(messageId, headline)],
            metadata: {
                actionType: 'PIN_LAUNCH_CONTEXT',
                launchContext: params.launchContext,
            },
            createdAt: now,
            updatedAt: now,
        };
    }

    return null;
};
