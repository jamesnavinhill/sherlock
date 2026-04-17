import type { ReactNode } from 'react';

import { Button, type ButtonVariant } from '../controls/Button';
import { OverlayPanel } from '../surfaces/OverlayPanel';
import { cx } from '../utils/cx';

export interface ConfigPanelProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  onReset?: () => void;
  resetLabel?: string;
  confirmLabel?: string;
  confirmVariant?: Exclude<ButtonVariant, 'icon'>;
  closeLabel?: string;
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
  footer?: ReactNode;
}

export function ConfigPanel({
  title,
  children,
  onClose,
  eyebrow,
  description,
  actions,
  onReset,
  resetLabel = 'Reset',
  confirmLabel = 'Done',
  confirmVariant = 'secondary',
  closeLabel = `Close ${title}`,
  className,
  bodyClassName,
  footerClassName,
  footer,
}: ConfigPanelProps) {
  const resolvedFooter =
    footer ??
    (onReset || onClose ? (
      <div className="ds-config-panel-footer-actions">
        {onReset ? (
          <Button variant="ghost" onClick={onReset}>
            {resetLabel}
          </Button>
        ) : (
          <span />
        )}
        <Button variant={confirmVariant} size="compact" onClick={onClose}>
          {confirmLabel}
        </Button>
      </div>
    ) : undefined);

  return (
    <OverlayPanel
      title={title}
      eyebrow={eyebrow}
      description={description}
      actions={actions}
      onClose={onClose}
      closeLabel={closeLabel}
      className={cx('ds-config-panel', className)}
      bodyClassName={cx('ds-config-panel-body', bodyClassName)}
      footerClassName={cx('ds-config-panel-footer', footerClassName)}
      footer={resolvedFooter}
    >
      {children}
    </OverlayPanel>
  );
}
