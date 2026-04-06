import type {
  AgentAction,
  Artifact,
  ChatSession,
  InvestigationScope,
  Workspace,
} from '@/types';
import { createLocalId } from '@/utils/id';
import {
  buildArtifactDraftFromGuidedDraft,
  buildLaunchRequestFromGuidedDraft,
  getGuidedAssistantPrompt,
  getNextGuidedStep,
  getPreviousGuidedStep,
  summarizeGuidedStep,
  type GuidedRunDraft,
  type GuidedSessionState,
} from '@/services/chat/guidedMode';
import { buildGuidedSessionMetadata } from './chatPageUtils';

export const advanceGuidedChatSession = async ({
  activeSession,
  activeWorkspace,
  addChatMessage,
  customScopes,
  guidedState,
  nextDraft,
  updateChatSession,
}: {
  activeSession: ChatSession | null;
  activeWorkspace: Workspace | null;
  addChatMessage: (message: {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    status: 'COMPLETED';
    createdAt: number;
    updatedAt: number;
  }) => Promise<unknown>;
  customScopes: InvestigationScope[];
  guidedState: GuidedSessionState | null;
  nextDraft: GuidedRunDraft;
  updateChatSession: (sessionId: string, patch: { metadata: Record<string, unknown> }) => Promise<unknown>;
}) => {
  if (!activeSession || !guidedState || !activeWorkspace) return;
  const completedStep = guidedState.step;
  const nextStep = getNextGuidedStep(completedStep);
  const nextState: GuidedSessionState = {
    mode: 'GUIDED',
    step: nextStep,
    draft: nextDraft,
    completedAt: nextStep === 'REVIEW' ? Date.now() : undefined,
  };
  const now = Date.now();

  await addChatMessage({
    id: createLocalId('chat-message'),
    sessionId: activeSession.id,
    role: 'user',
    content: summarizeGuidedStep(completedStep, nextDraft, customScopes),
    status: 'COMPLETED',
    createdAt: now,
    updatedAt: now,
  });
  await updateChatSession(activeSession.id, {
    metadata: buildGuidedSessionMetadata(activeSession, nextState),
  });
  await addChatMessage({
    id: createLocalId('chat-message'),
    sessionId: activeSession.id,
    role: 'assistant',
    content: getGuidedAssistantPrompt(nextState, customScopes, activeWorkspace),
    status: 'COMPLETED',
    createdAt: now + 1,
    updatedAt: now + 1,
  });
};

export const rewindGuidedChatSession = async ({
  activeSession,
  guidedState,
  updateChatSession,
}: {
  activeSession: ChatSession | null;
  guidedState: GuidedSessionState | null;
  updateChatSession: (sessionId: string, patch: { metadata: Record<string, unknown> }) => Promise<unknown>;
}) => {
  if (!activeSession || !guidedState) return;
  const previousStep = getPreviousGuidedStep(guidedState.step);
  await updateChatSession(activeSession.id, {
    metadata: buildGuidedSessionMetadata(activeSession, {
      ...guidedState,
      step: previousStep,
      completedAt: undefined,
    }),
  });
};

export const launchGuidedChatRun = async ({
  activeSession,
  activeWorkspace,
  addChatAction,
  customScopes,
  guidedState,
  onLaunchInvestigation,
}: {
  activeSession: ChatSession | null;
  activeWorkspace: Workspace | null;
  addChatAction: (action: AgentAction) => Promise<unknown>;
  customScopes: InvestigationScope[];
  guidedState: GuidedSessionState | null;
  onLaunchInvestigation: (request: ReturnType<typeof buildLaunchRequestFromGuidedDraft>) => void;
}) => {
  if (!guidedState) return;
  onLaunchInvestigation(
    buildLaunchRequestFromGuidedDraft(guidedState.draft, customScopes, activeWorkspace)
  );
  if (activeSession) {
    await addChatAction({
      id: createLocalId('chat-action'),
      sessionId: activeSession.id,
      type: 'CREATE_FOLLOW_UP_RUN',
      status: 'COMPLETED',
      input: {
        topic: guidedState.draft.topic,
        mode: 'GUIDED',
      },
      result: {
        launchSource: 'CHAT_GUIDED_RUN',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
};

export const saveGuidedChatDraft = async ({
  activeSession,
  activeWorkspace,
  addChatAction,
  addToast,
  archiveReport,
  customScopes,
  guidedState,
}: {
  activeSession: ChatSession | null;
  activeWorkspace: Workspace | null;
  addChatAction: (action: AgentAction) => Promise<unknown>;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  archiveReport: (
    report: Artifact,
    workspaceSummary?: { topic: string; summary: string }
  ) => Promise<Artifact>;
  customScopes: InvestigationScope[];
  guidedState: GuidedSessionState | null;
}) => {
  if (!guidedState) return;
  const { report } = buildArtifactDraftFromGuidedDraft(
    guidedState.draft,
    customScopes,
    activeWorkspace
  );
  const saved = await archiveReport(
    guidedState.draft.workspaceIntent === 'CURRENT'
      ? report
      : {
          ...report,
          caseId: undefined,
        },
    guidedState.draft.workspaceIntent === 'CURRENT' && activeWorkspace
      ? {
          topic: activeWorkspace.title,
          summary: activeWorkspace.description || `${activeWorkspace.title} workspace`,
        }
      : undefined
  );

  if (activeSession) {
    await addChatAction({
      id: createLocalId('chat-action'),
      sessionId: activeSession.id,
      type: 'CREATE_ARTIFACT_DRAFT',
      status: 'COMPLETED',
      input: {
        topic: guidedState.draft.topic,
        mode: 'GUIDED',
      },
      result: {
        artifactId: saved.id,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  addToast(`Saved guided brief to ${saved.topic}.`, 'SUCCESS');
};
