import React from 'react';

import { ModalShell } from './ModalShell';

interface ConfirmDialogProps {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
}) => {
  const confirmClassName =
    tone === 'danger'
      ? 'border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-mono uppercase text-red-200 transition hover:border-red-400 hover:bg-red-500/20'
      : 'osint-button-primary px-4 py-2 text-xs font-mono uppercase';

  return (
    <ModalShell title={title} description={description} onClose={onClose} widthClassName="max-w-lg">
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="border border-zinc-700 px-4 py-2 text-xs font-mono uppercase text-zinc-400 transition hover:border-zinc-500 hover:text-white"
        >
          {cancelLabel}
        </button>
        <button onClick={() => void onConfirm()} className={confirmClassName}>
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
};
