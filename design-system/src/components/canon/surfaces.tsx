import { X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect } from 'react';

import { Button, cx } from './controls';

export function SurfaceCard({
  title,
  eyebrow,
  children,
  className,
  actions,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cx('ds-card', className)}>
      <header className="ds-card-header">
        <div className="ds-card-header-copy">
          {eyebrow ? <span className="ds-meta-label">{eyebrow}</span> : null}
          <h3 className="ds-title-card">{title}</h3>
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function ResponsiveGrid({
  children,
  minWidth = '18rem',
  className,
}: {
  children: ReactNode;
  minWidth?: string;
  className?: string;
}) {
  return (
    <div
      className={cx('ds-responsive-grid', className)}
      style={{ '--ds-grid-min': minWidth } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function PanelNote({
  title,
  children,
  meta,
}: {
  title: string;
  children: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="ds-panel-note">
      <div className="ds-panel-note-header">
        <div className="ds-title-inline">{title}</div>
        {meta}
      </div>
      <div className="ds-body-quiet">{children}</div>
    </div>
  );
}

export function ActionCard({
  title,
  description,
  meta,
  children,
}: {
  title: string;
  description: string;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="ds-action-card">
      <div className="ds-action-card-header">
        <div>
          <div className="ds-title-inline">{title}</div>
          <p className="ds-body-quiet">{description}</p>
        </div>
        {meta}
      </div>
      {children}
    </div>
  );
}

export function EmptyStateCard({
  icon,
  title,
  description,
  actions,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="ds-empty-state-card">
      {icon}
      <div className="ds-title-inline">{title}</div>
      <p className="ds-body-quiet">{description}</p>
      {actions}
    </div>
  );
}

export function MetricGrid({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <div className="ds-token-pairs">
      {items.map((item) => (
        <div key={item.label}>
          <div className="ds-meta-label">{item.label}</div>
          <div className="ds-meta-value">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

interface ModalDialogProps {
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
