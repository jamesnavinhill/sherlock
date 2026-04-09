import React from 'react';
import { X } from 'lucide-react';

import { CHROME_PANEL_HEADER_CLASS } from '@/components/ui/chrome';

interface GlobalInspectorHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  actions?: React.ReactNode;
}

export const GlobalInspectorHeader: React.FC<GlobalInspectorHeaderProps> = ({
  eyebrow = 'Inspector',
  title,
  subtitle,
  icon,
  onClose,
  actions,
}) => (
  <div className={`${CHROME_PANEL_HEADER_CLASS} flex items-start justify-between gap-3`}>
    <div className="flex min-w-0 flex-1 items-start gap-3">
      {icon ? <div className="shrink-0">{icon}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="osint-eyebrow">{eyebrow}</div>
        <div className="mt-1 min-w-0 osint-panel-title">{title}</div>
        {subtitle ? <div className="mt-2 osint-meta-label">{subtitle}</div> : null}
        {actions ? <div className="mt-3">{actions}</div> : null}
      </div>
    </div>
    {onClose ? (
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 text-zinc-500 transition-colors hover:text-white"
        aria-label="Close inspector"
      >
        <X className="h-5 w-5" />
      </button>
    ) : null}
  </div>
);
