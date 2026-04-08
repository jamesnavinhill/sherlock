import { describe, expect, it, vi } from 'vitest';
import type * as LaunchContextModule from '@/services/chat/launchContext';

const { hasLaunchContextPrimer } = vi.hoisted(() => ({
  hasLaunchContextPrimer: vi.fn(),
}));

vi.mock('@/services/chat/launchContext', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof LaunchContextModule;
  return {
    ...actual,
    hasLaunchContextPrimer,
  };
});

import {
  buildRequestedChatSessionInput,
  buildRequestedLaunchPrimerInput,
  resolveRequestedChatWorkspace,
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
        { sourceArtifactId: 'artifact-1' }
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

  it('derives workspace-scoped chat session and primer inputs for route-open requests', () => {
    const workspace = resolveRequestedChatWorkspace(
      [
        {
          id: 'ws-1',
          title: 'Atlas Workspace',
          displayTitle: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-08',
          packId: 'pack-1',
          purposeId: 'purpose-1',
        },
      ],
      {
        workspaceId: 'ws-1',
        launchContext: {
          sourceArtifactId: 'artifact-1',
        },
      }
    );

    expect(workspace?.id).toBe('ws-1');
    if (!workspace) {
      throw new Error('expected workspace');
    }

    expect(
      buildRequestedChatSessionInput({
        artifacts: [
          {
            id: 'artifact-1',
            workspaceId: 'ws-1',
            topic: 'Atlas Brief',
            summary: 'Summary',
            agendas: [],
            leads: [],
            entities: [],
            sources: [],
            rawText: 'raw',
          },
        ],
        request: {
          workspaceId: 'ws-1',
          launchContext: {
            sourceArtifactId: 'artifact-1',
          },
        },
        workspace,
      })
    ).toEqual(
      expect.objectContaining({
        workspaceId: 'ws-1',
        title: 'Atlas Brief',
        sourceArtifactId: 'artifact-1',
        packId: 'pack-1',
        purposeId: 'purpose-1',
        metadata: {
          launchContext: {
            sourceArtifactId: 'artifact-1',
          },
        },
      })
    );

    expect(
      buildRequestedLaunchPrimerInput({
        artifacts: [
          {
            id: 'artifact-1',
            workspaceId: 'ws-1',
            topic: 'Atlas Brief',
            summary: 'Summary',
            agendas: [],
            leads: [],
            entities: [],
            sources: [],
            rawText: 'raw',
          },
          {
            id: 'artifact-2',
            workspaceId: 'ws-2',
            topic: 'Other Brief',
            summary: 'Other',
            agendas: [],
            leads: [],
            entities: [],
            sources: [],
            rawText: 'raw',
          },
        ],
        headlines: [
          {
            id: 'signal-1',
            workspaceId: 'ws-1',
            content: 'Signal',
            source: 'Desk',
            timestamp: '2026-04-08T00:00:00.000Z',
            type: 'NEWS',
            status: 'PENDING',
            threatLevel: 'INFO',
          },
          {
            id: 'signal-2',
            workspaceId: 'ws-2',
            content: 'Other signal',
            source: 'Desk',
            timestamp: '2026-04-08T00:00:00.000Z',
            type: 'NEWS',
            status: 'PENDING',
            threatLevel: 'INFO',
          },
        ],
        session: {
          id: 'chat-1',
          workspaceId: 'ws-1',
          title: 'Atlas',
          status: 'ACTIVE',
          metadata: {
            launchContext: {
              sourceArtifactId: 'artifact-1',
            },
          },
          createdAt: 1,
          updatedAt: 1,
        },
        workspaceId: 'ws-1',
      })
    ).toEqual(
      expect.objectContaining({
        launchContext: {
          sourceArtifactId: 'artifact-1',
        },
        reports: [expect.objectContaining({ id: 'artifact-1' })],
        headlines: [expect.objectContaining({ id: 'signal-1' })],
      })
    );
  });
});
