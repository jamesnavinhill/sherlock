import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { cx } from '../utils/cx';
import { OverlayPanel } from './OverlayPanel';

export interface WorkflowDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
  size?: 'lg' | 'xl';
  className?: string;
  bodyClassName?: string;
  sidebarClassName?: string;
}

export function WorkflowDialog({
  open,
  onClose,
  title,
  children,
  eyebrow,
  description,
  actions,
  footer,
  sidebar,
  size = 'xl',
  className,
  bodyClassName,
  sidebarClassName,
}: WorkflowDialogProps) {
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
        aria-label={`Close ${title}`}
        onClick={onClose}
      />
      <OverlayPanel
        title={title}
        eyebrow={eyebrow}
        description={description}
        actions={actions}
        footer={footer}
        onClose={onClose}
        closeLabel={`Close ${title}`}
        tone="dialog"
        className={cx('ds-workflow-dialog', `ds-workflow-dialog-${size}`, className)}
        bodyClassName={cx(
          'ds-workflow-dialog-body',
          Boolean(sidebar) && 'ds-workflow-dialog-body-with-sidebar',
          bodyClassName
        )}
        footerClassName="ds-workflow-dialog-footer"
      >
        <div className="ds-workflow-dialog-main">{children}</div>
        {sidebar ? (
          <aside className={cx('ds-workflow-dialog-sidebar', sidebarClassName)}>{sidebar}</aside>
        ) : null}
      </OverlayPanel>
    </div>
  );
}
