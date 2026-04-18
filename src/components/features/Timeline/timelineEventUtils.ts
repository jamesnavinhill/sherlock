import { getArtifactFollowUps, sanitizeDisplayTitle } from '@/domain';
import {
  getChatLaunchContextFromSession,
  isGuidedChatSession,
} from '@/services/chat/launchContext';
import { buildWorkspaceItemSearchText as buildWorkspaceItemSearchValue } from '@/services/workspace/workspaceItemText';
import type {
  AgentAction,
  Artifact,
  ChatSession,
  Headline,
  TimelineEvent,
  TimelineRange,
  TimelineTrack,
  WorkspaceItem,
  WorkspaceRun,
} from '@/types';

export const FALLBACK_OCCURED_AT = 0;
export const DEFAULT_TRACKS: TimelineTrack[] = ['SIGNAL', 'RUN', 'ARTIFACT', 'ITEM'];
export const ENTITY_MENTION_THRESHOLDS = [3, 5];
export const ENTITY_REAPPEARANCE_GAP_MS = 14 * 24 * 60 * 60 * 1000;
export const HIGH_SIGNAL_CHAT_ACTIONS = new Set<AgentAction['type']>([
  'SEARCH_WORKSPACE',
  'CREATE_ARTIFACT_DRAFT',
  'APPEND_NOTE_TO_ARTIFACT',
  'CREATE_FOLLOW_UP_RUN',
]);

export const summarize = (value: string | undefined, max = 140): string | undefined => {
  if (!value) return undefined;
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return undefined;
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}...`;
};

export const parseTimestamp = (value?: string): number => {
  if (!value) return FALLBACK_OCCURED_AT;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : FALLBACK_OCCURED_AT;
};

export const buildSignalSearchText = (headline: Headline): string =>
  [headline.content, headline.source, headline.type, headline.threatLevel]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export const buildArtifactSearchText = (artifact: Artifact): string =>
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

export const buildEntitySearchText = (
  entityName: string,
  artifact: Artifact,
  mentionCount: number
): string =>
  [entityName, artifact.topic, artifact.summary, artifact.artifactType, mentionCount.toString()]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export const buildRunSearchText = (run: WorkspaceRun): string =>
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

export const buildWorkspaceItemSearchText = (item: WorkspaceItem) =>
  buildWorkspaceItemSearchValue(item).toLowerCase();

export const buildChatSessionSearchText = (session: ChatSession): string => {
  const launchContext = getChatLaunchContextFromSession(session);

  return [
    session.title,
    session.status,
    session.packId,
    session.purposeId,
    session.sourceArtifactId,
    launchContext?.sourceArtifactId,
    launchContext?.signalId || launchContext?.headlineId,
    launchContext?.entityName,
    isGuidedChatSession(session) ? 'guided session' : 'workspace chat',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

export const extractStringValues = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractStringValues(entry));
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap((entry) => extractStringValues(entry));
  }

  return [];
};

export const getStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];

export const resolveWorkspaceItemIdFromSnippetId = (snippetId: string): string | undefined => {
  const itemSnippetPrefix = 'CTX-WORKSPACE-ITEM-';
  if (snippetId.startsWith(itemSnippetPrefix)) {
    return snippetId.slice(itemSnippetPrefix.length);
  }

  const mentionSnippetPrefix = 'CTX-MENTION-WORKSPACE_ITEM-';
  if (snippetId.startsWith(mentionSnippetPrefix)) {
    return snippetId.slice(mentionSnippetPrefix.length);
  }

  return undefined;
};

export const buildWorkspaceItemReuseSummary = (input: {
  cited: boolean;
  mentioned: boolean;
  retrieved: boolean;
}) => {
  if (input.cited && input.mentioned) {
    return 'Pinned into chat context and cited in the response.';
  }
  if (input.cited) {
    return 'Reused in chat and cited in the response.';
  }
  if (input.mentioned) {
    return 'Pinned into workspace chat context.';
  }
  return input.retrieved ? 'Retrieved into workspace chat context.' : 'Reused in workspace chat.';
};

export const buildChatActionSearchText = (
  action: AgentAction,
  session: ChatSession | undefined
): string =>
  [session?.title, action.type, action.status, ...extractStringValues(action.input), ...extractStringValues(action.result)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export const getArtifactParentId = (artifact: Artifact) => artifact.config?.parentArtifactId;

export const inferArtifactForRun = (
  run: WorkspaceRun,
  artifacts: Artifact[],
  workspaceId: string
) => {
  if (run.config?.producedArtifactId) return run.config.producedArtifactId;
  if (run.artifact?.id) return run.artifact.id;

  const artifactFromSourceRun = artifacts.find(
    (artifact) => artifact.workspaceId === workspaceId && artifact.config?.sourceRunId === run.id
  )?.id;
  if (artifactFromSourceRun) return artifactFromSourceRun;

  return artifacts.find(
    (artifact) =>
      artifact.workspaceId === workspaceId &&
      sanitizeDisplayTitle(artifact.topic).toLowerCase() ===
        sanitizeDisplayTitle(run.topic).toLowerCase()
  )?.id;
};

export const buildArtifactSummary = (artifact: Artifact) =>
  artifact.config?.sourceSignalId
    ? 'Saved artifact created from a signal-driven run.'
    : artifact.config?.parentArtifactId
      ? 'Saved artifact created from a follow-up artifact run.'
      : summarize(artifact.summary, 160) || 'Saved artifact created.';

export const buildArtifactMetadata = (artifact: Artifact) => ({
  sourceCount: artifact.sources.length,
  entityCount: artifact.entities.length,
  followUpCount: getArtifactFollowUps(artifact).length,
  sourceSignalId: artifact.config?.sourceSignalId,
  parentArtifactId: artifact.config?.parentArtifactId,
  sourceRunId: artifact.config?.sourceRunId,
});

export const formatDayGap = (gapMs: number) => {
  const dayCount = Math.max(1, Math.round(gapMs / (24 * 60 * 60 * 1000)));
  return `${dayCount}d`;
};

export const eventReferencesFocus = (event: TimelineEvent, focusedRefId: string) => {
  const metadataValues = event.metadata ? extractStringValues(event.metadata) : [];

  return (
    event.refId === focusedRefId ||
    event.parentRefId === focusedRefId ||
    metadataValues.includes(focusedRefId)
  );
};

export const resolveRangeCutoff = (range: TimelineRange): number | null => {
  if (range === 'ALL') return null;
  const dayCount = range === '7D' ? 7 : range === '30D' ? 30 : 90;
  return Date.now() - dayCount * 24 * 60 * 60 * 1000;
};
