/**
 * Browser MCP client for the Yrka tool gateway (https://tools.yrka.io/mcp).
 *
 * Speaks MCP Streamable HTTP: initialize -> notifications/initialized ->
 * tools/call, mirroring the server-side helper (bin/mcp.py in the
 * yrka-mcp skill). Used by the YRKA provider adapter for web search.
 *
 * NOTE: browser -> tools.yrka.io/mcp requires the gateway to send
 * `Access-Control-Allow-Origin` for the app origin (sherlock.navinhill.com).
 * If CORS is not configured, these calls fail in the browser and the search
 * hop must move behind a same-origin proxy instead.
 */

const MCP_GATEWAY_URL = 'https://tools.yrka.io/mcp';
const MCP_PROTOCOL_VERSION = '2025-06-18';
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export interface McpSearchResult {
  url: string;
  title?: string;
  content?: string;
}

interface McpCallOptions {
  token: string;
  signal?: AbortSignal;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseSsePayloads = (text: string): unknown[] => {
  const payloads: unknown[] = [];
  for (const chunk of text.split('\n\n')) {
    for (const line of chunk.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice('data:'.length).trim();
      if (!data || data === '[DONE]') continue;
      try {
        payloads.push(JSON.parse(data));
      } catch {
        // Ignore non-JSON SSE frames.
      }
    }
  }
  return payloads;
};

const mcpPost = async (
  body: Record<string, unknown>,
  options: McpCallOptions & { sessionId?: string }
): Promise<{ payload: unknown; sessionId?: string }> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    'User-Agent': BROWSER_USER_AGENT,
    Authorization: `Bearer ${options.token}`,
  };
  if (options.sessionId) {
    headers['Mcp-Session-Id'] = options.sessionId;
  }

  const response = await fetch(MCP_GATEWAY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (response.status === 429) {
    const retryError = new Error('MCP gateway rate limited (429)') as Error & {
      status?: number;
    };
    retryError.status = 429;
    throw retryError;
  }
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `MCP gateway request failed with status ${response.status}${text ? `: ${text.slice(0, 300)}` : ''}`
    );
  }

  const sessionId =
    response.headers.get('Mcp-Session-Id') || options.sessionId || undefined;
  const contentType = response.headers.get('Content-Type') || '';
  const raw = await response.text();

  let payload: unknown;
  if (contentType.includes('text/event-stream')) {
    const payloads = parseSsePayloads(raw);
    payload = payloads[payloads.length - 1];
  } else {
    payload = raw ? JSON.parse(raw) : null;
  }

  if (payload && typeof payload === 'object' && 'error' in payload) {
    throw new Error(
      `MCP error: ${JSON.stringify((payload as { error: unknown }).error).slice(0, 300)}`
    );
  }

  return { payload, sessionId };
};

/**
 * Calls an MCP tool, performing the initialize handshake first.
 * Retries rate-limited (429) calls with exponential backoff.
 */
export const callMcpTool = async (
  toolName: string,
  args: Record<string, unknown>,
  options: McpCallOptions
): Promise<unknown> => {
  const maxAttempts = 4;
  let attempt = 0;

  for (;;) {
    try {
      let id = 1;

      const init = await mcpPost(
        {
          jsonrpc: '2.0',
          id: id++,
          method: 'initialize',
          params: {
            protocolVersion: MCP_PROTOCOL_VERSION,
            capabilities: {},
            clientInfo: { name: 'sherlock', version: '1.0' },
          },
        },
        options
      );
      const sessionId = init.sessionId;

      // Fire-and-forget the initialized notification (server may not respond).
      try {
        await mcpPost(
          { jsonrpc: '2.0', method: 'notifications/initialized' },
          { ...options, sessionId }
        );
      } catch {
        // Non-fatal: some servers accept calls without the notification.
      }

      const call = await mcpPost(
        {
          jsonrpc: '2.0',
          id: id++,
          method: 'tools/call',
          params: { name: toolName, arguments: args },
        },
        { ...options, sessionId }
      );

      const result = extractResultPayload(call.payload);
      return result;
    } catch (error) {
      attempt += 1;
      const status = (error as { status?: unknown } | null | undefined)?.status;
      const isRateLimited =
        status === 429 ||
        (error instanceof Error && /429|rate/i.test(error.message));
      if (!isRateLimited || attempt >= maxAttempts) throw error;
      await wait(1000 * 2 ** (attempt - 1));
    }
  }
};

const extractResultPayload = (payload: unknown): unknown => {
  if (payload && typeof payload === 'object' && 'result' in payload) {
    const result = (payload as { result?: unknown }).result;
    return result ?? payload;
  }
  return payload;
};

const extractTextContent = (result: unknown): string => {
  if (typeof result === 'string') return result;
  const content =
    result && typeof result === 'object' && 'content' in result
      ? (result as { content?: unknown }).content
      : undefined;
  if (Array.isArray(content)) {
    return content
      .map((block) =>
        block && typeof block === 'object' && 'text' in block &&
        typeof (block as { text?: unknown }).text === 'string'
          ? ((block as { text: string }).text as string)
          : ''
      )
      .filter(Boolean)
      .join('\n\n');
  }
  if (typeof content === 'string') return content;
  return '';
};

const HEADING_PATTERN = /^###\s*\d+\.\s*\[(.+?)\]\((.+?)\)\s*$/;

/**
 * Parses the gateway's markdown search output into {url, title, content}
 * sections. Matches the citation shape Sherlock's evidence pipeline expects.
 */
export const parseMcpSearchMarkdown = (markdown: string): McpSearchResult[] => {
  const results: McpSearchResult[] = [];
  let current: { title: string; url: string; lines: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const content = current.lines.join('\n').trim();
    if (current.url) {
      results.push({
        url: current.url,
        title: current.title || undefined,
        content: content || undefined,
      });
    }
    current = null;
  };

  for (const line of markdown.split('\n')) {
    const match = HEADING_PATTERN.exec(line.trim());
    if (match) {
      flush();
      current = { title: match[1].trim(), url: match[2].trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  flush();

  return results;
};

export interface McpSearchOptions extends McpCallOptions {
  maxResults?: number;
}

/**
 * Web search via the MCP gateway. `you_search` is primary; `tavily_search`
 * (same backend, separate credit pool) is the fallback.
 */
export const searchWebViaMcp = async (
  query: string,
  options: McpSearchOptions
): Promise<McpSearchResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const count = Math.min(10, Math.max(1, Math.round(options.maxResults ?? 5)));

  const attempts: Array<{ tool: string; args: Record<string, unknown> }> = [
    { tool: 'you_search', args: { query: trimmed, count } },
    { tool: 'tavily_search', args: { query: trimmed } },
  ];

  let lastError: unknown = null;
  for (const attempt of attempts) {
    try {
      const result = await callMcpTool(attempt.tool, attempt.args, options);
      const text = extractTextContent(result);
      const parsed = parseMcpSearchMarkdown(text);
      if (parsed.length > 0) return parsed.slice(0, count);
      // Empty parse with no error: fall through to the next backend.
      lastError = new Error(`${attempt.tool} returned no parseable results`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('MCP web search failed on all backends');
};
