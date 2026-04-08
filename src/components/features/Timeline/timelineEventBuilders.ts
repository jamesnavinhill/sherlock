import { sanitizeDisplayTitle } from '@/domain';
import {
  getChatLaunchContextFromSession,
  isGuidedChatSession,
} from '@/services/chat/launchContext';
import type {
  AgentAction,
  Artifact,
  ChatSession,
  Headline,
  TimelineEvent,
  WorkspaceItem,
  WorkspaceRun,
} from '@/types';
import {
  buildArtifactMetadata,
  buildArtifactSearchText,
  buildArtifactSummary,
  buildChatActionSearchText,
  buildChatSessionSearchText,
  buildEntitySearchText,
  buildRunSearchText,
  buildSignalSearchText,
  buildWorkspaceItemReuseSummary,
  buildWorkspaceItemSearchText,
  ENTITY_MENTION_THRESHOLDS,
  ENTITY_REAPPEARANCE_GAP_MS,
  FALLBACK_OCCURED_AT,
  formatDayGap,
  getArtifactParentId,
  getStringArray,
  HIGH_SIGNAL_CHAT_ACTIONS,
  inferArtifactForRun,
  parseTimestamp,
  resolveWorkspaceItemIdFromSnippetId,
  summarize,
} from './timelineEventUtils';

export interface WorkspaceTimelineEventContext {
  artifactById: Map<string, Artifact>;
  artifacts: Artifact[];
  chatActionsBySessionId: Record<string, AgentAction[]>;
  chatSessions: ChatSession[];
  runs: WorkspaceRun[];
  scopedArtifacts: Artifact[];
  scopedWorkspaceItems: WorkspaceItem[];
  sessionById: Map<string, ChatSession>;
  signals: Headline[];
  workspaceId: string;
  workspaceItemById: Map<string, WorkspaceItem>;
}

export const buildSignalTimelineEvents = ({
  signals,
  workspaceId,
}: Pick<WorkspaceTimelineEventContext, 'signals' | 'workspaceId'>) =>
  signals
    .filter((headline) => headline.workspaceId === workspaceId)
    .map<TimelineEvent>((headline) => ({
      id: `signal-${headline.id}`,
      occurredAt: parseTimestamp(headline.timestamp),
      track: 'SIGNAL',
      type: 'SIGNAL_SAVED',
      workspaceId,
      title: summarize(headline.content, 84) || 'Saved signal',
      summary: `${headline.source || headline.type} signal saved to the workspace.`,
      refId: headline.id,
      refKind: 'SIGNAL',
      badges: [headline.type, headline.threatLevel],
      searchText: buildSignalSearchText(headline),
      metadata: {
        source: headline.source,
        url: headline.url,
        linkedArtifactId: headline.linkedArtifactId,
      },
    }));

export const buildRunTimelineEvents = ({
  artifacts,
  runs,
  workspaceId,
}: Pick<WorkspaceTimelineEventContext, 'artifacts' | 'runs' | 'workspaceId'>) =>
  runs
    .filter((run) => run.workspaceId === workspaceId || run.report?.workspaceId === workspaceId)
    .flatMap<TimelineEvent>((run) => {
      const relatedArtifactId =
        run.config?.producedArtifactId || inferArtifactForRun(run, artifacts, workspaceId);
      const badges = [run.status, run.config?.artifactType, run.config?.purposeName].filter(
        (value): value is string => !!value
      );
      const summaryBase = summarize(run.parentContext?.summary, 120);
      const lineageSummary = run.config?.sourceSignalId
        ? 'Run launched from a saved workspace signal.'
        : run.config?.parentArtifactId
          ? 'Run launched as a follow-up from a saved artifact.'
          : undefined;

      const startEvent: TimelineEvent = {
        id: `run-start-${run.id}`,
        occurredAt: run.startTime || FALLBACK_OCCURED_AT,
        track: 'RUN',
        type: 'RUN_STARTED',
        workspaceId,
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

export const buildArtifactTimelineEvents = ({
  artifacts,
  workspaceId,
}: Pick<WorkspaceTimelineEventContext, 'artifacts' | 'workspaceId'>) =>
  artifacts
    .filter((artifact) => artifact.workspaceId === workspaceId)
    .map<TimelineEvent>((artifact) => ({
      id: `artifact-${artifact.id || sanitizeDisplayTitle(artifact.topic)}`,
      occurredAt: artifact.createdAt ?? FALLBACK_OCCURED_AT,
      track: 'ARTIFACT',
      type: 'ARTIFACT_CREATED',
      workspaceId,
      title: sanitizeDisplayTitle(artifact.topic),
      summary: buildArtifactSummary(artifact),
      refId: artifact.id,
      refKind: 'ARTIFACT',
      parentRefId: getArtifactParentId(artifact),
      badges: [artifact.artifactType || 'REPORT', artifact.purposeId].filter(
        (value): value is string => !!value
      ),
      searchText: buildArtifactSearchText(artifact),
      metadata: buildArtifactMetadata(artifact),
    }));

export const buildWorkspaceItemTimelineEvents = ({
  scopedWorkspaceItems,
  workspaceId,
}: Pick<WorkspaceTimelineEventContext, 'scopedWorkspaceItems' | 'workspaceId'>) =>
  scopedWorkspaceItems.flatMap<TimelineEvent>((item) => {
    const provenanceSource = item.provenance?.source;
    const baseBadges = [item.kind, provenanceSource].filter(Boolean) as string[];
    const baseMetadata = {
      workspaceItemKind: item.kind,
      source: provenanceSource,
      sourceSessionId: item.provenance?.sourceSessionId,
      sourceMessageId: item.provenance?.sourceMessageId,
      sourceArtifactId: item.provenance?.sourceArtifactId,
      sourceSignalId: item.provenance?.sourceSignalId || item.provenance?.sourceHeadlineId,
      url: item.url,
      fileName: item.fileName,
      tagCount: item.tags?.length || 0,
    };
    const createdEvent: TimelineEvent = {
      id: `workspace-item-created-${item.id}`,
      occurredAt: item.createdAt || FALLBACK_OCCURED_AT,
      track: 'ITEM',
      type: provenanceSource && provenanceSource !== 'USER' ? 'ITEM_PROMOTED' : 'ITEM_CREATED',
      workspaceId,
      title: item.title,
      summary:
        provenanceSource && provenanceSource !== 'USER'
          ? `Promoted into the workspace from ${provenanceSource.toLowerCase().replace('_', ' ')} context.`
          : `Workspace ${item.kind.toLowerCase()} created.`,
      refId: item.id,
      refKind: 'WORKSPACE_ITEM',
      badges: baseBadges,
      searchText: buildWorkspaceItemSearchText(item),
      metadata: baseMetadata,
    };

    if ((item.updatedAt || 0) - (item.createdAt || 0) < 60 * 1000) {
      return [createdEvent];
    }

    return [
      createdEvent,
      {
        id: `workspace-item-updated-${item.id}`,
        occurredAt: item.updatedAt || FALLBACK_OCCURED_AT,
        track: 'ITEM',
        type: 'ITEM_UPDATED',
        workspaceId,
        title: item.title,
        summary: `Workspace ${item.kind.toLowerCase()} updated.`,
        refId: item.id,
        refKind: 'WORKSPACE_ITEM',
        badges: [...baseBadges, 'UPDATED'],
        searchText: buildWorkspaceItemSearchText(item),
        metadata: baseMetadata,
      },
    ];
  });

export const buildWorkspaceItemReuseTimelineEvents = ({
  chatActionsBySessionId,
  sessionById,
  workspaceId,
  workspaceItemById,
}: Pick<
  WorkspaceTimelineEventContext,
  'chatActionsBySessionId' | 'sessionById' | 'workspaceId' | 'workspaceItemById'
>) =>
  Array.from(sessionById.values()).flatMap<TimelineEvent>((session) => {
    const launchContext = getChatLaunchContextFromSession(session);

    return (chatActionsBySessionId[session.id] || [])
      .filter((action) => action.type === 'SEARCH_WORKSPACE')
      .flatMap<TimelineEvent>((action) => {
        const usageByItemId = new Map<
          string,
          {
            cited: boolean;
            mentioned: boolean;
            retrieved: boolean;
          }
        >();
        const markUsage = (
          snippetIds: string[],
          field: 'cited' | 'mentioned' | 'retrieved'
        ) => {
          snippetIds.forEach((snippetId) => {
            const itemId = resolveWorkspaceItemIdFromSnippetId(snippetId);
            if (!itemId) return;
            const existing = usageByItemId.get(itemId) || {
              cited: false,
              mentioned: false,
              retrieved: false,
            };
            existing[field] = true;
            usageByItemId.set(itemId, existing);
          });
        };

        const citedSnippetIds = getStringArray(action.result?.citedSnippetIds);
        const mentionedSnippetIds = getStringArray(action.result?.mentionedSnippetIds);
        const retrievedSnippetIds = getStringArray(action.result?.retrievedSnippetIds);
        const query = typeof action.input?.query === 'string' ? action.input.query : undefined;

        markUsage(citedSnippetIds, 'cited');
        markUsage(mentionedSnippetIds, 'mentioned');
        markUsage(retrievedSnippetIds, 'retrieved');

        return Array.from(usageByItemId.entries())
          .map<TimelineEvent | null>(([itemId, usage]) => {
            const item = workspaceItemById.get(itemId);
            if (!item) return null;

            const reuseReason = usage.cited
              ? 'CITED'
              : usage.mentioned
                ? 'PINNED'
                : 'RETRIEVED';

            return {
              id: `workspace-item-reused-${item.id}-${action.id}`,
              occurredAt: action.createdAt || FALLBACK_OCCURED_AT,
              track: 'ITEM',
              type: 'ITEM_REUSED',
              workspaceId,
              title: item.title,
              summary: buildWorkspaceItemReuseSummary(usage),
              refId: item.id,
              refKind: 'WORKSPACE_ITEM',
              parentRefId: session.id,
              badges: [item.kind, 'CHAT', reuseReason],
              searchText: [buildWorkspaceItemSearchText(item), buildChatActionSearchText(action, session)]
                .filter(Boolean)
                .join(' '),
              metadata: {
                workspaceItemId: item.id,
                sessionId: session.id,
                query,
                reuseReason,
                relatedArtifactId: session.sourceArtifactId || launchContext?.sourceArtifactId,
                sourceSignalId: launchContext?.signalId || launchContext?.headlineId,
              },
            };
          })
          .filter((event): event is TimelineEvent => event !== null);
      });
  });

export const buildEntityTimelineEvents = ({
  scopedArtifacts,
  workspaceId,
}: Pick<WorkspaceTimelineEventContext, 'scopedArtifacts' | 'workspaceId'>) => {
  const entityMilestones: TimelineEvent[] = [];
  const entityState = new Map<
    string,
    {
      mentionCount: number;
      lastArtifactId?: string;
      lastSeenAt: number;
    }
  >();
  const thresholdSet = new Set(ENTITY_MENTION_THRESHOLDS);
  const chronologicalArtifacts = [...scopedArtifacts].sort((a, b) => {
    const delta = (a.createdAt ?? FALLBACK_OCCURED_AT) - (b.createdAt ?? FALLBACK_OCCURED_AT);
    if (delta !== 0) return delta;
    return sanitizeDisplayTitle(a.topic).localeCompare(sanitizeDisplayTitle(b.topic));
  });

  chronologicalArtifacts.forEach((artifact) => {
    const seenInArtifact = new Set<string>();
    const artifactEntityNames = artifact.entities
      .map((entity) =>
        sanitizeDisplayTitle((typeof entity === 'string' ? entity : entity.name) || '').trim()
      )
      .filter((name) => !!name)
      .filter((name) => {
        const key = name.toLowerCase();
        if (seenInArtifact.has(key)) return false;
        seenInArtifact.add(key);
        return true;
      });

    artifactEntityNames.forEach((displayName) => {
      const entityKey = displayName.toLowerCase();
      const occurredAt = artifact.createdAt ?? FALLBACK_OCCURED_AT;
      const previous = entityState.get(entityKey);
      const mentionCount = (previous?.mentionCount || 0) + 1;
      const relatedArtifactId = artifact.id;
      const previousArtifactId = previous?.lastArtifactId;
      const gapMs =
        previous && occurredAt > 0 && previous.lastSeenAt > 0
          ? occurredAt - previous.lastSeenAt
          : 0;

      if (!previous) {
        entityMilestones.push({
          id: `entity-first-seen-${entityKey}-${relatedArtifactId || occurredAt}`,
          occurredAt,
          track: 'ENTITY',
          type: 'ENTITY_FIRST_SEEN',
          workspaceId,
          title: displayName,
          summary: relatedArtifactId
            ? `First seen in ${sanitizeDisplayTitle(artifact.topic)}.`
            : 'First seen in a saved workspace artifact.',
          refId: displayName,
          refKind: 'ENTITY',
          badges: ['FIRST_SEEN', artifact.artifactType || 'ARTIFACT'].filter(
            (value): value is string => !!value
          ),
          searchText: buildEntitySearchText(displayName, artifact, mentionCount),
          metadata: {
            entityName: displayName,
            relatedArtifactId,
            mentionCount,
          },
        });
      } else {
        if (gapMs >= ENTITY_REAPPEARANCE_GAP_MS) {
          entityMilestones.push({
            id: `entity-reappeared-${entityKey}-${relatedArtifactId || occurredAt}`,
            occurredAt,
            track: 'ENTITY',
            type: 'ENTITY_REAPPEARED',
            workspaceId,
            title: displayName,
            summary: relatedArtifactId
              ? `Reappeared in ${sanitizeDisplayTitle(artifact.topic)} after ${formatDayGap(gapMs)}.`
              : `Reappeared in a saved workspace artifact after ${formatDayGap(gapMs)}.`,
            refId: displayName,
            refKind: 'ENTITY',
            badges: ['REAPPEARED', artifact.artifactType || 'ARTIFACT'].filter(
              (value): value is string => !!value
            ),
            searchText: buildEntitySearchText(displayName, artifact, mentionCount),
            metadata: {
              entityName: displayName,
              relatedArtifactId,
              previousArtifactId,
              mentionCount,
              daysSincePrevious: formatDayGap(gapMs),
            },
          });
        }

        if (thresholdSet.has(mentionCount)) {
          entityMilestones.push({
            id: `entity-threshold-${entityKey}-${mentionCount}-${relatedArtifactId || occurredAt}`,
            occurredAt,
            track: 'ENTITY',
            type: 'ENTITY_MENTION_THRESHOLD',
            workspaceId,
            title: displayName,
            summary: relatedArtifactId
              ? `Reached ${mentionCount} saved artifact mentions in ${sanitizeDisplayTitle(artifact.topic)}.`
              : `Reached ${mentionCount} saved artifact mentions.`,
            refId: displayName,
            refKind: 'ENTITY',
            badges: [`${mentionCount}X`, artifact.artifactType || 'ARTIFACT'].filter(
              (value): value is string => !!value
            ),
            searchText: buildEntitySearchText(displayName, artifact, mentionCount),
            metadata: {
              entityName: displayName,
              relatedArtifactId,
              mentionCount,
              threshold: mentionCount,
            },
          });
        }
      }

      entityState.set(entityKey, {
        mentionCount,
        lastArtifactId: relatedArtifactId,
        lastSeenAt: occurredAt,
      });
    });
  });

  return entityMilestones;
};

export const buildChatSessionTimelineEvents = ({
  chatSessions,
  workspaceId,
}: Pick<WorkspaceTimelineEventContext, 'chatSessions' | 'workspaceId'>) =>
  chatSessions
    .filter((session) => session.workspaceId === workspaceId)
    .map<TimelineEvent>((session) => {
      const launchContext = getChatLaunchContextFromSession(session);
      const guided = isGuidedChatSession(session);
      const summary = guided
        ? 'Guided run builder started for this workspace.'
        : launchContext?.sourceArtifactId
          ? 'Chat opened from a saved workspace artifact.'
          : launchContext?.signalId || launchContext?.headlineId
            ? 'Chat opened from a saved workspace signal.'
            : launchContext?.entityName
              ? 'Chat opened with a pinned workspace entity.'
              : 'Workspace chat session started.';

      return {
        id: `chat-session-${session.id}`,
        occurredAt: session.createdAt || FALLBACK_OCCURED_AT,
        track: 'CHAT',
        type: 'CHAT_SESSION_STARTED',
        workspaceId,
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
          sourceArtifactId: session.sourceArtifactId || launchContext?.sourceArtifactId,
          sourceSignalId: launchContext?.signalId || launchContext?.headlineId,
          entityName: launchContext?.entityName,
          sessionMode: guided ? 'GUIDED' : 'STANDARD',
          packId: session.packId,
          purposeId: session.purposeId,
        },
      };
    });

export const buildChatActionTimelineEvents = ({
  artifactById,
  chatActionsBySessionId,
  sessionById,
  workspaceId,
}: Pick<
  WorkspaceTimelineEventContext,
  'artifactById' | 'chatActionsBySessionId' | 'sessionById' | 'workspaceId'
>) =>
  Array.from(sessionById.values()).flatMap<TimelineEvent>((session) => {
    const launchContext = getChatLaunchContextFromSession(session);
    const actions = (chatActionsBySessionId[session.id] || []).filter((action) =>
      HIGH_SIGNAL_CHAT_ACTIONS.has(action.type)
    );

    return actions
      .map<TimelineEvent | null>((action) => {
        const artifactIdFromResult =
          typeof action.result?.artifactId === 'string' ? action.result.artifactId : undefined;
        const artifactIdFromInput =
          typeof action.input?.reportId === 'string' ? action.input.reportId : undefined;
        const relatedArtifactId =
          artifactIdFromResult || artifactIdFromInput || session.sourceArtifactId;
        const relatedArtifact = relatedArtifactId ? artifactById.get(relatedArtifactId) : undefined;

        switch (action.type) {
          case 'SEARCH_WORKSPACE': {
            const query = typeof action.input?.query === 'string' ? action.input.query : undefined;
            const citedSnippetIds = Array.isArray(action.result?.citedSnippetIds)
              ? action.result.citedSnippetIds.filter(
                  (value): value is string => typeof value === 'string'
                )
              : [];

            return {
              id: `chat-action-${action.id}`,
              occurredAt: action.createdAt || FALLBACK_OCCURED_AT,
              track: 'CHAT',
              type: 'CHAT_SEARCHED_WORKSPACE',
              workspaceId,
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
                sourceArtifactId: session.sourceArtifactId || launchContext?.sourceArtifactId,
                sourceSignalId: launchContext?.signalId || launchContext?.headlineId,
              },
            };
          }
          case 'CREATE_ARTIFACT_DRAFT':
            return {
              id: `chat-action-${action.id}`,
              occurredAt: action.createdAt || FALLBACK_OCCURED_AT,
              track: 'CHAT',
              type: 'CHAT_ARTIFACT_SAVED',
              workspaceId,
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
                sourceArtifactId: session.sourceArtifactId || launchContext?.sourceArtifactId,
                sourceSignalId: launchContext?.signalId || launchContext?.headlineId,
              },
            };
          case 'APPEND_NOTE_TO_ARTIFACT':
            return {
              id: `chat-action-${action.id}`,
              occurredAt: action.createdAt || FALLBACK_OCCURED_AT,
              track: 'CHAT',
              type: 'CHAT_ARTIFACT_NOTED',
              workspaceId,
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
                sourceArtifactId: session.sourceArtifactId || launchContext?.sourceArtifactId,
                sourceSignalId: launchContext?.signalId || launchContext?.headlineId,
              },
            };
          case 'CREATE_FOLLOW_UP_RUN':
            return {
              id: `chat-action-${action.id}`,
              occurredAt: action.createdAt || FALLBACK_OCCURED_AT,
              track: 'CHAT',
              type: 'CHAT_FOLLOW_UP_LAUNCHED',
              workspaceId,
              title:
                summarize(
                  typeof action.input?.topic === 'string' ? action.input.topic : session.title,
                  84
                ) || 'Chat follow-up run',
              summary: 'Chat launched a follow-up workspace run.',
              refId: action.id,
              refKind: 'CHAT_ACTION',
              parentRefId: session.id,
              badges: [
                typeof action.result?.launchSource === 'string'
                  ? action.result.launchSource
                  : 'FOLLOW_UP',
                action.status,
              ].filter((value): value is string => !!value),
              searchText: buildChatActionSearchText(action, session),
              metadata: {
                sessionId: session.id,
                relatedArtifactId: session.sourceArtifactId || launchContext?.sourceArtifactId,
                sourceArtifactId: session.sourceArtifactId || launchContext?.sourceArtifactId,
                sourceSignalId: launchContext?.signalId || launchContext?.headlineId,
                launchSource:
                  typeof action.result?.launchSource === 'string'
                    ? action.result.launchSource
                    : undefined,
              },
            };
          default:
            return null;
        }
      })
      .filter((event): event is TimelineEvent => !!event);
  });
