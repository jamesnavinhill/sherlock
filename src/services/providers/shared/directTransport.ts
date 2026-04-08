import { readSseStream, type SseEvent } from './streaming';

interface DirectProviderRequestOptions<TPayload> {
  body: unknown;
  extractErrorMessage?: (payload: TPayload | null) => string | undefined;
  headers: HeadersInit;
  providerLabel: string;
  signal?: AbortSignal;
  url: string;
}

export interface JsonProviderRequestResult<TPayload> {
  payload: TPayload | null;
  rawBody: string;
}

export interface StreamTextAccumulator<TResult> {
  complete: () => TResult;
  push: (delta: string) => void;
  start: () => void;
}

interface StreamProviderRequestOptions<TPayload, TResult>
  extends DirectProviderRequestOptions<TPayload> {
  accumulator: StreamTextAccumulator<TResult>;
  ignoreEvent?: (event: SseEvent) => boolean;
  onPayload?: (payload: TPayload, event: SseEvent) => void;
  parseEventPayload: (event: SseEvent) => TPayload;
  resolveDelta: (payload: TPayload, event: SseEvent) => string;
}

const parseJsonBody = <TPayload>(rawBody: string): TPayload | null => {
  try {
    return JSON.parse(rawBody) as TPayload;
  } catch {
    return null;
  }
};

const buildProviderError = <TPayload>(
  providerLabel: string,
  response: Response,
  payload: TPayload | null,
  extractErrorMessage?: (payload: TPayload | null) => string | undefined
): Error => {
  return new Error(
    extractErrorMessage?.(payload) ||
      `UPSTREAM_ERROR: ${providerLabel} request failed with status ${response.status}`
  );
};

export const postJsonProviderRequest = async <TPayload>(
  options: DirectProviderRequestOptions<TPayload>
): Promise<JsonProviderRequestResult<TPayload>> => {
  const response = await fetch(options.url, {
    method: 'POST',
    signal: options.signal,
    headers: options.headers,
    body: JSON.stringify(options.body),
  });

  const rawBody = await response.text();
  const payload = parseJsonBody<TPayload>(rawBody);

  if (!response.ok) {
    throw buildProviderError(
      options.providerLabel,
      response,
      payload,
      options.extractErrorMessage
    );
  }

  return { payload, rawBody };
};

export const streamSseProviderRequest = async <TPayload, TResult>(
  options: StreamProviderRequestOptions<TPayload, TResult>
): Promise<TResult> => {
  options.accumulator.start();

  const response = await fetch(options.url, {
    method: 'POST',
    signal: options.signal,
    headers: options.headers,
    body: JSON.stringify(options.body),
  });

  if (!response.ok) {
    const rawBody = await response.text();
    const payload = parseJsonBody<TPayload>(rawBody);
    throw buildProviderError(
      options.providerLabel,
      response,
      payload,
      options.extractErrorMessage
    );
  }

  await readSseStream(response, (event) => {
    if (options.ignoreEvent?.(event)) {
      return;
    }

    try {
      const payload = options.parseEventPayload(event);
      options.onPayload?.(payload, event);
      options.accumulator.push(options.resolveDelta(payload, event));
    } catch {
      // Ignore malformed partial events and rely on the final response parse.
    }
  });

  return options.accumulator.complete();
};
