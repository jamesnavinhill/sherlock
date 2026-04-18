import { normalizeBoardAgentTodoItems } from './todos';
import type { BoardAgentActionExecutionResult } from './types';
import type { BoardAgentActionExecutorInput } from './shared';
import {
  complete,
  getStructuredActionInput,
  normalizeText,
  reject,
} from './shared';

export const executeBoardAgentMetaAction = async ({
  action,
}: BoardAgentActionExecutorInput): Promise<BoardAgentActionExecutionResult | null> => {
  const input = getStructuredActionInput(action);

  switch (action.type) {
    case 'MESSAGE': {
      const text = normalizeText(input.text ?? input.message) || action.rationale || '';
      return complete(action.type, {
        normalizedInput: text ? { text } : {},
        result: text ? { text } : undefined,
      });
    }

    case 'THINK': {
      const text = normalizeText(input.text ?? input.thought) || action.rationale || '';
      return complete(action.type, {
        normalizedInput: text ? { text } : {},
        result: text ? { text } : undefined,
      });
    }

    case 'UPDATE_TODO': {
      const items = normalizeBoardAgentTodoItems(input.items ?? input.todo ?? input.todos);
      const fallbackText = normalizeText(input.text);
      const normalizedItems =
        items.length > 0
          ? items
          : fallbackText
            ? [{ id: 'todo-0', text: fallbackText, status: 'PENDING' as const }]
            : [];
      if (normalizedItems.length === 0) {
        return reject(action.type, 'Todo update did not include any valid items.');
      }
      return complete(action.type, {
        normalizedInput: {
          items: normalizedItems,
        },
        result: {
          count: normalizedItems.length,
        },
        todoItems: normalizedItems,
      });
    }

    default:
      return null;
  }
};
