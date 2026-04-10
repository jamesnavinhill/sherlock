import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import type { Artifact, ArtifactType, Workspace, WorkspaceItem } from '@/types';
import {
  commitWorkspaceDocumentUploads,
  getWorkspaceDocumentUploadSuccessMessage,
  type CommitWorkspaceDocumentUploadsResult,
  type WorkspaceDocumentUploadRoute,
  type WorkspaceDocumentUploadSource,
} from '@/services/workspace/documentUploads';

export interface WorkspaceDocumentUploadDialogState {
  artifactType: ArtifactType;
  files: File[];
  route: WorkspaceDocumentUploadRoute;
  targetWorkspaceId: string;
}

interface UseWorkspaceDocumentUploadInput {
  addToast: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  createWorkspaceItem: (item: WorkspaceItem) => Promise<unknown>;
  defaultArtifactType?: ArtifactType;
  initialWorkspaceId?: string | null;
  onComplete?: (result: CommitWorkspaceDocumentUploadsResult) => Promise<void> | void;
  saveArtifact: (
    artifact: Artifact,
    parentContext?: { topic: string; summary: string }
  ) => Promise<Artifact>;
  source: WorkspaceDocumentUploadSource;
  workspaces: Workspace[];
}

const resolveInitialWorkspaceId = (input: {
  initialWorkspaceId?: string | null;
  workspaces: Workspace[];
}) => {
  if (input.initialWorkspaceId) {
    return input.initialWorkspaceId;
  }
  if (input.workspaces.length === 1) {
    return input.workspaces[0]?.id || '';
  }
  return '';
};

export const useWorkspaceDocumentUpload = ({
  addToast,
  createWorkspaceItem,
  defaultArtifactType = 'REPORT',
  initialWorkspaceId,
  onComplete,
  saveArtifact,
  source,
  workspaces,
}: UseWorkspaceDocumentUploadInput) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadDialogState, setUploadDialogState] = useState<WorkspaceDocumentUploadDialogState | null>(
    null
  );
  const [uploadInFlight, setUploadInFlight] = useState(false);

  const buildInitialDialogState = useCallback(
    (): WorkspaceDocumentUploadDialogState => ({
      artifactType: defaultArtifactType,
      files: [],
      route: 'WORKSPACE_ITEM',
      targetWorkspaceId: resolveInitialWorkspaceId({
        initialWorkspaceId,
        workspaces,
      }),
    }),
    [defaultArtifactType, initialWorkspaceId, workspaces]
  );

  const handleFileUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      if (files.length === 0) return;

      setUploadDialogState((current) => ({
        ...(current || buildInitialDialogState()),
        files,
      }));
    },
    [buildInitialDialogState]
  );

  const closeUploadDialog = useCallback(() => {
    if (uploadInFlight) return;
    setUploadDialogState(null);
  }, [uploadInFlight]);

  const setUploadRoute = useCallback((route: WorkspaceDocumentUploadRoute) => {
    setUploadDialogState((current) => (current ? { ...current, route } : current));
  }, []);

  const setUploadArtifactType = useCallback((artifactType: ArtifactType) => {
    setUploadDialogState((current) => (current ? { ...current, artifactType } : current));
  }, []);

  const setUploadTargetWorkspaceId = useCallback((targetWorkspaceId: string) => {
    setUploadDialogState((current) => (current ? { ...current, targetWorkspaceId } : current));
  }, []);

  const confirmUploadDialog = useCallback(async () => {
    if (!uploadDialogState) return;
    if (uploadDialogState.files.length === 0) {
      addToast('Select at least one file before importing documents.', 'ERROR');
      return;
    }

    const targetWorkspace = workspaces.find(
      (workspace) => workspace.id === uploadDialogState.targetWorkspaceId
    );
    if (!targetWorkspace) {
      addToast('Select a workspace before importing documents.', 'ERROR');
      return;
    }

    setUploadInFlight(true);
    try {
      const result = await commitWorkspaceDocumentUploads({
        artifactType: uploadDialogState.artifactType,
        createWorkspaceItem,
        files: uploadDialogState.files,
        route: uploadDialogState.route,
        saveArtifact,
        source,
        workspace: targetWorkspace,
      });
      await onComplete?.(result);
      addToast(getWorkspaceDocumentUploadSuccessMessage(result), 'SUCCESS');
      setUploadDialogState(null);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Unable to import the uploaded documents.',
        'ERROR'
      );
    } finally {
      setUploadInFlight(false);
    }
  }, [
    addToast,
    createWorkspaceItem,
    onComplete,
    saveArtifact,
    source,
    uploadDialogState,
    workspaces,
  ]);

  return {
    closeUploadDialog,
    confirmUploadDialog,
    fileInputRef,
    handleFileUpload,
    openUploadDialog: () => setUploadDialogState(buildInitialDialogState()),
    openUploadPicker: () => fileInputRef.current?.click(),
    setUploadArtifactType,
    setUploadRoute,
    setUploadTargetWorkspaceId,
    uploadDialogState,
    uploadInFlight,
  };
};
