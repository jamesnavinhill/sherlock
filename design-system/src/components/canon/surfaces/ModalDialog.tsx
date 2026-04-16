import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useId } from 'react';

import { IconButton } from '../controls/IconButton';

export interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
}

export function ModalDialog({
  open,
  onClose,
  eyebrow,
  title,
  description,
  children,
  actions,
}: ModalDialogProps) {
  const titleId = useId();
  const descriptionId = description ? `${titleId}-description` : undefined;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="ds-modal-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <button
        type="button"
        className="ds-modal-backdrop"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div className="ds-modal">
        <div className="ds-modal-header">
          <div className="ds-modal-copy">
            {eyebrow ? <div className="ds-meta-label">{eyebrow}</div> : null}
            <h2 id={titleId} className="ds-title-section">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="ds-body-quiet">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton
            appearance="ghost"
            label={`Close ${title}`}
            icon={<X size={16} />}
            onClick={onClose}
          />
        </div>
        {children ? <div className="ds-modal-body">{children}</div> : null}
        {actions ? <div className="ds-modal-footer">{actions}</div> : null}
      </div>
    </div>
  );
}
