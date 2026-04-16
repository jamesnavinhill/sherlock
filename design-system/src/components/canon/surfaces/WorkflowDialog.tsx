import type { ReactNode } from 'react';

import { cx } from '../utils/cx';
import {
  DialogSurface,
  type DialogSurfacePresentation,
  type DialogSurfaceSize,
} from './DialogSurface';
import { OverlayPanel } from './OverlayPanel';

export type WorkflowDialogSize = Extract<DialogSurfaceSize, 'lg' | 'xl'>;

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
  size?: WorkflowDialogSize;
  className?: string;
  bodyClassName?: string;
  sidebarClassName?: string;
  presentation?: DialogSurfacePresentation;
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
  presentation = 'modal',
}: WorkflowDialogProps) {
  return (
    <DialogSurface
      open={open}
      onClose={onClose}
      title={title}
      presentation={presentation}
      size={size}
    >
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
    </DialogSurface>
  );
}
