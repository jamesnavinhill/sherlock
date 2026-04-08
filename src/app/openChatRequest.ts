import { buildWorkspaceChatSessionPath } from '@/app/routes';
import {
  buildLaunchContextPrimer,
  findReusableChatSession,
} from '@/services/chat/launchContext';
import {
  buildRequestedChatSessionInput,
  buildRequestedLaunchPrimerInput,
  resolveRequestedChatWorkspace,
  shouldAppendLaunchPrimer,
} from '@/app/appShellOpenChatHelpers';
import type {
  Artifact,
  ChatMessage,
  ChatOpenRequest,
  ChatSession,
  Headline,
  Workspace,
  WorkspaceItem,
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
    sourceArtifactId?: string;
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
  workspaceItems: WorkspaceItem[];
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
  workspaceItems,
  workspaces,
}: OpenWorkspaceChatRequestInput): Promise<ChatSession | null> => {
  const workspace = resolveRequestedChatWorkspace(workspaces, request);
  if (!workspace) {
    addToast('Unable to open chat because the target workspace was not found.', 'ERROR');
    return null;
  }

  setActiveWorkspaceId(workspace.id);

  let session = findReusableChatSession(chatSessions, request);
  if (!session) {
    session = await createChatSession(
      buildRequestedChatSessionInput({
        artifacts,
        request,
        workspace,
        workspaceItems,
      })
    );
  }

  if (request.launchContext) {
    const existingMessages = chatMessagesBySessionId[session.id] || [];
    if (shouldAppendLaunchPrimer(existingMessages, request.launchContext)) {
      const primerInput = buildRequestedLaunchPrimerInput({
        artifacts,
        headlines,
        session: {
          ...session,
          metadata: {
            ...(session.metadata || {}),
            launchContext: request.launchContext,
          },
        },
        workspaceId: workspace.id,
        workspaceItems,
      });
      const primer = primerInput ? buildLaunchContextPrimer(primerInput) : null;

      if (primer) {
        await addChatMessage(primer);
      }
    }
  }

  setActiveChatSessionId(session.id);
  navigate(buildWorkspaceChatSessionPath(workspace.id, session.id));
  return session;
};
