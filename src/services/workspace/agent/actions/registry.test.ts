import { describe, expect, it, vi } from 'vitest';
import type { Editor } from 'tldraw';
import type {
  BoardAgentSession,
  Workspace,
  WorkspaceBoard,
  WorkspaceItem,
} from '@/types';
import { executeBoardAgentStructuredAction } from './registry';
import type { BoardAgentExecutionContext } from './types';
import { BOARD_REF_META_KEY } from '../../boardShapes';

const workspace: Workspace = {
  id: 'ws-1',
  title: 'Workspace Alpha',
  status: 'ACTIVE',
  dateOpened: '2026-04-05',
  packId: 'pack-1',
  purposeId: 'purpose-1',
};

const board: WorkspaceBoard = {
  id: 'board-1',
  workspaceId: 'ws-1',
  name: 'Primary Board',
  sortOrder: 0,
  createdAt: 1,
  updatedAt: 1,
};

const session: BoardAgentSession = {
  id: 'session-1',
  workspaceId: 'ws-1',
  boardId: 'board-1',
  title: 'Board Agent',
  status: 'RUNNING',
  request: 'Organize the board',
  requestState: 'EXECUTING_ACTIONS',
  provider: 'OPENAI',
  modelId: 'gpt-test',
  createdAt: 1,
  updatedAt: 1,
  metadata: {
    packId: 'pack-1',
    purposeId: 'purpose-1',
  },
};

const createEditor = () => {
  const shapes = new Map<string, Record<string, unknown>>();

  const editor = {
    createShape: vi.fn((shape: Record<string, unknown>) => {
      shapes.set(shape.id as string, {
        ...shape,
        x: shape.x,
        y: shape.y,
        type: shape.type,
        props: shape.props || {},
        meta: shape.meta || {},
      });
      return editor;
    }),
    setSelectedShapes: vi.fn(() => editor),
    getSelectedShapeIds: vi.fn(() => ['shape-1', 'shape-2']),
    getShape: vi.fn((id: string) => shapes.get(id)),
    getShapePageBounds: vi.fn((id: string) => {
      if (id === 'shape-1') return { x: 100, y: 100, w: 120, h: 90 };
      if (id === 'shape-2') return { x: 320, y: 200, w: 140, h: 110 };
      return undefined;
    }),
    getViewportPageBounds: vi.fn(() => ({ x: 0, y: 0, w: 1000, h: 700 })),
    zoomToBounds: vi.fn(() => editor),
    updateShapes: vi.fn(() => editor),
    alignShapes: vi.fn(() => editor),
    distributeShapes: vi.fn(() => editor),
    groupShapes: vi.fn(() => editor),
    createBindings: vi.fn(() => editor),
  } as unknown as Editor;

  shapes.set('shape-1', {
    id: 'shape-1',
    type: 'geo',
    x: 100,
    y: 100,
    meta: {
      [BOARD_REF_META_KEY]: JSON.stringify({
        workspaceId: 'ws-1',
        refKind: 'WORKSPACE_ITEM',
        refId: 'item-1',
        title: 'Seed Note',
        workspaceItemKind: 'NOTE',
      }),
    },
    props: { w: 120, h: 90 },
  });
  shapes.set('shape-2', {
    id: 'shape-2',
    type: 'geo',
    x: 320,
    y: 200,
    meta: {},
    props: { w: 140, h: 110 },
  });

  return editor;
};

const createContext = (
  overrides: Partial<BoardAgentExecutionContext> = {}
): BoardAgentExecutionContext => {
  const editor = createEditor();
  const workspaceItems: WorkspaceItem[] = [
    {
      id: 'item-1',
      workspaceId: 'ws-1',
      kind: 'NOTE',
      title: 'Seed Note',
      textContent: 'Seed note content',
      createdAt: 1,
      updatedAt: 1,
    },
  ];

  return {
    session,
    workspace,
    board,
    editor,
    themeMode: 'dark',
    artifacts: [],
    headlines: [],
    workspaceItems,
    persistBoardDocument: vi.fn(async () => undefined),
    createWorkspaceItem: vi.fn(async (item: WorkspaceItem) => {
      workspaceItems.unshift(item);
    }),
    saveArtifact: vi.fn(async (artifact) => artifact),
    appendSectionToArtifact: vi.fn(async () => undefined),
    launchInvestigation: vi.fn(async () => undefined),
    ...overrides,
  };
};

describe('executeBoardAgentStructuredAction', () => {
  it('rejects linked-card placement when the reference cannot be resolved', async () => {
    const context = createContext();
    const result = await executeBoardAgentStructuredAction({
      action: {
        type: 'PLACE_LINKED_CARD',
        input: { refKind: 'ARTIFACT', refId: 'missing-artifact' },
      },
      context,
    });

    expect(result.status).toBe('REJECTED');
    expect(result.error).toContain('not found');
  });

  it('creates and places a canonical board note', async () => {
    const context = createContext();
    const result = await executeBoardAgentStructuredAction({
      action: {
        type: 'CREATE_BOARD_NOTE',
        input: {
          title: 'Contradiction Note',
          text: 'Document the contradiction and next verification step.',
        },
      },
      context,
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.affectedCanonicalIds).toHaveLength(1);
    expect(result.affectedBoardShapeIds).toHaveLength(1);
    expect(context.createWorkspaceItem).toHaveBeenCalledTimes(1);
    expect(context.persistBoardDocument).toHaveBeenCalledTimes(1);
  });

  it('queues a follow-up review prompt for a region', async () => {
    const context = createContext();
    const result = await executeBoardAgentStructuredAction({
      action: {
        type: 'REVIEW_REGION',
        input: {
          shapeIds: ['shape-1', 'shape-2'],
          prompt: 'Review the cluster for missing evidence.',
        },
      },
      context,
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.followUp).toEqual({
      prompt: 'Review the cluster for missing evidence.',
      sourceActionType: 'REVIEW_REGION',
    });
    expect(context.editor.zoomToBounds).toHaveBeenCalledTimes(1);
  });

  it('launches a follow-up run through the provided callback', async () => {
    const context = createContext();
    const result = await executeBoardAgentStructuredAction({
      action: {
        type: 'CREATE_FOLLOW_UP_RUN',
        input: {
          topic: 'Investigate the unsupported signal cluster',
          parentArtifactId: 'rep-1',
        },
      },
      context,
    });

    expect(result.status).toBe('COMPLETED');
    expect(context.launchInvestigation).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'Investigate the unsupported signal cluster',
        launchSource: 'BOARD_AGENT_FOLLOW_UP',
        parentArtifactId: 'rep-1',
      })
    );
  });
});
