import { buildWorkspaceChatPath, buildWorkspaceChatSessionPath } from '@/app/routes';
import type { ChatMessage, ChatSession, InvestigationScope, Workspace } from '@/types';
import { createLocalId } from '@/utils/id';
import {
  createDefaultGuidedSessionState,
  getGuidedAssistantPrompt,
} from '@/services/chat/guidedMode';

export const navigateToChatSession = (
  navigate: (path: string) => void,
  workspaceId: string,
  sessionId: string
) => {
  navigate(buildWorkspaceChatSessionPath(workspaceId, sessionId));
};

export const ensureChatSession = async ({
  activeSession,
  activeWorkspace,
  addToast,
  createChatSession,
  navigate,
  options,
  setActiveChatSessionId,
}: {
  activeSession: ChatSession | null;
  activeWorkspace: Workspace | null;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  createChatSession: (input: {
    workspaceId: string;
    title?: string;
    packId?: string;
    purposeId?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<ChatSession>;
  navigate: (path: string) => void;
  options?: {
    metadata?: Record<string, unknown>;
    title?: string;
  };
  setActiveChatSessionId: (sessionId: string | null) => void;
}): Promise<ChatSession | null> => {
  if (!activeWorkspace) {
    addToast('Select or create a workspace before chatting.', 'ERROR');
    return null;
  }

  if (activeSession) return activeSession;

  const session = await createChatSession({
    workspaceId: activeWorkspace.id,
    title: options?.title,
    packId: activeWorkspace.packId,
    purposeId: activeWorkspace.purposeId,
    metadata: options?.metadata,
  });
  setActiveChatSessionId(session.id);
  navigateToChatSession(navigate, activeWorkspace.id, session.id);
  return session;
};

export const createStandardChatSession = async ({
  activeWorkspace,
  addToast,
  createChatSession,
  navigate,
  setActiveChatSessionId,
  setShowNewMenu,
}: {
  activeWorkspace: Workspace | null;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  createChatSession: (input: {
    workspaceId: string;
    packId?: string;
    purposeId?: string;
  }) => Promise<ChatSession>;
  navigate: (path: string) => void;
  setActiveChatSessionId: (sessionId: string | null) => void;
  setShowNewMenu: (value: boolean) => void;
}) => {
  setShowNewMenu(false);
  if (!activeWorkspace) {
    addToast('Select or create a workspace before starting chat.', 'ERROR');
    return;
  }

  const session = await createChatSession({
    workspaceId: activeWorkspace.id,
    packId: activeWorkspace.packId,
    purposeId: activeWorkspace.purposeId,
  });
  setActiveChatSessionId(session.id);
  navigateToChatSession(navigate, activeWorkspace.id, session.id);
};

export const createGuidedChatSession = async ({
  activeWorkspace,
  addChatMessage,
  addToast,
  createChatSession,
  customScopes,
  navigate,
  setActiveChatSessionId,
  setShowNewMenu,
}: {
  activeWorkspace: Workspace | null;
  addChatMessage: (message: ChatMessage) => Promise<unknown>;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  createChatSession: (input: {
    workspaceId: string;
    title?: string;
    packId?: string;
    purposeId?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<ChatSession>;
  customScopes: InvestigationScope[];
  navigate: (path: string) => void;
  setActiveChatSessionId: (sessionId: string | null) => void;
  setShowNewMenu: (value: boolean) => void;
}) => {
  setShowNewMenu(false);
  if (!activeWorkspace) {
    addToast('Select or create a workspace before starting guided mode.', 'ERROR');
    return;
  }

  const guidedSessionState = createDefaultGuidedSessionState(activeWorkspace, customScopes);
  const session = await createChatSession({
    workspaceId: activeWorkspace.id,
    title: 'Guided Run Builder',
    packId: activeWorkspace.packId,
    purposeId: activeWorkspace.purposeId,
    metadata: {
      sessionMode: 'GUIDED',
      guidedState: guidedSessionState,
    },
  });
  const now = Date.now();
  await addChatMessage({
    id: createLocalId('chat-message'),
    sessionId: session.id,
    role: 'assistant',
    content: getGuidedAssistantPrompt(guidedSessionState, customScopes, activeWorkspace),
    status: 'COMPLETED',
    createdAt: now,
    updatedAt: now,
  });
  setActiveChatSessionId(session.id);
  navigateToChatSession(navigate, activeWorkspace.id, session.id);
};

export const confirmRenameChatSession = async ({
  addToast,
  renameChatSession,
  renameSessionDialog,
  setRenameSessionDialog,
}: {
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  renameChatSession: (sessionId: string, title: string) => Promise<unknown>;
  renameSessionDialog: { session: ChatSession; title: string } | null;
  setRenameSessionDialog: (value: null) => void;
}) => {
  if (!renameSessionDialog) return;

  const nextTitle = renameSessionDialog.title.trim();
  if (!nextTitle) {
    addToast('Enter a session title before saving.', 'ERROR');
    return;
  }

  await renameChatSession(renameSessionDialog.session.id, nextTitle);
  setRenameSessionDialog(null);
  addToast('Renamed chat session.', 'SUCCESS');
};

export const confirmDeleteChatSession = async ({
  activeChatSessionId,
  activeWorkspace,
  addToast,
  deleteChatSession,
  deleteSessionDialog,
  navigate,
  setDeleteSessionDialog,
}: {
  activeChatSessionId: string | null;
  activeWorkspace: Workspace | null;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  deleteChatSession: (sessionId: string) => Promise<unknown>;
  deleteSessionDialog: ChatSession | null;
  navigate: (path: string) => void;
  setDeleteSessionDialog: (value: null) => void;
}) => {
  if (!deleteSessionDialog) return;

  const deletedSession = deleteSessionDialog;
  await deleteChatSession(deletedSession.id);
  setDeleteSessionDialog(null);

  if (activeWorkspace?.id && activeChatSessionId === deletedSession.id) {
    navigate(buildWorkspaceChatPath(activeWorkspace.id));
  }

  addToast('Deleted chat session.', 'SUCCESS');
};
