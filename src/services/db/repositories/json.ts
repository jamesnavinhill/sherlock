export const parseStoredJson = <T>(
  value: string | null | undefined,
  fallback: T,
  label?: string
): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    if (label) {
      console.warn(`Failed to parse ${label}.`, error);
    }
    return fallback;
  }
};

export const parseStoredJsonOrUndefined = <T>(
  value: string | null | undefined,
  label?: string
): T | undefined => {
  return parseStoredJson<T | undefined>(value, undefined, label);
};
