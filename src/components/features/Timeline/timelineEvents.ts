import type {
    AgentAction,
    ChatSession,
    Headline,
    InvestigationReport,
    InvestigationTask,
    TimelineEvent,
    TimelineQueryState,
    TimelineRange,
    TimelineTrack,
} from '@/types';
import { sanitizeDisplayTitle } from '../../../domain';
import { getChatLaunchContextFromSession, isGuidedChatSession } from '../../../services/chat/launchContext';

const FALLBACK_OCCURED_AT = 0;
const DEFAULT_TRACKS: TimelineTrack[] = ['SIGNAL', 'RUN', 'ARTIFACT'];
const HIGH_SIGNAL_CHAT_ACTIONS = new Set<AgentAction['type']>([
    'SEARCH_WORKSPACE',
    'CREATE_ARTIFACT_DRAFT',
    'APPEND_NOTE_TO_ARTIFACT',
    'CREATE_FOLLOW_UP_RUN',
]);

const summarize = (value: string | undefined, max = 140): string | undefined => {
    if (!value) return undefined;
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) return undefined;
    return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}...`;
};

const parseTimestamp = (value?: string): number => {
    if (!value) return FALLBACK_OCCURED_AT;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : FALLBACK_OCCURED_AT;
};

const buildSignalSearchText = (headline: Headline): string =>
    [headline.content, headline.source, headline.type, headline.threatLevel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

const buildArtifactSearchText = (artifact: InvestigationReport): string =>
    [
        artifact.topic,
        artifact.summary,
        artifact.artifactType,
        artifact.sources.map((source) => `${source.title} ${source.url}`).join(' '),
        artifact.entities.map((entity) => entity.name).join(' '),
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

const buildRunSearchText = (run: InvestigationTask): string =>
    [
        run.topic,
        run.status,
        run.config?.purposeName,
        run.config?.artifactType,
        run.config?.launchSource,
        run.config?.sourceSignalId,
        run.config?.parentArtifactId,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

const buildChatSessionSearchText = (session: ChatSession): string => {
    const launchContext = getChatLaunchContextFromSession(session);

    return [
        session.title,
        session.status,
        session.packId,
        session.purposeId,
        session.sourceReportId,
        launchContext?.sourceReportId,
        launchContext?.headlineId,
        launchContext?.entityName,
        isGuidedChatSession(session) ? 'guided session' : 'workspace chat',
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
};

const extractStringValues = (value: unknown): string[] => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) {
        return value.flatMap((entry) => extractStringValues(entry));
    }
    if (value && typeof value === 'object') {
        return Object.values(value).flatMap((entry) => extractStringValues(entry));
    }

    return [];
};

const buildChatActionSearchText = (action: AgentAction, session: ChatSession | undefined): string =>
    [
        session?.title,
        action.type,
        action.status,
        ...extractStringValues(action.input),
        ...extractStringValues(action.result),
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

const buildParentArtifactMap = (artifacts: InvestigationReport[], workspaceId: string) => {
    const scopedArtifacts = artifacts.filter((artifact) => artifact.caseId === workspaceId);
    return new Map(
        scopedArtifacts.map((artifact) => [sanitizeDisplayTitle(artifact.topic).toLowerCase(), artifact.id]).filter(
            (entry): entry is [string, string] => !!entry[1]
        )
    );
};

const inferArtifactForRun = (run: InvestigationTask, artifacts: InvestigationReport[], workspaceId: string) => {
    if (run.report?.id) return run.report.id;

    return artifacts.find(
        (artifact) =>
            artifact.caseId === workspaceId &&
            sanitizeDisplayTitle(artifact.topic).toLowerCase() === sanitizeDisplayTitle(run.topic).toLowerCase()
    )?.id;
};

const eventReferencesFocus = (event: TimelineEvent, focusedRefId: string) => {
    const metadataValues = event.metadata ? extractStringValues(event.metadata) : [];

    return (
        event.refId === focusedRefId
        || event.parentRefId === focusedRefId
        || metadataValues.includes(focusedRefId)
    );
};

export const buildWorkspaceTimelineEvents = (input: {
    workspaceId: string;
    artifacts: InvestigationReport[];
    runs: InvestigationTask[];
    signals: Headline[];
    chatSessions: ChatSession[];
    chatActionsBySessionId: Record<string, AgentAction[]>;
}): TimelineEvent[] => {
    const scopedArtifacts = input.artifacts.filter((artifact) => artifact.caseId === input.workspaceId);
    const parentArtifactMap = buildParentArtifactMap(input.artifacts, input.workspaceId);
    const artifactById = new Map(
        scopedArtifacts
            .filter((artifact): artifact is InvestigationReport & { id: string } => !!artifact.id)
            .map((artifact) => [artifact.id, artifact])
    );
    const sessionById = new Map(
        input.chatSessions
            .filter((session) => session.workspaceId === input.workspaceId)
            .map((session) => [session.id, session])
    );

    const signalEvents = input.signals
        .filter((headline) => headline.caseId === input.workspaceId)
        .map<TimelineEvent>((headline) => ({
            id: `signal-${headline.id}`,
            occurredAt: parseTimestamp(headline.timestamp),
            track: 'SIGNAL',
            type: 'SIGNAL_SAVED',
            workspaceId: input.workspaceId,
            title: summarize(headline.content, 84) || 'Saved signal',
            summary: `${headline.source || headline.type} signal saved to the workspace.`,
            refId: headline.id,
            refKind: 'SIGNAL',
            badges: [headline.type, headline.threatLevel],
            searchText: buildSignalSearchText(headline),
            metadata: {
                source: headline.source,
                url: headline.url,
                linkedArtifactId: headline.linkedReportId,
            },
        }));

    const runEvents = input.runs
        .filter((run) => run.workspaceId === input.workspaceId || run.report?.caseId === input.workspaceId)
        .flatMap<TimelineEvent>((run) => {
            const relatedArtifactId = run.config?.producedArtifactId || inferArtifactForRun(run, input.artifacts, input.workspaceId);
            const badges = [run.status, run.config?.artifactType, run.config?.purposeName].filter(
                (value): value is string => !!value
            );
            const summaryBase = summarize(run.parentContext?.summary, 120);
            const lineageSummary =
                run.config?.sourceSignalId
                    ? 'Run launched from a saved workspace signal.'
                    : run.config?.parentArtifactId
                      ? 'Run launched as a follow-up from a saved artifact.'
                      : undefined;

            const startEvent: TimelineEvent = {
                id: `run-start-${run.id}`,
                occurredAt: run.startTime || FALLBACK_OCCURED_AT,
                track: 'RUN',
                type: 'RUN_STARTED',
                workspaceId: input.workspaceId,
                title: sanitizeDisplayTitle(run.topic),
                summary: summaryBase || lineageSummary || 'Workspace run started.',
                refId: run.id,
                refKind: 'RUN',
                badges,
                searchText: buildRunSearchText(run),
                metadata: {
                    status: run.status,
                    relatedArtifactId,
                    launchSource: run.config?.launchSource,
                    artifactType: run.config?.artifactType,
                    purposeName: run.config?.purposeName,
                    sourceSignalId: run.config?.sourceSignalId,
                    parentArtifactId: run.config?.parentArtifactId,
                    parentRunId: run.config?.parentRunId,
                },
            };

            const terminalEvents: TimelineEvent[] = [];
            if (run.endTime && run.status === 'COMPLETED') {
                terminalEvents.push({
                    ...startEvent,
                    id: `run-complete-${run.id}`,
                    occurredAt: run.endTime,
                    type: 'RUN_COMPLETED',
                    summary: relatedArtifactId
                        ? 'Workspace run completed and produced a saved artifact.'
                        : 'Workspace run completed.',
                });
            }

            if (run.endTime && run.status === 'FAILED') {
                terminalEvents.push({
                    ...startEvent,
                    id: `run-failed-${run.id}`,
                    occurredAt: run.endTime,
                    type: 'RUN_FAILED',
                    summary: run.error || 'Workspace run failed.',
                });
            }

            return [startEvent, ...terminalEvents];
        });

    const artifactEvents = input.artifacts
        .filter((artifact) => artifact.caseId === input.workspaceId)
        .map<TimelineEvent>((artifact) => {
            const parentRefId = artifact.config?.parentArtifactId
                || (artifact.parentTopic
                    ? parentArtifactMap.get(sanitizeDisplayTitle(artifact.parentTopic).toLowerCase())
                    : undefined);
            const artifactSummary = artifact.config?.sourceSignalId
                ? 'Saved artifact created from a signal-driven run.'
                : artifact.config?.parentArtifactId
                  ? 'Saved artifact created from a follow-up artifact run.'
                  : summarize(artifact.summary, 160) || 'Saved artifact created.';

            return {
                id: `artifact-${artifact.id || sanitizeDisplayTitle(artifact.topic)}`,
                occurredAt: artifact.createdAt ?? FALLBACK_OCCURED_AT,
                track: 'ARTIFACT',
                type: 'ARTIFACT_CREATED',
                workspaceId: input.workspaceId,
                title: sanitizeDisplayTitle(artifact.topic),
                summary: artifactSummary,
                refId: artifact.id,
                refKind: 'ARTIFACT',
                parentRefId,
                badges: [artifact.artifactType || 'REPORT', artifact.purposeId].filter(
                    (value): value is string => !!value
                ),
                searchText: buildArtifactSearchText(artifact),
                metadata: {
                    sourceCount: artifact.sources.length,
                    entityCount: artifact.entities.length,
                    followUpCount: artifact.followUps?.length || artifact.leads.length,
                    sourceSignalId: artifact.config?.sourceSignalId,
                    parentArtifactId: artifact.config?.parentArtifactId,
                    sourceRunId: artifact.config?.sourceRunId,
                },
            };
        });

    const chatSessionEvents = input.chatSessions
        .filter((session) => session.workspaceId === input.workspaceId)
        .map<TimelineEvent>((session) => {
            const launchContext = getChatLaunchContextFromSession(session);
            const guided = isGuidedChatSession(session);
            const summary = guided
                ? 'Guided run builder started for this workspace.'
                : launchContext?.sourceReportId
                  ? 'Chat opened from a saved workspace artifact.'
                  : launchContext?.headlineId
                    ? 'Chat opened from a saved workspace signal.'
                    : launchContext?.entityName
                      ? 'Chat opened with a pinned workspace entity.'
                      : 'Workspace chat session started.';

            return {
                id: `chat-session-${session.id}`,
                occurredAt: session.createdAt || FALLBACK_OCCURED_AT,
                track: 'CHAT',
                type: 'CHAT_SESSION_STARTED',
                workspaceId: input.workspaceId,
                title: session.title || 'Workspace Chat',
                summary,
                refId: session.id,
                refKind: 'CHAT_SESSION',
                badges: [guided ? 'GUIDED' : 'CHAT', session.status, session.purposeId].filter(
                    (value): value is string => !!value
                ),
                searchText: buildChatSessionSearchText(session),
                metadata: {
                    sessionId: session.id,
                    sourceReportId: session.sourceReportId || launchContext?.sourceReportId,
                    sourceSignalId: launchContext?.headlineId,
                    entityName: launchContext?.entityName,
                    sessionMode: guided ? 'GUIDED' : 'STANDARD',
                    packId: session.packId,
                    purposeId: session.purposeId,
                },
            };
        });

    const chatActionEvents = Array.from(sessionById.values()).flatMap<TimelineEvent>((session) => {
        const launchContext = getChatLaunchContextFromSession(session);
        const actions = (input.chatActionsBySessionId[session.id] || []).filter((action) =>
            HIGH_SIGNAL_CHAT_ACTIONS.has(action.type)
        );

        return actions.map<TimelineEvent | null>((action) => {
            const artifactIdFromResult =
                typeof action.result?.artifactId === 'string' ? action.result.artifactId : undefined;
            const artifactIdFromInput =
                typeof action.input?.reportId === 'string' ? action.input.reportId : undefined;
            const relatedArtifactId = artifactIdFromResult || artifactIdFromInput || session.sourceReportId;
            const relatedArtifact = relatedArtifactId ? artifactById.get(relatedArtifactId) : undefined;

            switch (action.type) {
                case 'SEARCH_WORKSPACE': {
                    const query = typeof action.input?.query === 'string' ? action.input.query : undefined;
                    const citedSnippetIds = Array.isArray(action.result?.citedSnippetIds)
                        ? action.result.citedSnippetIds.filter((value): value is string => typeof value === 'string')
                        : [];

                    return {
                        id: `chat-action-${action.id}`,
                        occurredAt: action.createdAt || FALLBACK_OCCURED_AT,
                        track: 'CHAT',
                        type: 'CHAT_SEARCHED_WORKSPACE',
                        workspaceId: input.workspaceId,
                        title: summarize(query, 84) || session.title || 'Workspace chat search',
                        summary: 'Chat searched saved workspace context.',
                        refId: action.id,
                        refKind: 'CHAT_ACTION',
                        parentRefId: session.id,
                        badges: ['SEARCH', action.status].filter((value): value is string => !!value),
                        searchText: buildChatActionSearchText(action, session),
                        metadata: {
                            sessionId: session.id,
                            query,
                            citedSnippetCount: citedSnippetIds.length,
                            sourceReportId: session.sourceReportId || launchContext?.sourceReportId,
                            sourceSignalId: launchContext?.headlineId,
                        },
                    };
                }
                case 'CREATE_ARTIFACT_DRAFT':
                    return {
                        id: `chat-action-${action.id}`,
                        occurredAt: action.createdAt || FALLBACK_OCCURED_AT,
                        track: 'CHAT',
                        type: 'CHAT_ARTIFACT_SAVED',
                        workspaceId: input.workspaceId,
                        title: relatedArtifact?.topic
                            ? sanitizeDisplayTitle(relatedArtifact.topic)
                            : summarize(
                                  typeof action.input?.title === 'string'
                                      ? action.input.title
                                      : typeof action.input?.topic === 'string'
                                        ? action.input.topic
                                        : session.title,
                                  84
                              ) || 'Saved chat artifact',
                        summary: relatedArtifactId
                            ? 'Chat saved a workspace artifact.'
                            : 'Chat created an artifact draft.',
                        refId: action.id,
                        refKind: 'CHAT_ACTION',
                        parentRefId: session.id,
                        badges: ['SAVE', relatedArtifact?.artifactType, action.status].filter(
                            (value): value is string => !!value
                        ),
                        searchText: buildChatActionSearchText(action, session),
                        metadata: {
                            sessionId: session.id,
                            relatedArtifactId,
                            sourceReportId: session.sourceReportId || launchContext?.sourceReportId,
                            sourceSignalId: launchContext?.headlineId,
                        },
                    };
                case 'APPEND_NOTE_TO_ARTIFACT':
                    return {
                        id: `chat-action-${action.id}`,
                        occurredAt: action.createdAt || FALLBACK_OCCURED_AT,
                        track: 'CHAT',
                        type: 'CHAT_ARTIFACT_NOTED',
                        workspaceId: input.workspaceId,
                        title: relatedArtifact?.topic
                            ? `Note added to ${sanitizeDisplayTitle(relatedArtifact.topic)}`
                            : typeof action.input?.reportTopic === 'string'
                              ? `Note added to ${sanitizeDisplayTitle(action.input.reportTopic)}`
                              : 'Artifact note added from chat',
                        summary: 'Chat appended a note to a saved workspace artifact.',
                        refId: action.id,
                        refKind: 'CHAT_ACTION',
                        parentRefId: session.id,
                        badges: ['NOTE', action.status].filter((value): value is string => !!value),
                        searchText: buildChatActionSearchText(action, session),
                        metadata: {
                            sessionId: session.id,
                            relatedArtifactId,
                            sourceReportId: session.sourceReportId || launchContext?.sourceReportId,
                            sourceSignalId: launchContext?.headlineId,
                        },
                    };
                case 'CREATE_FOLLOW_UP_RUN':
                    return {
                        id: `chat-action-${action.id}`,
                        occurredAt: action.createdAt || FALLBACK_OCCURED_AT,
                        track: 'CHAT',
                        type: 'CHAT_FOLLOW_UP_LAUNCHED',
                        workspaceId: input.workspaceId,
                        title: summarize(
                            typeof action.input?.topic === 'string' ? action.input.topic : session.title,
                            84
                        ) || 'Chat follow-up run',
                        summary: 'Chat launched a follow-up workspace run.',
                        refId: action.id,
                        refKind: 'CHAT_ACTION',
                        parentRefId: session.id,
                        badges: [
                            typeof action.result?.launchSource === 'string' ? action.result.launchSource : 'FOLLOW_UP',
                            action.status,
                        ].filter((value): value is string => !!value),
                        searchText: buildChatActionSearchText(action, session),
                        metadata: {
                            sessionId: session.id,
                            relatedArtifactId: session.sourceReportId || launchContext?.sourceReportId,
                            sourceReportId: session.sourceReportId || launchContext?.sourceReportId,
                            sourceSignalId: launchContext?.headlineId,
                            launchSource:
                                typeof action.result?.launchSource === 'string'
                                    ? action.result.launchSource
                                    : undefined,
                        },
                    };
                default:
                    return null;
            }
        }).filter((event): event is TimelineEvent => !!event);
    });

    return [...signalEvents, ...runEvents, ...artifactEvents, ...chatSessionEvents, ...chatActionEvents].sort((a, b) => {
        if (b.occurredAt !== a.occurredAt) return b.occurredAt - a.occurredAt;
        return a.title.localeCompare(b.title);
    });
};

const resolveRangeCutoff = (range: TimelineRange): number | null => {
    if (range === 'ALL') return null;
    const dayCount = range === '7D' ? 7 : range === '30D' ? 30 : 90;
    return Date.now() - dayCount * 24 * 60 * 60 * 1000;
};

export const filterTimelineEvents = (
    events: TimelineEvent[],
    query: TimelineQueryState
): TimelineEvent[] => {
    const activeTracks = query.filters.tracks.length > 0 ? query.filters.tracks : DEFAULT_TRACKS;
    const trackSet = new Set(activeTracks);
    const cutoff = resolveRangeCutoff(query.filters.range);
    const search = query.search.trim().toLowerCase();

    return events.filter((event) => {
        if (query.workspaceId && event.workspaceId !== query.workspaceId) return false;
        if (!trackSet.has(event.track)) return false;
        if (cutoff && event.occurredAt < cutoff) return false;
        if (query.focusedTrack && query.focusedTrack !== 'ALL' && event.track !== query.focusedTrack) {
            return false;
        }
        if (query.focusedRefId && !eventReferencesFocus(event, query.focusedRefId)) {
            return false;
        }
        if (!search) return true;

        const haystack = [event.title, event.summary, event.searchText, ...(event.badges || [])]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return haystack.includes(search);
    });
};

export const groupTimelineEventsByDay = (events: TimelineEvent[]) => {
    const groups = new Map<string, TimelineEvent[]>();

    events.forEach((event) => {
        const key =
            event.occurredAt > 0
                ? new Date(event.occurredAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                  })
                : 'Undated';
        const next = groups.get(key) || [];
        next.push(event);
        groups.set(key, next);
    });

    return Array.from(groups.entries()).map(([label, groupedEvents]) => ({
        label,
        events: groupedEvents,
    }));
};

export const getTrackCount = (events: TimelineEvent[], track: TimelineTrack) =>
    events.filter((event) => event.track === track).length;

export const getLatestTimelineActivity = (events: TimelineEvent[]) => {
    const latest = events.find((event) => event.occurredAt > 0);
    if (!latest) return null;

    const delta = Date.now() - latest.occurredAt;
    const hours = Math.floor(delta / (60 * 60 * 1000));
    if (hours < 1) return 'Less than 1h ago';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(latest.occurredAt).toLocaleDateString();
};
