import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cx } from '../utils/cx';

export interface SidebarActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: ReactNode;
  icon: ReactNode;
}

export function SidebarAction({
  label,
  icon,
  className,
  type = 'button',
  ...props
}: SidebarActionProps) {
  return (
    <button type={type} className={cx('ds-sidebar-nav-item', className)} {...props}>
      {icon}
      <span className="ds-sidebar-nav-item-label">{label}</span>
    </button>
  );
}
