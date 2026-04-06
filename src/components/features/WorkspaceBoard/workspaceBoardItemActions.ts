import { createLocalId } from '@/utils/id';
import type { Artifact, Headline, Workspace, WorkspaceBoard, WorkspaceItem } from '@/types';
import type { WorkspaceLibraryEntry } from '@/services/workspace/library';
import {
  buildWorkspaceItemFromBoardDraft,
  generateBoardSelectionDraft,
} from '@/services/workspace/boardAi';

interface CreateBoardItemModalState {
  type: 'NOTE' | 'LINK';
  title: string;
  content?: string;
  description?: string;
  url?: string;
}

export const buildWorkspaceItemFromCreateModal = ({
  createModal,
  workspaceId,
}: {
  createModal: CreateBoardItemModalState;
  workspaceId: string;
}): WorkspaceItem | null => {
  const now = Date.now();

  if (createModal.type === 'NOTE' && createModal.title.trim() && createModal.content?.trim()) {
    return {
      id: createLocalId('workspace-item'),
      workspaceId,
      kind: 'NOTE',
      title: createModal.title.trim(),
      description: createModal.content.trim().slice(0, 240),
      textContent: createModal.content.trim(),
      provenance: {
        source: 'USER',
        description: 'Created manually inside the research workspace.',
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  if (createModal.type === 'LINK' && createModal.title.trim() && createModal.url?.trim()) {
    return {
      id: createLocalId('workspace-item'),
      workspaceId,
      kind: 'LINK',
      title: createModal.title.trim(),
      description: createModal.description?.trim() || createModal.url.trim(),
      url: createModal.url.trim(),
      provenance: {
        source: 'INGESTION',
        description: 'Captured from a manual workspace link ingestion.',
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  return null;
};

const readPreviewUrl = async (file: File): Promise<string | undefined> => {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return undefined;
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

export const ingestWorkspaceFiles = async ({
  createWorkspaceItem,
  files,
  workspaceId,
}: {
  createWorkspaceItem: (item: WorkspaceItem) => Promise<unknown>;
  files: File[];
  workspaceId: string;
}) => {
  for (const file of files) {
    const previewUrl = await readPreviewUrl(file);
    await createWorkspaceItem({
      id: createLocalId('workspace-item'),
      workspaceId,
      kind: file.type.startsWith('image/') || file.type.startsWith('video/') ? 'MEDIA' : 'FILE',
      title: file.name,
      description: `${file.name} - ${Math.max(1, Math.round(file.size / 1024))} KB`,
      mimeType: file.type || undefined,
      fileName: file.name,
      sizeBytes: file.size,
      previewUrl: previewUrl || undefined,
      provenance: {
        source: 'INGESTION',
        description: 'Captured from a local file upload.',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
};

export const generateWorkspaceSelectionSummary = async ({
  artifacts,
  headlines,
  selectedEntries,
  workspace,
}: {
  artifacts: Artifact[];
  headlines: Headline[];
  selectedEntries: WorkspaceLibraryEntry[];
  workspace: Workspace;
}) =>
  generateBoardSelectionDraft({
    workspace,
    artifacts,
    headlines,
    selectedEntries,
    mode: 'SUMMARY',
  });

export const createWorkspaceSelectionNote = async ({
  activeBoard,
  createWorkspaceItem,
  selectedEntries,
  workspace,
  workspaceArtifacts,
  workspaceHeadlines,
}: {
  activeBoard: WorkspaceBoard;
  createWorkspaceItem: (item: WorkspaceItem) => Promise<unknown>;
  selectedEntries: WorkspaceLibraryEntry[];
  workspace: Workspace;
  workspaceArtifacts: Artifact[];
  workspaceHeadlines: Headline[];
}) => {
  const result = await generateBoardSelectionDraft({
    workspace,
    artifacts: workspaceArtifacts,
    headlines: workspaceHeadlines,
    selectedEntries,
    mode: 'NOTE',
  });

  const noteItem = buildWorkspaceItemFromBoardDraft({
    workspaceId: workspace.id,
    title: result.title,
    content: result.content,
    sourceBoardId: activeBoard.id,
  });

  await createWorkspaceItem(noteItem);
  return noteItem;
};
