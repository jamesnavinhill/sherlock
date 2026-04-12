import { describe, expect, it } from 'vitest';

import type {
  Artifact,
  Workspace,
  WorkspaceBoard,
  WorkspaceBoardDocument,
  WorkspaceItem,
} from '@/types';

import type { WorkspaceLibraryEntry } from '@/services/workspace/library';

import { buildWorkspaceBoardViewModel } from './workspaceBoardViewModel';

describe('buildWorkspaceBoardViewModel', () => {
  it('derives active board, library groupings, and selection state from workspace data', () => {
    const workspace: Workspace = {
      id: 'ws-1',
      title: 'Alpha Workspace',
      status: 'ACTIVE',
      dateOpened: '2026-04-05',
    };
    const board: WorkspaceBoard = {
      id: 'board-1',
      workspaceId: 'ws-1',
      name: 'Primary Board',
      sortOrder: 0,
      createdAt: 1,
      updatedAt: 2,
    };
    const document: WorkspaceBoardDocument = {
      boardId: 'board-1',
      snapshot: { schema: {}, store: {} },
      updatedAt: 2,
    };
    const noteItem: WorkspaceItem = {
      id: 'item-1',
      workspaceId: 'ws-1',
      kind: 'NOTE',
      title: 'Board Note',
      description: 'Manual note',
      createdAt: 1,
      updatedAt: 1,
    };
    const artifact: Artifact = {
      id: 'artifact-1',
      workspaceId: 'ws-1',
      topic: 'Atlas Brief',
      summary: 'Summary',
      agendas: [],
      leads: [],
      keyFindings: [
        {
          id: 'finding-1',
          workspaceId: 'ws-1',
          originArtifactId: 'artifact-1',
          title: 'One core finding',
          summary: 'A board-worthy finding.',
        },
      ],
      entities: [],
      sources: [],
      rawText: 'Summary',
    };
    const selectedEntry = {
      kind: 'NOTE',
      title: 'Board Note',
      searchText: 'board note',
      refId: 'item-1',
      refKind: 'WORKSPACE_ITEM',
    } as WorkspaceLibraryEntry;

    const viewModel = buildWorkspaceBoardViewModel({
      activeWorkspaceBoardId: 'board-1',
      activeWorkspaceId: 'ws-1',
      artifacts: [artifact],
      boardAgentActionsBySessionId: {},
      boardAgentActiveSessionId: null,
      boardAgentSessions: [],
      headlines: [],
      search: '',
      selectedEntries: [selectedEntry],
      workspaceBoardDocuments: { 'board-1': document },
      workspaceBoards: [board],
      workspaceItems: [noteItem],
      workspaces: [workspace],
    });

    expect(viewModel.activeBoard?.id).toBe('board-1');
    expect(viewModel.activeBoardDocument?.boardId).toBe('board-1');
    expect(viewModel.groupedEntries.created).toHaveLength(1);
    expect(viewModel.groupedEntries.findings).toHaveLength(1);
    expect(viewModel.selectedWorkspaceItem?.id).toBe('item-1');
    expect(viewModel.workspaceTitle).toBe('Alpha Workspace');
  });
});
