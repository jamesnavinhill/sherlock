import React from 'react';

import { CHROME_RAIL_BODY_CLASS } from '@/components/ui/chrome';
import { LibraryRailHeader } from './LibraryRailHeader';

interface LibraryRailShellProps {
  isOpen: boolean;
  title: React.ReactNode;
  eyebrow?: string;
  subtitle?: React.ReactNode;
  summary?: React.ReactNode;
  actions?: React.ReactNode;
  search?: React.ReactNode;
  children: React.ReactNode;
  widthClassName?: string;
  className?: string;
}

export const LibraryRailShell: React.FC<LibraryRailShellProps> = ({
  isOpen,
  title,
  eyebrow,
  subtitle,
  summary,
  actions,
  search,
  children,
  widthClassName = 'w-[min(20rem,calc(100vw-1rem))]',
  className = '',
}) => (
  <aside
    className={`osint-panel-shell absolute left-0 top-0 z-30 flex h-full flex-col overflow-hidden border-r border-zinc-800 bg-black/95 transition-all duration-200 lg:relative lg:translate-x-0 ${
      isOpen
        ? `${widthClassName} translate-x-0`
        : `${widthClassName} -translate-x-full lg:w-0 lg:border-r-0`
    } ${className}`}
  >
    <LibraryRailHeader
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      summary={summary}
      actions={actions}
      search={search}
    />
    <div className={CHROME_RAIL_BODY_CLASS}>{children}</div>
  </aside>
);
