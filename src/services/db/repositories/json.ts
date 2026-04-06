const logJsonParseFailure = (label: string | undefined, error: unknown) => {
  if (!label) return;
  console.warn(`Failed to parse ${label}.`, error);
};

export const parseStoredJson = <T>(
  value: string | null | undefined,
  fallback: T,
  label?: string
): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    logJsonParseFailure(label, error);
    return fallback;
  }
};

export const parseStoredJsonOrUndefined = <T>(
  value: string | null | undefined,
  label?: string
): T | undefined => {
  return parseStoredJson<T | undefined>(value, undefined, label);
};

export const serializeStoredJson = (value: unknown): string => JSON.stringify(value);

export const serializeStoredJsonOrNull = (value: unknown): string | null =>
  value === undefined || value === null ? null : JSON.stringify(value);

export const serializeStoredJsonOrUndefined = (
  value: unknown
): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return JSON.stringify(value);
};

export const mapRowsSafely = <TRow, TResult>(
  rows: TRow[],
  {
    label,
    mapRow,
    getRowId,
  }: {
    label: string;
    mapRow: (row: TRow) => TResult;
    getRowId?: (row: TRow) => string | number | undefined;
  }
): TResult[] =>
  rows.flatMap((row) => {
    try {
      return [mapRow(row)];
    } catch (error) {
      const rowId = getRowId?.(row);
      console.warn(
        rowId === undefined
          ? `Failed to hydrate ${label}.`
          : `Failed to hydrate ${label} ${rowId}.`,
        error
      );
      return [];
    }
  });
