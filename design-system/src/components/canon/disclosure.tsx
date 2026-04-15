import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId, useState } from 'react';

import { cx } from './controls';

interface AccordionProps {
  title: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  meta?: ReactNode;
  className?: string;
  compact?: boolean;
  actions?: ReactNode;
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
}: AccordionProps) {
  const bodyId = useId();

  return (
    <section className={cx('ds-accordion', compact && 'ds-accordion-compact', className)}>
      <button
        type="button"
        className="ds-accordion-trigger"
        aria-expanded={isOpen}
        aria-controls={bodyId}
        onClick={onToggle}
      >
        <span className="ds-accordion-leading">
          {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          <span>{title}</span>
        </span>
        <span className="ds-accordion-trailing">
          {meta ? <span className="ds-meta-label">{meta}</span> : null}
          {actions}
        </span>
      </button>
      {isOpen ? (
        <div className="ds-accordion-body" id={bodyId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function useExclusiveDisclosure<T extends string>(initialOpen: T | null) {
  const [openId, setOpenId] = useState<T | null>(initialOpen);

  return {
    openId,
    isOpen: (id: T) => openId === id,
    toggle: (id: T) => setOpenId((current) => (current === id ? null : id)),
    setOpenId,
  };
}

export function useDisclosureSet<T extends string>(initialOpen: T[] = []) {
  const [openItems, setOpenItems] = useState<T[]>(initialOpen);

  return {
    openItems,
    isOpen: (id: T) => openItems.includes(id),
    toggle: (id: T) =>
      setOpenItems((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      ),
    setOpenItems,
  };
}
