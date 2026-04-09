import type {
  Artifact,
  ChatMentionReference,
  Headline,
  WorkspaceItem,
} from '@/types';
import { sanitizeDisplayTitle } from '@/domain';
import { findMentionMatches } from '@/services/chat/mentions';
import { buildWorkspaceItemSnippet } from '@/services/workspace/workspaceItemText';
import { dedupeResults } from './omniboxSearchUtils';
import type { OmniboxActionId } from './omniboxTypes';

export const buildMentionCandidates = (input: {
  workspaceId: string;
  artifacts: Artifact[];
  signals: Headline[];
  workspaceItems: WorkspaceItem[];
}): ChatMentionReference[] => {
  const artifactCandidates = input.artifacts
    .filter(
      (artifact): artifact is Artifact & { id: string } =>
        artifact.workspaceId === input.workspaceId &&
        typeof artifact.id === 'string' &&
        artifact.id.length > 0
    )
    .map((artifact) => ({
      id: `artifact:${artifact.id}`,
      workspaceId: input.workspaceId,
      kind: 'ARTIFACT' as const,
      refId: artifact.id,
      title: sanitizeDisplayTitle(artifact.topic),
      subtitle: 'Artifact',
      snippet: artifact.summary,
      metadata: {
        artifactType: artifact.artifactType,
      },
    }));

  const findingCandidates = input.artifacts
    .filter((artifact) => artifact.workspaceId === input.workspaceId)
    .flatMap((artifact) =>
      (artifact.keyFindings || [])
        .filter((finding) => typeof finding.id === 'string' && finding.id.length > 0)
        .map((finding) => ({
          id: `finding:${finding.id}`,
          workspaceId: input.workspaceId,
          kind: 'KEY_FINDING' as const,
          refId: finding.id,
          title: sanitizeDisplayTitle(finding.title),
          subtitle: 'Finding',
          snippet: finding.summary,
          metadata: {
            originArtifactId: finding.originArtifactId || artifact.id,
            originSectionId: finding.originSectionId,
            supportRefs: finding.supportRefs,
          },
        }))
    );

  const entityCandidates = new Map<string, ChatMentionReference>();
  input.artifacts
    .filter((artifact) => artifact.workspaceId === input.workspaceId)
    .forEach((artifact) => {
      artifact.entities.forEach((entity) => {
        const title = typeof entity === 'string' ? sanitizeDisplayTitle(entity) : entity.name;
        const key = title.trim().toLowerCase();
        if (!key || entityCandidates.has(key)) return;
        entityCandidates.set(key, {
          id: `entity:${key}`,
          workspaceId: input.workspaceId,
          kind: 'ENTITY',
          refId: key,
          title,
          subtitle: 'Entity',
          snippet: artifact.topic,
          metadata: {
            entityName: title,
            relatedArtifactId: artifact.id,
          },
        });
      });
    });

  const signalCandidates = input.signals
    .filter((signal) => signal.workspaceId === input.workspaceId)
    .map((signal) => ({
      id: `signal:${signal.id}`,
      workspaceId: input.workspaceId,
      kind: 'SIGNAL' as const,
      refId: signal.id,
      title: sanitizeDisplayTitle(signal.source || signal.content),
      subtitle: 'Signal',
      snippet: signal.content,
      metadata: {
        signalType: signal.type,
        threatLevel: signal.threatLevel,
        linkedArtifactId: signal.linkedArtifactId,
      },
    }));

  const itemCandidates = input.workspaceItems
    .filter((item) => item.workspaceId === input.workspaceId)
    .map((item) => ({
      id: `item:${item.id}`,
      workspaceId: input.workspaceId,
      kind: 'WORKSPACE_ITEM' as const,
      refId: item.id,
      title: item.title,
      subtitle: item.kind,
      snippet: buildWorkspaceItemSnippet(item),
      metadata: {
        workspaceItemKind: item.kind,
        url: item.url,
      },
    }));

  return dedupeResults(
    [
      ...itemCandidates,
      ...artifactCandidates,
      ...findingCandidates,
      ...Array.from(entityCandidates.values()),
      ...signalCandidates,
    ].map(
      (candidate, index) => ({
        id: candidate.id,
        kind:
          candidate.kind === 'ARTIFACT'
            ? ('ARTIFACT' as const)
            : candidate.kind === 'KEY_FINDING'
              ? ('FINDING' as const)
            : candidate.kind === 'ENTITY'
              ? ('ENTITY' as const)
              : candidate.kind === 'SIGNAL'
                ? ('SIGNAL' as const)
                : ('WORKSPACE_ITEM' as const),
        title: candidate.title,
        subtitle: candidate.subtitle,
        snippet: candidate.snippet,
        workspaceId: candidate.workspaceId,
        refId: candidate.refId,
        score: 100 - index,
        actions: ['OPEN'] as OmniboxActionId[],
        metadata: candidate.metadata,
      })
    )
  ).map((candidate) => ({
    id: candidate.id,
    workspaceId: candidate.workspaceId || input.workspaceId,
    kind:
      candidate.kind === 'ARTIFACT'
        ? 'ARTIFACT'
        : candidate.kind === 'FINDING'
          ? 'KEY_FINDING'
        : candidate.kind === 'ENTITY'
          ? 'ENTITY'
          : candidate.kind === 'SIGNAL'
            ? 'SIGNAL'
            : 'WORKSPACE_ITEM',
    refId: candidate.refId || candidate.id,
    title: candidate.title,
    subtitle: candidate.subtitle,
    snippet: candidate.snippet,
    metadata: candidate.metadata,
  }));
};

export const resolveMentionQuery = (
  draft: string,
  selectionStart: number,
  candidates: ChatMentionReference[]
) => {
  const prefix = draft.slice(0, selectionStart);
  const match = prefix.match(/(?:^|\s)@([^\n@]*)$/);
  if (!match) {
    return null;
  }

  const query = match[1].trim().toLowerCase();
  const filtered = candidates.filter((candidate) => {
    if (!query) return true;
    const haystack = `${candidate.title} ${candidate.subtitle}`.toLowerCase();
    return haystack.includes(query);
  });

  return {
    query,
    rangeStart: prefix.length - match[1].length - 1,
    rangeEnd: selectionStart,
    results: filtered.slice(0, 6),
  };
};

export const applyMentionSelection = (
  draft: string,
  selectionStart: number,
  selectionEnd: number,
  candidate: ChatMentionReference
) => {
  const resolved = resolveMentionQuery(draft, selectionStart, [candidate]);
  if (!resolved) return null;

  return `${draft.slice(0, resolved.rangeStart)}@${candidate.title} ${draft.slice(selectionEnd)}`;
};

export const resolveDraftMentions = (
  draft: string,
  candidates: ChatMentionReference[]
): ChatMentionReference[] => {
  const matches = findMentionMatches(draft, candidates);
  const seen = new Set<string>();

  return matches.reduce<ChatMentionReference[]>((acc, match) => {
    const key = `${match.mention.kind}:${match.mention.refId}`;
    if (seen.has(key)) return acc;
    seen.add(key);
    acc.push(match.mention);
    return acc;
  }, []);
};
