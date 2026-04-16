import type { ElementType, HTMLAttributes, ReactNode } from 'react';

import { cx } from '../utils/cx';

export interface EyebrowProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
}

export function Eyebrow({ as, className, children, ...props }: EyebrowProps) {
  const Component = as ?? 'span';

  return (
    <Component className={cx('ds-meta-label', className)} {...props}>
      {children}
    </Component>
  );
}
