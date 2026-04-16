import type { CSSProperties, ReactNode } from 'react';

export interface PageShellProps {
  sidebar: ReactNode;
  toolbar: ReactNode;
  children: ReactNode;
  leftRail?: ReactNode;
  rightRail?: ReactNode;
  leftUtility?: ReactNode;
  rightUtility?: ReactNode;
  sidebarCollapsed?: boolean;
  leftRailPinnedOpen?: boolean;
  rightRailPinnedOpen?: boolean;
  leftUtilityOpen?: boolean;
  rightUtilityOpen?: boolean;
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
  leftUtility,
  rightUtility,
  sidebarCollapsed = false,
  leftRailPinnedOpen = false,
  rightRailPinnedOpen = false,
  leftUtilityOpen = false,
  rightUtilityOpen = false,
  overlayOpen = false,
  onDismissOverlay,
  toolbarOffset,
}: PageShellProps) {
  const railPanelWidth = 'clamp(18rem, 22vw, var(--ds-rail-width))';
  const utilityPanelWidth = 'clamp(20rem, 26vw, var(--ds-utility-width))';

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
    '--ds-utility-panel-width': utilityPanelWidth,
    '--ds-left-utility-size': leftUtility
      ? leftUtilityOpen
        ? utilityPanelWidth
        : '0px'
      : '0px',
    '--ds-right-utility-size': rightUtility
      ? rightUtilityOpen
        ? utilityPanelWidth
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
            <div className="ds-shell-slot ds-shell-slot-left-utility">{leftUtility}</div>
            <div className="ds-shell-slot ds-shell-slot-left-rail">{leftRail}</div>
            <main className="ds-content ds-shell-slot-content">{children}</main>
            <div className="ds-shell-slot ds-shell-slot-right-rail">{rightRail}</div>
            <div className="ds-shell-slot ds-shell-slot-right-utility">{rightUtility}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
