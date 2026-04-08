import { buildWorkspaceBoardDocumentPath } from '@/app/routes';
import { getWorkspaceDisplayTitle } from '@/domain';
import type {
  AgentAction,
  Artifact,
  ArtifactSection,
  ChatMessage,
  ChatSession,
  InvestigationLaunchRequest,
  Workspace,
  WorkspaceItem,
} from '@/types';
import {
  buildArtifactAppendFromChatMessage,
  buildArtifactDraftFromChatMessage,
  buildFollowUpRunFromChatMessage,
} from '@/services/chat/runtime';
import { buildWorkspaceItemReference } from '@/services/workspace/library';
import { buildWorkspaceExcerptItemFromAttachment } from '@/services/workspace/promotions';

export const promoteChatAttachmentToWorkspace = async ({
  activeSession,
  activeWorkspace,
  addToast,
  attachment,
  createWorkspaceItem,
  ensureWorkspaceBoard,
  message,
  navigate,
  openInBoard = false,
  queueBoardPlacement,
}: {
  activeSession: ChatSession | null;
  activeWorkspace: Workspace | null;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  attachment: NonNullable<ChatMessage['attachments']>[number];
  createWorkspaceItem: (item: WorkspaceItem) => Promise<unknown>;
  ensureWorkspaceBoard: (workspaceId: string) => Promise<{ id: string }>;
  message: ChatMessage;
  navigate: (path: string) => void;
  openInBoard?: boolean;
  queueBoardPlacement: (input: {
    workspaceId: string;
    boardId: string;
    item: ReturnType<typeof buildWorkspaceItemReference>;
    openInBoard?: boolean;
  }) => void;
}) => {
  if (!activeWorkspace || !activeSession) {
    addToast('Open a workspace chat before promoting excerpts.', 'ERROR');
    return;
  }

  const item = buildWorkspaceExcerptItemFromAttachment({
    workspaceId: activeWorkspace.id,
    sessionId: activeSession.id,
    message,
    attachment,
  });
  await createWorkspaceItem(item);

  if (openInBoard) {
    const board = await ensureWorkspaceBoard(activeWorkspace.id);
    queueBoardPlacement({
      workspaceId: activeWorkspace.id,
      boardId: board.id,
      item: buildWorkspaceItemReference(item),
      openInBoard: true,
    });
    navigate(buildWorkspaceBoardDocumentPath(activeWorkspace.id, board.id));
    addToast('Promoted excerpt and placed it on the research board.', 'SUCCESS');
    return;
  }

  addToast('Promoted excerpt to the workspace library.', 'SUCCESS');
};

export const saveChatMessageAsArtifact = async ({
  activeSession,
  activeWorkspace,
  addChatAction,
  addToast,
  saveArtifact,
  message,
}: {
  activeSession: ChatSession | null;
  activeWorkspace: Workspace | null;
  addChatAction: (action: AgentAction) => Promise<unknown>;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  saveArtifact: (
    report: Artifact,
    workspaceSummary?: { topic: string; summary: string }
  ) => Promise<Artifact>;
  message: ChatMessage;
}) => {
  if (!activeSession || !activeWorkspace) return;

  const { report, action } = buildArtifactDraftFromChatMessage({
    session: activeSession,
    workspace: activeWorkspace,
    message,
  });
  const saved = await saveArtifact(report, {
    topic: getWorkspaceDisplayTitle(activeWorkspace),
    summary:
      activeWorkspace.description || `${getWorkspaceDisplayTitle(activeWorkspace)} workspace`,
  });
  await addChatAction({
    ...action,
    result: {
      ...(action.result || {}),
      artifactId: saved.id,
    },
  });
  addToast(`Saved chat draft to ${saved.topic}.`, 'SUCCESS');
};

export const buildAppendArtifactDialogState = ({
  activeSession,
  addToast,
  appendableWorkspaceReports,
  message,
}: {
  activeSession: ChatSession | null;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  appendableWorkspaceReports: Array<Artifact & { id: string }>;
  message: ChatMessage;
}) => {
  if (!activeSession || appendableWorkspaceReports.length === 0) {
    addToast('Save an artifact in this workspace before appending chat notes.', 'ERROR');
    return null;
  }

  return {
    message,
    selectedReportId: appendableWorkspaceReports[0]?.id || '',
  };
};

export const appendChatMessageToArtifact = async ({
  activeSession,
  addChatAction,
  addToast,
  appendArtifactDialog,
  appendSectionToArtifact,
  appendableWorkspaceReports,
  setAppendArtifactDialog,
}: {
  activeSession: ChatSession | null;
  addChatAction: (action: AgentAction) => Promise<unknown>;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  appendArtifactDialog: { message: ChatMessage; selectedReportId: string } | null;
  appendSectionToArtifact: (reportId: string, section: ArtifactSection) => Promise<unknown>;
  appendableWorkspaceReports: Array<Artifact & { id: string }>;
  setAppendArtifactDialog: (value: null) => void;
}) => {
  if (!appendArtifactDialog || !activeSession) return;

  const targetReport = appendableWorkspaceReports.find(
    (artifact) => artifact.id === appendArtifactDialog.selectedReportId
  );
  if (!targetReport) {
    addToast('Select a valid artifact before appending this note.', 'ERROR');
    return;
  }

  const { section, action } = buildArtifactAppendFromChatMessage({
    session: activeSession,
    report: targetReport,
    message: appendArtifactDialog.message,
  });

  await appendSectionToArtifact(targetReport.id, section);
  await addChatAction(action);
  setAppendArtifactDialog(null);
  addToast(`Added this chat note to ${targetReport.topic}.`, 'SUCCESS');
};

export const buildFollowUpDialogState = ({
  activeSession,
  activeWorkspace,
  message,
}: {
  activeSession: ChatSession | null;
  activeWorkspace: Workspace | null;
  message: ChatMessage;
}) => {
  if (!activeSession || !activeWorkspace) return null;

  const { request, action, suggestedTopic } = buildFollowUpRunFromChatMessage({
    session: activeSession,
    workspace: activeWorkspace,
    message,
    workspaceIntent: 'CURRENT',
  });

  return {
    action,
    request,
    topic: suggestedTopic,
  };
};

export const launchChatFollowUp = async ({
  addChatAction,
  addToast,
  followUpDialog,
  onLaunchInvestigation,
  setFollowUpDialog,
}: {
  addChatAction: (action: AgentAction) => Promise<unknown>;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  followUpDialog: {
    action: AgentAction;
    request: InvestigationLaunchRequest;
    topic: string;
  } | null;
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
  setFollowUpDialog: (value: null) => void;
}) => {
  if (!followUpDialog) return;

  const nextTopic = followUpDialog.topic.trim();
  if (!nextTopic) {
    addToast('Enter a follow-up topic before launching the run.', 'ERROR');
    return;
  }

  onLaunchInvestigation({
    ...followUpDialog.request,
    topic: nextTopic,
  });
  await addChatAction({
    ...followUpDialog.action,
    input: {
      ...(followUpDialog.action.input || {}),
      topic: nextTopic,
    },
  });
  setFollowUpDialog(null);
};
