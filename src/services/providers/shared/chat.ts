import type { ChatRequest, ChatResponse } from '../types';
import { parseJsonWithFallback, toDisplayText } from './jsonParsing';

const formatConversation = (messages: ChatRequest['messages']): string =>
    messages
        .map((message) => `${message.role.toUpperCase()}:\n${message.content.trim()}`)
        .join('\n\n');

export const buildWorkspaceChatPrompt = (request: ChatRequest): string => {
    const artifactLines = request.recentArtifacts.length
        ? request.recentArtifacts
              .map(
                  (artifact) =>
                      `- ${artifact.topic}${artifact.dateStr ? ` (${artifact.dateStr})` : ''}: ${artifact.summary}`
              )
              .join('\n')
        : '- No saved artifacts yet.';

    const headlineLines = request.recentHeadlines.length
        ? request.recentHeadlines
              .map(
                  (headline) =>
                      `- [${headline.type}] ${headline.sourceName}: ${headline.content} (${headline.timestamp})`
              )
              .join('\n')
        : '- No saved signals yet.';

    const contextLines = request.retrievedContext.length
        ? request.retrievedContext
              .map(
                  (item) =>
                      `[${item.id}] ${item.title}\nKind: ${item.kind}\nSnippet: ${item.snippet}`
              )
              .join('\n\n')
        : 'No high-confidence workspace snippets were retrieved for this turn.';

    return `
You are Sherlock's workspace chat assistant.

Stay grounded in the current workspace. Prefer the provided workspace materials over general knowledge.
If the answer is not supported by the workspace context, say so clearly and note what is missing.
Keep the answer concise, practical, and easy to scan.

Workspace
- Title: ${request.workspace.title}
- Summary: ${request.workspaceSummary}
- Pack: ${request.pack.name}
- Purpose: ${request.purpose.name}

Recent Artifacts
${artifactLines}

Recent Signals
${headlineLines}

Retrieved Workspace Context
${contextLines}

Conversation
${formatConversation(request.messages)}

Return valid JSON with this shape:
{
  "content": "markdown answer",
  "citations": ["CTX-REPORT-abc", "CTX-HEADLINE-def"],
  "suggestedTitle": "optional concise session title"
}

Rules:
- Only cite ids that appear in Retrieved Workspace Context.
- If you do not use any retrieved context, return an empty citations array.
- Do not wrap the JSON in markdown fences.
`.trim();
};

export const normalizeChatResponse = (
    rawText: string,
    provider: ChatResponse['provider'],
    modelId: string
): ChatResponse => {
    const parsed = parseJsonWithFallback(rawText);
    const data =
        parsed && typeof parsed === 'object'
            ? (parsed as {
                  content?: unknown;
                  citations?: unknown;
                  suggestedTitle?: unknown;
              })
            : {};
    const citations = Array.isArray(data.citations)
        ? data.citations.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        : [];
    const content = toDisplayText(data.content).trim() || rawText.trim();
    const suggestedTitle = toDisplayText(data.suggestedTitle).trim() || undefined;

    return {
        content: content || 'No response generated.',
        citations,
        suggestedTitle,
        rawText,
        provider,
        modelId,
    };
};
