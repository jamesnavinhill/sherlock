import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cx } from '../utils/cx';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  active?: boolean;
}

export function IconButton({
  label,
  icon,
  active = false,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      data-active={active ? 'true' : undefined}
      className={cx('ds-toolbar-icon-button', className)}
      {...props}
    >
      {icon}
    </button>
  );
}
