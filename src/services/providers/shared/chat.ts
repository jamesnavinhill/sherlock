import type { ChatRequest, ChatResponse } from '../types';
import { parseJsonWithFallback, toDisplayText } from './jsonParsing';

const formatConversation = (messages: ChatRequest['messages']): string =>
    messages
        .map((message) => `${message.role.toUpperCase()}:\n${message.content.trim()}`)
        .join('\n\n');

export const buildWorkspaceChatPrompt = (request: ChatRequest): string => {
    return buildWorkspaceChatPromptWithFormat(request, 'json');
};

const buildWorkspaceContextBlock = (request: ChatRequest): string => {
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
`.trim();
};

export const buildWorkspaceChatSystemPrompt = (request: ChatRequest): string => {
    return `
You are Sherlock's workspace chat assistant.

Stay grounded in the current workspace. Prefer the provided workspace materials over general knowledge.
If the answer is not supported by the workspace context, say so clearly and note what is missing.
Keep the answer concise, practical, and easy to scan.

${buildWorkspaceContextBlock(request)}
`.trim();
};

export const buildWorkspaceChatPromptWithFormat = (
    request: ChatRequest,
    format: 'json' | 'tagged'
): string => {

    const responseInstruction =
        format === 'tagged'
            ? `
Return plain text using this exact structure and no markdown fences:
<answer>
markdown answer
</answer>
<citations>CTX-REPORT-abc,CTX-HEADLINE-def</citations>
<title>optional concise session title</title>

Rules:
- Put the full user-facing answer inside <answer>.
- Only cite ids that appear in Retrieved Workspace Context.
- If you do not use any retrieved context, leave <citations></citations> empty.
- Keep <title> empty if no better session title is obvious.
`.trim()
            : `
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

    return `
${buildWorkspaceChatSystemPrompt(request)}

Conversation
${formatConversation(request.messages)}

${responseInstruction}
`.trim();
};

const extractTag = (rawText: string, tag: 'answer' | 'citations' | 'title'): string => {
    const match = rawText.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return match?.[1]?.trim() || '';
};

export const extractStreamingAnswerText = (rawText: string): string => {
    const startMatch = rawText.match(/<answer>/i);
    if (!startMatch || startMatch.index === undefined) {
        return '';
    }

    const afterStart = rawText.slice(startMatch.index + startMatch[0].length);
    const endIndex = afterStart.search(/<\/answer>/i);
    const answer = endIndex >= 0 ? afterStart.slice(0, endIndex) : afterStart;
    return answer.replace(/<citations>[\s\S]*$/i, '').replace(/<title>[\s\S]*$/i, '').trimStart();
};

const normalizeTaggedChatResponse = (
    rawText: string,
    provider: ChatResponse['provider'],
    modelId: string
): ChatResponse | null => {
    const content = extractTag(rawText, 'answer');
    const citationsText = extractTag(rawText, 'citations');
    const suggestedTitle = extractTag(rawText, 'title') || undefined;

    if (!content && !citationsText && !suggestedTitle) {
        return null;
    }

    const citations = citationsText
        .split(/[,\n]/)
        .map((value) => value.trim())
        .filter(Boolean);

    return {
        content: content || 'No response generated.',
        citations,
        suggestedTitle,
        rawText,
        provider,
        modelId,
    };
};

export const normalizeChatResponse = (
    rawText: string,
    provider: ChatResponse['provider'],
    modelId: string
): ChatResponse => {
    const tagged = normalizeTaggedChatResponse(rawText, provider, modelId);
    if (tagged) return tagged;

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
