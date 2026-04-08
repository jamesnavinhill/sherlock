import React, { useEffect, useRef } from 'react';

import { ModalShell } from './ModalShell';

interface TextPromptDialogProps {
  title: string;
  description?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  placeholder?: string;
}

export const TextPromptDialog: React.FC<TextPromptDialogProps> = ({
  title,
  description,
  label,
  value,
  onChange,
  onClose,
  onConfirm,
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  placeholder,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <ModalShell
      title={title}
      description={description}
      onClose={onClose}
      widthClassName="max-w-lg"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="border border-zinc-700 px-4 py-2 osint-meta-label text-zinc-400 transition hover:border-zinc-500 hover:text-white"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => void onConfirm()}
            className="osint-button-primary px-4 py-2 osint-meta-label-strong"
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <label className="block osint-meta-label" htmlFor="text-prompt-input">
        {label}
      </label>
      <input
        id="text-prompt-input"
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            void onConfirm();
          }
        }}
        placeholder={placeholder}
        className="mt-3 w-full border border-zinc-700 bg-black px-3 py-3 osint-body-small text-white outline-none transition focus:border-osint-primary"
      />
    </ModalShell>
  );
};
