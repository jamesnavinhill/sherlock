import type { ChatMentionReference, WorkspaceContextSnippet } from '@/types';

const sortMentionsForMatching = (mentions: ChatMentionReference[]) =>
  [...mentions].sort((left, right) => {
    if (right.title.length !== left.title.length) {
      return right.title.length - left.title.length;
    }
    return left.title.localeCompare(right.title);
  });

const overlaps = (
  ranges: Array<{ start: number; end: number }>,
  start: number,
  end: number
) => ranges.some((range) => start < range.end && end > range.start);

export const dedupeChatMentionReferences = (mentions: ChatMentionReference[]) => {
  const seen = new Set<string>();
  return mentions.filter((mention) => {
    const key = `${mention.kind}:${mention.refId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const findMentionMatches = (
  text: string,
  mentions: ChatMentionReference[]
): Array<{ mention: ChatMentionReference; start: number; end: number }> => {
  const normalizedText = text.toLowerCase();
  const occupiedRanges: Array<{ start: number; end: number }> = [];
  const matches: Array<{ mention: ChatMentionReference; start: number; end: number }> = [];

  for (const mention of sortMentionsForMatching(dedupeChatMentionReferences(mentions))) {
    const token = `@${mention.title}`.toLowerCase();
    let searchStart = 0;

    while (searchStart < normalizedText.length) {
      const start = normalizedText.indexOf(token, searchStart);
      if (start === -1) break;

      const end = start + token.length;
      const nextCharacter = normalizedText[end] || '';
      const validBoundary =
        nextCharacter.length === 0 || /[\s.,;:!?()[\]{}"'`/-]/.test(nextCharacter);

      if (validBoundary && !overlaps(occupiedRanges, start, end)) {
        occupiedRanges.push({ start, end });
        matches.push({ mention, start, end });
      }

      searchStart = end;
    }
  }

  return matches.sort((left, right) => left.start - right.start);
};

export const mapMentionToWorkspaceContextSnippet = (
  mention: ChatMentionReference
): WorkspaceContextSnippet => ({
  id: `CTX-MENTION-${mention.kind}-${mention.refId}`,
  kind:
    mention.kind === 'ARTIFACT'
      ? 'REPORT'
      : mention.kind === 'KEY_FINDING'
        ? 'FINDING'
      : mention.kind === 'ENTITY'
        ? 'ENTITY'
        : mention.kind === 'SIGNAL'
          ? 'SIGNAL'
          : ((mention.metadata?.workspaceItemKind as WorkspaceContextSnippet['kind'] | undefined) ||
            'NOTE'),
  title: mention.title,
  snippet: mention.snippet || mention.subtitle,
  refId: mention.refId,
  refKind:
    mention.kind === 'ARTIFACT'
      ? 'REPORT'
      : mention.kind === 'KEY_FINDING'
        ? 'KEY_FINDING'
      : mention.kind === 'ENTITY'
        ? 'ENTITY'
        : mention.kind === 'SIGNAL'
          ? 'SIGNAL'
          : 'WORKSPACE_ITEM',
  score: 180,
  metadata: {
    ...(mention.metadata || {}),
    workspaceId: mention.workspaceId,
    mentionKind: mention.kind,
  },
});
