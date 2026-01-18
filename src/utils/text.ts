/**
 * Text manipulation utilities for Sherlock AI
 */

/**
 * Cleans entity names by removing markdown formatting and type prefixes
 */
export const cleanEntityName = (raw: string): string => {
    if (!raw) return '';
    let s = String(raw);
    // Remove type prefixes like [PERSON] or [ORG]
    s = s.replace(/^[*_]*\[(PERSON|ORG)\][*_]*\s*/i, '');
    // Remove markdown links
    s = s.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    // Remove bold/italic markers
    s = s.replace(/^[*_]{2,}|[*_]{2,}$/g, '');
    // Remove brackets
    s = s.replace(/^\[+|\]+$/g, '');
    return s.trim();
};

/**
 * Truncates text to a maximum length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength - 3) + '...';
};

/**
 * Normalizes a string for use as an ID (lowercase, alphanumeric only)
 */
export const normalizeId = (str: string): string => {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};
