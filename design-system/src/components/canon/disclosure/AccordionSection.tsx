import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId } from 'react';

import { cx } from '../utils/cx';

export interface AccordionSectionProps {
  title: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  meta?: ReactNode;
  className?: string;
  compact?: boolean;
  actions?: ReactNode;
  variant?: 'default' | 'nested';
  icon?: ReactNode;
}

export function AccordionSection({
  title,
  isOpen,
  onToggle,
  children,
  meta,
  className,
  compact = false,
  actions,
  variant = 'default',
  icon,
}: AccordionSectionProps) {
  const bodyId = useId();

  return (
    <section
      className={cx(
        'ds-accordion',
        compact && 'ds-accordion-compact',
        variant === 'nested' && 'ds-accordion-nested',
        className
      )}
      data-open={isOpen ? 'true' : 'false'}
    >
    <div className={cx('ds-accordion-header', Boolean(actions) && 'ds-has-actions')}>
      <button
        type="button"
        className="ds-accordion-trigger"
        aria-expanded={isOpen}
        aria-controls={bodyId}
        onClick={onToggle}
      >
        <span className="ds-accordion-leading">
          {variant !== 'nested' && (isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />)}
          {icon && <span className="ds-accordion-icon">{icon}</span>}
          <span className="ds-accordion-title">{title}</span>
        </span>
        <span className="ds-accordion-trailing">
          {meta ? <span className="ds-meta-label">{meta}</span> : null}
          {variant === 'nested' && (isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />)}
        </span>
      </button>
      {actions && <div className="ds-accordion-actions">{actions}</div>}
    </div>
      {isOpen ? (
        <div className="ds-accordion-body" id={bodyId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
