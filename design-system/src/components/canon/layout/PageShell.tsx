import type { CSSProperties, ReactNode } from 'react';

export interface PageShellProps {
  sidebar: ReactNode;
  toolbar: ReactNode;
  children: ReactNode;
  leftRail?: ReactNode;
  rightRail?: ReactNode;
  workbench?: ReactNode;
  sidebarCollapsed?: boolean;
  leftRailPinnedOpen?: boolean;
  rightRailPinnedOpen?: boolean;
  overlayOpen?: boolean;
  onDismissOverlay?: () => void;
  toolbarOffset?: number;
}

export function PageShell({
  sidebar,
  toolbar,
  children,
  leftRail,
  rightRail,
  workbench,
  sidebarCollapsed = false,
  leftRailPinnedOpen = false,
  rightRailPinnedOpen = false,
  overlayOpen = false,
  onDismissOverlay,
  toolbarOffset,
}: PageShellProps) {
  const railPanelWidth = 'clamp(18rem, 22vw, var(--ds-rail-width))';

  const shellStyle = {
    '--ds-sidebar-size': sidebar
      ? sidebarCollapsed
        ? 'var(--ds-sidebar-collapsed-width)'
        : 'clamp(14rem, 18vw, var(--ds-sidebar-width))'
      : '0px',
    '--ds-rail-panel-width': railPanelWidth,
    '--ds-left-rail-size': leftRail
      ? leftRailPinnedOpen
        ? railPanelWidth
        : '0px'
      : '0px',
    '--ds-right-rail-size': rightRail
      ? rightRailPinnedOpen
        ? railPanelWidth
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
        {workbench}
      </div>
    </div>
  );
}
