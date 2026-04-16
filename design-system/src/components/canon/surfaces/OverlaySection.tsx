import type { ReactNode } from 'react';

import { Heading, Text } from '../typography';
import { cx } from '../utils/cx';

export interface OverlaySectionProps {
  title: string;
  children: ReactNode;
  description?: string;
  meta?: ReactNode;
  className?: string;
  tone?: 'default' | 'accent' | 'subtle';
}

export function OverlaySection({
  title,
  children,
  description,
  meta,
  className,
  tone = 'default',
}: OverlaySectionProps) {
  return (
    <section className={cx('ds-overlay-section', className)} data-tone={tone}>
      <header className="ds-overlay-section-header">
        <div className="ds-overlay-section-copy">
          <Heading level="inline">{title}</Heading>
          {description ? <Text variant="quiet">{description}</Text> : null}
        </div>
        {meta ? <div className="ds-overlay-section-meta">{meta}</div> : null}
      </header>

      <div className="ds-overlay-section-body">{children}</div>
    </section>
  );
}
