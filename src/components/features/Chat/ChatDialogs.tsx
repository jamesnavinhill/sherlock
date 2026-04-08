import React from 'react';

import { getWorkspaceDisplayTitle } from '@/domain';
import type { Artifact, InvestigationLaunchRequest, Workspace } from '@/types';
import { ModalShell } from '@/components/ui/ModalShell';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TextPromptDialog } from '@/components/ui/TextPromptDialog';
import { RunSetupModal } from '../Runs/RunSetupModal';
import type {
  AppendArtifactDialogState,
  FollowUpDialogState,
  RenameSessionDialogState,
} from './useChatController';
import { buildManualSetupSeed } from './chatPageUtils';

interface ChatDialogsProps {
  activeWorkspace: Workspace | null;
  manualSetupDraft: Parameters<typeof buildManualSetupSeed>[0] | null;
  showNewProjectModal: boolean;
  renameSessionDialog: RenameSessionDialogState | null;
  deleteSessionDialog: { title: string } | null;
  appendArtifactDialog: AppendArtifactDialogState | null;
  followUpDialog: FollowUpDialogState | null;
  appendableWorkspaceReports: Array<Artifact & { id: string }>;
  onLaunchInvestigation: (request: InvestigationLaunchRequest) => void;
  onCloseManualSetup: () => void;
  onCloseNewProjectModal: () => void;
  onCloseRenameSession: () => void;
  onCloseDeleteSession: () => void;
  onCloseAppendArtifact: () => void;
  onCloseFollowUp: () => void;
  onConfirmRenameSession: () => Promise<void>;
  onConfirmDeleteSession: () => Promise<void>;
  onConfirmAppendMessageToArtifact: () => Promise<void>;
  onConfirmLaunchFollowUp: () => Promise<void>;
  onRenameTitleChange: (value: string) => void;
  onAppendArtifactChange: (reportId: string) => void;
  onFollowUpTopicChange: (value: string) => void;
}

export const ChatDialogs: React.FC<ChatDialogsProps> = ({
  activeWorkspace,
  manualSetupDraft,
  showNewProjectModal,
  renameSessionDialog,
  deleteSessionDialog,
  appendArtifactDialog,
  followUpDialog,
  appendableWorkspaceReports,
  onLaunchInvestigation,
  onCloseManualSetup,
  onCloseNewProjectModal,
  onCloseRenameSession,
  onCloseDeleteSession,
  onCloseAppendArtifact,
  onCloseFollowUp,
  onConfirmRenameSession,
  onConfirmDeleteSession,
  onConfirmAppendMessageToArtifact,
  onConfirmLaunchFollowUp,
  onRenameTitleChange,
  onAppendArtifactChange,
  onFollowUpTopicChange,
}) => (
  <>
    {manualSetupDraft ? (
      <RunSetupModal
        {...buildManualSetupSeed(manualSetupDraft)}
        initialContext={
          manualSetupDraft.workspaceIntent === 'CURRENT' && activeWorkspace
            ? {
                topic: getWorkspaceDisplayTitle(activeWorkspace),
                summary:
                  activeWorkspace.description ||
                  `${getWorkspaceDisplayTitle(activeWorkspace)} workspace`,
              }
            : undefined
        }
        inheritanceHint="The guided builder already populated these fields. Adjust anything you want before launch."
        onCancel={onCloseManualSetup}
        onStart={(topic, configOverride, preseededEntities, scope, dateRange) => {
          onLaunchInvestigation({
            topic,
            configOverride,
            preseededEntities,
            scope,
            dateRangeOverride: dateRange,
            switchToView: true,
            launchSource: 'CHAT_GUIDED_MANUAL',
          });
          onCloseManualSetup();
        }}
      />
    ) : null}

    {showNewProjectModal ? (
      <RunSetupModal
        initialTopic=""
        initialScopeId={activeWorkspace?.scopeId}
        onCancel={onCloseNewProjectModal}
        onStart={(topic, configOverride, preseededEntities, scope, dateRange) => {
          onLaunchInvestigation({
            topic,
            configOverride,
            preseededEntities,
            scope,
            dateRangeOverride: dateRange,
            switchToView: true,
            launchSource: 'CHAT_NEW_PROJECT',
          });
          onCloseNewProjectModal();
        }}
      />
    ) : null}

    {renameSessionDialog ? (
      <TextPromptDialog
        title="Rename Chat Session"
        description="Choose a clearer session title for this workspace thread."
        label="Session Title"
        value={renameSessionDialog.title}
        onChange={onRenameTitleChange}
        onClose={onCloseRenameSession}
        onConfirm={() => void onConfirmRenameSession()}
        confirmLabel="Save Title"
        placeholder="Session title"
      />
    ) : null}

    {deleteSessionDialog ? (
      <ConfirmDialog
        title="Delete Chat Session"
        description={`Delete "${deleteSessionDialog.title}" and its message history from this workspace?`}
        confirmLabel="Delete Session"
        tone="danger"
        onClose={onCloseDeleteSession}
        onConfirm={() => void onConfirmDeleteSession()}
      />
    ) : null}

    {appendArtifactDialog ? (
      <ModalShell
        title="Append Chat Note"
        description="Choose which saved artifact should receive this chat note as a new custom section."
        onClose={onCloseAppendArtifact}
        widthClassName="max-w-lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={onCloseAppendArtifact}
              className="border border-zinc-700 px-4 py-2 osint-meta-label text-zinc-400 transition hover:border-zinc-500 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => void onConfirmAppendMessageToArtifact()}
              className="osint-button-primary px-4 py-2 osint-meta-label-strong"
            >
              Append Note
            </button>
          </div>
        }
      >
        <label htmlFor="append-artifact-select" className="block osint-meta-label">
          Target Artifact
        </label>
        <select
          id="append-artifact-select"
          value={appendArtifactDialog.selectedReportId}
          onChange={(event) => onAppendArtifactChange(event.target.value)}
          className="mt-3 w-full border border-zinc-700 bg-black px-3 py-3 osint-body-small text-white outline-none transition focus:border-osint-primary"
        >
          {appendableWorkspaceReports.map((artifact) => (
            <option key={artifact.id} value={artifact.id}>
              {artifact.topic}
            </option>
          ))}
        </select>
        {appendableWorkspaceReports.find(
          (artifact) => artifact.id === appendArtifactDialog.selectedReportId
        )?.summary ? (
          <p className="mt-4 osint-body-muted">
            {
              appendableWorkspaceReports.find(
                (artifact) => artifact.id === appendArtifactDialog.selectedReportId
              )?.summary
            }
          </p>
        ) : null}
      </ModalShell>
    ) : null}

    {followUpDialog ? (
      <TextPromptDialog
        title="Launch Follow-Up Run"
        description="Adjust the investigation topic before launching this follow-up from chat."
        label="Run Topic"
        value={followUpDialog.topic}
        onChange={onFollowUpTopicChange}
        onClose={onCloseFollowUp}
        onConfirm={() => void onConfirmLaunchFollowUp()}
        confirmLabel="Launch Run"
        placeholder="Follow-up topic"
      />
    ) : null}
  </>
);
