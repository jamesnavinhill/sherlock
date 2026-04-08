import { beforeEach, describe, expect, it, vi } from 'vitest';
import { postJsonProviderRequest, streamSseProviderRequest } from './directTransport';

const createJsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const createSseResponse = (chunks: string[], status = 200): Response => {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    }),
    {
      status,
      headers: { 'Content-Type': 'text/event-stream' },
    }
  );
};

describe('direct provider transport', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('posts JSON requests and returns parsed payloads', async () => {
    vi.mocked(fetch).mockResolvedValue(
      createJsonResponse({
        choices: [{ message: { content: 'ok' } }],
      })
    );

    const result = await postJsonProviderRequest<{
      choices?: Array<{ message?: { content?: string } }>;
    }>({
      providerLabel: 'OpenAI',
      url: 'https://example.test/chat',
      headers: { Authorization: 'Bearer test' },
      body: { model: 'gpt-test' },
    });

    expect(result.payload?.choices?.[0]?.message?.content).toBe('ok');
    expect(fetch).toHaveBeenCalledWith('https://example.test/chat', {
      method: 'POST',
      signal: undefined,
      headers: { Authorization: 'Bearer test' },
      body: JSON.stringify({ model: 'gpt-test' }),
    });
  });

  it('surfaces provider-specific error messages for JSON requests', async () => {
    vi.mocked(fetch).mockResolvedValue(
      createJsonResponse(
        {
          error: { message: 'bad upstream key' },
        },
        401
      )
    );

    await expect(
      postJsonProviderRequest<{ error?: { message?: string } }>({
        providerLabel: 'OpenAI',
        url: 'https://example.test/chat',
        headers: {},
        body: {},
        extractErrorMessage: (payload) => payload?.error?.message,
      })
    ).rejects.toThrow('bad upstream key');
  });

  it('streams SSE payloads through the shared accumulator path', async () => {
    vi.mocked(fetch).mockResolvedValue(
      createSseResponse([
        'data: {"delta":"hel"}\n\n',
        'data: not-json\n\n',
        'data: {"delta":"lo"}\n\n',
        'data: [DONE]\n\n',
      ])
    );

    let snapshot = '';
    const start = vi.fn();
    const pushes: string[] = [];

    const result = await streamSseProviderRequest<{ delta?: string }, string>({
      providerLabel: 'OpenAI',
      url: 'https://example.test/stream',
      headers: {},
      body: {},
      accumulator: {
        start,
        push: (delta) => {
          if (!delta) return;
          pushes.push(delta);
          snapshot += delta;
        },
        complete: () => snapshot,
      },
      ignoreEvent: (event) => event.data === '[DONE]',
      parseEventPayload: (event) => JSON.parse(event.data) as { delta?: string },
      resolveDelta: (payload) => payload.delta || '',
    });

    expect(start).toHaveBeenCalledOnce();
    expect(pushes).toEqual(['hel', 'lo']);
    expect(result).toBe('hello');
  });

  it('surfaces provider-specific error messages for streaming requests', async () => {
    vi.mocked(fetch).mockResolvedValue(
      createJsonResponse(
        {
          error: { message: 'rate limited' },
        },
        429
      )
    );

    await expect(
      streamSseProviderRequest<{ error?: { message?: string } }, string>({
        providerLabel: 'OpenRouter',
        url: 'https://example.test/stream',
        headers: {},
        body: {},
        accumulator: {
          start: vi.fn(),
          push: vi.fn(),
          complete: () => '',
        },
        parseEventPayload: (event) => JSON.parse(event.data) as { error?: { message?: string } },
        resolveDelta: () => '',
        extractErrorMessage: (payload) => payload?.error?.message,
      })
    ).rejects.toThrow('rate limited');
  });
});
