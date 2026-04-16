import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId } from 'react';

import { Eyebrow } from '../typography';
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
  showActionsWhenOpenOnly?: boolean;
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
  showActionsWhenOpenOnly = false,
  variant = 'default',
  icon,
}: AccordionSectionProps) {
  const bodyId = useId();
  const visibleActions = !actions || !showActionsWhenOpenOnly || isOpen ? actions : null;

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
      <div className={cx('ds-accordion-header', Boolean(visibleActions) && 'ds-has-actions')}>
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
            {meta ? <Eyebrow>{meta}</Eyebrow> : null}
            {variant === 'nested' && (isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />)}
          </span>
        </button>
        {visibleActions ? <div className="ds-accordion-actions">{visibleActions}</div> : null}
      </div>
      {isOpen ? (
        <div className="ds-accordion-body" id={bodyId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
