import {
  getAppIconMetadata,
  getAppIconPackLabel,
  listAppIconIds,
  type AppIconId,
  type AppIconOption,
  type AppIconPackId,
} from './appIcons';

const APP_ICON_PACK_ORDER: AppIconPackId[] = ['tabler', 'pixelart', 'lucide'];

const compareAppIconOptions = (
  left: { id: AppIconId; label: string; pack: AppIconPackId },
  right: { id: AppIconId; label: string; pack: AppIconPackId }
) => {
  const packOrder =
    APP_ICON_PACK_ORDER.indexOf(left.pack) - APP_ICON_PACK_ORDER.indexOf(right.pack);
  if (packOrder !== 0) return packOrder;

  const labelOrder = left.label.localeCompare(right.label);
  if (labelOrder !== 0) return labelOrder;

  return left.id.localeCompare(right.id);
};

let appIconOptionsCache: AppIconOption[] | null = null;

export const getAppIconOptions = (): AppIconOption[] => {
  if (appIconOptionsCache) return appIconOptionsCache;

  const candidates = listAppIconIds()
    .map((id) => {
      const metadata = getAppIconMetadata(id);
      const searchText = [
        metadata.label,
        metadata.group,
        getAppIconPackLabel(metadata.pack),
        ...(metadata.searchTerms || []),
      ]
        .join(' ')
        .toLowerCase();

      return {
        id,
        group: metadata.group,
        label: metadata.label,
        pack: metadata.pack,
        searchText,
      };
    })
    .sort(compareAppIconOptions);

  const deduped = new Map<string, (typeof candidates)[number]>();
  for (const option of candidates) {
    const dedupeKey = `${option.pack}:${option.label.toLowerCase()}`;
    if (!deduped.has(dedupeKey)) {
      deduped.set(dedupeKey, option);
    }
  }

  appIconOptionsCache = Array.from(deduped.values()).sort(compareAppIconOptions);
  return appIconOptionsCache;
};
