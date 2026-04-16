import type { ElementType, HTMLAttributes, ReactNode } from 'react';

import { cx } from '../utils/cx';

export type TextVariant = 'body' | 'quiet';

const TEXT_CLASS: Record<TextVariant, string> = {
  body: 'ds-body-copy',
  quiet: 'ds-body-quiet',
};

const DEFAULT_TEXT_ELEMENT: Record<TextVariant, ElementType> = {
  body: 'p',
  quiet: 'p',
};

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  as?: ElementType;
  children: ReactNode;
}

export function Text({
  variant = 'body',
  as,
  className,
  children,
  ...props
}: TextProps) {
  const Component = as ?? DEFAULT_TEXT_ELEMENT[variant];

  return (
    <Component className={cx(TEXT_CLASS[variant], className)} {...props}>
      {children}
    </Component>
  );
}
