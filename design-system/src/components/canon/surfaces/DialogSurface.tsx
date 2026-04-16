import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { cx } from '../utils/cx';

export type DialogSurfacePresentation = 'modal' | 'modeless';

export type DialogSurfaceSize = 'sm' | 'md' | 'lg' | 'xl';

export interface DialogSurfaceProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  presentation?: DialogSurfacePresentation;
  size?: DialogSurfaceSize;
  className?: string;
  surfaceClassName?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

export function DialogSurface({
  open,
  onClose,
  title,
  children,
  presentation = 'modal',
  size = 'md',
  className,
  surfaceClassName,
  ariaLabelledBy,
  ariaDescribedBy,
}: DialogSurfaceProps) {
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
      className={cx('ds-dialog-layer', `ds-dialog-layer-${presentation}`, className)}
      role="dialog"
      aria-modal={presentation === 'modal' ? 'true' : undefined}
      aria-label={ariaLabelledBy ? undefined : title}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      {presentation === 'modal' ? (
        <button
          type="button"
          className="ds-dialog-backdrop"
          aria-label={`Close ${title}`}
          onClick={onClose}
        />
      ) : null}
      <div
        className={cx(
          'ds-dialog-surface',
          `ds-dialog-surface-${size}`,
          `ds-dialog-surface-${presentation}`,
          surfaceClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
