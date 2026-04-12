import {
  AssetRecordType,
  createShapeId,
  toRichText,
  type Editor,
  type TLGeoShape,
  type TLImageShape,
} from 'tldraw';
import type { WorkspaceBoardItemReference } from '@/types';
import { buildAppIconSvgDataUrl } from '@/lib/appIcons';
import type { WorkspaceLibraryEntry } from './library';

export const BOARD_REF_META_KEY = 'sherlockRefJson';

export type BoardThemeMode = 'light' | 'dark';

export type BoardCardColor =
  | 'black'
  | 'blue'
  | 'green'
  | 'grey'
  | 'light-blue'
  | 'light-green'
  | 'light-red'
  | 'light-violet'
  | 'orange'
  | 'red'
  | 'violet'
  | 'white'
  | 'yellow';

export interface BoardCardSpec {
  color: BoardCardColor;
  content: string;
  h: number;
  iconId?: WorkspaceLibraryEntry['iconId'];
  w: number;
}

export const serializeBoardReference = (ref: WorkspaceBoardItemReference) => JSON.stringify(ref);

export const parseBoardReference = (value: unknown): WorkspaceBoardItemReference | null => {
  if (typeof value !== 'string' || value.trim().length === 0) return null;

  try {
    const parsed = JSON.parse(value) as Partial<WorkspaceBoardItemReference>;
    if (
      typeof parsed.workspaceId !== 'string' ||
      typeof parsed.refKind !== 'string' ||
      typeof parsed.refId !== 'string' ||
      typeof parsed.title !== 'string'
    ) {
      return null;
    }

    return {
      workspaceId: parsed.workspaceId,
      refKind: parsed.refKind,
      refId: parsed.refId,
      title: parsed.title,
      workspaceItemKind: parsed.workspaceItemKind,
      metadata: parsed.metadata,
    };
  } catch {
    return null;
  }
};

export const boardReferenceMatches = (
  left: Pick<WorkspaceBoardItemReference, 'workspaceId' | 'refKind' | 'refId'>,
  right: Pick<WorkspaceBoardItemReference, 'workspaceId' | 'refKind' | 'refId'>
) =>
  left.workspaceId === right.workspaceId &&
  left.refKind === right.refKind &&
  left.refId === right.refId;

export const findBoardShapeIdsForReference = (
  shapes: Array<{ id: string; meta?: Record<string, unknown> | null }>,
  target: WorkspaceBoardItemReference
) =>
  shapes
    .filter((shape) => {
      const parsed = parseBoardReference(shape.meta?.[BOARD_REF_META_KEY]);
      return parsed ? boardReferenceMatches(parsed, target) : false;
    })
    .map((shape) => shape.id);

const getShapeColor = (entry: WorkspaceLibraryEntry): BoardCardColor => {
  switch (entry.kind) {
    case 'ARTIFACT':
      return 'blue';
    case 'FINDING':
      return 'violet';
    case 'ENTITY':
      return 'grey';
    case 'SOURCE':
    case 'LINK':
      return 'green';
    case 'SIGNAL':
    case 'HEADLINE':
      return 'orange';
    case 'MEDIA':
      return 'light-violet';
    case 'EXCERPT':
      return 'red';
    case 'NOTE':
      return 'yellow';
    default:
      return 'grey';
  }
};

export const getBoardCardThemeProps = (themeMode: BoardThemeMode, color: BoardCardColor) => ({
  color,
  fill: themeMode === 'light' ? ('none' as const) : ('semi' as const),
  labelColor: themeMode === 'light' ? ('black' as const) : ('white' as const),
});

const clipBoardCardText = (value: string | undefined, maxLength: number) => {
  if (!value) return '';
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
};

const estimateArtifactCardHeight = (content: string, width: number) => {
  const charsPerLine = Math.max(32, Math.floor(width / 8.75));
  const wrappedLineCount = content
    .split('\n')
    .map((line) => {
      if (!line.trim()) return 1;
      return Math.max(1, Math.ceil(line.length / charsPerLine));
    })
    .reduce((total, lineCount) => total + lineCount, 0);

  return Math.max(520, 96 + wrappedLineCount * 18);
};

export const buildBoardCardSpec = (entry: WorkspaceLibraryEntry): BoardCardSpec => {
  switch (entry.kind) {
    case 'ARTIFACT': {
      const width = 520;
      const artifactBody = (entry.contextText || entry.description || '').trim();
      return {
        color: getShapeColor(entry),
        w: width,
        h: estimateArtifactCardHeight(`${entry.title}\n\n${artifactBody}`, width),
        iconId: entry.iconId,
        content: artifactBody ? `${entry.title}\n\n${artifactBody}` : entry.title,
      };
    }
    case 'FINDING':
      return {
        color: getShapeColor(entry),
        w: 340,
        h: 260,
        iconId: entry.iconId,
        content: `${entry.title}\n\n${clipBoardCardText(
          entry.description || entry.contextText,
          280
        )}`,
      };
    case 'SIGNAL':
    case 'HEADLINE':
      return {
        color: getShapeColor(entry),
        w: 300,
        h: 420,
        iconId: entry.iconId,
        content: `${entry.title}\n\n${clipBoardCardText(
          entry.description || entry.contextText,
          360
        )}`,
      };
    case 'ENTITY': {
      const meta = [entry.subtitle, entry.description].filter(Boolean).join(' | ');
      return {
        color: getShapeColor(entry),
        w: 300,
        h: 220,
        iconId: entry.iconId,
        content: meta ? `${entry.title}\n\n${meta}` : entry.title,
      };
    }
    case 'SOURCE':
    case 'LINK':
      return {
        color: getShapeColor(entry),
        w: 320,
        h: 260,
        iconId: entry.iconId,
        content: entry.title,
      };
    case 'NOTE':
    case 'EXCERPT':
      return {
        color: getShapeColor(entry),
        w: 340,
        h: 280,
        iconId: entry.iconId,
        content: `${entry.title}\n\n${clipBoardCardText(
          entry.contextText || entry.description,
          300
        )}`,
      };
    case 'MEDIA':
    case 'FILE':
      return {
        color: getShapeColor(entry),
        w: 320,
        h: 220,
        iconId: entry.iconId,
        content: `${entry.title}\n\n${clipBoardCardText(
          entry.description || entry.subtitle,
          180
        )}`,
      };
    default:
      return {
        color: getShapeColor(entry),
        w: 320,
        h: 240,
        iconId: entry.iconId,
        content: `${entry.title}\n\n${clipBoardCardText(
          entry.description || entry.contextText,
          220
        )}`,
      };
  }
};

export const placeEntryOnBoard = (
  editor: Editor,
  entry: WorkspaceLibraryEntry,
  x: number,
  y: number,
  themeMode: BoardThemeMode
) => {
  const shapeId = createShapeId();
  const card = buildBoardCardSpec(entry);
  const shapeThemeProps = getBoardCardThemeProps(themeMode, card.color);
  const shapeMeta = {
    [BOARD_REF_META_KEY]: serializeBoardReference(entry),
  };
  const cardShapeIds: string[] = [shapeId];

  editor.createShape<TLGeoShape>({
    id: shapeId,
    type: 'geo',
    x,
    y,
    meta: shapeMeta,
    props: {
      geo: 'rectangle',
      dash: 'solid',
      url: entry.url || '',
      w: card.w,
      h: card.h,
      growY: 0,
      scale: 1,
      labelColor: shapeThemeProps.labelColor,
      color: shapeThemeProps.color,
      fill: shapeThemeProps.fill,
      size: 's',
      font: 'sans',
      align: 'start',
      verticalAlign: 'start',
      richText: toRichText(card.iconId ? ` \n${card.content}` : card.content),
    },
  });

  if (card.iconId) {
    const iconAssetId = AssetRecordType.createId(`${entry.refKind}-${entry.refId}-${shapeId}-icon`);
    const iconShapeId = createShapeId();
    const iconSize = 28;
    const iconOffset = 14;
    editor.createAssets([
      {
        id: iconAssetId,
        typeName: 'asset',
        type: 'image',
        props: {
          name: `${entry.title} icon`,
          src: buildAppIconSvgDataUrl(card.iconId, {
            color: themeMode === 'light' ? '#111827' : '#f4f4f5',
            size: 24,
            strokeWidth: 1.9,
          }),
          w: 24,
          h: 24,
          mimeType: 'image/svg+xml',
          isAnimated: false,
        },
        meta: {},
      },
    ]);

    editor.createShape<TLImageShape>({
      id: iconShapeId,
      type: 'image',
      x: x + card.w - iconSize - iconOffset,
      y: y + iconOffset,
      meta: shapeMeta,
      props: {
        w: iconSize,
        h: iconSize,
        assetId: iconAssetId,
        playing: true,
        url: '',
        crop: null,
        flipX: false,
        flipY: false,
        altText: `${entry.title} icon`,
      },
    });

    cardShapeIds.push(iconShapeId as string);
    if (cardShapeIds.length > 1) {
      const groupId = createShapeId();
      editor.groupShapes(cardShapeIds as never[], { groupId });
      editor.setSelectedShapes([groupId]);
      return {
        shapeId: groupId as string,
        card,
      };
    }
  }

  editor.setSelectedShapes([shapeId]);

  return {
    shapeId,
    card,
  };
};

export const placeStandaloneIconOnBoard = (
  editor: Editor,
  input: {
    iconId: string;
    themeMode: BoardThemeMode;
    x: number;
    y: number;
  }
) => {
  const assetId = AssetRecordType.createId(`board-icon-${input.iconId}-${Date.now()}`);
  const shapeId = createShapeId();
  const shapeSize = 56;

  editor.createAssets([
    {
      id: assetId,
      typeName: 'asset',
      type: 'image',
      props: {
        name: `${input.iconId} board icon`,
        src: buildAppIconSvgDataUrl(input.iconId, {
          color: input.themeMode === 'light' ? '#111827' : '#f4f4f5',
          size: 48,
          strokeWidth: 1.9,
        }),
        w: 48,
        h: 48,
        mimeType: 'image/svg+xml',
        isAnimated: false,
      },
      meta: {},
    },
  ]);

  editor.createShape<TLImageShape>({
    id: shapeId,
    type: 'image',
    x: input.x,
    y: input.y,
    meta: {
      sherlockDecoration: 'board-icon',
      iconId: input.iconId,
    },
    props: {
      w: shapeSize,
      h: shapeSize,
      assetId,
      playing: true,
      url: '',
      crop: null,
      flipX: false,
      flipY: false,
      altText: `${input.iconId} board icon`,
    },
  });

  editor.setSelectedShapes([shapeId]);

  return {
    shapeId,
    w: shapeSize,
    h: shapeSize,
  };
};
