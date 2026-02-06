export const toDisplayText = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(toDisplayText).filter(Boolean).join(' ').trim();

    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        if (typeof record.text === 'string') return record.text;
        if (typeof record.content === 'string') return record.content;
        if (record.content) {
            const nested = toDisplayText(record.content);
            if (nested) return nested;
        }

        try {
            return JSON.stringify(value);
        } catch {
            return '';
        }
    }

    return '';
};

const extractJSON = (text: string): string => {
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) return codeBlockMatch[1].trim();

    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) return objectMatch[0];

    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) return arrayMatch[0];

    return text.trim();
};

const extractBalancedJsonCandidates = (text: string): string[] => {
    const candidates: string[] = [];
    const limit = Math.min(text.length, 20000);
    const input = text.slice(0, limit);

    for (let i = 0; i < input.length; i += 1) {
        const start = input[i];
        if (start !== '{' && start !== '[') continue;
        const endChar = start === '{' ? '}' : ']';

        let depth = 0;
        let inString = false;
        let escaped = false;

        for (let j = i; j < input.length; j += 1) {
            const ch = input[j];

            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (ch === '\\') {
                    escaped = true;
                } else if (ch === '"') {
                    inString = false;
                }
                continue;
            }

            if (ch === '"') {
                inString = true;
                continue;
            }

            if (ch === start) depth += 1;
            if (ch === endChar) depth -= 1;

            if (depth === 0) {
                candidates.push(input.slice(i, j + 1));
                i = j;
                break;
            }
        }
    }

    return candidates;
};

export const parseJsonWithFallback = (raw: string): unknown => {
    const trimmed = raw.trim();
    const candidates = [
        trimmed,
        extractJSON(trimmed),
        ...Array.from(trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)).map((match) => match[1].trim()),
        ...extractBalancedJsonCandidates(trimmed),
    ].filter(Boolean);

    for (const candidate of candidates) {
        try {
            return JSON.parse(candidate);
        } catch {
            // Try next candidate.
        }
    }

    throw new Error('PARSE_ERROR: Failed to parse JSON payload from model response');
};
