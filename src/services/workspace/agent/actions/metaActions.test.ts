import { describe, expect, it } from 'vitest';

import { executeBoardAgentMetaAction } from './metaActions';
import type { BoardAgentExecutionContext } from './types';

const context = {} as BoardAgentExecutionContext;

describe('executeBoardAgentMetaAction', () => {
  it('normalizes fallback todo text into a single pending item', async () => {
    const result = await executeBoardAgentMetaAction({
      action: {
        type: 'UPDATE_TODO',
        input: {
          text: 'Review source provenance',
        },
      },
      context,
    });

    expect(result).toMatchObject({
      status: 'COMPLETED',
      todoItems: [
        {
          id: 'todo-0',
          text: 'Review source provenance',
          status: 'PENDING',
        },
      ],
    });
  });
});
