import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '../controls/Button';
import { cx } from '../utils/cx';

export interface OverlayPanelProps {
  title: string;
  children: ReactNode;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
  tone?: 'popover' | 'dialog';
}

export function OverlayPanel({
  title,
  children,
  eyebrow,
  description,
  actions,
  footer,
  onClose,
  closeLabel = `Close ${title}`,
  className,
  bodyClassName,
  footerClassName,
  tone = 'popover',
}: OverlayPanelProps) {
  return (
    <section className={cx('ds-overlay-panel', `ds-overlay-panel-${tone}`, className)}>
      <header className="ds-overlay-panel-header">
        <div className="ds-overlay-panel-copy">
          {eyebrow ? <div className="ds-meta-label">{eyebrow}</div> : null}
          <h2 className="ds-title-section">{title}</h2>
          {description ? <p className="ds-body-quiet">{description}</p> : null}
        </div>
        {actions || onClose ? (
          <div className="ds-overlay-panel-actions">
            {actions}
            {onClose ? (
              <Button
                variant="icon"
                size="sm"
                className="ds-overlay-panel-close"
                leadingIcon={<X size={14} />}
                aria-label={closeLabel}
                onClick={onClose}
              />
            ) : null}
          </div>
        ) : null}
      </header>

      <div className={cx('ds-overlay-panel-body', bodyClassName)}>{children}</div>

      {footer ? (
        <footer className={cx('ds-overlay-panel-footer', footerClassName)}>{footer}</footer>
      ) : null}
    </section>
  );
}
