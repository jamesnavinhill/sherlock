import type { ReactNode } from 'react';

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
          {eyebrow ? <span className="ds-meta-label">{eyebrow}</span> : null}
          <h3 className="ds-title-card">{title}</h3>
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
