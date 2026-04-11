import React from 'react';

import type { ArtifactType, Workspace } from '@/types';
import { getWorkspaceDisplayTitle } from '@/domain';
import type { WorkspaceDocumentUploadRoute } from '@/services/workspace/documentUploads';
import type { WorkspaceDocumentUploadDialogState } from '@/components/features/shared/useWorkspaceDocumentUpload';
import { ModalShell } from './ModalShell';
import { OsintSelect, type OsintSelectOption } from './OsintSelect';

interface WorkspaceDocumentUploadDialogProps {
  isSubmitting: boolean;
  onArtifactTypeChange: (artifactType: ArtifactType) => void;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  onRouteChange: (route: WorkspaceDocumentUploadRoute) => void;
  onSelectFiles?: () => void;
  onTargetWorkspaceChange: (workspaceId: string) => void;
  state: WorkspaceDocumentUploadDialogState;
  workspaces: Workspace[];
}

const ARTIFACT_TYPE_OPTIONS: ArtifactType[] = [
  'REPORT',
  'SYNTHESIS',
  'BRIEF',
  'DIGEST',
  'COMPARISON',
  'NOTE',
  'TIMELINE',
  'MONITOR_SNAPSHOT',
];

const formatArtifactTypeLabel = (artifactType: ArtifactType) =>
  artifactType
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const ARTIFACT_TYPE_SELECT_OPTIONS: OsintSelectOption[] = ARTIFACT_TYPE_OPTIONS.map(
  (artifactType) => ({
    value: artifactType,
    label: formatArtifactTypeLabel(artifactType),
  })
);

const buildConfirmLabel = (state: WorkspaceDocumentUploadDialogState) =>
  state.files.length === 0
    ? 'Select Files'
    : state.route === 'WORKSPACE_ITEM'
    ? state.files.length === 1
      ? 'Save As Item'
      : `Save ${state.files.length} Items`
    : state.files.length === 1
      ? 'Create Artifact Draft'
      : `Create ${state.files.length} Artifacts`;

export const WorkspaceDocumentUploadDialog: React.FC<WorkspaceDocumentUploadDialogProps> = ({
  isSubmitting,
  onArtifactTypeChange,
  onClose,
  onConfirm,
  onRouteChange,
  onSelectFiles,
  onTargetWorkspaceChange,
  state,
  workspaces,
}) => {
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === state.targetWorkspaceId) || null;
  const requiresWorkspaceSelection = workspaces.length > 1 || !selectedWorkspace;
  const workspaceOptions: OsintSelectOption[] = [
    { value: '', label: 'Select a workspace...' },
    ...workspaces.map((workspace) => ({
      value: workspace.id,
      label: getWorkspaceDisplayTitle(workspace),
    })),
  ];
  const hasFiles = state.files.length > 0;
  const selectedFilesPanelClassName = onSelectFiles
    ? `w-full border p-4 text-left transition ${
        hasFiles
          ? 'border-zinc-800 bg-black/50 hover:border-zinc-600'
          : 'border-dashed border-zinc-700 bg-zinc-950/60 hover:border-osint-primary'
      } ${isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`
    : 'border border-zinc-800 bg-black/50 p-4';
  const selectedFilesLabel = hasFiles ? 'Selected Files' : 'Select Files';

  return (
    <ModalShell
      title="Route Uploaded Documents"
      description="Choose whether these files should become canonical workspace items or draft artifacts."
      onClose={onClose}
      widthClassName="max-w-2xl"
      allowOverflow
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="border border-zinc-700 px-4 py-2 osint-meta-label text-zinc-400 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void onConfirm()}
            disabled={isSubmitting || !selectedWorkspace || !hasFiles}
            className="osint-button-primary px-4 py-2 osint-meta-label-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Importing...' : buildConfirmLabel(state)}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {onSelectFiles ? (
          <button
            type="button"
            onClick={onSelectFiles}
            disabled={isSubmitting}
            aria-label={hasFiles ? 'Replace selected files' : 'Select files from device'}
            className={selectedFilesPanelClassName}
          >
            <div className="osint-meta-label">{selectedFilesLabel}</div>
            {hasFiles ? (
              <div className="mt-3 space-y-2">
                {state.files.slice(0, 4).map((file) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="truncate osint-body-small text-zinc-200">{file.name}</span>
                    <span className="shrink-0 osint-meta-label text-zinc-500">
                      {file.type || 'Unknown type'}
                    </span>
                  </div>
                ))}
                {state.files.length > 4 ? (
                  <div className="osint-meta-label text-zinc-500">
                    +{state.files.length - 4} more file(s)
                  </div>
                ) : null}
                <div className="pt-1 osint-meta-label text-zinc-500">
                  Click to replace the selected files.
                </div>
              </div>
            ) : (
              <div className="mt-3 osint-body-muted">
                Open the file system and choose the documents you want to route into this workspace.
              </div>
            )}
          </button>
        ) : (
          <div className={selectedFilesPanelClassName}>
            <div className="osint-meta-label">Selected Files</div>
            <div className="mt-3 space-y-2">
              {state.files.slice(0, 4).map((file) => (
                <div
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="truncate osint-body-small text-zinc-200">{file.name}</span>
                  <span className="shrink-0 osint-meta-label text-zinc-500">
                    {file.type || 'Unknown type'}
                  </span>
                </div>
              ))}
              {state.files.length > 4 ? (
                <div className="osint-meta-label text-zinc-500">
                  +{state.files.length - 4} more file(s)
                </div>
              ) : null}
            </div>
          </div>
        )}

        {requiresWorkspaceSelection ? (
          <div>
            <div className="block osint-meta-label">
              Target Workspace
            </div>
            <OsintSelect
              ariaLabel="Target workspace"
              value={state.targetWorkspaceId}
              onChange={onTargetWorkspaceChange}
              options={workspaceOptions}
              containerClassName="mt-3"
              triggerClassName="px-3 py-3 osint-body-small"
            />
          </div>
        ) : selectedWorkspace ? (
          <div className="border border-zinc-800 bg-zinc-950/80 px-4 py-3">
            <div className="osint-meta-label">Target Workspace</div>
            <div className="mt-1 osint-meta-value">{getWorkspaceDisplayTitle(selectedWorkspace)}</div>
          </div>
        ) : null}

        <div>
          <div className="osint-meta-label">Destination</div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => onRouteChange('WORKSPACE_ITEM')}
              className={`border px-4 py-4 text-left transition ${
                state.route === 'WORKSPACE_ITEM'
                  ? 'border-osint-primary bg-osint-primary/10 text-white'
                  : 'border-zinc-800 bg-black text-zinc-300 hover:border-zinc-600 hover:text-white'
              }`}
            >
              <div className="osint-meta-label-strong">Workspace Item</div>
              <p className="mt-2 osint-body-muted">
                Saves each file into the canonical workspace library for Files, Chat, Board, and search.
              </p>
            </button>
            <button
              type="button"
              onClick={() => onRouteChange('ARTIFACT_DRAFT')}
              className={`border px-4 py-4 text-left transition ${
                state.route === 'ARTIFACT_DRAFT'
                  ? 'border-osint-primary bg-osint-primary/10 text-white'
                  : 'border-zinc-800 bg-black text-zinc-300 hover:border-zinc-600 hover:text-white'
              }`}
            >
              <div className="osint-meta-label-strong">Artifact Draft</div>
              <p className="mt-2 osint-body-muted">
                Creates one draft artifact per file so the document can enter the artifact-reading flow directly.
              </p>
            </button>
          </div>
        </div>

        {state.route === 'ARTIFACT_DRAFT' ? (
          <div>
            <div className="block osint-meta-label">
              Artifact Type
            </div>
            <OsintSelect
              ariaLabel="Artifact type"
              value={state.artifactType}
              onChange={(value) => onArtifactTypeChange(value as ArtifactType)}
              options={ARTIFACT_TYPE_SELECT_OPTIONS}
              containerClassName="mt-3"
              triggerClassName="px-3 py-3 osint-body-small"
              menuPlacement="top"
              portalledMenu
            />
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
};
