import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../utils/cx';

export interface CodeBlockProps extends HTMLAttributes<HTMLPreElement> {
  children: ReactNode;
  codeClassName?: string;
  maxHeight?: string;
}

export function CodeBlock({
  children,
  className,
  codeClassName,
  maxHeight,
  style,
  ...props
}: CodeBlockProps) {
  return (
    <pre
      className={cx('ds-code-block', className)}
      style={maxHeight ? { ...style, maxHeight } : style}
      {...props}
    >
      <code className={codeClassName}>{children}</code>
    </pre>
  );
}
