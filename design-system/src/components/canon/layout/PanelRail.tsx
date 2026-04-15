import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '../controls/Button';
import { cx } from '../utils/cx';

export interface PanelRailProps {
  placement: 'left' | 'right';
  pinnedOpen: boolean;
  mobileOpen?: boolean;
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  onCloseMobile?: () => void;
}

export function PanelRail({
  placement,
  pinnedOpen,
  mobileOpen = false,
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  footer,
  className,
  onCloseMobile,
}: PanelRailProps) {
  return (
    <aside
      className={cx(
        'ds-rail',
        placement === 'right' ? 'ds-right-rail' : 'ds-left-rail',
        className
      )}
      data-placement={placement}
      data-pinned-open={pinnedOpen ? 'true' : 'false'}
      data-mobile-open={mobileOpen ? 'true' : 'false'}
    >
      <div className="ds-rail-header">
        <div className="ds-rail-header-copy">
          <div className="ds-meta-label">{eyebrow}</div>
          <h2 className="ds-panel-title">{title}</h2>
          {subtitle ? <p className="ds-body-quiet">{subtitle}</p> : null}
        </div>
        <div className="ds-rail-header-actions">
          {actions}
          {onCloseMobile ? (
            <Button
              variant="ghost"
              size="sm"
              className="ds-rail-close"
              leadingIcon={<X size={14} />}
              onClick={onCloseMobile}
            >
              Close
            </Button>
          ) : null}
        </div>
      </div>
      <div className="ds-rail-body">{children}</div>
      {footer ? <div className="ds-rail-footer">{footer}</div> : null}
    </aside>
  );
}
