import type {
    AgentAction,
    Artifact,
    CaseTemplate,
    ChatMessage,
    ChatSession,
    Headline,
    ManualConnection,
    ManualNode,
    WorkspaceDataBackup,
    WorkspaceRun,
} from '@/types';

export const WORKSPACE_DATA_BACKUP_KIND = 'SHERLOCK_WORKSPACE_DATA';
export const WORKSPACE_DATA_BACKUP_VERSION = 1 as const;

type LegacyWorkspaceDataBackup = Partial<{
    cases: unknown;
    case: unknown;
    archives: unknown;
    reports: unknown;
    tasks: unknown;
    chatSessions: unknown;
    chatMessagesBySessionId: unknown;
    chatActionsBySessionId: unknown;
    headlines: unknown;
    templates: unknown;
    manualNodes: unknown;
    manualLinks: unknown;
    timestamp: unknown;
}>;

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const flattenSessionRecord = <T extends { sessionId: string }>(value: unknown): T[] => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return [];
    }

    return Object.values(value as Record<string, unknown>).flatMap((entry) => asArray<T>(entry));
};

const withWorkspaceLink = (run: WorkspaceRun): WorkspaceRun => ({
    ...run,
    workspaceId: run.workspaceId || run.report?.caseId,
});

export const groupChatMessagesBySessionId = (
    messages: ChatMessage[]
): Record<string, ChatMessage[]> =>
    messages.reduce<Record<string, ChatMessage[]>>((acc, message) => {
        const next = acc[message.sessionId] || [];
        next.push(message);
        acc[message.sessionId] = next;
        return acc;
    }, {});

export const groupChatActionsBySessionId = (
    actions: AgentAction[]
): Record<string, AgentAction[]> =>
    actions.reduce<Record<string, AgentAction[]>>((acc, action) => {
        const next = acc[action.sessionId] || [];
        next.push(action);
        acc[action.sessionId] = next;
        return acc;
    }, {});

export const buildWorkspaceLinkedGraphReferenceIds = (
    workspaceId: string,
    artifactIds: string[]
): Set<string> =>
    new Set([
        workspaceId,
        `case-${workspaceId}`,
        ...artifactIds,
        ...artifactIds.map((artifactId) => `case-${artifactId}`),
    ]);

export const filterManualGraphForWorkspaceRemoval = (input: {
    manualNodes: ManualNode[];
    manualLinks: ManualConnection[];
    hiddenNodeIds?: string[];
    flaggedNodeIds?: string[];
    workspaceId: string;
    artifactIds: string[];
}) => {
    const removableIds = buildWorkspaceLinkedGraphReferenceIds(input.workspaceId, input.artifactIds);

    return {
        manualNodes: input.manualNodes.filter((node) => !removableIds.has(node.id)),
        manualLinks: input.manualLinks.filter(
            (link) => !removableIds.has(link.source) && !removableIds.has(link.target)
        ),
        hiddenNodeIds: (input.hiddenNodeIds || []).filter((id) => !removableIds.has(id)),
        flaggedNodeIds: (input.flaggedNodeIds || []).filter((id) => !removableIds.has(id)),
    };
};

export const buildWorkspaceDataBackup = (input: {
    workspaces: WorkspaceDataBackup['workspaces'];
    artifacts: Artifact[];
    runs: WorkspaceRun[];
    chatSessions: ChatSession[];
    chatMessagesBySessionId: Record<string, ChatMessage[]>;
    chatActionsBySessionId: Record<string, AgentAction[]>;
    headlines: Headline[];
    manualNodes: ManualNode[];
    manualLinks: ManualConnection[];
    templates: CaseTemplate[];
    exportedAt?: string;
}): WorkspaceDataBackup => ({
    workspaces: input.workspaces,
    artifacts: input.artifacts,
    runs: input.runs.map(withWorkspaceLink),
    chat: {
        sessions: input.chatSessions,
        messages: Object.values(input.chatMessagesBySessionId).flat(),
        actions: Object.values(input.chatActionsBySessionId).flat(),
    },
    signals: {
        headlines: input.headlines,
    },
    graph: {
        manualNodes: input.manualNodes,
        manualLinks: input.manualLinks,
    },
    templates: input.templates,
    metadata: {
        kind: WORKSPACE_DATA_BACKUP_KIND,
        formatVersion: WORKSPACE_DATA_BACKUP_VERSION,
        exportedAt: input.exportedAt || new Date().toISOString(),
    },
});

export const normalizeWorkspaceDataBackup = (value: unknown): WorkspaceDataBackup => {
    if (!value || typeof value !== 'object') {
        throw new Error('Invalid workspace-data backup format.');
    }

    const payload = value as Partial<WorkspaceDataBackup> & LegacyWorkspaceDataBackup;
    const metadata = payload.metadata;
    const looksCanonical = Array.isArray(payload.workspaces) && Array.isArray(payload.artifacts);
    const looksLegacy = Array.isArray(payload.cases) && Array.isArray(payload.archives);
    const looksWorkspaceExport = !!payload.case && Array.isArray(payload.reports);

    if (!looksCanonical && !looksLegacy && !looksWorkspaceExport) {
        throw new Error('Invalid workspace-data backup format.');
    }

    const workspaces = looksCanonical
        ? asArray<WorkspaceDataBackup['workspaces'][number]>(payload.workspaces)
        : looksWorkspaceExport
          ? [payload.case as WorkspaceDataBackup['workspaces'][number]].filter(Boolean)
          : asArray(payload.cases);
    const artifacts = looksCanonical
        ? asArray<Artifact>(payload.artifacts)
        : looksWorkspaceExport
          ? asArray<Artifact>(payload.reports)
          : asArray<Artifact>(payload.archives);
    const runs = (
        looksCanonical
            ? asArray<WorkspaceRun>(payload.runs)
            : looksWorkspaceExport
              ? []
              : asArray<WorkspaceRun>(payload.tasks)
    ).map(withWorkspaceLink);
    const sessions = looksCanonical
        ? asArray<ChatSession>(payload.chat?.sessions)
        : looksWorkspaceExport
          ? []
          : asArray<ChatSession>(payload.chatSessions);
    const messages = looksCanonical
        ? asArray<ChatMessage>(payload.chat?.messages)
        : looksWorkspaceExport
          ? []
        : flattenSessionRecord<ChatMessage>(payload.chatMessagesBySessionId);
    const actions = looksCanonical
        ? asArray<AgentAction>(payload.chat?.actions)
        : looksWorkspaceExport
          ? []
        : flattenSessionRecord<AgentAction>(payload.chatActionsBySessionId);
    const headlines = looksCanonical
        ? asArray<Headline>(payload.signals?.headlines)
        : looksWorkspaceExport
          ? []
        : asArray<Headline>(payload.headlines);
    const manualNodes = looksCanonical
        ? asArray<ManualNode>(payload.graph?.manualNodes)
        : looksWorkspaceExport
          ? []
        : asArray<ManualNode>(payload.manualNodes);
    const manualLinks = looksCanonical
        ? asArray<ManualConnection>(payload.graph?.manualLinks)
        : looksWorkspaceExport
          ? []
        : asArray<ManualConnection>(payload.manualLinks);
    const templates = looksWorkspaceExport ? [] : asArray<CaseTemplate>(payload.templates);
    const exportedAt =
        typeof metadata?.exportedAt === 'string'
            ? metadata.exportedAt
            : typeof payload.exportedAt === 'string'
              ? payload.exportedAt
            : typeof payload.timestamp === 'string'
              ? payload.timestamp
              : new Date().toISOString();

    return {
        workspaces,
        artifacts,
        runs,
        chat: {
            sessions,
            messages,
            actions,
        },
        signals: {
            headlines,
        },
        graph: {
            manualNodes,
            manualLinks,
        },
        templates,
        metadata: {
            kind: WORKSPACE_DATA_BACKUP_KIND,
            formatVersion: WORKSPACE_DATA_BACKUP_VERSION,
            exportedAt,
        },
    };
};
