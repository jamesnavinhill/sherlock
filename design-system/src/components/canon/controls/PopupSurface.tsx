import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../utils/cx';

export interface PopupSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end';
  children: ReactNode;
}

export function PopupSurface({
  align = 'end',
  className,
  children,
  ...props
}: PopupSurfaceProps) {
  return (
    <div
      className={cx(
        'ds-menu-panel',
        align === 'start' ? 'ds-menu-panel-start' : 'ds-menu-panel-end',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
