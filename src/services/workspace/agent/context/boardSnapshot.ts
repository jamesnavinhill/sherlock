import type { BoardAgentBoardShapeSummary, BoardAgentViewportBounds } from '../types';
import {
  BOARD_REF_META_KEY as BOARD_AGENT_REF_META_KEY,
  parseBoardReference as parseBoardAgentReference,
} from '../../boardShapes';

export { BOARD_AGENT_REF_META_KEY };

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asFiniteNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const clipText = (value: string, maxLength: number) =>
  value.length <= maxLength ? value : `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;

const collectText = (value: unknown, bucket: string[]) => {
  if (typeof value === 'string') {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (normalized) bucket.push(normalized);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectText(entry, bucket));
    return;
  }

  const record = asRecord(value);
  if (!record) return;

  Object.values(record).forEach((entry) => collectText(entry, bucket));
};

const extractShapeText = (props: Record<string, unknown> | null): string | undefined => {
  if (!props) return undefined;

  const textCandidates = [props.text, props.label, props.richText];
  const bucket: string[] = [];
  textCandidates.forEach((entry) => collectText(entry, bucket));
  const normalized = bucket.join(' ').replace(/\s+/g, ' ').trim();
  return normalized ? clipText(normalized, 240) : undefined;
};

const extractStoreRecords = (snapshot: unknown): Record<string, unknown>[] => {
  const root = asRecord(snapshot);
  if (!root) return [];

  const directStore = asRecord(root.store);
  if (directStore) {
    return Object.values(directStore).flatMap((entry) => {
      const record = asRecord(entry);
      if (!record) return [];
      return [record];
    });
  }

  const document = asRecord(root.document);
  const documentStore = asRecord(document?.store);
  if (documentStore) {
    return Object.values(documentStore).flatMap((entry) => {
      const record = asRecord(entry);
      if (!record) return [];
      return [record];
    });
  }

  return [];
};

export const extractBoardShapeSummaries = (snapshot: unknown): BoardAgentBoardShapeSummary[] =>
  extractStoreRecords(snapshot)
    .map<BoardAgentBoardShapeSummary | null>((record) => {
      const id = typeof record.id === 'string' ? record.id : null;
      const type = typeof record.type === 'string' ? record.type : null;
      const x = asFiniteNumber(record.x);
      const y = asFiniteNumber(record.y);
      if (!id || !type || x === null || y === null) return null;

      const props = asRecord(record.props);
      const meta = asRecord(record.meta);

      return {
        id,
        type,
        x,
        y,
        w: asFiniteNumber(props?.w) ?? undefined,
        h: asFiniteNumber(props?.h) ?? undefined,
        text: extractShapeText(props),
        linkedRef: parseBoardAgentReference(meta?.[BOARD_AGENT_REF_META_KEY]) || undefined,
      } satisfies BoardAgentBoardShapeSummary;
    })
    .filter((shape): shape is BoardAgentBoardShapeSummary => !!shape);

export const shapeIntersectsViewport = (
  shape: BoardAgentBoardShapeSummary,
  viewport: BoardAgentViewportBounds | null | undefined
) => {
  if (!viewport) return true;

  const shapeRight = shape.x + (shape.w ?? 1);
  const shapeBottom = shape.y + (shape.h ?? 1);
  const viewportRight = viewport.x + viewport.w;
  const viewportBottom = viewport.y + viewport.h;

  return (
    shape.x < viewportRight &&
    shapeRight > viewport.x &&
    shape.y < viewportBottom &&
    shapeBottom > viewport.y
  );
};
