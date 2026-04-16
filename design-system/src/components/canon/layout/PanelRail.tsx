import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { IconButton } from '../controls/IconButton';
import { Eyebrow, Heading, Text } from '../typography';
import { cx } from '../utils/cx';

export interface PanelRailProps {
  placement: 'left' | 'right';
  pinnedOpen: boolean;
  mobileOpen?: boolean;
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  headerActions?: ReactNode;
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
  headerActions,
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
        <div className="ds-rail-header-top ds-shell-header-surface">
          <div className="ds-rail-header-copy">
            <Eyebrow as="div">{eyebrow}</Eyebrow>
            <Heading level="panel">{title}</Heading>
            {subtitle ? <Text variant="quiet">{subtitle}</Text> : null}
          </div>
          <div className="ds-rail-header-controls">
            {headerActions}
            {onCloseMobile ? (
              <IconButton
                appearance="ghost"
                label="Close rail"
                className="ds-rail-close"
                icon={<X size={16} />}
                onClick={onCloseMobile}
              />
            ) : null}
          </div>
        </div>
        {actions ? <div className="ds-rail-header-actions">{actions}</div> : null}
      </div>
      <div className="ds-rail-body">{children}</div>
      {footer ? <div className="ds-rail-footer">{footer}</div> : null}
    </aside>
  );
}
