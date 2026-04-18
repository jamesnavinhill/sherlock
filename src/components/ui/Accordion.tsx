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
  disableActiveHeaderStyle?: boolean;
  variant?: 'section' | 'nested';
  actions?: React.ReactNode;
  showActionsWhenOpenOnly?: boolean;
  actionsClassName?: string;
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
  disableActiveHeaderStyle = false,
  variant = 'section',
  actions,
  showActionsWhenOpenOnly = false,
  actionsClassName = '',
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
  const visibleActions = !actions || !showActionsWhenOpenOnly || isOpen ? actions : null;

  return (
    <div className={wrapperClassName}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className={`${headerBaseClassName} ${headerClassName} ${visibleActions ? 'flex-1' : ''}`}
          data-active={
            variant === 'section' && isOpen && !disableActiveHeaderStyle ? 'true' : undefined
          }
        >
          <span className="flex min-w-0 items-center gap-2">
            {Icon && <Icon className="mr-2 h-4 w-4 text-zinc-500" />}
            <span className="min-w-0 truncate">{title}</span>
            {typeof count === 'number' ? (
              <span className="shrink-0 osint-meta-label text-zinc-500">{count}</span>
            ) : null}
          </span>
          {isOpen ? (
            <ChevronDown className={`h-4 w-4 ${chevronClassName}`} />
          ) : (
            <ChevronRight className={`h-4 w-4 ${chevronClassName}`} />
          )}
        </button>
        {visibleActions ? (
          <div
            className={`shrink-0 pr-2 ${actionsClassName}`}
            onClick={(event) => event.stopPropagation()}
          >
            {visibleActions}
          </div>
        ) : null}
      </div>
      {isOpen && <div className={`${contentBaseClassName} ${contentClassName}`}>{children}</div>}
    </div>
  );
};
