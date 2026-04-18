import React from 'react';
import { X } from 'lucide-react';

import {
  CHROME_GHOST_ICON_BUTTON_CLASS,
  CHROME_PANEL_HEADER_CLASS,
  CHROME_TOP_PANEL_HEADER_ROW_CLASS,
} from '@/components/ui/chrome';

interface GlobalInspectorHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  closeButtonClassName?: string;
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
  closeButtonClassName,
  closeIcon,
  closeLabel = 'Close inspector',
  closeTitle,
  actions,
  actionsPlacement = 'bottom',
}) => {
  const resolvedEyebrow = eyebrow === undefined ? 'Inspector' : eyebrow;
  const topActions = actions && actionsPlacement === 'top' ? actions : null;
  const bottomActions = actions && actionsPlacement === 'bottom' ? actions : null;
  const hasTitle =
    title !== null &&
    title !== undefined &&
    !(typeof title === 'string' && title.trim().length === 0);
  const hasHeaderContent = (resolvedEyebrow !== null && resolvedEyebrow !== undefined) || hasTitle;

  return (
    <div className={CHROME_PANEL_HEADER_CLASS}>
      {topActions ? (
        <div
          className={
            hasHeaderContent
              ? 'osint-shell-divider-bottom mb-2 pb-2'
              : ''
          }
        >
          {topActions}
        </div>
      ) : null}

      <div className={`${CHROME_TOP_PANEL_HEADER_ROW_CLASS} gap-2.5`}>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {icon ? <div className="shrink-0 text-[color:var(--osint-text-strong)]">{icon}</div> : null}
          <div className="min-w-0 flex-1">
            {resolvedEyebrow ? (
              <div className="min-w-0 osint-eyebrow">{resolvedEyebrow}</div>
            ) : null}
            {hasTitle ? (
              <div
                className={`min-w-0 truncate whitespace-nowrap osint-panel-title ${
                  resolvedEyebrow ? 'mt-1' : ''
                }`}
              >
                {title}
              </div>
            ) : null}
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className={`${closeButtonClassName || CHROME_GHOST_ICON_BUTTON_CLASS} shrink-0`}
            aria-label={closeLabel}
            title={closeTitle || closeLabel}
          >
            {closeIcon || <X className="h-5 w-5" />}
          </button>
        ) : null}
      </div>

      {bottomActions ? <div className="mt-2">{bottomActions}</div> : null}
    </div>
  );
};
