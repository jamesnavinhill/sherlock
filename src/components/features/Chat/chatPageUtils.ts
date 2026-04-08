import type { Artifact, ChatLaunchContext, ChatMessage, ChatSession, Signal } from '@/types';
import type { GuidedRunDraft, GuidedSessionState } from '@/services/chat/guidedMode';
import { isGuidedSessionState } from '@/services/chat/guidedMode';
import { sanitizeDisplayTitle } from '@/domain';

export const formatTimestamp = (value: number): string =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const formatDateTime = (value: number): string =>
  new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatMessageWithCitations = (message: ChatMessage): string => {
  const citations = message.attachments?.length
    ? `\n\nCitations:\n${message.attachments
        .map(
          (attachment) =>
            `- ${attachment.title}${attachment.snippet ? `: ${attachment.snippet}` : ''}`
        )
        .join('\n')}`
    : message.citations?.length
      ? `\n\nCitations: ${message.citations.join(', ')}`
      : '';

  return `${message.content}${citations}`;
};

const followUpTopicLinePattern = /^\[[^\]]+\]\s*\[RUN_ANGLE\]:/i;

export const splitCollapsedFollowUpBlock = (body: string) => {
  const trimmedBody = body.trimEnd();
  const lines = trimmedBody.split('\n');
  const followUpStartIndex = lines.findIndex((line, index) => {
    if (!followUpTopicLinePattern.test(line.trim())) return false;
    if (index === 0) return false;

    const remainingLines = lines.slice(index).filter((entry) => entry.trim().length > 0);
    const matchingLines = remainingLines.filter((entry) =>
      followUpTopicLinePattern.test(entry.trim())
    );
    return matchingLines.length >= 1;
  });

  if (followUpStartIndex === -1) {
    return {
      primaryBody: trimmedBody,
      collapsedBody: '',
    };
  }

  const primaryLines = [...lines.slice(0, followUpStartIndex)];
  const trailingPrimaryLine = primaryLines[primaryLines.length - 1]?.trim();
  if (
    trailingPrimaryLine === '---' ||
    trailingPrimaryLine === '***' ||
    trailingPrimaryLine === '___'
  ) {
    primaryLines.pop();
  }

  return {
    primaryBody: primaryLines.join('\n').trimEnd(),
    collapsedBody: lines.slice(followUpStartIndex).join('\n').trim(),
  };
};

export const getSessionTitle = (session: ChatSession): string =>
  sanitizeDisplayTitle(session.title.trim() || 'Untitled Chat');

export const LEFT_PANEL_SECTION_SCROLL_CLASS =
  'max-h-[min(20rem,calc(100svh-21rem))] overflow-y-auto overscroll-contain pr-1 custom-scrollbar';

export const toggleExclusiveSection = <T extends Record<string, boolean>>(
  current: T,
  section: keyof T
): T =>
  Object.fromEntries(
    Object.keys(current).map((key) => [key, key === section ? !current[section] : false])
  ) as T;

export const getLaunchContextSummary = (params: {
  launchContext: ChatLaunchContext | null;
  reports: Artifact[];
  signals: Signal[];
}) => {
  if (!params.launchContext) return null;

  if (params.launchContext.sourceArtifactId) {
    const report = params.reports.find(
      (entry) => entry.id === params.launchContext?.sourceArtifactId
    );
    if (!report) return null;

    return {
      label: 'Pinned Artifact',
      title: sanitizeDisplayTitle(report.topic),
      body: report.summary || 'No saved summary is available for this artifact yet.',
    };
  }

  if (params.launchContext.entityName) {
    const relatedCount = params.reports.filter((report) =>
      (report.entities || []).some((entity) => {
        const name = typeof entity === 'string' ? entity : entity.name;
        return name.trim().toLowerCase() === params.launchContext?.entityName?.trim().toLowerCase();
      })
    ).length;

    return {
      label: 'Pinned Entity',
      title: params.launchContext.entityName,
      body:
        relatedCount > 0
          ? `${relatedCount} saved artifact(s) mention this entity in the active workspace.`
          : 'No direct artifact mentions are saved for this entity yet.',
    };
  }

  const signalId = params.launchContext.signalId || params.launchContext.headlineId;
  if (signalId) {
    const signal = params.signals.find((entry) => entry.id === signalId);
    if (!signal) return null;

    return {
      label: 'Pinned Signal',
      title: signal.source || signal.type,
      body: signal.content,
    };
  }

  return null;
};

export const getGuidedSessionState = (session: ChatSession | null): GuidedSessionState | null => {
  const metadata = session?.metadata as { guidedState?: unknown } | undefined;
  return isGuidedSessionState(metadata?.guidedState) ? metadata.guidedState : null;
};

export const buildGuidedSessionMetadata = (
  session: ChatSession,
  guidedState: GuidedSessionState
): Record<string, unknown> => ({
  ...(session.metadata || {}),
  sessionMode: 'GUIDED',
  guidedState,
});

export const buildManualSetupSeed = (draft: GuidedRunDraft) => ({
  initialTopic: draft.topic,
  initialScopeId: draft.scopeId,
  initialConfigOverride: {
    provider: draft.provider,
    modelId: draft.modelId,
    persona: draft.persona,
    searchDepth: draft.searchDepth,
    thinkingBudget: draft.thinkingBudget,
    purposeId: draft.purposeId,
    artifactType: draft.artifactType,
  },
  initialDateRangeOverride:
    draft.dateRange?.start || draft.dateRange?.end
      ? {
          start: draft.dateRange.start || undefined,
          end: draft.dateRange.end || undefined,
        }
      : undefined,
});

export const sectionLabelClassName =
  'text-[11px] font-mono uppercase tracking-[0.28em] text-zinc-500';

export const getDefaultLeftPanelOpen = () => false;

export const getDefaultRightPanelOpen = () =>
  typeof window !== 'undefined' ? window.innerWidth > 1024 : false;
