import type { ReactNode } from 'react';

import { Eyebrow, Heading } from '../typography';
import { cx } from '../utils/cx';

export interface SurfaceCardProps {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function SurfaceCard({
  title,
  eyebrow,
  children,
  className,
  actions,
}: SurfaceCardProps) {
  return (
    <section className={cx('ds-card', className)}>
      <header className="ds-card-header">
        <div className="ds-card-header-copy">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <Heading level="card">{title}</Heading>
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
