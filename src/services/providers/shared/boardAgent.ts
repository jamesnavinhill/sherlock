import type {
  BoardAgentProviderRequest,
  BoardAgentResponse,
  BoardAgentStreamOptions,
  BoardAgentStructuredAction,
  ProviderMessage,
} from '../types';
import { parseJsonWithFallback, toDisplayText } from './jsonParsing';

const formatContextParts = (request: BoardAgentProviderRequest): string =>
  request.contextSnapshot.parts
    .sort((left, right) => right.priority - left.priority)
    .map(
      (part) =>
        `## ${part.title}\nKind: ${part.kind}\nPriority: ${part.priority}\n${part.content.trim()}`
    )
    .join('\n\n');

const buildBoardAgentFormatInstruction = (format: 'json' | 'tagged') =>
  format === 'tagged'
    ? `
Return plain text using only these tags and no markdown fences:
<message>markdown message for the user</message>
<action>{"type":"MESSAGE","input":{"text":"..."},"rationale":"..."}</action>
<action>{"type":"PLACE_LINKED_CARD","input":{"refKind":"ARTIFACT","refId":"rep-1"},"rationale":"..."}</action>
<title>optional concise session title</title>

Rules:
- Emit zero or more <action> blocks, one JSON object per block.
- Every action JSON must include "type". Keep "input" and "rationale" optional.
- Only propose inspectable Sherlock board/workspace actions. Do not invent ids outside the provided context.
- If no board mutation is needed, still use <message> and you may omit <action> blocks.
`.trim()
    : `
Return valid JSON with this shape:
{
  "message": "markdown message for the user",
  "actions": [
    {
      "type": "MESSAGE",
      "input": { "text": "..." },
      "rationale": "optional explanation"
    }
  ],
  "suggestedTitle": "optional concise session title"
}

Rules:
- "actions" must be an array.
- Every action object must include "type". Keep "input" and "rationale" optional.
- Only propose inspectable Sherlock board/workspace actions grounded in the provided context.
`.trim();

export const buildBoardAgentSystemPrompt = (request: BoardAgentProviderRequest): string =>
  `
You are Sherlock's research workspace board agent.

Stay grounded in the provided board context. Prefer Sherlock-aware actions tied to canonical records over generic whiteboard behavior.
Be explicit, auditable, and conservative. If the context is insufficient, say what is missing instead of inventing details.

Workspace
- Title: ${request.workspace.title}
- Board: ${request.board.name}
- Pack: ${request.pack.name}
- Purpose: ${request.purpose.name}
- Presentation Mode: ${request.board.presentationMode ? 'ON' : 'OFF'}

Allowed action families for this planning pass:
- MESSAGE
- THINK
- UPDATE_TODO
- SET_VIEWPORT
- PLACE_LINKED_CARD
- MOVE_SHAPES
- ALIGN_SHAPES
- DISTRIBUTE_SHAPES
- GROUP_SELECTION
- CREATE_CONNECTOR
- CREATE_BOARD_NOTE
- CREATE_WORKSPACE_NOTE
- PROMOTE_EXCERPT
- ATTACH_ARTIFACT_SUMMARY
- CREATE_ARTIFACT_DRAFT
- APPEND_NOTE_TO_ARTIFACT
- CREATE_FOLLOW_UP_RUN
- SCHEDULE_FOLLOW_UP
- REVIEW_REGION

Board Context
${formatContextParts(request)}
`.trim();

export const buildBoardAgentMessages = (
  request: BoardAgentProviderRequest,
  format: 'json' | 'tagged'
): ProviderMessage[] => [
  {
    role: 'system',
    content: `${buildBoardAgentSystemPrompt(request)}\n\n${buildBoardAgentFormatInstruction(format)}`,
  },
  {
    role: 'user',
    content: request.userRequest.trim(),
  },
];

export const buildBoardAgentPromptWithFormat = (
  request: BoardAgentProviderRequest,
  format: 'json' | 'tagged'
): string =>
  `
${buildBoardAgentSystemPrompt(request)}

User Request
${request.userRequest.trim()}

${buildBoardAgentFormatInstruction(format)}
`.trim();

const extractTag = (rawText: string, tag: 'message' | 'title'): string => {
  const match = rawText.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1]?.trim() || '';
};

const parseStructuredAction = (value: unknown): BoardAgentStructuredAction | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.type !== 'string' || !record.type.trim()) return null;

  return {
    type: record.type as BoardAgentStructuredAction['type'],
    input:
      record.input && typeof record.input === 'object' && !Array.isArray(record.input)
        ? (record.input as Record<string, unknown>)
        : undefined,
    rationale: typeof record.rationale === 'string' ? record.rationale : undefined,
  };
};

export const extractTaggedBoardAgentActions = (rawText: string): BoardAgentStructuredAction[] => {
  const matches = rawText.matchAll(/<action>([\s\S]*?)<\/action>/gi);
  const actions: BoardAgentStructuredAction[] = [];

  for (const match of matches) {
    const parsed = parseJsonWithFallback(match[1]);
    const action = parseStructuredAction(parsed);
    if (action) {
      actions.push(action);
    }
  }

  return actions;
};

export const extractStreamingBoardAgentMessageText = (rawText: string): string => {
  const startMatch = rawText.match(/<message>/i);
  if (!startMatch || startMatch.index === undefined) {
    return '';
  }

  const afterStart = rawText.slice(startMatch.index + startMatch[0].length);
  const endIndex = afterStart.search(/<\/message>/i);
  const message = endIndex >= 0 ? afterStart.slice(0, endIndex) : afterStart;
  return message.replace(/<action>[\s\S]*$/i, '').replace(/<title>[\s\S]*$/i, '').trimStart();
};

const normalizeTaggedBoardAgentResponse = (
  rawText: string,
  provider: BoardAgentResponse['provider'],
  modelId: string
): BoardAgentResponse | null => {
  const message = extractTag(rawText, 'message');
  const actions = extractTaggedBoardAgentActions(rawText);
  const suggestedTitle = extractTag(rawText, 'title') || undefined;

  if (!message && actions.length === 0 && !suggestedTitle) {
    return null;
  }

  return {
    message: message || 'No board-agent message generated.',
    actions,
    suggestedTitle,
    rawText,
    provider,
    modelId,
  };
};

export const normalizeBoardAgentResponse = (
  rawText: string,
  provider: BoardAgentResponse['provider'],
  modelId: string
): BoardAgentResponse => {
  const tagged = normalizeTaggedBoardAgentResponse(rawText, provider, modelId);
  if (tagged) return tagged;

  const parsed = parseJsonWithFallback(rawText);
  const record =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  const actions = Array.isArray(record.actions)
    ? record.actions
        .map((entry) => parseStructuredAction(entry))
        .filter((entry): entry is BoardAgentStructuredAction => !!entry)
    : [];
  const message = toDisplayText(record.message).trim() || rawText.trim();
  const suggestedTitle = toDisplayText(record.suggestedTitle).trim() || undefined;

  return {
    message: message || 'No board-agent message generated.',
    actions,
    suggestedTitle,
    rawText,
    provider,
    modelId,
  };
};

export const createBoardAgentStreamAccumulator = (
  provider: BoardAgentResponse['provider'],
  modelId: string,
  options?: BoardAgentStreamOptions
) => {
  let snapshot = '';
  let messageSnapshot = '';
  let emittedActionCount = 0;

  return {
    start() {
      options?.onEvent?.({ type: 'START' });
    },
    push(delta: string) {
      if (!delta) return;
      snapshot += delta;
      options?.onEvent?.({ type: 'RAW_DELTA', delta, snapshot });

      const nextMessage = extractStreamingBoardAgentMessageText(snapshot);
      if (nextMessage.length > messageSnapshot.length) {
        const messageDelta = nextMessage.slice(messageSnapshot.length);
        messageSnapshot = nextMessage;
        if (messageDelta) {
          options?.onEvent?.({
            type: 'MESSAGE_DELTA',
            delta: messageDelta,
            snapshot: messageSnapshot,
          });
        }
      }

      const actions = extractTaggedBoardAgentActions(snapshot);
      while (emittedActionCount < actions.length) {
        options?.onEvent?.({
          type: 'ACTION',
          action: actions[emittedActionCount],
          index: emittedActionCount,
          snapshot,
        });
        emittedActionCount += 1;
      }
    },
    complete() {
      const response = normalizeBoardAgentResponse(snapshot, provider, modelId);
      if (emittedActionCount < response.actions.length) {
        for (let index = emittedActionCount; index < response.actions.length; index += 1) {
          options?.onEvent?.({
            type: 'ACTION',
            action: response.actions[index],
            index,
            snapshot,
          });
        }
      }
      options?.onEvent?.({ type: 'COMPLETE', snapshot, response });
      return response;
    },
  };
};
