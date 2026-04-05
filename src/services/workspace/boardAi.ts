import { chatWithProviderRouter } from '@/services/providers';
import type {
  Artifact,
  ChatAttachmentKind,
  Signal,
  Workspace,
  WorkspaceContextSnippet,
  WorkspaceItem,
} from '@/types';
import type { WorkspaceLibraryEntry } from './library';

const getEntryContextText = (entry: WorkspaceLibraryEntry) =>
  entry.contextText || entry.description || entry.subtitle || entry.title;

const toAttachmentKind = (kind: WorkspaceLibraryEntry['kind']): ChatAttachmentKind => {
  switch (kind) {
    case 'ARTIFACT':
      return 'REPORT';
    case 'ENTITY':
    case 'SOURCE':
    case 'SIGNAL':
    case 'HEADLINE':
    case 'NOTE':
    case 'LINK':
    case 'FILE':
    case 'MEDIA':
    case 'EXCERPT':
      return kind;
    default:
      return 'CUSTOM';
  }
};

const toSnippet = (entry: WorkspaceLibraryEntry, index: number): WorkspaceContextSnippet => ({
  id: `BOARD-AI-${index}-${entry.refId}`,
  kind: toAttachmentKind(entry.kind),
  title: entry.title,
  snippet: getEntryContextText(entry),
  refId: entry.refId,
  refKind: entry.refKind,
  score: 100 - index,
  metadata: entry.metadata,
});

const buildSelectionDigest = (entries: WorkspaceLibraryEntry[]) =>
  entries
    .map((entry, index) => {
      const suffix = getEntryContextText(entry) ? ` - ${getEntryContextText(entry)}` : '';
      return `${index + 1}. [${entry.kind}] ${entry.title}${suffix}`;
    })
    .join('\n');

export const generateBoardSelectionDraft = async (input: {
  workspace: Workspace;
  artifacts: Artifact[];
  headlines: Signal[];
  selectedEntries: WorkspaceLibraryEntry[];
  mode: 'SUMMARY' | 'NOTE';
}): Promise<{ content: string; title: string }> => {
  const selectionDigest = buildSelectionDigest(input.selectedEntries);
  const snippets = input.selectedEntries.map(toSnippet);
  const modeInstruction =
    input.mode === 'SUMMARY'
      ? 'Write a concise synthesis of the selected workspace items. Focus on key themes, contradictions, and the most actionable insight. Use short paragraphs.'
      : 'Draft a researcher-controlled workspace note based on the selected items. Produce a polished note with a clear headline, concise body, and explicit next steps.';

  const response = await chatWithProviderRouter({
    workspace: input.workspace,
    messages: [
      {
        role: 'system',
        content:
          "You are assisting inside Sherlock's research workspace board. Keep the output factual, grounded in the selected material, and suitable for a note card.",
      },
      {
        role: 'user',
        content: `${modeInstruction}\n\nSelected items:\n${selectionDigest}`,
      },
    ],
    workspaceSummary: input.workspace.description || `${input.workspace.title} workspace`,
    recentArtifacts: input.artifacts.slice(0, 4).map((artifact) => ({
      id: artifact.id,
      topic: artifact.topic,
      summary: artifact.summary,
      dateStr: artifact.dateStr,
    })),
    recentSignals: input.headlines.slice(0, 4).map((signal) => ({
      content: signal.content,
      sourceName: signal.source,
      timestamp: signal.timestamp,
      type: signal.type,
    })),
    retrievedContext: snippets,
  });

  return {
    title:
      input.mode === 'SUMMARY'
        ? `Selection Summary: ${input.selectedEntries[0]?.title || input.workspace.title}`
        : `Board Note: ${input.selectedEntries[0]?.title || input.workspace.title}`,
    content: response.content.trim(),
  };
};

export const buildWorkspaceItemFromBoardDraft = (input: {
  workspaceId: string;
  title: string;
  content: string;
  sourceBoardId?: string;
}): WorkspaceItem => {
  const now = Date.now();

  return {
    id: `workspace-item-${now}`,
    workspaceId: input.workspaceId,
    kind: 'NOTE',
    title: input.title,
    description: input.content.slice(0, 240),
    textContent: input.content,
    createdAt: now,
    updatedAt: now,
    provenance: {
      source: 'USER',
      sourceBoardId: input.sourceBoardId,
      description: 'Created from a manual AI-assisted board action.',
    },
  };
};
