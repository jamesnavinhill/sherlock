import React from 'react';
import { User, Building2, HelpCircle } from 'lucide-react';
import { getEntityToneClass } from '../../utils/entityPalette';

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
 * Colors derive from the active accent palette for cohesion.
 */
export const EntityBadge: React.FC<EntityBadgeProps> = ({
  name,
  type = 'UNKNOWN',
  onClick,
  className = '',
  compact = false,
}) => {
  const typeConfig = {
    PERSON: {
      icon: User,
      prefix: '[P]',
    },
    ORGANIZATION: {
      icon: Building2,
      prefix: '[O]',
    },
    UNKNOWN: {
      icon: HelpCircle,
      prefix: '[?]',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;
  const toneClass = getEntityToneClass(type);

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`osint-entity-chip text-left p-2 text-[10px] font-mono text-zinc-400 truncate ${className}`}
        title={name}
      >
        <span className={`${toneClass} entity-tone-text font-bold mr-1`}>{config.prefix}</span>
        {name}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-sm border transition-colors
                ${toneClass} entity-tone-chip osint-entity-chip
                text-xs font-mono ${className}`}
      title={name}
    >
      <Icon className={`w-4 h-4 ${toneClass} entity-tone-text`} />
      <span className="text-zinc-300 truncate">{name}</span>
    </button>
  );
};
