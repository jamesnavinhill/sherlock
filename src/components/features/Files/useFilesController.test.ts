import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.fn();
const storeState = vi.hoisted(() => ({
  useWorkspaceStore: vi.fn(),
}));
const uploadState = vi.hoisted(() => ({
  useWorkspaceDocumentUpload: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [new URLSearchParams('')],
  };
});

vi.mock('@/store/workspaceStore', () => ({
  useWorkspaceStore: storeState.useWorkspaceStore,
}));

vi.mock('@/components/features/shared/useWorkspaceDocumentUpload', () => ({
  useWorkspaceDocumentUpload: uploadState.useWorkspaceDocumentUpload,
}));

import { useFilesController } from './useFilesController';

describe('useFilesController', () => {
  let setActiveWorkspaceId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setActiveWorkspaceId = vi.fn();

    storeState.useWorkspaceStore.mockReturnValue({
      activeWorkspaceId: null,
      artifacts: [],
      workspaces: [
        {
          id: 'ws-1',
          title: 'Workspace One',
          displayTitle: 'Workspace One',
          status: 'ACTIVE',
          dateOpened: '2026-04-10',
        },
      ],
      workspaceItems: [],
      addToast: vi.fn(),
      createWorkspaceItem: vi.fn(),
      deleteArtifact: vi.fn(),
      ensureWorkspaceBoard: vi.fn(),
      purgeWorkspace: vi.fn(),
      queueBoardPlacement: vi.fn(),
      saveArtifact: vi.fn(),
      setActiveWorkspaceId,
      updateWorkspace: vi.fn(),
    });

    uploadState.useWorkspaceDocumentUpload.mockReturnValue({
      closeUploadDialog: vi.fn(),
      confirmUploadDialog: vi.fn(),
      fileInputRef: { current: null },
      handleFileUpload: vi.fn(),
      openUploadPicker: vi.fn(),
      setUploadArtifactType: vi.fn(),
      setUploadRoute: vi.fn(),
      setUploadTargetWorkspaceId: vi.fn(),
      uploadDialogState: null,
      uploadInFlight: false,
    });
  });

  it('syncs the global active workspace immediately when the files selection changes', () => {
    const onOpenChat = vi.fn();
    const onSelectReport = vi.fn();

    const { result } = renderHook(() =>
      useFilesController({
        onOpenChat,
        onSelectReport,
      })
    );

    act(() => {
      result.current.handleWorkspaceSelect('ws-1');
    });

    expect(setActiveWorkspaceId).toHaveBeenCalledWith('ws-1');

    act(() => {
      result.current.handleWorkspaceSelect('ALL');
    });

    expect(setActiveWorkspaceId).toHaveBeenCalledWith(null);
  });

  it('hydrates the selected files workspace from the active workspace state', () => {
    storeState.useWorkspaceStore.mockReturnValue({
      activeWorkspaceId: 'ws-1',
      artifacts: [],
      workspaces: [
        {
          id: 'ws-1',
          title: 'Workspace One',
          displayTitle: 'Workspace One',
          status: 'ACTIVE',
          dateOpened: '2026-04-10',
        },
      ],
      workspaceItems: [],
      addToast: vi.fn(),
      createWorkspaceItem: vi.fn(),
      deleteArtifact: vi.fn(),
      ensureWorkspaceBoard: vi.fn(),
      purgeWorkspace: vi.fn(),
      queueBoardPlacement: vi.fn(),
      saveArtifact: vi.fn(),
      setActiveWorkspaceId,
      updateWorkspace: vi.fn(),
    });

    const { result } = renderHook(() =>
      useFilesController({
        onOpenChat: vi.fn(),
        onSelectReport: vi.fn(),
      })
    );

    expect(result.current.effectiveSelectedCaseId).toBe('ws-1');
  });
});
