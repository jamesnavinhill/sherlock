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
