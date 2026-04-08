import { useMemo } from 'react';

import type {
  AgentAction,
  Artifact,
  ChatMessage,
  ChatSession,
  Headline,
  Workspace,
  WorkspaceItem,
} from '@/types';
import { getChatLaunchContextFromSession } from '@/services/chat/launchContext';
import { buildMentionCandidates } from '@/components/ui/omniboxModel';
import {
  getGuidedSessionState,
  getLaunchContextSummary,
} from './chatPageUtils';

interface UseChatWorkspaceStateInput {
  activeChatSessionId: string | null;
  activeWorkspaceId: string | null;
  artifacts: Artifact[];
  artifactCardState: {
    expanded: Record<string, boolean>;
    workspaceId: string | null;
  };
  chatActionsBySessionId: Record<string, AgentAction[]>;
  chatMessagesBySessionId: Record<string, ChatMessage[]>;
  chatSessions: ChatSession[];
  headlines: Headline[];
  themeMode: 'dark' | 'light';
  workspaceItems: WorkspaceItem[];
  workspaces: Workspace[];
}

export const useChatWorkspaceState = ({
  activeChatSessionId,
  activeWorkspaceId,
  artifacts,
  artifactCardState,
  chatActionsBySessionId,
  chatMessagesBySessionId,
  chatSessions,
  headlines,
  themeMode,
  workspaceItems,
  workspaces,
}: UseChatWorkspaceStateInput) => {
  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null,
    [activeWorkspaceId, workspaces]
  );

  const workspaceSessions = useMemo(
    () =>
      chatSessions
        .filter((session) => session.workspaceId === activeWorkspace?.id)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [activeWorkspace?.id, chatSessions]
  );

  const activeSession = useMemo(
    () => workspaceSessions.find((session) => session.id === activeChatSessionId) || null,
    [activeChatSessionId, workspaceSessions]
  );

  const launchContext = useMemo(() => getChatLaunchContextFromSession(activeSession), [activeSession]);
  const guidedState = useMemo(() => getGuidedSessionState(activeSession), [activeSession]);
  const messages = useMemo(
    () => (activeSession ? chatMessagesBySessionId[activeSession.id] || [] : []),
    [activeSession, chatMessagesBySessionId]
  );

  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant' && message.content.trim().length > 0);

  const sessionActions = useMemo(
    () =>
      activeSession
        ? [...(chatActionsBySessionId[activeSession.id] || [])].sort(
            (a, b) => b.createdAt - a.createdAt
          )
        : [],
    [activeSession, chatActionsBySessionId]
  );

  const workspaceReports = useMemo(
    () => artifacts.filter((artifact) => artifact.workspaceId === activeWorkspace?.id),
    [activeWorkspace?.id, artifacts]
  );

  const appendableWorkspaceReports = useMemo(
    () =>
      workspaceReports.filter(
        (artifact): artifact is Artifact & { id: string } =>
          typeof artifact.id === 'string' && artifact.id.length > 0
      ),
    [workspaceReports]
  );

  const workspaceSignals = useMemo(
    () => headlines.filter((headline) => headline.workspaceId === activeWorkspace?.id),
    [activeWorkspace?.id, headlines]
  );

  const mentionCandidates = useMemo(
    () =>
      activeWorkspace
        ? buildMentionCandidates({
            workspaceId: activeWorkspace.id,
            artifacts: workspaceReports,
            signals: workspaceSignals,
            workspaceItems,
          })
        : [],
    [activeWorkspace, workspaceItems, workspaceReports, workspaceSignals]
  );

  const launchContextSummary = useMemo(
    () =>
      getLaunchContextSummary({
        launchContext,
        reports: workspaceReports,
        signals: workspaceSignals,
        workspaceItems: workspaceItems.filter((item) => item.workspaceId === activeWorkspace?.id),
      }),
    [activeWorkspace?.id, launchContext, workspaceItems, workspaceReports, workspaceSignals]
  );

  const messageBodyClassName = useMemo(
    () =>
      `prose max-w-none text-sm leading-7 text-zinc-200 prose-p:my-2 prose-ul:my-2 prose-headings:my-3 [&_h1]:text-inherit [&_h2]:text-inherit [&_h3]:text-inherit [&_h4]:text-inherit [&_h5]:text-inherit [&_h6]:text-inherit [&_p]:text-inherit [&_li]:text-inherit [&_ol]:text-inherit [&_ul]:text-inherit [&_strong]:text-inherit [&_em]:text-inherit [&_code]:text-inherit [&_blockquote]:text-inherit ${
        themeMode === 'dark' ? 'prose-invert' : ''
      }`.trim(),
    [themeMode]
  );

  const expandedArtifactIds =
    artifactCardState.workspaceId === activeWorkspace?.id ? artifactCardState.expanded : {};

  return {
    activeSession,
    activeWorkspace,
    appendableWorkspaceReports,
    expandedArtifactIds,
    guidedState,
    launchContext,
    launchContextSummary,
    latestAssistantMessage,
    mentionCandidates,
    messageBodyClassName,
    messages,
    sessionActions,
    workspaceReports,
    workspaceSessions,
    workspaceSignals,
  };
};
