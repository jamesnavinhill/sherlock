import type { Workspace } from '@/types';

const CONTROL_TAG_PATTERN = /\s*\[[A-Z_]+\]:[\s\S]*$/;
const WRAPPED_TOPIC_PATTERN = /^\[(.+)\]$/;
const RUN_ANGLE_PATTERN = /\[RUN_ANGLE\]:\s*([\s\S]*?)(?=\n\s*\[[A-Z_]+\]:|$)/i;
const PRIORITY_SOURCES_PATTERN = /\[PRIORITY_SOURCES\]:\s*([\s\S]*?)(?=\n\s*\[[A-Z_]+\]:|$)/i;

const normalizeWorkspaceField = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : undefined;
};

export const sanitizeDisplayTitle = (title: string): string => {
  const withoutLegacyPrefix = title.replace(/^Operation:\s*/i, '').trim();
  const withoutControlTags = withoutLegacyPrefix.replace(CONTROL_TAG_PATTERN, '').trim();
  const singleLineTitle = withoutControlTags.replace(/\s+/g, ' ').trim();
  const unwrappedTitle =
    singleLineTitle.match(WRAPPED_TOPIC_PATTERN)?.[1]?.trim() || singleLineTitle;

  return unwrappedTitle || withoutLegacyPrefix || title;
};

export const stripLegacyWorkspacePrefix = (title: string): string => sanitizeDisplayTitle(title);

export const extractWorkspaceLaunchFields = (title: string) => ({
  displayTitle: sanitizeDisplayTitle(title),
  launchTopic: sanitizeDisplayTitle(title),
  launchAngle: normalizeWorkspaceField(title.match(RUN_ANGLE_PATTERN)?.[1]),
  prioritySourcesSummary: normalizeWorkspaceField(title.match(PRIORITY_SOURCES_PATTERN)?.[1]),
});

export const resolveWorkspaceIdentity = (
  workspace: Pick<
    Workspace,
    'title' | 'displayTitle' | 'launchTopic' | 'launchAngle' | 'prioritySourcesSummary'
  >
) => {
  const derived = extractWorkspaceLaunchFields(workspace.title);

  return {
    displayTitle: normalizeWorkspaceField(workspace.displayTitle) || derived.displayTitle,
    launchTopic: normalizeWorkspaceField(workspace.launchTopic) || derived.launchTopic,
    launchAngle: normalizeWorkspaceField(workspace.launchAngle) || derived.launchAngle,
    prioritySourcesSummary:
      normalizeWorkspaceField(workspace.prioritySourcesSummary) ||
      derived.prioritySourcesSummary,
  };
};

export const getWorkspaceDisplayTitle = (
  workspace: Pick<
    Workspace,
    'title' | 'displayTitle' | 'launchTopic' | 'launchAngle' | 'prioritySourcesSummary'
  >
): string => resolveWorkspaceIdentity(workspace).displayTitle;
