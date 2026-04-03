import type { ChatStreamOptions } from '../types';

export interface SseEvent {
    event: string;
    data: string;
}

export const createChatStreamAccumulator = (options?: ChatStreamOptions) => {
    let snapshot = '';

    return {
        start() {
            options?.onEvent?.({ type: 'START' });
        },
        push(delta: string) {
            if (!delta) return;
            snapshot += delta;
            options?.onEvent?.({ type: 'DELTA', delta, snapshot });
        },
        complete() {
            options?.onEvent?.({ type: 'COMPLETE', snapshot });
            return snapshot;
        },
        getSnapshot() {
            return snapshot;
        },
    };
};

const parseSseChunk = (chunk: string): SseEvent | null => {
    const lines = chunk.split(/\r?\n/);
    let event = 'message';
    const data: string[] = [];

    for (const line of lines) {
        if (!line || line.startsWith(':')) continue;
        if (line.startsWith('event:')) {
            event = line.slice(6).trim() || 'message';
            continue;
        }
        if (line.startsWith('data:')) {
            data.push(line.slice(5).trimStart());
        }
    }

    if (data.length === 0) return null;
    return { event, data: data.join('\n') };
};

export const readSseStream = async (
    response: Response,
    onEvent: (event: SseEvent) => void
): Promise<void> => {
    if (!response.body) {
        throw new Error('UPSTREAM_ERROR: Streaming response body was empty.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const flushBuffer = (force = false) => {
        const separator = /\r?\n\r?\n/;
        let match = separator.exec(buffer);

        while (match) {
            const rawEvent = buffer.slice(0, match.index);
            buffer = buffer.slice(match.index + match[0].length);
            const parsed = parseSseChunk(rawEvent);
            if (parsed) onEvent(parsed);
            match = separator.exec(buffer);
        }

        if (force && buffer.trim().length > 0) {
            const parsed = parseSseChunk(buffer);
            if (parsed) onEvent(parsed);
            buffer = '';
        }
    };

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        flushBuffer();
    }

    buffer += decoder.decode();
    flushBuffer(true);
};
