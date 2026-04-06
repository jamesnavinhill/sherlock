import type { MutableRefObject } from 'react';

import type { AgentAction, ChatMessage, ChatSession } from '@/types';
import { streamWorkspaceChatTurn } from '@/services/chat/runtime';
import { extractStreamingAnswerText } from '@/services/providers/shared/chat';
import { createLocalId } from '@/utils/id';

interface SendChatTurnInput {
  draft: string;
  messages: ChatMessage[];
  session: ChatSession;
  abortControllerRef: MutableRefObject<AbortController | null>;
  streamedAnswerRef: MutableRefObject<string>;
  addChatAction: (action: AgentAction) => Promise<unknown>;
  addChatMessage: (message: ChatMessage) => Promise<unknown>;
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  onDraftSubmitted: () => void;
  renameChatSession: (sessionId: string, title: string) => Promise<unknown>;
  setChatGenerationStatus: (
    status: 'IDLE' | 'GENERATING' | 'FAILED' | 'CANCELLING'
  ) => void;
  setPartialAssistantOutput: (value: string) => void;
  setWorkingAssistantMessageId: (value: string | null) => void;
  setWorkingSessionId: (value: string | null) => void;
  updateChatMessage: (
    messageId: string,
    sessionId: string,
    patch: Partial<ChatMessage>
  ) => Promise<unknown>;
}

export const stopChatGeneration = ({
  abortControllerRef,
  setChatGenerationStatus,
}: Pick<SendChatTurnInput, 'abortControllerRef' | 'setChatGenerationStatus'>) => {
  if (!abortControllerRef.current) return;
  setChatGenerationStatus('CANCELLING');
  abortControllerRef.current.abort();
};

export const sendChatTurn = async ({
  draft,
  messages,
  session,
  abortControllerRef,
  streamedAnswerRef,
  addChatAction,
  addChatMessage,
  addToast,
  onDraftSubmitted,
  renameChatSession,
  setChatGenerationStatus,
  setPartialAssistantOutput,
  setWorkingAssistantMessageId,
  setWorkingSessionId,
  updateChatMessage,
}: SendChatTurnInput) => {
  const query = draft.trim();
  if (!query) return;

  const now = Date.now();
  const userMessage: ChatMessage = {
    id: createLocalId('chat-message'),
    sessionId: session.id,
    role: 'user',
    content: query,
    status: 'COMPLETED',
    createdAt: now,
    updatedAt: now,
  };
  const assistantMessageId = createLocalId('chat-message');
  const pendingAssistant: ChatMessage = {
    id: assistantMessageId,
    sessionId: session.id,
    role: 'assistant',
    content: '',
    status: 'PENDING',
    createdAt: now + 1,
    updatedAt: now + 1,
    metadata: {
      provider: session.provider,
      modelId: session.modelId,
    },
  };

  const controller = new AbortController();
  abortControllerRef.current = controller;
  streamedAnswerRef.current = '';
  onDraftSubmitted();
  setWorkingSessionId(session.id);
  setWorkingAssistantMessageId(assistantMessageId);
  setChatGenerationStatus('GENERATING');
  setPartialAssistantOutput('');

  await addChatMessage(userMessage);
  await addChatMessage(pendingAssistant);

  try {
    const result = await streamWorkspaceChatTurn({
      session,
      messages: [...messages, userMessage],
      query,
      assistantMessageId,
      signal: controller.signal,
      onStreamEvent: (streamEvent) => {
        if (streamEvent.type !== 'DELTA') return;
        const answerText = extractStreamingAnswerText(streamEvent.snapshot);
        streamedAnswerRef.current = answerText;
        setPartialAssistantOutput(answerText);
      },
    });

    await updateChatMessage(assistantMessageId, session.id, {
      content: result.assistantMessage.content,
      citations: result.assistantMessage.citations,
      attachments: result.attachments,
      metadata: result.assistantMessage.metadata,
      status: 'COMPLETED',
      updatedAt: Date.now(),
    });
    await addChatAction({ ...result.action, messageId: assistantMessageId });

    if (session.title === 'Untitled Chat' && result.suggestedTitle) {
      await renameChatSession(session.id, result.suggestedTitle);
    }

    setChatGenerationStatus('IDLE');
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      await updateChatMessage(assistantMessageId, session.id, {
        content: streamedAnswerRef.current || 'Generation stopped before a full answer was produced.',
        status: 'CANCELLED',
        updatedAt: Date.now(),
      });
      addToast('Generation stopped.', 'INFO');
      setChatGenerationStatus('IDLE');
    } else {
      const message = error instanceof Error ? error.message : 'Chat failed.';
      await updateChatMessage(assistantMessageId, session.id, {
        content: 'Unable to generate a response for this workspace query.',
        error: message,
        status: 'FAILED',
        updatedAt: Date.now(),
      });
      setChatGenerationStatus('FAILED');
      addToast(message, 'ERROR');
    }
  } finally {
    abortControllerRef.current = null;
    streamedAnswerRef.current = '';
    setWorkingSessionId(null);
    setWorkingAssistantMessageId(null);
    setPartialAssistantOutput('');
  }
};
