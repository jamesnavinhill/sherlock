import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('tldraw', async () => {
  const actual = await vi.importActual('tldraw');
  return {
    ...actual,
    getSnapshot: vi.fn(() => ({ document: {} })),
  };
});

import { useBoardCanvasPersistence } from './useBoardCanvasPersistence';

const buildEditor = () => {
  const removeListener = vi.fn();
  return {
    getCamera: vi.fn(() => ({ x: 12, y: 24, z: 1 })),
    getSelectedShapes: vi.fn(() => []),
    setCamera: vi.fn(),
    updateInstanceState: vi.fn(),
    user: {
      updateUserPreferences: vi.fn(),
    },
    store: {
      listen: vi.fn(() => removeListener),
    },
  };
};

describe('useBoardCanvasPersistence', () => {
  it('starts fresh boards at 50% zoom when there is no hydrated snapshot', () => {
    const { result } = renderHook(() =>
      useBoardCanvasPersistence({
        activeBoard: {
          id: 'board-1',
          workspaceId: 'ws-1',
          name: 'Primary Board',
          sortOrder: 0,
          presentationMode: false,
          createdAt: 1,
          updatedAt: 1,
        },
        activeBoardDocument: null,
        addToast: vi.fn(),
        libraryMap: new Map(),
        saveWorkspaceBoardDocument: vi.fn(async () => undefined),
        setAiSummary: vi.fn(),
        setSelectedEntries: vi.fn(),
        themeMode: 'dark',
      })
    );

    const editor = buildEditor();
    result.current.handleEditorMount(editor as never);

    expect(editor.setCamera).toHaveBeenCalledWith({ x: 12, y: 24, z: 0.5 }, { immediate: true });
  });

  it('preserves hydrated board camera state when a snapshot already exists', () => {
    const { result } = renderHook(() =>
      useBoardCanvasPersistence({
        activeBoard: {
          id: 'board-1',
          workspaceId: 'ws-1',
          name: 'Primary Board',
          sortOrder: 0,
          presentationMode: false,
          createdAt: 1,
          updatedAt: 1,
        },
        activeBoardDocument: {
          boardId: 'board-1',
          snapshot: { document: { foo: 'bar' } },
          updatedAt: 1,
        },
        addToast: vi.fn(),
        libraryMap: new Map(),
        saveWorkspaceBoardDocument: vi.fn(async () => undefined),
        setAiSummary: vi.fn(),
        setSelectedEntries: vi.fn(),
        themeMode: 'dark',
      })
    );

    const editor = buildEditor();
    result.current.handleEditorMount(editor as never);

    expect(editor.setCamera).not.toHaveBeenCalled();
  });
});
