import type { Artifact, ChatLaunchContext, ChatMessage } from '@/types';
import { hasLaunchContextPrimer } from '@/services/chat/launchContext';

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
