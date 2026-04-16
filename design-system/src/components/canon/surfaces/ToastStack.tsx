import type { ReactNode } from 'react';

import { cx } from '../utils/cx';

export type ToastStackPlacement = 'inline' | 'top-right' | 'bottom-right' | 'bottom-left';

export interface ToastStackProps {
  children: ReactNode;
  placement?: ToastStackPlacement;
  className?: string;
}

export function ToastStack({
  children,
  placement = 'bottom-right',
  className,
}: ToastStackProps) {
  return (
    <div className={cx('ds-toast-stack', `ds-toast-stack-${placement}`, className)}>{children}</div>
  );
}
