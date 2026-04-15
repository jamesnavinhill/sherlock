import type { ReactNode } from 'react';

import { cx } from '../utils/cx';

export type BadgeVariant = 'neutral' | 'accent' | 'outline';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return <span className={cx('ds-badge', `ds-badge-${variant}`, className)}>{children}</span>;
}
