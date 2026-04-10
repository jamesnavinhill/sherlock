import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Artifact, Workspace, WorkspaceItem } from '@/types';
import { useWorkspaceDocumentUpload } from './useWorkspaceDocumentUpload';

const workspaces: Workspace[] = [
  {
    id: 'ws-1',
    title: 'Atlas Workspace',
    status: 'ACTIVE',
    dateOpened: '2026-04-08',
  },
  {
    id: 'ws-2',
    title: 'Beacon Workspace',
    status: 'ACTIVE',
    dateOpened: '2026-04-08',
  },
];

describe('useWorkspaceDocumentUpload', () => {
  it('opens upload routing state from selected files', () => {
    const { result } = renderHook(() =>
      useWorkspaceDocumentUpload({
        addToast: vi.fn(),
        createWorkspaceItem: vi.fn(async (_item: WorkspaceItem) => undefined),
        initialWorkspaceId: 'ws-2',
        saveArtifact: vi.fn(async (artifact: Artifact) => artifact),
        source: 'CHAT',
        workspaces,
      })
    );

    act(() => {
      result.current.handleFileUpload({
        target: {
          files: [new File(['Atlas findings'], 'atlas-notes.md', { type: 'text/markdown' })],
          value: 'atlas-notes.md',
        },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.uploadDialogState).toEqual(
      expect.objectContaining({
        route: 'WORKSPACE_ITEM',
        targetWorkspaceId: 'ws-2',
      })
    );
    expect(result.current.uploadDialogState?.files).toHaveLength(1);
  });

  it('can open an empty upload dialog and preserve selections when files are added later', () => {
    const { result } = renderHook(() =>
      useWorkspaceDocumentUpload({
        addToast: vi.fn(),
        createWorkspaceItem: vi.fn(async (_item: WorkspaceItem) => undefined),
        initialWorkspaceId: 'ws-1',
        saveArtifact: vi.fn(async (artifact: Artifact) => artifact),
        source: 'FILES',
        workspaces,
      })
    );

    act(() => {
      result.current.openUploadDialog();
      result.current.setUploadRoute('ARTIFACT_DRAFT');
      result.current.setUploadArtifactType('BRIEF');
      result.current.setUploadTargetWorkspaceId('ws-2');
    });

    expect(result.current.uploadDialogState).toEqual(
      expect.objectContaining({
        artifactType: 'BRIEF',
        files: [],
        route: 'ARTIFACT_DRAFT',
        targetWorkspaceId: 'ws-2',
      })
    );

    act(() => {
      result.current.handleFileUpload({
        target: {
          files: [new File(['Atlas findings'], 'atlas-brief.md', { type: 'text/markdown' })],
          value: 'atlas-brief.md',
        },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.uploadDialogState).toEqual(
      expect.objectContaining({
        artifactType: 'BRIEF',
        route: 'ARTIFACT_DRAFT',
        targetWorkspaceId: 'ws-2',
      })
    );
    expect(result.current.uploadDialogState?.files).toHaveLength(1);
  });

  it('commits artifact-route uploads through saveArtifact', async () => {
    const addToast = vi.fn();
    const createWorkspaceItem = vi.fn(async (_item: WorkspaceItem) => undefined);
    const saveArtifact = vi.fn(async (artifact: Artifact) => artifact);
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useWorkspaceDocumentUpload({
        addToast,
        createWorkspaceItem,
        initialWorkspaceId: 'ws-1',
        onComplete,
        saveArtifact,
        source: 'FILES',
        workspaces,
      })
    );

    act(() => {
      result.current.handleFileUpload({
        target: {
          files: [new File(['Atlas findings'], 'atlas-brief.md', { type: 'text/markdown' })],
          value: 'atlas-brief.md',
        },
      } as unknown as ChangeEvent<HTMLInputElement>);
      result.current.setUploadRoute('ARTIFACT_DRAFT');
      result.current.setUploadArtifactType('REPORT');
    });

    await act(async () => {
      await result.current.confirmUploadDialog();
    });

    expect(createWorkspaceItem).not.toHaveBeenCalled();
    expect(saveArtifact).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        route: 'ARTIFACT_DRAFT',
        targetWorkspaceId: 'ws-1',
      })
    );
    expect(addToast).toHaveBeenCalledWith(
      expect.stringMatching(/Created .*draft/i),
      'SUCCESS'
    );
  });
});
