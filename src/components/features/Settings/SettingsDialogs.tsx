import React from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ModalShell } from '@/components/ui/ModalShell';

interface SettingsDialogsProps {
  feedbackDialog: { title: string; description: string } | null;
  pendingImportName: string | null;
  showImportDialog: boolean;
  showPurgeDialog: boolean;
  onCloseFeedbackDialog: () => void;
  onCloseImportDialog: () => void;
  onClosePurgeDialog: () => void;
  onConfirmImport: () => Promise<void>;
  onConfirmPurge: () => Promise<void>;
}

export const SettingsDialogs: React.FC<SettingsDialogsProps> = ({
  feedbackDialog,
  pendingImportName,
  showImportDialog,
  showPurgeDialog,
  onCloseFeedbackDialog,
  onCloseImportDialog,
  onClosePurgeDialog,
  onConfirmImport,
  onConfirmPurge,
}) => (
  <>
    {showImportDialog ? (
      <ConfirmDialog
        title="Restore Workspace Backup"
        description={`Restore workspace data from ${pendingImportName || 'the selected backup'}? Current workspace data will be replaced, while provider keys, theme settings, and other local app preferences stay as-is.`}
        confirmLabel="Restore Backup"
        onClose={onCloseImportDialog}
        onConfirm={() => void onConfirmImport()}
      />
    ) : null}

    {showPurgeDialog ? (
      <ConfirmDialog
        title="Purge Workspace Data"
        description="Permanently delete all saved workspace data, including artifacts, runs, chat history, research boards, workspace library items, graph data, templates, and saved signals? Local theme settings, provider defaults, and API keys will stay untouched."
        confirmLabel="Purge Data"
        tone="danger"
        onClose={onClosePurgeDialog}
        onConfirm={() => void onConfirmPurge()}
      />
    ) : null}

    {feedbackDialog ? (
      <ModalShell
        title={feedbackDialog.title}
        description={feedbackDialog.description}
        onClose={onCloseFeedbackDialog}
        widthClassName="max-w-lg"
      >
        <div className="flex justify-end">
          <button
            onClick={onCloseFeedbackDialog}
            className="osint-button-primary px-4 py-2 osint-meta-label-strong"
          >
            Close
          </button>
        </div>
      </ModalShell>
    ) : null}
  </>
);
