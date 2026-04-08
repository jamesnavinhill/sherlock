import type { OmniboxResult } from './omniboxTypes';

const normalize = (value: string) => value.trim().toLowerCase();

const tokenize = (value: string) =>
  normalize(value)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

export const scoreTextMatch = (query: string, fields: Array<string | undefined>, title = '') => {
  const normalizedQuery = normalize(query);
  const tokens = tokenize(query);
  const haystack = fields.filter(Boolean).join(' ').toLowerCase();
  const lowerTitle = title.toLowerCase();

  let score = 0;

  if (!normalizedQuery && tokens.length === 0) {
    return 1;
  }
  if (normalizedQuery && lowerTitle.includes(normalizedQuery)) {
    score += 80;
  }
  if (normalizedQuery && haystack.includes(normalizedQuery)) {
    score += 40;
  }

  tokens.forEach((token) => {
    if (lowerTitle.includes(token)) score += 18;
    if (haystack.includes(token)) score += 8;
  });

  return score;
};

export const dedupeResults = (results: OmniboxResult[]) => {
  const byId = new Map<string, OmniboxResult>();

  results.forEach((result) => {
    const existing = byId.get(result.id);
    if (!existing || existing.score < result.score) {
      byId.set(result.id, result);
    }
  });

  return Array.from(byId.values()).sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if ((right.timestamp || 0) !== (left.timestamp || 0)) {
      return (right.timestamp || 0) - (left.timestamp || 0);
    }
    return left.title.localeCompare(right.title);
  });
};
