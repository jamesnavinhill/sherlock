import React from 'react';
import { User, Building2, HelpCircle } from 'lucide-react';

type EntityType = 'PERSON' | 'ORGANIZATION' | 'UNKNOWN';

interface EntityBadgeProps {
    name: string;
    type?: EntityType;
    onClick?: () => void;
    className?: string;
    compact?: boolean;
}

/**
 * Entity badge component with type-based styling
 * Color-coded: PERSON (blue), ORGANIZATION (purple), UNKNOWN (gray)
 */
export const EntityBadge: React.FC<EntityBadgeProps> = ({
    name,
    type = 'UNKNOWN',
    onClick,
    className = '',
    compact = false
}) => {
    const typeConfig = {
        PERSON: {
            icon: User,
            prefix: '[P]',
            textColor: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/30'
        },
        ORGANIZATION: {
            icon: Building2,
            prefix: '[O]',
            textColor: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/30'
        },
        UNKNOWN: {
            icon: HelpCircle,
            prefix: '[?]',
            textColor: 'text-zinc-500',
            bgColor: 'bg-zinc-500/10',
            borderColor: 'border-zinc-500/30'
        }
    };

    const config = typeConfig[type];
    const Icon = config.icon;

    if (compact) {
        return (
            <button
                onClick={onClick}
                className={`text-left p-2 bg-zinc-900/30 hover:bg-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 truncate ${className}`}
                title={name}
            >
                <span className={`${config.textColor} font-bold mr-1`}>{config.prefix}</span>
                {name}
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-sm border transition-colors
                ${config.bgColor} ${config.borderColor} hover:bg-zinc-800 hover:border-zinc-600
                text-xs font-mono ${className}`}
            title={name}
        >
            <Icon className={`w-4 h-4 ${config.textColor}`} />
            <span className="text-zinc-300 truncate">{name}</span>
        </button>
    );
};
