import React from 'react';
import { LucideIcon, FolderOpen, Plus } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    className?: string;
}

/**
 * Reusable empty state component for when no data is available
 * Used across Archives, Operation View, Network Graph, etc.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon = FolderOpen,
    title,
    description,
    action,
    className = ''
}) => {
    const ActionIcon = action?.icon || Plus;

    return (
        <div className={`flex flex-col items-center justify-center py-16 px-8 ${className}`}>
            <Icon className="w-16 h-16 text-zinc-700 mb-6" />
            <h2 className="text-xl text-white font-bold mb-2 font-mono uppercase tracking-wider">
                {title}
            </h2>
            <p className="text-zinc-500 font-mono text-sm mb-8 text-center max-w-md">
                {description}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="flex items-center px-6 py-3 bg-osint-primary text-black font-bold font-mono text-sm uppercase hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_-5px_var(--osint-primary)]"
                >
                    <ActionIcon className="w-5 h-5 mr-2" />
                    {action.label}
                </button>
            )}
        </div>
    );
};
