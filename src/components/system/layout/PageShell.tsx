import React from 'react';

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
}) => (
  <div className={`osint-page-shell ${className}`}>
    {toolbar}
    <div className={`osint-page-shell-body ${bodyClassName}`}>
      {leftDock}
      {leftRail}
      <div className={`osint-page-shell-content ${contentClassName}`}>{children}</div>
      {rightRail}
      {rightDock}
    </div>
  </div>
);
