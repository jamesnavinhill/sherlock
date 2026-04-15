import { X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { Button, cx } from './controls';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarNavProps {
  brandIcon: ReactNode;
  brandEyebrow: string;
  brandTitle: string;
  brandSubtitle?: string;
  items: SidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  footer?: ReactNode;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function SidebarNav({
  brandIcon,
  brandEyebrow,
  brandTitle,
  brandSubtitle,
  items,
  activeId,
  onSelect,
  footer,
  mobileOpen = false,
  onCloseMobile,
}: SidebarNavProps) {
  return (
    <aside className="ds-sidebar" data-mobile-open={mobileOpen ? 'true' : 'false'}>
      <div className="ds-sidebar-brand">
        <div className="ds-sidebar-brand-row">
          <div className="ds-brand-mark">{brandIcon}</div>
          {onCloseMobile ? (
            <button
              type="button"
              className="ds-sidebar-close"
              aria-label="Close navigation"
              onClick={onCloseMobile}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
        <div>
          <div className="ds-meta-label">{brandEyebrow}</div>
          <div className="ds-title-inline">{brandTitle}</div>
          {brandSubtitle ? <p className="ds-body-quiet">{brandSubtitle}</p> : null}
        </div>
      </div>

      <nav className="ds-sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className="ds-sidebar-nav-item"
              data-active={activeId === item.id ? 'true' : undefined}
              onClick={() => {
                onSelect(item.id);
                onCloseMobile?.();
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {footer ? <div className="ds-sidebar-footer">{footer}</div> : null}
    </aside>
  );
}

export function ToolbarBar({
  leading,
  center,
  trailing,
}: {
  leading: ReactNode;
  center?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <header className="ds-toolbar">
      <div className="ds-toolbar-group">{leading}</div>
      <div className="ds-toolbar-search">{center}</div>
      <div className="ds-toolbar-group ds-toolbar-group-end">{trailing}</div>
    </header>
  );
}

export function ToolbarCluster({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx('ds-toolbar-inline', className)}>{children}</div>;
}

interface PanelRailProps {
  placement: 'left' | 'right';
  pinnedOpen: boolean;
  mobileOpen?: boolean;
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  onCloseMobile?: () => void;
}

export function PanelRail({
  placement,
  pinnedOpen,
  mobileOpen = false,
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  footer,
  className,
  onCloseMobile,
}: PanelRailProps) {
  return (
    <aside
      className={cx('ds-rail', placement === 'right' ? 'ds-right-rail' : 'ds-left-rail', className)}
      data-placement={placement}
      data-pinned-open={pinnedOpen ? 'true' : 'false'}
      data-mobile-open={mobileOpen ? 'true' : 'false'}
    >
      <div className="ds-rail-header">
        <div className="ds-rail-header-copy">
          <div className="ds-meta-label">{eyebrow}</div>
          <h2 className="ds-panel-title">{title}</h2>
          {subtitle ? <p className="ds-body-quiet">{subtitle}</p> : null}
        </div>
        <div className="ds-rail-header-actions">
          {actions}
          {onCloseMobile ? (
            <Button
              variant="ghost"
              size="sm"
              className="ds-rail-close"
              leadingIcon={<X size={14} />}
              onClick={onCloseMobile}
            >
              Close
            </Button>
          ) : null}
        </div>
      </div>
      <div className="ds-rail-body">{children}</div>
      {footer ? <div className="ds-rail-footer">{footer}</div> : null}
    </aside>
  );
}

interface PageShellProps {
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
