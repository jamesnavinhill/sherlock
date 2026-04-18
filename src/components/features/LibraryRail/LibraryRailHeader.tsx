import React from 'react';

import {
  CHROME_PANEL_HEADER_CLASS,
  CHROME_TOP_PANEL_HEADER_ROW_CLASS,
} from '@/components/ui/chrome';

interface LibraryRailHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  summary?: React.ReactNode;
  actions?: React.ReactNode;
  actionsPlacement?: 'top' | 'bottom';
  search?: React.ReactNode;
}

export const LibraryRailHeader: React.FC<LibraryRailHeaderProps> = ({
  eyebrow = 'Library',
  title,
  subtitle,
  summary,
  actions,
  actionsPlacement = 'bottom',
  search,
}) => (
  <div className={CHROME_PANEL_HEADER_CLASS}>
    <div className={CHROME_TOP_PANEL_HEADER_ROW_CLASS}>
      <div className="min-w-0">
        <div className="min-w-0 osint-eyebrow">{eyebrow}</div>
        <div className="mt-1 min-w-0 truncate whitespace-nowrap osint-panel-title">
          {title}
        </div>
      </div>
      {actions && actionsPlacement === 'top' ? <div className="shrink-0">{actions}</div> : null}
    </div>
    {subtitle ? <div className="mt-2 osint-body-quiet">{subtitle}</div> : null}
    {summary ? <div className="mt-3">{summary}</div> : null}
    {search ? <div className="mt-4">{search}</div> : null}
  </div>
);
