import type { BoardAgentAction } from '@/types';
import type { BoardAgentTodoItem, BoardAgentTodoStatus } from './types';

const normalizeTodoStatus = (value: unknown): BoardAgentTodoStatus => {
  if (typeof value !== 'string') return 'PENDING';

  switch (value.toUpperCase()) {
    case 'DONE':
    case 'COMPLETE':
    case 'COMPLETED':
      return 'COMPLETED';
    case 'IN_PROGRESS':
    case 'ACTIVE':
      return 'IN_PROGRESS';
    case 'BLOCKED':
      return 'BLOCKED';
    default:
      return 'PENDING';
  }
};

const normalizeTodoText = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
};

const normalizeTodoItem = (value: unknown, index: number): BoardAgentTodoItem | null => {
  if (typeof value === 'string') {
    const text = normalizeTodoText(value);
    return text ? { id: `todo-${index}`, text, status: 'PENDING' } : null;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const text = normalizeTodoText(record.text ?? record.title ?? record.item);
  if (!text) return null;

  return {
    id:
      typeof record.id === 'string' && record.id.trim().length > 0
        ? record.id.trim()
        : `todo-${index}`,
    text,
    status: normalizeTodoStatus(record.status),
  };
};

export const normalizeBoardAgentTodoItems = (value: unknown): BoardAgentTodoItem[] => {
  const items = Array.isArray(value) ? value : value ? [value] : [];

  return items
    .map((item, index) => normalizeTodoItem(item, index))
    .filter((item): item is BoardAgentTodoItem => !!item);
};

export const deriveBoardAgentTodoItems = (actions: BoardAgentAction[]): BoardAgentTodoItem[] => {
  const latestTodoAction = [...actions]
    .sort((left, right) => left.createdAt - right.createdAt)
    .filter((action) => action.type === 'UPDATE_TODO' && action.status === 'COMPLETED')
    .at(-1);

  if (!latestTodoAction) return [];

  const payload = latestTodoAction.normalizedInput ?? latestTodoAction.input;
  const items =
    normalizeBoardAgentTodoItems((payload as Record<string, unknown> | undefined)?.items) ||
    [];

  if (items.length > 0) return items;

  const text = normalizeTodoText((payload as Record<string, unknown> | undefined)?.text);
  return text ? [{ id: 'todo-0', text, status: 'PENDING' }] : [];
};
