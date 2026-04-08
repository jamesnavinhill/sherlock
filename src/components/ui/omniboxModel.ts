import {
  buildChatResults,
  buildRouteResults,
  buildRunResults,
  buildSavedViewResults,
  buildWorkspaceResults,
  mapWorkspaceSnippetToOmniboxResult,
} from './omniboxResultBuilders';
import { dedupeResults } from './omniboxSearchUtils';
import { buildRecentOmniboxResults, createStoredOmniboxRecent } from './omniboxRecents';
import {
  applyMentionSelection,
  buildMentionCandidates,
  resolveDraftMentions,
  resolveMentionQuery,
} from './omniboxMentions';
import type { BuildOmniboxResultsInput } from './omniboxTypes';

export type {
  BuildOmniboxResultsInput,
  OmniboxActionId,
  OmniboxResult,
  OmniboxResultKind,
} from './omniboxTypes';

export {
  applyMentionSelection,
  buildMentionCandidates,
  createStoredOmniboxRecent,
  mapWorkspaceSnippetToOmniboxResult,
  resolveDraftMentions,
  resolveMentionQuery,
};

export const buildOmniboxResults = ({
  query,
  activeWorkspaceId,
  artifacts,
  chatSessions,
  savedViews = [],
  snippets,
  storedRecents,
  workspaceItems,
  workspaceRuns,
  workspaces,
}: BuildOmniboxResultsInput) => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return buildRecentOmniboxResults({
      activeWorkspaceId,
      artifacts,
      chatSessions,
      savedViews,
      storedRecents,
      workspaceItems,
      workspaceRuns,
      workspaces,
    });
  }

  const workspaceScopedId =
    activeWorkspaceId ||
    snippets.find((snippet) => snippet.refId)?.metadata?.workspaceId;

  return dedupeResults([
    ...buildRouteResults(trimmedQuery, activeWorkspaceId),
    ...buildWorkspaceResults(trimmedQuery, workspaces),
    ...buildSavedViewResults(trimmedQuery, activeWorkspaceId, savedViews, workspaces),
    ...buildRunResults(trimmedQuery, activeWorkspaceId, workspaceRuns),
    ...buildChatResults(trimmedQuery, activeWorkspaceId, chatSessions),
    ...snippets
      .filter(() => !!activeWorkspaceId || !!workspaceScopedId)
      .map((snippet) =>
        mapWorkspaceSnippetToOmniboxResult(snippet, activeWorkspaceId || String(workspaceScopedId))
      ),
  ]).slice(0, 14);
};
