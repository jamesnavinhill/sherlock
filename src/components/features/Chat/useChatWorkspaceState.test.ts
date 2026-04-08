import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Artifact, ChatMessage, ChatSession, Headline, Workspace, WorkspaceItem } from '@/types';
import { useChatWorkspaceState } from './useChatWorkspaceState';

const workspaces: Workspace[] = [
  {
    id: 'ws-1',
    title: 'Atlas Workspace',
    status: 'ACTIVE',
    dateOpened: '2026-04-08',
  },
  {
    id: 'ws-2',
    title: 'Other Workspace',
    status: 'ACTIVE',
    dateOpened: '2026-04-08',
  },
];

const chatSessions: ChatSession[] = [
  {
    id: 'session-1',
    workspaceId: 'ws-1',
    title: 'Atlas chat',
    status: 'ACTIVE',
    createdAt: 1,
    updatedAt: 3,
  },
  {
    id: 'session-2',
    workspaceId: 'ws-2',
    title: 'Other chat',
    status: 'ACTIVE',
    createdAt: 1,
    updatedAt: 2,
  },
];

const artifacts: Artifact[] = [
  {
    id: 'artifact-1',
    workspaceId: 'ws-1',
    topic: 'Atlas Report',
    summary: 'Atlas summary',
    dateStr: '2026-04-08',
    agendas: [],
    entities: [{ name: 'Atlas', type: 'ORGANIZATION' }],
    leads: [],
    sources: [],
    rawText: 'Atlas details',
  },
  {
    id: 'artifact-2',
    workspaceId: 'ws-2',
    topic: 'Other Report',
    summary: 'Other summary',
    dateStr: '2026-04-08',
    agendas: [],
    entities: [],
    leads: [],
    sources: [],
    rawText: 'Other details',
  },
];

const headlines: Headline[] = [
  {
    id: 'headline-1',
    workspaceId: 'ws-1',
    content: 'Atlas signal',
    source: 'Wire',
    timestamp: '2026-04-08T10:00:00.000Z',
    type: 'NEWS',
    status: 'PENDING',
    threatLevel: 'INFO',
  },
  {
    id: 'headline-2',
    workspaceId: 'ws-2',
    content: 'Other signal',
    source: 'Wire',
    timestamp: '2026-04-08T11:00:00.000Z',
    type: 'NEWS',
    status: 'PENDING',
    threatLevel: 'INFO',
  },
];

const workspaceItems: WorkspaceItem[] = [
  {
    id: 'item-1',
    workspaceId: 'ws-1',
    title: 'Atlas Notes',
    kind: 'FILE',
    textContent: 'Atlas notes',
    createdAt: 1,
    updatedAt: 1,
  },
];

const chatMessagesBySessionId: Record<string, ChatMessage[]> = {
  'session-1': [
    {
      id: 'message-1',
      sessionId: 'session-1',
      role: 'assistant',
      content: 'Atlas response',
      status: 'COMPLETED',
      createdAt: 1,
      updatedAt: 1,
    },
  ],
};

describe('useChatWorkspaceState', () => {
  it('filters workspace-specific session and context state from the active workspace', () => {
    const { result } = renderHook(() =>
      useChatWorkspaceState({
        activeChatSessionId: 'session-1',
        activeWorkspaceId: 'ws-1',
        artifacts,
        artifactCardState: {
          expanded: { 'artifact-1': true },
          workspaceId: 'ws-1',
        },
        chatActionsBySessionId: {},
        chatMessagesBySessionId,
        chatSessions,
        headlines,
        themeMode: 'dark',
        workspaceItems,
        workspaces,
      })
    );

    expect(result.current.activeWorkspace?.id).toBe('ws-1');
    expect(result.current.workspaceSessions.map((session) => session.id)).toEqual(['session-1']);
    expect(result.current.workspaceReports.map((artifact) => artifact.id)).toEqual(['artifact-1']);
    expect(result.current.workspaceSignals.map((headline) => headline.id)).toEqual(['headline-1']);
    expect(result.current.messages.map((message) => message.id)).toEqual(['message-1']);
    expect(result.current.latestAssistantMessage?.id).toBe('message-1');
    expect(result.current.expandedArtifactIds).toEqual({ 'artifact-1': true });
    expect(result.current.mentionCandidates.map((candidate) => candidate.refId)).toEqual(
      expect.arrayContaining(['artifact-1', 'headline-1', 'item-1'])
    );
    expect(result.current.messageBodyClassName).toContain('prose-invert');
  });
});
