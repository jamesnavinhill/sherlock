import { describe, expect, it, vi } from 'vitest';

import type { Artifact, WorkspaceItem } from '@/types';

import { buildBoardInspectorActions } from './boardInspectorActions';

describe('buildBoardInspectorActions', () => {
  it('keeps concise short labels for board inspector actions', () => {
    const artifact: Artifact = {
      id: 'artifact-1',
      workspaceId: 'ws-1',
      topic: 'Atlas Brief',
      summary: 'Summary',
      agendas: [],
      leads: [],
      entities: [],
      sources: [],
      rawText: '{}',
    };

    const workspaceItem: WorkspaceItem = {
      id: 'item-1',
      workspaceId: 'ws-1',
      kind: 'NOTE',
      title: 'Atlas note',
      createdAt: 1,
      updatedAt: 1,
      provenance: {
        source: 'CHAT',
        sourceSessionId: 'chat-1',
        sourceArtifactId: 'artifact-1',
      },
    };

    const actions = buildBoardInspectorActions({
      onOpenChat: vi.fn(),
      onOpenArtifact: vi.fn(),
      onOpenSelectedChat: vi.fn(),
      selectedArtifact: artifact,
      selectedEntries: [
        {
          refKind: 'WORKSPACE_ITEM',
          refId: 'item-1',
          title: 'Atlas note',
        },
      ],
      selectedPrimaryEntry: {
        refKind: 'WORKSPACE_ITEM',
        refId: 'item-1',
        title: 'Atlas note',
        metadata: {
          url: 'https://example.com/source',
        },
      },
      selectedWorkspaceItem: workspaceItem,
      workspaceArtifacts: [artifact],
    });

    expect(actions.map((action) => action.shortLabel ?? action.label)).toEqual([
      'Open',
      'Chat',
      'Source',
      'Source',
      'Link',
    ]);
  });
});
