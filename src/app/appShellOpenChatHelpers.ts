import type {
  Artifact,
  ChatLaunchContext,
  ChatMessage,
  ChatOpenRequest,
  ChatSession,
  Headline,
  Workspace,
} from '@/types';
import { hasLaunchContextPrimer } from '@/services/chat/launchContext';
import { buildChatSessionMetadata } from '@/services/chat/launchContext';

export const resolveLaunchContextSessionTitle = (
  artifacts: Artifact[],
  launchContext?: ChatLaunchContext
): string | undefined => {
  if (!launchContext) return undefined;

  if (launchContext.sourceArtifactId) {
    return artifacts.find((entry) => entry.id === launchContext.sourceArtifactId)?.topic;
  }

  return launchContext.entityName || undefined;
};

export const shouldAppendLaunchPrimer = (
  existingMessages: ChatMessage[],
  launchContext?: ChatLaunchContext
): boolean => {
  if (!launchContext) return false;
  return !hasLaunchContextPrimer(existingMessages, launchContext);
};

export const resolveRequestedChatWorkspace = (
  workspaces: Workspace[],
  request: ChatOpenRequest
): Workspace | null =>
  workspaces.find((entry) => entry.id === request.workspaceId) || null;

export const buildRequestedChatSessionInput = (input: {
  artifacts: Artifact[];
  request: ChatOpenRequest;
  workspace: Workspace;
}): {
  workspaceId: string;
  title?: string;
  sourceArtifactId?: string;
  packId?: string;
  purposeId?: string;
  metadata?: Record<string, unknown>;
} => ({
  workspaceId: input.workspace.id,
  title: resolveLaunchContextSessionTitle(input.artifacts, input.request.launchContext),
  sourceArtifactId: input.request.launchContext?.sourceArtifactId,
  packId: input.workspace.packId,
  purposeId: input.workspace.purposeId,
  metadata: buildChatSessionMetadata(undefined, input.request.launchContext),
});

export const buildRequestedLaunchPrimerInput = (input: {
  artifacts: Artifact[];
  headlines: Headline[];
  session: ChatSession;
  workspaceId: string;
}): {
  headlines: Headline[];
  launchContext: ChatLaunchContext;
  reports: Artifact[];
  session: ChatSession;
} | null => {
  const launchContext =
    (input.session.metadata as { launchContext?: ChatLaunchContext } | undefined)?.launchContext || null;
  if (!launchContext) return null;

  return {
    session: input.session,
    launchContext,
    reports: input.artifacts.filter((entry) => entry.workspaceId === input.workspaceId),
    headlines: input.headlines.filter((entry) => entry.workspaceId === input.workspaceId),
  };
};
