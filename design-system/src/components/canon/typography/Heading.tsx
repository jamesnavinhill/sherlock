import type { ElementType, HTMLAttributes, ReactNode } from 'react';

import { cx } from '../utils/cx';

export type HeadingLevel = 'page' | 'display' | 'section' | 'panel' | 'card' | 'inline';

const HEADING_CLASS: Record<HeadingLevel, string> = {
  page: 'ds-title-page',
  display: 'ds-title-display',
  section: 'ds-title-section',
  panel: 'ds-panel-title',
  card: 'ds-title-card',
  inline: 'ds-title-inline',
};

const DEFAULT_HEADING_ELEMENT: Record<HeadingLevel, ElementType> = {
  page: 'h1',
  display: 'h2',
  section: 'h2',
  panel: 'h2',
  card: 'h3',
  inline: 'div',
};

export interface HeadingProps extends HTMLAttributes<HTMLElement> {
  level: HeadingLevel;
  as?: ElementType;
  children: ReactNode;
}

export function Heading({
  level,
  as,
  className,
  children,
  ...props
}: HeadingProps) {
  const Component = as ?? DEFAULT_HEADING_ELEMENT[level];

  return (
    <Component className={cx(HEADING_CLASS[level], className)} {...props}>
      {children}
    </Component>
  );
}
