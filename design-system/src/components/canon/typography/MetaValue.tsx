import type { ElementType, HTMLAttributes, ReactNode } from 'react';

import { cx } from '../utils/cx';

export interface MetaValueProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
}

export function MetaValue({ as, className, children, ...props }: MetaValueProps) {
  const Component = as ?? 'span';

  return (
    <Component className={cx('ds-meta-value', className)} {...props}>
      {children}
    </Component>
  );
}
