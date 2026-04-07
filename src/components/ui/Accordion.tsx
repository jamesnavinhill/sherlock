import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AccordionProps {
  title: string;
  count?: number;
  icon?: LucideIcon;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  chevronClassName?: string;
  contentClassName?: string;
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
}) => {
  return (
    <div className={`mb-2 border border-zinc-800 bg-black/90 ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`font-osint-label flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:bg-zinc-800/90 ${headerClassName}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className="w-4 h-4 mr-2 text-zinc-500" />}
          <span className="truncate">{title}</span>
          {typeof count === 'number' ? (
            <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] tracking-normal text-zinc-500">
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
      {isOpen && <div className={`border-t border-zinc-800/80 p-2 ${contentClassName}`}>{children}</div>}
    </div>
  );
};
