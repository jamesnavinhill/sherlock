import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BoardCanvasPane } from './BoardCanvasPane';

vi.mock('tldraw', () => ({
  Tldraw: ({ snapshot }: { snapshot?: unknown }) => (
    <div data-testid="tldraw">{JSON.stringify(snapshot ?? null)}</div>
  ),
}));

describe('BoardCanvasPane', () => {
  it('keeps the initial snapshot stable while the same board stays mounted', () => {
    const onCanvasDrop = vi.fn();
    const onEditorMount = vi.fn();
    const activeBoard = {
      id: 'board-1',
      workspaceId: 'ws-1',
      name: 'Board 1',
      sortOrder: 0,
      presentationMode: false,
      createdAt: 1,
      updatedAt: 1,
    };
    const { rerender } = render(
      <BoardCanvasPane
        activeBoard={activeBoard}
        hydratedSnapshot={{ document: 'first' } as never}
        onCanvasDrop={onCanvasDrop}
        onEditorMount={onEditorMount}
      />
    );

    expect(screen.getByTestId('tldraw')).toHaveTextContent('{"document":"first"}');

    rerender(
      <BoardCanvasPane
        activeBoard={activeBoard}
        hydratedSnapshot={{ document: 'second' } as never}
        onCanvasDrop={onCanvasDrop}
        onEditorMount={onEditorMount}
      />
    );

    expect(screen.getByTestId('tldraw')).toHaveTextContent('{"document":"first"}');
  });

  it('rehydrates when the active board changes', () => {
    const onCanvasDrop = vi.fn();
    const onEditorMount = vi.fn();
    const { rerender } = render(
      <BoardCanvasPane
        activeBoard={{
          id: 'board-1',
          workspaceId: 'ws-1',
          name: 'Board 1',
          sortOrder: 0,
          presentationMode: false,
          createdAt: 1,
          updatedAt: 1,
        }}
        hydratedSnapshot={{ document: 'first' } as never}
        onCanvasDrop={onCanvasDrop}
        onEditorMount={onEditorMount}
      />
    );

    rerender(
      <BoardCanvasPane
        activeBoard={{
          id: 'board-2',
          workspaceId: 'ws-1',
          name: 'Board 2',
          sortOrder: 1,
          presentationMode: false,
          createdAt: 1,
          updatedAt: 1,
        }}
        hydratedSnapshot={{ document: 'second' } as never}
        onCanvasDrop={onCanvasDrop}
        onEditorMount={onEditorMount}
      />
    );

    expect(screen.getByTestId('tldraw')).toHaveTextContent('{"document":"second"}');
  });
});
