/**
 * Entity Normalization Utilities
 * Logic extracted from EntityResolution for cross-system consistency.
 */

// Simple Levenshtein distance for fuzzy matching
export const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

/**
 * Advanced cleaning: Removes markdown, parenthesis content, and special chars.
 * This is the canonical "raw" form for deduplication.
 */
export const getCoreName = (str: string): string => {
    if (!str) return '';
    let s = str.toLowerCase();
    s = s.replace(/[*_~`]/g, '');
    s = s.replace(/\s*\(.*?\)/g, '').replace(/\s*\[.*?\]/g, '');
    s = s.replace(/[.,;:"'!?]/g, '');
    return s.trim().replace(/\s+/g, ' ');
};

export const getTokens = (str: string): Set<string> => {
    return new Set(getCoreName(str).split(' ').filter(t => t.length > 0));
};

/**
 * Checks if two entity names are likely referring to the same entity.
 */
export const isLikelySameEntity = (nameA: string, nameB: string): boolean => {
    const coreA = getCoreName(nameA);
    const coreB = getCoreName(nameB);

    if (coreA === coreB) return true;

    // Fuzzy match for longer names
    if (coreA.length > 5 && coreB.length > 5) {
        const distance = getLevenshteinDistance(coreA, coreB);
        const threshold = Math.min(coreA.length, coreB.length) * 0.2; // 20% diff tolerated
        if (distance <= threshold) return true;
    }

    return false;
};
