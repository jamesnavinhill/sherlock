const DEFAULT_ARRAY_KEYS = [
  'items',
  'results',
  'data',
  'list',
  'entries',
  'events',
  'leads',
  'agendas',
];

const PREFERRED_TEXT_KEYS = [
  'description',
  'summary',
  'title',
  'topic',
  'headline',
  'name',
  'content',
  'text',
  'message',
  'label',
];

const MAX_DEPTH = 6;

export const getCaseInsensitiveField = (record: Record<string, unknown>, key: string): unknown => {
  if (key in record) return record[key];

  const match = Object.keys(record).find(
    (candidate) => candidate.toLowerCase() === key.toLowerCase()
  );

  return match ? record[match] : undefined;
};

const tryParseJsonString = (value: string): unknown | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const looksLikeObject = trimmed.startsWith('{') && trimmed.endsWith('}');
  const looksLikeArray = trimmed.startsWith('[') && trimmed.endsWith(']');
  if (!looksLikeObject && !looksLikeArray) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const normalizeHumanTextInternal = (
  value: unknown,
  includePriority: boolean,
  depth: number
): string => {
  if (depth >= MAX_DEPTH) return '';

  if (typeof value === 'string') {
    const parsed = tryParseJsonString(value);
    if (parsed !== null) {
      const parsedText = normalizeHumanTextInternal(parsed, includePriority, depth + 1).trim();
      if (parsedText) return parsedText;
    }
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeHumanTextInternal(entry, includePriority, depth + 1).trim())
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  if (!value || typeof value !== 'object') return '';

  const record = value as Record<string, unknown>;
  let baseText = '';

  for (const key of PREFERRED_TEXT_KEYS) {
    const fieldValue = getCaseInsensitiveField(record, key);
    if (fieldValue === undefined || fieldValue === null) continue;
    const text = normalizeHumanTextInternal(fieldValue, includePriority, depth + 1).trim();
    if (text) {
      baseText = text;
      break;
    }
  }

  if (!baseText) {
    try {
      baseText = JSON.stringify(value);
    } catch {
      baseText = '';
    }
  }

  if (!includePriority || !baseText || /priority/i.test(baseText)) {
    return baseText.trim();
  }

  const rawPriority = getCaseInsensitiveField(record, 'priority');
  const priorityText = normalizeHumanTextInternal(rawPriority, false, depth + 1).trim();
  if (!priorityText) return baseText.trim();

  return `${baseText.trim()} (Priority: ${priorityText})`;
};

export const normalizeHumanText = (
  value: unknown,
  options?: { includePriority?: boolean; fallback?: string }
): string => {
  const includePriority = options?.includePriority ?? true;
  const fallback = options?.fallback ?? '';
  const normalized = normalizeHumanTextInternal(value, includePriority, 0).trim();
  return normalized || fallback;
};

export const normalizeTopicText = (value: unknown, fallback = 'Untitled Investigation'): string => {
  return normalizeHumanText(value, { includePriority: false, fallback });
};

export const unwrapArrayContainer = (
  value: unknown,
  keys: string[] = DEFAULT_ARRAY_KEYS
): unknown[] => {
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    const parsed = tryParseJsonString(value);
    return parsed === null ? [] : unwrapArrayContainer(parsed, keys);
  }

  if (!value || typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = getCaseInsensitiveField(record, key);
    if (Array.isArray(candidate)) return candidate;

    if (typeof candidate === 'string') {
      const parsed = tryParseJsonString(candidate);
      if (Array.isArray(parsed)) return parsed;
    }
  }

  return [];
};
