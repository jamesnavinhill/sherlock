import { X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface SidebarNavProps {
  brandIcon: ReactNode;
  brandEyebrow: string;
  brandTitle: string;
  brandSubtitle?: string;
  brandPressLabel?: string;
  headerActions?: ReactNode;
  items: SidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onBrandPress?: () => void;
  footer?: ReactNode;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function SidebarNav({
  brandIcon,
  brandEyebrow,
  brandTitle,
  brandSubtitle,
  brandPressLabel,
  headerActions,
  items,
  activeId,
  onSelect,
  onBrandPress,
  footer,
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
}: SidebarNavProps) {
  const hasHeaderActions = Boolean(headerActions) || Boolean(onCloseMobile);

  return (
    <aside
      className="ds-sidebar"
      data-collapsed={collapsed ? 'true' : 'false'}
      data-mobile-open={mobileOpen ? 'true' : 'false'}
    >
      <div className="ds-sidebar-brand">
        {onBrandPress ? (
          <button
            type="button"
            className="ds-brand-mark ds-brand-mark-button"
            aria-label={brandPressLabel || brandTitle}
            onClick={onBrandPress}
          >
            {brandIcon}
          </button>
        ) : (
          <div className="ds-brand-mark">{brandIcon}</div>
        )}
        <div className="ds-sidebar-brand-copy">
          <div className="ds-meta-label">{brandEyebrow}</div>
          <div className="ds-title-inline ds-sidebar-brand-title">{brandTitle}</div>
          {brandSubtitle ? (
            <p className="ds-body-quiet ds-sidebar-brand-subtitle">{brandSubtitle}</p>
          ) : null}
        </div>
        {hasHeaderActions ? (
          <div className="ds-sidebar-brand-actions">
            {headerActions}
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
        ) : null}
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
              <span className="ds-sidebar-nav-item-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {footer ? <div className="ds-sidebar-footer">{footer}</div> : null}
    </aside>
  );
}
