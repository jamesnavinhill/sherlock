import type {
  ChatSession,
  DomainPack,
  InvestigationScope,
  LabelProfile,
  PurposeProfile,
  Workspace,
  WorkspaceContextBundle,
  WorkspaceContextSnippet,
} from '@/types';
import { getAllScopes, getScopeById } from '../../data/presets';
import {
  getDomainPackById,
  getDomainPackForScope,
  getLabelProfileById,
  getPurposeProfileById,
  getTaskSetupCopy,
} from '../../domain';
import type { ChatTurn, RouterChatRequest } from '../providers/types';

export interface WorkspaceChatRunProfile {
  scope: InvestigationScope;
  pack: DomainPack;
  purpose: PurposeProfile;
  labelProfile: LabelProfile;
}

interface GuidedRuntimeProfileInput {
  purposeId?: string;
  scopeId?: string;
}

const resolveScope = (
  scopeId: string | undefined,
  customScopes: InvestigationScope[] = []
): InvestigationScope => {
  return (
    getScopeById(scopeId || '') ||
    getAllScopes(customScopes).find((scope) => scope.id === scopeId) ||
    getAllScopes(customScopes)[0]
  );
};

export const resolveWorkspaceChatRunProfile = (
  session: Pick<ChatSession, 'packId' | 'purposeId'>,
  workspace: Pick<Workspace, 'scopeId' | 'packId' | 'purposeId' | 'labelProfileId'>
): WorkspaceChatRunProfile => {
  const scope = resolveScope(workspace.scopeId);
  const pack =
    getDomainPackById(session.packId || workspace.packId || '') || getDomainPackForScope(scope);
  const purpose = getPurposeProfileById(
    session.purposeId || workspace.purposeId || pack.defaultPurposeId
  );
  const labelProfile = getLabelProfileById(workspace.labelProfileId || pack.labelProfileId);

  return { scope, pack, purpose, labelProfile };
};

export const resolveGuidedRuntimeProfile = (
  input: GuidedRuntimeProfileInput,
  customScopes: InvestigationScope[] = []
) => {
  const scope = resolveScope(input.scopeId, customScopes);
  const pack = getDomainPackForScope(scope, customScopes);
  const purpose = getPurposeProfileById(input.purposeId || pack.defaultPurposeId);
  const labelProfile = getLabelProfileById(pack.labelProfileId);
  const setupCopy = getTaskSetupCopy(pack, purpose, labelProfile);

  return {
    scope,
    pack,
    purpose,
    labelProfile,
    setupCopy,
  };
};

export const buildWorkspaceChatRouterRequest = (params: {
  contextBundle: WorkspaceContextBundle;
  mentionedContext: WorkspaceContextSnippet[];
  messages: ChatTurn[];
  retrievedContext: WorkspaceContextSnippet[];
  session: Pick<ChatSession, 'modelId' | 'packId' | 'provider' | 'purposeId'>;
}): RouterChatRequest => ({
  workspace: params.contextBundle.workspace,
  configOverride: {
    provider: params.session.provider,
    modelId: params.session.modelId,
  },
  packId: params.session.packId || params.contextBundle.workspace.packId,
  purposeId: params.session.purposeId || params.contextBundle.workspace.purposeId,
  messages: params.messages,
  workspaceSummary: params.contextBundle.summary,
  recentArtifacts: params.contextBundle.recentArtifacts.map((artifact) => ({
    id: artifact.id,
    topic: artifact.topic,
    summary: artifact.summary,
    dateStr: artifact.dateStr,
  })),
  recentSignals: params.contextBundle.recentSignals.map((signal) => ({
    content: signal.content,
    sourceName: signal.source,
    timestamp: signal.timestamp,
    type: signal.type,
  })),
  mentionedContext: params.mentionedContext,
  retrievedContext: params.retrievedContext,
});
