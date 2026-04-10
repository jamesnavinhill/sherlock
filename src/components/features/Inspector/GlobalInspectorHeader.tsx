import React from 'react';
import { X } from 'lucide-react';

import { CHROME_GHOST_ICON_BUTTON_CLASS, CHROME_PANEL_HEADER_CLASS } from '@/components/ui/chrome';

interface GlobalInspectorHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  closeIcon?: React.ReactNode;
  closeLabel?: string;
  closeTitle?: string;
  actions?: React.ReactNode;
  actionsPlacement?: 'top' | 'bottom';
}

export const GlobalInspectorHeader: React.FC<GlobalInspectorHeaderProps> = ({
  eyebrow,
  title,
  icon,
  onClose,
  closeIcon,
  closeLabel = 'Close inspector',
  closeTitle,
  actions,
  actionsPlacement = 'bottom',
}) => {
  const resolvedEyebrow = eyebrow === undefined ? 'Inspector' : eyebrow;
  const topActions = actions && actionsPlacement === 'top' ? actions : null;
  const bottomActions = actions && actionsPlacement === 'bottom' ? actions : null;

  return (
    <div className={`${CHROME_PANEL_HEADER_CLASS} flex items-start justify-between gap-2.5`}>
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        {icon ? <div className="shrink-0 text-zinc-300">{icon}</div> : null}
        <div className="min-w-0 flex-1">
          {topActions ? (
            <div className="mb-2 border-b border-zinc-800 pb-2">{topActions}</div>
          ) : null}
          {resolvedEyebrow ? (
            <div className="min-w-0 osint-eyebrow">{resolvedEyebrow}</div>
          ) : null}
          <div className={`min-w-0 truncate whitespace-nowrap osint-panel-title ${resolvedEyebrow ? 'mt-1' : ''}`}>
            {title}
          </div>
          {bottomActions ? <div className="mt-2">{bottomActions}</div> : null}
        </div>
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className={`${CHROME_GHOST_ICON_BUTTON_CLASS} shrink-0`}
          aria-label={closeLabel}
          title={closeTitle || closeLabel}
        >
          {closeIcon || <X className="h-5 w-5" />}
        </button>
      ) : null}
    </div>
  );
};
