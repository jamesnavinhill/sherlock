import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { FolderOpen } from 'lucide-react';

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
  panelClassName?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  className = '',
  panelClassName = '',
}) => {
  const ActionIcon = action?.icon;

  return (
    <div className={`osint-empty-state-shell ${className}`.trim()}>
      <div className={`osint-empty-state-panel ${panelClassName}`.trim()}>
        <Icon className="osint-empty-state-icon" />
        <h2 className="osint-empty-state-title">{title}</h2>
        <p className="osint-empty-state-description">{description}</p>
        {action && (
          <div className="osint-empty-state-action">
            <button
              type="button"
              onClick={action.onClick}
              className="osint-button-primary inline-flex items-center"
            >
              {ActionIcon ? <ActionIcon className="h-4 w-4" /> : null}
              {action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
