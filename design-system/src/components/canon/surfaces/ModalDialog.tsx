import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { Button } from '../controls/Button';

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
    <div className="ds-modal-layer" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="ds-modal-backdrop"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div className="ds-modal">
        <div className="ds-modal-header">
          <div>
            {eyebrow ? <div className="ds-meta-label">{eyebrow}</div> : null}
            <h2 className="ds-title-section">{title}</h2>
            {description ? <p className="ds-body-quiet">{description}</p> : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ds-modal-close"
            leadingIcon={<X size={14} />}
            onClick={onClose}
          >
            Close
          </Button>
        </div>
        {children ? <div className="ds-modal-body">{children}</div> : null}
        {actions ? <div className="ds-modal-footer">{actions}</div> : null}
      </div>
    </div>
  );
}
