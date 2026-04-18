import React from 'react';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const COMPACT_MENU_PANEL_CLASS =
  'osint-menu-panel overflow-hidden border border-[color:var(--osint-shell-border)] bg-[color:var(--osint-shell-panel-bg)]';

export const COMPACT_MENU_HEADER_CLASS =
  'bg-[color:var(--osint-shell-panel-action-bg)] px-3 py-1.5 osint-menu-section-label';

export const COMPACT_MENU_HEADER_DIVIDER_CLASS =
  'border-b border-[color:var(--osint-shell-border)]';

export const COMPACT_MENU_SECTION_DIVIDER_CLASS =
  'border-t border-[color:var(--osint-shell-border)]';

export const COMPACT_MENU_ITEM_CLASS =
  'osint-menu-item flex w-full items-center px-4 py-3 text-left osint-body-small text-[color:var(--osint-text-strong)]';

export const COMPACT_MENU_ITEM_DIVIDER_CLASS =
  'border-b border-[color:var(--osint-shell-border)]';

export const COMPACT_MENU_ICON_CLASS =
  'osint-menu-item-icon mr-3 h-4 w-4 text-[color:var(--osint-text-meta)]';

export const COMPACT_MENU_FOOTER_CLASS =
  'flex items-center justify-between gap-3 border-t border-[color:var(--osint-shell-border)] bg-[color:var(--osint-shell-panel-action-bg)] px-4 py-3';

interface CompactMenuPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CompactMenuPanel = React.forwardRef<HTMLDivElement, CompactMenuPanelProps>(
  ({ children, className, ...rest }, ref) => (
    <div ref={ref} className={cx(COMPACT_MENU_PANEL_CLASS, className)} {...rest}>
      {children}
    </div>
  )
);

CompactMenuPanel.displayName = 'CompactMenuPanel';

interface CompactMenuHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  separated?: boolean;
}

export const CompactMenuHeader: React.FC<CompactMenuHeaderProps> = ({
  children,
  className,
  separated = false,
  ...rest
}) => (
  <div
    className={cx(
      COMPACT_MENU_HEADER_CLASS,
      separated
        ? `${COMPACT_MENU_SECTION_DIVIDER_CLASS} ${COMPACT_MENU_HEADER_DIVIDER_CLASS}`
        : COMPACT_MENU_HEADER_DIVIDER_CLASS,
      className
    )}
    {...rest}
  >
    {children}
  </div>
);

interface CompactMenuBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CompactMenuBody: React.FC<CompactMenuBodyProps> = ({
  children,
  className,
  ...rest
}) => (
  <div className={cx('p-4', className)} {...rest}>
    {children}
  </div>
);

interface CompactMenuFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CompactMenuFooter: React.FC<CompactMenuFooterProps> = ({
  children,
  className,
  ...rest
}) => (
  <div className={cx(COMPACT_MENU_FOOTER_CLASS, className)} {...rest}>
    {children}
  </div>
);
