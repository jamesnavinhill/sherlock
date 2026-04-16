import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { IconButton } from '../controls/IconButton';
import { Eyebrow, Heading, Text } from '../typography';
import { cx } from '../utils/cx';

export interface DockPanelProps {
  placement: 'left' | 'right';
  open: boolean;
  mobileOpen?: boolean;
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  headerActions?: ReactNode;
  topBar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  closeLabel?: string;
  onClose?: () => void;
}

export function DockPanel({
  placement,
  open,
  mobileOpen = false,
  eyebrow,
  title,
  subtitle,
  headerActions,
  topBar,
  footer,
  children,
  className,
  bodyClassName,
  closeLabel = 'Close panel',
  onClose,
}: DockPanelProps) {
  return (
    <aside
      className={cx(
        'ds-dock-panel',
        placement === 'right' ? 'ds-right-dock-panel' : 'ds-left-dock-panel',
        className
      )}
      data-placement={placement}
      data-open={open ? 'true' : 'false'}
      data-mobile-open={mobileOpen ? 'true' : 'false'}
    >
      <div className="ds-dock-panel-header">
        <div className="ds-dock-panel-header-top ds-shell-header-surface">
          <div className="ds-dock-panel-header-copy">
            {eyebrow ? <Eyebrow as="div">{eyebrow}</Eyebrow> : null}
            <Heading level="panel">{title}</Heading>
            {subtitle ? <Text variant="quiet">{subtitle}</Text> : null}
          </div>
          <div className="ds-dock-panel-header-controls">
            {headerActions}
            {onClose ? (
              <IconButton
                appearance="ghost"
                label={closeLabel}
                icon={<X size={16} />}
                onClick={onClose}
              />
            ) : null}
          </div>
        </div>
        {topBar ? <div className="ds-dock-panel-topbar">{topBar}</div> : null}
      </div>
      <div className={cx('ds-dock-panel-body', bodyClassName)}>{children}</div>
      {footer ? <div className="ds-dock-panel-footer">{footer}</div> : null}
    </aside>
  );
}
