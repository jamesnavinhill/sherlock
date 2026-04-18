import React from 'react';

import { CHROME_RAIL_BODY_CLASS } from '@/components/ui/chrome';
import { DockPanel } from '@/components/system/layout/DockPanel';
import { LibraryRailHeader } from './LibraryRailHeader';

interface LibraryRailShellProps {
  isOpen: boolean;
  placement?: 'left' | 'right';
  title: React.ReactNode;
  eyebrow?: string;
  subtitle?: React.ReactNode;
  summary?: React.ReactNode;
  actions?: React.ReactNode;
  actionsPlacement?: 'top' | 'bottom';
  search?: React.ReactNode;
  children: React.ReactNode;
  widthClassName?: string;
  widthValue?: string;
  overlayOnDesktop?: boolean;
  className?: string;
}

export const LibraryRailShell: React.FC<LibraryRailShellProps> = ({
  isOpen,
  placement = 'left',
  title,
  eyebrow,
  subtitle,
  summary,
  actions,
  actionsPlacement,
  search,
  children,
  widthClassName = 'w-[var(--osint-dock-width)]',
  widthValue = 'min(var(--osint-shell-rail-width),calc(100vw - 1rem))',
  overlayOnDesktop = false,
  className = '',
}) => (
  <DockPanel
    isOpen={isOpen}
    placement={placement}
    widthClassName={widthClassName}
    widthValue={widthValue}
    overlayOnDesktop={overlayOnDesktop}
    className={className}
  >
    <LibraryRailHeader
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      summary={summary}
      actions={actions}
      actionsPlacement={actionsPlacement}
      search={search}
    />
    <div className={CHROME_RAIL_BODY_CLASS}>{children}</div>
  </DockPanel>
);
