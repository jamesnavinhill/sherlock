import { buildWorkspaceChatSessionPath } from '@/app/routes';
import { resolveLaunchContextSessionTitle, shouldAppendLaunchPrimer } from '@/app/appShellOpenChatHelpers';
import {
  buildChatSessionMetadata,
  buildLaunchContextPrimer,
  findReusableChatSession,
} from '@/services/chat/launchContext';
import type {
  Artifact,
  ChatMessage,
  ChatOpenRequest,
  ChatSession,
  Headline,
  Workspace,
} from '@/types';

interface OpenWorkspaceChatRequestInput {
  addChatMessage: (message: ChatMessage) => Promise<unknown>;
  addToast: (message: string, type?: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  artifacts: Artifact[];
  chatMessagesBySessionId: Record<string, ChatMessage[]>;
  chatSessions: ChatSession[];
  createChatSession: (input: {
    workspaceId: string;
    title?: string;
    sourceReportId?: string;
    packId?: string;
    purposeId?: string;
    provider?: ChatSession['provider'];
    modelId?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<ChatSession>;
  headlines: Headline[];
  navigate: (path: string) => void;
  request: ChatOpenRequest;
  setActiveChatSessionId: (id: string | null) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  workspaces: Workspace[];
}

export const openWorkspaceChatRequest = async ({
  addChatMessage,
  addToast,
  artifacts,
  chatMessagesBySessionId,
  chatSessions,
  createChatSession,
  headlines,
  navigate,
  request,
  setActiveChatSessionId,
  setActiveWorkspaceId,
  workspaces,
}: OpenWorkspaceChatRequestInput): Promise<ChatSession | null> => {
  const workspace = workspaces.find((entry) => entry.id === request.workspaceId);
  if (!workspace) {
    addToast('Unable to open chat because the target workspace was not found.', 'ERROR');
    return null;
  }

  setActiveWorkspaceId(workspace.id);

  let session = findReusableChatSession(chatSessions, request);
  if (!session) {
    session = await createChatSession({
      workspaceId: workspace.id,
      title: resolveLaunchContextSessionTitle(artifacts, request.launchContext),
      sourceReportId: request.launchContext?.sourceReportId,
      packId: workspace.packId,
      purposeId: workspace.purposeId,
      metadata: buildChatSessionMetadata(undefined, request.launchContext),
    });
  }

  if (request.launchContext) {
    const existingMessages = chatMessagesBySessionId[session.id] || [];
    if (shouldAppendLaunchPrimer(existingMessages, request.launchContext)) {
      const primer = buildLaunchContextPrimer({
        session,
        launchContext: request.launchContext,
        reports: artifacts.filter((entry) => entry.caseId === workspace.id),
        headlines: headlines.filter((entry) => entry.caseId === workspace.id),
      });

      if (primer) {
        await addChatMessage(primer);
      }
    }
  }

  setActiveChatSessionId(session.id);
  navigate(buildWorkspaceChatSessionPath(workspace.id, session.id));
  return session;
};
