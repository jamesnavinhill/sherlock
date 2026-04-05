import { describe, expect, it, vi } from 'vitest';
import {
  createBoardAgentStreamAccumulator,
  normalizeBoardAgentResponse,
} from './boardAgent';

describe('boardAgent shared helpers', () => {
  it('normalizes tagged board-agent responses with structured actions', () => {
    const response = normalizeBoardAgentResponse(
      '<message>Organized the visible records into a cluster.</message><action>{"type":"PLACE_LINKED_CARD","input":{"refId":"rep-1"},"rationale":"Ground the cluster around the primary artifact."}</action><title>Cluster pass</title>',
      'OPENAI',
      'gpt-test'
    );

    expect(response.message).toContain('Organized the visible records');
    expect(response.actions).toEqual([
      {
        type: 'PLACE_LINKED_CARD',
        input: { refId: 'rep-1' },
        rationale: 'Ground the cluster around the primary artifact.',
      },
    ]);
    expect(response.suggestedTitle).toBe('Cluster pass');
  });

  it('emits message and action events while tagged output streams in', () => {
    const onEvent = vi.fn();
    const accumulator = createBoardAgentStreamAccumulator('OPENAI', 'gpt-test', { onEvent });

    accumulator.start();
    accumulator.push('<message>Hello');
    accumulator.push(' world</message><action>{"type":"MESSAGE","input":{"text":"hi"}}</action>');
    const response = accumulator.complete();

    expect(response.message).toBe('Hello world');
    expect(response.actions).toEqual([{ type: 'MESSAGE', input: { text: 'hi' } }]);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MESSAGE_DELTA',
      })
    );
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ACTION',
        action: expect.objectContaining({ type: 'MESSAGE' }),
      })
    );
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'COMPLETE',
        response: expect.objectContaining({
          message: 'Hello world',
        }),
      })
    );
  });
});
