import { X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { IconButton } from '../controls/IconButton';
import { Eyebrow, Heading, Text } from '../typography';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface SidebarNavProps {
  brandIcon: ReactNode;
  brandEyebrow?: string;
  brandTitle: string;
  brandSubtitle?: string;
  brandPressLabel?: string;
  headerActions?: ReactNode;
  items: ReadonlyArray<SidebarNavItem>;
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
  const brandContent = (
    <>
      <div className="ds-sidebar-brand-icon">{brandIcon}</div>
      <div className="ds-sidebar-brand-copy">
        {brandEyebrow ? <Eyebrow as="div">{brandEyebrow}</Eyebrow> : null}
        <Heading level="inline" className="ds-sidebar-brand-title">
          {brandTitle}
        </Heading>
        {brandSubtitle ? (
          <Text className="ds-sidebar-brand-subtitle" variant="quiet">
            {brandSubtitle}
          </Text>
        ) : null}
      </div>
    </>
  );

  return (
    <aside className="ds-sidebar" data-collapsed={collapsed ? 'true' : 'false'} data-mobile-open={mobileOpen ? 'true' : 'false'}>
      <div className="ds-sidebar-brand ds-shell-header-surface">
        {onBrandPress ? (
          <button
            type="button"
            className="ds-sidebar-brand-trigger"
            aria-label={brandPressLabel ?? brandTitle}
            onClick={onBrandPress}
          >
            {brandContent}
          </button>
        ) : (
          <div className="ds-sidebar-brand-trigger" data-interactive="false">
            {brandContent}
          </div>
        )}
        {hasHeaderActions ? (
          <div className="ds-sidebar-brand-actions">
            {headerActions}
            {onCloseMobile ? (
              <IconButton
                appearance="ghost"
                className="ds-sidebar-close"
                label="Close navigation"
                icon={<X size={16} />}
                onClick={onCloseMobile}
              />
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
