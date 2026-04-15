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
  const charsPerLine = Math.max(28, Math.floor(width / 7.2));
  const wrappedLineCount = content
    .split('\n')
    .map((line) => {
      if (!line.trim()) return 1;
      return Math.max(1, Math.ceil(line.length / charsPerLine));
    })
    .reduce((total, lineCount) => total + lineCount, 0);

  return Math.max(420, 120 + wrappedLineCount * 22);
};

const estimateBoardCardHeight = (
  content: string,
  width: number,
  {
    minHeight,
    maxHeight,
    charsPerLineDivisor = 9.2,
    baseHeight = 84,
    lineHeight = 18,
  }: {
    minHeight: number;
    maxHeight: number;
    charsPerLineDivisor?: number;
    baseHeight?: number;
    lineHeight?: number;
  }
) => {
  const charsPerLine = Math.max(20, Math.floor(width / charsPerLineDivisor));
  const wrappedLineCount = content
    .split('\n')
    .map((line) => {
      if (!line.trim()) return 1;
      return Math.max(1, Math.ceil(line.length / charsPerLine));
    })
    .reduce((total, lineCount) => total + lineCount, 0);

  return Math.max(minHeight, Math.min(maxHeight, baseHeight + wrappedLineCount * lineHeight));
};

export const buildBoardCardSpec = (entry: WorkspaceLibraryEntry): BoardCardSpec => {
  switch (entry.kind) {
    case 'ARTIFACT': {
      const width = 1400;
      const artifactBody = (entry.contextText || entry.description || '').trim();
      const content = artifactBody ? `${entry.title}\n\n${artifactBody}` : entry.title;
      return {
        color: getShapeColor(entry),
        w: width,
        h: estimateArtifactCardHeight(content, width),
        iconId: entry.iconId,
        content,
      };
    }
    case 'FINDING': {
      const width = 640;
      const content = `${entry.title}\n\n${clipBoardCardText(
        entry.description || entry.contextText,
        320
      )}`;
      return {
        color: getShapeColor(entry),
        w: width,
        h: estimateBoardCardHeight(content, width, {
          minHeight: 190,
          maxHeight: 240,
        }),
        iconId: entry.iconId,
        content,
      };
    }
    case 'SIGNAL':
    case 'HEADLINE': {
      const width = 640;
      const content = `${entry.title}\n\n${clipBoardCardText(
        entry.description || entry.contextText,
        320
      )}`;
      return {
        color: getShapeColor(entry),
        w: width,
        h: estimateBoardCardHeight(content, width, {
          minHeight: 186,
          maxHeight: 232,
        }),
        iconId: entry.iconId,
        content,
      };
    }
    case 'ENTITY': {
      const meta = [entry.subtitle, clipBoardCardText(entry.description, 72)]
        .filter(Boolean)
        .join(' | ');
      return {
        color: getShapeColor(entry),
        w: 620,
        h: 164,
        iconId: entry.iconId,
        content: meta ? `${entry.title}\n\n${meta}` : entry.title,
      };
    }
    case 'SOURCE':
    case 'LINK':
      return {
        color: getShapeColor(entry),
        w: 430,
        h: 132,
        iconId: entry.iconId,
        content: clipBoardCardText(entry.title, 64),
      };
    case 'NOTE':
    case 'EXCERPT': {
      const width = 640;
      const content = `${entry.title}\n\n${clipBoardCardText(
        entry.contextText || entry.description,
        320
      )}`;
      return {
        color: getShapeColor(entry),
        w: width,
        h: estimateBoardCardHeight(content, width, {
          minHeight: 190,
          maxHeight: 250,
        }),
        iconId: entry.iconId,
        content,
      };
    }
    case 'MEDIA':
    case 'FILE':
      return {
        color: getShapeColor(entry),
        w: 560,
        h: 160,
        iconId: entry.iconId,
        content: `${entry.title}\n\n${clipBoardCardText(
          entry.description || entry.subtitle,
          96
        )}`,
      };
    default:
      return {
        color: getShapeColor(entry),
        w: 560,
        h: 180,
        iconId: entry.iconId,
        content: `${entry.title}\n\n${clipBoardCardText(
          entry.description || entry.contextText,
          120
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
      richText: toRichText(card.content),
    },
  });

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
