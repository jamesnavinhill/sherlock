import React, { useContext } from 'react';

import { AppWorkbenchHost } from '@/app/workbench/AppWorkbenchHost';
import { AppWorkbenchHostContext } from '@/app/workbench/AppWorkbenchContext';

interface PageShellProps {
  toolbar?: React.ReactNode;
  leftRail?: React.ReactNode;
  rightRail?: React.ReactNode;
  leftDock?: React.ReactNode;
  rightDock?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  contentClassName?: string;
}

export const PageShell: React.FC<PageShellProps> = ({
  toolbar,
  leftRail,
  rightRail,
  leftDock,
  rightDock,
  children,
  className = '',
  bodyClassName = '',
  contentClassName = '',
}) => {
  const workbenchHost = useContext(AppWorkbenchHostContext);
  const shouldRenderWorkbench = Boolean(workbenchHost?.hasPanel);

  return (
    <div className={`osint-page-shell ${className}`}>
      {toolbar}
      <div className={`osint-page-shell-body ${bodyClassName}`}>
        {shouldRenderWorkbench && workbenchHost?.placement === 'left' ? <AppWorkbenchHost /> : null}
        {leftDock}
        {leftRail}
        <div className={`osint-page-shell-content ${contentClassName}`}>{children}</div>
        {rightRail}
        {rightDock}
        {shouldRenderWorkbench && workbenchHost?.placement === 'right' ? <AppWorkbenchHost /> : null}
      </div>
    </div>
  );
};
