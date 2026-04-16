import type { ReactNode } from 'react';

import { Heading, Text } from '../typography';
import { cx } from '../utils/cx';

export interface ContentSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  meta?: ReactNode;
  className?: string;
}

export function ContentSection({
  children,
  title,
  description,
  meta,
  className,
}: ContentSectionProps) {
  const hasHeader = Boolean(title || description || meta);

  return (
    <section className={cx('ds-content-section', className)}>
      {hasHeader ? (
        <header className="ds-content-section-header">
          <div className="ds-content-section-copy">
            {title ? <Heading level="inline">{title}</Heading> : null}
            {description ? <Text variant="quiet">{description}</Text> : null}
          </div>
          {meta ? <div className="ds-content-section-meta">{meta}</div> : null}
        </header>
      ) : null}

      <div className="ds-content-section-body">{children}</div>
    </section>
  );
}
