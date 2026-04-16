import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cx } from '../utils/cx';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'toolbar'
  | 'danger'
  | 'icon';

export type ButtonSize = 'compact' | 'sm' | 'md';
export type ButtonTextStyle = 'action' | 'body';

const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'ds-primary-button',
  secondary: 'ds-secondary-button',
  ghost: 'ds-ghost-button',
  toolbar: 'ds-toolbar-button',
  danger: 'ds-danger-button',
  icon: 'ds-toolbar-icon-button',
};

const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
  compact: 'ds-button-compact',
  sm: 'ds-button-sm',
  md: '',
};

const BUTTON_TEXT_STYLE_CLASS: Record<ButtonTextStyle, string> = {
  action: '',
  body: 'ds-button-text-body',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  textStyle?: ButtonTextStyle;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  textStyle = 'action',
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const hasVisibleLabel = !(
    children === undefined ||
    children === null ||
    children === false ||
    children === ''
  );
  const ghostIconOnly = variant === 'ghost' && !hasVisibleLabel && Boolean(leadingIcon || trailingIcon);

  return (
    <button
      type={type}
      className={cx(
        BUTTON_VARIANT_CLASS[variant],
        BUTTON_SIZE_CLASS[size],
        BUTTON_TEXT_STYLE_CLASS[textStyle],
        ghostIconOnly && 'ds-ghost-button-icon-only',
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
