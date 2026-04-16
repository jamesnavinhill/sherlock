import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cx } from '../utils/cx';

export type IconButtonAppearance = 'toolbar' | 'ghost';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  active?: boolean;
  appearance?: IconButtonAppearance;
  interactive?: boolean;
}

export function IconButton({
  label,
  icon,
  active = false,
  appearance = 'toolbar',
  interactive = true,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  if (!interactive) {
    return (
      <span
        aria-hidden="true"
        className={cx(
          appearance === 'ghost' ? 'ds-ghost-icon-button' : 'ds-toolbar-icon-button',
          className
        )}
      >
        {icon}
      </span>
    );
  }

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      data-active={active ? 'true' : undefined}
      className={cx(
        appearance === 'ghost' ? 'ds-ghost-icon-button' : 'ds-toolbar-icon-button',
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
