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
    className = ''
}) => {
    return (
        <div className={`mb-2 border border-zinc-800 bg-black ${className}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-3 bg-zinc-900/50 hover:bg-zinc-800 text-xs font-mono uppercase font-bold text-zinc-300 transition-colors"
            >
                <span className="flex items-center">
                    {Icon && <Icon className="w-4 h-4 mr-2 text-zinc-500" />}
                    {title}
                    {typeof count === 'number' && ` (${count})`}
                </span>
                {isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                ) : (
                    <ChevronRight className="w-4 h-4" />
                )}
            </button>
            {isOpen && (
                <div className="p-2">
                    {children}
                </div>
            )}
        </div>
    );
};
