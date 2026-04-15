import type { CSSProperties, ReactNode } from 'react';

export interface PageShellProps {
  sidebar: ReactNode;
  toolbar: ReactNode;
  children: ReactNode;
  leftRail?: ReactNode;
  rightRail?: ReactNode;
  leftRailPinnedOpen?: boolean;
  rightRailPinnedOpen?: boolean;
  overlayOpen?: boolean;
  onDismissOverlay?: () => void;
  floatingContent?: ReactNode;
}

export function PageShell({
  sidebar,
  toolbar,
  children,
  leftRail,
  rightRail,
  leftRailPinnedOpen = true,
  rightRailPinnedOpen = true,
  overlayOpen = false,
  onDismissOverlay,
  floatingContent,
}: PageShellProps) {
  const columnStyle = {
    '--ds-left-rail-size': leftRail
      ? leftRailPinnedOpen
        ? 'var(--ds-rail-width)'
        : '0px'
      : '0px',
    '--ds-right-rail-size': rightRail
      ? rightRailPinnedOpen
        ? 'var(--ds-rail-width)'
        : '0px'
      : '0px',
  } as CSSProperties;

  return (
    <div className="ds-app-shell">
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
          <div className="ds-shell-columns" style={columnStyle}>
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
