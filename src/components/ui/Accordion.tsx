import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AccordionProps {
  title: React.ReactNode;
  count?: number;
  icon?: LucideIcon;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  chevronClassName?: string;
  contentClassName?: string;
  variant?: 'section' | 'nested';
}

/**
 * Reusable accordion component for collapsible sections
 * Matches the existing design patterns in dossier panels
 */
export const Accordion: React.FC<AccordionProps> = ({
  title,
  count,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  className = '',
  headerClassName = '',
  chevronClassName = '',
  contentClassName = '',
  variant = 'section',
}) => {
  const wrapperClassName =
    variant === 'nested'
      ? `osint-raised-surface-section mb-2 ${className}`
      : `osint-raised-surface-section mb-2 ${className}`;
  const headerBaseClassName =
    variant === 'nested'
      ? 'osint-rail-item-trigger osint-meta-label-strong flex min-h-[34px] w-full items-center justify-between gap-3 px-2.5 py-1.5 text-left text-[11px] text-zinc-300'
      : 'osint-rail-section-trigger osint-meta-label-strong flex min-h-[44px] w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-zinc-300';
  const contentBaseClassName =
    variant === 'nested'
      ? 'border-t border-zinc-800/70 p-1.5'
      : 'border-t border-zinc-800/80 p-2';

  return (
    <div className={wrapperClassName}>
      <button
        type="button"
        onClick={onToggle}
        className={`${headerBaseClassName} ${headerClassName}`}
        data-active={variant === 'section' && isOpen ? 'true' : undefined}
      >
        <span className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className="w-4 h-4 mr-2 text-zinc-500" />}
          <span className="min-w-0 truncate">{title}</span>
          {typeof count === 'number' ? (
            <span className="shrink-0 osint-meta-label text-zinc-500">
              {count}
            </span>
          ) : null}
        </span>
        {isOpen ? (
          <ChevronDown className={`w-4 h-4 ${chevronClassName}`} />
        ) : (
          <ChevronRight className={`w-4 h-4 ${chevronClassName}`} />
        )}
      </button>
      {isOpen && <div className={`${contentBaseClassName} ${contentClassName}`}>{children}</div>}
    </div>
  );
};
