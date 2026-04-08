import { describe, expect, it } from 'vitest';
import type { ChatOpenRequest, ChatSession } from '@/types';
import {
  areChatLaunchContextsEqual,
  buildLaunchContextPrimer,
  findReusableChatSession,
  getChatLaunchContextFromSession,
} from './launchContext';

const buildSession = (overrides: Partial<ChatSession>): ChatSession => ({
  id: overrides.id || 'chat-session-1',
  workspaceId: overrides.workspaceId || 'case-1',
  title: overrides.title || 'Untitled Chat',
  status: overrides.status || 'ACTIVE',
  sourceArtifactId: overrides.sourceArtifactId,
  packId: overrides.packId,
  purposeId: overrides.purposeId,
  provider: overrides.provider,
  modelId: overrides.modelId,
  metadata: overrides.metadata,
  createdAt: overrides.createdAt || 1,
  updatedAt: overrides.updatedAt || 1,
});

describe('chat launch context helpers', () => {
  it('compares launch contexts by report, entity, and headline identity', () => {
    expect(
      areChatLaunchContextsEqual(
        {
          workspaceItemId: 'item-1',
          sourceArtifactId: 'report-1',
          entityName: 'Atlas',
          headlineId: 'headline-1',
        },
        {
          workspaceItemId: 'item-1',
          sourceArtifactId: 'report-1',
          entityName: 'Atlas',
          headlineId: 'headline-1',
        }
      )
    ).toBe(true);

    expect(
      areChatLaunchContextsEqual(
        { workspaceItemId: 'item-1', sourceArtifactId: 'report-1' },
        { workspaceItemId: 'item-2', sourceArtifactId: 'report-1' }
      )
    ).toBe(false);
  });

  it('reuses exact launch-context sessions before generic workspace sessions', () => {
    const request: ChatOpenRequest = {
      workspaceId: 'case-1',
      launchContext: {
        sourceArtifactId: 'report-1',
      },
    };

    const genericSession = buildSession({
      id: 'generic-session',
      updatedAt: 30,
    });
    const matchingSession = buildSession({
      id: 'matching-session',
      updatedAt: 10,
      sourceArtifactId: 'report-1',
      metadata: {
        launchContext: {
          sourceArtifactId: 'report-1',
        },
      },
    });

    expect(findReusableChatSession([genericSession, matchingSession], request)?.id).toBe(
      'matching-session'
    );
    expect(getChatLaunchContextFromSession(matchingSession)).toEqual({
      sourceArtifactId: 'report-1',
    });
  });

  it('reuses an exact requested session before other workspace sessions', () => {
    const request: ChatOpenRequest = {
      workspaceId: 'case-1',
      sessionId: 'chat-session-2',
    };

    const olderSession = buildSession({
      id: 'chat-session-1',
      updatedAt: 10,
    });
    const exactSession = buildSession({
      id: 'chat-session-2',
      updatedAt: 1,
    });

    expect(findReusableChatSession([olderSession, exactSession], request)?.id).toBe(
      'chat-session-2'
    );
  });

  it('skips guided sessions when opening a generic workspace chat', () => {
    const request: ChatOpenRequest = {
      workspaceId: 'case-1',
    };

    const guidedSession = buildSession({
      id: 'guided-session',
      updatedAt: 50,
      metadata: {
        sessionMode: 'GUIDED',
      },
    });
    const standardSession = buildSession({
      id: 'standard-session',
      updatedAt: 25,
    });

    expect(findReusableChatSession([guidedSession, standardSession], request)?.id).toBe(
      'standard-session'
    );
  });

  it('builds a primer for entity launches with related artifact attachments', () => {
    const primer = buildLaunchContextPrimer({
      session: buildSession({ id: 'chat-entity' }),
      launchContext: {
        entityName: 'Atlas Holdings',
      },
      reports: [
        {
          id: 'report-1',
          workspaceId: 'case-1',
          topic: 'Atlas baseline',
          summary: 'Atlas Holdings appears in the procurement flow.',
          agendas: [],
          leads: [],
          entities: [{ name: 'Atlas Holdings', type: 'ORGANIZATION' }],
          sources: [],
          rawText: 'Atlas Holdings owns the bidding shell.',
        },
      ],
      headlines: [],
      workspaceItems: [],
    });

    expect(primer?.content).toContain('Pinned entity context');
    expect(primer?.attachments).toHaveLength(1);
    expect(primer?.attachments?.[0].refId).toBe('report-1');
  });

  it('builds a primer for workspace-item launches with a workspace-item attachment', () => {
    const primer = buildLaunchContextPrimer({
      session: buildSession({ id: 'chat-item' }),
      launchContext: {
        workspaceItemId: 'item-1',
      },
      reports: [],
      headlines: [],
      workspaceItems: [
        {
          id: 'item-1',
          workspaceId: 'case-1',
          kind: 'NOTE',
          title: 'Atlas Note',
          textContent: 'Atlas shell timeline notes.',
          createdAt: 1,
          updatedAt: 2,
        },
      ],
    });

    expect(primer?.content).toContain('Pinned workspace note context');
    expect(primer?.attachments).toEqual([
      expect.objectContaining({
        kind: 'NOTE',
        refId: 'item-1',
        refKind: 'WORKSPACE_ITEM',
        title: 'Atlas Note',
      }),
    ]);
  });
});
