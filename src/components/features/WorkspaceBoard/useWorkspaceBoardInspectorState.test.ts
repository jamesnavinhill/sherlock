import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useWorkspaceBoardInspectorState } from './useWorkspaceBoardInspectorState';

describe('useWorkspaceBoardInspectorState', () => {
  it('keeps board inspector sections exclusive', () => {
    const { result } = renderHook(() =>
      useWorkspaceBoardInspectorState({
        activeBoard: {
          id: 'board-1',
          workspaceId: 'ws-1',
          name: 'Primary Board',
          sortOrder: 0,
          presentationMode: false,
          createdAt: 1,
          updatedAt: 1,
        },
        activeWorkspace: {
          id: 'ws-1',
          title: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-08',
        },
        addToast: vi.fn(),
        createWorkspaceItem: vi.fn(async () => undefined),
        handleDropEntry: vi.fn(),
        navigate: vi.fn(),
        onOpenChat: vi.fn(),
        onOpenReport: vi.fn(),
        persistCurrentBoardDocument: vi.fn(async () => undefined),
        setAiBusy: vi.fn(),
        setAiSummary: vi.fn(),
        selectedArtifact: null,
        selectedEntries: [],
        selectedHeadline: null,
        selectedPrimaryEntry: null,
        selectedWorkspaceItem: null,
        workspaceArtifacts: [],
        workspaceHeadlines: [],
      })
    );

    expect(result.current.inspectorSections).toEqual({
      quickActions: false,
      selection: false,
      provenance: false,
    });

    act(() => {
      result.current.toggleInspectorSection('selection');
    });

    expect(result.current.inspectorSections).toEqual({
      quickActions: false,
      selection: true,
      provenance: false,
    });

    act(() => {
      result.current.toggleInspectorSection('provenance');
    });

    expect(result.current.inspectorSections).toEqual({
      quickActions: false,
      selection: false,
      provenance: true,
    });
  });

  it('opens selected workspace items in item-grounded chat', () => {
    const onOpenChat = vi.fn();

    const { result } = renderHook(() =>
      useWorkspaceBoardInspectorState({
        activeBoard: {
          id: 'board-1',
          workspaceId: 'ws-1',
          name: 'Primary Board',
          sortOrder: 0,
          presentationMode: false,
          createdAt: 1,
          updatedAt: 1,
        },
        activeWorkspace: {
          id: 'ws-1',
          title: 'Atlas Workspace',
          status: 'ACTIVE',
          dateOpened: '2026-04-08',
        },
        addToast: vi.fn(),
        createWorkspaceItem: vi.fn(async () => undefined),
        handleDropEntry: vi.fn(),
        navigate: vi.fn(),
        onOpenChat,
        onOpenReport: vi.fn(),
        persistCurrentBoardDocument: vi.fn(async () => undefined),
        setAiBusy: vi.fn(),
        setAiSummary: vi.fn(),
        selectedArtifact: null,
        selectedEntries: [
          {
            workspaceId: 'ws-1',
            refKind: 'WORKSPACE_ITEM',
            refId: 'item-1',
            title: 'Atlas note',
            kind: 'NOTE',
            searchText: 'atlas note',
          },
        ],
        selectedHeadline: null,
        selectedPrimaryEntry: {
          workspaceId: 'ws-1',
          refKind: 'WORKSPACE_ITEM',
          refId: 'item-1',
          title: 'Atlas note',
          kind: 'NOTE',
          searchText: 'atlas note',
        },
        selectedWorkspaceItem: {
          id: 'item-1',
          workspaceId: 'ws-1',
          kind: 'NOTE',
          title: 'Atlas note',
          createdAt: 1,
          updatedAt: 1,
          provenance: {
            source: 'CHAT',
            sourceArtifactId: 'rep-1',
          },
        },
        workspaceArtifacts: [],
        workspaceHeadlines: [],
      })
    );

    act(() => {
      result.current.handleOpenSelectedChat();
    });

    expect(onOpenChat).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      launchContext: {
        workspaceItemId: 'item-1',
        sourceArtifactId: 'rep-1',
        signalId: undefined,
        headlineId: undefined,
      },
    });
  });
});
