import type { ChatAttachment, ChatMessage, WorkspaceItem } from '@/types';
import { createLocalId } from '../../utils/id';

const summarizeText = (value: string, max = 240) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 3).trimEnd()}...`;
};

const buildExcerptTitle = (attachment: ChatAttachment) => {
  const title = attachment.title.trim() || 'Chat Excerpt';
  return title.toLowerCase().endsWith('excerpt') ? title : `${title} Excerpt`;
};

export const buildWorkspaceExcerptItemFromAttachment = (input: {
  workspaceId: string;
  sessionId: string;
  message: ChatMessage;
  attachment: ChatAttachment;
}): WorkspaceItem => {
  const textContent =
    input.attachment.snippet?.trim() || summarizeText(input.message.content, 800) || input.attachment.title;
  const now = Date.now();

  return {
    id: createLocalId('workspace-item'),
    workspaceId: input.workspaceId,
    kind: 'EXCERPT',
    title: buildExcerptTitle(input.attachment),
    description: summarizeText(textContent),
    textContent,
    url:
      typeof input.attachment.metadata?.url === 'string' ? input.attachment.metadata.url : undefined,
    provenance: {
      source: 'CHAT',
      sourceMessageId: input.message.id,
      sourceSessionId: input.sessionId,
      sourceReportId:
        input.attachment.kind === 'REPORT' ? input.attachment.refId : undefined,
      sourceHeadlineId:
        input.attachment.kind === 'HEADLINE' ? input.attachment.refId : undefined,
      description: 'Promoted from a chat retrieval excerpt.',
      metadata: {
        attachmentId: input.attachment.id,
        attachmentKind: input.attachment.kind,
        attachmentRefKind: input.attachment.refKind,
        attachmentRefId: input.attachment.refId,
      },
    },
    metadata: {
      attachmentKind: input.attachment.kind,
      attachmentRefId: input.attachment.refId,
      attachmentRefKind: input.attachment.refKind,
      messageRole: input.message.role,
      citationIds: input.message.citations || [],
    },
    createdAt: now,
    updatedAt: now,
  };
};
