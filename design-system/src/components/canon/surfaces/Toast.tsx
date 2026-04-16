import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { IconButton } from '../controls/IconButton';
import { Heading, Text } from '../typography';
import { cx } from '../utils/cx';

export type ToastTone = 'graph-1' | 'graph-2' | 'graph-3' | 'graph-4';

export interface ToastProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  onDismiss?: () => void;
  tone?: ToastTone;
  className?: string;
}

export function Toast({
  title,
  description,
  icon,
  meta,
  actions,
  onDismiss,
  tone = 'graph-1',
  className,
}: ToastProps) {
  return (
    <section
      className={cx('ds-toast', className)}
      data-tone={tone}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="ds-toast-main">
        {icon ? <div className="ds-toast-icon">{icon}</div> : null}
        <div className="ds-toast-copy">
          <div className="ds-toast-copy-row">
            <Heading level="inline" as="span" className="ds-toast-title">
              {title}
            </Heading>
            {meta ? <div className="ds-toast-meta">{meta}</div> : null}
          </div>
          {description ? <Text variant="quiet">{description}</Text> : null}
        </div>
        {onDismiss ? (
          <IconButton
            appearance="ghost"
            label={`Dismiss ${title}`}
            icon={<X size={16} />}
            onClick={onDismiss}
          />
        ) : null}
      </div>
      {actions ? <div className="ds-toast-actions">{actions}</div> : null}
    </section>
  );
}
