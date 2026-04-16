import type { ReactNode } from 'react';

import { cx } from '../utils/cx';

export interface ToolbarBarProps {
  leading: ReactNode;
  center?: ReactNode;
  trailing?: ReactNode;
}

export function ToolbarBar({ leading, center, trailing }: ToolbarBarProps) {
  return (
    <header className="ds-toolbar ds-shell-header-surface">
      <div className="ds-toolbar-group">{leading}</div>
      <div className="ds-toolbar-search">{center}</div>
      <div className="ds-toolbar-group ds-toolbar-group-end">{trailing}</div>
    </header>
  );
}

export interface ToolbarClusterProps {
  children: ReactNode;
  className?: string;
}

export function ToolbarCluster({ children, className }: ToolbarClusterProps) {
  return <div className={cx('ds-toolbar-inline', className)}>{children}</div>;
}
