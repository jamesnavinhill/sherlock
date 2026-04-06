import { describe, expect, it, vi } from 'vitest';

const { hasLaunchContextPrimer } = vi.hoisted(() => ({
  hasLaunchContextPrimer: vi.fn(),
}));

vi.mock('@/services/chat/launchContext', () => ({
  hasLaunchContextPrimer,
}));

import {
  resolveLaunchContextSessionTitle,
  shouldAppendLaunchPrimer,
} from './appShellOpenChatHelpers';

describe('appShellOpenChatHelpers', () => {
  it('resolves session titles from launch context report or entity details', () => {
    expect(
      resolveLaunchContextSessionTitle(
        [
          {
            id: 'artifact-1',
            topic: 'Atlas Report',
            summary: 'Summary',
            agendas: [],
            leads: [],
            entities: [],
            sources: [],
            rawText: 'raw',
          },
        ],
        { sourceReportId: 'artifact-1' }
      )
    ).toBe('Atlas Report');

    expect(resolveLaunchContextSessionTitle([], { entityName: 'Atlas Holdings' })).toBe(
      'Atlas Holdings'
    );
    expect(resolveLaunchContextSessionTitle([], undefined)).toBeUndefined();
  });

  it('only appends launch primers when context exists and no primer has been added yet', () => {
    hasLaunchContextPrimer.mockReturnValue(false);
    expect(
      shouldAppendLaunchPrimer(
        [
          {
            id: 'msg-1',
            sessionId: 'session-1',
            role: 'user',
            content: 'hello',
            status: 'COMPLETED',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
        { entityName: 'Atlas Holdings' }
      )
    ).toBe(true);

    hasLaunchContextPrimer.mockReturnValue(true);
    expect(shouldAppendLaunchPrimer([], { entityName: 'Atlas Holdings' })).toBe(false);
    expect(shouldAppendLaunchPrimer([], undefined)).toBe(false);
  });
});
