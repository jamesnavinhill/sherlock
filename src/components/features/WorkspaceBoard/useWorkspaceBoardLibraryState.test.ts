import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useWorkspaceBoardLibraryState } from './useWorkspaceBoardLibraryState';

describe('useWorkspaceBoardLibraryState', () => {
  it('creates a board note through the extracted library workflow', async () => {
    const createWorkspaceItem = vi.fn(async () => undefined);
    const handleDropEntry = vi.fn();

    const { result } = renderHook(() =>
      useWorkspaceBoardLibraryState({
        activeWorkspace: {
          id: 'ws-1',
          title: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-08',
        },
        addToast: vi.fn(),
        createWorkspaceItem,
        deleteWorkspaceItem: vi.fn(async () => undefined),
        editorRef: { current: null },
        handleDropEntry,
      })
    );

    act(() => {
      result.current.setCreateModal({
        type: 'NOTE',
        title: 'Atlas note',
        content: 'Findings from the board',
      });
    });

    await act(async () => {
      await result.current.handleSubmitCreateModal();
    });

    expect(createWorkspaceItem).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        kind: 'NOTE',
        title: 'Atlas note',
        textContent: 'Findings from the board',
      })
    );
    expect(handleDropEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        refKind: 'WORKSPACE_ITEM',
        title: 'Atlas note',
      })
    );
    expect(result.current.createModal).toBeNull();
  });

  it('removes matching board shapes before deleting a created workspace item', async () => {
    const deleteShapes = vi.fn();
    const deleteWorkspaceItem = vi.fn(async () => undefined);
    const addToast = vi.fn();

    const { result } = renderHook(() =>
      useWorkspaceBoardLibraryState({
        activeWorkspace: {
          id: 'ws-1',
          title: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-08',
        },
        addToast,
        createWorkspaceItem: vi.fn(async () => undefined),
        deleteWorkspaceItem,
        editorRef: {
          current: {
            store: {
              allRecords: () => [
                {
                  id: 'shape:1',
                  typeName: 'shape',
                  meta: {
                    sherlockRefJson: JSON.stringify({
                      workspaceId: 'ws-1',
                      refKind: 'WORKSPACE_ITEM',
                      refId: 'item-1',
                      title: 'Atlas note',
                    }),
                  },
                },
              ],
            },
            deleteShapes,
          } as never,
        },
        handleDropEntry: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.confirmDeleteCreatedItem({
        workspaceId: 'ws-1',
        refKind: 'WORKSPACE_ITEM',
        refId: 'item-1',
        title: 'Atlas note',
        kind: 'NOTE',
        searchText: 'atlas note',
      });
    });

    expect(deleteShapes).toHaveBeenCalledWith(['shape:1']);
    expect(deleteWorkspaceItem).toHaveBeenCalledWith('item-1');
    expect(addToast).toHaveBeenCalledWith('Removed item from the library.', 'SUCCESS');
  });
});
