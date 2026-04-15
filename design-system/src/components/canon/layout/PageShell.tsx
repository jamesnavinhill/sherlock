import type { CSSProperties, ReactNode } from 'react';

export interface PageShellProps {
  sidebar: ReactNode;
  toolbar: ReactNode;
  children: ReactNode;
  leftRail?: ReactNode;
  rightRail?: ReactNode;
  sidebarCollapsed?: boolean;
  leftRailPinnedOpen?: boolean;
  rightRailPinnedOpen?: boolean;
  overlayOpen?: boolean;
  onDismissOverlay?: () => void;
  floatingContent?: ReactNode;
  toolbarOffset?: number;
}

export function PageShell({
  sidebar,
  toolbar,
  children,
  leftRail,
  rightRail,
  sidebarCollapsed = false,
  leftRailPinnedOpen = false,
  rightRailPinnedOpen = false,
  overlayOpen = false,
  onDismissOverlay,
  floatingContent,
  toolbarOffset,
}: PageShellProps) {
  const shellStyle = {
    '--ds-sidebar-size': sidebar
      ? sidebarCollapsed
        ? 'var(--ds-sidebar-collapsed-width)'
        : 'clamp(14rem, 18vw, var(--ds-sidebar-width))'
      : '0px',
    '--ds-left-rail-size': leftRail
      ? leftRailPinnedOpen
        ? 'clamp(18rem, 22vw, var(--ds-rail-width))'
        : '0px'
      : '0px',
    '--ds-right-rail-size': rightRail
      ? rightRailPinnedOpen
        ? 'clamp(18rem, 22vw, var(--ds-rail-width))'
        : '0px'
      : '0px',
    '--ds-toolbar-offset': toolbarOffset ? `${toolbarOffset}px` : undefined,
  } as CSSProperties;

  return (
    <div className="ds-app-shell" style={shellStyle}>
      {overlayOpen ? (
        <button
          type="button"
          className="ds-shell-backdrop"
          aria-label="Dismiss open panels"
          onClick={onDismissOverlay}
        />
      ) : null}
      <div className="ds-shell-layout">
        {sidebar}
        <div className="ds-shell-main">
          {toolbar}
          <div className="ds-shell-columns">
            {leftRail}
            <main className="ds-content">{children}</main>
            {rightRail}
          </div>
        </div>
        {floatingContent}
      </div>
    </div>
  );
}
