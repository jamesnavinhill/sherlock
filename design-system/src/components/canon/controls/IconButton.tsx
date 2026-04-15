import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cx } from '../utils/cx';

type IconButtonAppearance = 'toolbar' | 'page';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  active?: boolean;
  appearance?: IconButtonAppearance;
}

export function IconButton({
  label,
  icon,
  active = false,
  appearance = 'toolbar',
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
      className={cx(
        appearance === 'page' ? 'ds-page-icon-button' : 'ds-toolbar-icon-button',
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
