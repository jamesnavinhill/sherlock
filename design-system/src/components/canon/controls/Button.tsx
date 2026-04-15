import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cx } from '../utils/cx';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'toolbar'
  | 'danger'
  | 'icon';

export type ButtonSize = 'sm' | 'md';

const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'ds-primary-button',
  secondary: 'ds-secondary-button',
  ghost: 'ds-ghost-button',
  toolbar: 'ds-toolbar-button',
  danger: 'ds-danger-button',
  icon: 'ds-toolbar-icon-button',
};

const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'ds-button-sm',
  md: '',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        BUTTON_VARIANT_CLASS[variant],
        BUTTON_SIZE_CLASS[size],
        fullWidth && 'ds-button-block',
        className
      )}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
