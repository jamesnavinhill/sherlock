import type { WorkspaceItem } from '@/types';

type WorkspaceItemTextInput = Pick<
  WorkspaceItem,
  'kind' | 'title' | 'description' | 'textContent' | 'url' | 'fileName' | 'tags' | 'provenance'
>;

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

export const getWorkspaceItemFallbackSummary = (item: Pick<WorkspaceItemTextInput, 'kind'>) =>
  `Saved workspace ${item.kind.toLowerCase()}.`;

export const getWorkspaceItemPrimaryText = (
  item: WorkspaceItemTextInput,
  fallback = getWorkspaceItemFallbackSummary(item)
) => item.description || item.textContent || item.url || item.fileName || fallback;

export const summarizeWorkspaceItemText = (
  value: string | undefined,
  max = 280
): string | undefined => {
  if (!value) return undefined;
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}...`;
};

export const buildWorkspaceItemSearchFields = (item: WorkspaceItemTextInput): string[] => [
  item.title,
  item.kind,
  item.description || '',
  item.textContent || '',
  item.url || '',
  item.fileName || '',
  item.provenance?.source || '',
  ...(item.tags || []),
].filter(Boolean);

export const buildWorkspaceItemSearchText = (item: WorkspaceItemTextInput) =>
  buildWorkspaceItemSearchFields(item).join(' ');

export const buildWorkspaceItemContextText = (item: WorkspaceItemTextInput) =>
  [
    item.title,
    item.textContent || '',
    item.description || '',
    item.url || '',
    item.fileName || '',
    ...(item.tags || []),
  ]
    .filter(Boolean)
    .join('\n');

export const buildWorkspaceItemSnippet = (item: WorkspaceItemTextInput, max = 280) =>
  summarizeWorkspaceItemText(getWorkspaceItemPrimaryText(item), max);
