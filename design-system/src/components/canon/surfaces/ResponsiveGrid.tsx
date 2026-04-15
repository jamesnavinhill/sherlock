import type { CSSProperties, ReactNode } from 'react';

import { cx } from '../utils/cx';

export interface ResponsiveGridProps {
  children: ReactNode;
  minWidth?: string;
  className?: string;
}

export function ResponsiveGrid({
  children,
  minWidth = '18rem',
  className,
}: ResponsiveGridProps) {
  return (
    <div
      className={cx('ds-responsive-grid', className)}
      style={{ '--ds-grid-min': minWidth } as CSSProperties}
    >
      {children}
    </div>
  );
}
